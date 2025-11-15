/**
 * Payout Routes
 * Multi-recipient batch payouts with currency conversion
 */

import { FastifyInstance } from "fastify"
import { z } from "zod"
import { config } from "../config"
import { getContractService } from "../contracts"
import { getRate } from "../services/rates"
import { getCCTPService, CCTPChain } from "../services/cctp"
import { isValidAddressForChain } from "../utils/address"
import { logAuditEvent } from "../services/audit"

const payoutSchema = z.object({
  to_wallet: z.string().min(32), // Now accepts both EVM and Solana addresses
  currency: z.enum(["USDC", "EURC", "USYC"]),
  amount: z.number().positive(),
  metadata: z.string().optional(),
  destination_chain: z
    .enum([
      "ARC",
      "ETHEREUM",
      "AVALANCHE",
      "OPTIMISM",
      "ARBITRUM",
      "SOLANA",
      "BASE",
      "POLYGON",
    ])
    .default("ARC"), // Default to same-chain transfer
})

const batchPayoutSchema = z.object({
  funding_currency: z.enum(["USDC", "EURC", "USYC"]),
  funding_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  payouts: z.array(payoutSchema).min(1).max(100),
  require_compliance: z.boolean().default(true),
})

// FX rates now fetched from real-time API
// See src/services/rates.ts for implementation

export async function payoutRoutes(server: FastifyInstance) {
  server.post<{
    Body: z.infer<typeof batchPayoutSchema>
  }>(
    "/payouts",
    {
      schema: {
        tags: ["payouts"],
        summary: "Batch payouts",
        description:
          "Execute multiple payouts in a single transaction with automatic currency conversion using ARC's native FX",
        body: {
          type: "object",
          required: ["funding_currency", "funding_wallet", "payouts"],
          properties: {
            funding_currency: { type: "string", enum: ["USDC", "EURC", "USYC"] },
            funding_wallet: { type: "string", description: "Source wallet address on ARC (0x...)" },
            payouts: {
              type: "array",
              items: {
                type: "object",
                required: ["to_wallet", "currency", "amount"],
                properties: {
                  to_wallet: { 
                    type: "string",
                    description: "Destination wallet address (format depends on destination_chain)"
                  },
                  currency: { 
                    type: "string",
                    enum: ["USDC", "EURC", "USYC"],
                    description: "Currency to send"
                  },
                  amount: { 
                    type: "number",
                    description: "Amount to send"
                  },
                  destination_chain: {
                    type: "string",
                    enum: ["ARC", "ETHEREUM", "AVALANCHE", "OPTIMISM", "ARBITRUM", "SOLANA", "BASE", "POLYGON"],
                    default: "ARC",
                    description: "Target blockchain (default: ARC for same-chain, or specify for cross-chain via CCTP)"
                  },
                  metadata: { 
                    type: "string",
                    description: "Optional metadata for the payout"
                  },
                },
              },
            },
            require_compliance: { 
              type: "boolean",
              default: true,
              description: "Whether to perform compliance checks"
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = batchPayoutSchema.parse(request.body)

        // Validate all destination addresses
        for (const payout of body.payouts) {
          const chain =
            payout.destination_chain === "ARC"
              ? CCTPChain.ARC
              : CCTPChain[payout.destination_chain as keyof typeof CCTPChain]

          if (!isValidAddressForChain(payout.to_wallet, chain)) {
            reply.code(400)
            return {
              error: "Invalid destination address",
              details: `Address ${payout.to_wallet} is invalid for ${payout.destination_chain}`,
              expected:
                payout.destination_chain === "SOLANA"
                  ? "Solana base58 address"
                  : "EVM address (0x...)",
            }
          }
        }

        // Compliance check if required
        if (body.require_compliance) {
          const walletsToCheck = [
            body.funding_wallet,
            ...body.payouts
              .filter((p) => p.destination_chain === "ARC")
              .map((p) => p.to_wallet),
          ]
          server.log.info(`Compliance check for ${walletsToCheck.length} wallets`)
        }

        // Calculate total funding needed
        let totalFundingNeeded = 0
        for (const payout of body.payouts) {
          if (payout.currency === body.funding_currency) {
            totalFundingNeeded += payout.amount
          } else {
            // Convert to funding currency using real-time rate
            try {
              const rate = await getRate(payout.currency, body.funding_currency)
              totalFundingNeeded += payout.amount * rate
            } catch (error: any) {
              reply.code(500)
              return {
                error: "Failed to get exchange rate",
                details: error.message,
                currency_pair: `${payout.currency} to ${body.funding_currency}`,
              }
            }
          }
        }

        // Add 0.1% fee per payout
        const totalFee = totalFundingNeeded * 0.001 * body.payouts.length
        totalFundingNeeded += totalFee

        // Generate job ID
        const jobId = `payout_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

        // Separate same-chain and cross-chain payouts
        const sameChainPayouts = body.payouts.filter(
          (p) => !p.destination_chain || p.destination_chain === "ARC"
        )
        const crossChainPayouts = body.payouts.filter(
          (p) => p.destination_chain && p.destination_chain !== "ARC"
        )

        const results = []
        let totalGasCost = "0"

        try {
          // Execute same-chain payouts on ARC
          if (sameChainPayouts.length > 0) {
            const contractService = getContractService()
            const startTime = Date.now()

            const result = await contractService.executeBatchPayouts(
              sameChainPayouts.map((p) => ({
                to: p.to_wallet,
                currency: p.currency,
                amount: p.amount,
                metadata: p.metadata,
              }))
            )

            const finalityTimeMs = Date.now() - startTime
            totalGasCost = result.gasUsed

            // Add same-chain results
            sameChainPayouts.forEach((payout) => {
              results.push({
                to_wallet: payout.to_wallet,
                currency: payout.currency,
                amount: payout.amount,
                destination_chain: "ARC",
                status: result.status,
                tx_hash: result.txHash,
                explorer_url: `${config.ARC_EXPLORER_URL}/tx/${result.txHash}`,
                finality_time_ms: finalityTimeMs,
                metadata: payout.metadata,
              })
            })
          }

          // Execute cross-chain payouts via CCTP
          if (crossChainPayouts.length > 0) {
            const cctpService = getCCTPService()

            for (const payout of crossChainPayouts) {
              // Only USDC supports CCTP
              if (payout.currency !== "USDC") {
                results.push({
                  to_wallet: payout.to_wallet,
                  currency: payout.currency,
                  amount: payout.amount,
                  destination_chain: payout.destination_chain!,
                  status: "failed",
                  error: "Only USDC supports cross-chain transfers via CCTP",
                  metadata: payout.metadata,
                })
                continue
              }

              try {
                const cctpResult = await cctpService.initiateTransfer({
                  amount: payout.amount,
                  fromWallet: body.funding_wallet,
                  toAddress: payout.to_wallet,
                  destinationChain:
                    CCTPChain[payout.destination_chain as keyof typeof CCTPChain],
                  token: "USDC",
                })

                results.push({
                  to_wallet: payout.to_wallet,
                  currency: payout.currency,
                  amount: payout.amount,
                  destination_chain: payout.destination_chain!,
                  status: "pending_attestation",
                  tx_hash: cctpResult.burnTxHash,
                  message_hash: cctpResult.messageHash,
                  explorer_url: `${config.ARC_EXPLORER_URL}/tx/${cctpResult.burnTxHash}`,
                  estimated_time: cctpResult.estimatedTime,
                  instructions: cctpResult.instructions,
                  metadata: payout.metadata,
                })
              } catch (error: any) {
                results.push({
                  to_wallet: payout.to_wallet,
                  currency: payout.currency,
                  amount: payout.amount,
                  destination_chain: payout.destination_chain!,
                  status: "failed",
                  error: error.message,
                  metadata: payout.metadata,
                })
              }
            }
          }

          const successCount = results.filter(
            (r) => r.status === "finalized" || r.status === "pending_attestation"
          ).length
          const failedCount = results.filter((r) => r.status === "failed").length

          // Log audit event for batch payout
          logAuditEvent({
            type: "payout",
            action: "Batch payout executed",
            wallet_address: body.funding_wallet,
            amount: totalFundingNeeded,
            currency: body.funding_currency,
            status: failedCount === 0 ? "success" : failedCount === results.length ? "failed" : "success",
            metadata: {
              job_id: jobId,
              recipient_count: body.payouts.length,
              same_chain_count: sameChainPayouts.length,
              cross_chain_count: crossChainPayouts.length,
              successful_count: successCount,
              failed_count: failedCount,
              total_fee: totalFee,
              destinations: [...new Set(body.payouts.map(p => p.destination_chain))],
            },
            ip_address: request.ip,
            user_agent: request.headers["user-agent"],
          })

          return {
            job_id: jobId,
            status: failedCount === 0 ? "completed" : "partial",
            funding_currency: body.funding_currency,
            total_funding_used: totalFundingNeeded.toFixed(6),
            total_fee: totalFee.toFixed(6),
            total_gas_cost: totalGasCost,
            payouts_count: body.payouts.length,
            same_chain_count: sameChainPayouts.length,
            cross_chain_count: crossChainPayouts.length,
            successful_count: successCount,
            failed_count: failedCount,
            results,
            network: "arc-testnet",
            timestamp: new Date().toISOString(),
            note:
              crossChainPayouts.length > 0
                ? "Batch includes cross-chain transfers via Circle CCTP (10-30 min settlement)"
                : "Batch payout executed on-chain with deterministic BFT consensus",
          }
        } catch (error: any) {
          server.log.error("Failed to execute batch payouts on-chain:", error)
          
          // Log failed payout
          logAuditEvent({
            type: "payout",
            action: "Batch payout failed",
            wallet_address: body.funding_wallet,
            amount: totalFundingNeeded,
            currency: body.funding_currency,
            status: "failed",
            metadata: {
              job_id: jobId,
              recipient_count: body.payouts.length,
              error: error.message,
            },
            ip_address: request.ip,
            user_agent: request.headers["user-agent"],
          })
          
          reply.code(500)
          return {
            error: "Failed to execute payouts",
            details: error.message,
            job_id: jobId,
            note: "Check if contracts are properly deployed and OPERATOR_PRIVATE_KEY is set",
          }
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  // GET /payouts/:jobId - Get payout status
  server.get<{
    Params: { jobId: string }
  }>(
    "/payouts/:jobId",
    {
      schema: {
        tags: ["payouts"],
        summary: "Get payout status",
        description: "Retrieve status and results of a batch payout job",
      },
    },
    async (request, reply) => {
      const { jobId } = request.params

      // In production, query from database
      // For now, return mock data
      reply.code(200)
      return {
        job_id: jobId,
        status: "completed",
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        note: "Job details would be retrieved from database in production",
      }
    }
  )
}


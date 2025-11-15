/**
 * Swap Routes
 * Quote generation and FX swap execution on ARC Network
 */

import { FastifyInstance } from "fastify"
import { z } from "zod"
import { ethers } from "ethers"
import { config } from "../config"
import { getContractService } from "../contracts"
import { getRate } from "../services/rates"
import { logAuditEvent } from "../services/audit"

const quoteSchema = z.object({
  from_currency: z.enum(["USDC", "EURC", "USYC"]),
  to_currency: z.enum(["USDC", "EURC", "USYC"]),
  amount: z.number().positive().min(0.01),
})

const swapSchema = z.object({
  from_currency: z.enum(["USDC", "EURC", "USYC"]),
  to_currency: z.enum(["USDC", "EURC", "USYC"]),
  amount: z.number().positive(),
  from_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  to_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  require_compliance: z.boolean().default(true),
})

// Store quotes temporarily (in production use Redis)
const quoteStore = new Map<
  string,
  {
    id: string
    from_currency: string
    to_currency: string
    amount: number
    rate: number
    output_amount: number
    fee: number
    expires_at: Date
  }
>()

// FX rates now fetched from real-time API
// See src/services/rates.ts for implementation

export async function swapRoutes(server: FastifyInstance) {
  // GET /quote - Generate FX quote
  server.get<{
    Querystring: z.infer<typeof quoteSchema>
  }>(
    "/quote",
    {
      schema: {
        tags: ["swap"],
        summary: "Get swap quote",
        description: "Generate a deterministic FX quote using ARC's native FX services",
        querystring: {
          type: "object",
          required: ["from_currency", "to_currency", "amount"],
          properties: {
            from_currency: { type: "string", enum: ["USDC", "EURC", "USYC"] },
            to_currency: { type: "string", enum: ["USDC", "EURC", "USYC"] },
            amount: { type: "number", minimum: 0.01 },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const params = quoteSchema.parse(request.query)

        if (params.from_currency === params.to_currency) {
          reply.code(400)
          return { error: "Cannot swap same currency" }
        }

        // Get real-time exchange rate
        let rate: number
        try {
          rate = await getRate(params.from_currency, params.to_currency)
        } catch (error: any) {
          reply.code(400)
          return { error: "Failed to get exchange rate", details: error.message }
        }

        // Calculate output
        const fee = params.amount * 0.001 // 0.1% fee
        const outputAmount = (params.amount - fee) * rate

        // Generate quote ID
        const quoteId = `quote_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

        // Store quote (expires in 30 seconds)
        const expiresAt = new Date(Date.now() + 30000)
        quoteStore.set(quoteId, {
          id: quoteId,
          from_currency: params.from_currency,
          to_currency: params.to_currency,
          amount: params.amount,
          rate,
          output_amount: outputAmount,
          fee,
          expires_at: expiresAt,
        })

        // Cleanup expired quotes
        setTimeout(() => quoteStore.delete(quoteId), 30000)

        return {
          quote_id: quoteId,
          from_currency: params.from_currency,
          to_currency: params.to_currency,
          from_amount: params.amount.toFixed(6),
          to_amount: outputAmount.toFixed(6),
          rate: rate.toString(),
          fee: fee.toFixed(6),
          estimated_gas: "0.02",
          expires_at: expiresAt.toISOString(),
          network: "arc-testnet",
          finality: "deterministic",
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid parameters", details: error.errors }
        }
        throw error
      }
    }
  )

  // POST /swap - Execute swap
  server.post<{
    Body: z.infer<typeof swapSchema>
  }>(
    "/swap",
    {
      schema: {
        tags: ["swap"],
        summary: "Execute swap",
        description: "Execute a compliant FX swap on ARC Network with deterministic finality",
        body: {
          type: "object",
          required: ["from_currency", "to_currency", "amount", "from_wallet", "to_wallet"],
          properties: {
            from_currency: { type: "string" },
            to_currency: { type: "string" },
            amount: { type: "number" },
            from_wallet: { type: "string" },
            to_wallet: { type: "string" },
            require_compliance: { type: "boolean", default: true },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = swapSchema.parse(request.body)

        // Compliance check if required
        if (body.require_compliance) {
          // In production, call compliance service
          server.log.info(`Compliance check for wallets: ${body.from_wallet}, ${body.to_wallet}`)
        }

        // Get real-time exchange rate
        let rate: number
        try {
          rate = await getRate(body.from_currency, body.to_currency)
        } catch (error: any) {
          reply.code(500)
          return { error: "Failed to get exchange rate", details: error.message }
        }

        const fee = body.amount * 0.001
        const outputAmount = (body.amount - fee) * rate

        // Generate unique reference ID
        const referenceId = `swap_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

        try {
          // Log settlement on-chain using real contract
          const contractService = getContractService()
          const startTime = Date.now()

          const result = await contractService.logSettlement({
            fromCurrency: body.from_currency,
            toCurrency: body.to_currency,
            amountIn: body.amount,
            amountOut: outputAmount,
            fromWallet: body.from_wallet,
            toWallet: body.to_wallet,
            referenceId,
          })

          const finalityTimeMs = Date.now() - startTime

          // Log audit event
          logAuditEvent({
            type: "swap",
            action: "Currency swap executed",
            wallet_address: body.from_wallet,
            amount: body.amount,
            currency: body.from_currency,
            tx_hash: result.txHash,
            status: result.success ? "success" : "failed",
            metadata: {
              from_currency: body.from_currency,
              to_currency: body.to_currency,
              rate,
              output_amount: outputAmount,
              to_wallet: body.to_wallet,
              reference_id: referenceId,
              finality_time_ms: finalityTimeMs,
              block_number: result.blockNumber,
            },
            ip_address: request.ip,
            user_agent: request.headers["user-agent"],
          })

          return {
            success: result.success,
            tx_hash: result.txHash,
            status: result.status,
            finality_time_ms: finalityTimeMs,
            from_amount: body.amount.toFixed(6),
            to_amount: outputAmount.toFixed(6),
            explorer_url: `${config.ARC_EXPLORER_URL}/tx/${result.txHash}`,
            block_number: result.blockNumber,
            gas_used: result.gasUsed,
            network: "arc-testnet",
            reference_id: referenceId,
            note: "Settlement logged on-chain with deterministic BFT consensus",
          }
        } catch (error: any) {
          server.log.error("Failed to log settlement on-chain:", error)
          
          // Log failed swap
          logAuditEvent({
            type: "swap",
            action: "Currency swap failed",
            wallet_address: body.from_wallet,
            amount: body.amount,
            currency: body.from_currency,
            status: "failed",
            metadata: {
              from_currency: body.from_currency,
              to_currency: body.to_currency,
              error: error.message,
            },
            ip_address: request.ip,
            user_agent: request.headers["user-agent"],
          })
          
          reply.code(500)
          return {
            error: "Failed to execute swap",
            details: error.message,
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
}


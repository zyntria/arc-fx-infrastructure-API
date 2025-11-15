/**
 * CCTP Routes
 * Cross-Chain Transfer Protocol endpoints for bridging USDC
 */

import { FastifyInstance } from "fastify"
import { z } from "zod"
import { getCCTPService, CCTPChain } from "../services/cctp"
import { isValidAddressForChain } from "../utils/address"

// Schema for cross-chain transfer request
const cctpTransferSchema = z.object({
  amount: z.number().positive().min(1),
  from_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  to_address: z.string().min(32), // Can be EVM or Solana address
  destination_chain: z.enum([
    "ETHEREUM",
    "AVALANCHE",
    "OPTIMISM",
    "ARBITRUM",
    "SOLANA",
    "BASE",
    "POLYGON",
  ]),
  token: z.enum(["USDC"]).default("USDC"),
})

export async function cctpRoutes(server: FastifyInstance) {
  // POST /cctp/transfer - Initiate cross-chain transfer
  server.post<{
    Body: z.infer<typeof cctpTransferSchema>
  }>(
    "/cctp/transfer",
    {
      schema: {
        tags: ["cctp"],
        summary: "Initiate cross-chain USDC transfer",
        description:
          "Transfer USDC from ARC to other chains (Ethereum, Solana, etc.) using Circle CCTP",
        body: {
          type: "object",
          required: ["amount", "from_wallet", "to_address", "destination_chain"],
          properties: {
            amount: {
              type: "number",
              minimum: 1,
              description: "Amount of USDC to transfer",
            },
            from_wallet: {
              type: "string",
              description: "Source wallet address on ARC (0x...)",
            },
            to_address: {
              type: "string",
              description:
                "Destination address (format depends on destination chain)",
            },
            destination_chain: {
              type: "string",
              enum: [
                "ETHEREUM",
                "AVALANCHE",
                "OPTIMISM",
                "ARBITRUM",
                "SOLANA",
                "BASE",
                "POLYGON",
              ],
              description: "Target blockchain",
            },
            token: {
              type: "string",
              enum: ["USDC"],
              default: "USDC",
              description: "Token to transfer (currently only USDC)",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              burnTxHash: { type: "string" },
              messageHash: { type: "string" },
              nonce: { type: "string" },
              destinationChain: { type: "string" },
              estimatedTime: { type: "string" },
              status: { type: "string" },
              instructions: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = cctpTransferSchema.parse(request.body)

        // Validate destination address format
        const destinationChain = CCTPChain[body.destination_chain]
        if (!isValidAddressForChain(body.to_address, destinationChain)) {
          reply.code(400)
          return {
            error: "Invalid destination address",
            details: `Address format invalid for ${body.destination_chain}`,
            expected:
              destinationChain === CCTPChain.SOLANA
                ? "Solana base58 address (32-44 chars)"
                : "EVM address (0x + 40 hex chars)",
          }
        }

        // Initiate CCTP transfer
        const cctpService = getCCTPService()
        const result = await cctpService.initiateTransfer({
          amount: body.amount,
          fromWallet: body.from_wallet,
          toAddress: body.to_address,
          destinationChain,
          token: body.token,
        })

        return result
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }

        server.log.error("CCTP transfer failed:", error)
        reply.code(500)
        return {
          error: "Cross-chain transfer failed",
          details: error.message,
        }
      }
    }
  )

  // GET /cctp/status/:messageHash - Check transfer status
  server.get<{
    Params: { messageHash: string }
  }>(
    "/cctp/status/:messageHash",
    {
      schema: {
        tags: ["cctp"],
        summary: "Check CCTP transfer status",
        description:
          "Get the current status and attestation for a cross-chain transfer",
        params: {
          type: "object",
          required: ["messageHash"],
          properties: {
            messageHash: {
              type: "string",
              description: "CCTP message hash from transfer initiation",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              attestation: { type: "string" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { messageHash } = request.params

        const cctpService = getCCTPService()
        const status = await cctpService.getTransferStatus(messageHash)

        if (status.status === "attested") {
          return {
            ...status,
            message:
              "Attestation received! You can now mint tokens on the destination chain.",
          }
        }

        return {
          ...status,
          message:
            "Waiting for Circle attestation. This typically takes 10-30 minutes.",
        }
      } catch (error: any) {
        server.log.error("Failed to check CCTP status:", error)
        reply.code(500)
        return {
          error: "Failed to check transfer status",
          details: error.message,
        }
      }
    }
  )

  // POST /cctp/complete - Complete a cross-chain transfer
  server.post<{
    Body: { burnTxHash: string; destinationChain: string }
  }>(
    "/cctp/complete",
    {
      schema: {
        tags: ["cctp"],
        summary: "Complete cross-chain transfer",
        description:
          "Complete the minting on destination chain for a pending CCTP transfer. Anyone can call this!",
        body: {
          type: "object",
          required: ["burnTxHash", "destinationChain"],
          properties: {
            burnTxHash: {
              type: "string",
              description: "The transaction hash from the burn on ARC",
            },
            destinationChain: {
              type: "string",
              enum: [
                "ETHEREUM",
                "AVALANCHE",
                "OPTIMISM",
                "ARBITRUM",
                "BASE",
                "POLYGON",
              ],
              description: "Destination blockchain",
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              mintTxHash: { type: "string" },
              message: { type: "string" },
              error: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { burnTxHash, destinationChain } = request.body

        const cctpService = getCCTPService()
        const result = await cctpService.completeTransfer({
          burnTxHash,
          destinationChain: CCTPChain[destinationChain as keyof typeof CCTPChain],
        })

        if (!result.success) {
          reply.code(400)
        }

        return result
      } catch (error: any) {
        server.log.error("Failed to complete CCTP transfer:", error)
        reply.code(500)
        return {
          success: false,
          message: "Failed to complete transfer",
          error: error.message,
        }
      }
    }
  )

  // GET /cctp/supported-chains - List supported destination chains
  server.get(
    "/cctp/supported-chains",
    {
      schema: {
        tags: ["cctp"],
        summary: "List supported CCTP chains",
        description: "Get list of all chains supported for cross-chain transfers",
        response: {
          200: {
            type: "object",
            properties: {
              chains: { type: "array" },
              total: { type: "number" },
            },
          },
        },
      },
    },
    async () => {
      const chains = [
        {
          name: "Ethereum",
          chain: "ETHEREUM",
          addressFormat: "EVM (0x...)",
          estimatedTime: "10-30 minutes",
        },
        {
          name: "Avalanche",
          chain: "AVALANCHE",
          addressFormat: "EVM (0x...)",
          estimatedTime: "10-30 minutes",
        },
        {
          name: "Optimism",
          chain: "OPTIMISM",
          addressFormat: "EVM (0x...)",
          estimatedTime: "10-30 minutes",
        },
        {
          name: "Arbitrum",
          chain: "ARBITRUM",
          addressFormat: "EVM (0x...)",
          estimatedTime: "10-30 minutes",
        },
        {
          name: "Solana",
          chain: "SOLANA",
          addressFormat: "Base58 (32-44 chars)",
          estimatedTime: "10-30 minutes",
        },
        {
          name: "Base",
          chain: "BASE",
          addressFormat: "EVM (0x...)",
          estimatedTime: "10-30 minutes",
        },
        {
          name: "Polygon",
          chain: "POLYGON",
          addressFormat: "EVM (0x...)",
          estimatedTime: "10-30 minutes",
        },
      ]

      return {
        chains,
        total: chains.length,
        note: "All chains support USDC transfers via Circle CCTP",
      }
    }
  )
}


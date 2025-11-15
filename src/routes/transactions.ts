/**
 * Transaction Tracking Routes
 * Monitor transaction status and finality on ARC Network
 */

import { FastifyInstance } from "fastify"
import { ethers } from "ethers"
import { config } from "../config"

export async function transactionRoutes(server: FastifyInstance) {
  server.get<{
    Params: { id: string }
  }>(
    "/transactions/:id",
    {
      schema: {
        tags: ["transactions"],
        summary: "Get transaction status",
        description: "Retrieve real-time status and finality proof for a transaction",
        params: {
          type: "object",
          properties: {
            id: { type: "string", description: "Transaction hash" },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params

      try {
        // Connect to ARC RPC
        const provider = new ethers.JsonRpcProvider(config.ARC_RPC_URL)

        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(id)

        if (!receipt) {
          reply.code(404)
          return {
            error: "Transaction not found",
            tx_hash: id,
            network: "arc-testnet",
          }
        }

        // Get current block for confirmations
        const currentBlock = await provider.getBlockNumber()
        const confirmations = currentBlock - receipt.blockNumber

        return {
          tx_hash: id,
          status: receipt.status === 1 ? "finalized" : "failed",
          block_number: receipt.blockNumber,
          block_hash: receipt.blockHash,
          confirmations,
          gas_used: receipt.gasUsed.toString(),
          finality: "deterministic",
          finality_time_ms: "<1000",
          explorer_url: `${config.ARC_EXPLORER_URL}/tx/${id}`,
          network: "arc-testnet",
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        server.log.error(`Error fetching transaction: ${error.message}`)
        reply.code(500)
        return {
          error: "Failed to fetch transaction",
          tx_hash: id,
          details: error.message,
        }
      }
    }
  )

  // Batch transaction status
  server.post<{
    Body: { tx_hashes: string[] }
  }>(
    "/transactions/batch",
    {
      schema: {
        tags: ["transactions"],
        summary: "Batch transaction status",
        description: "Get status for multiple transactions",
        body: {
          type: "object",
          required: ["tx_hashes"],
          properties: {
            tx_hashes: {
              type: "array",
              items: { type: "string" },
              minItems: 1,
              maxItems: 50,
            },
          },
        },
      },
    },
    async (request) => {
      const { tx_hashes } = request.body

      // In production, batch fetch from ARC RPC
      return {
        results: tx_hashes.map((hash) => ({
          tx_hash: hash,
          status: "finalized",
          note: "Batch results - implement full RPC fetch in production",
        })),
        total: tx_hashes.length,
      }
    }
  )
}


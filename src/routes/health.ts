/**
 * Health Check Routes
 */

import { FastifyInstance } from "fastify"
import { ethers } from "ethers"
import { config } from "../config"
import { getContractService } from "../contracts"

export async function healthRoutes(server: FastifyInstance) {
  // Quick ping endpoint (no external calls)
  server.get(
    "/ping",
    {
      schema: {
        tags: ["health"],
        summary: "Quick ping check",
        description: "Fast health check without external dependencies",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              uptime: { type: "number" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }
    }
  )

  server.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "API health check",
        description: "Checks API status and ARC Network connectivity",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string" },
              timestamp: { type: "string" },
              network: { type: "object" },
              contracts: { type: "object" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        // Check ARC RPC connectivity
        const provider = new ethers.JsonRpcProvider(config.ARC_RPC_URL)
        const blockNumber = await provider.getBlockNumber()
        const network = await provider.getNetwork()

        // Get contract statistics if deployed
        let contractStats = {}
        if (config.CONTRACT_SETTLEMENT && config.CONTRACT_PAYOUTS) {
          try {
            const contractService = getContractService()
            const [settlementCount, batchCount] = await Promise.all([
              contractService.getSettlementCount(),
              contractService.getBatchCount(),
            ])

            contractStats = {
              settlement: {
                address: config.CONTRACT_SETTLEMENT,
                totalSettlements: settlementCount,
              },
              payouts: {
                address: config.CONTRACT_PAYOUTS,
                totalBatches: batchCount,
              },
            }
          } catch (contractError) {
            contractStats = {
              settlement: config.CONTRACT_SETTLEMENT,
              payouts: config.CONTRACT_PAYOUTS,
              note: "Contracts deployed but stats unavailable",
            }
          }
        } else {
          contractStats = {
            settlement: "not-deployed",
            payouts: "not-deployed",
          }
        }

        return {
          status: "healthy",
          timestamp: new Date().toISOString(),
          network: {
            name: "ARC Testnet",
            chainId: Number(network.chainId),
            blockNumber,
            rpcUrl: config.ARC_RPC_URL,
            connected: true,
          },
          contracts: contractStats,
          compliance: {
            mode: config.USE_MOCK_COMPLIANCE ? "mock" : "elliptic",
            available: true,
          },
        }
      } catch (error: any) {
        reply.code(503)
        return {
          status: "unhealthy",
          timestamp: new Date().toISOString(),
          error: error.message,
        }
      }
    }
  )
}


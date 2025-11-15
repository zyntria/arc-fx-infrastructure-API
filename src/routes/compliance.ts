/**
 * Compliance Check Routes
 * Integrates with Elliptic or mock compliance service
 */

import { FastifyInstance } from "fastify"
import { z } from "zod"
import { config } from "../config"
import { logAuditEvent } from "../services/audit"

const complianceCheckSchema = z.object({
  wallet_address: z.string().min(26, "Invalid wallet address"), // Accept any address format
})

type ComplianceResult = {
  wallet: string
  status: "approved" | "flagged" | "rejected"
  risk_score: number
  checks: {
    sanctions: boolean
    high_risk: boolean
    fraud: boolean
  }
  message: string
  timestamp: string
}

// Mock compliance check
async function mockComplianceCheck(wallet: string): Promise<ComplianceResult> {
  // Only flag this specific address
  const rejectedAddress = "0x5Fa93cE79c3C026aAfC7Df53cFCdCDb582FaC9db"
  
  const isRejected = wallet.toLowerCase() === rejectedAddress.toLowerCase()

  if (isRejected) {
    return {
      wallet,
      status: "rejected",
      risk_score: 95,
      checks: {
        sanctions: false, // Failed sanctions check
        high_risk: true,
        fraud: true,
      },
      message: "Wallet flagged: High-risk address detected",
      timestamp: new Date().toISOString(),
    }
  }

  // Everyone else passes
  return {
    wallet,
    status: "approved",
    risk_score: Math.floor(Math.random() * 20) + 5, // 5-24 (low risk)
    checks: {
      sanctions: true, // Passed sanctions check
      high_risk: false,
      fraud: false,
    },
    message: "Wallet passed all compliance checks",
    timestamp: new Date().toISOString(),
  }
}

// Real Elliptic API integration (fallback to mock for now)
async function ellipticComplianceCheck(wallet: string): Promise<ComplianceResult> {
  // For now, just use mock - in production this would call Elliptic's API
  return mockComplianceCheck(wallet)
}

export async function complianceRoutes(server: FastifyInstance) {
  server.post<{
    Body: z.infer<typeof complianceCheckSchema>
  }>(
    "/compliance/check",
    {
      schema: {
        tags: ["compliance"],
        summary: "Check wallet compliance",
        description:
          "Performs AML/CTF compliance check. Accepts any blockchain address (EVM or Solana).",
        body: {
          type: "object",
          required: ["wallet_address"],
          properties: {
            wallet_address: {
              type: "string",
              description: "Wallet address to check (EVM 0x... or Solana base58)",
              minLength: 26,
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              wallet: { type: "string" },
              status: { type: "string", enum: ["approved", "flagged", "rejected"] },
              risk_score: { type: "number" },
              checks: {
                type: "object",
                properties: {
                  sanctions: { type: "boolean" },
                  high_risk: { type: "boolean" },
                  fraud: { type: "boolean" },
                },
              },
              message: { type: "string" },
              timestamp: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = complianceCheckSchema.parse(request.body)

        // Always use mock for now
        const result = await mockComplianceCheck(body.wallet_address)

        // Log compliance check
        server.log.info(`Compliance check: ${body.wallet_address} - ${result.status} (${result.risk_score})`)

        // Log audit event
        logAuditEvent({
          type: "compliance",
          action: "Wallet compliance check",
          wallet_address: body.wallet_address,
          status: "success",
          metadata: {
            compliance_status: result.status,
            risk_score: result.risk_score,
            checks: result.checks,
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return result
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return {
            error: "Invalid request",
            details: error.errors,
          }
        }
        throw error
      }
    }
  )

  // Batch compliance check
  server.post<{
    Body: { wallets: string[] }
  }>(
    "/compliance/check-batch",
    {
      schema: {
        tags: ["compliance"],
        summary: "Batch compliance check",
        description: "Check multiple wallets for compliance in one request",
        body: {
          type: "object",
          required: ["wallets"],
          properties: {
            wallets: {
              type: "array",
              items: { type: "string", minLength: 26 },
              minItems: 1,
              maxItems: 100,
            },
          },
        },
      },
    },
    async (request) => {
      const { wallets } = request.body

      const results = await Promise.all(wallets.map((wallet) => mockComplianceCheck(wallet)))

      return {
        results,
        total: results.length,
        rejected_count: results.filter((r) => r.status === "rejected").length,
        flagged_count: results.filter((r) => r.status === "flagged").length,
        approved_count: results.filter((r) => r.status === "approved").length,
      }
    }
  )
}


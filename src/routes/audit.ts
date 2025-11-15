/**
 * Audit and Webhook Routes
 * Audit logging and webhook management
 */

import { FastifyInstance } from "fastify"
import { z } from "zod"
import { queryAuditLogs, getAuditStats, exportAuditLogs } from "../services/audit"
import {
  registerWebhook,
  listWebhooks,
  getWebhook,
  deleteWebhook,
  testWebhook,
  type WebhookEvent,
} from "../services/webhook"

const webhookSchema = z.object({
  url: z.string().url(),
  events: z.array(
    z.enum([
      "onSwapFinalized",
      "onPayoutCompleted",
      "onComplianceFlag",
      "onCCTPTransferInitiated",
      "onCCTPTransferCompleted",
    ])
  ),
  secret: z.string().optional(),
})

export async function auditRoutes(server: FastifyInstance) {
  // GET /audit/logs - Retrieve audit logs
  server.get<{
    Querystring: {
      limit?: number
      offset?: number
      type?: string
      from_date?: string
      to_date?: string
    }
  }>(
    "/audit/logs",
    {
      schema: {
        tags: ["audit"],
        summary: "Get audit logs",
        description: "Retrieve historical API calls, compliance reports, and finality proofs",
        querystring: {
          type: "object",
          properties: {
            limit: { type: "number", default: 100, maximum: 1000 },
            offset: { type: "number", default: 0 },
            type: { type: "string", enum: ["swap", "payout", "compliance", "all"] },
            from_date: { type: "string", format: "date-time" },
            to_date: { type: "string", format: "date-time" },
          },
        },
      },
    },
    async (request) => {
      const { limit = 100, offset = 0, type = "all", from_date, to_date } = request.query

      const result = queryAuditLogs({
        limit,
        offset,
        type,
        from_date,
        to_date,
      })

      return {
        ...result,
        limit,
        offset,
        type,
      }
    }
  )

  // POST /webhooks - Register webhook
  server.post<{
    Body: z.infer<typeof webhookSchema>
  }>(
    "/webhooks",
    {
      schema: {
        tags: ["audit"],
        summary: "Register webhook",
        description: "Register a webhook URL to receive real-time notifications",
        body: {
          type: "object",
          required: ["url", "events"],
          properties: {
            url: { type: "string", format: "uri" },
            events: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "onSwapFinalized",
                  "onPayoutCompleted",
                  "onComplianceFlag",
                  "onCCTPTransferInitiated",
                  "onCCTPTransferCompleted",
                ],
              },
            },
            secret: { type: "string" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = webhookSchema.parse(request.body)

        const webhook = registerWebhook(body.url, body.events as WebhookEvent[], body.secret)

        return {
          webhook_id: webhook.id,
          url: webhook.url,
          events: webhook.events,
          status: webhook.status,
          created_at: webhook.created_at,
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

  // GET /webhooks - List webhooks
  server.get(
    "/webhooks",
    {
      schema: {
        tags: ["audit"],
        summary: "List webhooks",
        description: "List all registered webhooks",
      },
    },
    async () => {
      const webhookList = listWebhooks().map((webhook) => ({
        webhook_id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        status: webhook.status,
        created_at: webhook.created_at,
        last_triggered: webhook.last_triggered,
        failure_count: webhook.failure_count,
      }))

      return {
        webhooks: webhookList,
        total: webhookList.length,
      }
    }
  )

  // DELETE /webhooks/:id - Delete webhook
  server.delete<{
    Params: { id: string }
  }>(
    "/webhooks/:id",
    {
      schema: {
        tags: ["audit"],
        summary: "Delete webhook",
        description: "Remove a registered webhook",
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const deleted = deleteWebhook(id)

      if (!deleted) {
        reply.code(404)
        return { error: "Webhook not found" }
      }

      return {
        success: true,
        webhook_id: id,
        message: "Webhook deleted",
      }
    }
  )

  // GET /audit/stats - Get audit statistics
  server.get(
    "/audit/stats",
    {
      schema: {
        tags: ["audit"],
        summary: "Get audit statistics",
        description: "Get summary statistics of audit logs",
      },
    },
    async () => {
      const stats = getAuditStats()
      return {
        ...stats,
        timestamp: new Date().toISOString(),
      }
    }
  )

  // GET /audit/export - Export audit logs
  server.get<{
    Querystring: {
      format?: "json" | "csv"
    }
  }>(
    "/audit/export",
    {
      schema: {
        tags: ["audit"],
        summary: "Export audit logs",
        description: "Export all audit logs for compliance reporting",
        querystring: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["json", "csv"], default: "json" },
          },
        },
      },
    },
    async (request, reply) => {
      const { format = "json" } = request.query

      const exported = exportAuditLogs(format)

      if (format === "csv") {
        reply.header("Content-Type", "text/csv")
        reply.header(
          "Content-Disposition",
          `attachment; filename=audit-logs-${Date.now()}.csv`
        )
      } else {
        reply.header("Content-Type", "application/json")
      }

      return exported
    }
  )

  // POST /webhooks/:id/test - Test webhook delivery
  server.post<{
    Params: { id: string }
  }>(
    "/webhooks/:id/test",
    {
      schema: {
        tags: ["audit"],
        summary: "Test webhook",
        description: "Send a test payload to a webhook endpoint",
      },
    },
    async (request, reply) => {
      const { id } = request.params

      const result = await testWebhook(id)

      if (!result.success) {
        reply.code(400)
      }

      return result
    }
  )
}


/**
 * Webhook Service
 * Send real-time notifications to registered endpoints
 */

import { config } from "../config"
import { generateWebhookSignature } from "./audit"

export type WebhookEvent =
  | "onSwapFinalized"
  | "onPayoutCompleted"
  | "onComplianceFlag"
  | "onCCTPTransferInitiated"
  | "onCCTPTransferCompleted"

export interface Webhook {
  id: string
  url: string
  events: WebhookEvent[]
  secret?: string
  status: "active" | "inactive" | "failed"
  created_at: string
  last_triggered?: string
  failure_count: number
}

export interface WebhookPayload {
  event: WebhookEvent
  timestamp: string
  data: any
  webhook_id?: string
}

// In-memory webhook storage (upgrade to database in production)
const webhooks = new Map<string, Webhook>()

/**
 * Register a new webhook
 */
export function registerWebhook(
  url: string,
  events: WebhookEvent[],
  secret?: string
): Webhook {
  const webhook: Webhook = {
    id: `webhook_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    url,
    events,
    secret,
    status: "active",
    created_at: new Date().toISOString(),
    failure_count: 0,
  }

  webhooks.set(webhook.id, webhook)
  console.log(`[WEBHOOK] Registered: ${webhook.id} for events:`, events)

  return webhook
}

/**
 * Get all webhooks
 */
export function listWebhooks(): Webhook[] {
  return Array.from(webhooks.values())
}

/**
 * Get webhook by ID
 */
export function getWebhook(id: string): Webhook | undefined {
  return webhooks.get(id)
}

/**
 * Delete webhook
 */
export function deleteWebhook(id: string): boolean {
  return webhooks.delete(id)
}

/**
 * Update webhook status
 */
export function updateWebhookStatus(
  id: string,
  status: "active" | "inactive" | "failed"
): boolean {
  const webhook = webhooks.get(id)
  if (!webhook) return false

  webhook.status = status
  webhooks.set(id, webhook)
  return true
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(event: WebhookEvent, data: any): Promise<void> {
  const timestamp = new Date().toISOString()

  const relevantWebhooks = Array.from(webhooks.values()).filter(
    (webhook) => webhook.status === "active" && webhook.events.includes(event)
  )

  if (relevantWebhooks.length === 0) {
    console.log(`[WEBHOOK] No webhooks registered for event: ${event}`)
    return
  }

  console.log(`[WEBHOOK] Triggering ${relevantWebhooks.length} webhooks for: ${event}`)

  // Send webhooks in parallel
  await Promise.allSettled(
    relevantWebhooks.map((webhook) =>
      deliverWebhook(webhook, { event, timestamp, data, webhook_id: webhook.id })
    )
  )
}

/**
 * Deliver webhook with retry logic
 */
async function deliverWebhook(
  webhook: Webhook,
  payload: WebhookPayload,
  retries: number = 3
): Promise<void> {
  const payloadString = JSON.stringify(payload)

  // Generate HMAC signature if secret is provided
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "ARCfx-Webhook/1.0",
    "X-Webhook-Event": payload.event,
    "X-Webhook-Timestamp": payload.timestamp,
  }

  if (webhook.secret) {
    headers["X-Webhook-Signature"] = generateWebhookSignature(payloadString, webhook.secret)
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: payloadString,
        signal: AbortSignal.timeout(10000), // 10 second timeout
      })

      if (response.ok) {
        // Success
        webhook.last_triggered = new Date().toISOString()
        webhook.failure_count = 0
        webhook.status = "active"
        webhooks.set(webhook.id, webhook)

        console.log(`[WEBHOOK] ✓ Delivered to ${webhook.url} (${payload.event})`)
        return
      }

      console.warn(
        `[WEBHOOK] ⚠ Failed delivery (attempt ${attempt}/${retries}): ${webhook.url} - ${response.status}`
      )
    } catch (error: any) {
      console.error(
        `[WEBHOOK] ✗ Error delivering (attempt ${attempt}/${retries}): ${webhook.url} - ${error.message}`
      )
    }

    // Wait before retry (exponential backoff)
    if (attempt < retries) {
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000))
    }
  }

  // All retries failed
  webhook.failure_count++
  webhook.last_triggered = new Date().toISOString()

  // Disable webhook after 10 consecutive failures
  if (webhook.failure_count >= 10) {
    webhook.status = "failed"
    console.error(`[WEBHOOK] ✗ Disabled after 10 failures: ${webhook.url}`)
  }

  webhooks.set(webhook.id, webhook)
}

/**
 * Test webhook delivery
 */
export async function testWebhook(webhookId: string): Promise<{
  success: boolean
  message: string
}> {
  const webhook = webhooks.get(webhookId)
  if (!webhook) {
    return { success: false, message: "Webhook not found" }
  }

  try {
    await deliverWebhook(webhook, {
      event: "onSwapFinalized",
      timestamp: new Date().toISOString(),
      data: { test: true, message: "This is a test webhook" },
      webhook_id: webhook.id,
    })

    return { success: true, message: "Test webhook delivered successfully" }
  } catch (error: any) {
    return { success: false, message: `Failed to deliver: ${error.message}` }
  }
}


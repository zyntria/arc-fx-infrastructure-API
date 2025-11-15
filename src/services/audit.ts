/**
 * Audit Service
 * Centralized audit logging for compliance and debugging
 */

import crypto from "crypto"
import { config } from "../config"

export interface AuditLog {
  id: string
  timestamp: string
  type: "swap" | "payout" | "compliance" | "cctp" | "system"
  action: string
  user_id?: string
  wallet_address?: string
  amount?: number
  currency?: string
  tx_hash?: string
  status: "success" | "failed" | "pending"
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
}

// In-memory storage (upgrade to database in production)
const auditLogs: AuditLog[] = []

/**
 * Log an audit event
 */
export function logAuditEvent(event: Omit<AuditLog, "id" | "timestamp">): AuditLog {
  const auditLog: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
    timestamp: new Date().toISOString(),
    ...event,
  }

  auditLogs.push(auditLog)

  // In production, save to database
  console.log(`[AUDIT] ${auditLog.type}:${auditLog.action} - ${auditLog.status}`)

  return auditLog
}

/**
 * Query audit logs
 */
export function queryAuditLogs(filters: {
  limit?: number
  offset?: number
  type?: string
  from_date?: string
  to_date?: string
  wallet_address?: string
  status?: string
}): { logs: AuditLog[]; total: number } {
  let filtered = auditLogs

  // Apply filters
  if (filters.type && filters.type !== "all") {
    filtered = filtered.filter((log) => log.type === filters.type)
  }

  if (filters.wallet_address) {
    filtered = filtered.filter((log) => log.wallet_address === filters.wallet_address)
  }

  if (filters.status) {
    filtered = filtered.filter((log) => log.status === filters.status)
  }

  if (filters.from_date) {
    const fromDate = new Date(filters.from_date)
    filtered = filtered.filter((log) => new Date(log.timestamp) >= fromDate)
  }

  if (filters.to_date) {
    const toDate = new Date(filters.to_date)
    filtered = filtered.filter((log) => new Date(log.timestamp) <= toDate)
  }

  // Sort by timestamp (newest first)
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  // Pagination
  const offset = filters.offset || 0
  const limit = filters.limit || 100
  const paginated = filtered.slice(offset, offset + limit)

  return {
    logs: paginated,
    total: filtered.length,
  }
}

/**
 * Get audit statistics
 */
export function getAuditStats(): {
  total: number
  by_type: Record<string, number>
  by_status: Record<string, number>
  last_24h: number
} {
  const now = Date.now()
  const last24h = now - 24 * 60 * 60 * 1000

  const byType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  let last24hCount = 0

  for (const log of auditLogs) {
    // Count by type
    byType[log.type] = (byType[log.type] || 0) + 1

    // Count by status
    byStatus[log.status] = (byStatus[log.status] || 0) + 1

    // Count last 24h
    if (new Date(log.timestamp).getTime() > last24h) {
      last24hCount++
    }
  }

  return {
    total: auditLogs.length,
    by_type: byType,
    by_status: byStatus,
    last_24h: last24hCount,
  }
}

/**
 * Export audit logs (for compliance reporting)
 */
export function exportAuditLogs(format: "json" | "csv" = "json"): string {
  if (format === "csv") {
    const headers = [
      "ID",
      "Timestamp",
      "Type",
      "Action",
      "Wallet",
      "Amount",
      "Currency",
      "TxHash",
      "Status",
    ]
    const rows = auditLogs.map((log) => [
      log.id,
      log.timestamp,
      log.type,
      log.action,
      log.wallet_address || "",
      log.amount || "",
      log.currency || "",
      log.tx_hash || "",
      log.status,
    ])

    return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")
  }

  return JSON.stringify(auditLogs, null, 2)
}

/**
 * Generate HMAC signature for webhook payloads
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret)
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
}


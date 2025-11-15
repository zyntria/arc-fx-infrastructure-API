/**
 * Database Service
 * PostgreSQL connection and query helpers
 */

import { Pool, PoolClient } from "pg"
import { config } from "../config"

let pool: Pool | null = null

/**
 * Initialize database connection pool
 */
export function initDatabase() {
  if (pool) {
    return pool
  }

  const dbUrl = process.env.DATABASE_URL || config.DATABASE_URL

  if (!dbUrl) {
    console.warn("[Database] DATABASE_URL not configured - using in-memory storage")
    return null
  }

  try {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })

    pool.on("error", (err) => {
      console.error("[Database] Unexpected error on idle client", err)
    })

    console.log("[Database] ✅ PostgreSQL connection pool initialized")
    return pool
  } catch (error: any) {
    console.error("[Database] Failed to initialize pool:", error.message)
    return null
  }
}

/**
 * Get database pool (initializes if needed)
 */
export function getPool(): Pool | null {
  if (!pool) {
    return initDatabase()
  }
  return pool
}

/**
 * Execute a query
 */
export async function query(text: string, params?: any[]) {
  const client = getPool()
  
  if (!client) {
    throw new Error("Database not initialized")
  }

  try {
    const result = await client.query(text, params)
    return result
  } catch (error: any) {
    console.error("[Database] Query error:", error.message)
    throw error
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient | null> {
  const poolInstance = getPool()
  
  if (!poolInstance) {
    return null
  }

  try {
    return await poolInstance.connect()
  } catch (error: any) {
    console.error("[Database] Failed to get client:", error.message)
    return null
  }
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const poolInstance = getPool()
    if (!poolInstance) {
      return false
    }
    
    await poolInstance.query("SELECT 1")
    return true
  } catch {
    return false
  }
}

/**
 * Close database connections
 */
export async function closeDatabase() {
  if (pool) {
    await pool.end()
    pool = null
    console.log("[Database] Connection pool closed")
  }
}


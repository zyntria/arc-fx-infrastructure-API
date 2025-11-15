/**
 * ARC-FX API Configuration
 * Central configuration management
 */

import { z } from "zod"

const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default("4000"),
  HOST: z.string().default("0.0.0.0"),
  API_VERSION: z.string().default("v1"),

  // ARC Network
  ARC_RPC_URL: z.string().url().default("https://rpc.testnet.arc.network"),
  ARC_CHAIN_ID: z.string().transform(Number).default("12345"),
  ARC_EXPLORER_URL: z.string().url().default("https://testnet.arcscan.app"),

  // Database
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().optional(),

  // Authentication
  JWT_SECRET: z.string().default("dev-secret-change-in-production"),
  API_KEY_SALT: z.string().default("dev-salt"),

  // Smart Contracts
  CONTRACT_SETTLEMENT: z.string().optional(),
  CONTRACT_PAYOUTS: z.string().optional(),
  BOND_NFT_CONTRACT: z.string().optional(),

  // Wallet / Signing
  PRIVATE_KEY: z.string().optional(),
  OPERATOR_PRIVATE_KEY: z.string().optional(),

  // Compliance
  ELLIPTIC_API_KEY: z.string().optional(),
  ELLIPTIC_API_URL: z.string().url().optional(),
  USE_MOCK_COMPLIANCE: z
    .string()
    .transform((v) => v === "true")
    .default("true"),

  // Rate Limiting
  RATE_LIMIT_MAX: z.string().transform(Number).default("100"),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default("60000"),

  // Logging
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
  LOG_PRETTY: z
    .string()
    .transform((v) => v === "true")
    .default("true"),

  // CORS
  CORS_ORIGIN: z.string().default("*"),

  // Webhooks
  WEBHOOK_SECRET: z.string().default("dev-webhook-secret"),
})

const parseConfig = () => {
  try {
    const parsed = configSchema.parse(process.env)
    
    // Log which RPC is being used on startup
    console.log(`\n🌐 Configuration Loaded:`)
    console.log(`   RPC URL: ${parsed.ARC_RPC_URL}`)
    console.log(`   NFT Contract: ${parsed.BOND_NFT_CONTRACT || 'Not set'}`)
    console.log(`   Database: ${parsed.DATABASE_URL ? 'Connected' : 'Not configured'}\n`)
    
    return parsed
  } catch (error) {
    console.error("❌ Invalid configuration:", error)
    process.exit(1)
  }
}

export const config = parseConfig()

export type Config = z.infer<typeof configSchema>


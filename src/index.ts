/**
 * ARC-FX Infrastructure API
 * Main server entry point
 */

// Load environment variables from .env file
import "dotenv/config"

import Fastify from "fastify"
import cors from "@fastify/cors"
import rateLimit from "@fastify/rate-limit"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import { config } from "./config"
import { setupRoutes } from "./routes"
import { logger } from "./utils/logger"
import { initDatabase, closeDatabase } from "./db"

async function buildServer() {
  const server = Fastify({
    logger: logger,
    trustProxy: true,
  })

  // Register plugins
  await server.register(cors, {
    origin: config.CORS_ORIGIN,
  })

  await server.register(rateLimit, {
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_WINDOW_MS,
  })

  // Swagger documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: "ARC-FX Infrastructure API",
        description:
          "Programmable API layer for deterministic multi-currency settlement on ARC Network",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://localhost:${config.PORT}`,
          description: "Development server",
        },
      ],
      tags: [
        { name: "health", description: "Health check endpoints" },
        { name: "currencies", description: "Currency and rate endpoints" },
        { name: "compliance", description: "Compliance check endpoints" },
        { name: "swap", description: "FX swap endpoints" },
        { name: "payouts", description: "Multi-recipient payout endpoints" },
        { name: "transactions", description: "Transaction tracking endpoints" },
        { name: "audit", description: "Audit and webhook endpoints" },
      ],
    },
  })

  await server.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: false,
    },
  })

  // Setup API routes
  try {
    await setupRoutes(server)
  } catch (routeError: any) {
    logger.error({ err: routeError }, "Failed to setup routes")
    throw routeError
  }

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    server.log.error(error)
    reply.status(error.statusCode || 500).send({
      error: error.message || "Internal Server Error",
      statusCode: error.statusCode || 500,
      timestamp: new Date().toISOString(),
    })
  })

  return server
}

async function start() {
  try {
    // Initialize database connection
    const db = initDatabase()
    if (db) {
      logger.info("Database connection initialized")
    } else {
      logger.warn("Database not configured - using in-memory storage")
    }

    const server = await buildServer()

    await server.listen({
      port: config.PORT,
      host: config.HOST,
    })

    server.log.info(`
    ┌───────────────────────────────────────────────────────┐
    │  🚀 ARC-FX Infrastructure API                         │
    │                                                       │
    │  Version: 1.0.0                                       │
    │  Environment: ${config.NODE_ENV.padEnd(42)}│
    │  API: http://${config.HOST}:${config.PORT}/${config.API_VERSION.padEnd(26)}│
    │  Docs: http://${config.HOST}:${config.PORT}/docs${" ".padEnd(23)}│
    │  ARC Network: ${config.ARC_RPC_URL.padEnd(34)}│
    │  Database: ${db ? "Connected" : "In-memory"} ${"".padEnd(26)}│
    │                                                       │
    │  Ready to process deterministic settlements! ⚡       │
    └───────────────────────────────────────────────────────┘
    `)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

// Handle graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down gracefully...")
  await closeDatabase()
  process.exit(0)
})

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...")
  await closeDatabase()
  process.exit(0)
})

start()


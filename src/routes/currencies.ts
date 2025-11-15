/**
 * Currency and Rate Routes
 * Lists supported ARC stablecoins and provides FX rates
 */

import { FastifyInstance } from "fastify"
import { getFormattedRates } from "../services/rates"

// Mock data - in production this would query ARC's on-chain registry
const SUPPORTED_CURRENCIES = [
  {
    symbol: "USDC",
    name: "USD Coin",
    contract: "0x3600000000000000000000000000000000000000", // ARC testnet USDC
    decimals: 6,
    type: "stablecoin",
    blockchain: "ARC",
    available: true,
  },
  {
    symbol: "EURC",
    name: "Euro Coin",
    contract: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a", // ARC testnet EURC
    decimals: 6,
    type: "stablecoin",
    blockchain: "ARC",
    available: true,
  },
  {
    symbol: "USYC",
    name: "Hashnote Short Duration Yield Coin",
    contract: "0x0000000000000000000000000000000000000000", // Placeholder
    decimals: 6,
    type: "yield-bearing",
    blockchain: "ARC",
    available: false,
    note: "Coming soon to ARC testnet",
  },
]

// FX rates now fetched from real-time API
// See src/services/rates.ts for implementation

export async function currencyRoutes(server: FastifyInstance) {
  // GET /currencies - List supported currencies
  server.get(
    "/currencies",
    {
      schema: {
        tags: ["currencies"],
        summary: "List supported currencies",
        description: "Returns all stablecoins supported on ARC Network",
        response: {
          200: {
            type: "object",
            properties: {
              currencies: { type: "array" },
              total: { type: "number" },
              network: { type: "string" },
            },
          },
        },
      },
    },
    async () => {
      return {
        currencies: SUPPORTED_CURRENCIES,
        total: SUPPORTED_CURRENCIES.length,
        network: "arc-testnet",
        finality: "deterministic",
      }
    }
  )

  // GET /rates - Get current FX rates
  server.get(
    "/rates",
    {
      schema: {
        tags: ["currencies"],
        summary: "Get FX rates",
        description: "Returns current foreign exchange rates from ARC's native FX services",
        querystring: {
          type: "object",
          properties: {
            base: { type: "string", description: "Base currency", default: "USDC" },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              base: { type: "string" },
              rates: { 
                type: "object",
                additionalProperties: true 
              },
              source: { type: "string" },
              timestamp: { type: "string" },
              note: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { base = "USDC" } = request.query as { base?: string }

        const rates = await getFormattedRates(base)

        return {
          ...rates,
          note: "Real-time exchange rates with 1-minute cache",
        }
      } catch (error: any) {
        reply.code(500)
        return {
          error: "Failed to fetch rates",
          details: error.message,
        }
      }
    }
  )

  // GET /currencies/:symbol - Get specific currency details
  server.get<{
    Params: { symbol: string }
  }>(
    "/currencies/:symbol",
    {
      schema: {
        tags: ["currencies"],
        summary: "Get currency details",
        description: "Returns detailed information about a specific currency",
        params: {
          type: "object",
          properties: {
            symbol: { type: "string" },
          },
          required: ["symbol"],
        },
      },
    },
    async (request, reply) => {
      const { symbol } = request.params

      const currency = SUPPORTED_CURRENCIES.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase())

      if (!currency) {
        reply.code(404)
        return {
          error: "Currency not found",
          available: SUPPORTED_CURRENCIES.map((c) => c.symbol),
        }
      }

      return currency
    }
  )
}


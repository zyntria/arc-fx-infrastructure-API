/**
 * API Routes Setup
 * Registers all route handlers
 */

import { FastifyInstance } from "fastify"
import { config } from "../config"
import { healthRoutes } from "./health"
import { currencyRoutes } from "./currencies"
import { complianceRoutes } from "./compliance"
import { swapRoutes } from "./swap"
import { payoutRoutes } from "./payouts"
import { transactionRoutes } from "./transactions"
import { auditRoutes } from "./audit"
import { cctpRoutes } from "./cctp"
import { yieldRoutes } from "./yield"
import { mediaRoutes } from "./media"
import { nftRoutes } from "./nft"
import { nftTestRoutes } from "./nft-test"

export async function setupRoutes(server: FastifyInstance<any, any, any, any, any>) {
  const apiPrefix = `/${config.API_VERSION}`

  // Register route modules
  try {
  await server.register(healthRoutes, { prefix: apiPrefix })
  await server.register(currencyRoutes, { prefix: apiPrefix })
  await server.register(complianceRoutes, { prefix: apiPrefix })
  await server.register(swapRoutes, { prefix: apiPrefix })
  await server.register(payoutRoutes, { prefix: apiPrefix })
  await server.register(transactionRoutes, { prefix: apiPrefix })
  await server.register(auditRoutes, { prefix: apiPrefix })
  await server.register(cctpRoutes, { prefix: apiPrefix })
  await server.register(yieldRoutes, { prefix: apiPrefix })
    await server.register(mediaRoutes, { prefix: apiPrefix })
    await server.register(nftRoutes, { prefix: apiPrefix })
    await server.register(nftTestRoutes, { prefix: apiPrefix })
  } catch (err: any) {
    console.error("Error registering routes:", err.message)
    throw err
  }

  // Root endpoint
  server.get("/", async (request, reply) => {
    return {
      name: "ARC-FX Infrastructure API",
      version: "1.0.0",
      description: "Programmable layer for deterministic multi-currency settlement on ARC Network",
      documentation: `/docs`,
      endpoints: {
        health: `${apiPrefix}/health`,
        currencies: `${apiPrefix}/currencies`,
        rates: `${apiPrefix}/rates`,
        compliance: `${apiPrefix}/compliance/check`,
        quote: `${apiPrefix}/quote`,
        swap: `${apiPrefix}/swap`,
        payouts: `${apiPrefix}/payouts`,
        transactions: `${apiPrefix}/transactions/:id`,
        audit: `${apiPrefix}/audit/logs`,
        cctp_transfer: `${apiPrefix}/cctp/transfer`,
        cctp_status: `${apiPrefix}/cctp/status/:messageHash`,
        cctp_chains: `${apiPrefix}/cctp/supported-chains`,
        yield_bonds: `${apiPrefix}/yield/bonds`,
        yield_subscribe: `${apiPrefix}/yield/bonds/:bond_id/subscribe`,
        yield_pools: `${apiPrefix}/yield/pools`,
        yield_deposit: `${apiPrefix}/yield/deposit`,
        yield_positions: `${apiPrefix}/yield/positions/:wallet`,
        media_nft_image: `${apiPrefix}/media/nft-image`,
        media_nft_status: `${apiPrefix}/media/nft-image/status`,
        media_nft_estimate: `${apiPrefix}/media/nft-image/estimate`,
        media_styles: `${apiPrefix}/media/styles`,
        nft_bond_metadata: `${apiPrefix}/nft/bonds/:bond_id/metadata.json`,
        nft_token_metadata: `${apiPrefix}/nft/tokens/:token_id/metadata.json`,
        nft_bond_image: `${apiPrefix}/nft/bonds/:bond_id/image`,
      },
      network: {
        name: "ARC Testnet",
        rpc: config.ARC_RPC_URL,
        explorer: config.ARC_EXPLORER_URL,
      },
    }
  })
}


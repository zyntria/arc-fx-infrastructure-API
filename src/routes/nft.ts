/**
 * NFT Metadata Routes
 * Endpoints for serving NFT metadata (tokenURI targets)
 */

import { FastifyInstance } from "fastify"
import { nftMetadataStore } from "../services/nft-metadata-store"
import { nftContractService } from "../services/nft-contract"

export async function nftRoutes(server: FastifyInstance) {
  /**
   * GET /v1/nft/transactions/{tx_hash}/status
   * Check the status of a pending NFT mint transaction
   */
  server.get<{
    Params: {
      tx_hash: string
    }
  }>("/nft/transactions/:tx_hash/status", async (request, reply) => {
    try {
      const { tx_hash } = request.params

      console.log(`[API] Checking NFT transaction status: ${tx_hash}`)
      
      const status = await nftContractService.checkTransactionStatus(tx_hash)

      if (status.confirmed) {
        return {
          status: "confirmed",
          tx_hash,
          block_number: status.blockNumber,
          token_id: status.tokenId,
          explorer_url: `https://testnet.arcscan.app/tx/${tx_hash}`,
        }
      } else {
        return {
          status: "pending",
          tx_hash,
          error: status.error,
          explorer_url: `https://testnet.arcscan.app/tx/${tx_hash}`,
          message: "Transaction not yet confirmed. Please check ARCScan for details.",
        }
      }
    } catch (error: any) {
      console.error("Transaction status check error:", error)
      return reply.code(500).send({
        error: {
          code: "STATUS_CHECK_ERROR",
          message: "Failed to check transaction status",
          details: error.message,
        },
      })
    }
  })

  /**
   * GET /v1/nft/bonds/{bond_id}/metadata.json
   * NFT metadata endpoint for tokenURI
   * This is what wallets and explorers call to display the NFT
   */
  server.get<{
    Params: {
      bond_id: string
    }
  }>("/nft/bonds/:bond_id/metadata.json", async (request, reply) => {
    try {
      const { bond_id } = request.params

      // Try to get certificate data from store
      const certificate = await nftMetadataStore.get(bond_id)
      
      if (!certificate) {
        // Return default metadata if not found
        console.log(`[NFT Metadata] No certificate data found for bond: ${bond_id}`)
        return reply.code(404).send({
          error: {
            code: "CERTIFICATE_NOT_FOUND",
            message: `No certificate found for bond: ${bond_id}`,
          },
        })
      }

      const bondData = {
        bond_id: certificate.bond_id,
        series_name: certificate.series_name,
        principal: certificate.principal,
        currency: certificate.currency,
        coupon_rate: certificate.coupon_rate,
        tenor_days: certificate.tenor_days,
        issuer_name: certificate.issuer_name,
        transferability: certificate.transferability,
        image_ipfs_url: certificate.image_url,
        image_gateway_url: certificate.gateway_url || certificate.image_url.replace("ipfs://", "https://ipfs.io/ipfs/"),
        issue_date: typeof certificate.created_at === 'string' 
          ? certificate.created_at.split('T')[0]
          : new Date(certificate.created_at).toISOString().split('T')[0],
      }

      // Use direct image URL from our backend for demo (until real IPFS is set up)
      const imageUrl = `https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/${bond_id}/image`

      // Build NFT metadata following OpenSea/standard format
      const frontendUrl = process.env.FRONTEND_URL || 'https://app.arcfx.finance';
      const metadata = {
        name: `ARC Yield Bond — ${bondData.series_name}`,
        description: `A ${bondData.tenor_days}-day ARC-Yield bond paying ${bondData.coupon_rate}% coupon, principal ${bondData.principal} ${bondData.currency}, settled on ARC Network.`,
        image: imageUrl,  // Direct backend URL for demo
        external_url: `${frontendUrl}/bonds/${bond_id}`,
        attributes: [
          {
            trait_type: "Bond ID",
            value: bond_id,
          },
          {
            trait_type: "Series",
            value: bondData.series_name,
          },
          {
            trait_type: "Principal",
            value: `${bondData.principal} ${bondData.currency}`,
          },
          {
            trait_type: "Currency",
            value: bondData.currency,
          },
          {
            trait_type: "Coupon Rate",
            value: `${bondData.coupon_rate}%`,
          },
          {
            trait_type: "Tenor",
            value: `${bondData.tenor_days} Days`,
          },
          {
            trait_type: "Issuer",
            value: bondData.issuer_name,
          },
          {
            trait_type: "Transferability",
            value: bondData.transferability,
          },
          {
            trait_type: "Issue Date",
            value: bondData.issue_date,
            display_type: "date",
          },
          {
            trait_type: "Network",
            value: "ARC Testnet",
          },
        ],
      }

      // Set proper headers for NFT metadata
      reply.header("Content-Type", "application/json")
      reply.header("Cache-Control", "public, max-age=86400, s-maxage=86400, immutable") // Cache for 24 hours
      reply.header("Access-Control-Allow-Origin", "*") // Allow cross-origin requests
      reply.header("Access-Control-Allow-Methods", "GET, OPTIONS")
      reply.header("Access-Control-Allow-Headers", "Content-Type")

      return reply.send(metadata)
    } catch (error: any) {
      console.error("NFT metadata error:", error)
      return reply.code(500).send({
        error: {
          code: "METADATA_ERROR",
          message: "Failed to fetch NFT metadata",
          details: error.message,
        },
      })
    }
  })

  /**
   * GET /v1/nft/tokens/{token_id}/metadata.json
   * Alternative endpoint using token_id instead of bond_id
   * (Optional - if you want to support both formats)
   */
  server.get<{
    Params: {
      token_id: string
    }
  }>("/nft/tokens/:token_id/metadata.json", async (request, reply) => {
    try {
      const { token_id } = request.params

      // TODO: Map token_id to bond_id
      // const position = await nftContract.positions(token_id)
      // const bond_id = position.bondId
      
      // For now, redirect to bond metadata endpoint
      // In production, you'd query the database directly
      
      const mockBondId = "bond_93f2a1" // Replace with actual lookup

      return reply.redirect(301, `/nft/bonds/${mockBondId}/metadata.json`)
    } catch (error: any) {
      console.error("Token metadata error:", error)
      return reply.code(500).send({
        error: {
          code: "METADATA_ERROR",
          message: "Failed to fetch token metadata",
          details: error.message,
        },
      })
    }
  })

  /**
   * GET /v1/nft/bonds/{bond_id}/image
   * Direct image endpoint (serves or redirects to image)
   */
  server.get<{
    Params: {
      bond_id: string
    }
  }>("/nft/bonds/:bond_id/image", async (request, reply) => {
    try {
      const { bond_id } = request.params

      // Get certificate data from store
      const certificate = await nftMetadataStore.get(bond_id)
      
      if (!certificate) {
        return reply.code(404).send({
          error: {
            code: "IMAGE_NOT_FOUND",
            message: `No certificate image found for bond: ${bond_id}`,
          },
        })
      }

      // If we have a real IPFS URL, redirect to gateway
      if (certificate.gateway_url && !certificate.gateway_url.includes("bafybei")) {
        return reply.redirect(302, certificate.gateway_url)
      }

      // Otherwise, try to serve from temp directory
      const fs = await import("fs/promises")
      const glob = await import("glob")
      const path = await import("path")

      // Find the image file in /tmp
      const pattern = `/tmp/*${bond_id}*.png`
      const files = glob.sync(pattern)

      if (files.length > 0) {
        const imageBuffer = await fs.readFile(files[0])
        reply.header("Content-Type", "image/png")
        reply.header("Cache-Control", "public, max-age=86400") // Cache for 1 day
        return reply.send(imageBuffer)
      }

      // No image found
      return reply.code(404).send({
        error: {
          code: "IMAGE_NOT_FOUND",
          message: `Certificate image file not found for bond: ${bond_id}`,
        },
      })
    } catch (error: any) {
      console.error("Image redirect error:", error)
      return reply.code(404).send({
        error: {
          code: "IMAGE_NOT_FOUND",
          message: "Bond certificate image not found",
        },
      })
    }
  })
}


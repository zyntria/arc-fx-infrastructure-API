/**
 * Media/NFT Image Generation Routes
 * Endpoints for generating NFT certificate images using ChatGPT/OpenAI
 */

import { FastifyInstance } from "fastify"
import {
  generateCertificateImage,
  isImageGenerationEnabled,
  estimateImageCost,
  type ImageGenerationParams,
  type CertificateStyle,
  type ImageContext,
} from "../services/nft-image"
import {
  uploadImageToIPFS,
} from "../services/storage-simple"

export async function mediaRoutes(server: FastifyInstance) {
  console.log("[Media Routes] Initializing media routes...")
  try {
    /**
     * POST /v1/media/nft-image
     * Generate NFT certificate image using OpenAI GPT Image
     */
    console.log("[Media Routes] Registering POST /v1/media/nft-image...")
    server.post<{
    Body: {
      context: ImageContext
      style: CertificateStyle
      bond_id?: string
      fields: {
        title: string
        series_label: string
        principal_label: string
        coupon_label: string
        tenor_label: string
        issuer_display_name: string
        transferability: string
        issue_date?: string
        maturity_date?: string
      }
      regenerate?: boolean
      size?: "1024x1024" | "1024x1536" | "1536x1024"
      quality?: "low" | "medium" | "high" | "auto"
      background?: "transparent" | "opaque" | "auto"
    }
  }>("/media/nft-image", async (request, reply) => {
    try {
      // Check if image generation is enabled
      if (!isImageGenerationEnabled()) {
        return reply.code(503).send({
          error: {
            code: "SERVICE_UNAVAILABLE",
            message: "Image generation is not configured. Please set OPENAI_API_KEY environment variable.",
          },
        })
      }

      const { context, style, bond_id, fields, regenerate, size, quality, background } = request.body

      // Validate required fields
      if (!context || !style || !fields) {
        return reply.code(400).send({
          error: {
            code: "INVALID_REQUEST",
            message: "Missing required fields: context, style, and fields are required",
          },
        })
      }

      // Validate style
      if (!["institutional", "fintech", "ghibli"].includes(style)) {
        return reply.code(400).send({
          error: {
            code: "INVALID_STYLE",
            message: "Style must be one of: institutional, fintech, ghibli",
          },
        })
      }

      // Generate image using OpenAI
      const result = await generateCertificateImage({
        context,
        style,
        bond_id,
        fields,
        regenerate,
        size,
        quality,
        background,
      })

      if (result.status === "failed") {
        return reply.code(500).send({
          error: {
            code: "IMAGE_GENERATION_FAILED",
            message: result.error || "Failed to generate image",
          },
        })
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(result.image_base64, "base64")

      // Upload to IPFS via NFT.Storage
      const ipfsResult = await uploadImageToIPFS({
        bondId: bond_id,
        buffer: imageBuffer,
        filename: `${bond_id || "nft"}-certificate.png`,
        contentType: "image/png",
      })

      // TODO: Generate thumbnail if needed
      const thumbnailUrl = undefined

      // TODO: Persist in database
      // await db('bond_nft_images').insert({
      //   id: result.image_id,
      //   bond_id,
      //   style,
      //   prompt_used: result.prompt_used,
      //   image_cid: ipfsResult.cid,
      //   image_ipfs_url: ipfsResult.ipfs_url,
      //   image_gateway_url: ipfsResult.gateway_url,
      //   thumbnail_url: thumbnailUrl,
      //   storage_type: ipfsResult.storage_type,
      //   generated_at: result.generated_at
      // })

      return reply.send({
        image_id: result.image_id,
        bond_id,
        style,
        prompt_used: result.prompt_used,
        image_cid: ipfsResult.cid,
        image_url: ipfsResult.ipfs_url, // ipfs://...
        gateway_url: ipfsResult.gateway_url, // https://nftstorage.link/ipfs/...
        thumbnail_url: thumbnailUrl,
        storage_type: ipfsResult.storage_type,
        // Also return base64 for immediate use
        image_base64: result.image_base64,
        status: "completed",
        generated_at: result.generated_at,
      })
    } catch (error: any) {
      console.error("Media NFT image generation error:", error)
      return reply.code(500).send({
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to generate NFT image",
          details: error.message,
        },
      })
    }
  })

    /**
     * GET /v1/media/nft-image/status
     * Check if image generation is available
     */
    console.log("[Media Routes] Registering GET /v1/media/nft-image/status...")
    server.get("/media/nft-image/status", async (request, reply) => {
    const imageGenEnabled = isImageGenerationEnabled()
    const storageStatus = {
      configured: true,
      type: "storacha-cli",
      message: "Using storacha CLI for uploads"
    }

    return reply.send({
      image_generation: {
        enabled: imageGenEnabled,
        message: imageGenEnabled
          ? "OpenAI image generation is available"
          : "Image generation requires OPENAI_API_KEY to be configured",
      },
      storage: storageStatus,
      overall_status: imageGenEnabled && storageStatus.configured ? "ready" : "partial",
    })
  })

  /**
   * POST /v1/media/nft-image/estimate
   * Estimate cost for image generation
   */
  server.post<{
    Body: {
      size?: string
      quality?: string
    }
  }>("/media/nft-image/estimate", async (request, reply) => {
    const { size = "1024x1024", quality = "high" } = request.body

    const estimate = estimateImageCost({ size, quality })

    return reply.send({
      size,
      quality,
      tokens: estimate.tokens,
      estimated_cost: estimate.estimatedCost,
      note: "Actual cost may vary based on prompt complexity and OpenAI pricing",
    })
  })

  /**
   * GET /v1/media/styles
   * Get available certificate styles
   */
  server.get("/media/styles", async (request, reply) => {
    return reply.send({
      styles: [
        {
          id: "institutional",
          name: "Institutional",
          description: "Premium corporate design with deep navy and gold/silver accents, ornamental borders, traditional stock certificate aesthetic",
          preview_url: "https://cdn.arcfx.app/styles/institutional_preview.png",
          best_for: ["Traditional finance", "Institutional investors", "High-value bonds"],
        },
        {
          id: "fintech",
          name: "Fintech/DeFi",
          description: "Futuristic digital design with dark mode, neon accents, circuit patterns, and holographic elements",
          preview_url: "https://cdn.arcfx.app/styles/fintech_preview.png",
          best_for: ["Web3/Crypto", "DeFi protocols", "Tech-savvy investors"],
        },
        {
          id: "ghibli",
          name: "Studio Ghibli",
          description: "Artistic illustrated style with soft watercolor textures, warm colors, hand-painted aesthetic with whimsical magical details",
          preview_url: "https://cdn.arcfx.app/styles/ghibli_preview.png",
          best_for: ["Creative projects", "Unique collectibles", "Artistic bonds"],
        },
      ],
    })
  })
    console.log("[Media Routes] All media routes registered successfully!")
  } catch (error: any) {
    console.error("[Media Routes] Error setting up routes:", error.message)
    console.error(error.stack)
    throw error
  }
}


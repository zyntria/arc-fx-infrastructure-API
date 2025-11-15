/**
 * NFT Certificate Image Generation Service
 * Uses OpenAI GPT Image to generate bond certificates and other NFT artwork
 */

import OpenAI from "openai"
import crypto from "crypto"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Certificate style options
 */
export type CertificateStyle = "institutional" | "fintech" | "ghibli"

/**
 * Context for image generation
 */
export type ImageContext = "bond_certificate" | "invoice_receipt" | "treasury_report"

/**
 * Certificate fields for bond certificates
 */
export interface BondCertificateFields {
  title: string
  series_label: string
  principal_label: string
  coupon_label: string
  tenor_label: string
  issuer_display_name: string
  transferability: string
  bond_id?: string
  issue_date?: string
  maturity_date?: string
}

/**
 * Image generation request parameters
 */
export interface ImageGenerationParams {
  context: ImageContext
  style: CertificateStyle
  bond_id?: string
  fields: BondCertificateFields
  regenerate?: boolean
  size?: "1024x1024" | "1024x1536" | "1536x1024"
  quality?: "low" | "medium" | "high" | "auto"
  background?: "transparent" | "opaque" | "auto"
}

/**
 * Image generation result
 */
export interface ImageGenerationResult {
  image_id: string
  bond_id?: string
  style: CertificateStyle
  prompt_used: string
  image_base64: string
  status: "completed" | "failed"
  generated_at: string
  error?: string
}

/**
 * Build prompt for image generation based on context and style
 */
function buildPrompt(params: {
  context: ImageContext
  style: CertificateStyle
  fields: BondCertificateFields
}): string {
  const { context, style, fields } = params

  // Base certificate text
  const baseText = `
    Title: ${fields.title}
    Series: ${fields.series_label}
    Principal: ${fields.principal_label}
    Coupon: ${fields.coupon_label}
    Tenor: ${fields.tenor_label}
    Issuer: ${fields.issuer_display_name}
    Transferability: ${fields.transferability}
    ${fields.issue_date ? `Issue Date: ${fields.issue_date}` : ''}
    ${fields.maturity_date ? `Maturity Date: ${fields.maturity_date}` : ''}
  `

  if (context === "bond_certificate") {
    switch (style) {
      case "institutional":
        return `
          Create a high-resolution institutional-grade financial certificate design titled
          "${fields.title}". 
          
          Style: Premium corporate with deep navy blue (#1a2332) and gold/silver accents, 
          intricate ornamental borders reminiscent of traditional stock certificates, 
          and a central emblem or seal symbolizing trust and stability.
          
          Layout requirements:
          - Center the title "${fields.title}" prominently at the top
          - Display the following information in an elegant, structured layout:
            ${baseText}
          - Include decorative guilloche patterns in the corners
          - Add a watermark or subtle background pattern
          - Use serif fonts for a classic, authoritative look
          - Include "CERTIFICATE OF OWNERSHIP" subtitle
          
          The design should look like a modern sovereign bond certificate or high-value 
          stock certificate suitable for institutional investors. High quality, professional, 
          and suitable for printing at large sizes.
        `

      case "fintech":
        return `
          Create a futuristic digital bond certificate titled "${fields.title}".
          
          Style: Dark mode background (#0a0e1a) with neon teal (#00e5cc) and electric blue 
          (#0066ff) accents, abstract circuit board patterns, holographic elements, and 
          clean modern san-serif typography.
          
          Layout requirements:
          - Title "${fields.title}" in glowing neon text at top
          - Display data in a structured dashboard-like format:
            ${baseText}
          - Include abstract geometric shapes and lines suggesting blockchain/network
          - Add subtle animated-looking glow effects (static image but suggests motion)
          - Use monospace fonts for numerical data
          - Include QR code placeholder in corner
          - "DIGITAL ASSET CERTIFICATE" label
          
          High-tech, DeFi aesthetic suitable for web3/crypto investors. Modern, sleek, 
          and digitally native appearance.
        `

      case "ghibli":
        return `
          Create a Studio Ghibli-inspired illustrated certificate titled "${fields.title}".
          
          Style: Soft watercolor textures, warm earthy colors (sage green, cream, soft gold), 
          hand-painted aesthetic with subtle magical whimsical details. Think Howl's Moving 
          Castle meets a formal document.
          
          Layout requirements:
          - Hand-lettered style title "${fields.title}" at top
          - Present information in a scroll or parchment-like format:
            ${baseText}
          - Include gentle nature motifs (leaves, clouds, stars) in borders
          - Soft gradient backgrounds with painterly textures
          - Mix of hand-drawn and printed typography styles
          - Small enchanting details (tiny spirits, floating petals)
          - "Certificate of Investment" in artistic script
          
          Enchanting, warm, and nostalgic but still readable and formal enough for 
          a financial document. Should evoke wonder while maintaining professionalism.
        `

      default:
        return `Create a professional bond certificate titled "${fields.title}" with the following details: ${baseText}`
    }
  }

  // Fallback for other contexts (future expansion)
  return `Create a professional ${context} document with the following information: ${baseText}`
}

/**
 * Generate NFT certificate image using OpenAI GPT Image
 */
export async function generateCertificateImage(
  params: ImageGenerationParams
): Promise<ImageGenerationResult> {
  try {
    // Validate OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured")
    }

    // Build the prompt
    const prompt = buildPrompt({
      context: params.context,
      style: params.style,
      fields: params.fields,
    })

    console.log(`[NFT Image] Generating ${params.style} certificate for bond ${params.bond_id}...`)

    // Call OpenAI Images API with gpt-image-1 model
    const result = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: params.size || "1024x1024",
      quality: params.quality || "high",
      background: params.background || "opaque",
      n: 1,
    })

    // Extract base64 image data
    if (!result.data || result.data.length === 0) {
      throw new Error("No image data returned from OpenAI")
    }
    
    const imageBase64 = result.data[0].b64_json

    if (!imageBase64) {
      throw new Error("No image data returned from OpenAI")
    }

    // Generate unique image ID
    const imageId = `img_${crypto.randomUUID()}`

    console.log(`[NFT Image] ✅ Generated image ${imageId}`)

    return {
      image_id: imageId,
      bond_id: params.bond_id,
      style: params.style,
      prompt_used: prompt,
      image_base64: imageBase64,
      status: "completed",
      generated_at: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error("[NFT Image] ❌ Generation failed:", error)

    return {
      image_id: `img_err_${Date.now()}`,
      bond_id: params.bond_id,
      style: params.style,
      prompt_used: "",
      image_base64: "",
      status: "failed",
      generated_at: new Date().toISOString(),
      error: error.message || "Image generation failed",
    }
  }
}

/**
 * Generate thumbnail from base64 image
 * (Simplified version - in production use sharp or similar)
 */
export function generateThumbnail(imageBase64: string): string {
  // For now, return the same image
  // In production, use sharp or similar to create actual thumbnail
  return imageBase64
}

/**
 * Check if image generation is enabled
 */
export function isImageGenerationEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY
}

/**
 * Get estimated cost for image generation
 */
export function estimateImageCost(params: {
  size: string
  quality: string
}): { tokens: number; estimatedCost: string } {
  // Cost table from OpenAI docs
  const costs = {
    "1024x1024": { low: 272, medium: 1056, high: 4160 },
    "1024x1536": { low: 408, medium: 1584, high: 6240 },
    "1536x1024": { low: 400, medium: 1568, high: 6208 },
  }

  const tokens = costs[params.size as keyof typeof costs]?.[params.quality as keyof typeof costs["1024x1024"]] || 4160

  // Rough estimate at $0.01 per 1000 tokens (adjust based on actual pricing)
  const cost = (tokens / 1000) * 0.01

  return {
    tokens,
    estimatedCost: `$${cost.toFixed(4)}`,
  }
}


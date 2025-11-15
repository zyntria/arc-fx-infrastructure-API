/**
 * Simplified Storage Service for Storacha
 * Uses storacha CLI for uploads instead of client library
 */

import crypto from "crypto"
import { exec } from "child_process"
import { promisify } from "util"
import fs from "fs/promises"
import path from "path"

const execAsync = promisify(exec)

export interface StorageResult {
  cid: string
  ipfs_url: string
  gateway_url: string
  storage_type: "ipfs" | "mock"
}

/**
 * Upload using storacha CLI
 */
export async function uploadImageToIPFS(params: {
  bondId?: string
  buffer: Buffer
  filename?: string
  contentType?: string
}): Promise<StorageResult> {
  const { bondId, buffer, filename = "image.png" } = params

  // Try using storacha CLI
  try {
    // Create temp file
    const tempDir = '/tmp'
    const tempFile = path.join(tempDir, `storacha-upload-${Date.now()}-${filename}`)
    
    await fs.writeFile(tempFile, buffer)

    console.log('[Storage] Uploading via storacha CLI...')
    
    // Upload with storacha CLI
    const { stdout, stderr } = await execAsync(`storacha upload ${tempFile}`)
    
    // Parse CID from output
    const cidMatch = stdout.match(/bafy[a-z0-9]+/i)
    
    if (cidMatch) {
      const cid = cidMatch[0]
      
      // Cleanup temp file
      await fs.unlink(tempFile).catch(() => {})
      
      console.log('[Storage] ✅ Uploaded to IPFS:', cid)
      
      return {
        cid,
        ipfs_url: `ipfs://${cid}`,
        gateway_url: `https://w3s.link/ipfs/${cid}`,
        storage_type: "ipfs"
      }
    }
    
    throw new Error('Could not parse CID from storacha output')
    
  } catch (error: any) {
    console.log('[Storage] CLI upload failed:', error.message)
    console.log('[Storage] Falling back to mock storage')
    
    // Fallback to mock
    return uploadImageMock(params)
  }
}

/**
 * Upload metadata to IPFS
 */
export async function uploadMetadataToIPFS(params: {
  metadata: object
  filename?: string
}): Promise<StorageResult> {
  const { metadata, filename = "metadata.json" } = params

  try {
    const jsonString = JSON.stringify(metadata, null, 2)
    const buffer = Buffer.from(jsonString)
    
    return await uploadImageToIPFS({
      buffer,
      filename,
      contentType: 'application/json'
    })
  } catch (error: any) {
    console.error('[Storage] Metadata upload failed:', error.message)
    return uploadMetadataMock(params)
  }
}

/**
 * Mock storage fallback
 */
function uploadImageMock(params: {
  bondId?: string
  buffer: Buffer
}): StorageResult {
  const hash = crypto.createHash("sha256").update(params.buffer).digest("hex")
  const mockCid = `bafybei${hash.slice(0, 52)}`

  console.log(`[Storage] 🔄 Using mock storage: ${mockCid}`)

  return {
    cid: mockCid,
    ipfs_url: `ipfs://${mockCid}`,
    gateway_url: `https://w3s.link/ipfs/${mockCid}`,
    storage_type: "mock",
  }
}

function uploadMetadataMock(params: { metadata: object }): StorageResult {
  const jsonString = JSON.stringify(params.metadata)
  const hash = crypto.createHash("sha256").update(jsonString).digest("hex")
  const mockCid = `bafybei${hash.slice(0, 52)}`

  console.log(`[Storage] 🔄 Using mock metadata storage: ${mockCid}`)

  return {
    cid: mockCid,
    ipfs_url: `ipfs://${mockCid}`,
    gateway_url: `https://w3s.link/ipfs/${mockCid}`,
    storage_type: "mock",
  }
}

/**
 * Get storage status
 */
export async function getStorageStatus(): Promise<{
  configured: boolean
  provider: string
  message: string
  working: boolean
}> {
  try {
    // Check if storacha CLI is available
    await execAsync('which storacha')
    
    // Check if logged in
    const { stdout } = await execAsync('storacha space ls')
    
    if (stdout.includes('did:key:')) {
      return {
        configured: true,
        provider: "Storacha (CLI)",
        message: "Storacha CLI is configured and ready",
        working: true
      }
    }
  } catch {}

  return {
    configured: false,
    provider: "Mock",
    message: "Storacha CLI not available. Run: storacha login",
    working: false
  }
}

/**
 * Generate thumbnail
 */
export async function generateThumbnail(params: {
  bondId?: string
  buffer: Buffer
}): Promise<string> {
  const result = await uploadImageToIPFS({
    bondId: params.bondId,
    buffer: params.buffer,
    filename: `${params.bondId || "nft"}-thumb.png`,
  })

  return result.gateway_url
}


/**
 * Bond Certificate NFT Service
 * Handles minting, redemption, and queries for bond NFTs
 */

import { ethers } from "ethers"
import * as dotenv from "dotenv"

dotenv.config()

// Minimal ABI for BondCertificateNFT contract
const BOND_NFT_ABI = [
  "function mintCertificate(address to, string bondId, string seriesName, uint256 units, uint256 principalPerUnit, uint256 couponRateBps, uint256 maturityDate, string currency, uint8 transferability, string metadataURI) external returns (uint256)",
  "function redeemCertificate(uint256 tokenId) external",
  "function getCertificate(uint256 tokenId) external view returns (tuple(string bondId, string seriesName, address investor, uint256 units, uint256 principalPerUnit, uint256 couponRateBps, uint256 issueDate, uint256 maturityDate, string currency, uint8 transferability, bool redeemed))",
  "function getCertificatesByInvestor(address investor) external view returns (uint256[])",
  "event CertificateMinted(uint256 indexed tokenId, string bondId, address indexed investor, uint256 units)",
]

// Transferability enum
export enum Transferability {
  SOULBOUND = 0,
  RESTRICTED = 1,
  FREELY = 2,
}

// Check if NFT contract is configured
function isNFTEnabled(): boolean {
  return !!(
    process.env.BOND_NFT_CONTRACT &&
    process.env.PRIVATE_KEY &&
    process.env.ARC_RPC_URL
  )
}

// Get NFT contract instance
function getNFTContract() {
  if (!isNFTEnabled()) {
    throw new Error("NFT contract not configured")
  }

  const provider = new ethers.JsonRpcProvider(process.env.ARC_RPC_URL!)
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider)
  const contract = new ethers.Contract(
    process.env.BOND_NFT_CONTRACT!,
    BOND_NFT_ABI,
    wallet
  )

  return { contract, wallet }
}

/**
 * Mint a bond certificate NFT
 */
export async function mintBondNFT(params: {
  investorWallet: string
  bondId: string
  seriesName: string
  units: number
  principalPerUnit: string
  couponRateBps: number
  maturityDate: Date
  currency: string
  transferability: Transferability
}): Promise<{
  tokenId: string
  txHash: string
  success: boolean
  error?: string
}> {
  try {
    // If NFT not enabled, return mock data
    if (!isNFTEnabled()) {
      console.warn("NFT contract not configured, returning mock token ID")
      return {
        tokenId: `${100000 + Math.floor(Math.random() * 10000)}`,
        txHash: `0xMOCK_${Date.now().toString(36)}`,
        success: true,
      }
    }

    const { contract } = getNFTContract()

    // Generate metadata URI (in production, upload to IPFS)
    const metadataURI = `https://api.zynfx.com/metadata/bonds/${params.bondId}/${params.investorWallet}`

    // Convert maturityDate to Unix timestamp
    const maturityTimestamp = Math.floor(params.maturityDate.getTime() / 1000)

    // Convert principal to wei (assuming 6 decimals for USDC)
    const principalWei = ethers.parseUnits(params.principalPerUnit, 6)

    // Mint the NFT
    const tx = await contract.mintCertificate(
      params.investorWallet,
      params.bondId,
      params.seriesName,
      params.units,
      principalWei,
      params.couponRateBps,
      maturityTimestamp,
      params.currency,
      params.transferability,
      metadataURI
    )

    console.log(`Minting NFT for bond ${params.bondId}, tx: ${tx.hash}`)

    // Wait for confirmation
    const receipt = await tx.wait()

    // Parse the CertificateMinted event to get token ID
    const event = receipt.logs.find((log: any) => {
      try {
        const parsed = contract.interface.parseLog(log)
        return parsed?.name === "CertificateMinted"
      } catch {
        return false
      }
    })

    let tokenId = "100000" // Fallback
    if (event) {
      const parsed = contract.interface.parseLog(event)
      tokenId = parsed?.args.tokenId.toString()
    }

    return {
      tokenId,
      txHash: receipt.hash,
      success: true,
    }
  } catch (error: any) {
    console.error("Error minting NFT:", error)
    return {
      tokenId: "",
      txHash: "",
      success: false,
      error: error.message || "Failed to mint NFT",
    }
  }
}

/**
 * Redeem a bond certificate NFT
 */
export async function redeemBondNFT(tokenId: string): Promise<{
  txHash: string
  success: boolean
  error?: string
}> {
  try {
    if (!isNFTEnabled()) {
      return {
        txHash: `0xMOCK_REDEEM_${Date.now().toString(36)}`,
        success: true,
      }
    }

    const { contract } = getNFTContract()

    const tx = await contract.redeemCertificate(tokenId)
    const receipt = await tx.wait()

    return {
      txHash: receipt.hash,
      success: true,
    }
  } catch (error: any) {
    console.error("Error redeeming NFT:", error)
    return {
      txHash: "",
      success: false,
      error: error.message || "Failed to redeem NFT",
    }
  }
}

/**
 * Get bond certificate details
 */
export async function getBondCertificate(tokenId: string) {
  if (!isNFTEnabled()) {
    return null
  }

  try {
    const { contract } = getNFTContract()
    const cert = await contract.getCertificate(tokenId)
    return cert
  } catch (error) {
    console.error("Error getting certificate:", error)
    return null
  }
}

/**
 * Get all certificates for an investor
 */
export async function getInvestorCertificates(investorWallet: string): Promise<string[]> {
  if (!isNFTEnabled()) {
    return []
  }

  try {
    const { contract } = getNFTContract()
    const tokenIds = await contract.getCertificatesByInvestor(investorWallet)
    return tokenIds.map((id: bigint) => id.toString())
  } catch (error) {
    console.error("Error getting investor certificates:", error)
    return []
  }
}

/**
 * Check if NFT minting is enabled
 */
export function isNFTMintingEnabled(): boolean {
  return isNFTEnabled()
}


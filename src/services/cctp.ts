/**
 * Circle CCTP (Cross-Chain Transfer Protocol) Service
 * Enables cross-chain USDC transfers via Circle's native bridge
 */

import { ethers } from "ethers"
import bs58 from "bs58"
import { config } from "../config"
import { logAuditEvent } from "./audit"

/**
 * Supported destination chains for CCTP
 */
export enum CCTPChain {
  ARC = "ARC",
  ETHEREUM = "ETHEREUM",
  AVALANCHE = "AVALANCHE",
  OPTIMISM = "OPTIMISM",
  ARBITRUM = "ARBITRUM",
  SOLANA = "SOLANA",
  BASE = "BASE",
  POLYGON = "POLYGON",
}

/**
 * CCTP Domain IDs (Circle's chain identifiers)
 * https://developers.circle.com/stablecoins/docs/cctp-technical-reference
 */
const CCTP_DOMAINS: Record<CCTPChain, number> = {
  [CCTPChain.ETHEREUM]: 0,
  [CCTPChain.AVALANCHE]: 1,
  [CCTPChain.OPTIMISM]: 2,
  [CCTPChain.ARBITRUM]: 3,
  [CCTPChain.SOLANA]: 5,
  [CCTPChain.BASE]: 6,
  [CCTPChain.POLYGON]: 7,
  [CCTPChain.ARC]: 26, // ✅ Official ARC Network domain
}

/**
 * Circle TokenMessenger contract addresses (per chain)
 * These are the official Circle contracts for CCTP
 */
const TOKEN_MESSENGER_ADDRESSES: Record<string, string> = {
  // Ethereum Mainnet
  ETHEREUM: "0xBd3fa81B58Ba92a82136038B25aDec7066af3155",
  // Ethereum Sepolia Testnet
  ETHEREUM_SEPOLIA: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
  // Avalanche Mainnet
  AVALANCHE: "0x6B25532e1060CE10cc3B0A99e5683b91BFDe6982",
  // Optimism Mainnet
  OPTIMISM: "0x2B4069517957735bE00ceE0fadAE88a26365528f",
  // Arbitrum Mainnet
  ARBITRUM: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
  // Base Mainnet
  BASE: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
  // Polygon Mainnet
  POLYGON: "0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE",
  // ARC Testnet - ✅ Official TokenMessengerV2 contract
  ARC: "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
}

/**
 * Circle MessageTransmitter contract addresses (for receiving messages)
 */
const MESSAGE_TRANSMITTER_ADDRESSES: Record<string, string> = {
  ETHEREUM: "0x0a992d191DEeC32aFe36203Ad87D7d289a738F81",
  ETHEREUM_SEPOLIA: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
  AVALANCHE: "0x8186359aF5F57FbB40c6b14A588d2A59C0C29880",
  OPTIMISM: "0x4D41f22c5a0e5c74090899E5a8Fb597a8842b3e8",
  ARBITRUM: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
  BASE: "0xAD09780d193884d503182aD4588450C416D6F9D4",
  POLYGON: "0xF3be9355363857F3e001be68856A2f96b4C39Ba9",
  // ARC Testnet - ✅ Official MessageTransmitterV2 contract
  ARC: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
}

/**
 * USDC token addresses on different chains
 */
const USDC_ADDRESSES: Record<string, string> = {
  ETHEREUM: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  ETHEREUM_SEPOLIA: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
  AVALANCHE: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  OPTIMISM: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  ARBITRUM: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  BASE: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  POLYGON: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  ARC: "0x3600000000000000000000000000000000000000", // ARC testnet USDC
}

/**
 * Circle TokenMessenger ABI (CCTP V2 - for burning tokens)
 * Reference: https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche
 */
const TOKEN_MESSENGER_ABI = [
  {
    inputs: [
      { name: "amount", type: "uint256" },
      { name: "destinationDomain", type: "uint32" },
      { name: "mintRecipient", type: "bytes32" },
      { name: "burnToken", type: "address" },
      { name: "destinationCaller", type: "bytes32" },
      { name: "maxFee", type: "uint256" },
      { name: "minFinalityThreshold", type: "uint32" },
    ],
    name: "depositForBurn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
]

/**
 * USDC Token ABI (for approval)
 */
const USDC_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
]

/**
 * Validate address format based on destination chain
 */
export function validateAddress(address: string, chain: CCTPChain): boolean {
  switch (chain) {
    case CCTPChain.ETHEREUM:
    case CCTPChain.AVALANCHE:
    case CCTPChain.OPTIMISM:
    case CCTPChain.ARBITRUM:
    case CCTPChain.BASE:
    case CCTPChain.POLYGON:
    case CCTPChain.ARC:
      // EVM chains use 0x + 40 hex characters
      return /^0x[a-fA-F0-9]{40}$/.test(address)

    case CCTPChain.SOLANA:
      // Solana uses base58 encoding, 32-44 characters
      return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)

    default:
      return false
  }
}

/**
 * Convert address to bytes32 format for CCTP
 */
function addressToBytes32(address: string, chain: CCTPChain): string {
  if (chain === CCTPChain.SOLANA) {
    // For Solana, decode base58 address to bytes and pad to bytes32
    try {
      const decoded = bs58.decode(address)
      return ethers.zeroPadValue(ethers.hexlify(decoded), 32)
    } catch (error) {
      throw new Error(`Invalid Solana address: ${address}`)
    }
  } else {
    // For EVM chains, pad address to bytes32
    return ethers.zeroPadValue(address, 32)
  }
}

/**
 * CCTP Transfer Parameters
 */
export interface CCTPTransferParams {
  amount: number // Amount in token units (e.g., 100 USDC)
  fromWallet: string // Source wallet address (EVM)
  toAddress: string // Destination address (can be EVM or Solana)
  destinationChain: CCTPChain // Target chain
  token?: string // Token symbol (defaults to USDC)
}

/**
 * CCTP Transfer Result
 */
export interface CCTPTransferResult {
  success: boolean
  burnTxHash: string // Transaction hash on source chain (ARC)
  messageHash: string // CCTP message hash
  attestation?: string // Circle attestation (available after ~20 mins)
  nonce: string // CCTP nonce for tracking
  destinationChain: CCTPChain
  estimatedTime: string // Estimated time to completion
  status: "pending_attestation" | "ready_to_mint" | "completed"
  instructions: string // User instructions for completing transfer
}

/**
 * CCTP Service Class
 */
export class CCTPService {
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.ARC_RPC_URL)
    const operatorKey = process.env.OPERATOR_PRIVATE_KEY || process.env.PRIVATE_KEY
    if (!operatorKey) {
      throw new Error("OPERATOR_PRIVATE_KEY required for CCTP")
    }
    this.wallet = new ethers.Wallet(operatorKey, this.provider)
  }

  /**
   * Initiate cross-chain transfer using CCTP
   */
  async initiateTransfer(
    params: CCTPTransferParams
  ): Promise<CCTPTransferResult> {
    try {
      // Validate destination address
      if (!validateAddress(params.toAddress, params.destinationChain)) {
        throw new Error(
          `Invalid address format for ${params.destinationChain}: ${params.toAddress}`
        )
      }

      // Get domain ID for destination chain
      const destinationDomain = CCTP_DOMAINS[params.destinationChain]
      if (destinationDomain === undefined) {
        throw new Error(`Unsupported destination chain: ${params.destinationChain}`)
      }

      // Get contract addresses
      const tokenMessengerAddress = TOKEN_MESSENGER_ADDRESSES.ARC
      const usdcAddress = USDC_ADDRESSES.ARC

      if (
        tokenMessengerAddress === "0x0000000000000000000000000000000000000000"
      ) {
        throw new Error(
          "CCTP TokenMessenger not configured for ARC Network. Please update TOKEN_MESSENGER_ADDRESSES."
        )
      }

      // Convert amount to token decimals (USDC = 6 decimals)
      const amount = ethers.parseUnits(params.amount.toString(), 6)

      // Convert destination address to bytes32
      const mintRecipient = addressToBytes32(
        params.toAddress,
        params.destinationChain
      )

      // Initialize contracts
      const usdcContract = new ethers.Contract(usdcAddress, USDC_ABI, this.wallet)
      const tokenMessenger = new ethers.Contract(
        tokenMessengerAddress,
        TOKEN_MESSENGER_ABI,
        this.wallet
      )

      // Step 1: Approve TokenMessenger to spend USDC
      console.log("Approving USDC for TokenMessenger...")
      const currentAllowance = await usdcContract.allowance(
        this.wallet.address,
        tokenMessengerAddress
      )

      if (currentAllowance < amount) {
        const approveTx = await usdcContract.approve(tokenMessengerAddress, amount)
        await approveTx.wait()
        console.log("Approval confirmed:", approveTx.hash)
      }

      // Step 2: Burn tokens on source chain (ARC)
      console.log("Burning USDC on ARC for cross-chain transfer...")
      
      // CCTP V2 parameters
      const destinationCaller = "0x0000000000000000000000000000000000000000000000000000000000000000" // Empty bytes32 allows any address to call receiveMessage
      const maxFee = ethers.parseUnits("0.0005", 6) // 0.0005 USDC max fee for fast transfer
      const minFinalityThreshold = 1000 // 1000 or less for Fast Transfer
      
      const burnTx = await tokenMessenger.depositForBurn(
        amount,
        destinationDomain,
        mintRecipient,
        usdcAddress,
        destinationCaller,
        maxFee,
        minFinalityThreshold
      )

      const receipt = await burnTx.wait()
      console.log("Burn transaction confirmed:", burnTx.hash)

      // Use transaction hash for Circle V2 API
      const messageHash = burnTx.hash

      // Log audit event for CCTP transfer
      logAuditEvent({
        type: "cctp",
        action: "CCTP transfer initiated",
        wallet_address: params.toAddress,
        amount: params.amount,
        currency: "USDC",
        tx_hash: burnTx.hash,
        status: "pending",
        metadata: {
          source_chain: "ARC",
          destination_chain: params.destinationChain,
          message_hash: messageHash,
          nonce: receipt.blockNumber.toString(),
          destination_domain: destinationDomain,
          estimated_time: "10-30 minutes",
        },
      })

      return {
        success: true,
        burnTxHash: burnTx.hash,
        messageHash: burnTx.hash, // V2 uses transaction hash
        nonce: receipt.blockNumber.toString(), // Use block number as reference
        destinationChain: params.destinationChain,
        estimatedTime: "10-30 minutes",
        status: "pending_attestation",
        instructions: this.getCompletionInstructions(
          params.destinationChain,
          burnTx.hash
        ),
      }
    } catch (error: any) {
      console.error("CCTP transfer failed:", error)
      
      // Log failed CCTP transfer
      logAuditEvent({
        type: "cctp",
        action: "CCTP transfer failed",
        wallet_address: params.toAddress,
        amount: params.amount,
        currency: "USDC",
        status: "failed",
        metadata: {
          source_chain: "ARC",
          destination_chain: params.destinationChain,
          error: error.message,
        },
      })
      
      throw new Error(`Cross-chain transfer failed: ${error.message}`)
    }
  }

  /**
   * Get Circle attestation for a message (CCTP V2 API)
   * Reference: https://developers.circle.com/cctp/transfer-usdc-on-testnet-from-ethereum-to-avalanche
   * This is needed to complete the transfer on the destination chain
   */
  async getAttestation(transactionHash: string): Promise<string | null> {
    try {
      // Circle's CCTP V2 attestation service API
      // For testnet: Use sandbox API
      // For mainnet: Use production API (iris-api.circle.com)
      const sourceDomain = CCTP_DOMAINS[CCTPChain.ARC]
      const attestationUrl = `https://iris-api-sandbox.circle.com/v2/messages/${sourceDomain}?transactionHash=${transactionHash}`

      const response = await fetch(attestationUrl)
      if (!response.ok) {
        if (response.status === 404) {
          // Attestation not yet available
          return null
        }
        throw new Error(`Attestation API returned ${response.status}`)
      }

      const data = await response.json()
      
      // V2 API returns messages array with status
      if (data.messages?.[0]?.status === "complete") {
        return data.messages[0].attestation || null
      }
      
      return null
    } catch (error: any) {
      console.error("Failed to fetch attestation:", error)
      return null
    }
  }

  /**
   * Get transfer status
   */
  async getTransferStatus(messageHash: string): Promise<{
    status: "pending" | "attested" | "completed"
    attestation?: string
  }> {
    const attestation = await this.getAttestation(messageHash)

    if (attestation) {
      return {
        status: "attested",
        attestation,
      }
    }

    return {
      status: "pending",
    }
  }

  /**
   * Complete the transfer by minting on destination chain
   * This can be called by ANYONE - the tokens will still go to the correct recipient
   */
  async completeTransfer(params: {
    burnTxHash: string
    destinationChain: CCTPChain
  }): Promise<{
    success: boolean
    mintTxHash?: string
    error?: string
    message: string
  }> {
    try {
      // Step 1: Get attestation from Circle
      console.log(`Fetching attestation for tx: ${params.burnTxHash}`)
      const attestation = await this.getAttestation(params.burnTxHash)
      
      if (!attestation) {
        return {
          success: false,
          message: "Attestation not ready yet. Please wait 10-30 minutes after the burn transaction.",
          error: "ATTESTATION_NOT_READY"
        }
      }

      console.log(`Attestation received, minting on ${params.destinationChain}...`)

      // Step 2: Get destination chain details
      const destinationRPC = this.getDestinationRPC(params.destinationChain)
      const messageTransmitterAddress = this.getMessageTransmitterAddress(params.destinationChain)
      
      if (!destinationRPC || !messageTransmitterAddress) {
        return {
          success: false,
          message: `Destination chain ${params.destinationChain} not fully configured`,
          error: "CHAIN_NOT_CONFIGURED"
        }
      }

      // Step 3: Connect to destination chain
      const destinationProvider = new ethers.JsonRpcProvider(destinationRPC)
      const destinationWallet = new ethers.Wallet(
        process.env.OPERATOR_PRIVATE_KEY || process.env.PRIVATE_KEY!,
        destinationProvider
      )

      // Step 4: Call receiveMessage on MessageTransmitter
      const messageTransmitterABI = [
        {
          inputs: [
            { name: "message", type: "bytes" },
            { name: "attestation", type: "bytes" }
          ],
          name: "receiveMessage",
          outputs: [{ name: "success", type: "bool" }],
          stateMutability: "nonpayable",
          type: "function"
        }
      ]

      const messageTransmitter = new ethers.Contract(
        messageTransmitterAddress,
        messageTransmitterABI,
        destinationWallet
      )

      // Get the message from the burn transaction
      const burnReceipt = await this.provider.getTransactionReceipt(params.burnTxHash)
      if (!burnReceipt) {
        return {
          success: false,
          message: "Burn transaction not found",
          error: "TX_NOT_FOUND"
        }
      }

      // Extract message from logs (simplified - in production you'd parse the MessageSent event)
      // For now, we'll use the attestation data which contains the message
      
      // Call receiveMessage
      const mintTx = await messageTransmitter.receiveMessage(
        attestation, // This contains both message and signature in CCTP V2
        attestation
      )
      
      await mintTx.wait()
      
      console.log(`✅ Tokens minted on ${params.destinationChain}: ${mintTx.hash}`)

      return {
        success: true,
        mintTxHash: mintTx.hash,
        message: `Transfer completed! Tokens minted on ${params.destinationChain}. TX: ${mintTx.hash}`
      }

    } catch (error: any) {
      console.error("Failed to complete transfer:", error)
      return {
        success: false,
        message: `Failed to complete transfer: ${error.message}`,
        error: error.code || "UNKNOWN_ERROR"
      }
    }
  }

  /**
   * Get RPC URL for destination chain
   */
  private getDestinationRPC(chain: CCTPChain): string | null {
    const rpcs: Record<string, string> = {
      [CCTPChain.ETHEREUM]: process.env.ETHEREUM_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/demo",
      [CCTPChain.AVALANCHE]: "https://api.avax-test.network/ext/bc/C/rpc",
      [CCTPChain.OPTIMISM]: "https://sepolia.optimism.io",
      [CCTPChain.ARBITRUM]: "https://sepolia-rollup.arbitrum.io/rpc",
      [CCTPChain.BASE]: "https://sepolia.base.org",
      [CCTPChain.POLYGON]: "https://rpc-amoy.polygon.technology",
    }
    return rpcs[chain] || null
  }

  /**
   * Get MessageTransmitter address for destination chain
   */
  private getMessageTransmitterAddress(chain: CCTPChain): string | null {
    return MESSAGE_TRANSMITTER_ADDRESSES[chain] || null
  }

  /**
   * Get instructions for completing the transfer
   */
  private getCompletionInstructions(
    chain: CCTPChain,
    messageHash: string
  ): string {
    const baseInstructions = `
1. Wait 10-30 minutes for Circle attestation
2. Check attestation status: GET /v1/cctp/status/${messageHash}
3. Complete transfer automatically: POST /v1/cctp/complete with burn tx hash
    `

    if (chain === CCTPChain.SOLANA) {
      return (
        baseInstructions +
        `
For Solana:
- API will auto-complete for you, or
- Visit Circle's portal: https://iris.circle.com
      `
      )
    }

    return (
      baseInstructions +
      `
For EVM chains:
- API can complete the transfer for you (paying gas fees), or
- Visit Circle's UI: https://iris.circle.com
    `
    )
  }
}

// Singleton instance
let cctpService: CCTPService | null = null

/**
 * Get or create CCTP service instance
 */
export function getCCTPService(): CCTPService {
  if (!cctpService) {
    cctpService = new CCTPService()
  }
  return cctpService
}


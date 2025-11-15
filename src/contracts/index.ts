/**
 * Contract Service Layer
 * Handles all blockchain interactions with deployed smart contracts
 */

import { ethers } from "ethers"
import { config } from "../config"
import ARCfxSettlementABI from "./ARCfxSettlement.json"
import ARCfxPayoutsABI from "./ARCfxPayouts.json"

// Token addresses on ARC testnet
export const TOKEN_ADDRESSES: Record<string, string> = {
  USDC: "0x3600000000000000000000000000000000000000",
  EURC: "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a",
  USYC: "0x0000000000000000000000000000000000000000", // Placeholder
}

/**
 * Get token address by currency symbol
 */
export function getTokenAddress(currency: string): string {
  const address = TOKEN_ADDRESSES[currency]
  if (!address) {
    throw new Error(`Unsupported currency: ${currency}`)
  }
  return address
}

/**
 * Contract Service Class
 */
export class ContractService {
  private provider: ethers.JsonRpcProvider
  private wallet: ethers.Wallet
  private settlementContract: ethers.Contract
  private payoutsContract: ethers.Contract

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(config.ARC_RPC_URL)

    // Initialize wallet (use deployment key or operator key)
    const operatorKey = process.env.OPERATOR_PRIVATE_KEY || process.env.PRIVATE_KEY
    if (!operatorKey) {
      throw new Error("OPERATOR_PRIVATE_KEY or PRIVATE_KEY not found in environment")
    }
    this.wallet = new ethers.Wallet(operatorKey, this.provider)

    // Initialize contracts
    if (!config.CONTRACT_SETTLEMENT || !config.CONTRACT_PAYOUTS) {
      throw new Error("Contract addresses not configured")
    }

    this.settlementContract = new ethers.Contract(
      config.CONTRACT_SETTLEMENT,
      ARCfxSettlementABI.abi,
      this.wallet
    )

    this.payoutsContract = new ethers.Contract(
      config.CONTRACT_PAYOUTS,
      ARCfxPayoutsABI.abi,
      this.wallet
    )
  }

  /**
   * Log a settlement on-chain
   */
  async logSettlement(params: {
    fromCurrency: string
    toCurrency: string
    amountIn: number
    amountOut: number
    fromWallet: string
    toWallet: string
    referenceId: string
  }) {
    try {
      const fromToken = getTokenAddress(params.fromCurrency)
      const toToken = getTokenAddress(params.toCurrency)

      // Convert amounts to proper decimals (6 for stablecoins)
      const amountInWei = ethers.parseUnits(params.amountIn.toString(), 6)
      const amountOutWei = ethers.parseUnits(params.amountOut.toString(), 6)

      // Call contract
      const tx = await this.settlementContract.logSettlement(
        fromToken,
        toToken,
        amountInWei,
        amountOutWei,
        params.fromWallet,
        params.toWallet,
        params.referenceId
      )

      // Wait for transaction to be mined
      const receipt = await tx.wait()

      return {
        success: true,
        txHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "finalized" : "failed",
      }
    } catch (error: any) {
      console.error("Settlement logging failed:", error)
      throw new Error(`Failed to log settlement: ${error.message}`)
    }
  }

  /**
   * Execute batch payouts on-chain
   */
  async executeBatchPayouts(
    payouts: Array<{
      to: string
      currency: string
      amount: number
      metadata?: string
    }>
  ) {
    try {
      // Prepare payout structs for contract
      const payoutStructs = payouts.map((p) => ({
        to: p.to,
        token: getTokenAddress(p.currency),
        amount: ethers.parseUnits(p.amount.toString(), 6),
        metadata: p.metadata || "",
      }))

      // Call contract
      const tx = await this.payoutsContract.executePayouts(payoutStructs)

      // Wait for transaction to be mined
      const receipt = await tx.wait()

      // Parse events from receipt to get batch ID
      let batchId = "0x0"
      if (receipt.logs && receipt.logs.length > 0) {
        try {
          const parsedLog = this.payoutsContract.interface.parseLog({
            topics: [...receipt.logs[receipt.logs.length - 1].topics],
            data: receipt.logs[receipt.logs.length - 1].data,
          })
          if (parsedLog && parsedLog.args && parsedLog.args.batchId) {
            batchId = parsedLog.args.batchId
          }
        } catch (e) {
          // Log parsing failed, use default
        }
      }

      return {
        success: true,
        txHash: tx.hash,
        batchId,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? "finalized" : "failed",
      }
    } catch (error: any) {
      console.error("Batch payout execution failed:", error)
      throw new Error(`Failed to execute payouts: ${error.message}`)
    }
  }

  /**
   * Get settlement count from contract
   */
  async getSettlementCount(): Promise<number> {
    try {
      const count = await this.settlementContract.settlementCount()
      return Number(count)
    } catch (error) {
      console.error("Failed to get settlement count:", error)
      return 0
    }
  }

  /**
   * Get batch count from contract
   */
  async getBatchCount(): Promise<number> {
    try {
      const count = await this.payoutsContract.batchCount()
      return Number(count)
    } catch (error) {
      console.error("Failed to get batch count:", error)
      return 0
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(): Promise<bigint> {
    try {
      const feeData = await this.provider.getFeeData()
      return feeData.gasPrice || BigInt(0)
    } catch (error) {
      console.error("Failed to get gas price:", error)
      return BigInt(0)
    }
  }

  /**
   * Get current block number
   */
  async getBlockNumber(): Promise<number> {
    try {
      return await this.provider.getBlockNumber()
    } catch (error) {
      console.error("Failed to get block number:", error)
      return 0
    }
  }
}

// Singleton instance
let contractService: ContractService | null = null

/**
 * Get or create contract service instance
 */
export function getContractService(): ContractService {
  if (!contractService) {
    contractService = new ContractService()
  }
  return contractService
}


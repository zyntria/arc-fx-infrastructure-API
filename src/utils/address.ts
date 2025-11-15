/**
 * Address Validation Utilities
 * Supports multiple blockchain address formats
 */

import { CCTPChain } from "../services/cctp"

/**
 * Validate EVM address (Ethereum, ARC, etc.)
 */
export function isValidEVMAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Validate Solana address (base58)
 */
export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)
}

/**
 * Validate address for specific chain
 */
export function isValidAddressForChain(
  address: string,
  chain: CCTPChain | "ARC"
): boolean {
  // Convert "ARC" string to CCTPChain enum if needed
  const chainEnum = chain === "ARC" ? CCTPChain.ARC : chain

  switch (chainEnum) {
    case CCTPChain.ETHEREUM:
    case CCTPChain.AVALANCHE:
    case CCTPChain.OPTIMISM:
    case CCTPChain.ARBITRUM:
    case CCTPChain.BASE:
    case CCTPChain.POLYGON:
    case CCTPChain.ARC:
      return isValidEVMAddress(address)

    case CCTPChain.SOLANA:
      return isValidSolanaAddress(address)

    default:
      return false
  }
}

/**
 * Detect chain type from address format
 */
export function detectChainFromAddress(
  address: string
): "EVM" | "SOLANA" | "UNKNOWN" {
  if (isValidEVMAddress(address)) return "EVM"
  if (isValidSolanaAddress(address)) return "SOLANA"
  return "UNKNOWN"
}

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address: string, length: number = 8): string {
  if (address.length <= length) return address

  const start = address.slice(0, length / 2 + 2) // +2 for "0x"
  const end = address.slice(-length / 2)
  return `${start}...${end}`
}


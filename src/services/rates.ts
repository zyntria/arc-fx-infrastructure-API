/**
 * FX Rate Service
 * Fetches real-time exchange rates for stablecoin conversions
 */

import { config } from "../config"

// Rate cache to avoid hitting API limits
interface RateCache {
  rates: Record<string, Record<string, number>>
  timestamp: number
  ttl: number // Time to live in milliseconds
}

let rateCache: RateCache | null = null
const CACHE_TTL = 60000 // 1 minute cache

/**
 * Currency pairs and their base currencies for API calls
 */
const CURRENCY_TO_FIAT: Record<string, string> = {
  USDC: "USD",
  EURC: "EUR",
  USYC: "USD", // Yield-bearing USD stablecoin
}

/**
 * Fetch real exchange rates from ExchangeRate-API (free tier)
 * Alternative: Can use CoinGecko, CurrencyAPI, or other providers
 */
async function fetchRealRates(): Promise<Record<string, Record<string, number>>> {
  try {
    // Using ExchangeRate-API (no key required for basic usage)
    const response = await fetch(
      "https://api.exchangerate-api.com/v4/latest/USD"
    )

    if (!response.ok) {
      throw new Error(`Rate API returned ${response.status}`)
    }

    const data = await response.json()
    const usdToEur = data.rates.EUR // e.g., 0.92

    // Calculate all currency pair rates
    const rates: Record<string, Record<string, number>> = {
      USDC: {
        EURC: usdToEur, // USDC to EURC
        USYC: 1.0, // USDC to USYC (both USD-based, 1:1 for simplicity)
      },
      EURC: {
        USDC: 1 / usdToEur, // EURC to USDC
        USYC: 1 / usdToEur, // EURC to USYC
      },
      USYC: {
        USDC: 1.0, // USYC to USDC (1:1)
        EURC: usdToEur, // USYC to EURC
      },
    }

    return rates
  } catch (error: any) {
    console.error("Failed to fetch real rates:", error.message)
    // Fallback to reasonable default rates if API fails
    return {
      USDC: { EURC: 0.92, USYC: 1.0 },
      EURC: { USDC: 1.087, USYC: 1.087 },
      USYC: { USDC: 1.0, EURC: 0.92 },
    }
  }
}

/**
 * Fetch real rates from CoinGecko API (alternative, more crypto-focused)
 * Uncomment to use CoinGecko instead of ExchangeRate-API
 */
async function fetchRatesFromCoinGecko(): Promise<
  Record<string, Record<string, number>>
> {
  try {
    // Fetch USDC and EURC prices in USD
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=usd-coin,euro-coin&vs_currencies=usd,eur"
    )

    if (!response.ok) {
      throw new Error(`CoinGecko API returned ${response.status}`)
    }

    const data = await response.json()

    // CoinGecko gives us prices, we calculate cross rates
    const usdcToUsd = data["usd-coin"]?.usd || 1.0
    const eurcToEur = data["euro-coin"]?.eur || 1.0

    // Get EUR/USD rate (approximate from market data)
    const eurToUsd = 1.08 // Approximate, update with real data if needed

    const rates: Record<string, Record<string, number>> = {
      USDC: {
        EURC: usdcToUsd / (eurcToEur * eurToUsd),
        USYC: 1.0,
      },
      EURC: {
        USDC: (eurcToEur * eurToUsd) / usdcToUsd,
        USYC: (eurcToEur * eurToUsd) / usdcToUsd,
      },
      USYC: {
        USDC: 1.0,
        EURC: usdcToUsd / (eurcToEur * eurToUsd),
      },
    }

    return rates
  } catch (error: any) {
    console.error("Failed to fetch rates from CoinGecko:", error.message)
    throw error
  }
}

/**
 * Get current FX rates (with caching)
 */
export async function getCurrentRates(): Promise<
  Record<string, Record<string, number>>
> {
  const now = Date.now()

  // Return cached rates if still valid
  if (rateCache && now - rateCache.timestamp < rateCache.ttl) {
    return rateCache.rates
  }

  // Fetch fresh rates
  const rates = await fetchRealRates()

  // Update cache
  rateCache = {
    rates,
    timestamp: now,
    ttl: CACHE_TTL,
  }

  return rates
}

/**
 * Get rate for a specific currency pair
 */
export async function getRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1.0
  }

  const rates = await getCurrentRates()
  const rate = rates[fromCurrency]?.[toCurrency]

  if (!rate) {
    throw new Error(
      `Rate not available for ${fromCurrency} to ${toCurrency}`
    )
  }

  return rate
}

/**
 * Get formatted rates for API response
 */
export async function getFormattedRates(baseCurrency: string = "USDC") {
  const allRates = await getCurrentRates()
  const baseRates = allRates[baseCurrency]

  if (!baseRates) {
    throw new Error(`Invalid base currency: ${baseCurrency}`)
  }

  return {
    timestamp: new Date().toISOString(),
    base: baseCurrency,
    source: "real-time-api",
    rates: baseRates,
  }
}

/**
 * Clear rate cache (useful for testing)
 */
export function clearRateCache() {
  rateCache = null
}


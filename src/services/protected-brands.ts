/**
 * Protected Brand Names
 * List of institutional brands that require extra verification
 */

export const PROTECTED_BRANDS = new Set([
  // Major Investment Banks
  'jp morgan',
  'jpmorgan',
  'j.p. morgan',
  'morgan stanley',
  'goldman sachs',
  'citigroup',
  'citi',
  'citibank',
  'bank of america',
  'bofa',
  'wells fargo',
  'hsbc',
  'barclays',
  'credit suisse',
  'ubs',
  'deutsche bank',
  
  // Hedge Funds
  'bridgewater',
  'bridgewater associates',
  'renaissance technologies',
  'renaissance',
  'citadel',
  'millennium',
  'millennium management',
  'two sigma',
  'de shaw',
  'd.e. shaw',
  'blackrock',
  'vanguard',
  'fidelity',
  'state street',
  
  // Private Equity
  'blackstone',
  'kkr',
  'carlyle',
  'carlyle group',
  'apollo',
  'apollo global',
  'tpg',
  'warburg pincus',
  
  // Asset Managers
  'pimco',
  'wellington',
  'capital group',
  'invesco',
  'franklin templeton',
  't. rowe price',
  'northern trust',
  
  // Sovereign Wealth Funds
  'temasek',
  'gic',
  'norges bank',
  'adia',
  'cic',
  'china investment corporation',
  
  // Tech/Crypto Giants
  'circle',
  'coinbase',
  'binance',
  'ftx', // Yes, even defunct ones
  'ripple',
  'tether',
  'grayscale',
  'microstrategy',
  
  // Exchanges
  'nyse',
  'nasdaq',
  'cboe',
  'cme',
  'ice',
  'lse',
  'london stock exchange',
])

/**
 * Check if a brand name requires extra verification
 */
export function isProtectedBrand(brandName: string): boolean {
  if (!brandName) return false
  const normalized = brandName.toLowerCase().trim()
  return PROTECTED_BRANDS.has(normalized)
}

/**
 * Normalize brand name for matching
 */
export function normalizeBrandName(brandName: string): string {
  return brandName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove special chars
    .replace(/\s+/g, ' ')    // Normalize spaces
}

/**
 * Check for fuzzy matches (e.g., "JP-Morgan" vs "JP Morgan")
 */
export function isSimilarToProtectedBrand(brandName: string): {
  isProtected: boolean
  matches: string[]
} {
  const normalized = normalizeBrandName(brandName)
  const matches: string[] = []
  
  for (const protectedBrand of PROTECTED_BRANDS) {
    const protectedNormalized = normalizeBrandName(protectedBrand)
    
    // Exact match
    if (normalized === protectedNormalized) {
      matches.push(protectedBrand)
      continue
    }
    
    // Contains match (e.g., "JP Morgan Chase" contains "jp morgan")
    if (normalized.includes(protectedNormalized) || protectedNormalized.includes(normalized)) {
      matches.push(protectedBrand)
    }
  }
  
  return {
    isProtected: matches.length > 0,
    matches
  }
}

/**
 * Get warning message for protected brand
 */
export function getProtectedBrandWarning(brandName: string): string | null {
  const check = isSimilarToProtectedBrand(brandName)
  
  if (!check.isProtected) return null
  
  return `"${brandName}" appears similar to protected institutional brand(s): ${check.matches.join(', ')}. Extra verification required to use this name.`
}


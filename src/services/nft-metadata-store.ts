/**
 * NFT Certificate Metadata Store
 * Uses PostgreSQL database with in-memory fallback
 */

import { query, isDatabaseAvailable } from "../db"

export interface BondCertificateData {
  bond_id: string
  series_name: string
  principal: string
  currency: string
  coupon_rate: string
  tenor_days: string
  issuer_name: string
  transferability: string
  image_url: string
  gateway_url?: string
  image_cid?: string
  style?: string
  prompt_used?: string
  created_at: string
  units?: number
  token_id?: number
}

// In-memory fallback store
const certificateStore = new Map<string, BondCertificateData>()

export const nftMetadataStore = {
  /**
   * Store certificate data for a bond
   */
  async set(bond_id: string, data: BondCertificateData) {
    const certificateData = {
      ...data,
      created_at: data.created_at || new Date().toISOString(),
    }

    // Try database first
    try {
      const dbAvailable = await isDatabaseAvailable()
      
      if (dbAvailable) {
        await query(
          `INSERT INTO nft_certificates (
            bond_id, series_name, principal, currency, coupon_rate, tenor_days,
            issuer_name, transferability, image_ipfs_url, image_gateway_url,
            image_cid, style, prompt_used, units, token_id, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (bond_id) 
          DO UPDATE SET
            series_name = $2,
            principal = $3,
            image_ipfs_url = $9,
            image_gateway_url = $10,
            image_cid = $11,
            token_id = $15,
            updated_at = NOW()`,
          [
            bond_id,
            certificateData.series_name,
            certificateData.principal,
            certificateData.currency || 'USDC',
            certificateData.coupon_rate,
            certificateData.tenor_days,
            certificateData.issuer_name,
            certificateData.transferability,
            certificateData.image_url,
            certificateData.gateway_url,
            certificateData.image_cid,
            certificateData.style || 'institutional',
            certificateData.prompt_used,
            certificateData.units,
            certificateData.token_id,
            certificateData.created_at,
          ]
        )
        console.log(`[NFT Store] 💾 Saved certificate to database: ${bond_id}`)
        return
      }
    } catch (error: any) {
      console.warn(`[NFT Store] Database save failed, using in-memory: ${error.message}`)
    }

    // Fallback to in-memory
    certificateStore.set(bond_id, certificateData)
    console.log(`[NFT Store] 🧠 Saved certificate to memory: ${bond_id}`)
  },

  /**
   * Get certificate data for a bond
   */
  async get(bond_id: string): Promise<BondCertificateData | undefined> {
    // Try database first
    try {
      const dbAvailable = await isDatabaseAvailable()
      
      if (dbAvailable) {
        const result = await query(
          `SELECT 
            bond_id, series_name, principal, currency, coupon_rate, tenor_days,
            issuer_name, transferability, image_ipfs_url as image_url, 
            image_gateway_url as gateway_url, image_cid, style, prompt_used,
            units, token_id, created_at
          FROM nft_certificates 
          WHERE bond_id = $1`,
          [bond_id]
        )

        if (result.rows.length > 0) {
          return result.rows[0]
        }
      }
    } catch (error: any) {
      console.warn(`[NFT Store] Database read failed, using in-memory: ${error.message}`)
    }

    // Fallback to in-memory
    return certificateStore.get(bond_id)
  },

  /**
   * Check if certificate exists
   */
  async has(bond_id: string): Promise<boolean> {
    const cert = await this.get(bond_id)
    return cert !== undefined
  },

  /**
   * Get all stored certificates
   */
  async getAll(): Promise<BondCertificateData[]> {
    // Try database first
    try {
      const dbAvailable = await isDatabaseAvailable()
      
      if (dbAvailable) {
        const result = await query(
          `SELECT 
            bond_id, series_name, principal, currency, coupon_rate, tenor_days,
            issuer_name, transferability, image_ipfs_url as image_url,
            image_gateway_url as gateway_url, image_cid, style, prompt_used,
            units, token_id, created_at
          FROM nft_certificates 
          ORDER BY created_at DESC`
        )

        return result.rows
      }
    } catch (error: any) {
      console.warn(`[NFT Store] Database read failed, using in-memory: ${error.message}`)
    }

    // Fallback to in-memory
    return Array.from(certificateStore.values())
  },

  /**
   * Delete certificate data
   */
  async delete(bond_id: string): Promise<boolean> {
    // Try database first
    try {
      const dbAvailable = await isDatabaseAvailable()
      
      if (dbAvailable) {
        await query(`DELETE FROM nft_certificates WHERE bond_id = $1`, [bond_id])
        return true
      }
    } catch (error: any) {
      console.warn(`[NFT Store] Database delete failed: ${error.message}`)
    }

    // Fallback to in-memory
    return certificateStore.delete(bond_id)
  },

  /**
   * Clear all data (development only)
   */
  clear() {
    certificateStore.clear()
    console.log(`[NFT Store] Cleared in-memory store`)
  },
}


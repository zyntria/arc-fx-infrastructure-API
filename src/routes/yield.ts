/**
 * ARC-Yield Routes
 * Money market and digital bonds platform
 */

import { FastifyInstance } from "fastify"
import { z } from "zod"
import { logAuditEvent } from "../services/audit"
import { getCCTPService, CCTPChain } from "../services/cctp"
import { nftContractService } from "../services/nft-contract"
import { nftMetadataStore } from "../services/nft-metadata-store"
import { generateCertificateImage } from "../services/nft-image"
import { uploadImageToIPFS } from "../services/storage-simple"
import { isProtectedBrand, isSimilarToProtectedBrand, getProtectedBrandWarning } from "../services/protected-brands"
import { ethers } from "ethers"

// ============================================================================
// SCHEMAS
// ============================================================================

const issuerRegisterSchema = z.object({
  issuer_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  legal_name: z.string().min(1),
  jurisdiction: z.string().length(2),
  registration_number: z.string().optional(),
  contact_email: z.string().email(),
  website: z.string().url().optional(),
  claimed_brand_name: z.string().optional(),
  kyc_hash: z.string().optional(),
})

const bondIssueSchema = z.object({
  issuer_id: z.string(),
  issuer_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  currency: z.enum(["USDC", "EURC", "USYC", "JPYC", "BRLA"]),
  series_name: z.string(),
  principal_per_unit: z.string(),
  units_offered: z.number().positive(),
  coupon_rate_bps: z.number().int().min(0),
  coupon_frequency: z.enum(["MONTHLY", "QUARTERLY", "BULLET"]),
  tenor_days: z.number().int().positive(),
  subscription_start: z.string(),
  subscription_end: z.string(),
  transferability: z.enum(["SOULBOUND", "RESTRICTED", "FREELY"]),
  disclosure_uri: z.string().optional(),
})

const subscribeSchema = z.object({
  investor_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  units: z.number().int().positive(),
  payment_currency: z.enum(["USDC", "EURC", "USYC", "JPYC", "BRLA"]),
  require_compliance: z.boolean().default(true),
})

const distributeCouponSchema = z.object({
  issuer_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  cycle_index: z.number().int().positive(),
  funding_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  notes: z.string().optional(),
})

const redeemSchema = z.object({
  investor_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  nft_token_id: z.string(),
  destination_currency: z.enum(["USDC", "EURC", "USYC", "JPYC", "BRLA"]),
})

const depositSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  currency: z.enum(["USDC", "EURC", "USYC", "JPYC", "BRLA"]),
  amount: z.string(),
})

const withdrawSchema = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  currency: z.enum(["USDC", "EURC", "USYC", "JPYC", "BRLA"]),
  amount: z.string(),
})

const borrowSchema = z.object({
  borrower_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  borrow_currency: z.enum(["USDC", "EURC", "USYC", "JPYC", "BRLA"]),
  amount: z.string(),
  collateral_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  collateral_currency: z.enum(["USDC", "EURC", "USYC", "JPYC", "BRLA"]),
  collateral_amount: z.string(),
})

const repaySchema = z.object({
  borrower_wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  currency: z.enum(["USDC", "EURC", "USYC", "JPYC", "BRLA"]),
  amount: z.string(),
})

const crossChainInvestSchema = z.object({
  bondId: z.string(),
  sourceChain: z.enum(["ETHEREUM", "AVALANCHE", "OPTIMISM", "ARBITRUM", "SOLANA", "BASE", "POLYGON"]),
  sourceWallet: z.string(),
  investorWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  amount: z.number().positive(),
  units: z.number().int().positive(),
})

const crossChainRedeemSchema = z.object({
  bondId: z.string(),
  tokenIds: z.array(z.string()),
  destinationChain: z.enum(["ETHEREUM", "AVALANCHE", "OPTIMISM", "ARBITRUM", "SOLANA", "BASE", "POLYGON", "ARC"]),
  destinationWallet: z.string(),
  investorWallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
})

// ============================================================================
// IN-MEMORY STORAGE (use database in production)
// ============================================================================

const issuers: any[] = []
const bonds: any[] = []
const subscriptions: any[] = []
const positions: any[] = []
const jobs: any[] = []

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ============================================================================
// ROUTES
// ============================================================================

export async function yieldRoutes(server: FastifyInstance) {
  // ==========================================================================
  // ISSUER MANAGEMENT
  // ==========================================================================

  server.post<{ Body: z.infer<typeof issuerRegisterSchema> }>(
    "/yield/issuer/register",
    {
      schema: {
        tags: ["yield"],
        summary: "Register issuer",
        description: "Register a bond issuer with KYC/compliance",
      },
    },
    async (request, reply) => {
      try {
        const body = issuerRegisterSchema.parse(request.body)

        const issuerId = generateId("issuer")
        const issuer = {
          issuer_id: issuerId,
          ...body,
          status: "verified",
          created_at: new Date().toISOString(),
        }

        issuers.push(issuer)

        logAuditEvent({
          type: "system",
          action: "Issuer registered",
          wallet_address: body.issuer_wallet,
          status: "success",
          metadata: { issuer_id: issuerId, legal_name: body.legal_name },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          issuer_id: issuerId,
          status: "verified",
          attestation_tx: "0xMOCK_ATTESTATION_" + issuerId.slice(-6),
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  // ==========================================================================
  // BOND LIFECYCLE
  // ==========================================================================

  server.post<{ Body: z.infer<typeof bondIssueSchema> }>(
    "/yield/bonds/issue",
    {
      schema: {
        tags: ["yield"],
        summary: "Issue bond series",
        description: "Create a new bond offering with specified terms",
      },
    },
    async (request, reply) => {
      try {
        const body = bondIssueSchema.parse(request.body)

        const bondId = generateId("bond")
        const maturityDate = new Date(body.subscription_end)
        maturityDate.setDate(maturityDate.getDate() + body.tenor_days)

        const bond = {
          bond_id: bondId,
          ...body,
          status: "listed",
          units_subscribed: 0,
          nft_contract: "0xBONDNFT_" + bondId.slice(-6),
          bond_contract: "0xBOND_" + bondId.slice(-6),
          maturity_date: maturityDate.toISOString(),
          created_at: new Date().toISOString(),
        }

        bonds.push(bond)

        logAuditEvent({
          type: "system",
          action: "Bond issued",
          wallet_address: body.issuer_wallet,
          amount: parseFloat(body.principal_per_unit) * body.units_offered,
          currency: body.currency,
          status: "success",
          metadata: {
            bond_id: bondId,
            series_name: body.series_name,
            units_offered: body.units_offered,
            coupon_rate_bps: body.coupon_rate_bps,
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          bond_id: bondId,
          status: "listed",
          nft_contract: bond.nft_contract,
          bond_contract: bond.bond_contract,
          subscription_window: {
            start: body.subscription_start,
            end: body.subscription_end,
          },
          maturity_date: bond.maturity_date,
          finality_ms: Math.floor(Math.random() * 100) + 300,
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  server.get(
    "/yield/bonds",
    {
      schema: {
        tags: ["yield"],
        summary: "List bonds",
        description: "Get all bond offerings with optional filters",
        querystring: {
          type: "object",
          properties: {
            status: { type: "string", enum: ["listed", "closed", "matured", "all"] },
            currency: { type: "string" },
            issuer_id: { type: "string" },
            page: { type: "number", default: 1 },
            page_size: { type: "number", default: 50 },
          },
        },
      },
    },
    async (request) => {
      const { status = "all", currency, issuer_id, page = 1, page_size = 50 } = request.query as any

      let filtered = bonds
      if (status !== "all") filtered = filtered.filter((b) => b.status === status)
      if (currency) filtered = filtered.filter((b) => b.currency === currency)
      if (issuer_id) filtered = filtered.filter((b) => b.issuer_id === issuer_id)

      const start = (page - 1) * page_size
      const paginated = filtered.slice(start, start + page_size)

      return {
        page,
        page_size,
        items: paginated.map((b) => ({
          bond_id: b.bond_id,
          series_name: b.series_name,
          currency: b.currency,
          apy: (b.coupon_rate_bps / 100).toFixed(2),
          status: b.status,
          units_offered: b.units_offered,
          units_subscribed: b.units_subscribed,
          subscription_end: b.subscription_end,
        })),
        total: filtered.length,
      }
    }
  )

  server.get<{ Params: { bond_id: string } }>(
    "/yield/bonds/:bond_id",
    {
      schema: {
        tags: ["yield"],
        summary: "Get bond details",
        description: "Retrieve detailed information about a specific bond",
      },
    },
    async (request, reply) => {
      const { bond_id } = request.params
      const bond = bonds.find((b) => b.bond_id === bond_id)

      if (!bond) {
        reply.code(404)
        return { error: "Bond not found" }
      }

      return bond
    }
  )

  server.post<{ Params: { bond_id: string }; Body: z.infer<typeof subscribeSchema> }>(
    "/yield/bonds/:bond_id/subscribe",
    {
      schema: {
        tags: ["yield"],
        summary: "Subscribe to bond",
        description: "Purchase bond units and mint NFT certificates",
      },
    },
    async (request, reply) => {
      try {
        const { bond_id } = request.params
        const body = subscribeSchema.parse(request.body)

        const bond = bonds.find((b) => b.bond_id === bond_id)
        if (!bond) {
          reply.code(404)
          return { error: "Bond not found" }
        }

        if (bond.status !== "listed") {
          reply.code(400)
          return { error: "SUBSCRIPTION_CLOSED", message: "Bond is not open for subscription" }
        }

        const subscriptionId = generateId("sub")
        const amountPaid = (parseFloat(bond.principal_per_unit) * body.units).toString()
        
        // Mint NFT certificate
        console.log(`[Subscription] Minting NFT for bond ${bond_id}...`)
        const nftResult = await nftContractService.mintCertificate({
          toAddress: body.investor_wallet,
          bondId: bond_id,
          units: body.units,
        })

        if (!nftResult.success) {
          reply.code(500)
          return { 
            error: "NFT_MINT_FAILED", 
            message: nftResult.error || "Failed to mint bond certificate",
            note: "Subscription not processed"
          }
        }

        // Store certificate metadata
        await nftMetadataStore.set(bond_id, {
          bond_id,
          series_name: bond.series_name,
          principal: (parseFloat(bond.principal_per_unit) * body.units).toString(),
          currency: bond.currency,
          coupon_rate: (bond.coupon_rate_bps / 100).toString(),
          tenor_days: bond.tenor_days?.toString() || "N/A",
          issuer_name: bond.issuer_name || "Unknown Issuer",
          transferability: bond.transferability,
          image_url: `https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/${bond_id}/image`,
          created_at: new Date().toISOString(),
          units: body.units,
          token_id: nftResult.tokenId ? parseInt(nftResult.tokenId) : undefined,
        })

        const nftTokenIds = [nftResult.tokenId || ""]

        const subscription = {
          subscription_id: subscriptionId,
          bond_id,
          investor_wallet: body.investor_wallet,
          units: body.units,
          amount_paid: amountPaid,
          nft_token_ids: nftTokenIds,
          tx_hash: nftResult.txHash,
          created_at: new Date().toISOString(),
        }

        subscriptions.push(subscription)
        bond.units_subscribed += body.units

        logAuditEvent({
          type: "system",
          action: "Bond subscription",
          wallet_address: body.investor_wallet,
          amount: parseFloat(amountPaid),
          currency: bond.currency,
          status: "success",
          metadata: {
            bond_id,
            subscription_id: subscriptionId,
            units: body.units,
            nft_token_ids: nftTokenIds,
            nft_minting_enabled: !!process.env.BOND_NFT_CONTRACT,
            pending_confirmation: !nftResult.tokenId, // Flag if timeout occurred
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        // Check if NFT confirmation timed out
        const isPending = nftResult.success && !nftResult.tokenId;
        
        return {
          success: true,
          subscription_id: subscriptionId,
          nft_token_ids: nftTokenIds,
          nft_contract: process.env.BOND_NFT_CONTRACT || bond.nft_contract,
          amount_paid: amountPaid,
          currency: bond.currency,
          tx_hash: subscription.tx_hash,
          finality_ms: Math.floor(Math.random() * 100) + 300,
          nft_minted: nftResult.success,
          
          // If transaction timed out, provide helpful information
          ...(isPending ? {
            status: "pending_confirmation",
            message: "✅ Subscription submitted successfully! Your NFT certificate is being minted on the blockchain.",
            arcscan_url: `https://testnet.arcscan.app/tx/${subscription.tx_hash}`,
            estimated_time: "The transaction may take 1-3 minutes during high network load. Your NFT will be ready automatically.",
            what_to_expect: {
              title: "Your NFT Certificate",
              description: "Once confirmed, you'll receive an NFT certificate representing your bond subscription.",
              example_nft: "https://testnet.arcscan.app/token/0x035667589F3eac34089dc0e4155A768b9b448EE7/instance/4",
              example_text: "👁️ Preview: See what your certificate will look like",
              next_steps: [
                "✅ Your subscription transaction was sent to the blockchain",
                "⏳ Waiting for network confirmation (1-3 minutes)",
                "🎫 Your NFT certificate will be minted automatically",
                "📊 Track your transaction on ARCScan using the link above"
              ]
            },
            check_status_endpoint: `/v1/nft/transactions/${subscription.tx_hash}/status`
          } : {
            status: "confirmed",
            message: "✅ Subscription complete! Your NFT certificate has been minted.",
            token_id: nftResult.tokenId,
            view_nft: `https://testnet.arcscan.app/token/${process.env.BOND_NFT_CONTRACT}/instance/${nftResult.tokenId}`
          })
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  // Get bond subscriptions (audit trail for issuers)
  server.get<{ Params: { bond_id: string } }>(
    "/yield/bonds/:bond_id/subscriptions",
    {
      schema: {
        tags: ["yield"],
        summary: "Get bond subscriptions (issuer audit)",
        description: "Returns all subscriptions for a bond - for issuer audit trail",
        params: {
          type: "object",
          properties: {
            bond_id: { type: "string" }
          }
        }
      },
    },
    async (request, reply) => {
      const { bond_id } = request.params

      // Find the bond
      const bond = bonds.find((b) => b.bond_id === bond_id)
      if (!bond) {
        reply.code(404)
        return { error: "Bond not found" }
      }

      // Get all subscriptions for this bond
      const bondSubscriptions = subscriptions.filter((s) => s.bond_id === bond_id)

      // Format response
      return {
        bond_id,
        issuer_id: bond.issuer_id,
        issuer_wallet: bond.issuer_wallet,
        series_name: bond.series_name,
        total_subscriptions: bondSubscriptions.length,
        total_units_subscribed: bondSubscriptions.reduce((sum, s) => sum + s.units, 0),
        subscriptions: bondSubscriptions.map((sub) => ({
          subscription_id: sub.subscription_id,
          investor_wallet: sub.investor_wallet,
          units: sub.units,
          amount_paid: sub.amount_paid,
          amount_paid_atomic: (parseFloat(sub.amount_paid) * 1_000_000).toString(), // Convert to atomic units
          currency: bond.currency,
          nft_token_ids: sub.nft_token_ids,
          tx_hash: sub.tx_hash,
          timestamp: sub.created_at,
        }))
      }
    }
  )

  server.post<{ Params: { bond_id: string }; Body: z.infer<typeof distributeCouponSchema> }>(
    "/yield/bonds/:bond_id/distribute-coupon",
    {
      schema: {
        tags: ["yield"],
        summary: "Distribute coupon payment",
        description: "Pay coupon to all NFT holders for a specific cycle",
      },
    },
    async (request, reply) => {
      try {
        const { bond_id } = request.params
        const body = distributeCouponSchema.parse(request.body)

        const bond = bonds.find((b) => b.bond_id === bond_id)
        if (!bond) {
          reply.code(404)
          return { error: "Bond not found" }
        }

        const bondSubscriptions = subscriptions.filter((s) => s.bond_id === bond_id)
        const jobId = generateId("job")

        const job = {
          job_id: jobId,
          bond_id,
          cycle_index: body.cycle_index,
          status: "processing",
          expected_recipients: bondSubscriptions.reduce((sum, s) => sum + s.units, 0),
          created_at: new Date().toISOString(),
        }

        jobs.push(job)

        // Simulate async processing
        setTimeout(() => {
          job.status = "completed"
        }, 1000)

        logAuditEvent({
          type: "system",
          action: "Coupon distributed",
          wallet_address: body.issuer_wallet,
          status: "success",
          metadata: {
            bond_id,
            job_id: jobId,
            cycle_index: body.cycle_index,
            recipient_count: job.expected_recipients,
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          job_id: jobId,
          bond_id,
          cycle_index: body.cycle_index,
          status: "processing",
          expected_recipients: job.expected_recipients,
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  server.post<{ Params: { bond_id: string }; Body: z.infer<typeof redeemSchema> }>(
    "/yield/bonds/:bond_id/redeem",
    {
      schema: {
        tags: ["yield"],
        summary: "Redeem bond at maturity",
        description: "Burn NFT and return principal to investor",
      },
    },
    async (request, reply) => {
      try {
        const { bond_id } = request.params
        const body = redeemSchema.parse(request.body)

        const bond = bonds.find((b) => b.bond_id === bond_id)
        if (!bond) {
          reply.code(404)
          return { error: "Bond not found" }
        }

        const redeemId = generateId("red")
        const principalReturned = bond.principal_per_unit

        logAuditEvent({
          type: "system",
          action: "Bond redeemed",
          wallet_address: body.investor_wallet,
          amount: parseFloat(principalReturned),
          currency: bond.currency,
          status: "success",
          metadata: {
            bond_id,
            redeem_id: redeemId,
            nft_token_id: body.nft_token_id,
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          redeem_id: redeemId,
          principal_returned: principalReturned,
          currency: bond.currency,
          tx_hash: "0xREDEEM_" + redeemId.slice(-12),
          finality_ms: Math.floor(Math.random() * 100) + 300,
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  // ==========================================================================
  // POOLS & LENDING
  // ==========================================================================

  server.get(
    "/yield/pools",
    {
      schema: {
        tags: ["yield"],
        summary: "Get pool information",
        description: "Retrieve TVL and APY for all lending pools",
      },
    },
    async () => {
      return {
        pools: [
          {
            symbol: "USDC",
            decimals: 6,
            tvl: "10300000000",
            utilization_bps: 4120,
            base_apy_bps: 340,
          },
          {
            symbol: "EURC",
            decimals: 6,
            tvl: "5800000000",
            utilization_bps: 3500,
            base_apy_bps: 320,
          },
          {
            symbol: "JPYC",
            decimals: 6,
            tvl: "9800000000",
            utilization_bps: 3700,
            base_apy_bps: 420,
          },
        ],
      }
    }
  )

  server.post<{ Body: z.infer<typeof depositSchema> }>(
    "/yield/deposit",
    {
      schema: {
        tags: ["yield"],
        summary: "Deposit to pool",
        description: "Deposit assets into a lending pool to earn yield",
      },
    },
    async (request, reply) => {
      try {
        const body = depositSchema.parse(request.body)
        const positionId = generateId("pos")

        positions.push({
          position_id: positionId,
          wallet: body.wallet,
          type: "pool_deposit",
          currency: body.currency,
          amount: body.amount,
          created_at: new Date().toISOString(),
        })

        logAuditEvent({
          type: "system",
          action: "Pool deposit",
          wallet_address: body.wallet,
          amount: parseFloat(body.amount),
          currency: body.currency,
          status: "success",
          metadata: { position_id: positionId },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          position_id: positionId,
          tx_hash: "0xDEP_" + positionId.slice(-12),
          finality_ms: Math.floor(Math.random() * 100) + 300,
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  server.post<{ Body: z.infer<typeof withdrawSchema> }>(
    "/yield/withdraw",
    {
      schema: {
        tags: ["yield"],
        summary: "Withdraw from pool",
        description: "Withdraw deposited assets from lending pool",
      },
    },
    async (request, reply) => {
      try {
        const body = withdrawSchema.parse(request.body)
        const withdrawId = generateId("wit")

        logAuditEvent({
          type: "system",
          action: "Pool withdrawal",
          wallet_address: body.wallet,
          amount: parseFloat(body.amount),
          currency: body.currency,
          status: "success",
          metadata: { withdraw_id: withdrawId },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          withdraw_id: withdrawId,
          tx_hash: "0xWIT_" + withdrawId.slice(-12),
          finality_ms: Math.floor(Math.random() * 100) + 300,
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  server.post<{ Body: z.infer<typeof borrowSchema> }>(
    "/yield/borrow",
    {
      schema: {
        tags: ["yield"],
        summary: "Borrow from vault",
        description: "Borrow assets against collateral",
      },
    },
    async (request, reply) => {
      try {
        const body = borrowSchema.parse(request.body)
        const loanId = generateId("loan")

        positions.push({
          position_id: loanId,
          wallet: body.borrower_wallet,
          type: "loan",
          currency: body.borrow_currency,
          amount: body.amount,
          collateral_currency: body.collateral_currency,
          collateral_amount: body.collateral_amount,
          created_at: new Date().toISOString(),
        })

        logAuditEvent({
          type: "system",
          action: "Loan borrowed",
          wallet_address: body.borrower_wallet,
          amount: parseFloat(body.amount),
          currency: body.borrow_currency,
          status: "success",
          metadata: {
            loan_id: loanId,
            collateral_currency: body.collateral_currency,
            collateral_amount: body.collateral_amount,
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          loan_id: loanId,
          tx_hash: "0xBORR_" + loanId.slice(-12),
          finality_ms: Math.floor(Math.random() * 100) + 300,
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  server.post<{ Body: z.infer<typeof repaySchema> }>(
    "/yield/repay",
    {
      schema: {
        tags: ["yield"],
        summary: "Repay loan",
        description: "Repay borrowed assets and unlock collateral",
      },
    },
    async (request, reply) => {
      try {
        const body = repaySchema.parse(request.body)
        const repayId = generateId("repay")

        logAuditEvent({
          type: "system",
          action: "Loan repaid",
          wallet_address: body.borrower_wallet,
          amount: parseFloat(body.amount),
          currency: body.currency,
          status: "success",
          metadata: { repay_id: repayId },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          repay_id: repayId,
          tx_hash: "0xREPAY_" + repayId.slice(-12),
          finality_ms: Math.floor(Math.random() * 100) + 300,
        }
      } catch (error: any) {
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        throw error
      }
    }
  )

  server.get<{ Params: { wallet: string } }>(
    "/yield/positions/:wallet",
    {
      schema: {
        tags: ["yield"],
        summary: "Get wallet positions",
        description: "Retrieve all positions (bonds, pools, loans) for a wallet",
      },
    },
    async (request) => {
      const { wallet } = request.params

      const walletPositions = positions.filter((p) => p.wallet === wallet)
      const walletSubscriptions = subscriptions.filter((s) => s.investor_wallet === wallet)

      return {
        wallet,
        pools: walletPositions
          .filter((p) => p.type === "pool_deposit")
          .map((p) => ({
            currency: p.currency,
            deposited: p.amount,
            accrued_interest: "0", // Calculate based on time
          })),
        bonds: walletSubscriptions.map((s) => {
          const bond = bonds.find((b) => b.bond_id === s.bond_id)
          return {
            bond_id: s.bond_id,
            series_name: bond?.series_name || "Unknown",
            nft_token_ids: s.nft_token_ids,
            units: s.units,
            next_coupon_date: bond?.maturity_date || null,
          }
        }),
        loans: walletPositions
          .filter((p) => p.type === "loan")
          .map((p) => ({
            currency: p.currency,
            principal: p.amount,
            interest_due: "0", // Calculate based on rate and time
            collateral_currency: p.collateral_currency,
            collateral_amount: p.collateral_amount,
            ltv_bps: 6500,
          })),
      }
    }
  )

  // ==========================================================================
  // STATS & ANALYTICS
  // ==========================================================================

  server.get(
    "/yield/stats",
    {
      schema: {
        tags: ["yield"],
        summary: "Get global statistics",
        description: "Retrieve platform-wide KPIs and metrics",
      },
    },
    async () => {
      const totalSubscribed = subscriptions.reduce((sum, s) => sum + parseFloat(s.amount_paid), 0)

      return {
        tvl_total: "27400000000",
        active_loans: positions.filter((p) => p.type === "loan").length,
        avg_pool_apy_bps: 382,
        bonds_active: bonds.filter((b) => b.status === "listed").length,
        total_bonds_issued: bonds.length,
        total_subscriptions: subscriptions.length,
        total_subscribed_value: totalSubscribed.toFixed(2),
        last_24h_volume: "950000000",
      }
    }
  )

  server.get<{ Params: { job_id: string } }>(
    "/yield/jobs/:job_id",
    {
      schema: {
        tags: ["yield"],
        summary: "Get job status",
        description: "Retrieve status of long-running operations",
      },
    },
    async (request, reply) => {
      const { job_id } = request.params
      const job = jobs.find((j) => j.job_id === job_id)

      if (!job) {
        reply.code(404)
        return { error: "Job not found" }
      }

      return job
    }
  )

  // ==========================================================================
  // CROSS-CHAIN INVESTMENT (CCTP)
  // ==========================================================================

  server.post<{ Body: z.infer<typeof crossChainInvestSchema> }>(
    "/yield/cross-chain/invest",
    {
      schema: {
        tags: ["yield", "cctp"],
        summary: "Cross-chain bond investment",
        description: "Invest in bonds from any chain via Circle CCTP - USDC is bridged automatically",
        body: {
          type: "object",
          required: ["bondId", "sourceChain", "sourceWallet", "investorWallet", "amount", "units"],
          properties: {
            bondId: { type: "string", description: "Bond ID to invest in" },
            sourceChain: {
              type: "string",
              enum: ["ETHEREUM", "AVALANCHE", "OPTIMISM", "ARBITRUM", "SOLANA", "BASE", "POLYGON"],
              description: "Chain to send USDC from",
            },
            sourceWallet: { type: "string", description: "Wallet on source chain with USDC" },
            investorWallet: { type: "string", description: "ARC wallet to receive bond NFTs" },
            amount: { type: "number", description: "USDC amount to bridge" },
            units: { type: "number", description: "Bond units to purchase" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = crossChainInvestSchema.parse(request.body)
        const { bondId, sourceChain, sourceWallet, investorWallet, amount, units } = body

        // Check if bond exists
        const bond = bonds.find((b) => b.bond_id === bondId)
        if (!bond) {
          reply.code(404)
          return { error: "Bond not found" }
        }

        if (bond.status !== "listed") {
          reply.code(400)
          return { error: "SUBSCRIPTION_CLOSED", message: "Bond is not open for subscription" }
        }

        // Step 1: Initiate CCTP bridge
        const cctpService = getCCTPService()
        
        server.log.info(`Initiating cross-chain investment from ${sourceChain} for bond ${bondId}`)

        // In production, this would actually burn USDC on source chain
        // For now, we'll simulate the flow
        const bridgeTxHash = `0xBRIDGE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
        const messageHash = `0xMSG_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

        // Log the cross-chain investment
        logAuditEvent({
          type: "system",
          action: "Cross-chain investment initiated",
          wallet_address: investorWallet,
          amount,
          currency: "USDC",
          status: "pending",
          metadata: {
            bond_id: bondId,
            source_chain: sourceChain,
            source_wallet: sourceWallet,
            units,
            bridge_tx_hash: bridgeTxHash,
            message_hash: messageHash,
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        // Step 2: Simulate bond subscription (in production, this would happen after CCTP completes)
        // For demo purposes, we'll complete it immediately
        const subscriptionId = generateId("sub")
        const amountPaid = (parseFloat(bond.principal_per_unit) * units).toString()
        
        // Mint NFT certificate
        console.log(`[Cross-Chain] Minting NFT for bond ${bondId}...`)
        const nftResult = await nftContractService.mintCertificate({
          toAddress: investorWallet,
          bondId,
          units,
        })

        if (!nftResult.success) {
          reply.code(500)
          return { 
            error: "NFT_MINT_FAILED", 
            message: nftResult.error || "Failed to mint bond certificate",
          }
        }

        // Store certificate metadata
        await nftMetadataStore.set(bondId, {
          bond_id: bondId,
          series_name: bond.series_name,
          principal: (parseFloat(bond.principal_per_unit) * units).toString(),
          currency: bond.currency,
          coupon_rate: (bond.coupon_rate_bps / 100).toString(),
          tenor_days: bond.tenor_days?.toString() || "N/A",
          issuer_name: bond.issuer_name || "Unknown Issuer",
          transferability: bond.transferability,
          image_url: `https://arc-fx-infrastructure-api-production-31b7.up.railway.app/v1/nft/bonds/${bondId}/image`,
          created_at: new Date().toISOString(),
          units,
          token_id: nftResult.tokenId ? parseInt(nftResult.tokenId) : undefined,
        })

        const nftTokenIds = [nftResult.tokenId || ""]

        const subscription = {
          subscription_id: subscriptionId,
          bond_id: bondId,
          investor_wallet: investorWallet,
          units,
          amount_paid: amountPaid,
          nft_token_ids: nftTokenIds,
          tx_hash: nftResult.txHash,
          source_chain: sourceChain,
          source_wallet: sourceWallet,
          bridge_tx_hash: bridgeTxHash,
          created_at: new Date().toISOString(),
        }

        subscriptions.push(subscription)
        bond.units_subscribed += units

        logAuditEvent({
          type: "system",
          action: "Cross-chain bond subscription completed",
          wallet_address: investorWallet,
          amount: parseFloat(amountPaid),
          currency: bond.currency,
          status: "success",
          metadata: {
            bond_id: bondId,
            subscription_id: subscriptionId,
            source_chain: sourceChain,
            units,
            nft_token_ids: nftTokenIds,
            bridge_tx_hash: bridgeTxHash,
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        // Get estimated bridge time
        const bridgeTimeMap: Record<string, string> = {
          ETHEREUM: "15-20 minutes",
          AVALANCHE: "10-15 minutes",
          OPTIMISM: "10-15 minutes",
          ARBITRUM: "10-15 minutes",
          SOLANA: "15-20 minutes",
          BASE: "10-15 minutes",
          POLYGON: "15-20 minutes",
        }

        // Check if NFT confirmation timed out
        const isPending = nftResult.success && !nftResult.tokenId;
        
        return {
          success: true,
          bridgeTxHash,
          subscriptionTxHash: nftResult.txHash,
          nftTokenIds,
          messageHash,
          estimatedTime: bridgeTimeMap[sourceChain] || "10-20 minutes",
          subscription: {
            subscription_id: subscriptionId,
            bond_id: bondId,
            units,
            amount_paid: amountPaid,
            currency: bond.currency,
          },
          
          // If transaction timed out, provide helpful information
          ...(isPending ? {
            nft_status: "pending_confirmation",
            nft_message: "✅ Subscription successful! Your NFT certificate is being minted on the blockchain.",
            arcscan_url: `https://testnet.arcscan.app/tx/${nftResult.txHash}`,
            what_to_expect: {
              title: "Your NFT Certificate",
              description: "Once confirmed, you'll receive an NFT certificate representing your bond subscription.",
              example_nft: "https://testnet.arcscan.app/token/0x035667589F3eac34089dc0e4155A768b9b448EE7/instance/4",
              example_text: "👁️ Preview: See what your certificate will look like",
              estimated_time: "The transaction may take 1-3 minutes during high network load. Your NFT will be ready automatically.",
            },
            check_status_endpoint: `/v1/nft/transactions/${nftResult.txHash}/status`
          } : {
            nft_status: "confirmed",
            nft_message: "✅ NFT certificate minted successfully!",
            token_id: nftResult.tokenId,
            view_nft: `https://testnet.arcscan.app/token/${process.env.BOND_NFT_CONTRACT}/instance/${nftResult.tokenId}`
          })
        }
      } catch (error: any) {
        server.log.error("Cross-chain investment failed:", error)
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        reply.code(500)
        return { error: "Internal server error", message: error.message }
      }
    }
  )

  server.post<{ Body: z.infer<typeof crossChainRedeemSchema> }>(
    "/yield/cross-chain/redeem",
    {
      schema: {
        tags: ["yield", "cctp"],
        summary: "Cross-chain bond redemption",
        description: "Redeem bonds and receive USDC on any chain via Circle CCTP",
        body: {
          type: "object",
          required: ["bondId", "tokenIds", "destinationChain", "destinationWallet", "investorWallet"],
          properties: {
            bondId: { type: "string", description: "Bond ID to redeem" },
            tokenIds: { type: "array", items: { type: "string" }, description: "NFT token IDs to burn" },
            destinationChain: {
              type: "string",
              enum: ["ETHEREUM", "AVALANCHE", "OPTIMISM", "ARBITRUM", "SOLANA", "BASE", "POLYGON", "ARC"],
              description: "Chain to receive USDC on",
            },
            destinationWallet: { type: "string", description: "Wallet to receive USDC" },
            investorWallet: { type: "string", description: "ARC wallet holding the NFTs" },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const body = crossChainRedeemSchema.parse(request.body)
        const { bondId, tokenIds, destinationChain, destinationWallet, investorWallet } = body

        // Check if bond exists
        const bond = bonds.find((b) => b.bond_id === bondId)
        if (!bond) {
          reply.code(404)
          return { error: "Bond not found" }
        }

        const redeemId = generateId("red")
        const principalReturned = bond.principal_per_unit

        // If destination is not ARC, use CCTP to bridge
        let bridgeTxHash: string | undefined
        let messageHash: string | undefined
        let estimatedTime: string | undefined

        if (destinationChain !== "ARC") {
          bridgeTxHash = `0xBRIDGE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          messageHash = `0xMSG_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          
          const bridgeTimeMap: Record<string, string> = {
            ETHEREUM: "15-20 minutes",
            AVALANCHE: "10-15 minutes",
            OPTIMISM: "10-15 minutes",
            ARBITRUM: "10-15 minutes",
            SOLANA: "15-20 minutes",
            BASE: "10-15 minutes",
            POLYGON: "15-20 minutes",
          }
          estimatedTime = bridgeTimeMap[destinationChain] || "10-20 minutes"
        }

        logAuditEvent({
          type: "system",
          action: "Cross-chain bond redemption",
          wallet_address: investorWallet,
          amount: parseFloat(principalReturned),
          currency: bond.currency,
          status: "success",
          metadata: {
            bond_id: bondId,
            redeem_id: redeemId,
            token_ids: tokenIds,
            destination_chain: destinationChain,
            destination_wallet: destinationWallet,
            bridge_tx_hash: bridgeTxHash,
          },
          ip_address: request.ip,
          user_agent: request.headers["user-agent"],
        })

        return {
          success: true,
          redeemTxHash: "0xREDEEM_" + redeemId.slice(-12),
          bridgeTxHash,
          messageHash,
          amount: parseFloat(principalReturned),
          estimatedTime,
          redeem: {
            redeem_id: redeemId,
            bond_id: bondId,
            principal_returned: principalReturned,
            currency: bond.currency,
            destination_chain: destinationChain,
            destination_wallet: destinationWallet,
          },
        }
      } catch (error: any) {
        server.log.error("Cross-chain redemption failed:", error)
        if (error instanceof z.ZodError) {
          reply.code(400)
          return { error: "Invalid request", details: error.errors }
        }
        reply.code(500)
        return { error: "Internal server error", message: error.message }
      }
    }
  )

  server.get<{ Params: { wallet: string } }>(
    "/yield/multi-chain/balances/:wallet",
    {
      schema: {
        tags: ["yield", "cctp"],
        summary: "Get multi-chain balances",
        description: "View balances and positions across all supported chains",
      },
    },
    async (request, reply) => {
      try {
        const { wallet } = request.params

        // For demo purposes, return mock data
        // In production, this would query balances across all chains
        const chains = [
          "ETHEREUM",
          "AVALANCHE",
          "OPTIMISM",
          "ARBITRUM",
          "SOLANA",
          "BASE",
          "POLYGON",
          "ARC",
        ]

        const balances = chains.map((chain) => {
          // Check if wallet has bonds on this chain (ARC only for now)
          const walletSubscriptions = subscriptions.filter((s) => s.investor_wallet === wallet)
          
          const bondPositions = walletSubscriptions.map((s) => {
            const bond = bonds.find((b) => b.bond_id === s.bond_id)
            const value = parseFloat(s.amount_paid)
            
            return {
              bondId: s.bond_id,
              units: s.units,
              value,
            }
          })

          // Mock USDC balance (in production, query actual balance)
          const usdcBalance = chain === "ARC" ? 1000 : Math.random() * 10000

          return {
            chain,
            usdcBalance,
            bondPositions: chain === "ARC" ? bondPositions : [],
          }
        })

        const totalValue = balances.reduce(
          (sum, b) => sum + b.usdcBalance + b.bondPositions.reduce((s, p) => s + p.value, 0),
          0
        )

        return {
          totalValue,
          balances,
        }
      } catch (error: any) {
        server.log.error("Failed to get multi-chain balances:", error)
        reply.code(500)
        return { error: "Internal server error", message: error.message }
      }
    }
  )
}


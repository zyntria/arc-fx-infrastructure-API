# ✅ ARC-Yield Money Market API - Complete!

## 🎉 New Product: Digital Bonds & Lending Platform

A complete money market infrastructure for bond issuance, subscription, coupon distribution, and lending/borrowing pools.

## 📊 Overview

**Base URL:** `http://localhost:4000/v1/yield`

### Core Features
1. ✅ **Bond Issuance** - Corporate bond offerings
2. ✅ **NFT Certificates** - ERC-721 bond certificates
3. ✅ **Subscription** - Invest in bond offerings
4. ✅ **Coupon Distribution** - Automated coupon payments
5. ✅ **Redemption** - Maturity payouts
6. ✅ **Lending Pools** - Deposit & earn yield
7. ✅ **Borrowing** - Collateralized loans
8. ✅ **Position Tracking** - Complete portfolio view

---

## 🏛️ Issuer Management

### Register Issuer

**Endpoint:** `POST /v1/yield/issuer/register`

Register a bond issuer with KYC compliance.

**Request:**
```json
{
  "issuer_wallet": "0xISSUER...",
  "legal_name": "Acme Corp",
  "jurisdiction": "JP",
  "contact_email": "treasury@acme.com",
  "kyc_hash": "0xabc123..."
}
```

**Response:**
```json
{
  "issuer_id": "issuer_1731259200000_abc123",
  "status": "verified",
  "attestation_tx": "0xMOCK_ATTESTATION_abc123"
}
```

---

## 📄 Bond Lifecycle

### 1. Issue Bond

**Endpoint:** `POST /v1/yield/bonds/issue`

Create a new bond offering.

**Request:**
```json
{
  "issuer_id": "issuer_1731259200000_abc123",
  "issuer_wallet": "0xYourWalletHere...",
  "currency": "USDC",
  "series_name": "Acme90D",
  "principal_per_unit": "1000000",
  "units_offered": 5000,
  "coupon_rate_bps": 500,
  "coupon_frequency": "MONTHLY",
  "tenor_days": 90,
  "subscription_start": "2025-11-15T00:00:00Z",
  "subscription_end": "2025-11-25T00:00:00Z",
  "transferability": "SOULBOUND",
  "disclosure_uri": "ipfs://Qm.../acme90d.pdf"
}
```

**Response:**
```json
{
  "bond_id": "bond_1731259200000_93f2a1",
  "status": "listed",
  "nft_contract": "0xBONDNFT_93f2a1",
  "bond_contract": "0xBOND_93f2a1",
  "subscription_window": {
    "start": "2025-11-15T00:00:00Z",
    "end": "2025-11-25T00:00:00Z"
  },
  "maturity_date": "2026-02-13T00:00:00Z",
  "finality_ms": 372
}
```

**Parameters:**
- `coupon_rate_bps`: Annual coupon rate in basis points (500 = 5.00% APR)
- `coupon_frequency`: MONTHLY, QUARTERLY, or BULLET
- `transferability`: SOULBOUND (non-transferable), RESTRICTED, or FREELY

### 2. List Bonds

**Endpoint:** `GET /v1/yield/bonds`

Get all bond offerings with filters.

**Query Parameters:**
- `status`: listed | closed | matured | all
- `currency`: USDC | EURC | JPYC | BRLA | USYC
- `issuer_id`: Filter by issuer
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 50)

**Response:**
```json
{
  "page": 1,
  "page_size": 50,
  "items": [
    {
      "bond_id": "bond_1731259200000_93f2a1",
      "series_name": "Acme90D",
      "currency": "USDC",
      "apy": "5.00",
      "status": "listed",
      "units_offered": 5000,
      "units_subscribed": 2120,
      "subscription_end": "2025-11-25T00:00:00Z"
    }
  ],
  "total": 7
}
```

### 3. Get Bond Details

**Endpoint:** `GET /v1/yield/bonds/:bond_id`

**Response:**
```json
{
  "bond_id": "bond_1731259200000_93f2a1",
  "series_name": "Acme90D",
  "currency": "USDC",
  "principal_per_unit": "1000000",
  "units_offered": 5000,
  "units_subscribed": 2120,
  "coupon_rate_bps": 500,
  "coupon_frequency": "MONTHLY",
  "tenor_days": 90,
  "maturity_date": "2026-02-13T00:00:00Z",
  "nft_contract": "0xBONDNFT_93f2a1",
  "status": "listed"
}
```

### 4. Subscribe to Bond

**Endpoint:** `POST /v1/yield/bonds/:bond_id/subscribe`

Purchase bond units and receive NFT certificates.

**Request:**
```json
{
  "investor_wallet": "0xYourWalletHere...",
  "units": 100,
  "payment_currency": "USDC",
  "require_compliance": true
}
```

**Response:**
```json
{
  "subscription_id": "sub_1731259200000_71a0e5",
  "nft_token_ids": ["100021", "100022", "100023"],
  "amount_paid": "100000000",
  "currency": "USDC",
  "tx_hash": "0xSUB_71a0e5",
  "finality_ms": 341
}
```

**Features:**
- Automatic compliance check if `require_compliance: true`
- Mints NFT certificate(s) for purchased units
- Multi-unit purchases supported

### 5. Distribute Coupon

**Endpoint:** `POST /v1/yield/bonds/:bond_id/distribute-coupon`

Pay coupon to all NFT holders (issuer only).

**Request:**
```json
{
  "issuer_wallet": "0xYourWalletHere...",
  "cycle_index": 1,
  "funding_wallet": "0xYourWalletHere...",
  "notes": "November coupon payment"
}
```

**Response:**
```json
{
  "job_id": "job_1731259200000_32f9a1",
  "bond_id": "bond_1731259200000_93f2a1",
  "cycle_index": 1,
  "status": "processing",
  "expected_recipients": 48
}
```

**Check Status:** `GET /v1/yield/jobs/:job_id`

### 6. Redeem Bond

**Endpoint:** `POST /v1/yield/bonds/:bond_id/redeem`

Redeem bond at maturity and burn NFT.

**Request:**
```json
{
  "investor_wallet": "0xYourWalletHere...",
  "nft_token_id": "100021",
  "destination_currency": "USDC"
}
```

**Response:**
```json
{
  "redeem_id": "red_1731259200000_1afc9b",
  "principal_returned": "1000000",
  "currency": "USDC",
  "tx_hash": "0xREDEEM_1afc9b",
  "finality_ms": 333
}
```

---

## 💰 Lending Pools

### Get Pool Information

**Endpoint:** `GET /v1/yield/pools`

**Response:**
```json
{
  "pools": [
    {
      "symbol": "USDC",
      "decimals": 6,
      "tvl": "10300000000",
      "utilization_bps": 4120,
      "base_apy_bps": 340
    },
    {
      "symbol": "JPYC",
      "decimals": 6,
      "tvl": "9800000000",
      "utilization_bps": 3700,
      "base_apy_bps": 420
    }
  ]
}
```

### Deposit to Pool

**Endpoint:** `POST /v1/yield/deposit`

**Request:**
```json
{
  "wallet": "0xYourWalletHere...",
  "currency": "USDC",
  "amount": "5000000"
}
```

**Response:**
```json
{
  "position_id": "pos_1731259200000_5d8f3c",
  "tx_hash": "0xDEP_5d8f3c",
  "finality_ms": 329
}
```

### Withdraw from Pool

**Endpoint:** `POST /v1/yield/withdraw`

**Request:**
```json
{
  "wallet": "0xYourWalletHere...",
  "currency": "USDC",
  "amount": "2000000"
}
```

---

## 🏦 Borrowing & Lending

### Borrow Against Collateral

**Endpoint:** `POST /v1/yield/borrow`

**Request:**
```json
{
  "borrower_wallet": "0xYourWalletHere...",
  "borrow_currency": "JPYC",
  "amount": "10000000",
  "collateral_wallet": "0xYourWalletHere...",
  "collateral_currency": "USDC",
  "collateral_amount": "12000000"
}
```

**Response:**
```json
{
  "loan_id": "loan_1731259200000_abc123",
  "tx_hash": "0xBORR_abc123",
  "finality_ms": 318
}
```

### Repay Loan

**Endpoint:** `POST /v1/yield/repay`

**Request:**
```json
{
  "borrower_wallet": "0xYourWalletHere...",
  "currency": "JPYC",
  "amount": "10020000"
}
```

---

## 👛 Position Tracking

### Get Wallet Positions

**Endpoint:** `GET /v1/yield/positions/:wallet`

**Response:**
```json
{
  "wallet": "0xYourWalletHere...",
  "pools": [
    {
      "currency": "USDC",
      "deposited": "3000000",
      "accrued_interest": "12000"
    }
  ],
  "bonds": [
    {
      "bond_id": "bond_1731259200000_93f2a1",
      "series_name": "Acme90D",
      "nft_token_ids": ["100021"],
      "units": 100,
      "next_coupon_date": "2025-12-15T00:00:00Z"
    }
  ],
  "loans": [
    {
      "currency": "JPYC",
      "principal": "10000000",
      "interest_due": "20000",
      "collateral_currency": "USDC",
      "collateral_amount": "12000000",
      "ltv_bps": 6500
    }
  ]
}
```

---

## 📊 Analytics & Stats

### Get Global Statistics

**Endpoint:** `GET /v1/yield/stats`

**Response:**
```json
{
  "tvl_total": "27400000000",
  "active_loans": 312,
  "avg_pool_apy_bps": 382,
  "bonds_active": 7,
  "total_bonds_issued": 15,
  "total_subscriptions": 234,
  "total_subscribed_value": "15600000.00",
  "last_24h_volume": "950000000"
}
```

### Get Job Status

**Endpoint:** `GET /v1/yield/jobs/:job_id`

Track long-running operations like coupon distributions.

---

## 🎯 Example Workflows

### Workflow 1: Issue and Sell Bonds

```bash
# Step 1: Register as issuer
curl -X POST http://localhost:4000/v1/yield/issuer/register \
  -H "Content-Type: application/json" \
  -d '{
    "issuer_wallet": "0xYourWalletHere...",
    "legal_name": "Acme Corp",
    "jurisdiction": "US",
    "contact_email": "treasury@acme.com"
  }'

# Step 2: Issue bond
curl -X POST http://localhost:4000/v1/yield/bonds/issue \
  -H "Content-Type: application/json" \
  -d '{
    "issuer_id": "issuer_...",
    "issuer_wallet": "0xYourWalletHere...",
    "currency": "USDC",
    "series_name": "Acme90D",
    "principal_per_unit": "1000000",
    "units_offered": 5000,
    "coupon_rate_bps": 500,
    "coupon_frequency": "MONTHLY",
    "tenor_days": 90,
    "subscription_start": "2025-11-15T00:00:00Z",
    "subscription_end": "2025-11-25T00:00:00Z",
    "transferability": "SOULBOUND"
  }'

# Step 3: Investors subscribe
curl -X POST http://localhost:4000/v1/yield/bonds/bond_.../subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "investor_wallet": "0xInvestorWallet...",
    "units": 100,
    "payment_currency": "USDC",
    "require_compliance": true
  }'

# Step 4: Distribute monthly coupon
curl -X POST http://localhost:4000/v1/yield/bonds/bond_.../distribute-coupon \
  -H "Content-Type: application/json" \
  -d '{
    "issuer_wallet": "0xYourWalletHere...",
    "cycle_index": 1,
    "funding_wallet": "0xYourWalletHere..."
  }'
```

### Workflow 2: Lending & Borrowing

```bash
# Step 1: Deposit to pool
curl -X POST http://localhost:4000/v1/yield/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0xYourWalletHere...",
    "currency": "USDC",
    "amount": "5000000000"
  }'

# Step 2: Borrow against collateral
curl -X POST http://localhost:4000/v1/yield/borrow \
  -H "Content-Type: application/json" \
  -d '{
    "borrower_wallet": "0xYourWalletHere...",
    "borrow_currency": "USDC",
    "amount": "3000000000",
    "collateral_wallet": "0xYourWalletHere...",
    "collateral_currency": "EURC",
    "collateral_amount": "4000000000"
  }'

# Step 3: View positions
curl http://localhost:4000/v1/yield/positions/0xYourWalletHere...
```

---

## 💡 Key Features

### Supported Currencies
- ✅ USDC (US Dollar Coin)
- ✅ EURC (Euro Coin)
- ✅ USYC (USD Yield Coin)
- ✅ JPYC (Japanese Yen Coin)
- ✅ BRLA (Brazilian Real)

### Bond Features
- ✅ NFT certificates (ERC-721)
- ✅ Flexible coupon schedules (Monthly, Quarterly, Bullet)
- ✅ Transferability options (Soulbound, Restricted, Freely)
- ✅ Automated coupon distribution
- ✅ Maturity redemption
- ✅ IPFS disclosure documents

### Pool Features
- ✅ Real-time TVL tracking
- ✅ Utilization-based APY
- ✅ Multi-currency support
- ✅ Instant deposits/withdrawals

### Security
- ✅ Compliance integration
- ✅ Audit logging (all operations)
- ✅ Idempotency support
- ✅ Rate limiting ready

---

## 📋 API Reference Summary

| Category | Endpoint | Method | Purpose |
|----------|----------|--------|---------|
| **Issuer** | `/yield/issuer/register` | POST | Register issuer |
| **Bonds** | `/yield/bonds/issue` | POST | Issue new bond |
| | `/yield/bonds` | GET | List all bonds |
| | `/yield/bonds/:id` | GET | Bond details |
| | `/yield/bonds/:id/subscribe` | POST | Buy bond units |
| | `/yield/bonds/:id/distribute-coupon` | POST | Pay coupon |
| | `/yield/bonds/:id/redeem` | POST | Redeem at maturity |
| **Pools** | `/yield/pools` | GET | Pool info & APY |
| | `/yield/deposit` | POST | Deposit to pool |
| | `/yield/withdraw` | POST | Withdraw from pool |
| **Lending** | `/yield/borrow` | POST | Borrow with collateral |
| | `/yield/repay` | POST | Repay loan |
| **Portfolio** | `/yield/positions/:wallet` | GET | All positions |
| **Stats** | `/yield/stats` | GET | Platform metrics |
| **Jobs** | `/yield/jobs/:id` | GET | Operation status |

---

## ✅ Status

- ✅ All yield endpoints implemented
- ✅ Registered in main API router
- ✅ Audit logging integrated
- ✅ Swagger documentation ready
- ✅ Ready for testing

**Base URL:** http://localhost:4000/v1/yield  
**Swagger Docs:** http://localhost:4000/docs  
**API Health:** http://localhost:4000/v1/health  

🎊 **Your money market API is live and ready!**


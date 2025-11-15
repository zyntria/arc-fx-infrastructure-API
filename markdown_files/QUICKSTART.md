# 🚀 ARC-FX API - Quick Start Guide

Get the ARC-FX Infrastructure API running in under 5 minutes!

## ⚡ Fastest Way to Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repo
git clone https://github.com/yourusername/arcfx-api.git
cd arcfx-api

# Start everything (API + PostgreSQL + Redis)
docker-compose up
```

**That's it!** API is now running at: **http://localhost:4000**

---

### Option 2: Local Development

```bash
# Install dependencies
npm install

# Copy environment config
cp env.example .env

# Start development server
npm run dev
```

**API running at:** **http://localhost:4000**

---

## 📖 View API Documentation

Once the server is running, open:

**http://localhost:4000/docs**

You'll see the full Swagger/OpenAPI documentation with interactive examples!

---

## 🧪 Test the API

### 1. Health Check

```bash
curl http://localhost:4000/v1/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T12:00:00Z",
  "network": {
    "name": "ARC Testnet",
    "chainId": 12345,
    "blockNumber": 789234,
    "connected": true
  }
}
```

---

### 2. List Supported Currencies

```bash
curl http://localhost:4000/v1/currencies
```

**Response:**
```json
{
  "currencies": [
    {
      "symbol": "USDC",
      "name": "USD Coin",
      "contract": "0x3600000000000000000000000000000000000000",
      "type": "stablecoin",
      "available": true
    },
    {
      "symbol": "EURC",
      "name": "Euro Coin",
      "available": true
    }
  ],
  "total": 2,
  "network": "arc-testnet"
}
```

---

### 3. Get FX Rate

```bash
curl "http://localhost:4000/v1/rates?base=USDC"
```

**Response:**
```json
{
  "base": "USDC",
  "rates": {
    "EURC": 0.9215,
    "USYC": 1.0145
  },
  "source": "arc-native-fx",
  "timestamp": "2025-11-09T12:00:00Z"
}
```

---

### 4. Get a Swap Quote

```bash
curl "http://localhost:4000/v1/quote?from_currency=USDC&to_currency=EURC&amount=100"
```

**Response:**
```json
{
  "quote_id": "quote_1234567890_abc",
  "from_currency": "USDC",
  "to_currency": "EURC",
  "from_amount": "100.000000",
  "to_amount": "92.059150",
  "rate": "0.9215",
  "fee": "0.100000",
  "estimated_gas": "0.02",
  "expires_at": "2025-11-09T12:00:30Z",
  "finality": "deterministic"
}
```

---

### 5. Execute a Swap

```bash
curl -X POST http://localhost:4000/v1/swap \
  -H "Content-Type: application/json" \
  -d '{
    "from_currency": "USDC",
    "to_currency": "EURC",
    "amount": 100,
    "from_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "to_wallet": "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    "require_compliance": true
  }'
```

**Response:**
```json
{
  "success": true,
  "tx_hash": "0x1234567890abcdef...",
  "status": "finalized",
  "finality_time_ms": 342,
  "explorer_url": "https://testnet.arcscan.app/tx/0x1234...",
  "note": "Transaction finalized with deterministic BFT consensus"
}
```

---

### 6. Batch Payouts

```bash
curl -X POST http://localhost:4000/v1/payouts \
  -H "Content-Type: application/json" \
  -d '{
    "funding_currency": "USDC",
    "funding_wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "payouts": [
      {
        "to_wallet": "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
        "currency": "EURC",
        "amount": 500,
        "metadata": "Salary payment - Employee 1"
      },
      {
        "to_wallet": "0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed",
        "currency": "USDC",
        "amount": 300,
        "metadata": "Salary payment - Employee 2"
      }
    ],
    "require_compliance": true
  }'
```

**Response:**
```json
{
  "job_id": "payout_1234567890_xyz",
  "status": "completed",
  "payouts_count": 2,
  "successful_count": 2,
  "failed_count": 0,
  "total_gas_cost": "0.04",
  "results": [
    {
      "to_wallet": "0x8ba1...",
      "currency": "EURC",
      "amount": 500,
      "status": "finalized",
      "tx_hash": "0xabc...",
      "explorer_url": "https://testnet.arcscan.app/tx/0xabc..."
    }
  ]
}
```

---

### 7. Check Wallet Compliance

```bash
curl -X POST http://localhost:4000/v1/compliance/check \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

**Response:**
```json
{
  "wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "risk_level": "low",
  "risk_score": 12,
  "flags": [],
  "source": "mock-compliance",
  "timestamp": "2025-11-09T12:00:00Z"
}
```

---

## 🎯 Next Steps

### Deploy Smart Contracts

```bash
# Install Foundry (if not already installed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Compile contracts
npm run contracts:compile

# Deploy to ARC testnet
# First, set your private key in .env
npm run contracts:deploy
```

### Enable Real Compliance

Update `.env`:
```bash
USE_MOCK_COMPLIANCE=false
ELLIPTIC_API_KEY=your-real-api-key
```

### Add Database Support

The API works without a database, but for production:

1. PostgreSQL stores audit logs
2. Redis caches quotes and rates

Already configured in `docker-compose.yml`!

---

## 📚 Learn More

- **Full Documentation**: [README.md](./README.md)
- **API Reference**: http://localhost:4000/docs
- **Smart Contracts**: [contracts/](./contracts/)
- **ARC Network Docs**: https://docs.arc.network

---

## 🐛 Troubleshooting

### Port 4000 already in use?

```bash
# Change port in .env
PORT=5000

# Or kill existing process
lsof -ti:4000 | xargs kill -9
```

### Can't connect to ARC RPC?

Check your internet connection and verify:
```bash
curl https://rpc.testnet.arc.network
```

### Docker issues?

```bash
# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

## ✅ You're Ready!

Your ARC-FX Infrastructure API is now running and ready to:

- ✅ Execute deterministic FX swaps
- ✅ Process batch payouts
- ✅ Check wallet compliance
- ✅ Track transaction finality
- ✅ Provide audit logs

**Start building your multi-currency application now!** 🚀

---

**Questions?** Open an issue or contact support@arcfx.dev


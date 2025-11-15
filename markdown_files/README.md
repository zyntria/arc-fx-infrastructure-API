# 🧩 ARC-FX Infrastructure API

> **Programmable API Layer for Deterministic Multi-Currency Settlement on the ARC Network**

A production-grade infrastructure API that leverages ARC Network's unique advantages — **sub-second finality**, **USDC gas**, **regulated validators**, and **built-in compliance** — through developer-friendly REST APIs and SDKs.

## 🎯 Overview

ARC-FX Infrastructure API provides a unified interface for **compliant, deterministic, programmable FX, settlement, and payouts** on the ARC Network. It orchestrates ARC's existing stablecoin and FX primitives through clean APIs without duplicating protocol-level functionality.

### Key Features

- ✅ **Deterministic Finality** - Sub-second transaction finality via Malachite BFT
- ✅ **Multi-Currency Support** - USDC, EURC, USYC with automatic FX conversion
- ✅ **Built-in Compliance** - Integrated Elliptic AML/CTF checks
- ✅ **Batch Payouts** - Multi-recipient settlements in single transactions
- ✅ **Low Gas Fees** - ~$0.02 per transaction on ARC
- ✅ **Enterprise-Grade** - Audit logs, webhooks, and compliance reports

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL (optional, for production)
- Redis (optional, for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/arcfx-api.git
cd arcfx-api

# Install dependencies
npm install

# Copy environment configuration
cp env.example .env

# Configure your .env file with ARC RPC URL and other settings

# Start development server
npm run dev
```

### Docker Setup

```bash
# Build and run with Docker Compose
npm run docker:run

# Or build manually
npm run docker:build
docker run -p 4000:4000 arcfx-api
```

## 📖 API Documentation

Once the server is running, access the interactive API documentation at:

**http://localhost:4000/docs**

### Base URL

```
http://localhost:4000/v1
```

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | API health check |
| `/currencies` | GET | List supported currencies |
| `/rates` | GET | Get current FX rates |
| `/compliance/check` | POST | Check wallet compliance |
| `/quote` | GET | Get swap quote |
| `/swap` | POST | Execute swap |
| `/payouts` | POST | Batch multi-recipient payouts |
| `/transactions/:id` | GET | Track transaction status |
| `/audit/logs` | GET | Retrieve audit logs |
| `/webhooks` | POST | Register webhook |

## 💡 Usage Examples

### 1. Get a Swap Quote

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
  "expires_at": "2025-01-15T12:00:30Z",
  "network": "arc-testnet",
  "finality": "deterministic"
}
```

### 2. Execute a Swap

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

### 3. Batch Payouts

```bash
curl -X POST http://localhost:4000/v1/payouts \
  -H "Content-Type: application/json" \
  -d '{
    "funding_currency": "USDC",
    "funding_wallet": "0xYourWallet",
    "payouts": [
      {"to_wallet": "0xRecipient1", "currency": "EURC", "amount": 500},
      {"to_wallet": "0xRecipient2", "currency": "USDC", "amount": 500}
    ],
    "require_compliance": true
  }'
```

### 4. Check Compliance

```bash
curl -X POST http://localhost:4000/v1/compliance/check \
  -H "Content-Type: application/json" \
  -d '{"wallet": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

## 🏗️ Architecture

```
┌──────────────────────────────────────────────┐
│           ARC-FX API Layer                   │
├──────────────────────────────────────────────┤
│  REST API  │  Webhooks  │  SDKs              │
├──────────────────────────────────────────────┤
│  Business Logic Services                     │
│  - FX Quote Orchestration                    │
│  - Compliance Adapter                        │
│  - Payout Batch Manager                      │
│  - Transaction Tracker                       │
├──────────────────────────────────────────────┤
│  Smart Contract Layer                        │
│  - ARCfxSettlement.sol (audit events)        │
│  - ARCfxPayouts.sol (batch execution)        │
├──────────────────────────────────────────────┤
│  ARC Network                                 │
│  - Deterministic finality (Malachite BFT)    │
│  - USDC/EURC native gas                      │
│  - Built-in FX services                      │
│  - Elliptic compliance                       │
└──────────────────────────────────────────────┘
```

## 🔐 Security & Compliance

### Authentication

API uses JWT bearer tokens for authentication. Get your API key from the dashboard (coming soon).

### Compliance Integration

- **Elliptic Integration**: Real-time AML/CTF checks
- **Mock Mode**: For development/testing
- **Batch Checks**: Efficient multi-wallet screening

### Rate Limiting

- **Development**: 100 requests/minute per IP
- **Production**: Contact us for enterprise limits

## 🔧 Configuration

### Environment Variables

See `env.example` for all configuration options:

```bash
# ARC Network
ARC_RPC_URL=https://rpc.testnet.arc.network
ARC_CHAIN_ID=12345

# Compliance
ELLIPTIC_API_KEY=your-key
USE_MOCK_COMPLIANCE=true

# Server
PORT=4000
LOG_LEVEL=info
```

## 📦 Smart Contracts

### ARCfxSettlement.sol

Logs all swaps and settlements for audit trails.

**Deploy:**
```bash
npm run contracts:compile
npm run contracts:deploy
```

### ARCfxPayouts.sol

Executes multi-recipient batch payouts with automatic FX conversion.

## 🧪 Testing

```bash
# Run tests
npm test

# Test contracts
npm run contracts:test
```

## 🚢 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure PostgreSQL database
- [ ] Set up Redis for caching
- [ ] Add Elliptic API key
- [ ] Deploy smart contracts
- [ ] Configure rate limits
- [ ] Set up monitoring
- [ ] Enable audit logging

### Deploy with Docker

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

The API exposes health metrics at `/health`:

```json
{
  "status": "healthy",
  "network": {
    "connected": true,
    "blockNumber": 789234
  },
  "contracts": {
    "settlement": "0x...",
    "payouts": "0x..."
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- **Documentation**: https://docs.arcfx.dev
- **ARC Network**: https://arc.network
- **Explorer**: https://testnet.arcscan.app
- **Support**: support@arcfx.dev

## 🎯 Roadmap

- [x] Core REST API
- [x] Swap & Quote endpoints
- [x] Batch payout system
- [x] Compliance integration
- [ ] TypeScript SDK
- [ ] Python SDK
- [ ] WebSocket streaming
- [ ] Circle CCTP integration
- [ ] Web dashboard
- [ ] Governance module

---

**Built with ❤️ for the ARC Network ecosystem**


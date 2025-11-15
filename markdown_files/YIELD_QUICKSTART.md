# 🚀 ARC-Yield Quick Start

## Test the Money Market API Now!

All endpoints are live at: `http://localhost:4000/v1/yield`

---

## ✅ Quick Test Commands

### 1. View Lending Pools
```bash
curl http://localhost:4000/v1/yield/pools | jq
```

### 2. View Platform Stats
```bash
curl http://localhost:4000/v1/yield/stats | jq
```

### 3. Register as Issuer
```bash
curl -X POST http://localhost:4000/v1/yield/issuer/register \
  -H "Content-Type: application/json" \
  -d '{
    "issuer_wallet": "0x1234567890abcdef1234567890abcdef12345678",
    "legal_name": "Demo Corp",
    "jurisdiction": "US",
    "contact_email": "demo@example.com"
  }' | jq
```

### 4. Issue a Bond
```bash
curl -X POST http://localhost:4000/v1/yield/bonds/issue \
  -H "Content-Type: application/json" \
  -d '{
    "issuer_id": "issuer_...",
    "issuer_wallet": "0x1234567890abcdef1234567890abcdef12345678",
    "currency": "USDC",
    "series_name": "Demo90D",
    "principal_per_unit": "1000000",
    "units_offered": 1000,
    "coupon_rate_bps": 500,
    "coupon_frequency": "MONTHLY",
    "tenor_days": 90,
    "subscription_start": "2025-11-15T00:00:00Z",
    "subscription_end": "2025-12-15T00:00:00Z",
    "transferability": "SOULBOUND"
  }' | jq
```

### 5. List All Bonds
```bash
curl http://localhost:4000/v1/yield/bonds | jq
```

### 6. Subscribe to a Bond
```bash
curl -X POST http://localhost:4000/v1/yield/bonds/bond_.../subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "investor_wallet": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    "units": 10,
    "payment_currency": "USDC",
    "require_compliance": true
  }' | jq
```

### 7. Deposit to Pool
```bash
curl -X POST http://localhost:4000/v1/yield/deposit \
  -H "Content-Type: application/json" \
  -d '{
    "wallet": "0x1234567890abcdef1234567890abcdef12345678",
    "currency": "USDC",
    "amount": "5000000"
  }' | jq
```

### 8. Check Your Positions
```bash
curl http://localhost:4000/v1/yield/positions/0x1234567890abcdef1234567890abcdef12345678 | jq
```

---

## 📊 Complete Example: Issue & Subscribe

```bash
#!/bin/bash

# Step 1: Register issuer
echo "📝 Step 1: Register Issuer"
ISSUER_RESPONSE=$(curl -s -X POST http://localhost:4000/v1/yield/issuer/register \
  -H "Content-Type: application/json" \
  -d '{
    "issuer_wallet": "0x1234567890abcdef1234567890abcdef12345678",
    "legal_name": "Demo Corp",
    "jurisdiction": "US",
    "contact_email": "demo@example.com"
  }')
echo $ISSUER_RESPONSE | jq
ISSUER_ID=$(echo $ISSUER_RESPONSE | jq -r '.issuer_id')

# Step 2: Issue bond
echo -e "\n💎 Step 2: Issue Bond"
BOND_RESPONSE=$(curl -s -X POST http://localhost:4000/v1/yield/bonds/issue \
  -H "Content-Type: application/json" \
  -d "{
    \"issuer_id\": \"$ISSUER_ID\",
    \"issuer_wallet\": \"0x1234567890abcdef1234567890abcdef12345678\",
    \"currency\": \"USDC\",
    \"series_name\": \"Demo90D\",
    \"principal_per_unit\": \"1000000\",
    \"units_offered\": 1000,
    \"coupon_rate_bps\": 500,
    \"coupon_frequency\": \"MONTHLY\",
    \"tenor_days\": 90,
    \"subscription_start\": \"2025-11-15T00:00:00Z\",
    \"subscription_end\": \"2025-12-15T00:00:00Z\",
    \"transferability\": \"SOULBOUND\"
  }")
echo $BOND_RESPONSE | jq
BOND_ID=$(echo $BOND_RESPONSE | jq -r '.bond_id')

# Step 3: Subscribe to bond
echo -e "\n💰 Step 3: Subscribe to Bond"
SUB_RESPONSE=$(curl -s -X POST http://localhost:4000/v1/yield/bonds/$BOND_ID/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "investor_wallet": "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    "units": 10,
    "payment_currency": "USDC",
    "require_compliance": true
  }')
echo $SUB_RESPONSE | jq

# Step 4: Check bond details
echo -e "\n📄 Step 4: Bond Details"
curl -s http://localhost:4000/v1/yield/bonds/$BOND_ID | jq

# Step 5: View investor positions
echo -e "\n👛 Step 5: Investor Positions"
curl -s http://localhost:4000/v1/yield/positions/0xabcdefabcdefabcdefabcdefabcdefabcdefabcd | jq

# Step 6: Platform stats
echo -e "\n📊 Step 6: Platform Stats"
curl -s http://localhost:4000/v1/yield/stats | jq
```

Save as `test_yield.sh`, make executable with `chmod +x test_yield.sh`, and run!

---

## 🎯 What You Can Build

### 1. **Corporate Bond Platform**
- Issue bonds for corporate financing
- Investors buy units and receive NFT certificates
- Automated monthly coupon payments
- Maturity redemption

### 2. **DeFi Lending Protocol**
- Deposit stablecoins to earn yield
- Borrow against collateral
- Real-time APY tracking
- Multi-currency support

### 3. **Tokenized Securities**
- Compliant digital securities
- Soulbound NFTs (non-transferable)
- Restricted transfers with allowlists
- Regulatory reporting via audit logs

### 4. **Yield Aggregator**
- Compare yields across pools
- Auto-rebalance for best APY
- Track all positions in one place
- Export for tax reporting

---

## 📋 All Available Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/yield/issuer/register` | POST | Register bond issuer |
| `/yield/bonds/issue` | POST | Create bond offering |
| `/yield/bonds` | GET | List all bonds |
| `/yield/bonds/:id` | GET | Bond details |
| `/yield/bonds/:id/subscribe` | POST | Buy bond units (get NFTs) |
| `/yield/bonds/:id/distribute-coupon` | POST | Pay coupon to holders |
| `/yield/bonds/:id/redeem` | POST | Redeem at maturity |
| `/yield/pools` | GET | Pool TVL & APY |
| `/yield/deposit` | POST | Deposit to pool |
| `/yield/withdraw` | POST | Withdraw from pool |
| `/yield/borrow` | POST | Borrow with collateral |
| `/yield/repay` | POST | Repay loan |
| `/yield/positions/:wallet` | GET | All wallet positions |
| `/yield/stats` | GET | Platform KPIs |
| `/yield/jobs/:id` | GET | Operation status |

---

## 🔗 Integration

### TypeScript
```typescript
// Will be available in @arcfx/sdk
const yieldApi = client.yield()

// Issue bond
const bond = await yieldApi.issueBond({
  issuerWallet: "0x...",
  currency: "USDC",
  seriesName: "Corp90D",
  principalPerUnit: "1000000",
  unitsOffered: 5000,
  couponRateBps: 500,
  couponFrequency: "MONTHLY",
  tenorDays: 90,
  // ...
})

// Subscribe
const sub = await yieldApi.subscribe(bond.bond_id, {
  investorWallet: "0x...",
  units: 100,
  paymentCurrency: "USDC"
})

// Get positions
const positions = await yieldApi.getPositions("0x...")
```

### Python
```python
# Will be available in arcfx package
from arcfx import Client

client = Client(api_key="...")
yield_api = client.yield

# Issue bond
bond = yield_api.issue_bond(
    issuer_wallet="0x...",
    currency="USDC",
    series_name="Corp90D",
    principal_per_unit="1000000",
    units_offered=5000,
    coupon_rate_bps=500,
    coupon_frequency="MONTHLY",
    tenor_days=90
)

# Subscribe
sub = yield_api.subscribe(
    bond_id=bond["bond_id"],
    investor_wallet="0x...",
    units=100,
    payment_currency="USDC"
)

# Get positions
positions = yield_api.get_positions("0x...")
```

---

## ✅ Status

- ✅ **14 endpoints** implemented
- ✅ Audit logging integrated
- ✅ Compliance checks included
- ✅ Multi-currency support
- ✅ NFT certificates ready
- ✅ Job tracking for async operations
- ✅ Swagger documentation

**API:** http://localhost:4000/v1/yield  
**Docs:** http://localhost:4000/docs  
**Guide:** `/YIELD_API_GUIDE.md`  

🎊 **Start building your money market now!**


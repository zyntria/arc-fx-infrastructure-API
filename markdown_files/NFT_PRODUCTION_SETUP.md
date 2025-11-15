# 🚀 Production-Ready NFT Certificate System

## ✅ What's Implemented

### 1. **PostgreSQL Database Storage**
- Persistent storage for NFT certificate metadata
- Survives server restarts
- Automatic fallback to in-memory storage if database not configured

### 2. **Real IPFS Storage via Storacha**
- Images uploaded to IPFS via Storacha CLI
- Permanent, decentralized storage
- Fallback to mock storage if Storacha not available

### 3. **Proper Cache Headers**
- 24-hour caching for metadata and images
- CORS headers for cross-origin access
- Immutable cache for better performance

---

## 📋 Prerequisites

1. **PostgreSQL Database**
   - Railway (recommended): https://railway.app
   - Supabase: https://supabase.com
   - Neon: https://neon.tech
   - Local PostgreSQL

2. **Storacha CLI** (for IPFS uploads)
   ```bash
   npm install -g @web3-storage/w3cli
   storacha login admin@zyntrialabs.com
   ```

3. **OpenAI API Key**
   - Get from: https://platform.openai.com/api-keys

---

## 🔧 Setup Instructions

### Step 1: Get a PostgreSQL Database

#### Option A: Railway (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add PostgreSQL
railway add postgresql

# Get DATABASE_URL
railway variables
```

#### Option B: Supabase
1. Go to https://supabase.com/dashboard
2. Create new project
3. Copy `DATABASE_URL` from Settings → Database

#### Option C: Neon
1. Go to https://console.neon.tech
2. Create new project
3. Copy connection string

### Step 2: Update Environment Variables

Add to your `.env` file:

```bash
# Database (REQUIRED for production)
DATABASE_URL=postgresql://user:password@host:5432/database

# OpenAI (REQUIRED for image generation)
OPENAI_API_KEY=sk-proj-...

# NFT Contract (from deployment)
BOND_NFT_CONTRACT=0x035667589F3eac34089dc0e4155A768b9b448EE7

# Operator Private Key (for minting)
PRIVATE_KEY=0x...
OPERATOR_PRIVATE_KEY=0x...

# Railway Public URL (for metadata)
RAILWAY_PUBLIC_URL=https://your-app.railway.app
```

### Step 3: Run Database Migration

```bash
cd ARC-FX-Infrastructure-API
npm run migrate
```

Expected output:
```
🔄 Running database migration...
✅ Database connection successful
✅ Database schema created/updated
✅ nft_certificates table has 0 records
🎉 Migration completed successfully!
```

### Step 4: Setup Storacha (IPFS)

```bash
# Install Storacha CLI
npm install -g @web3-storage/w3cli

# Login with your email
storacha login admin@zyntrialabs.com

# Verify setup
storacha space ls
storacha whoami
```

### Step 5: Deploy to Railway

```bash
# Push to Railway
git add .
git commit -m "Add production NFT storage"
git push

# Or deploy with Railway CLI
railway up
```

---

## 🧪 Testing

### Local Test (without database)
```bash
npm run dev
```
- Will use in-memory storage
- Data lost on restart

### Local Test (with database)
```bash
# Make sure DATABASE_URL is set
npm run migrate
npm run dev
```
- Data persists across restarts
- Production-like behavior

### Test NFT Minting

```bash
# Test with image generation + IPFS
curl -X POST http://localhost:4000/v1/nft/test/mint \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x93175587C8F2d8120c82B03BD105ACe3248E2941",
    "bond_id": "prod_test_'$(date +%s)'",
    "units": 5000,
    "generate_image": true
  }'
```

### Verify Metadata Endpoint

```bash
# Should return proper metadata
curl https://your-app.railway.app/v1/nft/bonds/prod_test_bond_001/metadata.json
```

---

## 📊 Database Schema

The `nft_certificates` table stores:

| Column | Type | Description |
|--------|------|-------------|
| `bond_id` | VARCHAR(255) | Unique bond identifier |
| `token_id` | INTEGER | NFT token ID from contract |
| `series_name` | VARCHAR(255) | Bond series name |
| `principal` | VARCHAR(50) | Principal amount |
| `currency` | VARCHAR(10) | Currency (USDC) |
| `coupon_rate` | VARCHAR(10) | Interest rate |
| `tenor_days` | VARCHAR(20) | Bond duration |
| `issuer_name` | VARCHAR(255) | Issuer name |
| `transferability` | VARCHAR(50) | Transfer rules |
| `units` | INTEGER | Number of units |
| `image_cid` | VARCHAR(255) | IPFS CID |
| `image_ipfs_url` | TEXT | ipfs:// URL |
| `image_gateway_url` | TEXT | HTTP gateway URL |
| `style` | VARCHAR(50) | Certificate style |
| `prompt_used` | TEXT | OpenAI prompt |
| `created_at` | TIMESTAMP | Creation time |
| `updated_at` | TIMESTAMP | Last update |

---

## 🔍 Monitoring

### Check Database Connection
```bash
# In Railway logs or terminal
[Database] ✅ PostgreSQL connection pool initialized
```

### Check Storacha Status
```bash
storacha space ls
```

### View Certificate Data
```bash
# Query database directly
psql $DATABASE_URL -c "SELECT bond_id, image_cid, created_at FROM nft_certificates;"
```

---

## 🐛 Troubleshooting

### "Database not configured - using in-memory storage"
- Add `DATABASE_URL` to `.env`
- Run `npm run migrate`

### "storacha: command not found"
- Install globally: `npm install -g @web3-storage/w3cli`
- Or deploy without Storacha (uses mock storage)

### "Route not found" for /v1/nft/...
- Check server logs for route registration
- Verify `BOND_NFT_CONTRACT` is set in `.env`
- Restart server

### ARCScan shows "No metadata"
- Wait 5-30 minutes for cache refresh
- Verify metadata endpoint works: `curl https://your-app.railway.app/v1/nft/bonds/{bond_id}/metadata.json`
- Check CORS headers are present

### Images not loading
- Verify image endpoint: `https://your-app.railway.app/v1/nft/bonds/{bond_id}/image`
- Check database has `image_gateway_url`
- Ensure Storacha uploaded successfully

---

## 📈 Production Deployment Checklist

- [ ] PostgreSQL database provisioned
- [ ] `DATABASE_URL` added to production env
- [ ] Database migration run successfully
- [ ] OpenAI API key configured
- [ ] Storacha CLI installed and authenticated
- [ ] NFT contract deployed and address in env
- [ ] Private key for minting configured
- [ ] Railway public URL set in env
- [ ] Test minting works
- [ ] Verify metadata endpoint returns correct data
- [ ] Check NFT appears on ARCScan
- [ ] Confirm images load from IPFS

---

## 🎉 Success Indicators

When everything is working correctly:

1. ✅ Server logs show: `Database: Connected`
2. ✅ Certificate metadata persists after restart
3. ✅ Images upload to real IPFS (CID starts with `bafy...`)
4. ✅ Metadata endpoint returns full certificate data
5. ✅ ARCScan shows NFT details and image
6. ✅ MetaMask displays NFT in wallet
7. ✅ Cache headers improve load times

---

## 🔗 Useful Links

- **NFT Contract on ARCScan**: https://testnet.arcscan.app/address/0x035667589F3eac34089dc0e4155A768b9b448EE7
- **Storacha Console**: https://console.storacha.network
- **OpenAI Platform**: https://platform.openai.com
- **Railway Dashboard**: https://railway.app/dashboard
- **Arc Testnet Faucet**: https://faucet.circle.com

---

## 📝 Notes

- **In-memory fallback**: System works without database, but data is lost on restart
- **Mock IPFS fallback**: If Storacha CLI not available, generates mock CIDs
- **Cache strategy**: Metadata cached for 24 hours to improve performance
- **Gas costs**: Minting NFTs costs ~0.001 USDC on Arc Testnet


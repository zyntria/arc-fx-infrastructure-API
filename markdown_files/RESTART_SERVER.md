# 🔄 Restart Server Instructions

## The Issue
The routes have the wrong paths. They were using `/v1/nft/test/...` but since they're registered with the `/v1` prefix, they should just use `/nft/test/...`.

## ✅ Fixed!
All routes are now corrected:
- ✅ `POST /v1/nft/test/mint`
- ✅ `GET /v1/nft/test/tokens/:address`
- ✅ `GET /v1/nft/test/info`

## 🔄 Restart Instructions

### Step 1: Stop the Server
In your terminal where the server is running:
```bash
Ctrl + C
```

### Step 2: Restart
```bash
cd /Users/iamreechi/Downloads/arcpay-demo-starter/ARC-FX-Infrastructure-API
npm run dev
```

### Step 3: Wait for Startup
You should see:
```
[14:XX:XX UTC] INFO: 🚀 ARC-FX API Server
[14:XX:XX UTC] INFO: Server listening at http://0.0.0.0:4000
```

### Step 4: Test
```bash
curl http://localhost:4000/v1/nft/test/info
```

You should get:
```json
{
  "contract_address": "0x035667589f3eac34089dc0e4155a768b9b448ee7",
  "network": "Arc Testnet",
  "chain_id": 5042002,
  ...
}
```

---

## 🧪 Then Test Minting

```bash
curl -X POST http://localhost:4000/v1/nft/test/mint \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x93175587C8F2d8120c82B03BD105ACe3248E2941",
    "bond_id": "my_first_bond",
    "units": 1000
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "NFT certificate minted successfully!",
  "token_id": "1",
  "tx_hash": "0x...",
  "arcscan_url": "https://testnet.arcscan.app/tx/0x...",
  "nft_url": "https://testnet.arcscan.app/token/0x035667589f3eac34089dc0e4155a768b9b448ee7?a=1"
}
```

---

## ⚠️ Still Getting 404?

Make sure your `.env` file has:
```bash
BOND_NFT_CONTRACT=0x035667589f3eac34089dc0e4155a768b9b448ee7
PRIVATE_KEY=0x9c044c21c2014967cae82a7b95e1d37a578e32287da524eee2cfe2a45985aca7
ARC_RPC_URL=https://rpc.testnet.arc.network
```

---

**After restart, test with the info endpoint first!** 🚀


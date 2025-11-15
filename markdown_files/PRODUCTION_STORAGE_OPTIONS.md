# Production Storage Options for NFT Certificates

## 🤔 "Do We Always Have To Use CLI?"

**Short Answer:** No! The CLI is just a workaround. Here are better production options:

---

## 📊 Storage Options Comparison

| Option | Pros | Cons | Best For |
|--------|------|------|----------|
| **Storacha CLI** | ✅ Works now<br>✅ Simple<br>✅ Reliable | ❌ Requires CLI installed<br>❌ Shell execution overhead<br>❌ Not ideal for scale | Hackathon, MVP |
| **Storacha JS Client** | ✅ Native integration<br>✅ No shell execution<br>✅ Better performance | ❌ Complex setup<br>❌ Module issues (we hit this) | Production (once fixed) |
| **Pinata** | ✅ Very easy API<br>✅ Great dashboard<br>✅ Reliable | ❌ Centralized service<br>❌ Paid plans | Production alternative |
| **Web3.Storage (legacy)** | ✅ Simple API<br>✅ Free tier | ❌ Being deprecated<br>❌ Moving to Storacha | Not recommended |
| **NFT.Storage** | ✅ Built for NFTs<br>✅ Simple API | ❌ Rate limited<br>❌ Uncertain future | Small projects |

---

## 🎯 Recommended Production Approach

### **Option 1: Fix Storacha JS Client (Best Long-term)**

The issue we hit was with module exports. Here's the proper fix:

```typescript
// src/services/storage-production.ts
import { create } from '@web3-storage/w3up-client'
import * as Signer from '@ucanto/principal/ed25519'
import * as DID from '@ipld/dag-ucan/did'

// Your Storacha account
const STORACHA_EMAIL = 'admin@zyntrialabs.com'
const STORACHA_SPACE_DID = 'did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E'

async function getStorachaClient() {
  // Create or load principal
  const principal = await Signer.generate()
  
  // Create client
  const client = await create({ principal })
  
  // Set space
  await client.setCurrentSpace(STORACHA_SPACE_DID)
  
  return client
}

export async function uploadToIPFS(buffer: Buffer, filename: string) {
  const client = await getStorachaClient()
  const file = new File([buffer], filename)
  const cid = await client.uploadFile(file)
  
  return {
    cid: cid.toString(),
    url: `ipfs://${cid}`,
    gateway: `https://w3s.link/ipfs/${cid}`
  }
}
```

**To implement this:**
```bash
# Install correct packages
npm install @web3-storage/w3up-client @ucanto/principal @ipld/dag-ucan

# Configure with your email delegation
# (requires one-time setup with Storacha team)
```

---

### **Option 2: Use Pinata (Easiest Production Alternative)**

Pinata is the most popular IPFS service for NFTs.

```typescript
// src/services/storage-pinata.ts
import axios from 'axios'
import FormData from 'form-data'

const PINATA_API_KEY = process.env.PINATA_API_KEY
const PINATA_SECRET = process.env.PINATA_API_SECRET

export async function uploadToIPFS(buffer: Buffer, filename: string) {
  const formData = new FormData()
  formData.append('file', buffer, filename)
  
  const response = await axios.post(
    'https://api.pinata.cloud/pinning/pinFileToIPFS',
    formData,
    {
      headers: {
        'Authorization': `Bearer ${PINATA_API_KEY}`,
        ...formData.getHeaders()
      }
    }
  )
  
  const cid = response.data.IpfsHash
  
  return {
    cid,
    url: `ipfs://${cid}`,
    gateway: `https://gateway.pinata.cloud/ipfs/${cid}`
  }
}
```

**Setup:**
1. Sign up at https://pinata.cloud
2. Free tier: 1GB storage, 100k requests/month
3. Get API keys from dashboard
4. Add to `.env`:
   ```bash
   PINATA_API_KEY=...
   PINATA_SECRET_API_KEY=...
   ```

**Pros:**
- ✅ Very reliable
- ✅ Great dashboard
- ✅ Dedicated gateways
- ✅ NFT-specific features
- ✅ Easy to use

---

### **Option 3: Hybrid Approach (Recommended for Hackathon → Production)**

Use CLI for now, swap in Pinata/fixed Storacha later:

```typescript
// src/services/storage.ts
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'cli' // 'cli' | 'pinata' | 'storacha'

export async function uploadToIPFS(buffer: Buffer, filename: string) {
  switch (STORAGE_PROVIDER) {
    case 'cli':
      return uploadViaStorachaCLI(buffer, filename)
    case 'pinata':
      return uploadViaPinata(buffer, filename)
    case 'storacha':
      return uploadViaStorachaClient(buffer, filename)
    default:
      return uploadMock(buffer, filename)
  }
}
```

**Benefits:**
- ✅ Use CLI for hackathon (works now!)
- ✅ Easy to swap providers later
- ✅ No code changes needed
- ✅ Just change env variable

---

## 🚀 For Your Storacha Account (admin@zyntrialabs.com)

### Current Setup Status

You have:
- ✅ Email: admin@zyntrialabs.com
- ✅ Space DID: `did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E`
- ✅ CLI working
- ✅ Uploads successful

### Production Deployment Options

#### **Option A: Keep Using CLI (Simplest)**

**When to use:** Hackathon, MVP, low volume

**Setup on production server:**
```bash
# On your server (Railway, AWS, etc.)
npm install -g @storacha/cli
storacha login admin@zyntrialabs.com
# Click email link
storacha space use did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E

# Your app can now use CLI uploads
```

**Pros:**
- ✅ Works immediately
- ✅ No code changes needed
- ✅ Reliable

**Cons:**
- ❌ Requires CLI on server
- ❌ Shell execution overhead
- ❌ Harder to scale horizontally

---

#### **Option B: Use Delegation Tokens (Professional)**

**When to use:** Production, scaling, serverless

**How it works:**
1. Create delegation token with your CLI:
   ```bash
   storacha delegation create --can 'store/add' --can 'upload/add' --output token.ucan
   ```

2. Store token in `.env`:
   ```bash
   STORACHA_DELEGATION_TOKEN="base64_encoded_token"
   ```

3. Use in code without CLI:
   ```typescript
   const client = await create()
   const delegation = parseDelegation(process.env.STORACHA_DELEGATION_TOKEN)
   await client.addProof(delegation)
   ```

**Pros:**
- ✅ No CLI required
- ✅ Works in containers/serverless
- ✅ More secure
- ✅ Better for scaling

---

#### **Option C: Switch to Pinata (If Storacha Gives Issues)**

**When to use:** Production reliability priority

**Cost:**
- Free: 1GB storage
- Picnic ($20/mo): 10GB
- Build ($100/mo): 100GB

**Setup:**
```typescript
// Just swap the storage service
import { uploadToIPFS } from './services/storage-pinata'

// Everything else stays the same!
const result = await uploadToIPFS(imageBuffer, 'certificate.png')
```

---

## 💡 My Recommendation for You

### **For Hackathon/Demo (Now):**
```
✅ Keep using Storacha CLI (it's working!)
✅ You have: admin@zyntrialabs.com
✅ Space: did:key:z6MkiQGSTCU1Ctm8AEqfv32U8E7dUspwe48ncSyBJaa6i19E
✅ storage-simple.ts works perfectly
```

### **For Production (Later):**

**Phase 1: Deploy on Railway/AWS**
```bash
# Install CLI on server
RUN npm install -g @storacha/cli
RUN storacha login admin@zyntrialabs.com
RUN storacha space use did:key:z6Mki...

# Your app uses storage-simple.ts (no changes!)
```

**Phase 2: When Scaling (Optional)**
```bash
# Either:
# 1. Fix Storacha JS client (no CLI needed)
# OR
# 2. Add Pinata as backup/primary
npm install pinata-sdk

# Update storage.ts to use Pinata
export STORAGE_PROVIDER=pinata
```

---

## 📋 Action Items

### **Right Now (Hackathon):**
- [x] Storacha working ✅
- [x] OpenAI working ✅
- [x] CLI uploads working ✅
- [ ] Build dashboard to display certificates
- [ ] Test in MetaMask wallet

### **Before Production:**
- [ ] Document Storacha deployment steps
- [ ] Create delegation tokens for production
- [ ] Set up monitoring for upload failures
- [ ] Consider Pinata as backup option
- [ ] Load test uploads

### **Future Optimization:**
- [ ] Fix Storacha JS client (eliminate CLI dependency)
- [ ] Implement upload retry logic
- [ ] Add image optimization (compress before upload)
- [ ] Cache IPFS gateway URLs
- [ ] Monitor storage costs

---

## 🎯 Bottom Line

**For your email (admin@zyntrialabs.com):**

1. **Current setup works perfectly for hackathon** ✅
2. **CLI is fine for MVP/demo** ✅
3. **For production, you have 3 options:**
   - Keep CLI (easiest, works everywhere)
   - Use delegation tokens (best practice)
   - Switch to Pinata (most reliable)

**You don't need to change anything right now!** The CLI approach is perfectly fine for:
- Hackathons
- MVPs
- Low-medium volume production

Only consider switching when you:
- Need to scale horizontally (multiple servers)
- Deploy to serverless (Lambda, Vercel)
- Want zero shell execution overhead

Your current setup is **production-ready** for most use cases! 🚀


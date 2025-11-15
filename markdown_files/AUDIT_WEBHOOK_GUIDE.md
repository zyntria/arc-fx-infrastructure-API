# Audit Logs & Webhooks Guide

Complete guide for using audit logging and webhook notifications in your ARC-FX API.

---

## 📊 Audit Logs

Audit logs track all API activity for compliance, debugging, and analytics.

### List Audit Logs

```bash
# Get recent audit logs
curl http://localhost:4000/v1/audit/logs

# Filter by type
curl "http://localhost:4000/v1/audit/logs?type=swap&limit=50"

# Filter by date range
curl "http://localhost:4000/v1/audit/logs?from_date=2025-11-01&to_date=2025-11-30"

# Pagination
curl "http://localhost:4000/v1/audit/logs?offset=100&limit=50"

# Combine filters
curl "http://localhost:4000/v1/audit/logs?type=payout&wallet_address=0x93175587C8F2d8120c82B03BD105ACe3248E2941"
```

**Response:**
```json
{
  "logs": [
    {
      "id": "audit_1762736123456_abc123",
      "timestamp": "2025-11-10T00:55:23.456Z",
      "type": "payout",
      "action": "batch_payout_executed",
      "wallet_address": "0x93175587C8F2d8120c82B03BD105ACe3248E2941",
      "amount": 1,
      "currency": "USDC",
      "tx_hash": "0x1f318e5c...",
      "status": "success",
      "metadata": {
        "destination_chain": "SOLANA",
        "payouts_count": 1
      }
    }
  ],
  "total": 123,
  "limit": 100,
  "offset": 0
}
```

### Get Audit Statistics

```bash
curl http://localhost:4000/v1/audit/stats
```

**Response:**
```json
{
  "total": 456,
  "by_type": {
    "swap": 123,
    "payout": 234,
    "compliance": 67,
    "cctp": 32
  },
  "by_status": {
    "success": 398,
    "failed": 42,
    "pending": 16
  },
  "last_24h": 89,
  "timestamp": "2025-11-10T01:00:00.000Z"
}
```

### Export Audit Logs

For compliance reporting, export all logs as JSON or CSV:

```bash
# Export as JSON
curl http://localhost:4000/v1/audit/export > audit-logs.json

# Export as CSV (for spreadsheets)
curl "http://localhost:4000/v1/audit/export?format=csv" > audit-logs.csv
```

### Log Types

- `swap` - FX swaps and quote generation
- `payout` - Batch payouts (same-chain and cross-chain)
- `compliance` - Wallet compliance checks
- `cctp` - Cross-chain USDC transfers
- `system` - System events and errors

---

## 🔔 Webhooks

Webhooks send real-time HTTP POST notifications to your server when events occur.

### Available Events

| Event | Description | Triggered When |
|-------|-------------|----------------|
| `onSwapFinalized` | FX swap completed | Swap transaction confirmed on-chain |
| `onPayoutCompleted` | Payout finished | All payouts in batch executed |
| `onComplianceFlag` | Compliance issue | Wallet fails AML/sanctions check |
| `onCCTPTransferInitiated` | CCTP burn started | USDC burned on source chain |
| `onCCTPTransferCompleted` | CCTP mint done | USDC minted on destination chain |

---

## 🔧 Webhook Setup

### 1. Register a Webhook

```bash
curl -X POST http://localhost:4000/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-server.com/api/webhooks/arcfx",
    "events": [
      "onSwapFinalized",
      "onPayoutCompleted",
      "onCCTPTransferInitiated"
    ],
    "secret": "your-secret-key-for-signature-verification"
  }'
```

**Response:**
```json
{
  "webhook_id": "webhook_1762736123456_abc123",
  "url": "https://your-server.com/api/webhooks/arcfx",
  "events": ["onSwapFinalized", "onPayoutCompleted", "onCCTPTransferInitiated"],
  "status": "active",
  "created_at": "2025-11-10T01:00:00.000Z"
}
```

**💡 Save the `webhook_id` for later management!**

### 2. List Your Webhooks

```bash
curl http://localhost:4000/v1/webhooks
```

**Response:**
```json
{
  "webhooks": [
    {
      "webhook_id": "webhook_1762736123456_abc123",
      "url": "https://your-server.com/api/webhooks/arcfx",
      "events": ["onSwapFinalized", "onPayoutCompleted"],
      "status": "active",
      "created_at": "2025-11-10T01:00:00.000Z",
      "last_triggered": "2025-11-10T01:15:30.000Z",
      "failure_count": 0
    }
  ],
  "total": 1
}
```

### 3. Test Your Webhook

Before going live, test that your endpoint receives webhooks:

```bash
curl -X POST http://localhost:4000/v1/webhooks/webhook_1762736123456_abc123/test
```

**Response:**
```json
{
  "success": true,
  "message": "Test webhook delivered successfully"
}
```

### 4. Delete a Webhook

```bash
curl -X DELETE http://localhost:4000/v1/webhooks/webhook_1762736123456_abc123
```

---

## 📥 Receiving Webhooks

### Webhook Payload Format

All webhooks send this structure:

```json
{
  "event": "onSwapFinalized",
  "timestamp": "2025-11-10T01:15:30.000Z",
  "webhook_id": "webhook_1762736123456_abc123",
  "data": {
    // Event-specific data (see below)
  }
}
```

### Example: onPayoutCompleted

```json
{
  "event": "onPayoutCompleted",
  "timestamp": "2025-11-10T01:15:30.000Z",
  "webhook_id": "webhook_1762736123456_abc123",
  "data": {
    "job_id": "payout_1762735984175_4k371qn8h",
    "status": "completed",
    "successful_count": 1,
    "failed_count": 0,
    "total_amount": 1,
    "currency": "USDC",
    "tx_hash": "0x1f318e5c...",
    "explorer_url": "https://testnet.arcscan.app/tx/0x1f318e5c..."
  }
}
```

### Example: onCCTPTransferInitiated

```json
{
  "event": "onCCTPTransferInitiated",
  "timestamp": "2025-11-10T01:15:30.000Z",
  "webhook_id": "webhook_1762736123456_abc123",
  "data": {
    "burn_tx_hash": "0x1f318e5c...",
    "message_hash": "0x1f318e5c...",
    "source_chain": "ARC",
    "destination_chain": "SOLANA",
    "amount": 1,
    "recipient": "G4JQXYJX2SPokkZMXiCXy5ZMxUxbyByTebmm5K3FFKNg",
    "estimated_time": "10-30 minutes"
  }
}
```

---

## 🔐 Webhook Security

### HMAC Signature Verification

All webhooks include an `X-Webhook-Signature` header for security.

**Headers received:**
```
Content-Type: application/json
User-Agent: ARCfx-Webhook/1.0
X-Webhook-Event: onSwapFinalized
X-Webhook-Timestamp: 2025-11-10T01:15:30.000Z
X-Webhook-Signature: a3f5c8d9e2b1a4c7f8e9d0b3a5c6f7e8d9b0a1c2d3e4f5a6b7c8d9e0f1a2b3c4
```

### Verify Signature (Node.js Example)

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// Express.js example
app.post('/api/webhooks/arcfx', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  const secret = process.env.ARCFX_WEBHOOK_SECRET;
  
  if (!verifyWebhookSignature(payload, signature, secret)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  const { event, data } = req.body;
  
  switch (event) {
    case 'onSwapFinalized':
      handleSwapFinalized(data);
      break;
    case 'onPayoutCompleted':
      handlePayoutCompleted(data);
      break;
    case 'onCCTPTransferInitiated':
      handleCCTPTransfer(data);
      break;
  }
  
  res.status(200).send('OK');
});
```

### Verify Signature (Python Example)

```python
import hmac
import hashlib
from flask import Flask, request

app = Flask(__name__)

def verify_signature(payload: str, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)

@app.route('/api/webhooks/arcfx', methods=['POST'])
def webhook():
    signature = request.headers.get('X-Webhook-Signature')
    payload = request.get_data(as_text=True)
    secret = os.getenv('ARCFX_WEBHOOK_SECRET')
    
    if not verify_signature(payload, signature, secret):
        return 'Invalid signature', 401
    
    event = request.json['event']
    data = request.json['data']
    
    # Process webhook
    if event == 'onPayoutCompleted':
        handle_payout_completed(data)
    
    return 'OK', 200
```

---

## ⚡ Webhook Delivery

### Retry Logic

If your webhook endpoint fails, the API will:
- **Retry 3 times** with exponential backoff (2s, 4s, 8s)
- **Timeout** after 10 seconds per attempt
- **Disable** webhook after 10 consecutive failures

### Best Practices

1. **Respond quickly** - Return `200 OK` immediately, process async
2. **Idempotency** - Handle duplicate deliveries gracefully
3. **Verify signatures** - Always check HMAC before processing
4. **Log failures** - Monitor your webhook endpoint
5. **Use HTTPS** - Webhooks only work with secure URLs

### Example: Quick Response Pattern

```javascript
// Good: Respond immediately, process in background
app.post('/api/webhooks/arcfx', async (req, res) => {
  // Verify signature
  if (!verifyWebhookSignature(req.body, req.headers['x-webhook-signature'])) {
    return res.status(401).send('Invalid signature');
  }
  
  // Respond immediately
  res.status(200).send('OK');
  
  // Process in background
  processWebhookAsync(req.body).catch(console.error);
});

async function processWebhookAsync(webhook) {
  // Heavy processing here
  await updateDatabase(webhook.data);
  await sendNotifications(webhook.data);
}
```

---

## 🧪 Testing Webhooks Locally

### 1. Use Ngrok for Local Testing

```bash
# Start ngrok tunnel
ngrok http 3000

# Use the HTTPS URL in your webhook registration
curl -X POST http://localhost:4000/v1/webhooks \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://abc123.ngrok.io/webhook",
    "events": ["onPayoutCompleted"],
    "secret": "test-secret"
  }'
```

### 2. Simple Test Server (Node.js)

```javascript
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhook', (req, res) => {
  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  console.log('Signature:', req.headers['x-webhook-signature']);
  res.send('OK');
});

app.listen(3000, () => {
  console.log('Webhook test server running on http://localhost:3000');
});
```

---

## 📈 Monitoring

### Check Webhook Health

```bash
curl http://localhost:4000/v1/webhooks
```

Look for:
- `status: "active"` ✅ Good
- `status: "failed"` ❌ Endpoint unreachable
- `failure_count: 0` ✅ No issues
- `failure_count: > 5` ⚠️ Check your endpoint

### Common Issues

| Issue | Solution |
|-------|----------|
| `status: "failed"` | Endpoint down or blocking requests |
| High `failure_count` | Check server logs, verify HTTPS |
| No webhooks received | Test with `/webhooks/:id/test` |
| `401 Invalid signature` | Verify secret matches registration |

---

## 🎯 Production Checklist

### Audit Logs
- [ ] Set up database for persistent storage (PostgreSQL/MongoDB)
- [ ] Configure log retention policy
- [ ] Set up automated exports for compliance
- [ ] Create dashboard for monitoring

### Webhooks
- [ ] Use HTTPS URLs only
- [ ] Implement signature verification
- [ ] Set up retry handling
- [ ] Monitor webhook health
- [ ] Configure alerts for failures
- [ ] Test all event types

---

## 📚 API Reference

### Audit Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/audit/logs` | GET | List audit logs with filters |
| `/v1/audit/stats` | GET | Get audit statistics |
| `/v1/audit/export` | GET | Export logs (JSON/CSV) |

### Webhook Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/v1/webhooks` | POST | Register new webhook |
| `/v1/webhooks` | GET | List all webhooks |
| `/v1/webhooks/:id` | DELETE | Delete webhook |
| `/v1/webhooks/:id/test` | POST | Send test webhook |

---

## 💡 Use Cases

### 1. Real-time Payment Notifications

```bash
# Register webhook for payout events
curl -X POST http://localhost:4000/v1/webhooks \
  -d '{
    "url": "https://yourapp.com/payments/notify",
    "events": ["onPayoutCompleted"],
    "secret": "your-secret"
  }'
```

When payouts complete, you'll receive instant notifications to update your UI.

### 2. Compliance Monitoring

```bash
# Register webhook for compliance flags
curl -X POST http://localhost:4000/v1/webhooks \
  -d '{
    "url": "https://yourapp.com/compliance/alert",
    "events": ["onComplianceFlag"],
    "secret": "your-secret"
  }'
```

Get immediate alerts when wallets fail AML checks.

### 3. Cross-Chain Transfer Tracking

```bash
# Track CCTP transfers
curl -X POST http://localhost:4000/v1/webhooks \
  -d '{
    "url": "https://yourapp.com/cctp/tracker",
    "events": ["onCCTPTransferInitiated", "onCCTPTransferCompleted"],
    "secret": "your-secret"
  }'
```

Monitor the entire cross-chain transfer lifecycle.

---

## 🔗 Related Docs

- [API Documentation](http://localhost:4000/docs)
- [CCTP Integration Guide](./CCTP_INTEGRATION_GUIDE.md)
- [Smart Contract Deployment](./DEPLOYMENT_GUIDE.md)

---

**Need help?** Check the Swagger UI at http://localhost:4000/docs for interactive API testing.


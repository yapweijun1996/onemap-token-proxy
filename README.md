# OneMap Token Proxy (Cloudflare Worker) 🇸🇬

A lightweight, secure API proxy built on Cloudflare Workers to handle OneMap authentication. This project allows you to fetch and validate OneMap JWT tokens without exposing your credentials in client-side code.

## ✨ Features

- **Server-Side Auth**: Securely stores OneMap credentials using Cloudflare Workers Secrets.
- **Token Proxy**: Simple `GET` or `POST` endpoint to get fresh tokens.
- **KV Caching**: High-speed token reuse powered by Cloudflare KV.
- **Token Status**: `GET` endpoint to check token validity and remaining time.
- **Zero Cost**: Runs entirely within the Cloudflare Workers Free Tier.
- **CORS Enabled**: Ready to be consumed by any frontend application.
- **Interactive Demo**: Includes a ready-to-use `index.html` address search example.

---

## 🎨 Interactive Demo

We've included a simple [index.html](file:///c:/Users/tno/Documents/GitHub/onemap-token-proxy/index.html) file that demonstrates a real-world use case: **Address Search**.

**How to use it:**
1. Simply open [index.html](file:///c:/Users/tno/Documents/GitHub/onemap-token-proxy/index.html) in any modern web browser.
2. It will automatically fetch a token from the proxy and allow you to search for Singapore addresses or postcodes.
3. This serves as a perfect starting point for your own frontend integration.

## 🚀 Quick Setup (Route B - Wrangler)

Follow these steps to deploy your own instance.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) installed.
- A [Cloudflare Account](https://dash.cloudflare.com/sign-up).
- [OneMap credentials](https://www.onemap.gov.sg/docs/#authentication) (Email & Password).

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone <your-repo-url>
cd onemap-token-proxy
npm install
```

### 3. Authentication
Login to your Cloudflare account using Wrangler CLI:
```bash
npx wrangler login
```
*(If the browser redirect fails, use `npx wrangler login --no-browser`)*

### 4. Configure Secrets (CRITICAL)
Set your OneMap credentials as secure environment variables. **Never write these in the code.**
```bash
# Set Email
npx wrangler secret put ONEMAP_EMAIL
# Set Password
npx wrangler secret put ONEMAP_PASSWORD
```

### 5. Create KV Namespace (NEW)
Create a KV namespace to enable caching:
```bash
npx wrangler kv:namespace create ONEMAP_CACHE
```
Copy the generated ID and add to your `wrangler.jsonc`:
```json
"kv_namespaces": [
  {
    "binding": "ONEMAP_CACHE",
    "id": "YOUR_KV_ID"
  }
]
```

### 6. Deployment
Publish your worker:
```bash
npm run deploy
```

---

## 🛠️ Usage Guide

> [!IMPORTANT]
> The examples below use a live demo URL: `https://onemap-token-proxy.onemap-token-proxy.workers.dev`.
> **If you are deploying your own instance, please replace this with your own `workers.dev` URL** (e.g., `https://onemap-auth.john-doe.workers.dev`).

### Endpoint: Fetch Token
**Request:**
- **Method**: `GET` or `POST`
- **URL**: `/token`

**Example (cURL):**
```bash
# Using GET (Simplest)
curl "https://onemap-token-proxy.onemap-token-proxy.workers.dev/token"

# Using POST
curl -X POST "https://onemap-token-proxy.onemap-token-proxy.workers.dev/token"
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJSUzI1Ni...",
  "source": "cache" 
}
```
*(Note: `source` will be `"onemap"` for fresh tokens or `"cache"` for reused tokens)*

### Endpoint: Check Token Status
**Request:**
- **Method**: `GET`
- **URL**: `/token/status?token=<JWT_TOKEN>`

**Example (JavaScript):**
```javascript
const token = 'YOUR_JWT_TOKEN';
fetch(`https://onemap-token-proxy.onemap-token-proxy.workers.dev/token/status?token=${token}`)
  .then(res => res.json())
  .then(data => console.log(data));
```

**Response:**
```json
{
  "valid": true,
  "expires_at": 1770000000,
  "time_left_seconds": 3600,
  "issued_at": 1769996400
}
```

---

## 💻 Local Development

Create a `.dev.vars` file in the root directory for local testing:
```env
ONEMAP_EMAIL=your_email@example.com
ONEMAP_PASSWORD=your_password
```

Start the local development server:
```bash
npm run dev
```

---

## 🔒 Security & Maintenance
- **Secrets Management**: Credentials are encrypted at rest by Cloudflare.
- **Monitoring**: Run `npx wrangler tail` to view real-time logs for debugging.
- **CORS**: Currently set to `*`. In production, consider restricting `Access-Control-Allow-Origin` to your specific domain in `src/index.js`.

---

## 📄 License
MIT

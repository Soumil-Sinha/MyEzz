# ONDC Logistics BAP - Monorepo

A certification-ready prototype implementing a minimal ONDC-compatible logistics Buyer App (BAP) that runs entirely offline using a mock network, but can connect to the real ONDC network by only changing environment variables.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────────────┐
│   Expo Mobile   │──REST──▶│   BAP Server     │──Beckn─▶│   Mock ONDC Network     │
│   React Native  │         │   (Express.js)   │◀────────│   (Gateway + Seller)    │
│   Port: 8081    │         │   Port: 3000     │callbacks │   Port: 4000            │
└─────────────────┘         └──────────────────┘         └─────────────────────────┘
```

### DEV_MODE=true (default)
```
Mobile App → REST → BAP Server → Mock Gateway → Mock Seller → callbacks → BAP Server
```

### DEV_MODE=false (production)
```
Mobile App → REST → BAP Server → Real ONDC Gateway → Real BPPs → callbacks → BAP Server
```

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Mobile App | Expo React Native (JavaScript) |
| Backend | Node.js + Express.js |
| Crypto | tweetnacl (ed25519) |
| Navigation | expo-router + react-navigation |
| Animations | react-native-reanimated |
| Database | None (in-memory store) |

## Beckn Protocol Compliance

| Field | Value |
|-------|-------|
| Domain | `ONDC:LOG10` |
| Core Version | `1.2.0` |
| Country | `IND` |
| TTL | `PT30S` |

### Implemented Flows
- `/search` → `/on_search` (catalog discovery)
- `/select` → `/on_select` (quote generation)
- `/init` → `/on_init` (order initialization)
- `/on_status` (status callbacks)
- `/on_error` (error callbacks)

### Protocol Rules
- ✅ `transaction_id` maintained across entire lifecycle
- ✅ `message_id` unique per API call
- ✅ ISO 8601 timestamps
- ✅ Authorization header signing (ed25519)
- ✅ Signature verification (disabled in DEV_MODE)

## Project Structure

```
ondc-logistics-bap/
├── apps/
│   ├── mobile/                  # Expo React Native app
│   │   ├── app/
│   │   │   ├── _layout.js      # Root navigation layout
│   │   │   ├── index.js        # Location input screen
│   │   │   ├── loading.js      # Search loading screen
│   │   │   └── results.js      # Provider results screen
│   │   ├── services/
│   │   │   └── api.js          # BAP server API client
│   │   ├── theme.js            # Design tokens
│   │   ├── app.json            # Expo config
│   │   └── package.json
│   │
│   ├── server/                  # BAP backend
│   │   ├── routes/
│   │   │   ├── api.js          # REST endpoints for mobile app
│   │   │   └── beckn.js        # Beckn callback endpoints
│   │   ├── services/
│   │   │   └── beckn-service.js # Beckn protocol client
│   │   ├── scripts/
│   │   │   └── generate-keys.js # Ed25519 key generator
│   │   ├── crypto.js           # Signing & verification
│   │   ├── store.js            # In-memory data store
│   │   ├── index.js            # Server entry point
│   │   └── package.json
│   │
│   └── mock-network/           # Mock ONDC network
│       ├── mock-gateway.js     # Gateway simulator
│       ├── mock-seller.js      # Seller BPP simulator
│       ├── index.js            # Network entry point
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared utilities
│       ├── constants.js        # ONDC constants & mock data
│       ├── helpers.js          # Protocol helpers
│       ├── index.js            # Barrel export
│       └── package.json
│
├── .env                        # Environment variables
├── .env.example                # Template
├── package.json                # Root workspace config
└── README.md                   # This file
```

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm 9+
- Expo CLI (`npm install -g expo-cli`)
- Android emulator or iOS simulator (or Expo Go app)

### 1. Install Dependencies

```bash
# Install root workspace dependencies
npm install

# Install server dependencies
cd apps/server && npm install && cd ../..

# Install mock network dependencies
cd apps/mock-network && npm install && cd ../..

# Install mobile dependencies
cd apps/mobile && npm install && cd ../..
```

### 2. Generate Keys (Optional for DEV_MODE)

```bash
cd apps/server
node scripts/generate-keys.js
# Copy the output keys to .env file
```

### 3. Start the Backend Services

Open two terminals:

**Terminal 1 - Mock Network:**
```bash
cd apps/mock-network
node index.js
# Server starts on port 4000
```

**Terminal 2 - BAP Server:**
```bash
cd apps/server
node index.js
# Server starts on port 3000
```

Or use concurrently from root:
```bash
npm run dev
```

### 4. Start the Mobile App

**Terminal 3:**
```bash
cd apps/mobile
npx expo start
```

Then:
- Press `a` for Android emulator
- Press `i` for iOS simulator
- Scan QR code with Expo Go app

### 5. Test the Flow

1. **Location Screen**: Enter pickup and drop locations
2. **Loading Screen**: Wait for mock network to respond (~2 seconds)
3. **Results Screen**: See 4 providers with prices:
   - Delhivery – ₹62 – 45 min (Bike) ⚡CHEAPEST
   - Shadowfax – ₹68 – 42 min (Bike)
   - Borzo – ₹95 – 38 min (Auto)
   - Porter – ₹120 – 30 min (Van)

## Mock Providers

| Provider | Price | ETA | Vehicle |
|----------|-------|-----|---------|
| Delhivery | ₹62 | 45 min | 🏍️ Bike |
| Shadowfax | ₹68 | 42 min | 🏍️ Bike |
| Borzo | ₹95 | 38 min | 🛺 Auto |
| Porter | ₹120 | 30 min | 🚐 Van |

## Switching to Production (ONDC Network)

To connect to the real ONDC network, update `.env`:

```env
# Change to production mode
DEV_MODE=false

# Set your ONDC subscriber credentials
SUBSCRIBER_ID=your-registered-bap-id
UNIQUE_KEY_ID=your-key-id
PUBLIC_KEY=your-base64-public-key
PRIVATE_KEY=your-base64-private-key

# ONDC gateway
GATEWAY_URL=https://preprod.gateway.ondc.org
BAP_BASE_URL=https://your-public-bap-url
```

**No code changes required.** The system will:
- Send requests to the real ONDC gateway instead of mock
- Enable strict Authorization header verification
- Use your registered subscriber credentials

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEV_MODE` | `true` | `true` = mock network, `false` = real ONDC |
| `BAP_PORT` | `3000` | BAP server port |
| `BAP_BASE_URL` | `http://localhost:3000` | BAP server URL |
| `MOCK_PORT` | `4000` | Mock network port |
| `MOCK_SELLER_URL` | `http://localhost:4000` | Mock seller URL |
| `GATEWAY_URL` | `https://preprod.gateway.ondc.org` | ONDC gateway URL |
| `SUBSCRIBER_ID` | `ondc-logistics-bap.example.com` | BAP subscriber ID |
| `UNIQUE_KEY_ID` | `k1` | Key identifier |
| `PUBLIC_KEY` | _(empty)_ | Base64-encoded ed25519 public key |
| `PRIVATE_KEY` | _(empty)_ | Base64-encoded ed25519 private key |
| `DOMAIN` | `ONDC:LOG10` | Beckn domain |
| `CORE_VERSION` | `1.2.0` | Beckn core version |
| `COUNTRY` | `IND` | Country code |
| `CITY` | `std:011` | City code |
| `TTL` | `PT30S` | Time to live for requests |

## API Reference

### Mobile REST API (BAP Server)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Search for logistics providers |
| GET | `/api/results/:txnId` | Get search results |
| POST | `/api/select` | Select a provider |
| POST | `/api/init` | Initialize an order |
| GET | `/api/transaction/:txnId` | Get full transaction state |
| GET | `/health` | Health check |

### Beckn Callback Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/beckn/on_search` | Receive catalog data |
| POST | `/beckn/on_select` | Receive quote data |
| POST | `/beckn/on_init` | Receive init confirmation |
| POST | `/beckn/on_status` | Receive status updates |
| POST | `/beckn/on_error` | Receive error callbacks |

## License

MIT

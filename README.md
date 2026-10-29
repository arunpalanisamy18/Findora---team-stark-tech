# Findora

Findora is an editorial-style university lost-and-found management platform. It features an Express/Node.js/MongoDB API paired with a React 19/TypeScript/Tailwind CSS v4 interface adhering to `DESIGN_SPEC.md`.

## Implementation Status

- **Differentiated Portals:**
  - **Consumer (Student) Portal:** Browse turned-in belongings, search active reports, filter by category/status, view transparent algorithmic similarity breakdowns, and access the dedicated **"My Activity & Claims"** dashboard to track self-reported items and real-time claim verification statuses (with handover desk collection instructions).
  - **Staff Security Command Center (Admin):** Dedicated command center featuring side-by-side photo verification (original item vs. claimant proof), full unredacted inventory management (with locker/bin storage assignment), system recovery rate & location hotspot analytics, security audit trails, and one-click CSV data export for institutional compliance.
- **Client-Side Photo Optimization:** Canvas-based image compression for Lost reports, Found listings, and Claim proof uploads (receipts, warranty, serial images). Zero third-party fees, zero paid cloud services or SDKs required.
- **Light & Black (Dark) Theme:** Full dark/light palette toggle adhering to `DESIGN_SPEC.md` tokens, with immediate persistence in `localStorage`.
- **Backend API:** Node.js/Express with Mongoose, bounded pagination, lexical similarity scoring, security headers, rate limiting, and audit logging.
- **Authentication & Security:** Scrypt password hashing with unique salts, signed HS256 bearer tokens, email verification codes, password reset endpoints, and server-side RBAC gating for reporting, claims, and administrative actions.
- **Privacy Protections:** Public item endpoints redact reporter email, phone number, and identifying features. Claim proof details and claimant uploads are restricted to verified administrators.
- **Verified Claim & Handover Flow:** Claims require verified claimant accounts. Approving a claim authorizes physical handover; item status transitions to `recovered` only after an administrator explicitly records the handover location and timestamp.
- **Search Sanitization:** Keyword searches escape regular expression special characters to prevent regex syntax crashes and ReDoS vulnerabilities.
- **Location Catalogue:** Structured location endpoints supporting campus buildings, zones, and custom fallback text.

## Requirements

- **Node.js:** v22+ (tested on Node.js v24)
- **npm:** v10+ (tested on npm 11)
- **MongoDB:** v7+ (running on `localhost:27017`)
- **Shell:** Windows PowerShell

## Local Setup (PowerShell)

### 1. MongoDB Service

Ensure MongoDB is installed and running on default port `27017`:

```powershell
# Check MongoDB service status
Get-Service -Name *mongo* -ErrorAction SilentlyContinue

# If installed as a Windows service and stopped:
Start-Service MongoDB
```

### 2. Dependencies

Install exact dependencies declared in `package-lock.json`:

```powershell
npm ci
```

### 3. Environment Configuration

Copy the template and configure your local environment:

```powershell
Copy-Item .env.example .env
```

Generate a high-entropy secret for `JWT_SECRET`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

In `.env`, ensure the following are set:
- `MONGODB_URI=mongodb://127.0.0.1:27017/findora`
- `JWT_SECRET=<generated-secret-at-least-32-characters>`
- `AUTH_DEV_SHOW_OTP=true` (enables OTP logging to terminal for local verification)
- `ADMIN_EMAIL=admin@example.edu`
- `ADMIN_PASSWORD="YourAdminPassword123!"` (at least 12 characters; enclose in quotes if using special characters such as `#`)

### 4. Seed First Administrator

Run the safe admin seed command:

```powershell
npm run seed:admin
```

> **Note:** The script checks if an administrator already exists and refuses to overwrite existing administrators. The seeded admin has a verified email address.

### 5. Start Development Servers

Open two PowerShell windows:

**Terminal 1 — Backend API Server:**
```powershell
npm run server:dev
# Server listens at http://localhost:5000
# Health endpoint: http://localhost:5000/api/health
```

**Terminal 2 — Frontend Vite Server:**
```powershell
npm run dev
# Vite runs at http://localhost:5173
```

Open `http://localhost:5173` in your browser.

## Commands Reference

| PowerShell Command | Purpose |
|---|---|
| `npm ci` | Clean install of exact dependencies from lockfile |
| `npm run dev` | Start Vite frontend development server (`http://localhost:5173`) |
| `npm run server:dev` | Start backend API with watch/auto-reload (`http://localhost:5000`) |
| `npm run server` | Start backend API via tsx |
| `npm run seed` | Insert sample demonstration items (skipped if items exist) |
| `npm run seed:admin` | Safely create first administrator account |
| `npm test` | Run Node.js security regression test suite |
| `npx tsc` | Run frontend TypeScript type checking |
| `npm run build:server` | Compile backend TypeScript into `dist-server/` |
| `npm run build` | Full production build (Frontend check + Vite bundle + Server compile) |
| `npm start` | Run compiled production server (`node dist-server/server/index.js`) |

## Testing

Run the security regression tests:

```powershell
npm test
```

Tests verify:
1. Administrative routes require administrator authorization (`requireAdmin`).
2. Production CORS rejects arbitrary non-whitelisted origins.
3. Public item listings redact private emails, phone numbers, and identifying marks.
4. Item reporting and claim submission enforce authenticated, verified accounts (`requireAuth`, `requireVerified`).
5. Item recovery requires explicit physical handover confirmation (`claim.handedOverAt` and `item.status = 'recovered'`).
6. OTP codes are never returned in public HTTP registration responses.
7. Item search queries escape regular expression characters (`escapeRegex`).

## Production Build & Run

To build and run the production-ready distribution:

```powershell
# 1. Run full build
npm run build

# 2. Run compiled server
npm start
```

The compiled backend serves both API endpoints under `/api/*` and the static production bundle from `dist/` on port 5000.

## Security & Architectural Notes

- Public item endpoints intentionally redact `contactEmail`, `contactPhone`, and `identifyingMarks`.
- Claim evidence is strictly confidential and visible only to authenticated administrators.
- Rate limiting is active locally at 20 requests/minute for authentication endpoints and 300 requests/minute for general endpoints.
- In production, set `NODE_ENV=production`, configure a production email provider adapter for verification and reset emails, set `TRUST_PROXY=true` only behind a trusted reverse proxy, and enforce HTTPS with secure cookies.

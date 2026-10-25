# KwickDrop — Backend

> **Tagline:** Drop it. Scan it. Share it.  
> **Brand:** Built by Krish  
> **Version:** 1.0 (MVP)

KwickDrop is a free, privacy-conscious, no-mandatory-login developer utility and temporary sharing platform backend built with Node.js, Express, TypeScript, MongoDB Atlas, Mongoose, and Cloudinary.

---

## Features

- **Text & Code Sharing**: Share plain text or syntax-highlighted code snippets up to 100 KB.
- **Secure File Sharing**: Upload images and documents up to 10 MB with extension allowlisting, binary magic-byte inspection, and dangerous executable blocking.
- **Configurable Expiration**: `1h`, `24h`, or `7d` (default `24h`). Real-time expiry enforcement prevents access immediately after expiration.
- **Short Codes & QR Compatibility**: Generates cryptographically secure, non-guessable `shareId` and human-friendly short codes.
- **One-time Deletion Capability Token**: Authors receive a deletion token upon creation to safely revoke or delete shares anytime.
- **Storage Provider Abstraction**: Cloudinary integration backed by an interchangeable storage interface with an in-memory mock provider for local development and unit/integration testing.
- **Automatic Scheduled Cleanup**: Background batch worker cleans expired Cloudinary assets and purges database records.
- **Strict Rate Limiting & Abuse Prevention**: Anonymous rate limiting (e.g. max 5 uploads/hour per IP, 20 shares/hour).
- **Security by Default**: Helmet, CORS origin restriction, request tracing (`X-Request-Id`), and strict download headers (`nosniff`, `default-src 'none'`).

---

## Project Structure

```text
server/
├── src/
│   ├── app.ts                         # Express application factory & middleware chain
│   ├── server.ts                      # Bootstrap entrypoint & graceful shutdown
│   ├── config/
│   │   ├── env.ts                     # Zod schema-validated environment configuration
│   │   ├── database.ts                # MongoDB connection management & readiness
│   │   └── cloudinary.ts              # Cloudinary SDK initialization
│   ├── modules/
│   │   ├── health/                    # /health & /ready probes
│   │   ├── shares/                    # Models, controllers, services, repositories
│   │   ├── uploads/                   # Multer file upload middleware
│   │   └── cleanup/                   # Batch cleanup worker logic
│   ├── storage/
│   │   ├── storage.interface.ts       # Storage provider interface
│   │   ├── cloudinary.provider.ts     # Cloudinary implementation
│   │   └── mock.provider.ts           # In-memory provider for testing
│   ├── middleware/
│   │   ├── error-handler.ts           # Centralized error formatter
│   │   ├── rate-limit.ts              # IP-based abuse prevention
│   │   ├── request-id.ts              # UUID request tracing
│   │   └── not-found.ts               # 404 handler
│   ├── utils/
│   │   ├── ids.ts                     # Cryptographic IDs & tokens
│   │   ├── errors.ts                  # Standard AppError hierarchy
│   │   └── file-validator.ts          # Magic byte inspection & sanitization
│   └── jobs/
│       └── cleanup-expired-shares.ts  # Scheduled background job runner
├── tests/
│   ├── helpers/                       # In-memory repository for test isolation
│   ├── unit/                          # IDs, validator, storage unit tests
│   └── integration/                   # Health, text-share, file-share, cleanup tests
├── docs/
│   └── api.md                         # Complete REST API specification
├── .env.example                       # Sample environment variables
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+ (tested on Node.js v25)
- npm v9+
- MongoDB instance (MongoDB Atlas free tier or local MongoDB)

### Installation

```bash
cd server
npm install
```

### Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Configure your environment variables:
```dotenv
PORT=5000
MONGODB_URI=mongodb://localhost:27017/kwickdrop
FRONTEND_ORIGIN=http://localhost:3000
PUBLIC_APP_URL=http://localhost:5000

# Optional for local development (defaults to 'mock')
STORAGE_PROVIDER=mock

# Required for production Cloudinary file uploads:
# STORAGE_PROVIDER=cloudinary
# CLOUDINARY_CLOUD_NAME=your_cloud_name
# CLOUDINARY_API_KEY=your_api_key
# CLOUDINARY_API_SECRET=your_api_secret
```

---

## Scripts

- `npm run dev`: Start development server with live watch via `tsx`.
- `npm run build`: Compile TypeScript to `./dist`.
- `npm run start`: Run production build from `./dist/server.js`.
- `npm test`: Run full Jest unit and integration test suite.
- `npm run test:watch`: Run tests in watch mode.

---

## Testing

The test suite covers unit and integration tests across all modules (IDs, file validator, storage abstraction, health endpoints, text share lifecycle, file upload/download, capability token deletion, real-time expiration, and background cleanup).

```bash
npm test
```

---

## Deployment to Render

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository and set the **Root Directory** to `server`.
3. Set the following build settings:
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
   - **Health Check Path**: `/health`
4. Set Environment Variables in the Render dashboard:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `FRONTEND_ORIGIN`: `https://your-frontend-app.vercel.app`
   - `PUBLIC_APP_URL`: `https://your-backend-app.onrender.com`
   - `STORAGE_PROVIDER`: `cloudinary`
   - `CLOUDINARY_CLOUD_NAME`: `<Your Cloudinary Cloud Name>`
   - `CLOUDINARY_API_KEY`: `<Your Cloudinary API Key>`
   - `CLOUDINARY_API_SECRET`: `<Your Cloudinary API Secret>`
5. Deploy service. Verify readiness at `https://your-backend-app.onrender.com/ready`.

---

## License

MIT. Built by Krish.

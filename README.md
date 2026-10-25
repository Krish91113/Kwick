# Kwick

> **Drop it. Scan it. Share it.**  
> *Built by Krish*

Kwick is a free, privacy-conscious, no-mandatory-login temporary sharing platform and developer utility hub.

Users can paste text, share code snippets, upload files up to 10 MB, generate QR codes, and access everyday developer utilities without creating an account.

---

## Architecture Overview

```text
Kwick/
├── frontend/             # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/              # Application components, views, utilities, tools
│   ├── public/           # Static assets
│   └── package.json
├── backend/              # Modular Express + TypeScript REST API
│   ├── src/              # Application source code
│   │   ├── config/       # Environment, Database, Cloudinary
│   │   ├── modules/      # Health, Shares, Uploads, Cleanup
│   │   ├── storage/      # Storage provider abstraction (Cloudinary + Mock)
│   │   ├── middleware/   # Error handling, rate limiting, request tracing
│   │   ├── utils/        # Cryptographic IDs, file validators, custom errors
│   │   └── jobs/         # Scheduled cleanup worker
│   ├── tests/            # Automated unit and integration test suite
│   ├── docs/             # REST API documentation
│   └── package.json
└── README.md
```

## Quick Start

### 1. Backend Server
```bash
cd backend
npm install
npm run build
npm run start
```

### 2. Frontend Web App
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to start using Kwick!

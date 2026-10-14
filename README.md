# Nudge ERP

A production-oriented, multi-tenant ERP platform for FMCG distributors, wholesalers and brands operating across retail and quick-commerce channels.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS v4, Recharts |
| Backend | NestJS, TypeScript, Prisma ORM, PostgreSQL |
| Queue | Redis, BullMQ |
| Auth | JWT (access + refresh tokens), bcrypt |
| API | REST `/api/v1`, Swagger/OpenAPI |
| Testing | Jest, Playwright |
| Infra | Docker Compose |

## Prerequisites

- **Node.js** v20+ (v24 recommended)
- **Docker Desktop** (for PostgreSQL and Redis)
- **npm** v10+
- **Git**

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/vijay-xd/Nudge-erp.git
cd Nudge-erp
```

### 2. Start infrastructure services

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 3. Set up the backend

```bash
cd backend
cp ../.env.example .env    # Edit .env if needed
npm install
npx prisma migrate dev     # Apply database migrations
npx prisma db seed         # Seed demo data
npm run start:dev          # Start in development mode
```

Backend runs at `http://localhost:3000`. Swagger docs at `http://localhost:3000/api/docs`.

### 4. Set up the frontend

```bash
cd frontend
npm install
npm run dev                # Start Vite dev server
```

Frontend runs at `http://localhost:5173`.

### 5. Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@nudge-demo.com | NudgeDemo2024! |
| Sales | sales@nudge-demo.com | NudgeDemo2024! |
| Warehouse | warehouse@nudge-demo.com | NudgeDemo2024! |
| Finance | finance@nudge-demo.com | NudgeDemo2024! |

> ⚠️ These accounts are for development/demo only. Never use in production.

## Project Structure

```
Nudge-erp/
├── backend/                 # NestJS API
│   ├── prisma/              # Schema, migrations, seed
│   ├── src/
│   │   ├── auth/            # Authentication & authorization
│   │   ├── products/        # Product management
│   │   ├── vendors/         # Vendor management
│   │   ├── customers/       # Customer management
│   │   ├── warehouses/      # Warehouse management
│   │   ├── dashboard/       # Dashboard analytics
│   │   ├── audit/           # Audit logging
│   │   ├── prisma/          # Database service
│   │   └── config/          # Configuration
│   └── test/                # E2E tests
├── frontend/                # React SPA
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API service layer
│   │   ├── contexts/        # React contexts
│   │   ├── types/           # TypeScript types
│   │   └── lib/             # Utilities
│   └── public/
├── docs/                    # Documentation
├── docker-compose.yml       # Dev infrastructure
└── .env.example             # Environment template
```

## Running Tests

```bash
# Backend unit/integration tests
cd backend && npm test

# Backend e2e tests
cd backend && npm run test:e2e

# Frontend type check
cd frontend && npx tsc --noEmit
```

## Documentation

- [Implementation Plan](docs/IMPLEMENTATION_PLAN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Database Schema](docs/DATABASE.md)
- [API Documentation](docs/API.md)
- [Security](docs/SECURITY.md)
- [Integrations](docs/INTEGRATIONS.md)
- [Deployment](docs/DEPLOYMENT.md)

## License

Private — All rights reserved.

# Nudge ERP — Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────┐
│                     Browser (SPA)                        │
│  React + Vite + TypeScript + Tailwind CSS + Recharts     │
│  React Router | TanStack Query | React Hook Form + Zod   │
└──────────────────┬───────────────────────────────────────┘
                   │  HTTP/REST (JSON)
                   ▼
┌──────────────────────────────────────────────────────────┐
│                  API Gateway (NestJS)                     │
│  /api/v1/*  │  JWT Auth  │  RBAC  │  Swagger             │
│  Validation Pipes  │  Rate Limiting  │  CORS              │
├──────────────────────────────────────────────────────────┤
│                  Service Layer                            │
│  Auth │ Products │ Vendors │ Customers │ Orders          │
│  Inventory │ Finance │ Dashboard │ Integrations          │
├──────────────────────────────────────────────────────────┤
│                  Data Layer (Prisma ORM)                  │
│  Tenant-scoped queries │ Transactions │ Migrations       │
└─────────┬──────────────────────┬─────────────────────────┘
          │                      │
          ▼                      ▼
┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │
│   Primary DB    │    │  Cache/Queue    │
└─────────────────┘    └─────────────────┘
```

## Multi-Tenancy Model

Nudge ERP uses a **shared database, shared schema** multi-tenancy model:

- Every business entity has an `organizationId` foreign key
- All database queries filter by `organizationId`
- JWT tokens include `organizationId` and `role`
- Backend guards enforce tenant isolation before queries
- No entity can be accessed across organisation boundaries

## Authentication Flow

```
1. User submits email + password
2. Backend verifies credentials (bcrypt)
3. Backend returns JWT access token (15min) + refresh token (7d)
4. Frontend stores tokens in localStorage
5. Every API request includes Authorization: Bearer <token>
6. On 401, frontend attempts token refresh
7. If refresh fails, user is redirected to login
```

## Request Lifecycle

```
HTTP Request
  → CORS Check
  → Rate Limiter
  → JWT Authentication Guard
  → Roles Guard (RBAC check)
  → Validation Pipe (DTO validation)
  → Controller (route handler)
  → Service (business logic)
  → Prisma (database query with org scope)
  → Response serialization
  → HTTP Response
```

## Module Architecture

### Backend Modules

| Module | Responsibility |
|--------|---------------|
| AuthModule | Login, register, JWT, RBAC |
| PrismaModule | Database connection (global) |
| ProductsModule | Product CRUD, categories, SKU mapping |
| VendorsModule | Vendor CRUD, product associations |
| CustomersModule | Customer CRUD, channel management |
| WarehousesModule | Warehouse CRUD, stock locations |
| DashboardModule | Analytics queries, metrics |
| AuditModule | Audit log recording and retrieval |

### Frontend Architecture

| Layer | Responsibility |
|-------|---------------|
| Pages | Route-level components, data loading |
| Components | Reusable UI components |
| Services | API calls via axios |
| Contexts | Auth state, org info |
| Types | TypeScript type definitions |
| Hooks | TanStack Query hooks |

## Data Flow

### Create Product Example

```
1. User fills product form (React Hook Form + Zod validation)
2. Service calls POST /api/v1/products with form data
3. JWT guard validates token, extracts organizationId
4. Roles guard checks user has appropriate role
5. ValidationPipe validates DTO with class-validator
6. ProductsService creates product with organizationId
7. AuditService logs the creation event
8. Response returns created product
9. TanStack Query invalidates product list cache
10. UI updates with new product
```

## Costing Method

Nudge ERP uses **Moving Weighted Average** for inventory costing:

```
New Average Cost = (Existing Stock × Current Avg Cost + New Qty × New Cost) / (Existing Stock + New Qty)
```

This is applied at the product-warehouse level during goods receipts.

## Integration Architecture

```
┌─────────────────────────────────────────┐
│              Adapter Interface           │
│  GmailAdapter │ AIAdapter │ ChannelAdapter│
├──────────┬──────────┬──────────┬─────────┤
│ Gmail API│ OpenAI   │ Blinkit  │ Manual  │
│ (OAuth)  │ (API Key)│ (CSV)    │ Import  │
└──────────┴──────────┴──────────┴─────────┘
```

Each integration uses an adapter pattern:
- Interface defines the contract
- Mock adapter for development/testing
- Real adapter for production with proper credentials
- Environment variables control which adapter is active

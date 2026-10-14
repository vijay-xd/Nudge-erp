# Nudge ERP — Security

## Authentication

- **Password hashing**: bcrypt with salt rounds (12)
- **JWT Access Token**: 15-minute expiry, includes userId, email, organizationId, role
- **JWT Refresh Token**: 7-day expiry, stored hashed in database, supports rotation and revocation
- **Session management**: Refresh tokens are single-use (rotation on each refresh)

## Authorization (RBAC)

| Role | Description |
|------|-------------|
| ORG_ADMIN | Full access to all organization data and settings |
| SALES | Sales orders, customers, products (read), dashboard |
| PROCUREMENT | Purchase orders, vendors, products, goods receipts |
| WAREHOUSE | Inventory, goods receipts, dispatch, stock adjustments |
| FINANCE | Invoices, payments, bills, financial reports, vendors, customers |
| ANALYST | Read-only access to analytics, reports, and dashboards |

### Permission Enforcement

- Backend guards check role on every protected endpoint
- Frontend hides navigation items and actions based on role
- **Frontend hiding is NOT a security mechanism** — all enforcement is server-side

## Multi-Tenancy

- Shared database, shared schema with `organizationId` column
- Every query includes `WHERE organizationId = ?`
- JWT token embeds `organizationId` — no client-supplied tenant IDs trusted
- Cross-org data access is a critical security violation

## Data Protection

- Passwords are never stored in plaintext
- OAuth tokens encrypted at rest (when applicable)
- Bank details restricted to FINANCE and ORG_ADMIN roles
- Audit logs never contain passwords, tokens, or secrets
- File uploads validated for type and size

## API Security

- Rate limiting on auth endpoints (10 req/min)
- General rate limiting (100 req/min per IP)
- Helmet security headers
- CORS restricted to configured frontend origin
- Input validation via class-validator on all DTOs
- Parameterized queries via Prisma (SQL injection protection)

## Secrets Management

- All secrets via environment variables
- `.env` files excluded from Git
- `.env.example` contains placeholder names only
- No hardcoded API keys or credentials in source

## Known Limitations

- CSRF protection not implemented (JWT in header, not cookie)
- Email-based password reset requires SMTP configuration
- File storage uses local filesystem (not encrypted at rest)
- No IP allowlisting or MFA in current phase

# Nudge ERP — Deployment Guide

## Development Environment

### Prerequisites
- Node.js v20+ 
- Docker Desktop
- npm v10+

### Local Setup
```bash
# Start infrastructure
docker-compose up -d

# Backend
cd backend
cp ../.env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## Production Build

### Backend
```bash
cd backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ with nginx, Vercel, or any static file server
```

## Environment Variables

See `.env.example` for the complete list. Critical production variables:

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_ACCESS_SECRET | Yes | Min 32 chars, unique per environment |
| JWT_REFRESH_SECRET | Yes | Min 32 chars, unique per environment |
| NODE_ENV | Yes | Set to `production` |
| CORS_ORIGINS | Yes | Frontend URL(s) |
| DEMO_MODE | No | Set to `false` in production |

## Database Management

### Migrations
```bash
# Create a new migration
npx prisma migrate dev --name description_of_change

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset
```

### Backups
```bash
# Create backup
docker exec nudge-postgres pg_dump -U nudge nudge_erp > backup_$(date +%Y%m%d).sql

# Restore backup
docker exec -i nudge-postgres psql -U nudge nudge_erp < backup_file.sql
```

## Docker Production Deployment

A production Docker setup would include:
1. Multi-stage Dockerfile for backend (build + runtime)
2. Nginx container for frontend static files
3. Managed PostgreSQL (e.g., Supabase, AWS RDS, Google Cloud SQL)
4. Managed Redis (e.g., Upstash, AWS ElastiCache)

> **Note**: Production Dockerfiles are planned for Phase 5.

## Health Checks

- Backend: `GET /api/v1/health` (planned)
- Database: Prisma connection test on startup
- Redis: Connection test on startup

## Monitoring

- Structured JSON logging via NestJS Logger
- Error tracking: integrate Sentry (planned)
- Metrics: application-level metrics (planned)

## Security Checklist for Production

- [ ] Change all default secrets (JWT_ACCESS_SECRET, JWT_REFRESH_SECRET)
- [ ] Set NODE_ENV=production
- [ ] Set DEMO_MODE=false
- [ ] Configure proper CORS_ORIGINS
- [ ] Enable HTTPS (via reverse proxy)
- [ ] Set up database backups
- [ ] Review rate limiting configuration
- [ ] Remove demo seed data
- [ ] Configure proper file storage

# Nudge ERP — API Documentation

## Base URL

```
http://localhost:3000/api/v1
```

## Swagger UI

Interactive API documentation is available at:

```
http://localhost:3000/api/docs
```

## Authentication

All endpoints except `/auth/*` require a valid JWT bearer token:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/register | Register user + create org |
| POST | /auth/login | Login with email/password |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Revoke refresh token |

### Dashboard

| Method | Path | Description |
|--------|------|-------------|
| GET | /dashboard/stats | Dashboard summary metrics |
| GET | /dashboard/trends | Revenue and order trends |

### Products

| Method | Path | Description |
|--------|------|-------------|
| GET | /products | List products (paginated) |
| GET | /products/:id | Get product detail |
| POST | /products | Create product |
| PATCH | /products/:id | Update product |
| DELETE | /products/:id | Archive product |

### Vendors

| Method | Path | Description |
|--------|------|-------------|
| GET | /vendors | List vendors (paginated) |
| GET | /vendors/:id | Get vendor detail |
| POST | /vendors | Create vendor |
| PATCH | /vendors/:id | Update vendor |
| DELETE | /vendors/:id | Archive vendor |

### Customers

| Method | Path | Description |
|--------|------|-------------|
| GET | /customers | List customers (paginated) |
| GET | /customers/:id | Get customer detail |
| POST | /customers | Create customer |
| PATCH | /customers/:id | Update customer |
| DELETE | /customers/:id | Archive customer |

### Warehouses

| Method | Path | Description |
|--------|------|-------------|
| GET | /warehouses | List warehouses |
| GET | /warehouses/:id | Get warehouse detail |
| POST | /warehouses | Create warehouse |
| PATCH | /warehouses/:id | Update warehouse |

### Audit Logs

| Method | Path | Description |
|--------|------|-------------|
| GET | /audit-logs | List audit logs (paginated) |

## Standard Response Format

### Success (single item)
```json
{
  "id": "uuid",
  "field": "value",
  ...
}
```

### Success (paginated list)
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

### Error
```json
{
  "statusCode": 400,
  "message": ["error details"],
  "error": "Bad Request"
}
```

## Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20, max: 100) |
| search | string | Search term |
| sortBy | string | Sort field |
| sortOrder | 'asc' \| 'desc' | Sort direction |
| isActive | boolean | Filter by active status |

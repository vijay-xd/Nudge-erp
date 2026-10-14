# Nudge ERP — Database Schema

## Overview

PostgreSQL 16 with Prisma ORM. All monetary fields use `Decimal(14,2)` or `Decimal(12,2)`. All quantities use `Decimal(12,3)`. UUIDs for primary keys. Timestamps on all entities.

## Entity Relationship Diagram

```
Organization ──┬── User (via OrganizationMembership)
               ├── Vendor ──── ProductVendor ──── Product
               ├── Customer ── SalesOrder ──┬── SalesOrderLine
               │                            ├── Shipment ── ShipmentLine
               │                            ├── CustomerInvoice ── InvoiceLine
               │                            └── InventoryReservation
               ├── Product ──┬── ProductCategory
               │             ├── ChannelSKUMap ── SalesChannel
               │             ├── InventoryBatch
               │             └── InventoryTransaction
               ├── Warehouse ─── StockLocation
               ├── PurchaseOrder ─┬── PurchaseOrderLine
               │                  ├── GoodsReceipt ── GoodsReceiptLine
               │                  └── VendorBill
               ├── Payment ── PaymentAllocation
               ├── CreditNote
               ├── IntegrationConnection
               ├── EmailImport ── AIExtraction
               ├── Notification
               └── AuditLog
```

## Key Invariants

1. **Tenant Isolation**: Every business entity references `organizationId`. All queries must filter by it.
2. **Immutable Ledger**: `InventoryTransaction` is append-only. Stock quantities are computed from transaction history.
3. **Decimal Precision**: All money uses `Decimal(14,2)`. No floating-point.
4. **Referential Integrity**: Foreign keys enforce relationships. Cascade deletes only on line items.
5. **Uniqueness**: SKU per org, order numbers per org, invoice numbers per org.
6. **Archival**: Master data (Products, Vendors, Customers) uses `isActive` flag instead of deletion.

## Indexes

Key indexes for query performance:
- `organizationId` on all business tables
- `organizationId + isActive` for filtered lists
- `organizationId + status` for order queries
- `organizationId + orderDate/createdAt` for date range queries
- `productId + warehouseId` for inventory lookups
- `expiryDate` for FEFO queries
- `referenceType + referenceId` for inventory transaction lookups

## Costing Method

**Moving Weighted Average** applied at product-warehouse level during goods receipts.

## Audit Trail

All significant business actions logged to `AuditLog` with:
- Actor (userId)
- Organization
- Action type
- Entity type and ID
- JSON diff of changes (non-sensitive fields only)
- Timestamp

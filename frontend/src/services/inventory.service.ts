import api from '@/lib/api';

export interface StockSummaryItem {
  id: string;
  sku: string;
  name: string;
  brand?: string;
  category: string;
  unitOfMeasure: string;
  unitCost: number;
  sellingPrice: number;
  onHand: number;
  reserved: number;
  available: number;
  reorderLevel: number;
  totalValue: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

export interface InventoryBatchItem {
  id: string;
  batchNumber: string;
  product: { id: string; sku: string; name: string; unitOfMeasure: string };
  warehouse: { id: string; name: string; code: string };
  quantity: number;
  reservedQty: number;
  availableQty: number;
  unitCost: number;
  expiryDate?: string;
  daysToExpiry?: number;
  expiryStatus: 'GOOD' | 'NEAR_EXPIRY' | 'EXPIRED';
}

export interface InventoryTransactionItem {
  id: string;
  product: { sku: string; name: string; unitOfMeasure: string };
  warehouse: { name: string; code: string };
  transactionType: string;
  quantity: number;
  unitCost?: number;
  batchNumber?: string;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  createdAt: string;
}

export const inventoryService = {
  async getStockSummary(params?: { warehouseId?: string; search?: string }) {
    const res = await api.get('/inventory/stock-summary', { params });
    return res.data;
  },

  async getBatches(params?: { warehouseId?: string; productId?: string }) {
    const res = await api.get('/inventory/batches', { params });
    return res.data;
  },

  async getLedger(params?: Record<string, any>) {
    const res = await api.get('/inventory/ledger', { params });
    return res.data;
  },

  async adjustStock(data: {
    productId: string;
    warehouseId: string;
    adjustmentType: string;
    quantity: number;
    reason: string;
    batchNumber?: string;
    expiryDate?: string;
    unitCost?: number;
  }) {
    const res = await api.post('/inventory/adjust', data);
    return res.data;
  },

  async transferStock(data: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    batchNumber?: string;
    notes?: string;
  }) {
    const res = await api.post('/inventory/transfer', data);
    return res.data;
  },

  getExportUrl() {
    return '/api/v1/inventory/export/csv';
  },
};

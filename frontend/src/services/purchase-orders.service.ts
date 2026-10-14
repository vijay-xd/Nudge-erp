import api from '@/lib/api';

export interface PurchaseOrderLine {
  id: string;
  productId: string;
  quantity: number;
  receivedQty: number;
  unitCost: number;
  taxRate: number;
  taxAmount: number;
  lineTotal: number;
  product: {
    id: string;
    sku: string;
    name: string;
    unitOfMeasure: string;
  };
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  vendorId: string;
  vendor: {
    id: string;
    legalName: string;
    tradingName?: string;
    gstin?: string;
  };
  orderDate: string;
  expectedDelivery?: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  lines: PurchaseOrderLine[];
  goodsReceipts?: any[];
  vendorBills?: any[];
  _count?: {
    lines: number;
    goodsReceipts: number;
    vendorBills: number;
  };
}

export const purchaseOrdersService = {
  async getAll(params?: Record<string, any>) {
    const res = await api.get('/purchase-orders', { params });
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get(`/purchase-orders/${id}`);
    return res.data;
  },

  async create(data: { vendorId: string; expectedDelivery?: string; notes?: string; lines: any[] }) {
    const res = await api.post('/purchase-orders', data);
    return res.data;
  },

  async updateStatus(id: string, status: string, notes?: string, cancelReason?: string) {
    const res = await api.patch(`/purchase-orders/${id}/status`, { status, notes, cancelReason });
    return res.data;
  },

  async receiveGoods(id: string, data: { warehouseId: string; notes?: string; lines: any[] }) {
    const res = await api.post(`/purchase-orders/${id}/receipts`, data);
    return res.data;
  },

  async generateBill(id: string) {
    const res = await api.post(`/purchase-orders/${id}/bill`);
    return res.data;
  },

  getExportUrl() {
    return '/api/v1/purchase-orders/export/csv';
  },
};

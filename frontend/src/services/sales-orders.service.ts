import api from '@/lib/api';

export interface SalesOrderLine {
  id: string;
  productId: string;
  quantity: number;
  fulfilledQty: number;
  unitPrice: number;
  discount: number;
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

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: {
    id: string;
    legalName: string;
    tradingName?: string;
  };
  channel?: {
    id: string;
    name: string;
  };
  externalOrderId?: string;
  orderDate: string;
  expectedDelivery?: string;
  status: string;
  source: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  notes?: string;
  lines: SalesOrderLine[];
  shipments?: any[];
  invoices?: any[];
  reservations?: any[];
  _count?: {
    lines: number;
    shipments: number;
    invoices: number;
  };
}

export interface CreateSalesOrderInput {
  customerId: string;
  channelId?: string;
  externalOrderId?: string;
  expectedDelivery?: string;
  notes?: string;
  lines: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
  }>;
}

export const salesOrdersService = {
  async getAll(params?: Record<string, any>) {
    const res = await api.get('/sales-orders', { params });
    return res.data;
  },

  async getById(id: string) {
    const res = await api.get(`/sales-orders/${id}`);
    return res.data;
  },

  async create(data: CreateSalesOrderInput) {
    const res = await api.post('/sales-orders', data);
    return res.data;
  },

  async updateStatus(id: string, status: string, notes?: string, cancelReason?: string) {
    const res = await api.patch(`/sales-orders/${id}/status`, { status, notes, cancelReason });
    return res.data;
  },

  async reserveStock(id: string, warehouseId: string) {
    const res = await api.post(`/sales-orders/${id}/reserve`, { warehouseId });
    return res.data;
  },

  async fulfill(id: string, data: { warehouseId: string; carrier?: string; trackingNumber?: string; items: any[] }) {
    const res = await api.post(`/sales-orders/${id}/fulfill`, data);
    return res.data;
  },

  async generateInvoice(id: string) {
    const res = await api.post(`/sales-orders/${id}/invoice`);
    return res.data;
  },

  getExportUrl() {
    return '/api/v1/sales-orders/export/csv';
  },
};

import api from '@/lib/api';

export interface ShipmentItem {
  id: string;
  shipmentNumber: string;
  salesOrderId: string;
  salesOrder: {
    id: string;
    orderNumber: string;
    customer: { legalName: string };
  };
  warehouse: { id: string; name: string; code: string };
  dispatchDate?: string;
  carrier?: string;
  trackingNumber?: string;
  status: string;
  notes?: string;
  lines: Array<{
    id: string;
    shippedQty: number;
    salesOrderLine: {
      product: { sku: string; name: string };
    };
  }>;
}

export interface FillRateMetrics {
  totalOrders: number;
  fulfilledOrders: number;
  partiallyFulfilledOrders: number;
  pendingOrders: number;
  totalOrderedQty: number;
  totalShippedQty: number;
  fillRatePercent: number;
  totalShipments: number;
}

export const fulfilmentService = {
  async getReadyOrders() {
    const res = await api.get('/fulfilment/ready-orders');
    return res.data;
  },

  async getShipments(params?: Record<string, any>) {
    const res = await api.get('/fulfilment/shipments', { params });
    return res.data;
  },

  async getShipmentById(id: string) {
    const res = await api.get(`/fulfilment/shipments/${id}`);
    return res.data;
  },

  async updateShipmentStatus(id: string, data: { status: string; carrier?: string; trackingNumber?: string; notes?: string }) {
    const res = await api.patch(`/fulfilment/shipments/${id}/status`, data);
    return res.data;
  },

  async getMetrics(): Promise<FillRateMetrics> {
    const res = await api.get('/fulfilment/metrics');
    return res.data;
  },
};

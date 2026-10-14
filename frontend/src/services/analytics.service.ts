import api from '@/lib/api';

export interface AnalyticsOverview {
  dateRange: { start: string; end: string };
  metrics: {
    netRevenue: number;
    grossInvoiced: number;
    totalGstCollected: number;
    totalOrders: number;
    fillRatePercent: number;
    totalOrderedQty: number;
    totalShippedQty: number;
    activeVendors: number;
    totalInventoryValue: number;
    stockoutCount: number;
    lowStockCount: number;
    imports: {
      total: number;
      pendingReview: number;
      approved: number;
    };
  };
}

export interface ProductPerformanceItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  sellingPrice: number;
  purchaseCost: number | null;
  hasReliableCost: boolean;
  currentStock: number;
  totalUnitsSold: number;
  totalRevenue: number;
  grossMarginPercent: number | null;
  grossProfit: number | null;
}

export interface ReorderRecommendationItem {
  id: string;
  sku: string;
  name: string;
  unitOfMeasure: string;
  currentStock: number;
  availableStock: number;
  reorderLevel: number;
  leadTimeDays: number;
  dailyVelocity: number;
  safetyStock: number;
  reorderPoint: number;
  needsReorder: boolean;
  suggestedOrderQty: number;
  preferredVendor: string;
}

export const analyticsService = {
  async getOverview(startDate?: string, endDate?: string): Promise<AnalyticsOverview> {
    const res = await api.get('/analytics/overview', { params: { startDate, endDate } });
    return res.data;
  },

  async getProductPerformance(): Promise<ProductPerformanceItem[]> {
    const res = await api.get('/analytics/product-performance');
    return res.data;
  },

  async getReorderRecommendations(): Promise<ReorderRecommendationItem[]> {
    const res = await api.get('/analytics/reorder-recommendations');
    return res.data;
  },

  getExportUrl() {
    return '/api/v1/analytics/export/csv';
  },
};

import api from '@/lib/api';

export interface DashboardStatsResponse {
  revenue: {
    currentMonth: number;
    previousMonth: number;
    growthPercentage: number;
  };
  activeVendors: number;
  orders: {
    currentMonth: number;
    allTime: number;
    pendingReview: number;
  };
  fillRate: {
    percentage: number;
    totalOrdered: number;
    totalFulfilled: number;
  };
  inventoryValue: number;
  lowStockCount: number;
  lowStockProducts: Array<{
    id: string;
    sku: string;
    name: string;
    currentStock: number;
    reorderLevel: number;
    unitOfMeasure: string;
    sellingPrice: number | null;
  }>;
  gmailImports: {
    total: number;
    pendingReview: number;
    approved: number;
    failed: number;
  };
  topSellingProducts: Array<{
    productId: string;
    name: string;
    sku: string;
    brand: string;
    unitsSold: number;
    totalRevenue: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    title: string;
    subtitle: string;
    status: string;
    amount: number;
    timestamp: string;
  }>;
}

export interface TrendDataPoint {
  month: string;
  revenue: number;
  grossInvoiced: number;
  collected: number;
  orderValue: number;
  orderCount: number;
  invoiceCount: number;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStatsResponse> {
    const { data } = await api.get<DashboardStatsResponse>('/dashboard/stats');
    return data;
  },

  async getTrends(): Promise<{ trends: TrendDataPoint[] }> {
    const { data } = await api.get<{ trends: TrendDataPoint[] }>('/dashboard/trends');
    return data;
  },
};

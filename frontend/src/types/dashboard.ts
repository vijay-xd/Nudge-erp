export interface StatMetric {
  value: number | string;
  changePercent: number;
  period: string;
}

export interface DashboardStats {
  revenue: StatMetric;
  orders: StatMetric;
  activeVendors: StatMetric;
  orderFillRate: StatMetric;
  lowStockCount: number;
  pendingApprovalsCount: number;
}

export interface RevenueTrendPoint {
  date: string;
  revenue: number;
  orders: number;
  projected?: number;
}

export interface TopProductMetric {
  id: string;
  name: string;
  sku: string;
  unitsSold: number;
  revenue: number;
  category: string;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  totalAmount: number;
  status: OrderStatus;
  itemsCount: number;
  createdAt: string;
}

export interface LowStockItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  reorderPoint: number;
  unitPrice: number;
  category: string;
  supplier?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  revenueTrend: RevenueTrendPoint[];
  topProducts: TopProductMetric[];
  recentOrders: RecentOrder[];
  lowStockItems: LowStockItem[];
}

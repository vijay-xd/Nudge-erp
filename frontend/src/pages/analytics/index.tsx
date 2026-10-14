import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Download,
  DollarSign,
  ShoppingCart,
  Percent,
  AlertTriangle,
  Package,
  Layers,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { analyticsService } from '@/services/analytics.service';

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'profitability' | 'reorder'>('profitability');

  const { data: overviewData, isLoading: isOverviewLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => analyticsService.getOverview(),
  });

  const { data: performanceData, isLoading: isPerfLoading } = useQuery({
    queryKey: ['analytics-performance'],
    queryFn: () => analyticsService.getProductPerformance(),
  });

  const { data: reorderData, isLoading: isReorderLoading } = useQuery({
    queryKey: ['analytics-reorder'],
    queryFn: () => analyticsService.getReorderRecommendations(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Analytics & Product Intelligence"
        description="Deterministic revenue calculations, gross margins, fill rate analysis, and transparent baseline reorder forecasting."
        actions={
          <a
            href={analyticsService.getExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />
            Export Performance CSV
          </a>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Net Recognized Revenue</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{overviewData?.metrics?.netRevenue?.toLocaleString('en-IN') ?? '0.00'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Excl. GST, adjusted for credit notes</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Total Orders (Sales)</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {overviewData?.metrics?.totalOrders ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Shipped: {overviewData?.metrics?.totalShippedQty} units
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Operational Fill Rate</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-1.5">
              {overviewData?.metrics?.fillRatePercent ?? 100}%
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">Fulfilled ordered quantities</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Total Stock Value</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{overviewData?.metrics?.totalInventoryValue?.toLocaleString('en-IN') ?? '0.00'}
            </div>
            <p className="text-xs text-slate-500 mt-1">Weighted average cost basis</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profitability')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'profitability'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Product Profitability & Margins
        </button>
        <button
          onClick={() => setActiveTab('reorder')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'reorder'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="h-4 w-4" />
          Baseline Reorder Forecasting
        </button>
      </div>

      {/* Tab 1: Product Profitability */}
      {activeTab === 'profitability' && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold text-slate-800">
              SKU Gross Margin Analysis (Based on Moving Weighted Average Cost)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Product / SKU</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">Selling Price</th>
                    <th className="px-6 py-3 text-right">Purchase Cost</th>
                    <th className="px-6 py-3 text-right">Gross Margin %</th>
                    <th className="px-6 py-3 text-right">Units Sold</th>
                    <th className="px-6 py-3 text-right">Est. Gross Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isPerfLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Calculating product margins...
                      </td>
                    </tr>
                  ) : !performanceData || performanceData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No product sales records yet.
                      </td>
                    </tr>
                  ) : (
                    performanceData.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-400">{item.sku}</div>
                        </td>
                        <td className="px-6 py-3.5 text-xs">{item.category}</td>
                        <td className="px-6 py-3.5 text-right font-medium">₹{item.sellingPrice.toFixed(2)}</td>
                        <td className="px-6 py-3.5 text-right text-xs">
                          {item.hasReliableCost ? (
                            `₹${item.purchaseCost?.toFixed(2)}`
                          ) : (
                            <span className="text-amber-600 font-semibold text-[10px]">COST_UNAVAILABLE</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold">
                          {item.grossMarginPercent !== null ? (
                            <span
                              className={
                                item.grossMarginPercent >= 20
                                  ? 'text-emerald-600'
                                  : item.grossMarginPercent >= 10
                                    ? 'text-amber-600'
                                    : 'text-red-600'
                              }
                            >
                              {item.grossMarginPercent}%
                            </span>
                          ) : (
                            <span className="text-slate-400 font-normal">--</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium">{item.totalUnitsSold}</td>
                        <td className="px-6 py-3.5 text-right font-bold text-slate-900">
                          {item.grossProfit !== null ? `₹${item.grossProfit.toFixed(2)}` : '--'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Reorder Recommendations */}
      {activeTab === 'reorder' && (
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Deterministic Baseline Reorder Model: (Daily Sales Velocity × Lead Time) + Safety Stock
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3 text-right">Available Stock</th>
                    <th className="px-6 py-3 text-right">30-day Velocity</th>
                    <th className="px-6 py-3 text-right">Supplier Lead Time</th>
                    <th className="px-6 py-3 text-right">Reorder Point</th>
                    <th className="px-6 py-3 text-center">Reorder Status</th>
                    <th className="px-6 py-3 text-right">Suggested Order Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isReorderLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Running baseline forecasting engine...
                      </td>
                    </tr>
                  ) : !reorderData || reorderData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No product reorder recommendations available.
                      </td>
                    </tr>
                  ) : (
                    reorderData.map((rec) => (
                      <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-slate-900">{rec.name}</div>
                          <div className="text-xs text-slate-400">
                            Supplier: {rec.preferredVendor} ({rec.sku})
                          </div>
                        </td>
                        <td className="px-6 py-3.5 text-right font-medium">{rec.availableStock}</td>
                        <td className="px-6 py-3.5 text-right text-xs">{rec.dailyVelocity} / day</td>
                        <td className="px-6 py-3.5 text-right text-xs">{rec.leadTimeDays} days</td>
                        <td className="px-6 py-3.5 text-right text-xs font-bold text-slate-800">
                          {rec.reorderPoint}
                        </td>
                        <td className="px-6 py-3.5 text-center">
                          {rec.needsReorder ? (
                            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800 flex items-center justify-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Reorder Needed
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              Adequate Stock
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right font-bold text-blue-700">
                          {rec.suggestedOrderQty > 0 ? `${rec.suggestedOrderQty} units` : '--'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

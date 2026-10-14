import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  Plus,
  Download,
  ArrowRightLeft,
  Calendar,
  AlertTriangle,
  History,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SearchInput } from '@/components/ui/search-input';
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { inventoryService } from '@/services/inventory.service';
import { productsService } from '@/services/products.service';
import { warehousesService } from '@/services/warehouses.service';

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'summary' | 'batches' | 'ledger'>('summary');
  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');

  // Adjustment state
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustWarehouseId, setAdjustWarehouseId] = useState('');
  const [adjustType, setAdjustType] = useState('ADJUSTMENT_POSITIVE');
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState('');

  // Transfer state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [transferProductId, setTransferProductId] = useState('');
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [transferQty, setTransferQty] = useState(1);
  const [transferNotes, setTransferNotes] = useState('');

  // Queries
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery({
    queryKey: ['inventory-summary', search, warehouseFilter],
    queryFn: () =>
      inventoryService.getStockSummary({
        search: search || undefined,
        warehouseId: warehouseFilter || undefined,
      }),
  });

  const { data: batchesData, isLoading: isBatchesLoading } = useQuery({
    queryKey: ['inventory-batches', warehouseFilter],
    queryFn: () =>
      inventoryService.getBatches({
        warehouseId: warehouseFilter || undefined,
      }),
    enabled: activeTab === 'batches',
  });

  const { data: ledgerData, isLoading: isLedgerLoading } = useQuery({
    queryKey: ['inventory-ledger', warehouseFilter],
    queryFn: () =>
      inventoryService.getLedger({
        warehouseId: warehouseFilter || undefined,
        limit: 50,
      }),
    enabled: activeTab === 'ledger',
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsService.getAll({ limit: 100 }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getAll(),
  });

  // Mutations
  const adjustMutation = useMutation({
    mutationFn: (data: any) => inventoryService.adjustStock(data),
    onSuccess: () => {
      toast.success('Stock adjustment recorded successfully');
      setIsAdjustOpen(false);
      setAdjustReason('');
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-ledger'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Adjustment failed'),
  });

  const transferMutation = useMutation({
    mutationFn: (data: any) => inventoryService.transferStock(data),
    onSuccess: () => {
      toast.success('Stock transferred between warehouses');
      setIsTransferOpen(false);
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-ledger'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Transfer failed'),
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustProductId || !adjustWarehouseId || !adjustReason) {
      toast.error('Please fill all required fields');
      return;
    }
    adjustMutation.mutate({
      productId: adjustProductId,
      warehouseId: adjustWarehouseId,
      adjustmentType: adjustType,
      quantity: Number(adjustQty),
      reason: adjustReason,
    });
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferProductId || !fromWarehouseId || !toWarehouseId) {
      toast.error('Please fill all required fields');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      toast.error('Source and destination warehouse must be different');
      return;
    }
    transferMutation.mutate({
      productId: transferProductId,
      fromWarehouseId,
      toWarehouseId,
      quantity: Number(transferQty),
      notes: transferNotes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory & Warehouses"
        description="Transaction-based stock ledger, multiple locations, batch/lot tracking, and FEFO expiry rules."
        actions={
          <div className="flex items-center gap-3">
            <a
              href={inventoryService.getExportUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </a>
            <Button
              variant="outline"
              onClick={() => {
                setTransferProductId(productsData?.data?.[0]?.id || '');
                setFromWarehouseId(warehousesData?.data?.[0]?.id || warehousesData?.[0]?.id || '');
                setToWarehouseId(warehousesData?.data?.[1]?.id || warehousesData?.[1]?.id || '');
                setIsTransferOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <ArrowRightLeft className="h-4 w-4" />
              Stock Transfer
            </Button>
            <Button
              onClick={() => {
                setAdjustProductId(productsData?.data?.[0]?.id || '');
                setAdjustWarehouseId(warehousesData?.data?.[0]?.id || warehousesData?.[0]?.id || '');
                setIsAdjustOpen(true);
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Stock Adjustment
            </Button>
          </div>
        }
      />

      {/* Tabs and Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'summary'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="h-4 w-4" />
            Stock Summary
          </button>
          <button
            onClick={() => setActiveTab('batches')}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'batches'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="h-4 w-4" />
            Batches & Expiry (FEFO)
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'ledger'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="h-4 w-4" />
            Transaction Ledger
          </button>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {activeTab === 'summary' && (
            <div className="w-64">
              <SearchInput value={search} onChange={setSearch} placeholder="Search SKU or name..." />
            </div>
          )}
          <select
            value={warehouseFilter}
            onChange={(e) => setWarehouseFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm shadow-sm"
          >
            <option value="">All Warehouses</option>
            {(warehousesData?.data || warehousesData || []).map((w: any) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab 1: Stock Summary */}
      {activeTab === 'summary' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Product / SKU</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3 text-right">On Hand</th>
                    <th className="px-6 py-3 text-right">Reserved</th>
                    <th className="px-6 py-3 text-right">Available</th>
                    <th className="px-6 py-3 text-right">Reorder Level</th>
                    <th className="px-6 py-3 text-right">Total Value (INR)</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isSummaryLoading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                        Calculating live stock positions...
                      </td>
                    </tr>
                  ) : !summaryData || summaryData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No inventory records found.
                      </td>
                    </tr>
                  ) : (
                    summaryData.map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-400">SKU: {item.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-xs">{item.category}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-900">
                          {item.onHand} {item.unitOfMeasure}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500">{item.reserved}</td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900">{item.available}</td>
                        <td className="px-6 py-4 text-right text-xs text-slate-400">{item.reorderLevel}</td>
                        <td className="px-6 py-4 text-right font-medium">
                          ₹{Number(item.totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.status === 'IN_STOCK' && (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                              In Stock
                            </span>
                          )}
                          {item.status === 'LOW_STOCK' && (
                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">
                              Low Stock
                            </span>
                          )}
                          {item.status === 'OUT_OF_STOCK' && (
                            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
                              Out of Stock
                            </span>
                          )}
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

      {/* Tab 2: Batches & Expiry (FEFO) */}
      {activeTab === 'batches' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Batch Number</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Warehouse</th>
                    <th className="px-6 py-3 text-right">Quantity</th>
                    <th className="px-6 py-3 text-right">Unit Cost</th>
                    <th className="px-6 py-3">Expiry Date</th>
                    <th className="px-6 py-3 text-center">FEFO Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isBatchesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Loading batches...
                      </td>
                    </tr>
                  ) : !batchesData || batchesData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No active inventory batches found.
                      </td>
                    </tr>
                  ) : (
                    batchesData.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-800">
                          {b.batchNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{b.product.name}</div>
                          <div className="text-xs text-slate-400">{b.product.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-xs">{b.warehouse.name}</td>
                        <td className="px-6 py-4 text-right font-medium">{b.quantity}</td>
                        <td className="px-6 py-4 text-right text-xs">₹{b.unitCost?.toFixed(2)}</td>
                        <td className="px-6 py-4 text-xs">
                          {b.expiryDate ? new Date(b.expiryDate).toLocaleDateString() : 'N/A'}
                          {b.daysToExpiry !== null && (
                            <span className="block text-[11px] text-slate-400">
                              ({b.daysToExpiry} days left)
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {b.expiryStatus === 'GOOD' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-medium">
                              Optimal
                            </span>
                          )}
                          {b.expiryStatus === 'NEAR_EXPIRY' && (
                            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold flex items-center justify-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Near Expiry
                            </span>
                          )}
                          {b.expiryStatus === 'EXPIRED' && (
                            <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs font-bold">
                              Expired
                            </span>
                          )}
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

      {/* Tab 3: Transaction Ledger */}
      {activeTab === 'ledger' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Product</th>
                    <th className="px-6 py-3">Warehouse</th>
                    <th className="px-6 py-3 text-right">Delta Qty</th>
                    <th className="px-6 py-3">Reference / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLedgerLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Loading transaction ledger...
                      </td>
                    </tr>
                  ) : !ledgerData?.data || ledgerData.data.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerData.data.map((tx: any) => (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              tx.transactionType === 'GOODS_RECEIPT'
                                ? 'bg-emerald-100 text-emerald-800'
                                : tx.transactionType === 'SALES_DISPATCH'
                                  ? 'bg-blue-100 text-blue-800'
                                  : tx.transactionType === 'RESERVATION'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {tx.transactionType}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{tx.product.name}</div>
                          <div className="text-xs text-slate-400">{tx.product.sku}</div>
                        </td>
                        <td className="px-6 py-4 text-xs">{tx.warehouse.name}</td>
                        <td
                          className={`px-6 py-4 text-right font-bold ${
                            Number(tx.quantity) > 0 ? 'text-emerald-600' : 'text-slate-900'
                          }`}
                        >
                          {Number(tx.quantity) > 0 ? `+${tx.quantity}` : tx.quantity}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {tx.notes || `${tx.referenceType || ''} ${tx.referenceId || ''}`}
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

      {/* Stock Adjustment Modal */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-xl">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2">Record Stock Adjustment</DialogTitle>
          <form onSubmit={handleAdjustSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Product *</label>
              <select
                value={adjustProductId}
                onChange={(e) => setAdjustProductId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                required
              >
                {(productsData?.data || []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Warehouse *</label>
              <select
                value={adjustWarehouseId}
                onChange={(e) => setAdjustWarehouseId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                required
              >
                {(warehousesData?.data || warehousesData || []).map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                >
                  <option value="ADJUSTMENT_POSITIVE">Positive Adjustment (+)</option>
                  <option value="ADJUSTMENT_NEGATIVE">Negative Adjustment (-)</option>
                  <option value="DAMAGE">Damaged Goods (-)</option>
                  <option value="EXPIRY_WRITE_OFF">Expiry Write-off (-)</option>
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Quantity</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Mandatory Audit Reason *</label>
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="e.g. Physical inventory count variance / carton damage"
                className="w-full rounded border border-slate-300 p-2 text-sm"
                required
              />
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAdjustOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={adjustMutation.isPending}>
                Save Adjustment
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>

      {/* Stock Transfer Modal */}
      <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-xl">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2">Inter-Warehouse Stock Transfer</DialogTitle>
          <form onSubmit={handleTransferSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Product *</label>
              <select
                value={transferProductId}
                onChange={(e) => setTransferProductId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                required
              >
                {(productsData?.data || []).map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">From Warehouse</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  required
                >
                  {(warehousesData?.data || warehousesData || []).map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">To Warehouse</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  required
                >
                  {(warehousesData?.data || warehousesData || []).map((w: any) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Quantity to Transfer</label>
              <input
                type="number"
                min="1"
                value={transferQty}
                onChange={(e) => setTransferQty(Number(e.target.value))}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Transfer Notes</label>
              <input
                type="text"
                value={transferNotes}
                onChange={(e) => setTransferNotes(e.target.value)}
                placeholder="Internal dispatch ref / vehicle"
                className="w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsTransferOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={transferMutation.isPending}>
                Execute Transfer
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
}

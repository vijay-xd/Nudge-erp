import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Download,
  CheckCircle,
  Truck,
  FileText,
  XCircle,
  Eye,
  Send,
  Boxes,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { purchaseOrdersService, PurchaseOrder } from '@/services/purchase-orders.service';
import { vendorsService } from '@/services/vendors.service';
import { productsService } from '@/services/products.service';
import { warehousesService } from '@/services/warehouses.service';

export default function PurchaseOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isReceiveOpen, setIsReceiveOpen] = useState(false);

  // Goods receipt form state
  const [receiveWarehouseId, setReceiveWarehouseId] = useState('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [receiveItems, setReceiveItems] = useState<
    Record<string, { receivedQty: number; acceptedQty: number; batchNumber: string; expiryDate: string }>
  >({});

  // Create form state
  const [newVendorId, setNewVendorId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newLines, setNewLines] = useState<Array<{ productId: string; quantity: number; unitCost: number }>>([
    { productId: '', quantity: 10, unitCost: 0 },
  ]);

  const { data: poData, isLoading } = useQuery({
    queryKey: ['purchase-orders', search, statusFilter],
    queryFn: () => purchaseOrdersService.getAll({ search, status: statusFilter || undefined }),
  });

  const { data: vendorsData } = useQuery({
    queryKey: ['vendors-list'],
    queryFn: () => vendorsService.getAll({ limit: 100 }),
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
  const approveMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersService.updateStatus(id, 'APPROVED'),
    onSuccess: (data) => {
      toast.success('Purchase Order approved');
      setSelectedPo(data);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to approve PO'),
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersService.updateStatus(id, 'SENT'),
    onSuccess: (data) => {
      toast.success('PO marked as sent to vendor');
      setSelectedPo(data);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to update PO'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersService.updateStatus(id, 'CANCELLED', undefined, 'Cancelled by user'),
    onSuccess: () => {
      toast.success('PO cancelled');
      setIsDetailOpen(false);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel PO'),
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      purchaseOrdersService.receiveGoods(id, data),
    onSuccess: (res) => {
      toast.success(`Goods received under GRN #${res.receipt.receiptNumber}. Inventory updated!`);
      setIsReceiveOpen(false);
      setSelectedPo(res.purchaseOrder);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to record receipt'),
  });

  const billMutation = useMutation({
    mutationFn: (id: string) => purchaseOrdersService.generateBill(id),
    onSuccess: (bill) => {
      toast.success(`Supplier Bill #${bill.billNumber} created`);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate bill'),
  });

  const createPoMutation = useMutation({
    mutationFn: (data: any) => purchaseOrdersService.create(data),
    onSuccess: () => {
      toast.success('Purchase Order created in Draft state');
      setIsCreateOpen(false);
      setNewLines([{ productId: '', quantity: 10, unitCost: 0 }]);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create PO'),
  });

  const openDetail = async (po: PurchaseOrder) => {
    try {
      const full = await purchaseOrdersService.getById(po.id);
      setSelectedPo(full);
      setIsDetailOpen(true);
    } catch {
      setSelectedPo(po);
      setIsDetailOpen(true);
    }
  };

  const openReceiveModal = () => {
    if (!selectedPo) return;
    const initialItems: Record<string, any> = {};
    for (const line of selectedPo.lines || []) {
      const remaining = Math.max(0, Number(line.quantity) - Number(line.receivedQty));
      initialItems[line.id] = {
        receivedQty: remaining,
        acceptedQty: remaining,
        batchNumber: `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
        expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      };
    }
    setReceiveItems(initialItems);
    setReceiveWarehouseId(warehousesData?.data?.[0]?.id || warehousesData?.[0]?.id || '');
    setIsReceiveOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVendorId) {
      toast.error('Please select a supplier');
      return;
    }
    const validLines = newLines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }
    createPoMutation.mutate({
      vendorId: newVendorId,
      notes: newNotes || undefined,
      lines: validLines,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Purchase Orders & Procurement</h1>
          <p className="text-xs text-slate-500 mt-0.5">Supplier orders, FEFO goods receipts (GRN), and cost basis tracking</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={purchaseOrdersService.getExportUrl()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </a>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#fd3706] text-white px-4 py-2 text-xs font-semibold shadow-sm shadow-[#fd3706]/20 hover:bg-[#e03004] transition-colors cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ Add New PO</span>
          </button>
        </div>
      </div>

      {/* 4 Interoly Dot-Matrix KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Purchase Orders</p>
            <div className="text-2xl font-black text-slate-900 mt-2">{poData?.data?.length || 18}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 border border-emerald-200">↗ +23%</span>
              <span className="text-slate-400 font-normal">last week</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 8 ? 'bg-emerald-500' : 'bg-emerald-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">In-Transit / Sent</p>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {poData?.data?.filter((p: any) => p.status === 'SENT' || p.status === 'APPROVED')?.length || 8}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
              <span className="px-1.5 py-0.2 rounded-full bg-blue-50 border border-blue-200">↗ Active</span>
              <span className="text-slate-400 font-normal">awaiting delivery</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-blue-50/50 border border-blue-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 7 ? 'bg-blue-500' : 'bg-blue-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Goods Receipts (GRN)</p>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {poData?.data?.filter((p: any) => p.status === 'RECEIVED' || p.status === 'PARTIALLY_RECEIVED')?.length || 6}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
              <span className="px-1.5 py-0.2 rounded-full bg-amber-50 border border-amber-200">↗ +17%</span>
              <span className="text-slate-400 font-normal">processed</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-amber-50/50 border border-amber-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 9 ? 'bg-amber-500' : 'bg-amber-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Drafts & Approvals</p>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {poData?.data?.filter((p: any) => p.status === 'DRAFT' || p.status === 'PENDING_APPROVAL')?.length || 4}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
              <span className="px-1.5 py-0.2 rounded-full bg-rose-50 border border-rose-200">↘ Action req.</span>
              <span className="text-slate-400 font-normal">manager review</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-rose-50/50 border border-rose-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 5 ? 'bg-rose-500' : 'bg-rose-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Filter Bar (Interoly style) */}
      <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search PO number or supplier name..."
            className="w-full h-9 rounded-full border border-slate-200 bg-slate-50 px-4 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-[#fd3706] focus:outline-none focus:ring-1 focus:ring-[#fd3706]"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 focus:bg-white focus:border-[#fd3706] focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="SENT">Sent to Supplier</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Data Table (Interoly style: Avatar bubbles, colored PO links, soft status pills) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 font-bold">
              <tr>
                <th className="px-5 py-3.5">Purchase Order</th>
                <th className="px-5 py-3.5">Order Date</th>
                <th className="px-5 py-3.5">Vendor / Supplier</th>
                <th className="px-5 py-3.5 text-right">Amount (INR)</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Loading purchase orders...
                  </td>
                </tr>
              ) : !poData?.data || poData.data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-400">
                    <FileText className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No purchase orders found.
                  </td>
                </tr>
              ) : (
                poData.data.map((po: PurchaseOrder) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {po.poNumber}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                      {new Date(po.orderDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px] shrink-0">
                          {po.vendor.legalName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{po.vendor.legalName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900 font-mono">
                      ₹{Number(po.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={po.status} />
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => openDetail(po)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 hover:bg-[#fd3706] hover:text-white font-semibold text-slate-700 transition-colors cursor-pointer text-xs"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Manage</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail & GRN Modal */}
      {selectedPo && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <div className="max-w-4xl w-full p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    {selectedPo.poNumber}
                    <StatusBadge status={selectedPo.status} />
                  </DialogTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Supplier: <span className="font-medium text-slate-800">{selectedPo.vendor.legalName}</span> | Date: {new Date(selectedPo.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Total Purchase Cost</div>
                  <div className="text-xl font-bold text-slate-900">
                    ₹{Number(selectedPo.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Workflow Actions */}
            <div className="my-4 p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">Procurement Actions:</span>
              <div className="flex flex-wrap items-center gap-2">
                {selectedPo.status === 'DRAFT' && (
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(selectedPo.id)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve PO
                  </Button>
                )}

                {selectedPo.status === 'APPROVED' && (
                  <Button
                    size="sm"
                    onClick={() => sendMutation.mutate(selectedPo.id)}
                    disabled={sendMutation.isPending}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
                  >
                    <Send className="h-4 w-4" />
                    Mark as Sent
                  </Button>
                )}

                {(selectedPo.status === 'APPROVED' ||
                  selectedPo.status === 'SENT' ||
                  selectedPo.status === 'PARTIALLY_RECEIVED') && (
                  <Button
                    size="sm"
                    onClick={openReceiveModal}
                    className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Boxes className="h-4 w-4" />
                    Receive Goods (GRN)
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => billMutation.mutate(selectedPo.id)}
                  disabled={billMutation.isPending}
                  className="flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  Generate Supplier Bill
                </Button>

                {selectedPo.status !== 'CANCELLED' && selectedPo.status !== 'RECEIVED' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelMutation.mutate(selectedPo.id)}
                    disabled={cancelMutation.isPending}
                    className="flex items-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel PO
                  </Button>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Purchase Order Items</h3>
              <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                    <tr>
                      <th className="px-4 py-2.5">Product / SKU</th>
                      <th className="px-4 py-2.5 text-right">Ordered Qty</th>
                      <th className="px-4 py-2.5 text-right">Received Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Cost</th>
                      <th className="px-4 py-2.5 text-right">GST %</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedPo.lines?.map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{line.product.name}</div>
                          <div className="text-xs text-slate-400">SKU: {line.product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{Number(line.quantity)}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              Number(line.receivedQty) >= Number(line.quantity)
                                ? 'text-emerald-600 font-semibold'
                                : Number(line.receivedQty) > 0
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-slate-400'
                            }
                          >
                            {Number(line.receivedQty)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">₹{Number(line.unitCost).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{Number(line.taxRate)}%</td>
                        <td className="px-4 py-3 text-right font-medium">₹{Number(line.lineTotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* GRN History */}
            {selectedPo.goodsReceipts && selectedPo.goodsReceipts.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Boxes className="h-4 w-4 text-indigo-600" />
                  Goods Receipts History (GRN)
                </h3>
                <div className="space-y-2">
                  {selectedPo.goodsReceipts.map((grn: any) => (
                    <div key={grn.id} className="p-3 bg-slate-50 rounded border text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{grn.receiptNumber}</span> at {grn.warehouse?.name}
                        <div className="text-slate-400">Received on: {new Date(grn.receivedDate).toLocaleString()}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                        {grn.lines?.length || 0} line items checked
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="mt-6 border-t pt-4">
              <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        </Dialog>
      )}

      {/* Receive Goods (GRN) Modal */}
      <Dialog open={isReceiveOpen} onOpenChange={setIsReceiveOpen}>
        <div className="max-w-2xl w-full p-6 bg-white rounded-lg shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Boxes className="h-5 w-5 text-indigo-600" />
            Record Goods Receipt Note (GRN)
          </DialogTitle>
          <p className="text-xs text-slate-500 mb-4">
            Verify received goods, batch numbers, and expiry dates before adding to warehouse inventory.
          </p>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Receiving Warehouse *</label>
              <select
                value={receiveWarehouseId}
                onChange={(e) => setReceiveWarehouseId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
              >
                {(warehousesData?.data || warehousesData || []).map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Delivery Challan / Notes</label>
              <input
                type="text"
                value={receiptNotes}
                onChange={(e) => setReceiptNotes(e.target.value)}
                placeholder="Challan #DC-8726 / Vehicle MH-04-1234"
                className="w-full rounded border border-slate-300 p-2 text-sm"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-2">Inspection & Batches</label>
              <div className="space-y-3">
                {selectedPo?.lines?.map((line) => {
                  const remaining = Math.max(0, Number(line.quantity) - Number(line.receivedQty));
                  const item = receiveItems[line.id] || {
                    receivedQty: remaining,
                    acceptedQty: remaining,
                    batchNumber: 'BATCH-DEFAULT',
                    expiryDate: '',
                  };

                  return (
                    <div key={line.id} className="p-3 border rounded bg-slate-50 space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-800">{line.product.name}</span>
                        <span className="text-slate-400">Remaining to receive: {remaining}</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500">Accepted Qty</label>
                          <input
                            type="number"
                            min="0"
                            max={remaining}
                            value={item.acceptedQty}
                            onChange={(e) =>
                              setReceiveItems({
                                ...receiveItems,
                                [line.id]: {
                                  ...item,
                                  acceptedQty: Number(e.target.value),
                                  receivedQty: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full rounded border border-slate-300 p-1.5 font-medium"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500">Batch / Lot #</label>
                          <input
                            type="text"
                            value={item.batchNumber}
                            onChange={(e) =>
                              setReceiveItems({
                                ...receiveItems,
                                [line.id]: { ...item, batchNumber: e.target.value },
                              })
                            }
                            className="w-full rounded border border-slate-300 p-1.5"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] text-slate-500">Expiry Date</label>
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) =>
                              setReceiveItems({
                                ...receiveItems,
                                [line.id]: { ...item, expiryDate: e.target.value },
                              })
                            }
                            className="w-full rounded border border-slate-300 p-1.5"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReceiveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedPo) return;
                const linesToReceive = Object.entries(receiveItems)
                  .filter(([_, data]) => data.acceptedQty > 0)
                  .map(([purchaseOrderLineId, data]) => ({
                    purchaseOrderLineId,
                    receivedQty: data.receivedQty,
                    acceptedQty: data.acceptedQty,
                    batchNumber: data.batchNumber || undefined,
                    expiryDate: data.expiryDate ? `${data.expiryDate}T00:00:00.000Z` : undefined,
                  }));

                if (linesToReceive.length === 0) {
                  toast.error('Please specify accepted quantity greater than 0');
                  return;
                }

                receiveMutation.mutate({
                  id: selectedPo.id,
                  data: {
                    warehouseId: receiveWarehouseId,
                    notes: receiptNotes || undefined,
                    lines: linesToReceive,
                  },
                });
              }}
              disabled={receiveMutation.isPending || !receiveWarehouseId}
            >
              Confirm Goods Receipt
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Create PO Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <div className="max-w-2xl w-full p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2">Create Supplier Purchase Order</DialogTitle>
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Supplier / Vendor *</label>
              <select
                value={newVendorId}
                onChange={(e) => setNewVendorId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
                required
              >
                <option value="">Select vendor...</option>
                {(vendorsData?.data || []).map((v: any) => (
                  <option key={v.id} value={v.id}>
                    {v.legalName} ({v.tradingName || 'Wholesaler'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-slate-800">PO Line Items</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewLines([...newLines, { productId: '', quantity: 10, unitCost: 0 }])}
                >
                  + Add Item
                </Button>
              </div>
              <div className="space-y-2">
                {newLines.map((line, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <select
                      value={line.productId}
                      onChange={(e) => {
                        const prod = (productsData?.data || []).find((p: any) => p.id === e.target.value);
                        const updated = [...newLines];
                        updated[idx].productId = e.target.value;
                        if (prod?.purchaseCost) {
                          updated[idx].unitCost = Number(prod.purchaseCost);
                        }
                        setNewLines(updated);
                      }}
                      className="flex-1 rounded border border-slate-300 p-2 text-sm"
                      required
                    >
                      <option value="">Select Product SKU...</option>
                      {(productsData?.data || []).map((p: any) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={line.quantity}
                      onChange={(e) => {
                        const updated = [...newLines];
                        updated[idx].quantity = Number(e.target.value);
                        setNewLines(updated);
                      }}
                      className="w-20 rounded border border-slate-300 p-2 text-sm"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Unit Cost"
                      value={line.unitCost}
                      onChange={(e) => {
                        const updated = [...newLines];
                        updated[idx].unitCost = Number(e.target.value);
                        setNewLines(updated);
                      }}
                      className="w-24 rounded border border-slate-300 p-2 text-sm"
                    />
                    {newLines.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewLines(newLines.filter((_, i) => i !== idx))}
                        className="text-red-500"
                      >
                        ×
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createPoMutation.isPending}>
                Create Purchase Order
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
}

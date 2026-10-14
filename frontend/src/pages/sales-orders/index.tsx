import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingCart,
  Plus,
  Download,
  CheckCircle,
  Truck,
  FileText,
  XCircle,
  AlertCircle,
  Eye,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { salesOrdersService, SalesOrder } from '@/services/sales-orders.service';
import { customersService } from '@/services/customers.service';
import { productsService } from '@/services/products.service';
import { warehousesService } from '@/services/warehouses.service';

export default function SalesOrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isFulfillOpen, setIsFulfillOpen] = useState(false);
  const [isReserveOpen, setIsReserveOpen] = useState(false);

  // Fulfillment form state
  const [fulfillWarehouseId, setFulfillWarehouseId] = useState('');
  const [carrier, setCarrier] = useState('Blue Dart');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [fulfillItems, setFulfillItems] = useState<Record<string, number>>({});

  // Reserve form state
  const [reserveWarehouseId, setReserveWarehouseId] = useState('');

  // Create form state
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newExternalOrderId, setNewExternalOrderId] = useState('');
  const [newLines, setNewLines] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([
    { productId: '', quantity: 1, unitPrice: 0 },
  ]);

  // Fetch orders
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['sales-orders', search, statusFilter],
    queryFn: () => salesOrdersService.getAll({ search, status: statusFilter || undefined }),
  });

  // Fetch customers and products for create modal
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersService.getAll({ limit: 100 }),
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
    mutationFn: (id: string) => salesOrdersService.updateStatus(id, 'APPROVED'),
    onSuccess: (data) => {
      toast.success('Sales order approved successfully');
      setSelectedOrder(data);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to approve order'),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => salesOrdersService.updateStatus(id, 'CANCELLED', undefined, 'Cancelled by user'),
    onSuccess: () => {
      toast.success('Sales order cancelled');
      setIsDetailOpen(false);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to cancel order'),
  });

  const reserveMutation = useMutation({
    mutationFn: ({ id, warehouseId }: { id: string; warehouseId: string }) =>
      salesOrdersService.reserveStock(id, warehouseId),
    onSuccess: (res) => {
      if (res.shortages?.length > 0) {
        toast.warning(`Partial reservation: ${res.shortages.length} item(s) had stock shortages`);
      } else {
        toast.success('Stock fully allocated and reserved');
      }
      setIsReserveOpen(false);
      setSelectedOrder(res.order);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to reserve stock'),
  });

  const fulfillMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      salesOrdersService.fulfill(id, data),
    onSuccess: (res) => {
      toast.success(`Shipment #${res.shipment.shipmentNumber} created and dispatched`);
      setIsFulfillOpen(false);
      setSelectedOrder(res.order);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to fulfill order'),
  });

  const invoiceMutation = useMutation({
    mutationFn: (id: string) => salesOrdersService.generateInvoice(id),
    onSuccess: (inv) => {
      toast.success(`Customer Invoice #${inv.invoiceNumber} generated!`);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to generate invoice'),
  });

  const createOrderMutation = useMutation({
    mutationFn: (data: any) => salesOrdersService.create(data),
    onSuccess: () => {
      toast.success('Sales order created successfully');
      setIsCreateOpen(false);
      setNewLines([{ productId: '', quantity: 1, unitPrice: 0 }]);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to create order'),
  });

  const openDetail = async (order: SalesOrder) => {
    try {
      const full = await salesOrdersService.getById(order.id);
      setSelectedOrder(full);
      setIsDetailOpen(true);
    } catch {
      setSelectedOrder(order);
      setIsDetailOpen(true);
    }
  };

  const openFulfillModal = () => {
    if (!selectedOrder) return;
    const initialItems: Record<string, number> = {};
    for (const line of selectedOrder.lines || []) {
      const remaining = Math.max(0, Number(line.quantity) - Number(line.fulfilledQty));
      initialItems[line.id] = remaining;
    }
    setFulfillItems(initialItems);
    setFulfillWarehouseId(warehousesData?.data?.[0]?.id || warehousesData?.[0]?.id || '');
    setIsFulfillOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      toast.error('Please select a customer');
      return;
    }
    const validLines = newLines.filter((l) => l.productId && l.quantity > 0);
    if (validLines.length === 0) {
      toast.error('Please add at least one product line');
      return;
    }
    createOrderMutation.mutate({
      customerId: newCustomerId,
      externalOrderId: newExternalOrderId || undefined,
      lines: validLines,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sales Orders & Fulfillment</h1>
          <p className="text-xs text-slate-500 mt-0.5">Quick commerce, retail distribution, allocation & dispatch lifecycle</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={salesOrdersService.getExportUrl()}
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
            <span>+ Add New Order</span>
          </button>
        </div>
      </div>

      {/* 4 Interoly Dot-Matrix KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Sales Orders</p>
            <div className="text-2xl font-black text-slate-900 mt-2">{ordersData?.data?.length || 24}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 border border-emerald-200">↗ +31%</span>
              <span className="text-slate-400 font-normal">all channels</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-emerald-50/50 border border-emerald-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 9 ? 'bg-emerald-500' : 'bg-emerald-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Allocated & In-Dispatch</p>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {ordersData?.data?.filter((o: any) => o.status === 'ALLOCATED' || o.status === 'PARTIALLY_FULFILLED')?.length || 8}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-blue-700">
              <span className="px-1.5 py-0.2 rounded-full bg-blue-50 border border-blue-200">↗ Active</span>
              <span className="text-slate-400 font-normal">in warehouse</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-blue-50/50 border border-blue-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 8 ? 'bg-blue-500' : 'bg-blue-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Delivered & Invoiced</p>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {ordersData?.data?.filter((o: any) => o.status === 'FULFILLED')?.length || 12}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-amber-700">
              <span className="px-1.5 py-0.2 rounded-full bg-amber-50 border border-amber-200">↗ Completed</span>
              <span className="text-slate-400 font-normal">recognized</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-amber-50/50 border border-amber-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 10 ? 'bg-amber-500' : 'bg-amber-200'}`} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Pending Review</p>
            <div className="text-2xl font-black text-slate-900 mt-2">
              {ordersData?.data?.filter((o: any) => o.status === 'IMPORTED' || o.status === 'PENDING_REVIEW')?.length || 4}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-rose-700">
              <span className="px-1.5 py-0.2 rounded-full bg-rose-50 border border-rose-200">↘ Action req.</span>
              <span className="text-slate-400 font-normal">awaiting check</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 p-2 rounded-xl bg-rose-50/50 border border-rose-100">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${i < 4 ? 'bg-rose-500' : 'bg-rose-200'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order number or customer..."
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
            <option value="IMPORTED">Imported</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="ALLOCATED">Allocated</option>
            <option value="PARTIALLY_FULFILLED">Partially Fulfilled</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List Table (Interoly style) */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/70 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-100 font-bold">
              <tr>
                <th className="px-5 py-3.5">Order Number</th>
                <th className="px-5 py-3.5">Customer</th>
                <th className="px-5 py-3.5">Channel / Source</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Amount (INR)</th>
                <th className="px-5 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Loading sales orders...
                  </td>
                </tr>
              ) : !ordersData?.data || ordersData.data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-400">
                    <ShoppingCart className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    No sales orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                ordersData.data.map((order: SalesOrder) => (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-mono font-bold text-xs text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                        {order.orderNumber}
                      </span>
                      {order.externalOrderId && (
                        <span className="block text-[10px] font-mono text-slate-400 mt-0.5">
                          Ext: {order.externalOrderId}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[11px] shrink-0">
                          {order.customer.legalName.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-900">{order.customer.legalName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                        {order.channel?.name || order.source || 'Direct'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-slate-500 font-medium">
                      {new Date(order.orderDate).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900 font-mono">
                      ₹{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <button
                        onClick={() => openDetail(order)}
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

      {/* Order Details & Workflow Action Modal */}
      {selectedOrder && (
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <div className="max-w-4xl w-full p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    {selectedOrder.orderNumber}
                    <StatusBadge status={selectedOrder.status} />
                  </DialogTitle>
                  <p className="text-sm text-slate-500 mt-1">
                    Customer: <span className="font-medium text-slate-800">{selectedOrder.customer.legalName}</span> | Date: {new Date(selectedOrder.orderDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500">Total Order Value</div>
                  <div className="text-xl font-bold text-slate-900">
                    ₹{Number(selectedOrder.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Workflow Action Bar */}
            <div className="my-4 p-4 bg-slate-50 rounded-lg border border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-700">Workflow Actions:</span>
              <div className="flex flex-wrap items-center gap-2">
                {selectedOrder.status === 'PENDING_REVIEW' && (
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(selectedOrder.id)}
                    disabled={approveMutation.isPending}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve Order
                  </Button>
                )}

                {(selectedOrder.status === 'APPROVED' || selectedOrder.status === 'PENDING_REVIEW') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setReserveWarehouseId(warehousesData?.data?.[0]?.id || warehousesData?.[0]?.id || '');
                      setIsReserveOpen(true);
                    }}
                    className="flex items-center gap-1.5 text-blue-700 border-blue-300 hover:bg-blue-50"
                  >
                    <Archive className="h-4 w-4" />
                    Allocate / Reserve Stock
                  </Button>
                )}

                {(selectedOrder.status === 'APPROVED' ||
                  selectedOrder.status === 'ALLOCATED' ||
                  selectedOrder.status === 'PARTIALLY_FULFILLED') && (
                  <Button
                    size="sm"
                    onClick={openFulfillModal}
                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700"
                  >
                    <Truck className="h-4 w-4" />
                    Dispatch / Fulfill
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => invoiceMutation.mutate(selectedOrder.id)}
                  disabled={invoiceMutation.isPending}
                  className="flex items-center gap-1.5"
                >
                  <FileText className="h-4 w-4" />
                  Generate Invoice
                </Button>

                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'FULFILLED' && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => cancelMutation.mutate(selectedOrder.id)}
                    disabled={cancelMutation.isPending}
                    className="flex items-center gap-1.5"
                  >
                    <XCircle className="h-4 w-4" />
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mt-4">
              <h3 className="font-semibold text-slate-900 mb-2">Order Line Items</h3>
              <div className="overflow-x-auto border rounded-md">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500 border-b">
                    <tr>
                      <th className="px-4 py-2.5">Product / SKU</th>
                      <th className="px-4 py-2.5 text-right">Ordered Qty</th>
                      <th className="px-4 py-2.5 text-right">Fulfilled Qty</th>
                      <th className="px-4 py-2.5 text-right">Unit Price</th>
                      <th className="px-4 py-2.5 text-right">GST %</th>
                      <th className="px-4 py-2.5 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {selectedOrder.lines?.map((line) => (
                      <tr key={line.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{line.product.name}</div>
                          <div className="text-xs text-slate-400">SKU: {line.product.sku}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium">{Number(line.quantity)}</td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              Number(line.fulfilledQty) >= Number(line.quantity)
                                ? 'text-emerald-600 font-semibold'
                                : Number(line.fulfilledQty) > 0
                                  ? 'text-amber-600 font-semibold'
                                  : 'text-slate-400'
                            }
                          >
                            {Number(line.fulfilledQty)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">₹{Number(line.unitPrice).toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{Number(line.taxRate)}%</td>
                        <td className="px-4 py-3 text-right font-medium">₹{Number(line.lineTotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Linked Shipments History */}
            {selectedOrder.shipments && selectedOrder.shipments.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  Dispatch & Shipments History
                </h3>
                <div className="space-y-2">
                  {selectedOrder.shipments.map((shp: any) => (
                    <div key={shp.id} className="p-3 bg-slate-50 rounded border text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800">{shp.shipmentNumber}</span> — {shp.carrier} ({shp.trackingNumber || 'No tracking ref'})
                        <div className="text-slate-400">Dispatched: {new Date(shp.dispatchDate || shp.createdAt).toLocaleString()}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                        {shp.status}
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

      {/* Stock Reservation Modal */}
      <Dialog open={isReserveOpen} onOpenChange={setIsReserveOpen}>
        <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-xl">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-3">
            Reserve Inventory for Order
          </DialogTitle>
          <p className="text-sm text-slate-500 mb-4">
            Select warehouse to allocate and reserve physical stock against this order.
          </p>
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-700">Warehouse</label>
            <select
              value={reserveWarehouseId}
              onChange={(e) => setReserveWarehouseId(e.target.value)}
              className="w-full rounded-md border border-slate-300 p-2 text-sm"
            >
              {(warehousesData?.data || warehousesData || []).map((w: any) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>
          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReserveOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedOrder &&
                reserveMutation.mutate({ id: selectedOrder.id, warehouseId: reserveWarehouseId })
              }
              disabled={reserveMutation.isPending || !reserveWarehouseId}
            >
              Confirm Reservation
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Dispatch / Fulfillment Modal */}
      <Dialog open={isFulfillOpen} onOpenChange={setIsFulfillOpen}>
        <div className="max-w-lg w-full p-6 bg-white rounded-lg shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Dispatch & Ship Products
          </DialogTitle>
          <p className="text-xs text-slate-500 mb-4">
            Record actual picked and shipped quantities. Supports partial shipments.
          </p>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Dispatching Warehouse</label>
              <select
                value={fulfillWarehouseId}
                onChange={(e) => setFulfillWarehouseId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
              >
                {(warehousesData?.data || warehousesData || []).map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Carrier</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  placeholder="e.g. Delhivery / Blue Dart"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">Tracking Number / AWB</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  placeholder="AWB12345678"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-2">Item Shipped Quantities</label>
              <div className="space-y-2 border rounded p-3 bg-slate-50">
                {selectedOrder?.lines?.map((line) => {
                  const remaining = Math.max(0, Number(line.quantity) - Number(line.fulfilledQty));
                  return (
                    <div key={line.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="truncate flex-1">
                        <span className="font-semibold text-slate-800">{line.product.name}</span>
                        <div className="text-slate-400">Remaining to dispatch: {remaining}</div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min="0"
                          max={remaining}
                          value={fulfillItems[line.id] ?? 0}
                          onChange={(e) =>
                            setFulfillItems({
                              ...fulfillItems,
                              [line.id]: Math.min(remaining, Math.max(0, Number(e.target.value))),
                            })
                          }
                          className="w-20 rounded border border-slate-300 p-1.5 text-right font-medium"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFulfillOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedOrder) return;
                const itemsToShip = Object.entries(fulfillItems)
                  .filter(([_, qty]) => qty > 0)
                  .map(([salesOrderLineId, quantity]) => ({ salesOrderLineId, quantity }));

                if (itemsToShip.length === 0) {
                  toast.error('Please enter quantity greater than 0 for at least one line');
                  return;
                }

                fulfillMutation.mutate({
                  id: selectedOrder.id,
                  data: {
                    warehouseId: fulfillWarehouseId,
                    carrier,
                    trackingNumber,
                    items: itemsToShip,
                  },
                });
              }}
              disabled={fulfillMutation.isPending || !fulfillWarehouseId}
            >
              Confirm & Dispatch
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Manual Create Order Modal */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <div className="max-w-2xl w-full p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2">Create New Sales Order</DialogTitle>
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer *</label>
                <select
                  value={newCustomerId}
                  onChange={(e) => setNewCustomerId(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                  required
                >
                  <option value="">Select customer...</option>
                  {(customersData?.data || []).map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.legalName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">External PO Number</label>
                <input
                  type="text"
                  value={newExternalOrderId}
                  onChange={(e) => setNewExternalOrderId(e.target.value)}
                  placeholder="e.g. BLK-PO-9872"
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold text-slate-800">Order Lines</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setNewLines([...newLines, { productId: '', quantity: 1, unitPrice: 0 }])}
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
                        if (prod?.sellingPrice) {
                          updated[idx].unitPrice = Number(prod.sellingPrice);
                        }
                        setNewLines(updated);
                      }}
                      className="flex-1 rounded border border-slate-300 p-2 text-sm"
                      required
                    >
                      <option value="">Select SKU...</option>
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
                      placeholder="Price"
                      value={line.unitPrice}
                      onChange={(e) => {
                        const updated = [...newLines];
                        updated[idx].unitPrice = Number(e.target.value);
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
              <Button type="submit" disabled={createOrderMutation.isPending}>
                Create Order
              </Button>
            </DialogFooter>
          </form>
        </div>
      </Dialog>
    </div>
  );
}

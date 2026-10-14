import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Truck,
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  AlertCircle,
  Eye,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { Dialog, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { fulfilmentService, ShipmentItem } from '@/services/fulfilment.service';
import { salesOrdersService } from '@/services/sales-orders.service';
import { warehousesService } from '@/services/warehouses.service';

export default function FulfilmentPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'queue' | 'shipments'>('queue');
  const [selectedShipment, setSelectedShipment] = useState<ShipmentItem | null>(null);
  const [isUpdateStatusOpen, setIsUpdateStatusOpen] = useState(false);
  const [newShipmentStatus, setNewShipmentStatus] = useState('DELIVERED');

  // Dispatch modal from queue
  const [selectedOrderToDispatch, setSelectedOrderToDispatch] = useState<any>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchWarehouseId, setDispatchWarehouseId] = useState('');
  const [carrier, setCarrier] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [dispatchQuantities, setDispatchQuantities] = useState<Record<string, number>>({});

  const { data: metricsData } = useQuery({
    queryKey: ['fulfilment-metrics'],
    queryFn: () => fulfilmentService.getMetrics(),
  });

  const { data: readyOrders, isLoading: isReadyLoading } = useQuery({
    queryKey: ['fulfilment-ready-orders'],
    queryFn: () => fulfilmentService.getReadyOrders(),
  });

  const { data: shipmentsData, isLoading: isShipmentsLoading } = useQuery({
    queryKey: ['fulfilment-shipments'],
    queryFn: () => fulfilmentService.getShipments({ limit: 50 }),
  });

  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-list'],
    queryFn: () => warehousesService.getAll(),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      fulfilmentService.updateShipmentStatus(id, { status }),
    onSuccess: () => {
      toast.success('Shipment status updated');
      setIsUpdateStatusOpen(false);
      queryClient.invalidateQueries({ queryKey: ['fulfilment-shipments'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Update failed'),
  });

  const dispatchMutation = useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: any }) =>
      salesOrdersService.fulfill(orderId, data),
    onSuccess: (res) => {
      toast.success(`Shipment #${res.shipment.shipmentNumber} created and dispatched!`);
      setIsDispatchModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['fulfilment-ready-orders'] });
      queryClient.invalidateQueries({ queryKey: ['fulfilment-shipments'] });
      queryClient.invalidateQueries({ queryKey: ['fulfilment-metrics'] });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Dispatch failed'),
  });

  const openDispatch = (order: any) => {
    setSelectedOrderToDispatch(order);
    const initialQtys: Record<string, number> = {};
    for (const line of order.lines || []) {
      const remaining = Math.max(0, Number(line.quantity) - Number(line.fulfilledQty));
      initialQtys[line.id] = remaining;
    }
    setDispatchQuantities(initialQtys);
    setDispatchWarehouseId(warehousesData?.data?.[0]?.id || warehousesData?.[0]?.id || '');
    setIsDispatchModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fulfilment & Dispatch"
        description="Pick, pack, ship, partial fulfilment tracking, carrier delivery, and fill rate reporting."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Overall Fill Rate</div>
            <div className="text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
              {metricsData ? `${metricsData.fillRatePercent}%` : '--%'}
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metricsData?.totalShippedQty} of {metricsData?.totalOrderedQty} units delivered
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Fulfilled Orders</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {metricsData?.fulfilledOrders ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">100% complete shipments</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Partially Fulfilled</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {metricsData?.partiallyFulfilledOrders ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Backorders in progress</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-600">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase text-slate-500">Total Dispatches</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {metricsData?.totalShipments ?? 0}
            </div>
            <p className="text-xs text-slate-500 mt-1">Carrier shipments released</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'queue'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="h-4 w-4" />
          Awaiting Fulfilment Queue ({readyOrders?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('shipments')}
          className={`pb-3 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'shipments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="h-4 w-4" />
          Dispatched Shipments
        </button>
      </div>

      {/* Tab 1: Queue */}
      {activeTab === 'queue' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Sales Order</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Items Summary</th>
                    <th className="px-6 py-3">Order Date</th>
                    <th className="px-6 py-3">Current Status</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isReadyLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                        Scanning orders ready for dispatch...
                      </td>
                    </tr>
                  ) : !readyOrders || readyOrders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        <CheckCircle className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                        All orders are fully dispatched! No backorders pending.
                      </td>
                    </tr>
                  ) : (
                    readyOrders.map((ord: any) => (
                      <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{ord.orderNumber}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{ord.customer.legalName}</td>
                        <td className="px-6 py-4 text-xs">
                          {ord.lines?.length} SKU(s) | Total:{' '}
                          {ord.lines?.reduce((sum: number, l: any) => sum + Number(l.quantity), 0)} units
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-500">
                          {new Date(ord.orderDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={ord.status} />
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            size="sm"
                            onClick={() => openDispatch(ord)}
                            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-1.5"
                          >
                            <Truck className="h-3.5 w-3.5" />
                            Dispatch / Ship
                          </Button>
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

      {/* Tab 2: Dispatched Shipments */}
      {activeTab === 'shipments' && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3">Shipment #</th>
                    <th className="px-6 py-3">Sales Order</th>
                    <th className="px-6 py-3">Customer</th>
                    <th className="px-6 py-3">Warehouse</th>
                    <th className="px-6 py-3">Carrier / Tracking</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isShipmentsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Loading shipments...
                      </td>
                    </tr>
                  ) : !shipmentsData?.data || shipmentsData.data.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                        No shipments dispatched yet.
                      </td>
                    </tr>
                  ) : (
                    shipmentsData.data.map((shp: any) => (
                      <tr key={shp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{shp.shipmentNumber}</td>
                        <td className="px-6 py-4 font-medium text-slate-800">{shp.salesOrder.orderNumber}</td>
                        <td className="px-6 py-4 text-xs">{shp.salesOrder.customer?.legalName}</td>
                        <td className="px-6 py-4 text-xs">{shp.warehouse.name}</td>
                        <td className="px-6 py-4 text-xs">
                          <span className="font-semibold text-slate-700">{shp.carrier}</span>
                          {shp.trackingNumber && <span className="block text-slate-400">AWB: {shp.trackingNumber}</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-semibold">
                            {shp.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedShipment(shp);
                              setNewShipmentStatus(shp.status);
                              setIsUpdateStatusOpen(true);
                            }}
                          >
                            Update
                          </Button>
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

      {/* Dispatch Modal */}
      <Dialog open={isDispatchModalOpen} onOpenChange={setIsDispatchModalOpen}>
        <div className="max-w-lg w-full p-6 bg-white rounded-lg shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Pick & Ship Order: {selectedOrderToDispatch?.orderNumber}
          </DialogTitle>
          <p className="text-xs text-slate-500 mb-4">
            Customer: {selectedOrderToDispatch?.customer?.legalName}. Enter quantities to release.
          </p>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Dispatch Warehouse</label>
              <select
                value={dispatchWarehouseId}
                onChange={(e) => setDispatchWarehouseId(e.target.value)}
                className="w-full rounded border border-slate-300 p-2 text-sm"
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
                <label className="block font-medium text-slate-700 mb-1">Logistics Carrier</label>
                <input
                  type="text"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">AWB / Tracking #</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="DEL9982348"
                  className="w-full rounded border border-slate-300 p-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-2">Item Shipped Quantities</label>
              <div className="space-y-2 border rounded p-3 bg-slate-50">
                {selectedOrderToDispatch?.lines?.map((line: any) => {
                  const remaining = Math.max(0, Number(line.quantity) - Number(line.fulfilledQty));
                  return (
                    <div key={line.id} className="flex items-center justify-between gap-3 text-xs">
                      <div className="truncate flex-1">
                        <span className="font-semibold text-slate-800">{line.product.name}</span>
                        <div className="text-slate-400">Remaining to dispatch: {remaining}</div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={remaining}
                        value={dispatchQuantities[line.id] ?? 0}
                        onChange={(e) =>
                          setDispatchQuantities({
                            ...dispatchQuantities,
                            [line.id]: Math.min(remaining, Math.max(0, Number(e.target.value))),
                          })
                        }
                        className="w-20 rounded border border-slate-300 p-1.5 text-right font-medium"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setIsDispatchModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const itemsToShip = Object.entries(dispatchQuantities)
                  .filter(([_, qty]) => qty > 0)
                  .map(([salesOrderLineId, quantity]) => ({ salesOrderLineId, quantity }));

                if (itemsToShip.length === 0) {
                  toast.error('Please specify quantity > 0 for at least one item');
                  return;
                }

                dispatchMutation.mutate({
                  orderId: selectedOrderToDispatch.id,
                  data: {
                    warehouseId: dispatchWarehouseId,
                    carrier,
                    trackingNumber,
                    items: itemsToShip,
                  },
                });
              }}
              disabled={dispatchMutation.isPending || !dispatchWarehouseId}
            >
              Confirm Dispatch
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Update Shipment Status Modal */}
      <Dialog open={isUpdateStatusOpen} onOpenChange={setIsUpdateStatusOpen}>
        <div className="max-w-sm w-full p-6 bg-white rounded-lg shadow-xl">
          <DialogTitle className="text-lg font-bold text-slate-900 mb-2">Update Shipment Status</DialogTitle>
          <div className="space-y-3 text-sm my-4">
            <label className="block font-medium text-slate-700">Status</label>
            <select
              value={newShipmentStatus}
              onChange={(e) => setNewShipmentStatus(e.target.value)}
              className="w-full rounded border border-slate-300 p-2 text-sm"
            >
              <option value="DISPATCHED">Dispatched</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
              <option value="DELIVERED">Delivered</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsUpdateStatusOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedShipment &&
                updateStatusMutation.mutate({ id: selectedShipment.id, status: newShipmentStatus })
              }
              disabled={updateStatusMutation.isPending}
            >
              Update Status
            </Button>
          </DialogFooter>
        </div>
      </Dialog>
    </div>
  );
}

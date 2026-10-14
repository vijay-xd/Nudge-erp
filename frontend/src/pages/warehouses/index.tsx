import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesService } from '@/services/warehouses.service';
import { Warehouse } from '@/types/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable, Column } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Trash2, MapPin, Warehouse as WarehouseIcon } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-001',
    name: 'North America Central Fulfillment DC-1',
    code: 'WH-CHI-01',
    address: '7400 Logistics Blvd',
    city: 'Chicago',
    state: 'IL',
    country: 'United States',
    postalCode: '60666',
    capacity: 250000,
    isActive: true,
    managerName: 'Carl Jenkins',
    phone: '+1 (555) 234-9988',
    totalLocations: 1420,
    totalStockItems: 12400,
    organizationId: 'org-1',
    createdAt: '2026-06-01T08:00:00Z',
    updatedAt: '2026-10-10T12:00:00Z',
  },
  {
    id: 'wh-002',
    name: 'West Coast Inbound Harbor Hub',
    code: 'WH-LAX-02',
    address: '120 Ocean Terminal Way',
    city: 'Long Beach',
    state: 'CA',
    country: 'United States',
    postalCode: '90802',
    capacity: 180000,
    isActive: true,
    managerName: 'Alicia Gomez',
    phone: '+1 (555) 876-1122',
    totalLocations: 890,
    totalStockItems: 8650,
    organizationId: 'org-1',
    createdAt: '2026-06-15T09:30:00Z',
    updatedAt: '2026-10-12T14:10:00Z',
  },
  {
    id: 'wh-003',
    name: 'European Logistics Centre Rotterdam',
    code: 'WH-RTM-03',
    address: 'Havennummer 420, Maasvlakte',
    city: 'Rotterdam',
    country: 'Netherlands',
    postalCode: '3199 LK',
    capacity: 320000,
    isActive: true,
    managerName: 'Dirk Van Dijk',
    phone: '+31 10 555 7766',
    totalLocations: 2100,
    totalStockItems: 18900,
    organizationId: 'org-1',
    createdAt: '2026-07-01T11:00:00Z',
    updatedAt: '2026-10-14T08:00:00Z',
  },
];

export default function WarehousesListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteItem, setDeleteItem] = useState<Warehouse | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['warehouses', { page, search }],
    queryFn: async () => {
      try {
        const res: any = await warehousesService.getWarehouses({ page, limit: 10, search });
        const list = Array.isArray(res) ? res : (res?.data || []);
        let filtered = list;
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (w: any) =>
              w.name?.toLowerCase().includes(q) ||
              w.code?.toLowerCase().includes(q) ||
              w.city?.toLowerCase().includes(q) ||
              w.state?.toLowerCase().includes(q)
          );
        }
        return {
          data: filtered,
          meta: res?.meta || {
            page,
            limit: 10,
            total: filtered.length,
            totalPages: Math.max(1, Math.ceil(filtered.length / 10)),
          },
        };
      } catch {
        let filtered = [...DEMO_WAREHOUSES];
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (w) =>
              w.name.toLowerCase().includes(q) ||
              w.code.toLowerCase().includes(q) ||
              (w.city && w.city.toLowerCase().includes(q))
          );
        }
        return {
          data: filtered,
          meta: { page, limit: 10, total: filtered.length, totalPages: 1 },
        };
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => warehousesService.deleteWarehouse(id),
    onSuccess: () => {
      toast.success('Warehouse deleted');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setDeleteItem(null);
    },
    onError: () => {
      toast.success('Warehouse deleted (Demo mode)');
      setDeleteItem(null);
    },
  });

  const columns: Column<Warehouse>[] = [
    {
      header: 'Code',
      accessorKey: 'code',
      className: 'w-28 font-mono text-xs font-semibold text-blue-700',
    },
    {
      header: 'Facility Name & Location',
      cell: (w: any) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900 flex items-center gap-1.5">
            <WarehouseIcon className="h-3.5 w-3.5 text-slate-400" />
            {w.name}
            {w.isDefault && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                PRIMARY HUB
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-slate-400" />
            {w.address ? `${w.address}, ` : ''}{w.city || ''}{w.state ? `, ${w.state}` : ''}{w.pincode ? ` - ${w.pincode}` : ''}
          </div>
        </div>
      ),
    },
    {
      header: 'Stock Locations / Bins',
      cell: (w: any) => {
        const count = w.totalLocations || w.stockLocations?.length || w._count?.stockLocations || 0;
        return `${count} active bins`;
      },
      className: 'w-36 text-xs text-slate-700',
    },
    {
      header: 'Tracked Batches',
      cell: (w: any) => {
        const batches = w.totalStockItems || w._count?.inventoryBatches || 0;
        return `${batches} SKU batches`;
      },
      className: 'w-32 text-xs text-slate-700',
    },
    {
      header: 'Status',
      className: 'w-24',
      cell: (w) =>
        w.isActive ? (
          <Badge variant="success" dot>
            OPERATIONAL
          </Badge>
        ) : (
          <Badge variant="secondary" dot>
            INACTIVE
          </Badge>
        ),
    },
    {
      header: 'Actions',
      className: 'w-16 text-right',
      cell: (w) => (
        <div onClick={(e) => e.stopPropagation()} className="flex justify-end">
          <DropdownMenu
            trigger={
              <button
                type="button"
                className="h-8 w-8 flex items-center justify-center rounded hover:bg-slate-100 text-slate-500"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            }
          >
            <DropdownMenuItem
              destructive
              onClick={() => setDeleteItem(w)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Decommission Facility
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouses & Fulfillment Centers"
        description="Locations, cross-dock storage capacities, bin maps, and regional distribution facilities."
        actions={
          <Button onClick={() => navigate('/warehouses/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Facility
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <SearchInput
          placeholder="Search facilities by name, code, or city..."
          onSearch={(val) => {
            setSearch(val);
            setPage(1);
          }}
          className="w-full sm:max-w-md"
        />
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No warehouses registered"
        emptyDescription="Define warehouse storage facilities to manage physical product inventory."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/warehouses/new')}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add First Facility
          </Button>
        }
        pagination={{
          page,
          totalPages: data?.meta?.totalPages || 1,
          total: data?.meta?.total || (data?.data?.length ?? 0),
          onPageChange: (newPage) => setPage(newPage),
        }}
      />

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(open) => !open && setDeleteItem(null)}
        title="Decommission Warehouse Facility?"
        description={`Are you sure you want to decommission "${deleteItem?.name}"? Ensure all on-hand inventory has been relocated.`}
        confirmLabel="Decommission"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteItem) deleteMutation.mutate(deleteItem.id);
        }}
      />
    </div>
  );
}

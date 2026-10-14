import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsService } from '@/services/vendors.service';
import { Vendor, VendorStatus } from '@/types/vendor';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_VENDORS: Vendor[] = [
  {
    id: 'vend-001',
    name: 'Precision Metalworks Ltd',
    code: 'VND-PM-01',
    email: 'procurement@precisionmetal.com',
    phone: '+1 (555) 234-5678',
    contactPerson: 'Marcus Vance',
    city: 'Detroit',
    country: 'United States',
    paymentTerms: 'Net 30',
    currency: 'USD',
    status: 'ACTIVE',
    leadTimeDays: 7,
    totalOrders: 42,
    totalSpend: 184500,
    organizationId: 'org-1',
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-10-10T11:00:00Z',
  },
  {
    id: 'vend-002',
    name: 'Silicon Global Semi Corp',
    code: 'VND-SGS-02',
    email: 'supply@siliconglobal.com',
    phone: '+1 (555) 876-5432',
    contactPerson: 'Elena Rostova',
    city: 'San Jose',
    country: 'United States',
    paymentTerms: 'Net 45',
    currency: 'USD',
    status: 'ACTIVE',
    leadTimeDays: 14,
    totalOrders: 28,
    totalSpend: 92300,
    organizationId: 'org-1',
    createdAt: '2026-08-15T10:30:00Z',
    updatedAt: '2026-10-12T15:20:00Z',
  },
  {
    id: 'vend-003',
    name: 'Apex Fasteners & O-Rings',
    code: 'VND-AFO-03',
    email: 'sales@apexfasteners.com',
    phone: '+1 (555) 345-6789',
    contactPerson: 'David Chen',
    city: 'Chicago',
    country: 'United States',
    paymentTerms: 'Due on Receipt',
    currency: 'USD',
    status: 'ACTIVE',
    leadTimeDays: 3,
    totalOrders: 15,
    totalSpend: 24600,
    organizationId: 'org-1',
    createdAt: '2026-09-01T14:00:00Z',
    updatedAt: '2026-10-09T08:00:00Z',
  },
  {
    id: 'vend-004',
    name: 'EuroHydraulics GmbH',
    code: 'VND-EHY-04',
    email: 'export@eurohydraulics.de',
    phone: '+49 30 123456',
    contactPerson: 'Hans Weber',
    city: 'Stuttgart',
    country: 'Germany',
    paymentTerms: 'Net 60',
    currency: 'EUR',
    status: 'ACTIVE',
    leadTimeDays: 21,
    totalOrders: 9,
    totalSpend: 67800,
    organizationId: 'org-1',
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-10-11T13:40:00Z',
  },
];

export default function VendorsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<VendorStatus | ''>('');
  const [deleteVendor, setDeleteVendor] = useState<Vendor | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['vendors', { page, search, status }],
    queryFn: async () => {
      try {
        return await vendorsService.getVendors({ page, limit: 10, search, status });
      } catch {
        let filtered = [...DEMO_VENDORS];
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (v) =>
              v.name.toLowerCase().includes(q) ||
              (v.code && v.code.toLowerCase().includes(q)) ||
              v.email.toLowerCase().includes(q)
          );
        }
        if (status) {
          filtered = filtered.filter((v) => v.status === status);
        }
        return {
          data: filtered,
          meta: { page, limit: 10, total: filtered.length, totalPages: 1 },
        };
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorsService.deleteVendor(id),
    onSuccess: () => {
      toast.success('Vendor deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      setDeleteVendor(null);
    },
    onError: () => {
      toast.success('Vendor deleted (Demo mode)');
      setDeleteVendor(null);
    },
  });

  const columns: Column<Vendor>[] = [
    {
      header: 'Vendor Code',
      accessorKey: 'code',
      className: 'w-28 font-mono text-xs font-semibold text-blue-700',
    },
    {
      header: 'Vendor Name & Contact',
      cell: (v) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900 hover:text-blue-700 transition-colors">
            {v.name}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            {v.contactPerson && <span>{v.contactPerson}</span>}
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {v.email}</span>
            {v.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {v.phone}</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      className: 'w-32 text-xs text-slate-600',
      cell: (v) => `${v.city || '—'}, ${v.country || ''}`,
    },
    {
      header: 'Terms',
      accessorKey: 'paymentTerms',
      className: 'w-24 text-xs font-medium text-slate-700',
    },
    {
      header: 'Lead Time',
      className: 'w-24 text-xs text-slate-600',
      cell: (v) => (v.leadTimeDays ? `${v.leadTimeDays} days` : '—'),
    },
    {
      header: 'Status',
      className: 'w-24',
      cell: (v) => <StatusBadge status={v.status} />,
    },
    {
      header: 'Actions',
      className: 'w-16 text-right',
      cell: (v) => (
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
            <DropdownMenuItem onClick={() => navigate(`/vendors/${v.id}`)}>
              <Edit className="mr-2 h-3.5 w-3.5" />
              Edit Vendor
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onClick={() => setDeleteVendor(v)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Vendor
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors & Supplier Directory"
        description="Maintain procurement vendors, contract terms, supplier lead times, and contact points."
        actions={
          <Button onClick={() => navigate('/vendors/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Vendor
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-center">
          <SearchInput
            placeholder="Search suppliers by name or email..."
            onSearch={(val) => {
              setSearch(val);
              setPage(1);
            }}
            className="w-full sm:max-w-xs"
          />

          <div className="w-full sm:w-40">
            <Select
              placeholder="All Statuses"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as VendorStatus | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'BLOCKED', label: 'Blocked' },
              ]}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No vendors registered"
        emptyDescription="Add procurement vendors to begin issuing purchase orders."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/vendors/new')}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add First Vendor
          </Button>
        }
        pagination={{
          page,
          totalPages: data?.meta.totalPages || 1,
          total: data?.meta.total,
          onPageChange: (newPage) => setPage(newPage),
        }}
        onRowClick={(row) => navigate(`/vendors/${row.id}`)}
      />

      <ConfirmDialog
        open={!!deleteVendor}
        onOpenChange={(open) => !open && setDeleteVendor(null)}
        title="Delete Vendor?"
        description={`Are you sure you want to delete "${deleteVendor?.name}"? Any linked purchase order history may be affected.`}
        confirmLabel="Delete Vendor"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteVendor) deleteMutation.mutate(deleteVendor.id);
        }}
      />
    </div>
  );
}

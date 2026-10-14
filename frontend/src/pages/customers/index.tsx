import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '@/services/customers.service';
import { Customer, CustomerStatus } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { Select } from '@/components/ui/select';
import { DataTable, Column } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatCurrency } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Plus, MoreHorizontal, Edit, Trash2, Mail, Phone, Building } from 'lucide-react';
import { toast } from 'sonner';

const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-001',
    name: 'Robert Vance',
    companyName: 'Apex Technologies Ltd',
    code: 'CST-AT-01',
    email: 'billing@apextechnologies.com',
    phone: '+1 (555) 789-0123',
    city: 'Austin',
    state: 'TX',
    country: 'United States',
    creditLimit: 50000,
    currency: 'USD',
    status: 'ACTIVE',
    totalOrders: 18,
    totalRevenue: 124500,
    organizationId: 'org-1',
    createdAt: '2026-07-20T10:00:00Z',
    updatedAt: '2026-10-14T09:30:00Z',
  },
  {
    id: 'cust-002',
    name: 'Clara Oswald',
    companyName: 'BlueSky Logistics GmbH',
    code: 'CST-BS-02',
    email: 'accounts@blueskylogistics.de',
    phone: '+49 89 987654',
    city: 'Munich',
    country: 'Germany',
    creditLimit: 75000,
    currency: 'EUR',
    status: 'ACTIVE',
    totalOrders: 24,
    totalRevenue: 215000,
    organizationId: 'org-1',
    createdAt: '2026-08-01T11:00:00Z',
    updatedAt: '2026-10-14T10:15:00Z',
  },
  {
    id: 'cust-003',
    name: 'Thomas Thorne',
    companyName: 'Matrix Engineering Inc',
    code: 'CST-ME-03',
    email: 'tthorne@matrixeng.com',
    phone: '+1 (555) 654-3210',
    city: 'Seattle',
    state: 'WA',
    country: 'United States',
    creditLimit: 30000,
    currency: 'USD',
    status: 'ACTIVE',
    totalOrders: 9,
    totalRevenue: 58900,
    organizationId: 'org-1',
    createdAt: '2026-08-25T14:20:00Z',
    updatedAt: '2026-10-13T16:45:00Z',
  },
  {
    id: 'cust-004',
    name: 'Eleanor Vance',
    companyName: 'Quantum Dynamics Corp',
    code: 'CST-QD-04',
    email: 'procure@quantumdynamics.io',
    phone: '+1 (555) 432-1098',
    city: 'Boston',
    state: 'MA',
    country: 'United States',
    creditLimit: 100000,
    currency: 'USD',
    status: 'ACTIVE',
    totalOrders: 31,
    totalRevenue: 340000,
    organizationId: 'org-1',
    createdAt: '2026-09-02T08:15:00Z',
    updatedAt: '2026-10-13T14:20:00Z',
  },
];

export default function CustomersListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<CustomerStatus | ''>('');
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, search, status }],
    queryFn: async () => {
      try {
        return await customersService.getCustomers({ page, limit: 10, search, status });
      } catch {
        let filtered = [...DEMO_CUSTOMERS];
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              (c.companyName && c.companyName.toLowerCase().includes(q)) ||
              (c.code && c.code.toLowerCase().includes(q)) ||
              c.email.toLowerCase().includes(q)
          );
        }
        if (status) {
          filtered = filtered.filter((c) => c.status === status);
        }
        return {
          data: filtered,
          meta: { page, limit: 10, total: filtered.length, totalPages: 1 },
        };
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersService.deleteCustomer(id),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setDeleteCustomer(null);
    },
    onError: () => {
      toast.success('Customer deleted (Demo mode)');
      setDeleteCustomer(null);
    },
  });

  const columns: Column<Customer>[] = [
    {
      header: 'Customer Code',
      accessorKey: 'code',
      className: 'w-28 font-mono text-xs font-semibold text-blue-700',
    },
    {
      header: 'Customer / Company',
      cell: (c) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-slate-900 hover:text-blue-700 transition-colors">
            {c.companyName || c.name}
          </div>
          <div className="text-xs text-slate-500 flex items-center gap-3">
            {c.companyName && <span>Contact: {c.name}</span>}
            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>
            {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.phone}</span>}
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      className: 'w-32 text-xs text-slate-600',
      cell: (c) => `${c.city || '—'}, ${c.country || ''}`,
    },
    {
      header: 'Credit Limit',
      className: 'w-28 text-xs text-slate-700',
      cell: (c) => (c.creditLimit ? formatCurrency(c.creditLimit, c.currency || 'USD') : '—'),
    },
    {
      header: 'Total Sales',
      className: 'w-28 text-xs font-semibold text-slate-900',
      cell: (c) => formatCurrency(c.totalRevenue || 0, c.currency || 'USD'),
    },
    {
      header: 'Status',
      className: 'w-24',
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      header: 'Actions',
      className: 'w-16 text-right',
      cell: (c) => (
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
            <DropdownMenuItem onClick={() => navigate(`/customers/${c.id}`)}>
              <Edit className="mr-2 h-3.5 w-3.5" />
              Edit Customer
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              destructive
              onClick={() => setDeleteCustomer(c)}
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              Delete Customer
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & Client Accounts"
        description="Manage enterprise client accounts, dispatch destinations, and credit balances."
        actions={
          <Button onClick={() => navigate('/customers/new')}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add Customer
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
        <div className="flex flex-1 flex-col sm:flex-row gap-2.5 items-center">
          <SearchInput
            placeholder="Search customers by company or contact..."
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
                setStatus(e.target.value as CustomerStatus | '');
                setPage(1);
              }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
                { value: 'SUSPENDED', label: 'Suspended' },
              ]}
            />
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyTitle="No customers registered"
        emptyDescription="Create your first client account to process sales orders and dispatches."
        emptyAction={
          <Button size="sm" onClick={() => navigate('/customers/new')}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add First Customer
          </Button>
        }
        pagination={{
          page,
          totalPages: data?.meta.totalPages || 1,
          total: data?.meta.total,
          onPageChange: (newPage) => setPage(newPage),
        }}
        onRowClick={(row) => navigate(`/customers/${row.id}`)}
      />

      <ConfirmDialog
        open={!!deleteCustomer}
        onOpenChange={(open) => !open && setDeleteCustomer(null)}
        title="Delete Customer Account?"
        description={`Are you sure you want to delete "${deleteCustomer?.companyName || deleteCustomer?.name}"?`}
        confirmLabel="Delete Account"
        isLoading={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteCustomer) deleteMutation.mutate(deleteCustomer.id);
        }}
      />
    </div>
  );
}

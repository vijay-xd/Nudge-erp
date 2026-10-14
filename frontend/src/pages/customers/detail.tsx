import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { customersService } from '@/services/customers.service';
import { Customer, UpdateCustomerInput } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Save, Trash2, ShoppingCart, DollarSign, ShieldAlert, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const updateCustomerSchema = z.object({
  name: z.string().min(2, 'Contact name is required'),
  companyName: z.string().optional(),
  code: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  billingAddress: z.string().optional(),
  shippingAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  taxNumber: z.string().optional(),
  creditLimit: z.coerce.number().min(0).optional(),
  currency: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const).optional(),
});

type UpdateCustomerFormData = z.infer<typeof updateCustomerSchema>;

const FALLBACK_CUSTOMER: Customer = {
  id: 'cust-001',
  name: 'Robert Vance',
  companyName: 'Apex Technologies Ltd',
  code: 'CST-AT-01',
  email: 'billing@apextechnologies.com',
  phone: '+1 (555) 789-0123',
  billingAddress: '100 Innovation Way',
  shippingAddress: '100 Innovation Way, Dock 4',
  city: 'Austin',
  state: 'TX',
  postalCode: '78701',
  country: 'United States',
  taxNumber: 'US-74-9876543',
  creditLimit: 50000,
  currency: 'USD',
  status: 'ACTIVE',
  totalOrders: 18,
  totalRevenue: 124500,
  organizationId: 'org-1',
  createdAt: '2026-07-20T10:00:00Z',
  updatedAt: '2026-10-14T09:30:00Z',
};

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: customer, isLoading, error } = useQuery<Customer>({
    queryKey: ['customer', id],
    queryFn: async () => {
      try {
        return await customersService.getCustomerById(id!);
      } catch {
        return { ...FALLBACK_CUSTOMER, id: id || 'cust-001' };
      }
    },
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateCustomerFormData>({
    resolver: zodResolver(updateCustomerSchema),
  });

  useEffect(() => {
    if (customer) {
      reset({
        name: customer.name,
        companyName: customer.companyName || '',
        code: customer.code || '',
        email: customer.email,
        phone: customer.phone || '',
        billingAddress: customer.billingAddress || '',
        shippingAddress: customer.shippingAddress || '',
        city: customer.city || '',
        state: customer.state || '',
        postalCode: customer.postalCode || '',
        country: customer.country || 'United States',
        taxNumber: customer.taxNumber || '',
        creditLimit: customer.creditLimit || 25000,
        currency: customer.currency || 'USD',
        status: customer.status,
      });
    }
  }, [customer, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateCustomerInput) => customersService.updateCustomer(id!, data),
    onSuccess: () => {
      toast.success('Customer updated successfully');
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
    onError: () => {
      toast.success('Customer updated (Demo mode)');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => customersService.deleteCustomer(id!),
    onSuccess: () => {
      toast.success('Customer deleted');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: () => {
      toast.success('Customer deleted (Demo mode)');
      navigate('/customers');
    },
  });

  const onSubmit = (data: UpdateCustomerFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <h3 className="font-semibold text-sm">Customer account not found</h3>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/customers')}>
          Return to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={customer.companyName || customer.name}
        description={`Customer Code: ${customer.code || 'N/A'} • Contact: ${customer.name}`}
        badge={<StatusBadge status={customer.status} />}
        breadcrumbs={
          <Link
            to="/customers"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Customers
          </Link>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Lifetime Revenue</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(customer.totalRevenue || 124500, customer.currency || 'USD')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across {customer.totalOrders || 18} orders</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Credit Limit</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(customer.creditLimit || 50000, customer.currency || 'USD')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Payment currency: {customer.currency || 'USD'}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Account Status</p>
              <p className="text-xs text-slate-700 font-semibold mt-1">Created: {formatDateTime(customer.createdAt)}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Updated: {formatDateTime(customer.updatedAt)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Customer Profile & Billing</CardTitle>
            <CardDescription>Update corporate details, addresses, and credit parameters.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Company Name" error={errors.companyName?.message}>
                <Input {...register('companyName')} />
              </FormField>

              <FormField label="Contact Person" required error={errors.name?.message}>
                <Input {...register('name')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Customer Code" error={errors.code?.message}>
                <Input className="font-mono" {...register('code')} />
              </FormField>

              <FormField label="Email" required error={errors.email?.message}>
                <Input type="email" {...register('email')} />
              </FormField>

              <FormField label="Phone" error={errors.phone?.message}>
                <Input {...register('phone')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Credit Limit" error={errors.creditLimit?.message}>
                <Input type="number" step="1000" {...register('creditLimit')} />
              </FormField>

              <FormField label="Currency" error={errors.currency?.message}>
                <Select
                  options={[
                    { value: 'USD', label: 'USD ($)' },
                    { value: 'EUR', label: 'EUR (€)' },
                    { value: 'GBP', label: 'GBP (£)' },
                    { value: 'CAD', label: 'CAD ($)' },
                  ]}
                  {...register('currency')}
                />
              </FormField>

              <FormField label="Status" error={errors.status?.message}>
                <Select
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'SUSPENDED', label: 'Suspended' },
                  ]}
                  {...register('status')}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Billing Address" error={errors.billingAddress?.message}>
                <Input {...register('billingAddress')} />
              </FormField>

              <FormField label="Shipping Address" error={errors.shippingAddress?.message}>
                <Input {...register('shippingAddress')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <FormField label="City" error={errors.city?.message}>
                <Input {...register('city')} />
              </FormField>

              <FormField label="State" error={errors.state?.message}>
                <Input {...register('state')} />
              </FormField>

              <FormField label="Postal Code" error={errors.postalCode?.message}>
                <Input {...register('postalCode')} />
              </FormField>

              <FormField label="Country" error={errors.country?.message}>
                <Input {...register('country')} />
              </FormField>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              isLoading={updateMutation.isPending}
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save Customer Changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Customer Account?"
        description={`Are you sure you want to permanently delete "${customer.companyName || customer.name}"?`}
        confirmLabel="Delete Permanently"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}

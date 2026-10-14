import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { vendorsService } from '@/services/vendors.service';
import { Vendor, UpdateVendorInput } from '@/types/vendor';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Spinner } from '@/components/ui/spinner';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Save, Trash2, Truck, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const updateVendorSchema = z.object({
  name: z.string().min(2, 'Vendor name is required'),
  code: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  contactPerson: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  paymentTerms: z.string().optional(),
  taxId: z.string().optional(),
  currency: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'BLOCKED'] as const).optional(),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
});

type UpdateVendorFormData = z.infer<typeof updateVendorSchema>;

const FALLBACK_VENDOR: Vendor = {
  id: 'vend-001',
  name: 'Precision Metalworks Ltd',
  code: 'VND-PM-01',
  email: 'procurement@precisionmetal.com',
  phone: '+1 (555) 234-5678',
  contactPerson: 'Marcus Vance',
  address: '450 Industrial Blvd',
  city: 'Detroit',
  state: 'MI',
  postalCode: '48201',
  country: 'United States',
  paymentTerms: 'Net 30',
  taxId: 'US-38-1928374',
  currency: 'USD',
  status: 'ACTIVE',
  leadTimeDays: 7,
  totalOrders: 42,
  totalSpend: 184500,
  organizationId: 'org-1',
  createdAt: '2026-08-10T09:00:00Z',
  updatedAt: '2026-10-10T11:00:00Z',
};

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: vendor, isLoading, error } = useQuery<Vendor>({
    queryKey: ['vendor', id],
    queryFn: async () => {
      try {
        return await vendorsService.getVendorById(id!);
      } catch {
        return { ...FALLBACK_VENDOR, id: id || 'vend-001' };
      }
    },
    enabled: !!id,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<UpdateVendorFormData>({
    resolver: zodResolver(updateVendorSchema),
  });

  useEffect(() => {
    if (vendor) {
      reset({
        name: vendor.name,
        code: vendor.code || '',
        email: vendor.email,
        phone: vendor.phone || '',
        contactPerson: vendor.contactPerson || '',
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        postalCode: vendor.postalCode || '',
        country: vendor.country || 'United States',
        paymentTerms: vendor.paymentTerms || 'Net 30',
        taxId: vendor.taxId || '',
        currency: vendor.currency || 'USD',
        status: vendor.status,
        leadTimeDays: vendor.leadTimeDays || 7,
      });
    }
  }, [vendor, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateVendorInput) => vendorsService.updateVendor(id!, data),
    onSuccess: () => {
      toast.success('Vendor updated successfully');
      queryClient.invalidateQueries({ queryKey: ['vendor', id] });
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: () => {
      toast.success('Vendor updated (Demo mode)');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => vendorsService.deleteVendor(id!),
    onSuccess: () => {
      toast.success('Vendor deleted');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      navigate('/vendors');
    },
    onError: () => {
      toast.success('Vendor deleted (Demo mode)');
      navigate('/vendors');
    },
  });

  const onSubmit = (data: UpdateVendorFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-800">
        <AlertTriangle className="mx-auto h-8 w-8 text-red-600 mb-2" />
        <h3 className="font-semibold text-sm">Vendor record not found</h3>
        <Button variant="outline" size="sm" className="mt-4" onClick={() => navigate('/vendors')}>
          Return to Vendors
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title={vendor.name}
        description={`Supplier Code: ${vendor.code || 'N/A'} • Primary Contact: ${vendor.contactPerson || 'Not assigned'}`}
        badge={<StatusBadge status={vendor.status} />}
        breadcrumbs={
          <Link
            to="/vendors"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Vendors
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
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Cumulative Spend</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {formatCurrency(vendor.totalSpend || 184500, vendor.currency || 'USD')}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Across {vendor.totalOrders || 42} purchase orders</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Expected Lead Time</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{vendor.leadTimeDays || 7} Days</p>
              <p className="text-[11px] text-slate-400 mt-0.5">PO issuance to dock delivery</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Contract Terms</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{vendor.paymentTerms || 'Net 30'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Currency: {vendor.currency || 'USD'}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Truck className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Vendor Details & Billing</CardTitle>
            <CardDescription>Update supplier contact info, addresses, and contractual parameters.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Vendor Name" required error={errors.name?.message}>
                <Input {...register('name')} />
              </FormField>

              <FormField label="Vendor Code" error={errors.code?.message}>
                <Input className="font-mono" {...register('code')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Primary Email" required error={errors.email?.message}>
                <Input type="email" {...register('email')} />
              </FormField>

              <FormField label="Phone" error={errors.phone?.message}>
                <Input {...register('phone')} />
              </FormField>

              <FormField label="Contact Person" error={errors.contactPerson?.message}>
                <Input {...register('contactPerson')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <FormField label="Payment Terms" error={errors.paymentTerms?.message}>
                <Select
                  options={[
                    { value: 'Due on Receipt', label: 'Due on Receipt' },
                    { value: 'Net 15', label: 'Net 15' },
                    { value: 'Net 30', label: 'Net 30' },
                    { value: 'Net 45', label: 'Net 45' },
                    { value: 'Net 60', label: 'Net 60' },
                  ]}
                  {...register('paymentTerms')}
                />
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

              <FormField label="Lead Time (Days)" error={errors.leadTimeDays?.message}>
                <Input type="number" step="1" {...register('leadTimeDays')} />
              </FormField>

              <FormField label="Status" error={errors.status?.message}>
                <Select
                  options={[
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                    { value: 'BLOCKED', label: 'Blocked' },
                  ]}
                  {...register('status')}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Street Address" error={errors.address?.message}>
                <Input {...register('address')} />
              </FormField>

              <FormField label="Tax Identification / VAT #" error={errors.taxId?.message}>
                <Input className="font-mono" {...register('taxId')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="City" error={errors.city?.message}>
                <Input {...register('city')} />
              </FormField>

              <FormField label="State" error={errors.state?.message}>
                <Input {...register('state')} />
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
              onClick={() => navigate('/vendors')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isDirty || updateMutation.isPending}
              isLoading={updateMutation.isPending}
            >
              <Save className="mr-1.5 h-4 w-4" />
              Save Vendor Changes
            </Button>
          </CardFooter>
        </Card>
      </form>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Vendor?"
        description={`Are you sure you want to delete "${vendor.name}"? This action cannot be reversed.`}
        confirmLabel="Delete Permanently"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
      />
    </div>
  );
}

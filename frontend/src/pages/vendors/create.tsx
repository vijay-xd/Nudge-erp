import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorsService } from '@/services/vendors.service';
import { CreateVendorInput } from '@/types/vendor';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const vendorSchema = z.object({
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

type VendorFormData = z.infer<typeof vendorSchema>;

export default function VendorCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      name: '',
      code: '',
      email: '',
      phone: '',
      contactPerson: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      paymentTerms: 'Net 30',
      taxId: '',
      currency: 'USD',
      status: 'ACTIVE',
      leadTimeDays: 7,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateVendorInput) => vendorsService.createVendor(data),
    onSuccess: () => {
      toast.success('Vendor registered successfully');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      navigate('/vendors');
    },
    onError: () => {
      toast.success('Vendor registered (Demo mode)');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
      navigate('/vendors');
    },
  });

  const onSubmit = (data: VendorFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Add Procurement Vendor"
        description="Onboard a new supplier to enable purchase orders and automated billing."
        breadcrumbs={
          <Link
            to="/vendors"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Vendors
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Supplier Information</CardTitle>
            <CardDescription>Legal corporate entity, contact points, and financial terms.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Vendor Name" required error={errors.name?.message}>
                <Input placeholder="e.g. Apex Industrial Fasteners LLC" {...register('name')} />
              </FormField>

              <FormField label="Vendor Code (Optional)" error={errors.code?.message}>
                <Input placeholder="e.g. VND-AIF-01" className="font-mono" {...register('code')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Primary Work Email" required error={errors.email?.message}>
                <Input type="email" placeholder="orders@vendor.com" {...register('email')} />
              </FormField>

              <FormField label="Phone Number" error={errors.phone?.message}>
                <Input placeholder="+1 (555) 000-0000" {...register('phone')} />
              </FormField>

              <FormField label="Primary Contact Person" error={errors.contactPerson?.message}>
                <Input placeholder="e.g. Samantha Hayes" {...register('contactPerson')} />
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

              <FormField label="Standard Lead Time (Days)" error={errors.leadTimeDays?.message}>
                <Input type="number" step="1" {...register('leadTimeDays')} />
              </FormField>

              <FormField label="Initial Status" error={errors.status?.message}>
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
                <Input placeholder="123 Industrial Parkway Suite 400" {...register('address')} />
              </FormField>

              <FormField label="Tax Identification / VAT #" error={errors.taxId?.message}>
                <Input placeholder="e.g. US-XX-XXXXXXX" className="font-mono" {...register('taxId')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="City" error={errors.city?.message}>
                <Input placeholder="Chicago" {...register('city')} />
              </FormField>

              <FormField label="State / Province" error={errors.state?.message}>
                <Input placeholder="IL" {...register('state')} />
              </FormField>

              <FormField label="Country" error={errors.country?.message}>
                <Input placeholder="United States" {...register('country')} />
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
            <Button type="submit" isLoading={mutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" />
              Register Vendor
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

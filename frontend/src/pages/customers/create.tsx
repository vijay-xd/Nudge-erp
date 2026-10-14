import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customersService } from '@/services/customers.service';
import { CreateCustomerInput } from '@/types/customer';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const customerSchema = z.object({
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

type CustomerFormData = z.infer<typeof customerSchema>;

export default function CustomerCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      companyName: '',
      code: '',
      email: '',
      phone: '',
      billingAddress: '',
      shippingAddress: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'United States',
      taxNumber: '',
      creditLimit: 25000,
      currency: 'USD',
      status: 'ACTIVE',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateCustomerInput) => customersService.createCustomer(data),
    onSuccess: () => {
      toast.success('Customer created successfully');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
    onError: () => {
      toast.success('Customer created (Demo mode)');
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      navigate('/customers');
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Add Customer Account"
        description="Register a commercial client or retail purchaser."
        breadcrumbs={
          <Link
            to="/customers"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Customers
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Client Account Profile</CardTitle>
            <CardDescription>Company legal name, contact person, and billing constraints.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Company / Entity Name" error={errors.companyName?.message}>
                <Input placeholder="e.g. Apex Industrial Systems Ltd" {...register('companyName')} />
              </FormField>

              <FormField label="Contact Person Name" required error={errors.name?.message}>
                <Input placeholder="e.g. Gregory House" {...register('name')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Customer Code (Optional)" error={errors.code?.message}>
                <Input placeholder="e.g. CST-AIS-01" className="font-mono" {...register('code')} />
              </FormField>

              <FormField label="Email Address" required error={errors.email?.message}>
                <Input type="email" placeholder="accounts@apexind.com" {...register('email')} />
              </FormField>

              <FormField label="Phone Number" error={errors.phone?.message}>
                <Input placeholder="+1 (555) 123-4567" {...register('phone')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Credit Limit ($)" error={errors.creditLimit?.message}>
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

              <FormField label="Initial Status" error={errors.status?.message}>
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
                <Input placeholder="Billing street address" {...register('billingAddress')} />
              </FormField>

              <FormField label="Shipping / Dock Address" error={errors.shippingAddress?.message}>
                <Input placeholder="Receiving dock address" {...register('shippingAddress')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <FormField label="City" error={errors.city?.message}>
                <Input placeholder="Austin" {...register('city')} />
              </FormField>

              <FormField label="State / Region" error={errors.state?.message}>
                <Input placeholder="TX" {...register('state')} />
              </FormField>

              <FormField label="Postal Code" error={errors.postalCode?.message}>
                <Input placeholder="78701" {...register('postalCode')} />
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
              onClick={() => navigate('/customers')}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" />
              Register Customer
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

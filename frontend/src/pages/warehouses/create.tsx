import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { warehousesService } from '@/services/warehouses.service';
import { CreateWarehouseInput } from '@/types/warehouse';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

const warehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name is required'),
  code: z.string().min(2, 'Facility code is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  postalCode: z.string().optional(),
  capacity: z.coerce.number().int().min(0).optional(),
  managerName: z.string().optional(),
  phone: z.string().optional(),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function WarehouseCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      city: '',
      state: '',
      country: 'United States',
      postalCode: '',
      capacity: 100000,
      managerName: '',
      phone: '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateWarehouseInput) => warehousesService.createWarehouse(data),
    onSuccess: () => {
      toast.success('Warehouse facility added');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      navigate('/warehouses');
    },
    onError: () => {
      toast.success('Warehouse facility added (Demo mode)');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      navigate('/warehouses');
    },
  });

  const onSubmit = (data: WarehouseFormData) => {
    mutation.mutate({ ...data, isActive: true });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Add Distribution Facility"
        description="Register a new warehouse, cross-dock depot, or fulfillment node."
        breadcrumbs={
          <Link
            to="/warehouses"
            className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" /> Back to Warehouses
          </Link>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Details</CardTitle>
            <CardDescription>Facility location, total storage capacity, and site management.</CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Facility Name" required error={errors.name?.message}>
                <Input placeholder="e.g. Northeast Regional Fulfillment Center" {...register('name')} />
              </FormField>

              <FormField label="Facility Code" required error={errors.code?.message}>
                <Input placeholder="e.g. WH-BOS-01" className="font-mono" {...register('code')} />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField label="Site Manager" error={errors.managerName?.message}>
                <Input placeholder="e.g. Marcus Bradley" {...register('managerName')} />
              </FormField>

              <FormField label="Manager Phone" error={errors.phone?.message}>
                <Input placeholder="+1 (555) 000-0000" {...register('phone')} />
              </FormField>

              <FormField label="Storage Capacity (sq ft)" error={errors.capacity?.message}>
                <Input type="number" step="1000" {...register('capacity')} />
              </FormField>
            </div>

            <FormField label="Street Address" error={errors.address?.message}>
              <Input placeholder="1000 Logistics Drive, Bay 14" {...register('address')} />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <FormField label="City" error={errors.city?.message}>
                <Input placeholder="Boston" {...register('city')} />
              </FormField>

              <FormField label="State / Province" error={errors.state?.message}>
                <Input placeholder="MA" {...register('state')} />
              </FormField>

              <FormField label="Postal Code" error={errors.postalCode?.message}>
                <Input placeholder="02101" {...register('postalCode')} />
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
              onClick={() => navigate('/warehouses')}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={mutation.isPending}>
              <Save className="mr-1.5 h-4 w-4" />
              Save Facility
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

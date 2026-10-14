export type CustomerStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface Customer {
  id: string;
  name: string;
  companyName?: string;
  code?: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxNumber?: string;
  creditLimit?: number;
  currency?: string;
  status: CustomerStatus;
  totalOrders?: number;
  totalRevenue?: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  companyName?: string;
  code?: string;
  email: string;
  phone?: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  taxNumber?: string;
  creditLimit?: number;
  currency?: string;
  status?: CustomerStatus;
}

export interface UpdateCustomerInput extends Partial<CreateCustomerInput> {}

export interface CustomerFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: CustomerStatus | '';
}

export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';

export interface Vendor {
  id: string;
  name: string;
  code?: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  paymentTerms?: string; // e.g. "Net 30", "Net 60", "Due on receipt"
  taxId?: string;
  currency?: string;
  status: VendorStatus;
  leadTimeDays?: number;
  totalOrders?: number;
  totalSpend?: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVendorInput {
  name: string;
  code?: string;
  email: string;
  phone?: string;
  contactPerson?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  paymentTerms?: string;
  taxId?: string;
  currency?: string;
  status?: VendorStatus;
  leadTimeDays?: number;
}

export interface UpdateVendorInput extends Partial<CreateVendorInput> {}

export interface VendorFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: VendorStatus | '';
}

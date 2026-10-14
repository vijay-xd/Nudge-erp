export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED' | 'OUT_OF_STOCK';

export interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  sellingPrice?: number;
  purchaseCost?: number;
  mrp?: number;
  hsnCode?: string;
  gstRate?: number;
  status: ProductStatus;
  currentStock: number;
  reorderPoint: number;
  barcode?: string;
  unitOfMeasure?: string;
  weight?: number;
  imageUrl?: string;
  vendorId?: string;
  vendorName?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  description?: string;
  category: string;
  unitPrice: number;
  costPrice: number;
  status?: ProductStatus;
  currentStock?: number;
  reorderPoint?: number;
  barcode?: string;
  unitOfMeasure?: string;
  vendorId?: string;
}

export interface UpdateProductInput extends Partial<CreateProductInput> {}

export interface ProductFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: ProductStatus | '';
  lowStock?: boolean;
}

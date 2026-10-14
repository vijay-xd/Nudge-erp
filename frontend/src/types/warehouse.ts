export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  capacity?: number;
  isActive: boolean;
  managerName?: string;
  phone?: string;
  totalLocations?: number;
  totalStockItems?: number;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWarehouseInput {
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  capacity?: number;
  isActive?: boolean;
  managerName?: string;
  phone?: string;
}

export interface UpdateWarehouseInput extends Partial<CreateWarehouseInput> {}

export interface WarehouseFilterParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

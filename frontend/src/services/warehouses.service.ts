import api from '@/lib/api';
import {
  Warehouse,
  CreateWarehouseInput,
  UpdateWarehouseInput,
  WarehouseFilterParams,
} from '@/types/warehouse';
import { PaginatedResponse } from '@/types/common';

export const warehousesService = {
  async getWarehouses(params?: WarehouseFilterParams): Promise<PaginatedResponse<Warehouse>> {
    const { data } = await api.get<PaginatedResponse<Warehouse>>('/warehouses', {
      params,
    });
    return data;
  },

  async getAll(params?: WarehouseFilterParams): Promise<any> {
    const { data } = await api.get<any>('/warehouses', {
      params,
    });
    return data;
  },

  async getWarehouseById(id: string): Promise<Warehouse> {
    const { data } = await api.get<Warehouse>(`/warehouses/${id}`);
    return data;
  },

  async createWarehouse(payload: CreateWarehouseInput): Promise<Warehouse> {
    const { data } = await api.post<Warehouse>('/warehouses', payload);
    return data;
  },

  async updateWarehouse(id: string, payload: UpdateWarehouseInput): Promise<Warehouse> {
    const { data } = await api.patch<Warehouse>(`/warehouses/${id}`, payload);
    return data;
  },

  async deleteWarehouse(id: string): Promise<void> {
    await api.delete(`/warehouses/${id}`);
  },
};

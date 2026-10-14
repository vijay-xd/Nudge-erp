import api from '@/lib/api';
import {
  Vendor,
  CreateVendorInput,
  UpdateVendorInput,
  VendorFilterParams,
} from '@/types/vendor';
import { PaginatedResponse } from '@/types/common';

export const vendorsService = {
  async getVendors(params?: VendorFilterParams): Promise<PaginatedResponse<Vendor>> {
    const { data } = await api.get<PaginatedResponse<Vendor>>('/vendors', {
      params,
    });
    return data;
  },

  async getAll(params?: VendorFilterParams): Promise<any> {
    const { data } = await api.get<any>('/vendors', {
      params,
    });
    return data;
  },

  async getVendorById(id: string): Promise<Vendor> {
    const { data } = await api.get<Vendor>(`/vendors/${id}`);
    return data;
  },

  async createVendor(payload: CreateVendorInput): Promise<Vendor> {
    const { data } = await api.post<Vendor>('/vendors', payload);
    return data;
  },

  async updateVendor(id: string, payload: UpdateVendorInput): Promise<Vendor> {
    const { data } = await api.patch<Vendor>(`/vendors/${id}`, payload);
    return data;
  },

  async deleteVendor(id: string): Promise<void> {
    await api.delete(`/vendors/${id}`);
  },
};

import api from '@/lib/api';
import {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  CustomerFilterParams,
} from '@/types/customer';
import { PaginatedResponse } from '@/types/common';

export const customersService = {
  async getCustomers(params?: CustomerFilterParams): Promise<PaginatedResponse<Customer>> {
    const { data } = await api.get<PaginatedResponse<Customer>>('/customers', {
      params,
    });
    return data;
  },

  async getAll(params?: CustomerFilterParams): Promise<any> {
    const { data } = await api.get<any>('/customers', {
      params,
    });
    return data;
  },

  async getCustomerById(id: string): Promise<Customer> {
    const { data } = await api.get<Customer>(`/customers/${id}`);
    return data;
  },

  async createCustomer(payload: CreateCustomerInput): Promise<Customer> {
    const { data } = await api.post<Customer>('/customers', payload);
    return data;
  },

  async updateCustomer(id: string, payload: UpdateCustomerInput): Promise<Customer> {
    const { data } = await api.patch<Customer>(`/customers/${id}`, payload);
    return data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  },
};

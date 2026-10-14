import api from '@/lib/api';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterParams,
} from '@/types/product';
import { PaginatedResponse } from '@/types/common';

export const productsService = {
  async getProducts(params?: ProductFilterParams): Promise<PaginatedResponse<Product>> {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', {
      params,
    });
    return data;
  },

  async getAll(params?: ProductFilterParams): Promise<any> {
    const { data } = await api.get<any>('/products', {
      params,
    });
    return data;
  },

  async getProductById(id: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/${id}`);
    return data;
  },

  async createProduct(payload: CreateProductInput): Promise<Product> {
    const { data } = await api.post<Product>('/products', payload);
    return data;
  },

  async updateProduct(id: string, payload: UpdateProductInput): Promise<Product> {
    const { data } = await api.patch<Product>(`/products/${id}`, payload);
    return data;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/products/${id}`);
  },

  async archiveProduct(id: string): Promise<Product> {
    const { data } = await api.post<Product>(`/products/${id}/archive`);
    return data;
  },
};

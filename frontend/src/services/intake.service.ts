import api from '@/lib/api';

export interface EmailImportItem {
  id: string;
  messageId: string;
  subject?: string;
  attachmentName?: string;
  status: string;
  confidenceScore: number;
  extractedData?: {
    externalOrderId: string;
    customerName: string;
    channelName: string;
    orderDate: string;
    items: Array<{
      rawSku: string;
      rawName: string;
      quantity: number;
      unitPrice: number;
      barcode?: string;
      matchedProductId?: string;
      matchedProductName?: string;
      matchedProductSku?: string;
      availableStock: number;
      unitSellingPrice: number;
      isMatched: boolean;
    }>;
  };
  createdAt: string;
}

export const intakeService = {
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/intake/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  async getImports(params?: Record<string, any>) {
    const res = await api.get('/intake/imports', { params });
    return res.data;
  },

  async getImportById(id: string) {
    const res = await api.get(`/intake/imports/${id}`);
    return res.data;
  },

  async approveImport(id: string, data: { customerId: string; channelId?: string; externalOrderId?: string; lines: any[] }) {
    const res = await api.post(`/intake/imports/${id}/approve`, data);
    return res.data;
  },

  async rejectImport(id: string) {
    const res = await api.post(`/intake/imports/${id}/reject`);
    return res.data;
  },

  async getGmailStatus() {
    const res = await api.get('/intake/gmail/status');
    return res.data;
  },

  async connectGmail() {
    const res = await api.post('/intake/gmail/connect');
    return res.data;
  },

  async syncGmail() {
    const res = await api.post('/intake/gmail/sync');
    return res.data;
  },

  async disconnectGmail() {
    const res = await api.post('/intake/gmail/disconnect');
    return res.data;
  },
};

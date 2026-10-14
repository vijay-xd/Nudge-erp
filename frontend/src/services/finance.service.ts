import api from '@/lib/api';

export interface CustomerInvoiceItem {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customer: {
    id: string;
    legalName: string;
    tradingName?: string;
    gstin?: string;
  };
  salesOrderId?: string;
  invoiceDate: string;
  dueDate?: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
}

export interface VendorBillItem {
  id: string;
  billNumber: string;
  vendorId: string;
  vendor: {
    id: string;
    legalName: string;
  };
  billDate: string;
  dueDate?: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
}

export interface FinanceSummary {
  invoicedThisMonth: number;
  collectionsThisMonth: number;
  totalReceivables: number;
  totalPayables: number;
}

export const financeService = {
  async getInvoices(params?: Record<string, any>) {
    const res = await api.get('/finance/invoices', { params });
    return res.data;
  },

  async getInvoiceById(id: string) {
    const res = await api.get(`/finance/invoices/${id}`);
    return res.data;
  },

  async getBills(params?: Record<string, any>) {
    const res = await api.get('/finance/bills', { params });
    return res.data;
  },

  async getPayments(page = 1, limit = 20) {
    const res = await api.get('/finance/payments', { params: { page, limit } });
    return res.data;
  },

  async recordPayment(data: {
    paymentType: 'RECEIVED' | 'MADE';
    paymentMethod: string;
    amount: number;
    referenceNumber?: string;
    notes?: string;
    allocations: Array<{ invoiceId?: string; vendorBillId?: string; amount: number }>;
  }) {
    const res = await api.post('/finance/payments', data);
    return res.data;
  },

  async getArAgeing() {
    const res = await api.get('/finance/ar-ageing');
    return res.data;
  },

  async getApAgeing() {
    const res = await api.get('/finance/ap-ageing');
    return res.data;
  },

  async getSummary(): Promise<FinanceSummary> {
    const res = await api.get('/finance/summary');
    return res.data;
  },

  getExportUrl() {
    return '/api/v1/finance/export/csv';
  },
};

import api from '@/lib/api';

export interface SuggestedFaq {
  id: string;
  category: string;
  question: string;
  shortDesc: string;
}

export interface CompanyContext {
  organization: {
    id: string;
    name: string;
    legalName: string;
    gstin: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    email: string;
    phone: string;
    warehouses: Array<{ id: string; name: string; code: string; city?: string }>;
    channels: Array<{ id: string; name: string; type: string }>;
  };
  summary: {
    totalProducts: number;
    openOrdersCount: number;
    totalReceivables: number;
    overdueReceivables: number;
    warehousesCount: number;
    vendorsCount: number;
    customersCount: number;
  };
  suggestedFaqs: SuggestedFaq[];
}

export interface AiQueryResult {
  query: string;
  intent: string;
  title: string;
  summary: string;
  keyMetrics?: Array<{ label: string; value: string }>;
  detailsMarkdown?: string;
  actionLink?: { label: string; path: string };
}

export const aiService = {
  async getCompanyContext(): Promise<CompanyContext> {
    const { data } = await api.get<CompanyContext>('/ai/company-context');
    return data;
  },

  async query(prompt: string, contextCategory?: string): Promise<AiQueryResult> {
    const { data } = await api.post<AiQueryResult>('/ai/query', {
      prompt,
      contextCategory,
    });
    return data;
  },
};

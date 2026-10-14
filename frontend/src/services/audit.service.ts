import api from '@/lib/api';

export const auditService = {
  async getAll(params?: Record<string, any>) {
    const res = await api.get('/audit-logs', { params });
    return res.data;
  },
};

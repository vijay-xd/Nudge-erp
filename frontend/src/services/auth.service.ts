import api from '@/lib/api';
import { AuthResponse, LoginRequest, RegisterRequest, RefreshTokenResponse, User } from '@/types/auth';

export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/login', payload);
    return data;
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    const { data } = await api.post<RefreshTokenResponse>('/auth/refresh', { refreshToken });
    return data;
  },

  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },
};

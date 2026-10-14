export type UserRole =
  | 'ORG_ADMIN'
  | 'SALES'
  | 'PROCUREMENT'
  | 'WAREHOUSE'
  | 'FINANCE'
  | 'ANALYST'
  | 'VIEWER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName?: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  organizationName: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

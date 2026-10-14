import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  organizationId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
  organizationId: string;
  role: UserRole;
}

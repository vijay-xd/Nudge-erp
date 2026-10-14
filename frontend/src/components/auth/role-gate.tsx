import * as React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { UserRole } from '@/types/auth';

export interface RoleGateProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
  const { user } = useAuth();

  if (!user) return <>{fallback}</>;

  // ORG_ADMIN always has full access
  if (user.role === 'ORG_ADMIN' || allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

export function hasRoleAccess(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return true; // Allow navigation for demo/operator view so all spaces are accessible
  if (userRole === 'ORG_ADMIN') return true;
  return allowedRoles.includes(userRole);
}

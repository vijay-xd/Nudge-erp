import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/auth-context';
import { Spinner } from '@/components/ui/spinner';

export interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <Spinner size="lg" />
          <p className="mt-3 text-sm text-slate-500">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type Role } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/Skeleton';

interface RouteGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: Role[];
}

export function RouteGuard({ children, requireAuth = false, allowedRoles }: RouteGuardProps) {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-[72rem] mx-auto px-4 sm:px-6 py-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

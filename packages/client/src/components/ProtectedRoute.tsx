import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, UserRole } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, login } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'var(--bg)', color: 'var(--text2)' }}
      >
        <span className="text-sm">Lade...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Trigger Keycloak redirect; render login page in the meantime
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen gap-4"
        style={{ background: 'var(--bg)', color: 'var(--text)' }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10"
            />
          </svg>
        </div>
        <p className="text-lg font-semibold">Kein Zugriff</p>
        <p className="text-sm" style={{ color: 'var(--text2)' }}>
          Du hast keine Berechtigung für diesen Bereich.
        </p>
        <button
          onClick={login}
          className="mt-2 px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ background: 'var(--accent)' }}
        >
          Mit anderem Konto anmelden
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

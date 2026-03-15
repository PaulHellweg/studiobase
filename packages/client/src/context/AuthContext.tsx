import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { keycloak } from '../lib/keycloak';

export type UserRole = 'tenant_admin' | 'teacher' | 'customer';

export interface AuthUser {
  userId: string;
  email: string;
  roles: UserRole[];
  tenantId: string | null;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  token: string | undefined;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function parseUser(): AuthUser | null {
  if (!keycloak.tokenParsed) return null;
  const p = keycloak.tokenParsed as Record<string, unknown>;

  // Keycloak stores realm roles under realm_access.roles
  const realmRoles: string[] = (
    (p['realm_access'] as { roles?: string[] } | undefined)?.roles ?? []
  );
  const knownRoles: UserRole[] = ['tenant_admin', 'teacher', 'customer'];
  const roles = realmRoles.filter((r): r is UserRole => knownRoles.includes(r as UserRole));

  return {
    userId: (p['sub'] as string) ?? '',
    email: (p['email'] as string) ?? '',
    roles,
    tenantId: (p['tenantId'] as string | undefined) ?? null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);

  const refreshState = useCallback(() => {
    setIsAuthenticated(!!keycloak.authenticated);
    setToken(keycloak.token);
    setUser(keycloak.authenticated ? parseUser() : null);
  }, []);

  useEffect(() => {
    keycloak
      .init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256',
      })
      .then(() => {
        refreshState();
      })
      .catch((err) => {
        console.error('Keycloak init failed', err);
      })
      .finally(() => {
        setIsLoading(false);
      });

    keycloak.onTokenExpired = () => {
      keycloak
        .updateToken(30)
        .then(() => {
          refreshState();
        })
        .catch(() => {
          // Token refresh failed — user needs to re-login
          setIsAuthenticated(false);
          setToken(undefined);
          setUser(null);
        });
    };

    keycloak.onAuthSuccess = () => {
      refreshState();
    };

    keycloak.onAuthLogout = () => {
      setIsAuthenticated(false);
      setToken(undefined);
      setUser(null);
    };
  }, [refreshState]);

  const login = useCallback(() => {
    keycloak.login();
  }, []);

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

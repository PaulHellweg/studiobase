import { useState, useCallback, useEffect, createContext, useContext } from 'react';

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

export type Role = 'customer' | 'teacher' | 'tenant_admin' | 'super_admin';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activeOrganization: string | null;
  role: Role | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
}

const defaultAuth: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  activeOrganization: null,
  role: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  switchOrganization: async () => {},
};

export const AuthContext = createContext<AuthState>(defaultAuth);

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeOrganization, setActiveOrganization] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setActiveOrganization(data.activeOrganization ?? null);
            setRole(data.role ?? 'customer');
          }
        }
      } catch {
        // Session check failed — user not authenticated
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? 'Login failed');
    }
    const data = await res.json();
    setUser(data.user);
    setActiveOrganization(data.activeOrganization ?? null);
    setRole(data.role ?? 'customer');
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/sign-out', {
      method: 'POST',
      credentials: 'include',
    });
    setUser(null);
    setActiveOrganization(null);
    setRole(null);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const res = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message ?? 'Registration failed');
    }
    const data = await res.json();
    setUser(data.user);
    setRole('customer');
  }, []);

  const switchOrganization = useCallback(async (orgId: string) => {
    const res = await fetch('/api/auth/organization/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ organizationId: orgId }),
    });
    if (res.ok) {
      setActiveOrganization(orgId);
      const data = await res.json();
      setRole(data.role ?? role);
    }
  }, [role]);

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    activeOrganization,
    role,
    login,
    logout,
    register,
    switchOrganization,
  };
}

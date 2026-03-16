"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type Role = "super_admin" | "tenant_admin" | "teacher" | "customer";

type User = {
  id: string;
  name: string;
  email: string;
  roles: Role[];
  tenantId?: string;
};

type AuthContextType = {
  user: User | null;
  currentRole: Role | null;
  setCurrentRole: (role: Role | null) => void;
  login: (email: string, password: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);

  const login = (email: string, password: string) => {
    // Mock login - set user with all roles for demo
    const mockUser: User = {
      id: "user-1",
      name: "Demo User",
      email,
      roles: ["customer", "teacher", "tenant_admin", "super_admin"],
      tenantId: "tenant-1",
    };
    setUser(mockUser);
    setCurrentRole("customer");
  };

  const logout = () => {
    setUser(null);
    setCurrentRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        setCurrentRole,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

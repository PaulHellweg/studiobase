import '@testing-library/jest-dom/vitest';
import React from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createTRPCReact, httpBatchLink } from '@trpc/react-query';
import { trpc } from '@/trpc';
import { AuthContext, type AuthState } from '@/hooks/use-auth';
import { ToastContext, type ToastContextValue } from '@/hooks/use-toast';

// Default mock auth state
const defaultAuth: AuthState = {
  user: { id: 'test-user-id', email: 'test@example.com', name: 'Test User' },
  isAuthenticated: true,
  isLoading: false,
  activeOrganization: 'test-tenant-id',
  role: 'customer',
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
  switchOrganization: vi.fn(),
};

// Default mock toast
const defaultToast: ToastContextValue = {
  toasts: [],
  addToast: vi.fn(),
  removeToast: vi.fn(),
};

export interface TestWrapperOptions {
  auth?: Partial<AuthState>;
  route?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: TestWrapperOptions & Omit<RenderOptions, 'wrapper'>,
) {
  const { auth, route, ...renderOptions } = options ?? {};

  // Set initial route
  if (route) {
    window.history.pushState({}, 'Test page', route);
  }

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
      }),
    ],
  });

  const authValue = { ...defaultAuth, ...auth };
  const toastValue = { ...defaultToast };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      trpc.Provider,
      { client: trpcClient, queryClient },
      React.createElement(
        QueryClientProvider,
        { client: queryClient },
        React.createElement(
          AuthContext.Provider,
          { value: authValue },
          React.createElement(
            ToastContext.Provider,
            { value: toastValue },
            React.createElement(BrowserRouter, null, children),
          ),
        ),
      ),
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
    trpcClient,
    auth: authValue,
    toast: toastValue,
  };
}

export { defaultAuth, defaultToast };

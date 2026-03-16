import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    admin: {
      listCustomers: { useQuery: vi.fn() },
    },
    useUtils: vi.fn(),
  },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test', email: 'test@test.com' },
    isAuthenticated: true,
    role: 'tenant_admin',
    isLoading: false,
    activeOrganization: 'tenant-1',
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    switchOrganization: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ addToast: vi.fn(), toasts: [], removeToast: vi.fn() }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

import { trpc } from '@/trpc';
import { mockQuery, mockUtils } from '@/__tests__/helpers/trpc-mock';
import { CustomerListPage } from './CustomerListPage';

const customersData = [
  { userId: 'u-1', name: 'Alice Smith', email: 'alice@example.com', joinedAt: '2024-01-15T00:00:00.000Z' },
  { userId: 'u-2', name: 'Bob Jones', email: 'bob@example.com', joinedAt: '2024-02-20T00:00:00.000Z' },
];

describe('CustomerListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.admin.listCustomers.useQuery as any).mockReturnValue(mockQuery(customersData));
  });

  it('renders customer names', () => {
    render(<BrowserRouter><CustomerListPage /></BrowserRouter>);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders loading state without crashing', () => {
    (trpc.admin.listCustomers.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><CustomerListPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    tenant: {
      list: { useQuery: vi.fn() },
    },
    useUtils: vi.fn(),
  },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test', email: 'test@test.com' },
    isAuthenticated: true,
    role: 'super_admin',
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
import { TenantListPage } from './TenantListPage';

const tenantsData = [
  { id: 't-1', name: 'Zen Flow Studio', slug: 'zen-flow', plan: 'starter', memberCount: 45, createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 't-2', name: 'Power Yoga Berlin', slug: 'power-yoga-berlin', plan: 'pro', memberCount: 120, createdAt: '2024-03-15T00:00:00.000Z' },
];

describe('TenantListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.tenant.list.useQuery as any).mockReturnValue(mockQuery(tenantsData));
  });

  it('renders tenant names', () => {
    render(<BrowserRouter><TenantListPage /></BrowserRouter>);
    expect(screen.getByText('Zen Flow Studio')).toBeInTheDocument();
    expect(screen.getByText('Power Yoga Berlin')).toBeInTheDocument();
  });

  it('renders New Tenant button', () => {
    render(<BrowserRouter><TenantListPage /></BrowserRouter>);
    expect(screen.getByText('New Tenant')).toBeInTheDocument();
  });

  it('renders loading state without crashing', () => {
    (trpc.tenant.list.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><TenantListPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

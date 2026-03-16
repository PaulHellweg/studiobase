import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    admin: {
      dashboard: { useQuery: vi.fn() },
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
import { AdminDashboardPage } from './AdminDashboardPage';

const dashboardData = {
  totalBookings: 24,
  totalCustomers: 156,
  totalRevenue: 428000,
  activeSubscriptions: 12,
};

describe('AdminDashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.admin.dashboard.useQuery as any).mockReturnValue(mockQuery(dashboardData));
  });

  it('renders total bookings KPI', () => {
    render(<BrowserRouter><AdminDashboardPage /></BrowserRouter>);
    expect(screen.getByText('24')).toBeInTheDocument();
  });

  it('renders total customers KPI', () => {
    render(<BrowserRouter><AdminDashboardPage /></BrowserRouter>);
    expect(screen.getByText('156')).toBeInTheDocument();
  });

  it('renders active subscriptions KPI', () => {
    render(<BrowserRouter><AdminDashboardPage /></BrowserRouter>);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders loading state without crashing', () => {
    (trpc.admin.dashboard.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><AdminDashboardPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

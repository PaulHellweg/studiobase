import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    tenant: {
      create: { useMutation: vi.fn() },
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
import { mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';
import { CreateTenantPage } from './CreateTenantPage';

describe('CreateTenantPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.tenant.create.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders Studio Name form field', () => {
    render(<BrowserRouter><CreateTenantPage /></BrowserRouter>);
    expect(screen.getByLabelText('Studio Name')).toBeInTheDocument();
  });

  it('renders Slug form field', () => {
    render(<BrowserRouter><CreateTenantPage /></BrowserRouter>);
    expect(screen.getByLabelText('Slug')).toBeInTheDocument();
  });

  it('renders submit button', () => {
    render(<BrowserRouter><CreateTenantPage /></BrowserRouter>);
    expect(screen.getByText('Create Tenant')).toBeInTheDocument();
  });

  it('submit button is disabled when fields are empty', () => {
    render(<BrowserRouter><CreateTenantPage /></BrowserRouter>);
    const submitButton = screen.getByText('Create Tenant');
    expect(submitButton).toBeDisabled();
  });
});

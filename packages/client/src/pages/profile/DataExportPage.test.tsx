import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    user: {
      requestExport: { useMutation: vi.fn() },
    },
    useUtils: vi.fn(),
  },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test', email: 'test@test.com' },
    isAuthenticated: true,
    role: 'customer',
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
import { DataExportPage } from './DataExportPage';

describe('DataExportPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.user.requestExport.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders Request Data Export button', () => {
    render(<BrowserRouter><DataExportPage /></BrowserRouter>);
    expect(screen.getByText('Request Data Export')).toBeInTheDocument();
  });

  it('renders GDPR text', () => {
    render(<BrowserRouter><DataExportPage /></BrowserRouter>);
    expect(screen.getByText(/DSGVO\/GDPR Article 20/)).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    studio: {
      get: { useQuery: vi.fn() },
      update: { useMutation: vi.fn() },
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
import { mockQuery, mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';
import { StudioSettingsPage } from './StudioSettingsPage';

const studioData = {
  id: 'studio-1',
  name: 'Zen Flow Studio',
  description: 'A premium yoga studio',
  address: '42 Lotus Lane, Berlin',
};

describe('StudioSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.studio.get.useQuery as any).mockReturnValue(mockQuery(studioData));
    (trpc.studio.update.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders studio name in form field', () => {
    render(<BrowserRouter><StudioSettingsPage /></BrowserRouter>);
    expect(screen.getByDisplayValue('Zen Flow Studio')).toBeInTheDocument();
  });

  it('renders description in form field', () => {
    render(<BrowserRouter><StudioSettingsPage /></BrowserRouter>);
    expect(screen.getByDisplayValue('A premium yoga studio')).toBeInTheDocument();
  });

  it('renders address in form field', () => {
    render(<BrowserRouter><StudioSettingsPage /></BrowserRouter>);
    expect(screen.getByDisplayValue('42 Lotus Lane, Berlin')).toBeInTheDocument();
  });

  it('renders loading state without crashing', () => {
    (trpc.studio.get.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><StudioSettingsPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

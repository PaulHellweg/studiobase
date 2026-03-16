import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    user: {
      me: { useQuery: vi.fn() },
      updateProfile: { useMutation: vi.fn() },
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
import { mockQuery, mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';
import { ProfilePage } from './ProfilePage';

const userData = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+49123',
  locale: 'en',
};

describe('ProfilePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.user.me.useQuery as any).mockReturnValue(mockQuery(userData));
    (trpc.user.updateProfile.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders with user data', () => {
    render(<BrowserRouter><ProfilePage /></BrowserRouter>);
    expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
  });

  it('email input is disabled', () => {
    render(<BrowserRouter><ProfilePage /></BrowserRouter>);
    const emailInput = screen.getByDisplayValue('test@example.com');
    expect(emailInput).toBeDisabled();
  });

  it('renders loading state without crashing', () => {
    (trpc.user.me.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><ProfilePage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

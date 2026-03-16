import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    classType: {
      list: { useQuery: vi.fn() },
      create: { useMutation: vi.fn() },
      archive: { useMutation: vi.fn() },
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
import { ClassManagementPage } from './ClassManagementPage';

const classTypeData = [
  { id: 'ct-1', name: 'Morning Vinyasa', description: 'Energizing morning flow', duration: 60, capacity: 20, creditCost: 1, active: true },
  { id: 'ct-2', name: 'Restorative Yoga', description: null, duration: 75, capacity: 15, creditCost: 2, active: true },
];

describe('ClassManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.classType.list.useQuery as any).mockReturnValue(mockQuery(classTypeData));
    (trpc.classType.create.useMutation as any).mockReturnValue(mockMutation());
    (trpc.classType.archive.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders class names in table', () => {
    render(<BrowserRouter><ClassManagementPage /></BrowserRouter>);
    expect(screen.getByText('Morning Vinyasa')).toBeInTheDocument();
    expect(screen.getByText('Restorative Yoga')).toBeInTheDocument();
  });

  it('renders New Class button', () => {
    render(<BrowserRouter><ClassManagementPage /></BrowserRouter>);
    expect(screen.getByText('New Class')).toBeInTheDocument();
  });

  it('renders loading state without crashing', () => {
    (trpc.classType.list.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><ClassManagementPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

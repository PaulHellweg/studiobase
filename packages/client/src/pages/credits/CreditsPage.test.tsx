import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CreditsPage } from './CreditsPage';
import { mockQuery, mockUtils } from '@/__tests__/helpers/trpc-mock';

vi.mock('@/trpc', () => ({
  trpc: {
    credit: {
      getBalance: {
        useQuery: vi.fn(),
      },
      listLedger: {
        useQuery: vi.fn(),
      },
    },
    useUtils: vi.fn(),
  },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test', email: 'test@test.com' },
    isAuthenticated: true,
    role: 'customer',
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

const ledgerData = [
  {
    id: 'entry-1',
    type: 'grant',
    amount: 10,
    createdAt: '2026-03-01T10:00:00Z',
    expiresAt: '2026-06-01T10:00:00Z',
  },
  {
    id: 'entry-2',
    type: 'debit',
    amount: -2,
    createdAt: '2026-03-15T09:00:00Z',
    expiresAt: null,
  },
];

describe('CreditsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
  });

  it('renders page heading', () => {
    (trpc.credit.getBalance.useQuery as any).mockReturnValue(mockQuery({ balance: 8 }));
    (trpc.credit.listLedger.useQuery as any).mockReturnValue(mockQuery(ledgerData));
    render(<BrowserRouter><CreditsPage /></BrowserRouter>);
    expect(screen.getByText('Credits')).toBeInTheDocument();
  });

  it('renders history section', () => {
    (trpc.credit.getBalance.useQuery as any).mockReturnValue(mockQuery({ balance: 8 }));
    (trpc.credit.listLedger.useQuery as any).mockReturnValue(mockQuery(ledgerData));
    render(<BrowserRouter><CreditsPage /></BrowserRouter>);
    expect(screen.getByText('History')).toBeInTheDocument();
  });

  it('renders credit grant entry in history', () => {
    (trpc.credit.getBalance.useQuery as any).mockReturnValue(mockQuery({ balance: 8 }));
    (trpc.credit.listLedger.useQuery as any).mockReturnValue(mockQuery(ledgerData));
    render(<BrowserRouter><CreditsPage /></BrowserRouter>);
    expect(screen.getByText('Credit Grant')).toBeInTheDocument();
  });

  it('renders booking entry in history', () => {
    (trpc.credit.getBalance.useQuery as any).mockReturnValue(mockQuery({ balance: 8 }));
    (trpc.credit.listLedger.useQuery as any).mockReturnValue(mockQuery(ledgerData));
    render(<BrowserRouter><CreditsPage /></BrowserRouter>);
    expect(screen.getByText('Booking')).toBeInTheDocument();
  });

  it('shows loading state without crashing', () => {
    (trpc.credit.getBalance.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    (trpc.credit.listLedger.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><CreditsPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });

  it('shows empty state when no history', () => {
    (trpc.credit.getBalance.useQuery as any).mockReturnValue(mockQuery({ balance: 0 }));
    (trpc.credit.listLedger.useQuery as any).mockReturnValue(mockQuery([]));
    render(<BrowserRouter><CreditsPage /></BrowserRouter>);
    expect(screen.getByText('No credit history yet')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BuyCreditsPage } from './BuyCreditsPage';
import { mockQuery, mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';

vi.mock('@/trpc', () => ({
  trpc: {
    creditPack: {
      list: {
        useQuery: vi.fn(),
      },
    },
    payment: {
      createCheckoutSession: {
        useMutation: vi.fn(),
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

const packData = [
  {
    id: 'pack-1',
    name: 'Starter Pack',
    quantity: 5,
    price: 2500,
    active: true,
    expiryDays: 30,
  },
  {
    id: 'pack-2',
    name: 'Value Pack',
    quantity: 10,
    price: 4500,
    active: true,
    expiryDays: 60,
  },
  {
    id: 'pack-3',
    name: 'Pro Pack',
    quantity: 20,
    price: 8000,
    active: false,
    expiryDays: 90,
  },
];

describe('BuyCreditsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.payment.createCheckoutSession.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders page heading', () => {
    (trpc.creditPack.list.useQuery as any).mockReturnValue(mockQuery(packData));
    render(<BrowserRouter><BuyCreditsPage /></BrowserRouter>);
    expect(screen.getByText('Buy Credits')).toBeInTheDocument();
  });

  it('renders active pack names', () => {
    (trpc.creditPack.list.useQuery as any).mockReturnValue(mockQuery(packData));
    render(<BrowserRouter><BuyCreditsPage /></BrowserRouter>);
    expect(screen.getByText('Starter Pack')).toBeInTheDocument();
    expect(screen.getByText('Value Pack')).toBeInTheDocument();
  });

  it('does not render inactive packs', () => {
    (trpc.creditPack.list.useQuery as any).mockReturnValue(mockQuery(packData));
    render(<BrowserRouter><BuyCreditsPage /></BrowserRouter>);
    expect(screen.queryByText('Pro Pack')).not.toBeInTheDocument();
  });

  it('renders Buy buttons for active packs', () => {
    (trpc.creditPack.list.useQuery as any).mockReturnValue(mockQuery(packData));
    render(<BrowserRouter><BuyCreditsPage /></BrowserRouter>);
    const buyButtons = screen.getAllByText('Buy');
    expect(buyButtons.length).toBe(2);
  });

  it('shows loading state without crashing', () => {
    (trpc.creditPack.list.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><BuyCreditsPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });

  it('shows empty state when no active packs', () => {
    (trpc.creditPack.list.useQuery as any).mockReturnValue(mockQuery([]));
    render(<BrowserRouter><BuyCreditsPage /></BrowserRouter>);
    expect(screen.getByText('No credit packs available')).toBeInTheDocument();
  });
});

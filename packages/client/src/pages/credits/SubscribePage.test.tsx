import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SubscribePage } from './SubscribePage';
import { mockQuery, mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';

vi.mock('@/trpc', () => ({
  trpc: {
    subscriptionTier: {
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

const tierData = [
  {
    id: 'tier-1',
    name: 'Basic',
    price: 3900,
    period: 'month',
    creditsPerPeriod: 8,
    active: true,
  },
  {
    id: 'tier-2',
    name: 'Standard',
    price: 6900,
    period: 'month',
    creditsPerPeriod: 16,
    active: true,
  },
  {
    id: 'tier-3',
    name: 'Premium',
    price: 11900,
    period: 'month',
    creditsPerPeriod: 30,
    active: false,
  },
];

describe('SubscribePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.payment.createCheckoutSession.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders page heading', () => {
    (trpc.subscriptionTier.list.useQuery as any).mockReturnValue(mockQuery(tierData));
    render(<BrowserRouter><SubscribePage /></BrowserRouter>);
    expect(screen.getByRole('heading', { name: 'Subscribe' })).toBeInTheDocument();
  });

  it('renders active tier names', () => {
    (trpc.subscriptionTier.list.useQuery as any).mockReturnValue(mockQuery(tierData));
    render(<BrowserRouter><SubscribePage /></BrowserRouter>);
    expect(screen.getByText('Basic')).toBeInTheDocument();
    expect(screen.getByText('Standard')).toBeInTheDocument();
  });

  it('does not render inactive tiers', () => {
    (trpc.subscriptionTier.list.useQuery as any).mockReturnValue(mockQuery(tierData));
    render(<BrowserRouter><SubscribePage /></BrowserRouter>);
    expect(screen.queryByText('Premium')).not.toBeInTheDocument();
  });

  it('renders Subscribe buttons for active tiers', () => {
    (trpc.subscriptionTier.list.useQuery as any).mockReturnValue(mockQuery(tierData));
    render(<BrowserRouter><SubscribePage /></BrowserRouter>);
    const subscribeButtons = screen.getAllByText('Subscribe');
    // 2 active tiers, plus the heading "Subscribe" — filter to buttons
    expect(subscribeButtons.length).toBeGreaterThanOrEqual(2);
  });

  it('shows loading state without crashing', () => {
    (trpc.subscriptionTier.list.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><SubscribePage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });

  it('shows empty state when no active tiers', () => {
    (trpc.subscriptionTier.list.useQuery as any).mockReturnValue(mockQuery([]));
    render(<BrowserRouter><SubscribePage /></BrowserRouter>);
    expect(screen.getByText('No subscription plans available')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { MyBookingsPage } from './MyBookingsPage';
import { mockQuery, mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';

vi.mock('@/trpc', () => ({
  trpc: {
    booking: {
      list: {
        useQuery: vi.fn(),
      },
      cancel: {
        useMutation: vi.fn(),
      },
    },
    credit: {
      getBalance: {
        invalidate: vi.fn(),
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

const bookingData = [
  {
    id: 'booking-1',
    className: 'Morning Flow',
    teacherName: 'Alice Smith',
    date: '2026-03-25T09:00:00Z',
    startTime: '09:00',
    status: 'confirmed',
    creditsUsed: 1,
  },
  {
    id: 'booking-2',
    className: 'Power Yoga',
    teacherName: 'Bob Jones',
    date: '2026-03-10T18:00:00Z',
    startTime: '18:00',
    status: 'attended',
    creditsUsed: 2,
  },
];

describe('MyBookingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.booking.cancel.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders page heading', () => {
    (trpc.booking.list.useQuery as any).mockReturnValue(mockQuery(bookingData));
    render(<BrowserRouter><MyBookingsPage /></BrowserRouter>);
    expect(screen.getByText('My Bookings')).toBeInTheDocument();
  });

  it('renders upcoming tab', () => {
    (trpc.booking.list.useQuery as any).mockReturnValue(mockQuery(bookingData));
    render(<BrowserRouter><MyBookingsPage /></BrowserRouter>);
    expect(screen.getByText(/Upcoming/)).toBeInTheDocument();
  });

  it('renders past tab', () => {
    (trpc.booking.list.useQuery as any).mockReturnValue(mockQuery(bookingData));
    render(<BrowserRouter><MyBookingsPage /></BrowserRouter>);
    expect(screen.getByText(/Past/)).toBeInTheDocument();
  });

  it('renders confirmed booking in upcoming tab', () => {
    (trpc.booking.list.useQuery as any).mockReturnValue(mockQuery(bookingData));
    render(<BrowserRouter><MyBookingsPage /></BrowserRouter>);
    expect(screen.getByText('Morning Flow')).toBeInTheDocument();
  });

  it('shows loading state without crashing', () => {
    (trpc.booking.list.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><MyBookingsPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });

  it('renders empty state when no bookings', () => {
    (trpc.booking.list.useQuery as any).mockReturnValue(mockQuery([]));
    render(<BrowserRouter><MyBookingsPage /></BrowserRouter>);
    expect(screen.getByText("You haven't booked any classes yet")).toBeInTheDocument();
  });
});

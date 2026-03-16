import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BookingDetailPage } from './BookingDetailPage';
import { mockQuery, mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';

vi.mock('@/trpc', () => ({
  trpc: {
    booking: {
      get: {
        useQuery: vi.fn(),
      },
      cancel: {
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

const bookingDetail = {
  id: 'booking-1',
  className: 'Morning Flow',
  teacherName: 'Alice Smith',
  instanceDate: '2026-03-25T09:00:00Z',
  startTime: '09:00',
  endTime: '10:00',
  status: 'confirmed',
  creditsUsed: 1,
  location: 'Studio A',
};

describe('BookingDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.booking.cancel.useMutation as any).mockReturnValue(mockMutation());
    window.history.pushState({}, '', '/bookings/booking-1');
  });

  it('renders booking class name', () => {
    (trpc.booking.get.useQuery as any).mockReturnValue(mockQuery(bookingDetail));
    render(<BrowserRouter><BookingDetailPage /></BrowserRouter>);
    expect(screen.getByText('Morning Flow')).toBeInTheDocument();
  });

  it('renders teacher name', () => {
    (trpc.booking.get.useQuery as any).mockReturnValue(mockQuery(bookingDetail));
    render(<BrowserRouter><BookingDetailPage /></BrowserRouter>);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
  });

  it('renders cancel button for confirmed booking', () => {
    (trpc.booking.get.useQuery as any).mockReturnValue(mockQuery(bookingDetail));
    render(<BrowserRouter><BookingDetailPage /></BrowserRouter>);
    expect(screen.getByText('Cancel Booking')).toBeInTheDocument();
  });

  it('does not render cancel button for cancelled booking', () => {
    (trpc.booking.get.useQuery as any).mockReturnValue(
      mockQuery({ ...bookingDetail, status: 'cancelled' }),
    );
    render(<BrowserRouter><BookingDetailPage /></BrowserRouter>);
    expect(screen.queryByText('Cancel Booking')).not.toBeInTheDocument();
  });

  it('shows loading state without crashing', () => {
    (trpc.booking.get.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><BookingDetailPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });

  it('shows not found message when booking is null', () => {
    (trpc.booking.get.useQuery as any).mockReturnValue(mockQuery(null));
    render(<BrowserRouter><BookingDetailPage /></BrowserRouter>);
    expect(screen.getByText('Booking not found.')).toBeInTheDocument();
  });
});

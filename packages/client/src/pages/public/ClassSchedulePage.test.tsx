import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ClassSchedulePage } from './ClassSchedulePage';
import { mockQuery, mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';

vi.mock('@/trpc', () => ({
  trpc: {
    schedule: {
      listInstances: {
        useQuery: vi.fn(),
      },
    },
    booking: {
      create: {
        useMutation: vi.fn(),
      },
    },
    waitlist: {
      join: {
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

const instanceData = {
  instances: [
    {
      id: 'inst-1',
      date: '2026-03-20',
      className: 'Morning Flow',
      teacherName: 'Alice Smith',
      teacherInitials: 'AS',
      startTime: '09:00',
      endTime: '10:00',
      duration: 60,
      spotsLeft: 5,
      totalSpots: 10,
      creditCost: 1,
      location: 'Studio A',
      status: 'active',
      capacity: 10,
    },
    {
      id: 'inst-2',
      date: '2026-03-21',
      className: 'Power Yoga',
      teacherName: 'Bob Jones',
      teacherInitials: 'BJ',
      startTime: '18:00',
      endTime: '19:00',
      duration: 60,
      spotsLeft: 2,
      totalSpots: 8,
      creditCost: 2,
      location: null,
      status: 'active',
      capacity: 8,
    },
  ],
};

describe('ClassSchedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.booking.create.useMutation as any).mockReturnValue(mockMutation());
    (trpc.waitlist.join.useMutation as any).mockReturnValue(mockMutation());
    window.history.pushState({}, '', '/sunrise-yoga/schedule');
  });

  it('renders schedule heading', () => {
    (trpc.schedule.listInstances.useQuery as any).mockReturnValue(mockQuery(instanceData));
    render(<BrowserRouter><ClassSchedulePage /></BrowserRouter>);
    expect(screen.getByText('Class Schedule')).toBeInTheDocument();
  });

  it('renders class names from schedule data', () => {
    (trpc.schedule.listInstances.useQuery as any).mockReturnValue(mockQuery(instanceData));
    render(<BrowserRouter><ClassSchedulePage /></BrowserRouter>);
    expect(screen.getByText('Morning Flow')).toBeInTheDocument();
    expect(screen.getByText('Power Yoga')).toBeInTheDocument();
  });

  it('shows loading state without crashing', () => {
    (trpc.schedule.listInstances.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><ClassSchedulePage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });

  it('renders schedule view when data is loaded', () => {
    (trpc.schedule.listInstances.useQuery as any).mockReturnValue(mockQuery(instanceData));
    const { container } = render(<BrowserRouter><ClassSchedulePage /></BrowserRouter>);
    expect(container.querySelector('[class]')).toBeTruthy();
  });

  it('renders empty schedule without crashing', () => {
    (trpc.schedule.listInstances.useQuery as any).mockReturnValue(mockQuery({ instances: [] }));
    const { container } = render(<BrowserRouter><ClassSchedulePage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

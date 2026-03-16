import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    schedule: {
      listByTeacher: { useQuery: vi.fn() },
    },
    useUtils: vi.fn(),
  },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: '1', name: 'Test', email: 'test@test.com' },
    isAuthenticated: true,
    role: 'teacher',
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
import { mockQuery, mockUtils } from '@/__tests__/helpers/trpc-mock';
import { TeacherSchedulePage } from './TeacherSchedulePage';

const instanceData = {
  instances: [
    {
      id: '1',
      date: new Date().toISOString(),
      className: 'Vinyasa',
      startTime: '09:00',
      endTime: '10:00',
      spotsLeft: 5,
      totalSpots: 20,
      teacherName: 'Anna',
      teacherInitials: 'AM',
      capacity: 20,
      status: 'published',
      duration: 60,
      creditCost: 1,
      location: 'Main',
    },
  ],
};

describe('TeacherSchedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.schedule.listByTeacher.useQuery as any).mockReturnValue(mockQuery(instanceData));
  });

  it('renders My Schedule heading', () => {
    render(<BrowserRouter><TeacherSchedulePage /></BrowserRouter>);
    expect(screen.getByText('My Schedule')).toBeInTheDocument();
  });

  it('renders class name from data', () => {
    render(<BrowserRouter><TeacherSchedulePage /></BrowserRouter>);
    expect(screen.getByText('Vinyasa')).toBeInTheDocument();
  });

  it('renders loading state without crashing', () => {
    (trpc.schedule.listByTeacher.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><TeacherSchedulePage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

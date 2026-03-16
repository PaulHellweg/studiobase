import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/trpc', () => ({
  trpc: {
    booking: {
      listByInstance: { useQuery: vi.fn() },
      markAttended: { useMutation: vi.fn() },
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
    t: (key: string, fallback: string, opts?: any) => {
      if (opts?.count !== undefined) return fallback.replace('{{count}}', String(opts.count));
      return fallback ?? key;
    },
    i18n: { language: 'en' },
  }),
}));

import { trpc } from '@/trpc';
import { mockQuery, mockMutation, mockUtils } from '@/__tests__/helpers/trpc-mock';
import { ClassSessionPage } from './ClassSessionPage';

const attendeeData = [
  {
    id: 'booking-1',
    studentName: 'Alice Smith',
    status: 'confirmed',
    attendanceMarked: false,
  },
  {
    id: 'booking-2',
    studentName: 'Bob Jones',
    status: 'confirmed',
    attendanceMarked: false,
  },
];

describe('ClassSessionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    (trpc.booking.listByInstance.useQuery as any).mockReturnValue(mockQuery(attendeeData));
    (trpc.booking.markAttended.useMutation as any).mockReturnValue(mockMutation());
  });

  it('renders attendee names', () => {
    render(
      <MemoryRouter initialEntries={['/teacher/class/session-1']}>
        <Routes>
          <Route path="/teacher/class/:sessionId" element={<ClassSessionPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('renders loading state without crashing', () => {
    (trpc.booking.listByInstance.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(
      <MemoryRouter initialEntries={['/teacher/class/session-1']}>
        <Routes>
          <Route path="/teacher/class/:sessionId" element={<ClassSessionPage />} />
        </Routes>
      </MemoryRouter>
    );
    expect(container).toBeTruthy();
  });
});

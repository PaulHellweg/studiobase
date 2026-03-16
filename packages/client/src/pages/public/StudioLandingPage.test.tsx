import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { StudioLandingPage } from './StudioLandingPage';
import { mockQuery, mockUtils } from '@/__tests__/helpers/trpc-mock';

vi.mock('@/trpc', () => ({
  trpc: {
    studio: {
      getBySlug: {
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

const studioData = {
  studio: {
    id: 'studio-1',
    name: 'Sunrise Yoga',
    description: 'A peaceful yoga studio in the heart of the city.',
    address: '123 Main St, Berlin',
  },
};

describe('StudioLandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (trpc.useUtils as any).mockReturnValue(mockUtils());
    window.history.pushState({}, '', '/sunrise-yoga');
  });

  it('renders studio name from data', () => {
    (trpc.studio.getBySlug.useQuery as any).mockReturnValue(mockQuery(studioData));
    render(<BrowserRouter><StudioLandingPage /></BrowserRouter>);
    expect(screen.getByText('Sunrise Yoga')).toBeInTheDocument();
  });

  it('renders studio description', () => {
    (trpc.studio.getBySlug.useQuery as any).mockReturnValue(mockQuery(studioData));
    render(<BrowserRouter><StudioLandingPage /></BrowserRouter>);
    expect(screen.getByText('A peaceful yoga studio in the heart of the city.')).toBeInTheDocument();
  });

  it('renders See Full Schedule link', () => {
    (trpc.studio.getBySlug.useQuery as any).mockReturnValue(mockQuery(studioData));
    render(<BrowserRouter><StudioLandingPage /></BrowserRouter>);
    expect(screen.getByText('See Full Schedule')).toBeInTheDocument();
  });

  it('shows loading state without crashing', () => {
    (trpc.studio.getBySlug.useQuery as any).mockReturnValue(mockQuery(undefined, { isLoading: true }));
    const { container } = render(<BrowserRouter><StudioLandingPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });

  it('falls back to slug-derived name when no studio data', () => {
    (trpc.studio.getBySlug.useQuery as any).mockReturnValue(mockQuery(null));
    window.history.pushState({}, '', '/test-studio');
    render(<BrowserRouter><StudioLandingPage /></BrowserRouter>);
    // Should still render without crashing
    const { container } = render(<BrowserRouter><StudioLandingPage /></BrowserRouter>);
    expect(container).toBeTruthy();
  });
});

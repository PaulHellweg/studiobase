import { vi } from 'vitest';

// Helper to create a mock query result
export function mockQuery(data: any, overrides?: any) {
  return {
    data,
    isLoading: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  };
}

export function mockLoadingQuery() {
  return {
    data: undefined,
    isLoading: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  };
}

export function mockMutation(overrides?: any) {
  return {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    isSuccess: false,
    error: null,
    reset: vi.fn(),
    variables: undefined,
    ...overrides,
  };
}

export function mockUtils() {
  const invalidate = vi.fn();
  return new Proxy({}, {
    get: () => new Proxy({}, {
      get: () => ({ invalidate }),
    }),
  });
}

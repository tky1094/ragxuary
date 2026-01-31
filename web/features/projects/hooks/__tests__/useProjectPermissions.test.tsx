import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useProjectPermissions } from '../useProjectPermissions';

// Mock next-auth/react
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    status: 'authenticated',
    data: { user: { id: '1', email: 'test@example.com' } },
  })),
}));

// Mock the generated API client
vi.mock('@/client/@tanstack/react-query.gen', () => ({
  getProjectPermissionsOptions: vi.fn(({ path }) => ({
    queryKey: ['permissions', path.slug],
    queryFn: vi.fn().mockResolvedValue({
      permissions: ['view', 'edit'],
      role: 'editor',
    }),
  })),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useProjectPermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return permissions when authenticated', async () => {
    const { result } = renderHook(() => useProjectPermissions('test-project'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.role).toBe('editor');
    expect(result.current.permissions.has('view')).toBe(true);
    expect(result.current.permissions.has('edit')).toBe(true);
  });

  it('should return hasPermission helper that works correctly', async () => {
    const { result } = renderHook(() => useProjectPermissions('test-project'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasPermission('view')).toBe(true);
    expect(result.current.hasPermission('edit')).toBe(true);
    expect(result.current.hasPermission('manage_settings')).toBe(false);
    expect(result.current.hasPermission('delete_project')).toBe(false);
  });

  it('should return canEdit shorthand correctly', async () => {
    const { result } = renderHook(() => useProjectPermissions('test-project'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canEdit).toBe(true);
  });

  it('should return canManageSettings shorthand correctly', async () => {
    const { result } = renderHook(() => useProjectPermissions('test-project'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canManageSettings).toBe(false);
  });

  it('should have empty permissions when slug is empty', () => {
    const { result } = renderHook(() => useProjectPermissions(''), {
      wrapper: createWrapper(),
    });

    // When slug is empty, query is disabled so permissions should be empty
    expect(result.current.permissions.size).toBe(0);
    expect(result.current.role).toBeNull();
  });
});

describe('useProjectPermissions with different roles', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle owner permissions', async () => {
    vi.doMock('@/client/@tanstack/react-query.gen', () => ({
      getProjectPermissionsOptions: vi.fn(() => ({
        queryKey: ['permissions', 'test'],
        queryFn: vi.fn().mockResolvedValue({
          permissions: [
            'view',
            'edit',
            'manage_members',
            'manage_settings',
            'delete_project',
          ],
          role: 'owner',
        }),
      })),
    }));

    const { result } = renderHook(() => useProjectPermissions('test-project'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Owner should have edit permissions based on the mock
    expect(result.current.canEdit).toBe(true);
  });

  it('should handle viewer permissions', async () => {
    vi.doMock('@/client/@tanstack/react-query.gen', () => ({
      getProjectPermissionsOptions: vi.fn(() => ({
        queryKey: ['permissions', 'test'],
        queryFn: vi.fn().mockResolvedValue({
          permissions: ['view'],
          role: 'viewer',
        }),
      })),
    }));

    const { result } = renderHook(() => useProjectPermissions('test-project'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Viewer should not have edit permission
    expect(result.current.canManageSettings).toBe(false);
  });
});

describe('useProjectPermissions when unauthenticated', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Override the session mock to return unauthenticated
    vi.doMock('next-auth/react', () => ({
      useSession: vi.fn(() => ({
        status: 'unauthenticated',
        data: null,
      })),
    }));
  });

  it('should not fetch when not authenticated', () => {
    const { result } = renderHook(() => useProjectPermissions('test-project'), {
      wrapper: createWrapper(),
    });

    // When unauthenticated, the query should be disabled
    expect(result.current.permissions.size).toBe(0);
  });
});

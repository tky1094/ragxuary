import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PermissionGuard } from '../PermissionGuard';

// Mock ForbiddenPage component to avoid next-intl issues
vi.mock('@/shared/components', () => ({
  ForbiddenPage: () => <div data-testid="forbidden-page">errors.forbidden</div>,
}));

// Variable to control mock behavior
let mockPermissions: string[] = ['view', 'edit'];
let mockRole: string | null = 'editor';
let mockIsLoading = false;
let mockError: Error | null = null;

// Mock the useProjectPermissions hook
vi.mock('../../hooks', () => ({
  useProjectPermissions: vi.fn(() => ({
    permissions: new Set(mockPermissions),
    role: mockRole,
    hasPermission: (permission: string) => mockPermissions.includes(permission),
    canEdit: mockPermissions.includes('edit'),
    canManageSettings: mockPermissions.includes('manage_settings'),
    isLoading: mockIsLoading,
    error: mockError,
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

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock values
    mockPermissions = ['view', 'edit'];
    mockRole = 'editor';
    mockIsLoading = false;
    mockError = null;
  });

  it('should render children when user has required permission', async () => {
    render(
      <PermissionGuard projectSlug="test-project" requiredPermission="edit">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should render ForbiddenPage when user lacks required permission', async () => {
    // User only has view permission, not manage_settings
    mockPermissions = ['view'];

    render(
      <PermissionGuard
        projectSlug="test-project"
        requiredPermission="manage_settings"
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      // Should show the forbidden message (translated key)
      expect(screen.getByText('errors.forbidden')).toBeInTheDocument();
    });

    // Protected content should not be rendered
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render loading skeleton while loading', async () => {
    mockIsLoading = true;

    render(
      <PermissionGuard projectSlug="test-project" requiredPermission="edit">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>,
      { wrapper: createWrapper() }
    );

    // Should show skeleton, not protected content
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();

    // Skeleton elements should be present (they have role="status" or similar)
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should render custom fallback while loading', async () => {
    mockIsLoading = true;

    render(
      <PermissionGuard
        projectSlug="test-project"
        requiredPermission="edit"
        fallback={<div data-testid="custom-loading">Custom Loading...</div>}
      >
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>,
      { wrapper: createWrapper() }
    );

    expect(screen.getByTestId('custom-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render ForbiddenPage when there is an error', async () => {
    mockError = new Error('Failed to fetch permissions');

    render(
      <PermissionGuard projectSlug="test-project" requiredPermission="edit">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('errors.forbidden')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render children when user has view permission', async () => {
    mockPermissions = ['view'];

    render(
      <PermissionGuard projectSlug="test-project" requiredPermission="view">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  it('should render ForbiddenPage for non-member on private project', async () => {
    // Non-member has no permissions
    mockPermissions = [];
    mockRole = null;

    render(
      <PermissionGuard projectSlug="test-project" requiredPermission="view">
        <div data-testid="protected-content">Protected Content</div>
      </PermissionGuard>,
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(screen.getByText('errors.forbidden')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
});

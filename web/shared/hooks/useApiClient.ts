'use client';

import { useSession } from 'next-auth/react';
import { useMemo } from 'react';
import {
  createAuthenticatedBrowserClient,
  createBrowserClient,
} from '@/shared/lib/api/client';

/**
 * Hook to get an authenticated API client for use with TanStack Query
 * Returns a client with the current session's access token
 */
export function useApiClient() {
  const { data: session, status } = useSession();

  const client = useMemo(() => {
    if (status === 'authenticated' && session?.accessToken) {
      return createAuthenticatedBrowserClient(session.accessToken);
    }
    return createBrowserClient();
  }, [session?.accessToken, status]);

  return {
    client,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
  };
}

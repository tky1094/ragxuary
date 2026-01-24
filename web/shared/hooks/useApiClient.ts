'use client';

import { signOut, useSession } from 'next-auth/react';
import { useEffect, useMemo } from 'react';
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

  // Handle token refresh errors by signing out
  useEffect(() => {
    if (session?.error === 'RefreshAccessTokenError') {
      signOut({ callbackUrl: '/auth/signin' });
    }
  }, [session?.error]);

  const client = useMemo(() => {
    if (status === 'authenticated' && session?.accessToken && !session?.error) {
      return createAuthenticatedBrowserClient(session.accessToken);
    }
    return createBrowserClient();
  }, [session?.accessToken, session?.error, status]);

  return {
    client,
    isAuthenticated: status === 'authenticated' && !session?.error,
    isLoading: status === 'loading',
  };
}

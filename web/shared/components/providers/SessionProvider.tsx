'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

// Session refresh interval in seconds (4 minutes)
// This ensures the session is refreshed before the access token expires (30 minutes)
const REFETCH_INTERVAL_SECONDS = 4 * 60;

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider refetchInterval={REFETCH_INTERVAL_SECONDS}>
      {children}
    </NextAuthSessionProvider>
  );
}

'use client';

import {
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useState } from 'react';

import { setupBrowserClient } from '@/shared/lib/api/client';

interface QueryClientProviderProps {
  children: ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  // Initialize the API client with auth callback
  // This runs once on first render due to internal guard
  setupBrowserClient();

  // Create QueryClient inside useState for SSR safety
  // Each request gets a new QueryClient instance
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prevent immediate refetch during SSR hydration
            staleTime: 60 * 1000, // 1 minute
            // Disable automatic refetch on window focus
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </TanStackQueryClientProvider>
  );
}

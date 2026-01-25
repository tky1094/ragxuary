/**
 * Hey API runtime configuration for Next.js client.
 * This file is referenced by openapi-ts.config.ts via runtimeConfigPath.
 *
 * Note: This configuration is for the global client used by the browser.
 * Server-side prefetching uses getServerClient() from client.ts instead.
 */
import type { CreateClientConfig } from '@/client/client';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  // Use empty string for baseUrl - browser requests go through Next.js rewrites
  baseUrl: '',
  auth: async () => {
    // Skip auth on server - server uses getServerClient() with its own auth
    if (typeof window === 'undefined') {
      return undefined;
    }
    // Client-side: use NextAuth's getSession()
    try {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      if (session?.error === 'RefreshAccessTokenError') {
        const { signOut } = await import('next-auth/react');
        signOut({ callbackUrl: '/login' });
        return undefined;
      }
      return session?.accessToken;
    } catch {
      return undefined;
    }
  },
});

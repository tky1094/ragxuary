/**
 * API Client configuration and interceptors.
 *
 * The client is initialized via createClientConfig in hey-api-config.ts.
 * This file sets up additional interceptors for error handling and
 * provides a server client factory for server-side requests.
 */
import { type Client, createClient, createConfig } from '@/client/client';
import { client } from '@/client/client.gen';

import { ApiError } from './errors';

// Setup 401 error handling interceptor (client-side only)
if (typeof window !== 'undefined') {
  client.interceptors.response.use(async (response: Response) => {
    if (response.status === 401) {
      const { signOut } = await import('next-auth/react');
      signOut({ callbackUrl: '/login' });
    }
    return response;
  });
}

// Setup error interceptor to wrap errors with ApiError (preserves HTTP status code)
client.interceptors.error.use((error, response) => {
  const message =
    typeof error === 'object' && error !== null && 'detail' in error
      ? String((error as { detail: string }).detail)
      : 'An error occurred';

  return new ApiError(message, response.status, error);
});

/**
 * Get a server-side API client for direct backend communication.
 * Uses BACKEND_URL and automatically retrieves the access token.
 *
 * Note: Each call creates a new client instance to avoid shared state issues.
 */
export function getServerClient(): Client {
  const baseUrl = process.env.BACKEND_URL;
  if (!baseUrl) {
    throw new Error('BACKEND_URL environment variable is not set');
  }

  return createClient(
    createConfig({
      baseUrl,
      auth: async () => {
        try {
          const { auth } = await import('@/auth');
          const session = await auth();
          return session?.accessToken;
        } catch {
          return undefined;
        }
      },
    })
  );
}

export { client };

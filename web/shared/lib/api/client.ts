/**
 * API Client configuration for both server and browser environments
 *
 * - Browser: Uses global client with auth callback via getSession()
 * - Server: Creates client with BACKEND_URL and auto auth via auth()
 */
import { type Client, createClient, createConfig } from '@/client/client';
import { client } from '@/client/client.gen';

let isBrowserClientConfigured = false;

/**
 * Setup the global client for browser usage.
 * Configures authentication and 401 error handling.
 * Call this once when the app initializes (e.g., in QueryClientProvider).
 */
export function setupBrowserClient(): void {
  if (typeof window === 'undefined' || isBrowserClientConfigured) {
    return;
  }

  // Dynamic import to avoid server-side issues with next-auth/react
  import('next-auth/react').then(({ getSession, signOut }) => {
    client.setConfig({
      baseURL: '',
      auth: async () => {
        const session = await getSession();

        if (session?.error === 'RefreshAccessTokenError') {
          signOut({ callbackUrl: '/auth/signin' });
          return undefined;
        }

        return session?.accessToken;
      },
    });

    // Add response interceptor for 401 handling
    client.instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const session = await getSession();
          if (session?.accessToken) {
            signOut({ callbackUrl: '/auth/signin' });
          }
        }
        return Promise.reject(error);
      }
    );
  });

  isBrowserClientConfigured = true;
}

/**
 * Get a server-side API client with automatic authentication.
 * Uses BACKEND_URL directly for server-to-server communication.
 * Automatically retrieves the access token from the session via auth().
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
      baseURL: baseUrl,
      auth: async () => {
        try {
          // Dynamic import to avoid circular dependency with auth.ts
          const { auth } = await import('@/auth');
          const session = await auth();
          return session?.accessToken;
        } catch {
          // auth() may fail during initialization (e.g., in auth.ts callbacks)
          return undefined;
        }
      },
    })
  );
}

// Re-export global client for browser usage
export { client };

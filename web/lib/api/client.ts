/**
 * API Client configuration for hey-api generated client
 */
import { createClient, createConfig, type Client } from '@/client/client';

// Server-side client with full BACKEND_URL (lazy initialization)
let _serverClient: Client | null = null;

export const getServerClient = (): Client => {
  if (_serverClient) {
    return _serverClient;
  }

  const baseUrl = process.env.BACKEND_URL;
  if (!baseUrl) {
    throw new Error('BACKEND_URL environment variable is not set');
  }

  _serverClient = createClient(
    createConfig({
      baseURL: baseUrl,
    })
  );

  return _serverClient;
};

// Client-side client (uses Next.js API routes as proxy)
export const createBrowserClient = (): Client => {
  return createClient(
    createConfig({
      baseURL: '',
    })
  );
};

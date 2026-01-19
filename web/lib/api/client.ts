/**
 * API Client configuration for hey-api generated client
 */
import { createClient, createConfig } from '@/client/client';

// Server-side client with full BACKEND_URL
export const createServerClient = () => {
  const baseUrl = process.env.BACKEND_URL;
  if (!baseUrl) {
    throw new Error('BACKEND_URL environment variable is not set');
  }

  return createClient(
    createConfig({
      baseURL: baseUrl,
    })
  );
};

// Client-side client (uses Next.js API routes as proxy)
export const createBrowserClient = () => {
  return createClient(
    createConfig({
      baseURL: '',
    })
  );
};

// Default client for server-side usage
export const serverClient = createServerClient();

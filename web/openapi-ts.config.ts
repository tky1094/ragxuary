import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: {
    path: './client',
  },
  plugins: [
    {
      name: '@hey-api/client-next',
      runtimeConfigPath: '@/shared/lib/api/hey-api-config',
    },
    {
      name: '@hey-api/sdk',
      operations: { strategy: 'byTags' },
    },
    '@tanstack/react-query',
  ],
});

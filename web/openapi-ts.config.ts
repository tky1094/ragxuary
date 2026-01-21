import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: {
    path: './client',
  },
  plugins: [
    {
      name: '@hey-api/sdk',
      operations: { strategy: 'byTags' },
    },
    '@hey-api/client-axios',
    '@tanstack/react-query',
  ],
});

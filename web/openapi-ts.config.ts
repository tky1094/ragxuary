import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: {
    path: './client',
    format: 'prettier', // コード整形（prettierがインストールされている場合）
    lint: 'eslint', // ESLintでリント（eslintがインストールされている場合）
  },
  plugins: [
    '@hey-api/sdk',
    '@hey-api/client-axios',
    'zod',
    '@tanstack/react-query',
  ],
});

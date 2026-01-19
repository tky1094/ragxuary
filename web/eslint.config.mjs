import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  eslintConfigPrettier,
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'client/**', // auto-generated OpenAPI client
    'coverage/**', // test coverage reports
  ]),
  // テストファイル用の設定
  {
    files: [
      '__tests__/**/*.{ts,tsx}',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
    rules: {
      // テストファイルでは<a>タグの使用を許可（asChildのテストなど）
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
]);

export default eslintConfig;

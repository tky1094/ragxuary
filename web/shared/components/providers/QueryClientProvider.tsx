'use client';

import {
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { type ReactNode, useState } from 'react';

interface QueryClientProviderProps {
  children: ReactNode;
}

export function QueryClientProvider({ children }: QueryClientProviderProps) {
  // SSR対策: コンポーネント内でQueryClientをuseStateで作成
  // これにより各リクエストで新しいQueryClientが作成される
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSRのハイドレーション時に即座に再フェッチしない
            staleTime: 60 * 1000, // 1分
            // ウィンドウフォーカス時の自動再フェッチを無効化
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

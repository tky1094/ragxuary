'use client';

import { useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY_PREFIX = 'docs-sidebar-expanded';

/**
 * Persist sidebar expanded paths to localStorage.
 * Debounces writes to avoid excessive I/O.
 */
export function useSidebarPersistence(projectSlug: string) {
  const key = `${STORAGE_KEY_PREFIX}:${projectSlug}`;
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return new Set(JSON.parse(stored) as string[]);
      }
    } catch {
      // Ignore parse errors
    }
    return new Set();
  }, [key]);

  const save = useCallback(
    (paths: Set<string>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify([...paths]));
        } catch {
          // Ignore quota errors
        }
      }, 300);
    },
    [key]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { load, save };
}

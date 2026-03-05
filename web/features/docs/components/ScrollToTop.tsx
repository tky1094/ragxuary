'use client';

import { useEffect } from 'react';
import { usePathname } from '@/i18n/routing';

/**
 * Scrolls the window to the top when the pathname changes.
 * Placed in docs layout to ensure consistent scroll reset on document navigation,
 * regardless of viewport height.
 */
export function ScrollToTop() {
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname change is the intentional trigger
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

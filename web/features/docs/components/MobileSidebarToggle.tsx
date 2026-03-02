'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { usePathname } from '@/i18n/routing';
import { Button } from '@/shared/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/shared/components/ui/sheet';

export interface MobileSidebarToggleProps {
  /** Sidebar content rendered inside the Sheet */
  children: React.ReactNode;
}

/**
 * Mobile sidebar toggle using Sheet (slide-over panel).
 * Automatically closes when the URL changes (navigation).
 */
export function MobileSidebarToggle({ children }: MobileSidebarToggleProps) {
  const t = useTranslations('docs.sidebar');
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close sheet on navigation (pathname change triggers close)
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname change is intentional trigger
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('toggle')}>
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetTitle className="sr-only">{t('toggle')}</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}

'use client';

import { LogOut } from 'lucide-react';
import { useParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/ui/button';
import { LanguageSwitcher } from '../LanguageSwitcher';
import { Breadcrumb } from './Breadcrumb';

export function Header() {
  const t = useTranslations('auth');
  const params = useParams();
  const locale = params.locale as string;

  const handleLogout = () => {
    signOut({ callbackUrl: `/${locale}/login` });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-zinc-200 border-b bg-white/80 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Breadcrumb />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="gap-2 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">{t('logout')}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

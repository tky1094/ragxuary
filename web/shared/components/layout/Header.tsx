'use client';

import { LanguageSwitcher } from '../LanguageSwitcher';
import { ThemeToggle } from '../ThemeToggle';
import { Breadcrumb } from './Breadcrumb';

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-border border-b bg-card/80 backdrop-blur-sm">
      <div className="flex h-14 items-center justify-between px-6">
        <Breadcrumb />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
}

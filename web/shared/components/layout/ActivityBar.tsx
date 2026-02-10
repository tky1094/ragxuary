'use client';

import type { LucideProps } from 'lucide-react';
import { Bell, Bookmark, Home, Library, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import { cn } from '@/shared/lib/utils';

interface NavItem {
  icon: React.ComponentType<LucideProps>;
  labelKey: 'home' | 'projects' | 'bookmarks' | 'notifications' | 'settings';
  href: string;
  matchPattern?: RegExp;
}

const topNavItems: NavItem[] = [
  {
    icon: Home,
    labelKey: 'home',
    href: '',
    matchPattern: /^\/[a-z]{2}$/,
  },
  {
    icon: Library,
    labelKey: 'projects',
    href: '/projects',
    matchPattern: /\/projects|\/p\//,
  },
  {
    icon: Bookmark,
    labelKey: 'bookmarks',
    href: '/bookmarks',
    matchPattern: /\/bookmarks/,
  },
  {
    icon: Bell,
    labelKey: 'notifications',
    href: '/notifications',
    matchPattern: /\/notifications/,
  },
];

const bottomNavItems: NavItem[] = [
  {
    icon: Settings,
    labelKey: 'settings',
    href: '/settings',
    matchPattern: /\/settings/,
  },
];

function ActivityBarItem({
  item,
  locale,
  isActive,
}: {
  item: NavItem;
  locale: string;
  isActive: boolean;
}) {
  const t = useTranslations('navigation');
  const Icon = item.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={`/${locale}${item.href}`}
          className={cn(
            'relative flex h-12 w-12 items-center justify-center transition-colors',
            'text-activity-bar-foreground hover:text-activity-bar-foreground-active',
            isActive && 'text-activity-bar-foreground-active'
          )}
        >
          {/* Active indicator bar */}
          <span
            className={cn(
              'absolute top-1/2 left-0 h-6 w-0.5 -translate-y-1/2 rounded-r-sm bg-activity-bar-indicator transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0'
            )}
          />
          <Icon className="h-6 w-6" strokeWidth={1.5} />
        </Link>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={8}
        hideArrow
        className="border-0 bg-activity-bar-tooltip px-2 py-1 text-activity-bar-tooltip-foreground text-xs"
      >
        {t(item.labelKey)}
      </TooltipContent>
    </Tooltip>
  );
}

function UserMenu({ locale }: { locale: string }) {
  const { data: session } = useSession();
  const tAuth = useTranslations('auth');
  const tNav = useTranslations('navigation');

  const user = session?.user;
  const initials =
    user?.name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';

  const handleLogout = () => {
    signOut({ callbackUrl: `/${locale}/login` });
  };

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center transition-opacity hover:opacity-80"
            >
              <Avatar size="default" className="cursor-pointer rounded-md">
                <AvatarImage src={undefined} alt={user?.name || 'User'} />
                <AvatarFallback className="rounded-md bg-activity-bar-foreground font-medium text-activity-bar text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={8}
          hideArrow
          className="border-0 bg-activity-bar-tooltip px-2 py-1 text-activity-bar-tooltip-foreground text-xs"
        >
          {tNav('account')}
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        side="right"
        align="end"
        sideOffset={12}
        className="w-64 border-activity-bar-border bg-activity-bar p-0"
      >
        <div className="border-activity-bar-border border-b p-3">
          <p className="truncate font-medium text-activity-bar-foreground-active text-sm">
            {user?.name || 'User'}
          </p>
          <p className="truncate text-activity-bar-foreground text-xs">
            {user?.email || ''}
          </p>
        </div>
        <div className="p-1">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-activity-bar-foreground text-sm transition-colors hover:bg-activity-bar-border hover:text-activity-bar-foreground-active"
          >
            <LogOut className="h-4 w-4" />
            {tAuth('logout')}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ActivityBar() {
  const params = useParams();
  const pathname = usePathname();
  const locale = (params.locale as string) || 'en';

  const isItemActive = (item: NavItem) => {
    if (item.matchPattern) {
      return item.matchPattern.test(pathname);
    }
    return pathname === `/${locale}${item.href}`;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="fixed top-0 left-0 z-50 flex h-screen w-12 select-none flex-col border-activity-bar-border border-r bg-activity-bar">
        {/* Top navigation items */}
        <nav className="flex flex-1 flex-col items-center pt-3">
          {topNavItems.map((item) => (
            <ActivityBarItem
              key={item.href}
              item={item}
              locale={locale}
              isActive={isItemActive(item)}
            />
          ))}
        </nav>

        {/* Bottom navigation items */}
        <nav className="flex flex-col items-center pb-2">
          <UserMenu locale={locale} />
          {bottomNavItems.map((item) => (
            <ActivityBarItem
              key={item.href}
              item={item}
              locale={locale}
              isActive={isItemActive(item)}
            />
          ))}
        </nav>
      </aside>
    </TooltipProvider>
  );
}

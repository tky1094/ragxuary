'use client';

import {
  FileText,
  type LucideIcon,
  MessageSquare,
  Pencil,
  Settings,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';

interface TabItem {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
}

export function ProjectTabs() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();

  const locale = params.locale as string;
  const projectSlug = params.projectSlug as string;

  const basePath = `/${locale}/p/${projectSlug}`;

  const tabs: TabItem[] = [
    {
      key: 'docs',
      href: `${basePath}/docs`,
      icon: FileText,
      labelKey: 'projectTabs.docs',
    },
    {
      key: 'edit',
      href: `${basePath}/edit`,
      icon: Pencil,
      labelKey: 'projectTabs.edit',
    },
    {
      key: 'chat',
      href: `${basePath}/chat`,
      icon: MessageSquare,
      labelKey: 'projectTabs.chat',
    },
    {
      key: 'settings',
      href: `${basePath}/settings`,
      icon: Settings,
      labelKey: 'projectTabs.settings',
    },
  ];

  const isActive = (href: string) => {
    if (href === basePath) {
      return pathname === basePath;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="border-zinc-200 border-b bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="container mx-auto px-4">
        <div className="-mb-px flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  'group relative flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors',
                  active
                    ? 'text-zinc-900 dark:text-zinc-100'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    active
                      ? 'text-zinc-700 dark:text-zinc-300'
                      : 'text-zinc-400 group-hover:text-zinc-500 dark:text-zinc-500 dark:group-hover:text-zinc-400'
                  )}
                />
                <span>{t(tab.labelKey)}</span>

                {/* Active indicator line */}
                <span
                  className={cn(
                    'absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-all',
                    active
                      ? 'bg-zinc-900 dark:bg-zinc-100'
                      : 'bg-transparent group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700'
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

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

import { type Permission, useProjectPermissions } from '../hooks';

interface TabItem {
  key: string;
  href: string;
  icon: LucideIcon;
  labelKey: string;
  /** If specified, tab is only shown when user has this permission */
  requiredPermission?: Permission;
}

export function ProjectTabs() {
  const t = useTranslations();
  const params = useParams();
  const pathname = usePathname();

  const locale = params.locale as string;
  const projectSlug = params.projectSlug as string;

  const { hasPermission, isLoading } = useProjectPermissions(projectSlug);

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
      requiredPermission: 'edit',
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
      requiredPermission: 'manage_settings',
    },
  ];

  // Filter tabs based on user permissions
  const visibleTabs = tabs.filter((tab) => {
    if (!tab.requiredPermission) return true;
    if (isLoading) return false; // Hide restricted tabs while loading
    return hasPermission(tab.requiredPermission);
  });

  const isActive = (href: string) => {
    if (href === basePath) {
      return pathname === basePath;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="-mx-6 border-border border-b bg-card">
      <div className="px-6">
        <div className="-mb-px flex gap-1">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={cn(
                  'group relative flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors',
                  active
                    ? 'text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 transition-colors',
                    active
                      ? 'text-foreground'
                      : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <span>{t(tab.labelKey)}</span>

                {/* Active indicator line */}
                <span
                  className={cn(
                    'absolute inset-x-0 -bottom-px h-0.5 rounded-full transition-all',
                    active
                      ? 'bg-foreground'
                      : 'bg-transparent group-hover:bg-border'
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

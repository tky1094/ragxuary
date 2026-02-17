'use client';

import Image from 'next/image';
import { useParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Fragment, useMemo } from 'react';
import { Link } from '@/i18n/routing';
import {
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  Breadcrumb as BreadcrumbRoot,
  BreadcrumbSeparator,
} from '@/shared/components/ui/breadcrumb';

const MAX_VISIBLE_SEGMENTS = 4;

interface BreadcrumbSegment {
  label: string;
  href: string;
  isLast: boolean;
}

export function Breadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const t = useTranslations('navigation');

  const locale = params.locale as string;

  const segments = useMemo((): BreadcrumbSegment[] => {
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    const parts = pathWithoutLocale.split('/').filter(Boolean);

    const result: BreadcrumbSegment[] = [
      { label: 'Ragxuary', href: '/', isLast: parts.length === 0 },
    ];

    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isLast = i === parts.length - 1;

      if (part === 'p' && parts[i + 1]) {
        continue;
      }

      currentPath += `/${part}`;

      let label = part;
      if (part === 'projects') label = t('projects');
      else if (part === 'bookmarks') label = t('bookmarks');
      else if (part === 'notifications') label = t('notifications');
      else if (part === 'settings') label = t('settings');
      else if (part === 'admin') label = t('admin');
      else if (part === 'personal') label = t('settings');
      else if (part === 'docs') label = t('docs');
      else if (part === 'chat') label = t('chat');
      else if (part === 'users') label = t('users');
      else if (part === 'groups') label = t('groups');
      else if (part === 'edit') label = t('edit');
      else if (part === 'models') label = 'Models';

      const prevPart = parts[i - 1];
      if (prevPart === 'p') {
        currentPath = `/p/${part}`;
      }

      result.push({
        label,
        href: currentPath,
        isLast,
      });
    }

    return result;
  }, [pathname, locale, t]);

  const shouldCollapse = segments.length > MAX_VISIBLE_SEGMENTS;
  const visibleSegments = shouldCollapse
    ? [...segments.slice(0, 2), ...segments.slice(-1)]
    : segments;

  return (
    <BreadcrumbRoot>
      <BreadcrumbList>
        {visibleSegments.map((segment, index) => {
          const showEllipsis = shouldCollapse && index === 2;
          return (
            <Fragment key={`${index}-${segment.href}`}>
              {index > 0 && <BreadcrumbSeparator />}
              {showEllipsis && (
                <>
                  <BreadcrumbItem>
                    <BreadcrumbEllipsis />
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </>
              )}
              <BreadcrumbItem>
                {segment.isLast ? (
                  <BreadcrumbPage
                    className={
                      index === 0 ? 'font-bold font-serif text-lg' : ''
                    }
                  >
                    {index === 0 && (
                      <Image
                        src="/icon.svg"
                        alt=""
                        width={32}
                        height={32}
                        className="mr-1.5 inline-block align-middle dark:invert"
                      />
                    )}
                    {segment.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link
                      href={segment.href}
                      className={`inline-flex items-center ${index === 0 ? 'font-bold font-serif text-foreground text-lg' : ''}`}
                    >
                      {index === 0 && (
                        <Image
                          src="/icon.svg"
                          alt=""
                          width={32}
                          height={32}
                          className="mr-1.5 dark:invert"
                        />
                      )}
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </BreadcrumbRoot>
  );
}

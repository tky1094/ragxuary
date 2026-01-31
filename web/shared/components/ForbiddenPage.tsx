'use client';

import { ShieldX } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/ui/button';

interface ForbiddenPageProps {
  /** Custom back URL. Defaults to project list. */
  backHref?: string;
}

/**
 * 403 Forbidden page component.
 *
 * Displays an access denied message with a button to navigate back.
 * Used when a user tries to access a resource they don't have permission for.
 */
export function ForbiddenPage({ backHref }: ForbiddenPageProps) {
  const t = useTranslations('errors');
  const params = useParams();
  const locale = params.locale as string;

  const defaultBackHref = `/${locale}/projects`;

  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
      <ShieldX className="h-16 w-16 text-muted-foreground" />
      <h1 className="mt-6 font-bold text-2xl">{t('forbidden')}</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        {t('forbiddenDescription')}
      </p>
      <Button asChild className="mt-6">
        <Link href={backHref ?? defaultBackHref}>{t('backToProjects')}</Link>
      </Button>
    </div>
  );
}

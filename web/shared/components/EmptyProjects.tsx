'use client';

import { FolderPlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/routing';
import { cn } from '@/shared/lib/utils';

import { Button } from './ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from './ui/empty';

type EmptyProjectsAction =
  | { type: 'link'; href: string }
  | { type: 'button'; onClick: () => void };

interface EmptyProjectsProps {
  action: EmptyProjectsAction;
  className?: string;
}

export function EmptyProjects({ action, className }: EmptyProjectsProps) {
  const t = useTranslations('projects');
  const tDashboard = useTranslations('dashboard');

  return (
    <Empty className={cn('border', className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderPlus />
        </EmptyMedia>
        <EmptyTitle>{t('noProjects')}</EmptyTitle>
        <EmptyDescription>{tDashboard('createFirstProject')}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {action.type === 'link' ? (
          <Button asChild>
            <Link href={action.href}>{t('new')}</Link>
          </Button>
        ) : (
          <Button onClick={action.onClick}>{t('new')}</Button>
        )}
      </EmptyContent>
    </Empty>
  );
}

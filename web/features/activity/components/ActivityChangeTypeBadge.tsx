'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/shared/components/ui/badge';
import { cn } from '@/shared/lib/utils';

const changeTypeStyles: Record<string, string> = {
  create:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  update: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  delete: 'border-destructive/30 bg-destructive/10 text-destructive',
  rename:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
};

interface ActivityChangeTypeBadgeProps {
  changeType: string;
}

export function ActivityChangeTypeBadge({
  changeType,
}: ActivityChangeTypeBadgeProps) {
  const t = useTranslations('activity.changeType');
  const style = changeTypeStyles[changeType] ?? changeTypeStyles.update;
  const label = ['create', 'update', 'delete', 'rename'].includes(changeType)
    ? t(changeType as 'create' | 'update' | 'delete' | 'rename')
    : changeType;

  return (
    <Badge
      variant="outline"
      className={cn('px-1.5 py-0 font-normal text-[11px]', style)}
    >
      {label}
    </Badge>
  );
}

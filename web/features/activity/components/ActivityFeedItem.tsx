'use client';

import { useTranslations } from 'next-intl';

import type { RevisionBatchRead } from '@/client/types.gen';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/components/ui/avatar';

import { ActivityDocumentList } from './ActivityDocumentList';

interface ActivityFeedItemProps {
  batch: RevisionBatchRead;
  projectSlug: string;
  index: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatRelativeTime(dateStr: string, locale: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (diffDay > 30) {
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }
  if (diffDay > 0) return rtf.format(-diffDay, 'day');
  if (diffHour > 0) return rtf.format(-diffHour, 'hour');
  if (diffMin > 0) return rtf.format(-diffMin, 'minute');
  return rtf.format(-diffSec, 'second');
}

export function ActivityFeedItem({
  batch,
  projectSlug,
  index,
}: ActivityFeedItemProps) {
  const t = useTranslations('activity');
  const userName = batch.user_name ?? t('unknownUser');
  const locale =
    typeof window !== 'undefined'
      ? document.documentElement.lang || 'en'
      : 'en';

  return (
    <div
      className="animate-activity-fade-in relative pb-8 pl-12"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Timeline dot */}
      <div className="absolute left-[15px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-muted-foreground" />

      <div className="space-y-1.5">
        {/* User info + timestamp */}
        <div className="flex items-center gap-2.5">
          <Avatar size="sm">
            <AvatarImage
              src={batch.user_avatar_url ?? undefined}
              alt={userName}
            />
            <AvatarFallback className="text-[10px]">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground text-sm">
            {userName}
          </span>
          <span className="text-muted-foreground text-xs">
            {formatRelativeTime(batch.created_at, locale)}
          </span>
        </div>

        {/* Commit message */}
        {batch.message && (
          <p className="text-muted-foreground text-sm leading-relaxed">
            {batch.message}
          </p>
        )}

        {/* Document changes */}
        {batch.documents && batch.documents.length > 0 && (
          <ActivityDocumentList
            documents={batch.documents}
            projectSlug={projectSlug}
          />
        )}
      </div>
    </div>
  );
}

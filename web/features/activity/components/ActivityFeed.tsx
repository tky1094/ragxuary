'use client';

import { History } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';

import { useActivitySuspense } from '../hooks';
import { ActivityFeedItem } from './ActivityFeedItem';

interface ActivityFeedProps {
  projectSlug: string;
}

export function ActivityFeed({ projectSlug }: ActivityFeedProps) {
  const t = useTranslations('activity');
  const { data: batches } = useActivitySuspense(projectSlug);

  if (!batches || batches.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <History />
          </EmptyMedia>
          <EmptyTitle>{t('empty.title')}</EmptyTitle>
          <EmptyDescription>{t('empty.description')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="relative">
      {/* Timeline connector line */}
      <div
        className="absolute top-0 bottom-0 left-5 w-px bg-border"
        aria-hidden="true"
      />
      <div className="space-y-0">
        {batches.map((batch, index) => (
          <ActivityFeedItem
            key={batch.id}
            batch={batch}
            projectSlug={projectSlug}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

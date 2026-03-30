'use client';

import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { ActivityFeed } from './ActivityFeed';
import { ActivityFeedSkeleton } from './ActivityFeedSkeleton';

interface ActivityPageContentProps {
  projectSlug: string;
}

function ActivityFeedError() {
  const t = useTranslations('activity');
  return <div className="py-8 text-center text-destructive">{t('error')}</div>;
}

export function ActivityPageContent({ projectSlug }: ActivityPageContentProps) {
  const t = useTranslations('activity');

  return (
    <div className="space-y-6">
      <h1 className="font-semibold text-2xl tracking-tight">{t('title')}</h1>
      <ErrorBoundary fallback={<ActivityFeedError />}>
        <Suspense fallback={<ActivityFeedSkeleton />}>
          <ActivityFeed projectSlug={projectSlug} />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

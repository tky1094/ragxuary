'use client';

import { Bookmark } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ProjectCard } from '@/shared/components/ProjectCard';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';
import { useBookmarksSuspense } from '@/shared/hooks';

export function BookmarksPageContent() {
  const t = useTranslations('bookmarks');
  const { data: bookmarks } = useBookmarksSuspense();

  if (!bookmarks || bookmarks.length === 0) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Bookmark />
          </EmptyMedia>
          <EmptyTitle>{t('noBookmarks')}</EmptyTitle>
          <EmptyDescription>{t('noBookmarksDescription')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {bookmarks.map((bookmark) => (
        <ProjectCard
          key={bookmark.project_id}
          project={bookmark.project}
          noDescription={t('noBookmarks')}
          href={`/p/${bookmark.project.slug}/docs`}
          showBookmark={true}
        />
      ))}
    </div>
  );
}

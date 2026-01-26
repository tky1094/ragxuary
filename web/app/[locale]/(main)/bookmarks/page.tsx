import { Bookmark } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

import { auth } from '@/auth';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/shared/components/ui/empty';

interface BookmarksPageProps {
  params: Promise<{ locale: string }>;
}

export default async function BookmarksPage({ params }: BookmarksPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  // TODO: Fetch bookmarks
  const bookmarks: unknown[] = [];

  return <BookmarksContent bookmarks={bookmarks} />;
}

function BookmarksContent({ bookmarks }: { bookmarks: unknown[] }) {
  const t = useTranslations('bookmarks');

  return bookmarks.length === 0 ? (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Bookmark />
        </EmptyMedia>
        <EmptyTitle>{t('noBookmarks')}</EmptyTitle>
        <EmptyDescription>{t('noBookmarksDescription')}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ) : (
    <div>{/* TODO: Render bookmarks list */}</div>
  );
}

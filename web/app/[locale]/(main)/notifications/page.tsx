import { Bell } from 'lucide-react';
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

interface NotificationsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const [{ locale }, session] = await Promise.all([params, auth()]);
  setRequestLocale(locale);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  // TODO: Fetch notifications
  const notifications: unknown[] = [];

  return <NotificationsContent notifications={notifications} />;
}

function NotificationsContent({ notifications }: { notifications: unknown[] }) {
  const t = useTranslations('notifications');

  return notifications.length === 0 ? (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Bell />
        </EmptyMedia>
        <EmptyTitle>{t('noNotifications')}</EmptyTitle>
        <EmptyDescription>{t('noNotificationsDescription')}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  ) : (
    <div>{/* TODO: Render notifications list */}</div>
  );
}

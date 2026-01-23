import { redirect } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { auth } from '@/auth';

interface ConversationPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
    conversationId: string;
  }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { locale, projectSlug, conversationId } = await params;
  setRequestLocale(locale);

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <ConversationContent
      projectSlug={projectSlug}
      conversationId={conversationId}
    />
  );
}

function ConversationContent({
  projectSlug,
  conversationId,
}: {
  projectSlug: string;
  conversationId: string;
}) {
  const t = useTranslations('chat');

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <header className="border-b p-4">
        <h1 className="font-bold text-xl">
          {projectSlug} {t('title')}
        </h1>
        <p className="text-gray-500 text-sm">ID: {conversationId}</p>
      </header>
      <main className="flex-1 overflow-auto p-4">
        {/* TODO: Implement chat message display */}
      </main>
      <footer className="border-t p-4">
        <input
          type="text"
          placeholder={t('placeholder')}
          className="w-full rounded border p-2"
        />
        {/* TODO: Implement message input form */}
      </footer>
    </div>
  );
}

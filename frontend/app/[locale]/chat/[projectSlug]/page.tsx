import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface ChatPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  return <ChatContent projectSlug={projectSlug} />;
}

function ChatContent({ projectSlug }: { projectSlug: string }) {
  const t = useTranslations('chat');

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">
          {projectSlug} {t('title')}
        </h1>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <p className="text-gray-600">{t('newConversation')}</p>
        {/* TODO: 会話一覧とチャットインターフェースを実装 */}
      </main>
    </div>
  );
}

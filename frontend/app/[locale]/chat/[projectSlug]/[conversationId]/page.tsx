import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

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
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">
          {projectSlug} {t('title')}
        </h1>
        <p className="text-sm text-gray-500">ID: {conversationId}</p>
      </header>
      <main className="flex-1 overflow-auto p-4">
        {/* TODO: チャットメッセージ表示を実装 */}
      </main>
      <footer className="border-t p-4">
        <input
          type="text"
          placeholder={t('placeholder')}
          className="w-full rounded border p-2"
        />
        {/* TODO: メッセージ入力フォームを実装 */}
      </footer>
    </div>
  );
}

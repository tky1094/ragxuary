interface ConversationPageProps {
  params: Promise<{
    projectSlug: string;
    conversationId: string;
  }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { projectSlug, conversationId } = await params;

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">{projectSlug} チャット</h1>
        <p className="text-sm text-gray-500">会話ID: {conversationId}</p>
      </header>
      <main className="flex-1 overflow-auto p-4">
        {/* TODO: チャットメッセージ表示を実装 */}
      </main>
      <footer className="border-t p-4">
        {/* TODO: メッセージ入力フォームを実装 */}
      </footer>
    </div>
  );
}

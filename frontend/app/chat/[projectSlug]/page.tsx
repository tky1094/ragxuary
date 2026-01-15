interface ChatPageProps {
  params: Promise<{
    projectSlug: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { projectSlug } = await params;

  return (
    <div className="flex h-screen flex-col">
      <header className="border-b p-4">
        <h1 className="text-xl font-bold">{projectSlug} チャット</h1>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <p className="text-gray-600">新しい会話を開始してください</p>
        {/* TODO: 会話一覧とチャットインターフェースを実装 */}
      </main>
    </div>
  );
}

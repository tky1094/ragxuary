interface DocsSearchPageProps {
  params: Promise<{
    projectSlug: string;
  }>;
}

export default async function DocsSearchPage({ params }: DocsSearchPageProps) {
  const { projectSlug } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">{projectSlug} 検索</h1>
      <p className="mt-4 text-gray-600">ドキュメント内を検索</p>
      {/* TODO: 検索フォームと結果表示を実装 */}
    </div>
  );
}

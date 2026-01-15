interface NewDocPageProps {
  params: Promise<{
    projectSlug: string;
  }>;
}

export default async function NewDocPage({ params }: NewDocPageProps) {
  const { projectSlug } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">新規ドキュメント作成</h1>
      <p className="mt-4 text-gray-600">
        {projectSlug} に新しいドキュメントを追加します
      </p>
      {/* TODO: ドキュメント作成フォームを実装 */}
    </div>
  );
}

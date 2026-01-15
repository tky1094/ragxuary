interface ProjectDocsPageProps {
  params: Promise<{
    projectSlug: string;
  }>;
}

export default async function ProjectDocsPage({ params }: ProjectDocsPageProps) {
  const { projectSlug } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">{projectSlug} ドキュメント</h1>
      <p className="mt-4 text-gray-600">プロジェクトのドキュメント一覧</p>
      {/* TODO: ドキュメント一覧を実装 */}
    </div>
  );
}

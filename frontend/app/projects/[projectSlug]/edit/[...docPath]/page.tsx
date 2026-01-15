interface EditDocPageProps {
  params: Promise<{
    projectSlug: string;
    docPath: string[];
  }>;
}

export default async function EditDocPage({ params }: EditDocPageProps) {
  const { projectSlug, docPath } = await params;
  const path = docPath.join("/");

  return (
    <div className="container mx-auto py-8 px-4">
      <nav className="mb-4 text-sm text-gray-500">
        {projectSlug} / {path}
      </nav>
      <h1 className="text-3xl font-bold">ドキュメント編集</h1>
      <p className="mt-4 text-gray-600">{path} を編集します</p>
      {/* TODO: ドキュメントエディターを実装 */}
    </div>
  );
}

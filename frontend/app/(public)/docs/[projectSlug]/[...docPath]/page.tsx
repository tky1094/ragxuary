interface DocPageProps {
  params: Promise<{
    projectSlug: string;
    docPath: string[];
  }>;
}

export default async function DocPage({ params }: DocPageProps) {
  const { projectSlug, docPath } = await params;
  const path = docPath.join("/");

  return (
    <div className="container mx-auto py-8 px-4">
      <nav className="mb-4 text-sm text-gray-500">
        {projectSlug} / {path}
      </nav>
      <article className="prose max-w-none">
        <h1>ドキュメント: {path}</h1>
        {/* TODO: ドキュメント内容を表示 */}
      </article>
    </div>
  );
}

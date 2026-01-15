interface EditProjectPageProps {
  params: Promise<{
    projectSlug: string;
  }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const { projectSlug } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">プロジェクト編集</h1>
      <p className="mt-4 text-gray-600">{projectSlug} を編集します</p>
      {/* TODO: プロジェクト編集フォームを実装 */}
    </div>
  );
}

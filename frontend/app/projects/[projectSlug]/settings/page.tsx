interface ProjectSettingsPageProps {
  params: Promise<{
    projectSlug: string;
  }>;
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  const { projectSlug } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold">プロジェクト設定</h1>
      <p className="mt-4 text-gray-600">{projectSlug} の設定を管理します</p>
      {/* TODO: プロジェクト設定フォームを実装 */}
    </div>
  );
}

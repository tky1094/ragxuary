import { useTranslations } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';

interface ProjectSettingsPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function ProjectSettingsPage({
  params,
}: ProjectSettingsPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  return <ProjectSettingsContent projectSlug={projectSlug} />;
}

function ProjectSettingsContent({ projectSlug }: { projectSlug: string }) {
  const t = useTranslations('projects');

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="font-bold text-3xl">{t('settings')}</h1>
      <p className="mt-4 text-gray-600">{projectSlug}</p>
      {/* TODO: プロジェクト設定フォームを実装 */}
    </div>
  );
}

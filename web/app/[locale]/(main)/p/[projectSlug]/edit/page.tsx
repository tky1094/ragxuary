import { setRequestLocale } from 'next-intl/server';

import { EditProjectPageContent } from './EditProjectPageContent';

interface EditProjectPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function EditProjectPage({
  params,
}: EditProjectPageProps) {
  const { locale, projectSlug } = await params;
  setRequestLocale(locale);

  return <EditProjectPageContent projectSlug={projectSlug} />;
}

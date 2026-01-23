import { redirect } from 'next/navigation';

interface ProjectPageProps {
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { locale, projectSlug } = await params;
  redirect(`/${locale}/p/${projectSlug}/docs`);
}

import { redirect } from 'next/navigation';

import { auth } from '@/auth';

import { ProjectLayoutContent } from './ProjectLayoutContent';

interface ProjectLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
    projectSlug: string;
  }>;
}

export default async function ProjectLayout({
  children,
  params,
}: ProjectLayoutProps) {
  const { locale, projectSlug } = await params;

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <ProjectLayoutContent projectSlug={projectSlug}>
      {children}
    </ProjectLayoutContent>
  );
}

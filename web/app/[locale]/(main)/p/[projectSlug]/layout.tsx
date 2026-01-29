import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ProjectTabs } from '@/features/projects';

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
  const { locale } = await params;

  const session = await auth();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  return (
    <div className="-my-8">
      <ProjectTabs />
      <div className="py-8">{children}</div>
    </div>
  );
}

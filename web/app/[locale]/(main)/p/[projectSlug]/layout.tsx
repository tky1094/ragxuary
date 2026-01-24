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
    <div className="-mt-8">
      {/* Full-bleed: break out of container to span full viewport width */}
      <div className="relative right-1/2 left-1/2 -mr-[50vw] -ml-[50vw] w-screen">
        <ProjectTabs />
      </div>
      <div className="py-6">{children}</div>
    </div>
  );
}

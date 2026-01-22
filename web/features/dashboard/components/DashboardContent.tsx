'use client';

import { ArrowRight, FolderPlus, Loader2, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useProjectList } from '@/features/projects/hooks/useProjects';
import { Link } from '@/i18n/routing';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';

export function DashboardContent() {
  const t = useTranslations('dashboard');
  const tProjects = useTranslations('projects');
  const tAuth = useTranslations('auth');
  const { data: projects, isLoading, isError } = useProjectList(0, 3);

  return (
    <div className="space-y-8">
      {/* Header with Logout */}
      <div className="flex items-center justify-between">
        <section className="space-y-2">
          <h1 className="font-bold text-3xl tracking-tight">{t('welcome')}</h1>
          <p className="text-muted-foreground">{t('welcomeDescription')}</p>
        </section>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: '/ja/login' })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {tAuth('logout')}
        </Button>
      </div>

      {/* Recent Projects Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-xl">{t('recentProjects')}</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/projects">
              {t('viewAllProjects')}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}

        {isError && (
          <Card className="border-destructive">
            <CardHeader>
              <CardDescription className="text-destructive">
                {tProjects('loadError')}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {!isLoading && !isError && projects && projects.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="transition-colors hover:bg-accent/50"
              >
                <Link href={`/projects/${project.slug}/settings`}>
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription>
                      {project.description || tProjects('noDescription')}
                    </CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !isError && (!projects || projects.length === 0) && (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <FolderPlus className="mx-auto h-12 w-12 text-muted-foreground" />
              <CardTitle className="text-lg">
                {tProjects('noProjects')}
              </CardTitle>
              <CardDescription>{t('createFirstProject')}</CardDescription>
              <div className="pt-4">
                <Button asChild>
                  <Link href="/projects">{tProjects('new')}</Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        )}
      </section>
    </div>
  );
}

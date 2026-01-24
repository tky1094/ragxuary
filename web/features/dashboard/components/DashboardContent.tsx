'use client';

import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Link } from '@/i18n/routing';
import { Button } from '@/shared/components/ui/button';
import { Card, CardDescription, CardHeader } from '@/shared/components/ui/card';

import { DashboardSkeleton } from './DashboardSkeleton';
import { RecentProjects } from './RecentProjects';

function RecentProjectsError() {
  const tProjects = useTranslations('projects');

  return (
    <Card className="border-destructive">
      <CardHeader>
        <CardDescription className="text-destructive">
          {tProjects('loadError')}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

export function DashboardContent() {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="font-bold text-3xl tracking-tight">{t('welcome')}</h1>
        <p className="text-muted-foreground">{t('welcomeDescription')}</p>
      </section>

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

        <ErrorBoundary fallback={<RecentProjectsError />}>
          <Suspense fallback={<DashboardSkeleton />}>
            <RecentProjects />
          </Suspense>
        </ErrorBoundary>
      </section>
    </div>
  );
}

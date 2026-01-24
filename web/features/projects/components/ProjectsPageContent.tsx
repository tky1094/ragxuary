'use client';

import { useTranslations } from 'next-intl';
import { Suspense, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { CreateProjectForm } from './CreateProjectForm';
import { ProjectList } from './ProjectList';
import { ProjectListSkeleton } from './ProjectListSkeleton';

function ProjectListError() {
  const t = useTranslations('projects');
  return (
    <div className="py-8 text-center text-destructive">{t('loadError')}</div>
  );
}

export function ProjectsPageContent() {
  const t = useTranslations('projects');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl">{t('title')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>{t('new')}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('new')}</DialogTitle>
            </DialogHeader>
            <CreateProjectForm onSuccess={() => setIsDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
      <ErrorBoundary fallback={<ProjectListError />}>
        <Suspense fallback={<ProjectListSkeleton />}>
          <ProjectList />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

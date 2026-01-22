'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
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
      <ProjectList />
    </div>
  );
}

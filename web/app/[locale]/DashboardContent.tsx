'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CreateProjectForm, ProjectList } from '@/features/projects';
import { Button } from '@/shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';

export function DashboardContent() {
  const t = useTranslations('projects');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
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

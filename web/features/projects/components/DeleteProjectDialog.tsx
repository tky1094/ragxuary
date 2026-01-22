'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import type { ProjectRead } from '@/client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/shared/components/ui/alert-dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { useDeleteProject } from '../hooks/useProjects';

interface DeleteProjectDialogProps {
  project: ProjectRead;
}

export function DeleteProjectDialog({ project }: DeleteProjectDialogProps) {
  const t = useTranslations('projects');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const deleteProject = useDeleteProject();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const isConfirmValid = confirmText === project.name;

  async function handleDelete() {
    if (!isConfirmValid) return;

    try {
      await deleteProject.mutateAsync({
        path: { slug: project.slug },
      });
      toast.success(t('deleteSuccess'));
      router.push('/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error(t('deleteError'));
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setConfirmText('');
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{tCommon('delete')}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('deleteConfirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('deleteConfirmDescription', { name: project.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="confirm-delete" className="text-sm">
            {t('deleteConfirmLabel', { name: project.name })}
          </Label>
          <Input
            id="confirm-delete"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={project.name}
            className="mt-2"
            disabled={deleteProject.isPending}
            autoComplete="off"
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteProject.isPending}>
            {tCommon('cancel')}
          </AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={!isConfirmValid || deleteProject.isPending}
          >
            {deleteProject.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('deleting')}
              </>
            ) : (
              tCommon('delete')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

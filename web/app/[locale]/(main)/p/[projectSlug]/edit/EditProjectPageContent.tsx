'use client';

import { useTranslations } from 'next-intl';

import { PermissionGuard } from '@/features/projects/components';

interface EditProjectPageContentProps {
  projectSlug: string;
}

export function EditProjectPageContent({
  projectSlug,
}: EditProjectPageContentProps) {
  return (
    <PermissionGuard projectSlug={projectSlug} requiredPermission="edit">
      <EditProjectContent projectSlug={projectSlug} />
    </PermissionGuard>
  );
}

function EditProjectContent({ projectSlug }: { projectSlug: string }) {
  const t = useTranslations();

  return (
    <div>
      <h1 className="font-bold text-3xl">{t('common.edit')}</h1>
      <p className="mt-4 text-muted-foreground">{projectSlug}</p>
      {/* TODO: Implement project edit form */}
    </div>
  );
}

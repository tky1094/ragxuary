'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import type { ProjectRead } from '@/client';
import { Button } from '@/shared/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { Textarea } from '@/shared/components/ui/textarea';
import { useUpdateProject } from '../hooks/useProjects';

const updateProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  visibility: z.enum(['public', 'private']),
  chat_enabled: z.boolean(),
});

type UpdateProjectFormData = z.infer<typeof updateProjectSchema>;

interface ProjectSettingsFormProps {
  project: ProjectRead;
  onSuccess?: () => void;
}

export function ProjectSettingsForm({
  project,
  onSuccess,
}: ProjectSettingsFormProps) {
  const t = useTranslations('projects');
  const updateProject = useUpdateProject();

  const form = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      name: project.name,
      description: project.description || '',
      visibility: project.visibility || 'private',
      chat_enabled: project.chat_enabled,
    },
  });

  // Reset form when project changes
  useEffect(() => {
    form.reset({
      name: project.name,
      description: project.description || '',
      visibility: project.visibility || 'private',
      chat_enabled: project.chat_enabled,
    });
  }, [project, form]);

  async function onSubmit(data: UpdateProjectFormData) {
    try {
      await updateProject.mutateAsync({
        path: { slug: project.slug },
        body: {
          name: data.name,
          description: data.description || null,
          visibility: data.visibility,
          chat_enabled: data.chat_enabled,
        },
      });
      toast.success(t('updateSuccess'));
      onSuccess?.();
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error(t('updateError'));
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input {...field} disabled={updateProject.isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('description')}</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={updateProject.isPending}
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('visibility')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={updateProject.isPending}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="public">{t('public')}</SelectItem>
                  <SelectItem value="private">{t('private')}</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{t('visibilityDescription')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chat_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{t('chatEnabled')}</FormLabel>
                <FormDescription>{t('chatEnabledDescription')}</FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={updateProject.isPending}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={updateProject.isPending}>
          {updateProject.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('saving')}
            </>
          ) : (
            t('saveChanges')
          )}
        </Button>
      </form>
    </Form>
  );
}

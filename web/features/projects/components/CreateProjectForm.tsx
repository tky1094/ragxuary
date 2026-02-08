'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Globe, Loader2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';
import { useForm } from 'react-hook-form';
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
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Textarea } from '@/shared/components/ui/textarea';
import { cn } from '@/shared/lib/utils';
import { useCreateProject } from '../hooks/useProjects';
import {
  type CreateProjectFormData,
  createProjectSchema,
} from '../lib/validations';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface CreateProjectFormProps {
  onSuccess?: () => void;
}

export function CreateProjectForm({ onSuccess }: CreateProjectFormProps) {
  const t = useTranslations('projects');
  const createProject = useCreateProject();
  const isSlugManuallyEdited = useRef(false);

  const schema = createProjectSchema({
    nameRequired: t('nameRequired'),
    slugRequired: t('slugRequired'),
    slugInvalid: t('slugInvalid'),
  });

  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      visibility: 'private',
    },
  });

  async function onSubmit(data: CreateProjectFormData) {
    try {
      await createProject.mutateAsync({
        body: {
          name: data.name,
          slug: data.slug,
          description: data.description || null,
          visibility: data.visibility,
        },
      });
      form.reset();
      isSlugManuallyEdited.current = false;
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create project:', error);
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
                <Input
                  {...field}
                  disabled={createProject.isPending}
                  onChange={(e) => {
                    field.onChange(e);
                    if (!isSlugManuallyEdited.current) {
                      form.setValue('slug', slugify(e.target.value), {
                        shouldValidate: false,
                      });
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('slug')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={createProject.isPending}
                  onChange={(e) => {
                    field.onChange(e);
                    isSlugManuallyEdited.current = true;
                  }}
                />
              </FormControl>
              <FormDescription>{t('slugHint')}</FormDescription>
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
                  disabled={createProject.isPending}
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
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-3"
                  disabled={createProject.isPending}
                >
                  <label
                    htmlFor="visibility-private"
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                      field.value === 'private'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    <RadioGroupItem
                      value="private"
                      id="visibility-private"
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <Lock className="h-3.5 w-3.5" />
                        {t('private')}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {t('privateDescription')}
                      </p>
                    </div>
                  </label>
                  <label
                    htmlFor="visibility-public"
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                      field.value === 'public'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                  >
                    <RadioGroupItem
                      value="public"
                      id="visibility-public"
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-medium text-sm">
                        <Globe className="h-3.5 w-3.5" />
                        {t('public')}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {t('publicDescription')}
                      </p>
                    </div>
                  </label>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={createProject.isPending}>
          {createProject.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('creating')}
            </>
          ) : (
            t('createProject')
          )}
        </Button>
      </form>
    </Form>
  );
}

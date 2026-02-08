import { z } from 'zod';

export function createProjectSchema(messages: {
  nameRequired: string;
  slugRequired: string;
  slugInvalid: string;
}) {
  return z.object({
    name: z.string().min(1, { message: messages.nameRequired }),
    slug: z
      .string()
      .min(1, { message: messages.slugRequired })
      .regex(/^[a-z0-9-]+$/, { message: messages.slugInvalid }),
    description: z.string().optional(),
    visibility: z.enum(['public', 'private']),
  });
}

export type CreateProjectFormData = z.infer<
  ReturnType<typeof createProjectSchema>
>;

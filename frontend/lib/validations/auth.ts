import { z } from 'zod';

export function createLoginSchema(messages: {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
}) {
  return z.object({
    email: z
      .string()
      .min(1, { message: messages.emailRequired })
      .email({ message: messages.emailInvalid }),
    password: z.string().min(1, { message: messages.passwordRequired }),
  });
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>;

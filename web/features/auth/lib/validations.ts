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

export function createRegisterSchema(messages: {
  emailRequired: string;
  emailInvalid: string;
  nameRequired: string;
  nameTooLong: string;
  passwordMinLength: string;
  passwordNeedsLetter: string;
  passwordNeedsNumber: string;
  confirmPasswordRequired: string;
  passwordsMustMatch: string;
}) {
  return z
    .object({
      email: z
        .string()
        .min(1, { message: messages.emailRequired })
        .email({ message: messages.emailInvalid }),
      name: z
        .string()
        .min(1, { message: messages.nameRequired })
        .max(100, { message: messages.nameTooLong }),
      password: z
        .string()
        .min(8, { message: messages.passwordMinLength })
        .regex(/[a-zA-Z]/, { message: messages.passwordNeedsLetter })
        .regex(/[0-9]/, { message: messages.passwordNeedsNumber }),
      confirmPassword: z
        .string()
        .min(1, { message: messages.confirmPasswordRequired }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: messages.passwordsMustMatch,
      path: ['confirmPassword'],
    });
}

export type RegisterFormData = z.infer<ReturnType<typeof createRegisterSchema>>;

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  createRegisterSchema,
  type RegisterFormData,
} from '@/features/auth/lib/validations';
import { Link, useRouter } from '@/i18n/routing';
import { Button } from '@/shared/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';

export function RegisterForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registerSchema = createRegisterSchema({
    emailRequired: t('emailRequired'),
    emailInvalid: t('emailInvalid'),
    nameRequired: t('nameRequired'),
    nameTooLong: t('nameTooLong'),
    passwordMinLength: t('passwordMinLength'),
    passwordNeedsLetter: t('passwordNeedsLetter'),
    passwordNeedsNumber: t('passwordNeedsNumber'),
    confirmPasswordRequired: t('confirmPasswordRequired'),
    passwordsMustMatch: t('passwordsMustMatch'),
  });

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterFormData) {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          password: data.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === 'emailAlreadyRegistered') {
          setError(t('emailAlreadyRegistered'));
        } else {
          setError(t('registrationFailed'));
        }
        return;
      }

      // Registration successful, auto-login
      const result = await signIn('credentials', {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        // Login failed after registration, redirect to login page
        router.push('/login');
      } else {
        router.push('/');
      }
    } catch {
      setError(t('registrationFailed'));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 font-semibold text-2xl text-stone-800 tracking-tight dark:text-stone-100">
          {t('signUpTitle')}
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t('signUpDescription')}
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-sm text-stone-700 dark:text-stone-300">
                  {t('email')}
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    disabled={isLoading}
                    className="h-11 rounded-xl border-stone-200 bg-white text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-stone-500 dark:placeholder:text-stone-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-sm text-stone-700 dark:text-stone-300">
                  {t('name')}
                </FormLabel>
                <FormControl>
                  <Input
                    disabled={isLoading}
                    className="h-11 rounded-xl border-stone-200 bg-white text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-stone-500 dark:placeholder:text-stone-500"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-sm text-stone-700 dark:text-stone-300">
                  {t('password')}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      disabled={isLoading}
                      className="h-11 rounded-xl border-stone-200 bg-white pr-12 text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-stone-500 dark:placeholder:text-stone-500"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-1/2 right-2 -translate-y-1/2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? 'Hide password' : 'Show password'}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="font-medium text-sm text-stone-700 dark:text-stone-300">
                  {t('confirmPassword')}
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      disabled={isLoading}
                      className="h-11 rounded-xl border-stone-200 bg-white pr-12 text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 focus:border-stone-400 focus:ring-stone-400/20 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:focus:border-stone-500 dark:placeholder:text-stone-500"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="absolute top-1/2 right-2 -translate-y-1/2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-700 dark:hover:text-stone-300"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword
                          ? 'Hide password'
                          : 'Show password'}
                      </span>
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {error && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900/50 dark:bg-red-900/20">
              <p className="text-red-600 text-sm dark:text-red-400">{error}</p>
            </div>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="h-11 w-full rounded-xl bg-stone-800 font-medium text-white shadow-lg shadow-stone-800/25 transition-all duration-200 hover:bg-stone-900 hover:shadow-stone-800/30 hover:shadow-xl active:scale-[0.98] dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tCommon('loading')}
                </>
              ) : (
                t('register')
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-sm text-stone-500 dark:text-stone-400">
          {t('hasAccount')}{' '}
          <Link
            href="/login"
            className="font-medium text-stone-700 underline decoration-stone-300 underline-offset-4 transition-colors duration-200 hover:text-stone-900 hover:decoration-stone-500 dark:text-stone-300 dark:decoration-stone-600 dark:hover:text-stone-100 dark:hover:decoration-stone-400"
          >
            {t('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}

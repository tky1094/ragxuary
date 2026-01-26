import { setRequestLocale } from 'next-intl/server';

import { LoginForm } from '@/features/auth/components/LoginForm';

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="flex min-h-screen">
      {/* Left side - Image */}
      <div className="relative hidden w-1/2 lg:block xl:w-3/5">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-center bg-cover bg-no-repeat"
          style={{ backgroundImage: "url('/images/login.png')" }}
        />

        {/* Layer 1: Base color grading - warm sepia tint */}
        <div className="absolute inset-0 bg-amber-900/20 mix-blend-multiply" />

        {/* Layer 2: Cinematic gradient overlay */}
        <div className="absolute inset-0 bg-linear-to-br from-amber-950/40 via-transparent to-stone-950/50" />

        {/* Layer 3: Vignette effect - darkened edges */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,transparent_40%,rgba(0,0,0,0.4)_100%)]" />

        {/* Layer 4: Light leak from window (top-right warm glow) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,rgba(255,191,105,0.15)_0%,transparent_50%)]" />

        {/* Layer 5: Secondary light leak (softer, bottom) */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,rgba(255,220,180,0.08)_0%,transparent_40%)]" />

        {/* Layer 6: Film grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Layer 7: Subtle scan lines for cinematic feel */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)',
          }}
        />

        {/* Floating dust particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Large slow particles */}
          <div className="absolute top-[15%] left-[20%] h-1 w-1 animate-float-slow rounded-full bg-amber-200/50 blur-[0.5px]" />
          <div
            className="absolute top-[60%] left-[70%] h-1.5 w-1.5 animate-float-slow rounded-full bg-amber-100/40 blur-[1px]"
            style={{ animationDelay: '2s' }}
          />
          <div
            className="absolute top-[40%] left-[85%] h-1 w-1 animate-float-slow rounded-full bg-white/30 blur-[0.5px]"
            style={{ animationDelay: '4s' }}
          />

          {/* Medium particles */}
          <div className="absolute top-[25%] left-[60%] h-0.5 w-0.5 animate-float-medium rounded-full bg-amber-200/60" />
          <div
            className="absolute top-[70%] left-[30%] h-0.5 w-0.5 animate-float-medium rounded-full bg-amber-100/50"
            style={{ animationDelay: '1s' }}
          />
          <div
            className="absolute top-[45%] left-[45%] h-0.5 w-0.5 animate-float-medium rounded-full bg-white/40"
            style={{ animationDelay: '3s' }}
          />

          {/* Small fast particles (dust motes) */}
          <div className="absolute top-[30%] left-[75%] h-px w-px animate-float-fast rounded-full bg-amber-200/70" />
          <div
            className="absolute top-[55%] left-[25%] h-px w-px animate-float-fast rounded-full bg-white/50"
            style={{ animationDelay: '0.5s' }}
          />
          <div
            className="absolute top-[80%] left-[55%] h-px w-px animate-float-fast rounded-full bg-amber-100/60"
            style={{ animationDelay: '1.5s' }}
          />
          <div
            className="absolute top-[20%] left-[40%] h-px w-px animate-float-fast rounded-full bg-white/40"
            style={{ animationDelay: '2.5s' }}
          />
        </div>

        {/* Soft glow orb effect (simulating ambient light) */}
        <div className="pointer-events-none absolute top-1/4 right-1/4 h-64 w-64 animate-pulse-slow rounded-full bg-amber-200/5 blur-3xl" />

        {/* Decorative quote */}
        <div className="absolute right-8 bottom-8 left-8 animate-fade-in-up">
          <blockquote className="rounded-xl border border-white/10 bg-black/20 p-6 backdrop-blur-sm">
            <p className="font-light text-lg text-white/90 italic leading-relaxed">
              &ldquo;Knowledge is the eye of desire and can become the pilot of
              the soul.&rdquo;
            </p>
            <footer className="mt-3 text-amber-200/70 text-sm">
              — Will Durant
            </footer>
          </blockquote>
        </div>

        {/* Brand mark */}
        <div className="absolute top-8 left-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm">
              <svg
                className="h-5 w-5 text-amber-100"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <span className="font-medium text-lg text-white/90 tracking-wide">
              Ragxuary
            </span>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="relative flex w-full flex-col items-center justify-center bg-stone-50 px-6 py-12 lg:w-1/2 xl:w-2/5 dark:bg-stone-900">
        {/* Subtle texture */}
        <div className="pointer-events-none absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+CjxyZWN0IHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgZmlsbD0iI2ZmZiI+PC9yZWN0Pgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiIGZpbGw9IiNlNWUwZGIiPjwvY2lyY2xlPgo8L3N2Zz4=')] opacity-50 dark:opacity-10" />

        {/* Mobile brand mark */}
        <div className="absolute top-6 left-6 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-600">
              <svg
                className="h-4 w-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            </div>
            <span className="font-medium text-stone-800 dark:text-stone-200">
              ragxuary
            </span>
          </div>
        </div>

        {/* Login Form */}
        <div className="relative z-10 w-full max-w-sm animate-fade-in-up">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="absolute right-6 bottom-6 left-6 text-center">
          <p className="text-stone-400 text-xs dark:text-stone-500">
            © 2025 ragxuary. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}

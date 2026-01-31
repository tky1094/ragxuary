import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { NotFoundPage } from '@/shared/components/NotFoundPage';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en' }),
}));

const messages = {
  errors: {
    notFound: 'Not Found',
    notFoundDescription:
      'The resource you are looking for does not exist or has been removed.',
    backToProjects: 'Back to Projects',
  },
};

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    );
  };
}

describe('NotFoundPage', () => {
  it('should render not found message', () => {
    render(<NotFoundPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Not Found')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The resource you are looking for does not exist or has been removed.'
      )
    ).toBeInTheDocument();
  });

  it('should have default back link to projects', () => {
    render(<NotFoundPage />, { wrapper: createWrapper() });

    const link = screen.getByRole('link', { name: 'Back to Projects' });
    expect(link).toHaveAttribute('href', '/en/projects');
  });

  it('should support custom back href', () => {
    render(<NotFoundPage backHref="/custom/path" />, {
      wrapper: createWrapper(),
    });

    const link = screen.getByRole('link', { name: 'Back to Projects' });
    expect(link).toHaveAttribute('href', '/custom/path');
  });

  it('should render icon', () => {
    const { container } = render(<NotFoundPage />, {
      wrapper: createWrapper(),
    });

    // Check that an SVG icon is rendered
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});

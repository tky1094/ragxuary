import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { EmptyProjects } from '@/shared/components/EmptyProjects';

// Mock @/i18n/routing
vi.mock('@/i18n/routing', () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={`/en${href}`}>{children}</a>
  ),
}));

const messages = {
  projects: {
    noProjects: 'No projects found',
    new: 'New Project',
  },
  dashboard: {
    createFirstProject: 'Create your first project to get started',
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

describe('EmptyProjects', () => {
  it('should render title and description', () => {
    render(<EmptyProjects action={{ type: 'link', href: '/projects' }} />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('No projects found')).toBeInTheDocument();
    expect(
      screen.getByText('Create your first project to get started')
    ).toBeInTheDocument();
  });

  it('should render FolderPlus icon', () => {
    const { container } = render(
      <EmptyProjects action={{ type: 'link', href: '/projects' }} />,
      { wrapper: createWrapper() }
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render as link when action type is link', () => {
    render(<EmptyProjects action={{ type: 'link', href: '/projects' }} />, {
      wrapper: createWrapper(),
    });

    const link = screen.getByRole('link', { name: 'New Project' });
    expect(link).toHaveAttribute('href', '/en/projects');
  });

  it('should render as button when action type is button', () => {
    const handleClick = vi.fn();
    render(
      <EmptyProjects action={{ type: 'button', onClick: handleClick }} />,
      { wrapper: createWrapper() }
    );

    const button = screen.getByRole('button', { name: 'New Project' });
    expect(button).toBeInTheDocument();
  });

  it('should call onClick when button is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <EmptyProjects action={{ type: 'button', onClick: handleClick }} />,
      { wrapper: createWrapper() }
    );

    await user.click(screen.getByRole('button', { name: 'New Project' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyProjects
        action={{ type: 'link', href: '/projects' }}
        className="custom-class"
      />,
      { wrapper: createWrapper() }
    );

    const emptyComponent = container.querySelector('[data-slot="empty"]');
    expect(emptyComponent).toHaveClass('custom-class');
  });
});

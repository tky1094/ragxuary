import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { ActivityChangeTypeBadge } from '../ActivityChangeTypeBadge';

const messages = {
  activity: {
    changeType: {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      rename: 'Renamed',
    },
  },
};

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

describe('ActivityChangeTypeBadge', () => {
  it('renders "Created" for create change type', () => {
    render(<ActivityChangeTypeBadge changeType="create" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('renders "Updated" for update change type', () => {
    render(<ActivityChangeTypeBadge changeType="update" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('renders "Deleted" for delete change type', () => {
    render(<ActivityChangeTypeBadge changeType="delete" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Deleted')).toBeInTheDocument();
  });

  it('renders "Renamed" for rename change type', () => {
    render(<ActivityChangeTypeBadge changeType="rename" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('Renamed')).toBeInTheDocument();
  });

  it('renders raw change type for unknown types', () => {
    render(<ActivityChangeTypeBadge changeType="unknown_type" />, {
      wrapper: Wrapper,
    });
    expect(screen.getByText('unknown_type')).toBeInTheDocument();
  });

  it('applies green style for create', () => {
    render(<ActivityChangeTypeBadge changeType="create" />, {
      wrapper: Wrapper,
    });
    const badge = screen.getByText('Created');
    expect(badge.className).toContain('emerald');
  });

  it('applies destructive style for delete', () => {
    render(<ActivityChangeTypeBadge changeType="delete" />, {
      wrapper: Wrapper,
    });
    const badge = screen.getByText('Deleted');
    expect(badge.className).toContain('destructive');
  });
});

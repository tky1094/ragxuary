import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { RevisionBatchRead } from '@/client/types.gen';

import { ActivityFeed } from '../ActivityFeed';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en', projectSlug: 'test-project' }),
  usePathname: () => '/en/p/test-project/activity',
}));

const mockUseActivitySuspense = vi.fn();
vi.mock('../../hooks', () => ({
  useActivitySuspense: () => mockUseActivitySuspense(),
}));

const mockBatches: RevisionBatchRead[] = [
  {
    id: 'batch-1',
    project_id: 'proj-1',
    user_id: 'user-1',
    user_name: 'John Doe',
    user_avatar_url: null,
    message: 'Updated API documentation',
    created_at: '2026-01-28T12:00:00Z',
    documents: [
      {
        revision_id: 'rev-1',
        document_id: 'doc-1',
        change_type: 'update',
        document_title: 'Getting Started',
        document_path: 'getting-started',
      },
      {
        revision_id: 'rev-2',
        document_id: 'doc-2',
        change_type: 'create',
        document_title: 'API Reference',
        document_path: 'api-reference',
      },
    ],
  },
  {
    id: 'batch-2',
    project_id: 'proj-1',
    user_id: 'user-2',
    user_name: 'Jane Smith',
    user_avatar_url: null,
    message: 'Initial setup',
    created_at: '2026-01-27T10:00:00Z',
    documents: [
      {
        revision_id: 'rev-3',
        document_id: 'doc-3',
        change_type: 'create',
        document_title: 'Introduction',
        document_path: 'introduction',
      },
    ],
  },
];

const messages = {
  activity: {
    title: 'Activity',
    empty: {
      title: 'No activity yet',
      description: 'Changes to documents in this project will appear here.',
    },
    error: 'Failed to load activity',
    changeType: {
      create: 'Created',
      update: 'Updated',
      delete: 'Deleted',
      rename: 'Renamed',
    },
    showMore: 'Show {count} more',
    showLess: 'Show less',
    unknownUser: 'Unknown user',
    documentsChanged: '{count} documents changed',
  },
};

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NextIntlClientProvider locale="en" messages={messages}>
          {children}
        </NextIntlClientProvider>
      </QueryClientProvider>
    );
  };
}

describe('ActivityFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no activity', () => {
    mockUseActivitySuspense.mockReturnValue({ data: [] });

    render(<ActivityFeed projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('No activity yet')).toBeInTheDocument();
    expect(
      screen.getByText('Changes to documents in this project will appear here.')
    ).toBeInTheDocument();
  });

  it('renders feed items with user names', () => {
    mockUseActivitySuspense.mockReturnValue({ data: mockBatches });

    render(<ActivityFeed projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('renders commit messages', () => {
    mockUseActivitySuspense.mockReturnValue({ data: mockBatches });

    render(<ActivityFeed projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Updated API documentation')).toBeInTheDocument();
    expect(screen.getByText('Initial setup')).toBeInTheDocument();
  });

  it('renders document titles', () => {
    mockUseActivitySuspense.mockReturnValue({ data: mockBatches });

    render(<ActivityFeed projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('API Reference')).toBeInTheDocument();
    expect(screen.getByText('Introduction')).toBeInTheDocument();
  });

  it('renders document links with correct paths', () => {
    mockUseActivitySuspense.mockReturnValue({ data: mockBatches });

    render(<ActivityFeed projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute(
      'href',
      '/en/p/test-project/docs/getting-started'
    );
    expect(links[1]).toHaveAttribute(
      'href',
      '/en/p/test-project/docs/api-reference'
    );
  });

  it('renders change type badges', () => {
    mockUseActivitySuspense.mockReturnValue({ data: mockBatches });

    render(<ActivityFeed projectSlug="test-project" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getAllByText('Created')).toHaveLength(2);
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });
});

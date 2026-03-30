import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import type { RevisionBatchRead } from '@/client/types.gen';

import { ActivityFeedItem } from '../ActivityFeedItem';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en', projectSlug: 'test-project' }),
}));

const messages = {
  activity: {
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

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

function createBatch(
  overrides: Partial<RevisionBatchRead> = {}
): RevisionBatchRead {
  return {
    id: 'batch-1',
    project_id: 'proj-1',
    user_id: 'user-1',
    user_name: 'John Doe',
    user_avatar_url: null,
    message: 'Updated docs',
    created_at: new Date().toISOString(),
    documents: [
      {
        revision_id: 'rev-1',
        document_id: 'doc-1',
        change_type: 'update',
        document_title: 'Getting Started',
        document_path: 'getting-started',
      },
    ],
    ...overrides,
  };
}

describe('ActivityFeedItem', () => {
  it('renders user name', () => {
    render(
      <ActivityFeedItem
        batch={createBatch()}
        projectSlug="test-project"
        index={0}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders "Unknown user" when user_name is null', () => {
    render(
      <ActivityFeedItem
        batch={createBatch({ user_name: null })}
        projectSlug="test-project"
        index={0}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Unknown user')).toBeInTheDocument();
  });

  it('renders user initials in avatar fallback', () => {
    render(
      <ActivityFeedItem
        batch={createBatch()}
        projectSlug="test-project"
        index={0}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('renders commit message', () => {
    render(
      <ActivityFeedItem
        batch={createBatch()}
        projectSlug="test-project"
        index={0}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Updated docs')).toBeInTheDocument();
  });

  it('does not render message when null', () => {
    render(
      <ActivityFeedItem
        batch={createBatch({ message: null })}
        projectSlug="test-project"
        index={0}
      />,
      { wrapper: Wrapper }
    );

    expect(screen.queryByText('Updated docs')).not.toBeInTheDocument();
  });

  it('applies staggered animation delay based on index', () => {
    const { container } = render(
      <ActivityFeedItem
        batch={createBatch()}
        projectSlug="test-project"
        index={3}
      />,
      { wrapper: Wrapper }
    );

    const item = container.firstChild as HTMLElement;
    expect(item.style.animationDelay).toBe('180ms');
  });

  it('shows "Show more" toggle when documents exceed limit', async () => {
    const manyDocs = Array.from({ length: 8 }, (_, i) => ({
      revision_id: `rev-${i}`,
      document_id: `doc-${i}`,
      change_type: 'update',
      document_title: `Document ${i}`,
      document_path: `doc-${i}`,
    }));

    render(
      <ActivityFeedItem
        batch={createBatch({ documents: manyDocs })}
        projectSlug="test-project"
        index={0}
      />,
      { wrapper: Wrapper }
    );

    // Only first 3 shown by default
    expect(screen.getByText('Document 0')).toBeInTheDocument();
    expect(screen.getByText('Document 1')).toBeInTheDocument();
    expect(screen.getByText('Document 2')).toBeInTheDocument();
    expect(screen.queryByText('Document 3')).not.toBeInTheDocument();

    // Toggle to show all
    const showMoreBtn = screen.getByText('Show 5 more');
    await userEvent.click(showMoreBtn);

    expect(screen.getByText('Document 7')).toBeInTheDocument();
    expect(screen.getByText('Show less')).toBeInTheDocument();
  });

  it('does not render link for deleted documents', () => {
    const batch = createBatch({
      documents: [
        {
          revision_id: 'rev-1',
          document_id: 'doc-1',
          change_type: 'delete',
          document_title: 'Deleted Page',
          document_path: 'deleted-page',
        },
      ],
    });

    render(
      <ActivityFeedItem batch={batch} projectSlug="test-project" index={0} />,
      { wrapper: Wrapper }
    );

    expect(screen.getByText('Deleted Page')).toBeInTheDocument();
    // The deleted document should not be a link
    const links = screen.queryAllByRole('link');
    const deletedLink = links.find((link) =>
      link.textContent?.includes('Deleted Page')
    );
    expect(deletedLink).toBeUndefined();
  });
});

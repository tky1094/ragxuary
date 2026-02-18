import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DocsContent } from '../DocsContent';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => {
    const translations: Record<string, string> = {
      lastUpdated: 'Last Updated',
      noDocs: 'No documents found',
    };
    return translations[key] ?? key;
  }),
}));

vi.mock('@/shared/components/markdown', () => ({
  MarkdownRenderer: ({
    content,
    className,
  }: {
    content: string;
    className?: string;
  }) => (
    <div data-testid="markdown-renderer" className={className}>
      {content}
    </div>
  ),
}));

const defaultDocument = {
  title: 'Getting Started',
  content: '# Hello\n\n## Introduction\n\nThis is test content.',
  updated_at: '2024-01-02T12:00:00Z',
};

// Helper to render an async Server Component in tests
async function renderRSC(props: Parameters<typeof DocsContent>[0]) {
  const element = await DocsContent(props);
  return render(element);
}

describe('DocsContent', () => {
  it('should render document title', async () => {
    await renderRSC({ document: defaultDocument });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Getting Started' })
    ).toBeInTheDocument();
  });

  it('should render last updated timestamp', async () => {
    await renderRSC({ document: defaultDocument });

    expect(screen.getByText(/Last Updated/)).toBeInTheDocument();
  });

  it('should render markdown content via MarkdownRenderer', async () => {
    await renderRSC({ document: defaultDocument });

    const renderer = screen.getByTestId('markdown-renderer');
    expect(renderer).toBeInTheDocument();
    expect(renderer).toHaveTextContent('# Hello');
  });

  it('should show empty message when content is null', async () => {
    await renderRSC({
      document: { ...defaultDocument, content: null },
    });

    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(screen.queryByTestId('markdown-renderer')).not.toBeInTheDocument();
  });

  it('should apply custom className', async () => {
    const { container } = await renderRSC({
      document: defaultDocument,
      className: 'custom-class',
    });

    expect(container.querySelector('article')).toHaveClass('custom-class');
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDocumentSuspense } from '../../hooks/useDocument';
import { DocsContent } from '../DocsContent';

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(() => (key: string) => {
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

vi.mock('@/shared/lib/markdown/extract-headings', () => ({
  extractHeadings: vi.fn((content: string) => {
    const matches = content.matchAll(/^##\s+(.+)$/gm);
    return Array.from(matches, (match) => ({
      id: match[1].toLowerCase().replace(/\s+/g, '-'),
      text: match[1],
      level: 2,
    }));
  }),
}));

const defaultDocument = {
  id: '1',
  project_id: '1',
  parent_id: null,
  slug: 'intro',
  path: 'docs/intro',
  index: 0,
  is_folder: false,
  title: 'Getting Started',
  content: '# Hello\n\n## Introduction\n\nThis is test content.',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-02T12:00:00Z',
};

vi.mock('../../hooks/useDocument', () => ({
  useDocumentSuspense: vi.fn(),
}));

const mockedUseDocumentSuspense = vi.mocked(useDocumentSuspense);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('DocsContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedUseDocumentSuspense.mockReturnValue({
      data: defaultDocument,
    } as ReturnType<typeof useDocumentSuspense>);
  });

  it('should render document title', () => {
    render(<DocsContent slug="test-project" path="docs/intro" />, {
      wrapper: createWrapper(),
    });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Getting Started' })
    ).toBeInTheDocument();
  });

  it('should render last updated timestamp', () => {
    render(<DocsContent slug="test-project" path="docs/intro" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/Last Updated/)).toBeInTheDocument();
  });

  it('should render markdown content via MarkdownRenderer', () => {
    render(<DocsContent slug="test-project" path="docs/intro" />, {
      wrapper: createWrapper(),
    });

    const renderer = screen.getByTestId('markdown-renderer');
    expect(renderer).toBeInTheDocument();
    expect(renderer).toHaveTextContent('# Hello');
  });

  it('should show empty message when content is null', () => {
    mockedUseDocumentSuspense.mockReturnValue({
      data: { ...defaultDocument, content: null },
    } as ReturnType<typeof useDocumentSuspense>);

    render(<DocsContent slug="test-project" path="docs/intro" />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(screen.queryByTestId('markdown-renderer')).not.toBeInTheDocument();
  });

  it('should call onHeadingsExtracted with extracted headings', () => {
    const onHeadingsExtracted = vi.fn();

    render(
      <DocsContent
        slug="test-project"
        path="docs/intro"
        onHeadingsExtracted={onHeadingsExtracted}
      />,
      { wrapper: createWrapper() }
    );

    expect(onHeadingsExtracted).toHaveBeenCalledWith([
      { id: 'introduction', text: 'Introduction', level: 2 },
    ]);
  });

  it('should not error when onHeadingsExtracted is not provided', () => {
    expect(() => {
      render(<DocsContent slug="test-project" path="docs/intro" />, {
        wrapper: createWrapper(),
      });
    }).not.toThrow();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DocsContent
        slug="test-project"
        path="docs/intro"
        className="custom-class"
      />,
      { wrapper: createWrapper() }
    );

    expect(container.querySelector('article')).toHaveClass('custom-class');
  });
});

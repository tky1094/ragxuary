import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DocsSidebar } from '../DocsSidebar';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en', projectSlug: 'test-project' }),
  usePathname: () => '/en/p/test-project/docs/guides/quick-start',
}));

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      title: 'Documentation',
      noDocs: 'No documents found',
    };
    return translations[key] ?? key;
  },
}));

const mockTree = [
  {
    id: 'folder-1',
    slug: 'guides',
    path: 'guides',
    title: 'Guides',
    index: 0,
    is_folder: true,
    children: [
      {
        id: 'doc-1',
        slug: 'quick-start',
        path: 'guides/quick-start',
        title: 'Quick Start',
        index: 0,
        is_folder: false,
      },
      {
        id: 'doc-2',
        slug: 'install',
        path: 'guides/install',
        title: 'Installation',
        index: 1,
        is_folder: false,
      },
    ],
  },
  {
    id: 'doc-3',
    slug: 'api-reference',
    path: 'api-reference',
    title: 'API Reference',
    index: 1,
    is_folder: false,
  },
];

vi.mock('../../hooks', () => ({
  useDocumentTreeSuspense: vi.fn(() => ({ data: mockTree })),
}));

describe('DocsSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render project name as sidebar header when provided', () => {
    render(<DocsSidebar slug="test-project" projectName="My Project" />);
    expect(screen.getByText('My Project')).toBeInTheDocument();
  });

  it('should fall back to translation when projectName is not provided', () => {
    render(<DocsSidebar slug="test-project" />);
    expect(screen.getByText('Documentation')).toBeInTheDocument();
  });

  it('should have role="tree"', () => {
    render(<DocsSidebar slug="test-project" />);
    expect(screen.getByRole('tree')).toBeInTheDocument();
  });

  it('should have aria-label on nav', () => {
    render(<DocsSidebar slug="test-project" projectName="My Project" />);
    expect(
      screen.getByRole('navigation', { name: 'My Project' })
    ).toBeInTheDocument();
  });

  it('should render tree nodes', () => {
    render(<DocsSidebar slug="test-project" />);
    expect(screen.getByText('Guides')).toBeInTheDocument();
    expect(screen.getByText('API Reference')).toBeInTheDocument();
  });

  it('should auto-expand folders containing the current document', () => {
    // pathname is /en/p/test-project/docs/guides/quick-start
    // So the "guides" folder should be auto-expanded
    render(<DocsSidebar slug="test-project" />);
    expect(screen.getByText('Quick Start')).toBeInTheDocument();
    expect(screen.getByText('Installation')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DocsSidebar slug="test-project" className="custom-sidebar" />
    );
    const nav = container.querySelector('nav');
    expect(nav).toHaveClass('custom-sidebar');
  });

  it('should show empty state when tree is empty', async () => {
    const { useDocumentTreeSuspense } = await import('../../hooks');
    vi.mocked(useDocumentTreeSuspense).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useDocumentTreeSuspense>);

    render(<DocsSidebar slug="test-project" />);
    expect(screen.getByText('No documents found')).toBeInTheDocument();
    expect(screen.queryByRole('tree')).not.toBeInTheDocument();
  });
});

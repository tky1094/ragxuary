import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { DocumentTreeNode } from '@/client/types.gen';

import { DocsSidebarItem } from '../DocsSidebarItem';

vi.mock('next/navigation', () => ({
  useParams: () => ({ locale: 'en', projectSlug: 'test-project' }),
}));

const mockDocumentNode: DocumentTreeNode = {
  id: 'doc-1',
  slug: 'quick-start',
  path: 'guides/quick-start',
  title: 'Quick Start',
  index: 0,
  is_folder: false,
};

const mockFolderNode: DocumentTreeNode = {
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
};

const defaultProps = {
  slug: 'test-project',
  currentPath: undefined as string | undefined,
  depth: 0,
  expandedPaths: new Set<string>(),
  onToggle: vi.fn(),
};

describe('DocsSidebarItem', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Document node', () => {
    it('should render document title', () => {
      render(<DocsSidebarItem node={mockDocumentNode} {...defaultProps} />);
      expect(screen.getByText('Quick Start')).toBeInTheDocument();
    });

    it('should render as a link with correct href', () => {
      render(<DocsSidebarItem node={mockDocumentNode} {...defaultProps} />);
      const link = screen.getByRole('link', { name: /Quick Start/ });
      expect(link).toHaveAttribute(
        'href',
        '/en/p/test-project/docs/guides/quick-start'
      );
    });

    it('should have role="treeitem"', () => {
      render(<DocsSidebarItem node={mockDocumentNode} {...defaultProps} />);
      expect(screen.getByRole('treeitem')).toBeInTheDocument();
    });

    it('should highlight active document', () => {
      render(
        <DocsSidebarItem
          node={mockDocumentNode}
          {...defaultProps}
          currentPath="guides/quick-start"
        />
      );
      const link = screen.getByRole('link', { name: /Quick Start/ });
      expect(link.className).toContain('bg-accent');
      expect(link.className).toContain('font-medium');
    });

    it('should not highlight inactive document', () => {
      render(
        <DocsSidebarItem
          node={mockDocumentNode}
          {...defaultProps}
          currentPath="other/path"
        />
      );
      const link = screen.getByRole('link', { name: /Quick Start/ });
      expect(link.className).not.toContain('font-medium');
    });
  });

  describe('Folder node', () => {
    it('should render folder title', () => {
      render(<DocsSidebarItem node={mockFolderNode} {...defaultProps} />);
      expect(screen.getByText('Guides')).toBeInTheDocument();
    });

    it('should render as a button', () => {
      render(<DocsSidebarItem node={mockFolderNode} {...defaultProps} />);
      expect(
        screen.getByRole('button', { name: /Guides/ })
      ).toBeInTheDocument();
    });

    it('should have role="treeitem" with aria-expanded=false when collapsed', () => {
      render(<DocsSidebarItem node={mockFolderNode} {...defaultProps} />);
      const treeitem = screen.getByRole('treeitem');
      expect(treeitem).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-expanded=true when expanded', () => {
      render(
        <DocsSidebarItem
          node={mockFolderNode}
          {...defaultProps}
          expandedPaths={new Set(['guides'])}
        />
      );
      const treeitems = screen.getAllByRole('treeitem');
      // The first treeitem is the folder itself
      expect(treeitems[0]).toHaveAttribute('aria-expanded', 'true');
    });

    it('should call onToggle when clicked', () => {
      const onToggle = vi.fn();
      render(
        <DocsSidebarItem
          node={mockFolderNode}
          {...defaultProps}
          onToggle={onToggle}
        />
      );
      fireEvent.click(screen.getByRole('button', { name: /Guides/ }));
      expect(onToggle).toHaveBeenCalledWith('guides');
    });

    it('should show children when expanded', () => {
      render(
        <DocsSidebarItem
          node={mockFolderNode}
          {...defaultProps}
          expandedPaths={new Set(['guides'])}
        />
      );
      expect(screen.getByText('Quick Start')).toBeInTheDocument();
      expect(screen.getByText('Installation')).toBeInTheDocument();
    });

    it('should hide children when collapsed', () => {
      render(<DocsSidebarItem node={mockFolderNode} {...defaultProps} />);
      expect(screen.queryByText('Quick Start')).not.toBeInTheDocument();
      expect(screen.queryByText('Installation')).not.toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('should call onToggle on ArrowRight for collapsed folder', () => {
      const onToggle = vi.fn();
      render(
        <DocsSidebarItem
          node={mockFolderNode}
          {...defaultProps}
          onToggle={onToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Guides/ });
      fireEvent.keyDown(button, { key: 'ArrowRight' });
      expect(onToggle).toHaveBeenCalledWith('guides');
    });

    it('should call onToggle on ArrowLeft for expanded folder', () => {
      const onToggle = vi.fn();
      render(
        <DocsSidebarItem
          node={mockFolderNode}
          {...defaultProps}
          expandedPaths={new Set(['guides'])}
          onToggle={onToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Guides/ });
      fireEvent.keyDown(button, { key: 'ArrowLeft' });
      expect(onToggle).toHaveBeenCalledWith('guides');
    });

    it('should call onToggle on Enter for folder', () => {
      const onToggle = vi.fn();
      render(
        <DocsSidebarItem
          node={mockFolderNode}
          {...defaultProps}
          onToggle={onToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Guides/ });
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(onToggle).toHaveBeenCalledWith('guides');
    });

    it('should call onToggle on Space for folder', () => {
      const onToggle = vi.fn();
      render(
        <DocsSidebarItem
          node={mockFolderNode}
          {...defaultProps}
          onToggle={onToggle}
        />
      );
      const button = screen.getByRole('button', { name: /Guides/ });
      fireEvent.keyDown(button, { key: ' ' });
      expect(onToggle).toHaveBeenCalledWith('guides');
    });
  });
});

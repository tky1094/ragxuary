import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Heading } from '@/shared/lib/markdown/types';

import { TableOfContents } from '../TableOfContents';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      onThisPage: 'On this page',
    };
    return translations[key] ?? key;
  },
}));

let mockActiveId: string | null = null;
vi.mock('../../hooks/useActiveHeading', () => ({
  useActiveHeading: () => mockActiveId,
}));

const sampleHeadings: Heading[] = [
  { id: 'introduction', text: 'Introduction', level: 2 },
  { id: 'getting-started', text: 'Getting Started', level: 2 },
  { id: 'installation', text: 'Installation', level: 3 },
  { id: 'configuration', text: 'Configuration', level: 3 },
  { id: 'advanced-options', text: 'Advanced Options', level: 4 },
];

describe('TableOfContents', () => {
  beforeEach(() => {
    mockActiveId = null;
  });

  it('should render the "On this page" header', () => {
    render(<TableOfContents headings={sampleHeadings} />);
    expect(screen.getByText('On this page')).toBeInTheDocument();
  });

  it('should render all heading links', () => {
    render(<TableOfContents headings={sampleHeadings} />);
    expect(screen.getByText('Introduction')).toBeInTheDocument();
    expect(screen.getByText('Getting Started')).toBeInTheDocument();
    expect(screen.getByText('Installation')).toBeInTheDocument();
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('Advanced Options')).toBeInTheDocument();
  });

  it('should render links with correct href', () => {
    render(<TableOfContents headings={sampleHeadings} />);
    const link = screen.getByText('Introduction').closest('a');
    expect(link).toHaveAttribute('href', '#introduction');
  });

  it('should return null for empty headings', () => {
    const { container } = render(<TableOfContents headings={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('should have aria-label on nav', () => {
    render(<TableOfContents headings={sampleHeadings} />);
    expect(
      screen.getByRole('navigation', { name: 'On this page' })
    ).toBeInTheDocument();
  });

  it('should highlight the active heading', () => {
    mockActiveId = 'getting-started';
    render(<TableOfContents headings={sampleHeadings} />);

    const activeLink = screen.getByText('Getting Started').closest('a');
    expect(activeLink).toHaveClass('border-primary');
    expect(activeLink).toHaveClass('text-foreground');
    expect(activeLink).toHaveClass('font-medium');
  });

  it('should not highlight non-active headings', () => {
    mockActiveId = 'getting-started';
    render(<TableOfContents headings={sampleHeadings} />);

    const inactiveLink = screen.getByText('Introduction').closest('a');
    expect(inactiveLink).toHaveClass('border-transparent');
    expect(inactiveLink).not.toHaveClass('border-primary');
  });

  it('should apply indentation for different heading levels', () => {
    render(<TableOfContents headings={sampleHeadings} />);

    const h2Item = screen.getByText('Introduction').closest('li');
    expect(h2Item).toHaveClass('pl-0');

    const h3Item = screen.getByText('Installation').closest('li');
    expect(h3Item).toHaveClass('pl-4');

    const h4Item = screen.getByText('Advanced Options').closest('li');
    expect(h4Item).toHaveClass('pl-8');
  });

  it('should call scrollIntoView on click', async () => {
    const user = userEvent.setup();

    const el = document.createElement('h2');
    el.id = 'introduction';
    el.scrollIntoView = vi.fn();
    document.body.appendChild(el);

    render(<TableOfContents headings={sampleHeadings} />);
    await user.click(screen.getByText('Introduction'));

    expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });

    el.remove();
  });

  it('should apply custom className', () => {
    render(
      <TableOfContents headings={sampleHeadings} className="custom-toc" />
    );
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('custom-toc');
  });
});

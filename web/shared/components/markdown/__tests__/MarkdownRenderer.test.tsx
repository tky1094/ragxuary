import { render, screen, waitFor } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { MarkdownRenderer } from '@/shared/components/markdown/MarkdownRenderer';

describe('MarkdownRenderer', () => {
  beforeAll(() => {
    // CodeBlock uses navigator.clipboard which is unavailable in jsdom
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  it('should render basic markdown text', async () => {
    render(<MarkdownRenderer content="Hello **world**" />);

    const strong = await screen.findByText('world');
    expect(strong.tagName).toBe('STRONG');
  });

  it('should render headings with IDs', async () => {
    render(<MarkdownRenderer content="## My Heading" />);

    const heading = await screen.findByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('id', 'my-heading');
    expect(heading.textContent).toContain('My Heading');
  });

  it('should render anchor link before heading text', async () => {
    const { container } = render(<MarkdownRenderer content="## My Heading" />);

    await waitFor(() => {
      const anchorLink = container.querySelector('.anchor-link');
      expect(anchorLink).toBeInTheDocument();
      expect(anchorLink).toHaveAttribute('href', '#my-heading');
      expect(anchorLink?.textContent).toBe('#');
    });
  });

  it('should render GFM tables', async () => {
    const table = '| A | B |\n|---|---|\n| 1 | 2 |';
    render(<MarkdownRenderer content={table} />);

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render GFM task lists', async () => {
    const taskList = '- [x] Done\n- [ ] Todo';
    render(<MarkdownRenderer content={taskList} />);

    await waitFor(() => {
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });

  it('should render code blocks with syntax highlighting', async () => {
    const code = '```javascript\nconst x = 1;\n```';
    const { container } = render(<MarkdownRenderer content={code} />);

    await waitFor(() => {
      // Shiki adds language-* class via addLanguageClass option
      const codeElement = container.querySelector('code.language-javascript');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement?.textContent).toContain('const x = 1');
    });

    // CodeBlock renders the language label
    expect(screen.getByText('javascript')).toBeInTheDocument();
  });

  it('should apply prose classes by default', () => {
    const { container } = render(<MarkdownRenderer content="test" />);

    expect(container.firstChild).toHaveClass('prose');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MarkdownRenderer content="test" className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.firstChild).toHaveClass('prose');
  });

  it('should accept componentOverrides', async () => {
    function CustomLink({
      children,
      ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) {
      return (
        <a data-testid="custom-link" {...props}>
          {children}
        </a>
      );
    }

    render(
      <MarkdownRenderer
        content="[click](https://example.com)"
        componentOverrides={{ a: CustomLink }}
      />
    );

    expect(await screen.findByTestId('custom-link')).toBeInTheDocument();
    expect(screen.getByText('click')).toHaveAttribute(
      'href',
      'https://example.com'
    );
  });

  it('should render empty content without errors', () => {
    const { container } = render(<MarkdownRenderer content="" />);

    expect(container.firstChild).toHaveClass('prose');
  });
});

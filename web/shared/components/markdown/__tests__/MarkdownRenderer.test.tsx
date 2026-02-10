import { render, screen } from '@testing-library/react';
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

  it('should render basic markdown text', () => {
    render(<MarkdownRenderer content="Hello **world**" />);

    const strong = screen.getByText('world');
    expect(strong.tagName).toBe('STRONG');
  });

  it('should render headings with IDs', () => {
    render(<MarkdownRenderer content="## My Heading" />);

    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveAttribute('id', 'my-heading');
  });

  it('should render GFM tables', () => {
    const table = '| A | B |\n|---|---|\n| 1 | 2 |';
    render(<MarkdownRenderer content={table} />);

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render GFM task lists', () => {
    const taskList = '- [x] Done\n- [ ] Todo';
    render(<MarkdownRenderer content={taskList} />);

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('should render code blocks with syntax highlighting', () => {
    const code = '```javascript\nconst x = 1;\n```';
    const { container } = render(<MarkdownRenderer content={code} />);

    // rehype-highlight splits text into <span> elements for syntax coloring
    const codeElement = container.querySelector(
      'code.hljs.language-javascript'
    );
    expect(codeElement).toBeInTheDocument();
    expect(codeElement?.textContent).toContain('const x = 1');

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

  it('should accept componentOverrides', () => {
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

    expect(screen.getByTestId('custom-link')).toBeInTheDocument();
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

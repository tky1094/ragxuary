import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { CodeBlock } from '@/shared/components/markdown/CodeBlock';

describe('CodeBlock', () => {
  beforeAll(() => {
    // jsdom does not provide navigator.clipboard by default
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    });
  });

  describe('inline code', () => {
    it('should render inline code without language label', () => {
      render(<CodeBlock>const x = 1</CodeBlock>);

      const code = screen.getByText('const x = 1');
      expect(code.tagName).toBe('CODE');
      expect(code).toHaveClass('rounded');
    });

    it('should not render copy button for inline code', () => {
      render(<CodeBlock>inline</CodeBlock>);

      expect(
        screen.queryByRole('button', { name: /copy/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('block code', () => {
    it('should render with language label', () => {
      render(
        <CodeBlock className="language-typescript">
          const x: number = 1;
        </CodeBlock>
      );

      expect(screen.getByText('typescript')).toBeInTheDocument();
    });

    it('should display copy button', () => {
      render(
        <CodeBlock className="language-javascript">
          console.log('hello');
        </CodeBlock>
      );

      expect(
        screen.getByRole('button', { name: /copy code/i })
      ).toBeInTheDocument();
    });

    it('should show copied feedback after clicking copy button', async () => {
      const user = userEvent.setup();

      render(
        <CodeBlock className="language-javascript">
          console.log('hello');
        </CodeBlock>
      );

      const button = screen.getByRole('button', { name: /copy code/i });
      await user.click(button);

      // After clicking, the button should show "Copied" feedback
      expect(
        screen.getByRole('button', { name: /copied/i })
      ).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(
        <CodeBlock className="language-python custom-class">
          print('hi')
        </CodeBlock>
      );

      const code = screen.getByText("print('hi')");
      expect(code).toHaveClass('custom-class');
    });
  });
});

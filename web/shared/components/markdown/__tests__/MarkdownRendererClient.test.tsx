import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { MarkdownRendererClient } from '../MarkdownRendererClient';

// Mock the Server Action
vi.mock('@/shared/lib/markdown/actions', () => ({
  highlightMarkdownAction: vi
    .fn()
    .mockImplementation(async (content: string) => `<p>${content}</p>`),
}));

describe('MarkdownRendererClient', () => {
  it('should render plain text during streaming', () => {
    render(
      <MarkdownRendererClient content="Hello **world**" isStreaming={true} />
    );

    expect(screen.getByText('Hello **world**')).toBeInTheDocument();
    // Should be in a <pre> element
    const pre = screen.getByText('Hello **world**').closest('pre');
    expect(pre).not.toBeNull();
  });

  it('should highlight content after streaming completes', async () => {
    const { rerender } = render(
      <MarkdownRendererClient content="Hello" isStreaming={true} />
    );

    // Stop streaming
    rerender(<MarkdownRendererClient content="Hello" isStreaming={false} />);

    await waitFor(() => {
      // After highlighting, the mocked action wraps content in <p>
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('should highlight immediately when not streaming', async () => {
    render(<MarkdownRendererClient content="Hello" isStreaming={false} />);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('should apply prose classes', () => {
    const { container } = render(
      <MarkdownRendererClient content="test" isStreaming={true} />
    );
    expect(container.firstChild).toHaveClass('prose');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <MarkdownRendererClient
        content="test"
        isStreaming={true}
        className="custom-class"
      />
    );
    expect(container.firstChild).toHaveClass('custom-class');
    expect(container.firstChild).toHaveClass('prose');
  });

  it('should call highlightMarkdownAction with anchorLinks false', async () => {
    const { highlightMarkdownAction } = await import(
      '@/shared/lib/markdown/actions'
    );

    render(<MarkdownRendererClient content="## Heading" isStreaming={false} />);

    await waitFor(() => {
      expect(highlightMarkdownAction).toHaveBeenCalledWith('## Heading', {
        anchorLinks: false,
      });
    });
  });
});

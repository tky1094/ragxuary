import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light' }),
}));

import { MermaidRenderer } from '../MermaidRenderer';

describe('MermaidRenderer', () => {
  it('should render a hidden marker span', () => {
    const { container } = render(<MermaidRenderer />);
    const span = container.querySelector('span.hidden');
    expect(span).not.toBeNull();
  });

  it('should not render any visible content', () => {
    const { container } = render(<MermaidRenderer />);
    expect(container.textContent).toBe('');
  });
});

import { render } from '@testing-library/react';
import { beforeAll, describe, expect, it } from 'vitest';

import { highlightCode } from '@/shared/lib/markdown/highlight-code';

import { CodeHighlight } from '../CodeHighlight';

// Helper to render an async Server Component in tests
async function renderRSC(props: Parameters<typeof CodeHighlight>[0]) {
  const element = await CodeHighlight(props);
  return render(element);
}

describe('CodeHighlight', () => {
  beforeAll(async () => {
    // Warm up Shiki WASM initialization
    await highlightCode('warm', 'text');
  }, 30_000);

  it('should render highlighted code', async () => {
    const { container } = await renderRSC({
      code: 'const x = 1;',
      lang: 'javascript',
    });
    expect(container.querySelector('.shiki')).not.toBeNull();
  });

  it('should use text language by default', async () => {
    const { container } = await renderRSC({ code: 'plain text' });
    expect(container.querySelector('.shiki')).not.toBeNull();
  });

  it('should apply border styling', async () => {
    const { container } = await renderRSC({
      code: 'test',
      lang: 'text',
    });
    expect(container.firstChild).toHaveClass('border');
    expect(container.firstChild).toHaveClass('rounded-lg');
  });

  it('should apply custom className', async () => {
    const { container } = await renderRSC({
      code: 'test',
      className: 'custom-class',
    });
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

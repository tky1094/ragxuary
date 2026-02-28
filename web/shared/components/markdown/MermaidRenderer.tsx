'use client';

import { useTheme } from 'next-themes';
import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Client component that renders mermaid diagrams from
 * server-generated [data-mermaid] containers.
 *
 * Pattern: Same as CodeBlockActions — hidden marker ref to locate the
 * parent container, then scan and enhance DOM nodes.
 *
 * Uses dynamic import to avoid bundling mermaid (~2MB)
 * in the initial JS payload.
 */
export function MermaidRenderer() {
  const markerRef = useRef<HTMLSpanElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const renderDiagrams = useCallback(async () => {
    const parent = markerRef.current?.parentElement;
    if (!parent) return;

    const containers =
      parent.querySelectorAll<HTMLElement>('.mermaid-container');
    if (containers.length === 0) return;

    const mermaid = (await import('mermaid')).default;

    mermaid.initialize({
      startOnLoad: false,
      theme: resolvedTheme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
    });

    for (const container of containers) {
      const definition = container.querySelector(
        '.mermaid-source code'
      )?.textContent;
      if (!definition) continue;

      try {
        const id = `mermaid-${crypto.randomUUID()}`;
        const { svg } = await mermaid.render(id, definition);

        // Hide the source and show the rendered SVG
        const source = container.querySelector<HTMLElement>('.mermaid-source');
        if (source) source.style.display = 'none';

        // Remove any previous render (theme change)
        const prev = container.querySelector('.mermaid-diagram');
        if (prev) prev.remove();

        const diagram = document.createElement('div');
        diagram.className = 'mermaid-diagram';
        diagram.innerHTML = svg;
        container.appendChild(diagram);
        container.classList.add('mermaid-rendered');
      } catch (error) {
        console.error('Mermaid render error:', error);
        container.classList.add('mermaid-error');
      }
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (mounted) {
      renderDiagrams();
    }
  }, [mounted, renderDiagrams]);

  return <span ref={markerRef} className="hidden" />;
}

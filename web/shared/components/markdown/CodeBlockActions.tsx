'use client';

import { Check, Copy } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface CodeBlockInfo {
  language: string;
  text: string;
  headerEl: HTMLDivElement;
}

/**
 * Client component that enhances server-rendered code blocks with
 * interactive features (language label + copy-to-clipboard button).
 *
 * Scans the parent container for `pre > code` elements, injects a
 * header DOM node before each, and renders React components into
 * those headers via portals.
 */
export function CodeBlockActions() {
  const [blocks, setBlocks] = useState<CodeBlockInfo[]>([]);
  const markerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const parent = markerRef.current?.parentElement;
    if (!parent) return;

    const preElements = parent.querySelectorAll('pre');
    const detected: CodeBlockInfo[] = [];

    for (const pre of preElements) {
      const code = pre.querySelector('code');
      if (!code) continue;

      // Skip if already enhanced
      if (pre.querySelector('[data-code-header]')) continue;

      const language = code.className.match(/language-(\w+)/)?.[1] ?? '';
      const text = code.textContent ?? '';

      // Create a portal target element and insert it into the DOM
      const headerEl = document.createElement('div');
      headerEl.setAttribute('data-code-header', '');
      pre.insertBefore(headerEl, pre.firstChild);

      // Style the code element for block display
      code.style.display = 'block';
      code.style.padding = '1rem';

      detected.push({ language, text, headerEl });
    }

    setBlocks(detected);

    return () => {
      // Clean up injected header elements on unmount
      for (const block of detected) {
        block.headerEl.remove();
      }
    };
  }, []);

  return (
    <>
      {/* Hidden marker to locate the parent container */}
      <span ref={markerRef} className="hidden" />
      {blocks.map((block, i) =>
        createPortal(
          <CopyHeader language={block.language} text={block.text} />,
          block.headerEl,
          `code-block-${i}`
        )
      )}
    </>
  );
}

function CopyHeader({ language, text }: { language: string; text: string }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <div className="flex items-center justify-between rounded-t-lg border-border border-b bg-muted px-4 py-2 text-muted-foreground text-xs">
      <span>{language}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-1 transition-colors hover:text-foreground"
        aria-label={copied ? 'Copied' : 'Copy code'}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

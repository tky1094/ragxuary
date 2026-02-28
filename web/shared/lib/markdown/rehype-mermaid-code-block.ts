import type { Element, Node, Root, Text } from 'hast';
import type { Plugin } from 'unified';
import { visit } from 'unist-util-visit';

/** Recursively extract text content from a hast node. */
function extractText(node: Node): string {
  if (node.type === 'text') return (node as Text).value;
  if ('children' in node) {
    return (node as Element).children.map(extractText).join('');
  }
  return '';
}

/**
 * Rehype plugin that replaces mermaid code blocks with a container
 * div for client-side rendering.
 *
 * Transforms: <pre><code class="language-mermaid">...</code></pre>
 * Into:       <div data-mermaid class="mermaid-container">
 *               <div class="mermaid-source"><code>...</code></div>
 *             </div>
 *
 * Must be placed BEFORE rehypeShiki so that mermaid blocks are
 * excluded from syntax highlighting.
 */
const rehypeMermaidCodeBlock: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'pre' || !parent || index === undefined) return;

      const code = node.children.find(
        (child): child is Element =>
          child.type === 'element' &&
          child.tagName === 'code' &&
          Array.isArray(child.properties?.className) &&
          (child.properties.className as string[]).includes('language-mermaid')
      );

      if (!code) return;

      // Extract the raw text from the code element
      const textContent = extractText(code);

      // Build a fallback element using <div> (not <pre>) so rehypeShiki
      // won't highlight it — rehypeShiki targets <pre><code> pairs.
      const wrapper: Element = {
        type: 'element',
        tagName: 'div',
        properties: {
          dataMermaid: '',
          className: ['mermaid-container'],
        },
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { className: ['mermaid-source'] },
            children: [
              {
                type: 'element',
                tagName: 'code',
                properties: {},
                children: [{ type: 'text', value: textContent } as Text],
              },
            ],
          },
        ],
      };

      parent.children[index] = wrapper;
    });
  };
};

export { rehypeMermaidCodeBlock };

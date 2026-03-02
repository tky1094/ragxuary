import { describe, expect, it } from 'vitest';
import type { DocumentTreeNode } from '@/client/types.gen';

import {
  findAdjacentDocuments,
  findFirstDocument,
  flattenDocumentTree,
} from '../tree-utils';

function makeNode(
  overrides: Partial<DocumentTreeNode> & { path: string; title: string }
): DocumentTreeNode {
  return {
    id: overrides.id ?? overrides.path,
    slug: overrides.slug ?? (overrides.path.split('/').pop() || overrides.path),
    path: overrides.path,
    title: overrides.title,
    index: overrides.index ?? 0,
    is_folder: overrides.is_folder ?? false,
    children: overrides.children,
  };
}

const sampleTree: DocumentTreeNode[] = [
  makeNode({
    path: 'guides',
    title: 'Guides',
    is_folder: true,
    children: [
      makeNode({ path: 'guides/quick-start', title: 'Quick Start', index: 0 }),
      makeNode({
        path: 'guides/installation',
        title: 'Installation',
        index: 1,
      }),
    ],
  }),
  makeNode({
    path: 'api',
    title: 'API',
    is_folder: true,
    children: [
      makeNode({ path: 'api/rest', title: 'REST API', index: 0 }),
      makeNode({ path: 'api/graphql', title: 'GraphQL', index: 1 }),
    ],
  }),
  makeNode({ path: 'changelog', title: 'Changelog', index: 2 }),
];

describe('flattenDocumentTree', () => {
  it('flattens tree into ordered leaf documents', () => {
    const flat = flattenDocumentTree(sampleTree);
    expect(flat.map((d) => d.path)).toEqual([
      'guides/quick-start',
      'guides/installation',
      'api/rest',
      'api/graphql',
      'changelog',
    ]);
  });

  it('includes ancestor information for each document', () => {
    const flat = flattenDocumentTree(sampleTree);
    const quickStart = flat.find((d) => d.path === 'guides/quick-start');
    expect(quickStart?.ancestors).toEqual([
      { path: 'guides', title: 'Guides' },
    ]);
  });

  it('has empty ancestors for root-level documents', () => {
    const flat = flattenDocumentTree(sampleTree);
    const changelog = flat.find((d) => d.path === 'changelog');
    expect(changelog?.ancestors).toEqual([]);
  });

  it('handles deeply nested folders', () => {
    const deepTree: DocumentTreeNode[] = [
      makeNode({
        path: 'a',
        title: 'A',
        is_folder: true,
        children: [
          makeNode({
            path: 'a/b',
            title: 'B',
            is_folder: true,
            children: [makeNode({ path: 'a/b/doc', title: 'Deep Doc' })],
          }),
        ],
      }),
    ];
    const flat = flattenDocumentTree(deepTree);
    expect(flat).toHaveLength(1);
    expect(flat[0].ancestors).toEqual([
      { path: 'a', title: 'A' },
      { path: 'a/b', title: 'B' },
    ]);
  });

  it('returns empty array for empty tree', () => {
    expect(flattenDocumentTree([])).toEqual([]);
  });

  it('skips empty folders', () => {
    const tree: DocumentTreeNode[] = [
      makeNode({
        path: 'empty',
        title: 'Empty',
        is_folder: true,
        children: [],
      }),
      makeNode({ path: 'doc', title: 'Doc' }),
    ];
    const flat = flattenDocumentTree(tree);
    expect(flat).toHaveLength(1);
    expect(flat[0].path).toBe('doc');
  });
});

describe('findAdjacentDocuments', () => {
  const flat = flattenDocumentTree(sampleTree);

  it('finds prev and next for a middle document', () => {
    const { prev, next } = findAdjacentDocuments(flat, 'guides/installation');
    expect(prev?.path).toBe('guides/quick-start');
    expect(next?.path).toBe('api/rest');
  });

  it('returns null prev for the first document', () => {
    const { prev, next } = findAdjacentDocuments(flat, 'guides/quick-start');
    expect(prev).toBeNull();
    expect(next?.path).toBe('guides/installation');
  });

  it('returns null next for the last document', () => {
    const { prev, next } = findAdjacentDocuments(flat, 'changelog');
    expect(prev?.path).toBe('api/graphql');
    expect(next).toBeNull();
  });

  it('returns null for both when path not found', () => {
    const { prev, next } = findAdjacentDocuments(flat, 'nonexistent');
    expect(prev).toBeNull();
    expect(next).toBeNull();
  });
});

describe('findFirstDocument', () => {
  it('finds the first leaf document', () => {
    const first = findFirstDocument(sampleTree);
    expect(first?.path).toBe('guides/quick-start');
  });

  it('returns null for empty tree', () => {
    expect(findFirstDocument([])).toBeNull();
  });

  it('returns null for tree with only empty folders', () => {
    const tree: DocumentTreeNode[] = [
      makeNode({
        path: 'empty',
        title: 'Empty',
        is_folder: true,
        children: [],
      }),
    ];
    expect(findFirstDocument(tree)).toBeNull();
  });

  it('finds document inside nested folders', () => {
    const tree: DocumentTreeNode[] = [
      makeNode({
        path: 'a',
        title: 'A',
        is_folder: true,
        children: [
          makeNode({
            path: 'a/b',
            title: 'B',
            is_folder: true,
            children: [makeNode({ path: 'a/b/first', title: 'First' })],
          }),
        ],
      }),
    ];
    expect(findFirstDocument(tree)?.path).toBe('a/b/first');
  });

  it('prefers root-level document over nested folder document', () => {
    const tree: DocumentTreeNode[] = [
      makeNode({ path: 'intro', title: 'Intro' }),
      makeNode({
        path: 'folder',
        title: 'Folder',
        is_folder: true,
        children: [makeNode({ path: 'folder/nested', title: 'Nested' })],
      }),
    ];
    expect(findFirstDocument(tree)?.path).toBe('intro');
  });
});

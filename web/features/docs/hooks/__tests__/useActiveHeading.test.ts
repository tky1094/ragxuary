import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useActiveHeading } from '../useActiveHeading';

type IntersectionCallback = (
  entries: Partial<IntersectionObserverEntry>[]
) => void;

let observerCallback: IntersectionCallback;
let observedElements: Set<Element>;

const mockObserve = vi.fn((el: Element) => observedElements.add(el));
const mockDisconnect = vi.fn();

function createHeadingElements(ids: string[]) {
  for (const id of ids) {
    const el = document.createElement('h2');
    el.id = id;
    document.body.appendChild(el);
  }
}

function cleanupHeadingElements(ids: string[]) {
  for (const id of ids) {
    document.getElementById(id)?.remove();
  }
}

function getHeading(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Element #${id} not found`);
  return el;
}

describe('useActiveHeading', () => {
  const ids = ['introduction', 'getting-started', 'advanced'];

  beforeEach(() => {
    observedElements = new Set();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn((callback: IntersectionCallback) => {
        observerCallback = callback;
        return {
          observe: mockObserve,
          unobserve: vi.fn(),
          disconnect: mockDisconnect,
        };
      })
    );
    createHeadingElements(ids);
  });

  afterEach(() => {
    cleanupHeadingElements(ids);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('should return null initially', () => {
    const { result } = renderHook(() => useActiveHeading(ids));
    expect(result.current).toBeNull();
  });

  it('should observe all heading elements', () => {
    renderHook(() => useActiveHeading(ids));
    expect(mockObserve).toHaveBeenCalledTimes(3);
  });

  it('should set activeId when a heading becomes visible', () => {
    const { result } = renderHook(() => useActiveHeading(ids));

    act(() => {
      observerCallback([
        {
          target: getHeading('getting-started'),
          isIntersecting: true,
        },
      ]);
    });

    expect(result.current).toBe('getting-started');
  });

  it('should pick the topmost heading when multiple are visible', () => {
    const { result } = renderHook(() => useActiveHeading(ids));

    act(() => {
      observerCallback([
        {
          target: getHeading('getting-started'),
          isIntersecting: true,
        },
        {
          target: getHeading('advanced'),
          isIntersecting: true,
        },
      ]);
    });

    expect(result.current).toBe('getting-started');
  });

  it('should return null for empty headingIds', () => {
    const { result } = renderHook(() => useActiveHeading([]));
    expect(result.current).toBeNull();
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it('should disconnect observer on unmount', () => {
    const { unmount } = renderHook(() => useActiveHeading(ids));
    unmount();
    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('should use correct rootMargin for sticky header offset', () => {
    renderHook(() => useActiveHeading(ids));

    expect(IntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '-80px 0px -80% 0px',
      })
    );
  });

  it('should re-observe when headingIds change', () => {
    const { rerender } = renderHook(
      ({ ids }: { ids: string[] }) => useActiveHeading(ids),
      { initialProps: { ids: ['introduction'] } }
    );

    expect(mockObserve).toHaveBeenCalledTimes(1);
    mockDisconnect.mockClear();
    mockObserve.mockClear();

    rerender({ ids: ['introduction', 'getting-started'] });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockObserve).toHaveBeenCalledTimes(2);
  });

  it('should remove heading from visible set when it leaves viewport', () => {
    const { result } = renderHook(() => useActiveHeading(ids));

    act(() => {
      observerCallback([
        {
          target: getHeading('introduction'),
          isIntersecting: true,
        },
        {
          target: getHeading('getting-started'),
          isIntersecting: true,
        },
      ]);
    });

    expect(result.current).toBe('introduction');

    act(() => {
      observerCallback([
        {
          target: getHeading('introduction'),
          isIntersecting: false,
        },
      ]);
    });

    expect(result.current).toBe('getting-started');
  });
});

'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Tracks which heading is currently visible in the viewport using IntersectionObserver.
 * Returns the ID of the topmost visible heading, or null if none are visible.
 */
export function useActiveHeading(headingIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);
  const visibleRef = useRef(new Map<string, IntersectionObserverEntry>());

  useEffect(() => {
    if (headingIds.length === 0) return;

    const visible = visibleRef.current;
    visible.clear();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry);
          } else {
            visible.delete(entry.target.id);
          }
        }

        // Pick the topmost visible heading based on document order
        if (visible.size > 0) {
          const topmost = headingIds.find((id) => visible.has(id));
          if (topmost) {
            setActiveId(topmost);
          }
        }
      },
      {
        // -80px top accounts for sticky header, -80% bottom narrows
        // the effective zone so headings activate while near viewport top
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0,
      }
    );

    const elements = headingIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [headingIds]);

  return activeId;
}

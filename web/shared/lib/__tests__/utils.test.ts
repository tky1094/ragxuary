import { describe, expect, it } from 'vitest';

import { cn } from '@/shared/lib/utils';

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('px-4', 'py-2');
    expect(result).toBe('px-4 py-2');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class active-class');
  });

  it('should handle false conditional classes', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toBe('base-class');
  });

  it('should merge tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toBe('py-1 px-4');
  });

  it('should handle arrays of classes', () => {
    const result = cn(['px-2', 'py-2']);
    expect(result).toBe('px-2 py-2');
  });

  it('should handle undefined and null values', () => {
    const result = cn('base', undefined, null, 'other');
    expect(result).toBe('base other');
  });

  it('should handle empty input', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle object syntax', () => {
    const result = cn({ 'bg-red-500': true, 'text-white': false });
    expect(result).toBe('bg-red-500');
  });
});

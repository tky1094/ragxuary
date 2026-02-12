'use client';

import { Bookmark } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/shared/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/shared/components/ui/tooltip';
import {
  useAddBookmark,
  useBookmarkStatus,
  useRemoveBookmark,
} from '@/shared/hooks';
import { cn } from '@/shared/lib/utils';

interface BookmarkButtonProps {
  projectSlug: string;
  size?: 'sm' | 'default';
  showTooltip?: boolean;
  className?: string;
}

export function BookmarkButton({
  projectSlug,
  size = 'default',
  showTooltip = true,
  className,
}: BookmarkButtonProps) {
  const t = useTranslations('bookmarks');
  const { data: statusData, isLoading: isStatusLoading } =
    useBookmarkStatus(projectSlug);
  const addBookmark = useAddBookmark();
  const removeBookmark = useRemoveBookmark();

  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const isBookmarked = statusData?.is_bookmarked ?? false;
  const isLoading =
    isStatusLoading || addBookmark.isPending || removeBookmark.isPending;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (isLoading) return;

      // Trigger animation
      setIsAnimating(true);
      if (animationTimerRef.current) {
        clearTimeout(animationTimerRef.current);
      }
      animationTimerRef.current = setTimeout(() => setIsAnimating(false), 250);

      if (isBookmarked) {
        removeBookmark.mutate({ path: { slug: projectSlug } });
      } else {
        addBookmark.mutate({ path: { slug: projectSlug } });
      }
    },
    [isBookmarked, isLoading, projectSlug, addBookmark, removeBookmark]
  );

  const buttonSize = size === 'sm' ? 'icon-sm' : 'icon';
  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';

  const button = (
    <Button
      variant="ghost"
      size={buttonSize}
      onClick={handleClick}
      disabled={isLoading}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? t('removeBookmark') : t('addBookmark')}
      className={cn(
        'transition-all duration-150',
        isLoading && 'pointer-events-none opacity-50',
        isAnimating && 'animate-bookmark-pop',
        className
      )}
    >
      <Bookmark
        className={cn(
          iconSize,
          'transition-colors duration-200',
          isBookmarked
            ? 'fill-(--bookmark-active) text-(--bookmark-active)'
            : 'text-muted-foreground hover:text-foreground'
        )}
        strokeWidth={isBookmarked ? 2 : 1.5}
      />
    </Button>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="bottom" hideArrow>
        {isBookmarked ? t('removeBookmark') : t('addBookmark')}
      </TooltipContent>
    </Tooltip>
  );
}

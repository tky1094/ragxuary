import { BookText, Globe, Lock } from 'lucide-react';

import type { ProjectRead } from '@/client';
import { Link } from '@/i18n/routing';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

import { BookmarkButton } from './BookmarkButton';

interface ProjectCardProps {
  project: ProjectRead;
  noDescription?: string;
  href?: string;
  showBookmark?: boolean;
  className?: string;
}

export function ProjectCard({
  project,
  noDescription,
  href,
  showBookmark = true,
  className,
}: ProjectCardProps) {
  const isPublic = project.visibility === 'public';

  const cardContent = (
    <div className="flex flex-col gap-1.5 px-4 py-2">
      {/* Header: Icon + Name + Visibility Badge + Bookmark */}
      <div className="flex items-center gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary/70">
          <BookText className="h-4 w-4" strokeWidth={1.5} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate font-medium leading-tight tracking-tight">
              {project.name}
            </h3>
            <Badge
              variant={'outline'}
              className={cn('h-5 gap-1 px-1.5 font-normal text-[10px]')}
            >
              {isPublic ? (
                <Globe className="h-2.5 w-2.5" />
              ) : (
                <Lock className="h-2.5 w-2.5" />
              )}
              {isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
        </div>
        {showBookmark && (
          <BookmarkButton
            projectSlug={project.slug}
            size="sm"
            className="shrink-0"
          />
        )}
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-[13px] text-muted-foreground leading-relaxed">
        {project.description || noDescription}
      </p>
    </div>
  );

  return (
    <Card
      className={cn(
        'group rounded-md border-border/60 bg-card/80 shadow-none transition-all duration-200',
        'hover:border-border hover:bg-card hover:shadow-sm py-1.5',
        className
      )}
    >
      {href ? (
        <Link href={href} className="block">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </Card>
  );
}

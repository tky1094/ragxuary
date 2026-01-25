import { BookText, Globe, Lock } from 'lucide-react';

import type { ProjectRead } from '@/client';
import { Link } from '@/i18n/routing';
import { Badge } from '@/shared/components/ui/badge';
import { Card } from '@/shared/components/ui/card';
import { cn } from '@/shared/lib/utils';

interface ProjectCardProps {
  project: ProjectRead;
  noDescription?: string;
  href?: string;
  className?: string;
}

export function ProjectCard({
  project,
  noDescription,
  href,
  className,
}: ProjectCardProps) {
  const isPublic = project.visibility === 'public';

  const cardContent = (
    <div className="flex flex-col gap-2 p-4">
      {/* Header: Icon + Name + Visibility Badge */}
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
              className={cn('h-5 gap-1 px-1.5 text-[10px] font-normal')}
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
      </div>

      {/* Description */}
      <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
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

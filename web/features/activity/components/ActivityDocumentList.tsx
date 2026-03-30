'use client';

import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { RevisionDocumentSummary } from '@/client/types.gen';

import { ActivityChangeTypeBadge } from './ActivityChangeTypeBadge';

const COLLAPSED_LIMIT = 3;

interface ActivityDocumentListProps {
  documents: RevisionDocumentSummary[];
  projectSlug: string;
}

export function ActivityDocumentList({
  documents,
  projectSlug,
}: ActivityDocumentListProps) {
  const t = useTranslations('activity');
  const params = useParams();
  const locale = params.locale as string;
  const [expanded, setExpanded] = useState(false);

  if (documents.length === 0) return null;

  const shouldCollapse = documents.length > COLLAPSED_LIMIT + 2;
  const visibleDocs =
    shouldCollapse && !expanded
      ? documents.slice(0, COLLAPSED_LIMIT)
      : documents;
  const hiddenCount = documents.length - COLLAPSED_LIMIT;

  return (
    <div className="mt-2 ml-1 space-y-1 border-border border-l-2 pl-3">
      {visibleDocs.map((doc) => (
        <div key={doc.revision_id} className="flex items-center gap-2 text-sm">
          <ActivityChangeTypeBadge changeType={doc.change_type} />
          {doc.document_path && doc.change_type !== 'delete' ? (
            <Link
              href={`/${locale}/p/${projectSlug}/docs/${doc.document_path}`}
              className="inline-flex items-center gap-1 truncate text-muted-foreground transition-colors hover:text-foreground"
            >
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate">{doc.document_title}</span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1 truncate text-muted-foreground">
              <FileText className="h-3 w-3 shrink-0" />
              <span className="truncate">{doc.document_title}</span>
            </span>
          )}
        </div>
      ))}
      {shouldCollapse && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-muted-foreground text-xs transition-colors hover:text-foreground"
        >
          {expanded ? t('showLess') : t('showMore', { count: hiddenCount })}
        </button>
      )}
    </div>
  );
}

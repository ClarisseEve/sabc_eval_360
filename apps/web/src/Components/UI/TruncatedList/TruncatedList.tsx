import React from 'react';
import { ExternalLink, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/Components/UI/Button/Button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/Components/UI/Dialog/Dialog';

type TruncatedListProps<T> = {
  /** Full data array */
  items: T[];
  /** How many items to show inline before truncating */
  previewCount?: number;
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Title shown in the modal header */
  modalTitle?: string;
  /** Optional description in modal */
  modalDescription?: string;
  /** If provided, the "Voir tout" button links to this URL instead of opening a modal */
  viewAllHref?: string;
  /** Label for the "Voir tout" link */
  viewAllLabel?: string;
  /** Key extractor for React list keys */
  keyExtractor?: (item: T, index: number) => string | number;
  /** Page size for "Charger plus" inside the modal (default: 75) */
  loadMoreStep?: number;
  /** Optional className for the list container */
  className?: string;
  /** Optional className for the modal list container */
  modalClassName?: string;
  /** Whether to show the "Voir tout" trigger even when items fit within previewCount */
  alwaysShowViewAll?: boolean;
};

export function TruncatedList<T>({
  items,
  previewCount = 5,
  renderItem,
  modalTitle = 'Liste complète',
  modalDescription,
  viewAllHref,
  viewAllLabel,
  keyExtractor,
  loadMoreStep = 75,
  className,
  modalClassName,
  alwaysShowViewAll = false,
}: TruncatedListProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [visibleInModal, setVisibleInModal] = React.useState(loadMoreStep);

  const totalCount = items.length;
  const needsTruncation = totalCount > previewCount;
  const previewItems = needsTruncation ? items.slice(0, previewCount) : items;
  const showTrigger = needsTruncation || alwaysShowViewAll;

  const getKey = keyExtractor ?? ((_: T, i: number) => i);

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) setVisibleInModal(loadMoreStep);
  };

  const modalItems = items.slice(0, visibleInModal);
  const hasMore = visibleInModal < totalCount;

  const triggerLabel = viewAllLabel ?? `Voir tout (${totalCount})`;

  return (
    <>
      <div className={className}>
        {previewItems.map((item, index) => (
          <React.Fragment key={getKey(item, index)}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
      </div>

      {showTrigger && (
        <div className="mt-2 flex justify-end">
          {viewAllHref ? (
            <Link
              to={viewAllHref}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-sabc-gray-500 transition-colors hover:bg-sabc-gray-50 hover:text-sabc-red-primary"
            >
              <span>{triggerLabel}</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-sabc-gray-500 transition-colors hover:bg-sabc-gray-50 hover:text-sabc-red-primary"
            >
              <span>{triggerLabel}</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {!viewAllHref && (
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="max-h-[80vh] max-w-2xl overflow-hidden">
            <DialogHeader>
              <DialogTitle>{modalTitle}</DialogTitle>
              {modalDescription && (
                <DialogDescription>{modalDescription}</DialogDescription>
              )}
              <div className="text-xs text-sabc-gray-500">
                {totalCount} élément{totalCount > 1 ? 's' : ''}
              </div>
            </DialogHeader>
            <div className={`-mx-2 max-h-[60vh] overflow-y-auto px-2 ${modalClassName ?? ''}`}>
              {modalItems.map((item, index) => (
                <React.Fragment key={getKey(item, index)}>
                  {renderItem(item, index)}
                </React.Fragment>
              ))}
              {hasMore && (
                <div className="flex justify-center py-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setVisibleInModal((prev) => prev + loadMoreStep)}
                  >
                    <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
                    Charger plus ({Math.min(loadMoreStep, totalCount - visibleInModal)} restants)
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

/**
 * Wrapper for table bodies that need truncation.
 * Shows `previewCount` rows inline, with a "Voir tout" row at the bottom.
 */
export function TruncatedTableBody<T>({
  items,
  previewCount = 10,
  renderRow,
  colSpan,
  viewAllHref,
  viewAllLabel,
  keyExtractor,
}: {
  items: T[];
  previewCount?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  colSpan: number;
  viewAllHref?: string;
  viewAllLabel?: string;
  keyExtractor?: (item: T, index: number) => string | number;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const totalCount = items.length;
  const needsTruncation = totalCount > previewCount && !expanded;
  const visibleItems = needsTruncation ? items.slice(0, previewCount) : items;
  const getKey = keyExtractor ?? ((_: T, i: number) => i);

  return (
    <>
      {visibleItems.map((item, index) => (
        <React.Fragment key={getKey(item, index)}>
          {renderRow(item, index)}
        </React.Fragment>
      ))}
      {needsTruncation && (
        <tr>
          <td colSpan={colSpan} className="py-2 text-center">
            {viewAllHref ? (
              <Link
                to={viewAllHref}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sabc-gray-500 transition-colors hover:text-sabc-red-primary"
              >
                Voir tout ({totalCount})
                <ExternalLink className="h-3 w-3" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-sabc-gray-500 transition-colors hover:text-sabc-red-primary"
              >
                Afficher {totalCount - previewCount} de plus
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

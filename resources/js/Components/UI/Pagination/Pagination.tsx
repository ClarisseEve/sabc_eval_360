import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/helpers';
import { Button } from '@/Components/UI/Button/Button';

const Pagination = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex w-full justify-center', className)} {...props} />
);
Pagination.displayName = 'Pagination';

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn('flex flex-wrap items-center gap-1', className)}
    {...props}
  />
));
PaginationContent.displayName = 'PaginationContent';

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn('', className)} {...props} />
));
PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = {
  isActive?: boolean;
} & React.ComponentProps<typeof Button>;

const PaginationLink = ({
  className,
  isActive,
  size = 'icon',
  ...props
}: PaginationLinkProps) => (
  <Button
    aria-current={isActive ? 'page' : undefined}
    variant={isActive ? 'default' : 'outline'}
    size={size}
    className={cn(
      'w-9 h-9 transition-all duration-200',
      isActive && 'bg-sabc-red-primary text-white hover:bg-sabc-red-dark scale-105 shadow-sm',
      !isActive && 'hover:scale-105 hover:shadow-sm',
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = 'PaginationLink';

const PaginationPrevious = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Aller à la page précédente"
    size="icon"
    className={cn('gap-1 pl-2.5 hover:translate-x-[-2px] transition-transform', className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span className="sr-only">Précédent</span>
  </PaginationLink>
);
PaginationPrevious.displayName = 'PaginationPrevious';

const PaginationNext = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Aller à la page suivante"
    size="icon"
    className={cn('gap-1 pr-2.5 hover:translate-x-[2px] transition-transform', className)}
    {...props}
  >
    <span className="sr-only">Suivant</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationNext.displayName = 'PaginationNext';

const PaginationEllipsis = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => (
  <span
    aria-hidden
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">Plus de pages</span>
  </span>
);
PaginationEllipsis.displayName = 'PaginationEllipsis';

const PaginationFirst = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Aller à la première page"
    size="icon"
    className={cn('gap-1 hover:translate-x-[-2px] transition-transform', className)}
    {...props}
  >
    <ChevronsLeft className="h-4 w-4" />
    <span className="sr-only">Première page</span>
  </PaginationLink>
);
PaginationFirst.displayName = 'PaginationFirst';

const PaginationLast = ({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof PaginationLink>) => (
  <PaginationLink
    aria-label="Aller à la dernière page"
    size="icon"
    className={cn('gap-1 hover:translate-x-[2px] transition-transform', className)}
    {...props}
  >
    <span className="sr-only">Dernière page</span>
    <ChevronsRight className="h-4 w-4" />
  </PaginationLink>
);
PaginationLast.displayName = 'PaginationLast';

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationFirst,
  PaginationLast,
  PaginationEllipsis,
};

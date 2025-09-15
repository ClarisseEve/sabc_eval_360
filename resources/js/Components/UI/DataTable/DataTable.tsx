import React from 'react';
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';
import { cn } from '@/utils/helpers';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/UI/Table/Table';
import { Button } from '@/Components/UI/Button/Button';
import { ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  className?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  manualPagination?: boolean;
  pageCount?: number;
  initialPageSize?: number;
  onPageChange?: (pageIndex: number, pageSize: number) => void;
  manualSorting?: boolean;
  onSortingChange?: (sorting: SortingState) => void;
  columnVisibility?: VisibilityState;
};

function DataTable<TData, TValue>({
  columns,
  data,
  className,
  isLoading,
  emptyMessage = "Aucune donnée",
  manualPagination = false,
  pageCount,
  initialPageSize = 10,
  onPageChange,
  manualSorting = false,
  onSortingChange,
  columnVisibility,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({ pageIndex: 0, pageSize: initialPageSize });
  const [visibility, setVisibility] = React.useState<VisibilityState>(columnVisibility ?? {});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
      columnVisibility: visibility,
    },
    manualPagination,
    pageCount: manualPagination && pageCount !== undefined ? pageCount : undefined,
    manualSorting,
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      setSorting(next);
      onSortingChange?.(next);
    },
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater(pagination) : updater;
      setPagination(next);
      onPageChange?.(next.pageIndex, next.pageSize);
    },
    onColumnVisibilityChange: setVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
  });

  return (
    <div className={cn('w-full', className)}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : (
                        <button
                          className={cn(
                            'inline-flex items-center gap-1',
                            canSort ? 'cursor-pointer select-none text-sabc-gray-900' : 'cursor-default'
                          )}
                          onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                          aria-label={canSort ? 'Trier' : undefined}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort && (
                            <ArrowUpDown
                              className={cn(
                                'ml-1 h-3.5 w-3.5 text-sabc-gray-400',
                                sorted ? 'text-sabc-red-primary' : ''
                              )}
                            />
                          )}
                        </button>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6">
                  Chargement...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6 text-sabc-gray-400">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between py-3">
        <div className="text-sm text-sabc-gray-400">
          Page {table.getState().pagination.pageIndex + 1} sur{' '}
          {manualPagination && pageCount !== undefined
            ? pageCount
            : table.getPageCount() || 1}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DataTable;

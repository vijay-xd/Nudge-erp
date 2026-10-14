import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface Column<T> {
  header: React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (row: T) => React.ReactNode;
  className?: string;
}

export interface DataTablePaginationProps {
  page: number;
  totalPages: number;
  total?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  pagination?: DataTablePaginationProps;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id?: string | number }>({
  columns,
  data,
  isLoading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting your filters or create a new entry.',
  emptyAction,
  pagination,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border border-slate-200 bg-white shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, index) => (
                <TableHead key={index} className={col.className}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, rIndex) => (
                <TableRow key={`skeleton-${rIndex}`}>
                  {columns.map((_, cIndex) => (
                    <TableCell key={`skeleton-cell-${cIndex}`}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center p-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    action={emptyAction}
                    className="border-none py-10"
                  />
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, rIndex) => (
                <TableRow
                  key={row.id ?? rIndex}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer hover:bg-slate-50' : undefined}
                >
                  {columns.map((col, cIndex) => (
                    <TableCell key={cIndex} className={col.className}>
                      {col.cell
                        ? col.cell(row)
                        : col.accessorKey
                        ? String((row as Record<string, unknown>)[col.accessorKey as string] ?? '—')
                        : null}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <div>
            Page <span className="font-medium text-slate-700">{pagination.page}</span> of{' '}
            <span className="font-medium text-slate-700">{pagination.totalPages}</span>
            {pagination.total !== undefined && ` (${pagination.total} total items)`}
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(1)}
              title="First Page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
              title="Previous Page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
              title="Next Page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon-sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              title="Last Page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Skeleton } from '@/Components/UI/Skeleton/Skeleton';

/** Skeleton for a stats card row (4 cards) */
function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-sabc-gray-200 bg-white p-5 dark:border-sabc-gray-800 dark:bg-sabc-gray-900">
          <Skeleton variant="text" className="mb-3 h-3 w-24" />
          <Skeleton className="mb-2 h-8 w-20" />
          <Skeleton variant="text" className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

/** Skeleton for a chart card */
function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-sabc-gray-200 bg-white p-5 dark:border-sabc-gray-800 dark:bg-sabc-gray-900">
      <Skeleton variant="text" className="mb-4 h-5 w-40" />
      <Skeleton className="h-[250px] w-full rounded-lg" />
    </div>
  );
}

/** Skeleton for a table/list section */
function TableSkeleton() {
  return (
    <div className="rounded-xl border border-sabc-gray-200 bg-white p-5 dark:border-sabc-gray-800 dark:bg-sabc-gray-900">
      <Skeleton variant="text" className="mb-4 h-5 w-48" />
      <Skeleton variant="table" rows={5} />
    </div>
  );
}

/** Full dashboard page skeleton */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="mb-2 h-7 w-64" />
          <Skeleton variant="text" className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      {/* Stats cards */}
      <StatsCardsSkeleton />

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  );
}

export { StatsCardsSkeleton, ChartSkeleton, TableSkeleton };

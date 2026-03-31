import React from 'react';

function Pulse({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-sabc-gray-200 ${className}`} />;
}

export function KpiSkeleton() {
  return (
    <div className="rounded-lg border border-sabc-gray-200 bg-white p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Pulse className="h-5 w-5 rounded-full" />
        <Pulse className="h-3 w-24" />
      </div>
      <Pulse className="h-8 w-16" />
      <Pulse className="h-2 w-full" />
    </div>
  );
}

export function CardSkeleton({ lines = 4 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-sabc-gray-200 bg-white">
      <div className="p-4 border-b border-sabc-gray-100">
        <Pulse className="h-5 w-40" />
      </div>
      <div className="p-4 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-sabc-gray-100">
            <div className="space-y-2 flex-1">
              <Pulse className="h-4 w-32" />
              <Pulse className="h-3 w-48" />
            </div>
            <Pulse className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Pulse className="h-7 w-64" />
          <Pulse className="h-4 w-40" />
        </div>
        <Pulse className="h-9 w-24 rounded-md" />
      </div>

      <Pulse className="h-14 w-full rounded-lg" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton lines={3} />
        <CardSkeleton lines={3} />
      </div>
    </div>
  );
}

export default DashboardSkeleton;

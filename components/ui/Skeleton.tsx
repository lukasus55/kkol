import React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-bg-300 ${className}`}
      {...props}
    />
  );
}

export function ListRowSkeleton({
  count = 3,
  className = ''
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center justify-between bg-bg-200 rounded-md p-4 sm:p-5 animate-pulse"
        >
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 flex-1">
            <div className="w-5 h-5 rounded-full bg-bg-300 shrink-0" />
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="h-4 bg-bg-300 rounded w-2/5 max-w-[200px]" />
              <div className="h-3 bg-bg-300 rounded w-1/4 max-w-[120px]" />
            </div>
          </div>
          <div className="h-4 bg-bg-300 rounded w-16 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({
  className = '',
  height = 'h-48'
}: {
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={`w-full bg-bg-200 rounded-md p-5 sm:p-6 animate-pulse flex flex-col justify-between ${height} ${className}`}
    >
      <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-bg-300">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 rounded-md bg-bg-300" />
          <div className="h-4 bg-bg-300 rounded w-32" />
        </div>
        <div className="h-3 bg-bg-300 rounded w-16" />
      </div>
      <div className="space-y-3 py-2">
        <div className="h-3.5 bg-bg-300 rounded w-3/4" />
        <div className="h-3.5 bg-bg-300 rounded w-1/2" />
      </div>
    </div>
  );
}

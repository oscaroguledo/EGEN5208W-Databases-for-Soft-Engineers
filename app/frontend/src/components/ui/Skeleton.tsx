import React from 'react';
interface SkeletonProps {
  className?: string;
}
export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} aria-hidden="true" />;
}
export function SkeletonText({
  lines = 1,
  className = ''



}: {lines?: number;className?: string;}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({
        length: lines
      }).map((_, i) =>
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`} />

      )}
    </div>);

}
export function StatCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
      <Skeleton className="w-11 h-11 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>);

}
export function CardSkeleton({ rows = 3 }: {rows?: number;}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="mb-5 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div className="space-y-3">
        {Array.from({
          length: rows
        }).map((_, i) =>
        <div
          key={i}
          className="p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-2">

            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        )}
      </div>
    </div>);

}
export function TableSkeleton({
  rows = 5,
  cols = 5



}: {rows?: number;cols?: number;}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 space-y-2">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
              {Array.from({
                length: cols
              }).map((_, i) =>
              <th key={i} className="px-6 py-3">
                  <Skeleton className="h-3 w-16" />
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
            {Array.from({
              length: rows
            }).map((_, i) =>
            <tr key={i}>
                {Array.from({
                length: cols
              }).map((_, j) =>
              <td key={j} className="px-6 py-4">
                    <Skeleton className={`h-4 ${j === 0 ? 'w-32' : 'w-20'}`} />
                  </td>
              )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>);

}
export function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-7 space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkeleton rows={3} />
        <CardSkeleton rows={2} />
        <CardSkeleton rows={2} />
      </div>
    </div>);

}
export function ProfileSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-10 w-72 mb-6 rounded-xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton rows={4} />
        </div>
        <CardSkeleton rows={3} />
      </div>
    </div>);

}
export function HealthHistorySkeleton() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Health History
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Track your fitness progress over time
        </p>
      </div>

      {/* Filter and Pagination Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="w-32 h-10" />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-slate-100 dark:border-slate-700"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="w-3 h-3 rounded-full" />
              </div>
              <div className="mb-2">
                <Skeleton className="h-8 w-28" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <Skeleton className="w-32 h-8" />
      </div>
    </div>
  );
}
export function ScheduleSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-24 w-full rounded-xl mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton rows={3} />
        <CardSkeleton rows={3} />
      </div>
    </div>);

}
export function AvailabilitySkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-52" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkeleton rows={3} />
        <div className="lg:col-span-2">
          <CardSkeleton rows={4} />
        </div>
      </div>
    </div>);

}
export function RoomBookingSkeleton() {
  return (
    <div>
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={4} />
        </div>
        <div className="lg:col-span-2">
          <CardSkeleton rows={4} />
        </div>
      </div>
    </div>);

}
export function EquipmentSkeleton() {
  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <TableSkeleton rows={6} cols={7} />
    </div>);

}
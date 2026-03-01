import React, { useEffect, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  className?: string;
}
export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  className = ''
}: PaginationProps) {
  // Always show pagination for better UX
  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };
  const from = totalItems && pageSize ? (currentPage - 1) * pageSize + 1 : null;
  const to =
  totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : null;
  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-1 ${className}`}>

      {/* Count info (detailed on sm+, compact on xs) */}
      {totalItems != null && from != null && to != null ? (
        <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 order-2 sm:order-1">
          Showing{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {from}–{to}
          </span>{' '}
          of{' '}
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {totalItems}
          </span>{' '}
          results
        </p>
      ) : (
        <div className="order-2 sm:order-1" />
      )}
      

      {/* Page buttons */}
      <div className="flex items-center gap-1 order-1 sm:order-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous page">

          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* Large screen: show page numbers */}
        <div className="hidden sm:flex items-center gap-1">
          {getPageNumbers().map((page, idx) =>
            page === '...' ? (
              <span
                key={`ellipsis-${idx}`}
                className="w-8 h-8 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
                …
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === currentPage ? 'bg-teal-600 text-white border border-teal-600 shadow-sm' : 'border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                aria-label={`Page ${page}`}
                aria-current={page === currentPage ? 'page' : undefined}>
                {page}
              </button>
            )
          )}
        </div>

        {/* small screens: show only prev/next buttons */}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Next page">

          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>);

}
// Hook for easy pagination state management
export function usePagination<T>(items: T[], pageSize: number = 8) {
  const [currentPage, setCurrentPage] = useState(1);
  // Remove the useEffect that was causing hook order issues
  // const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  // const safePage = Math.min(currentPage, totalPages);
  // const paginated = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  
  // Calculate pagination values directly without useEffect
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = items.slice((safePage - 1) * pageSize, safePage * pageSize);
  
  return {
    currentPage: safePage,
    totalPages,
    totalItems: items.length,
    pageSize,
    paginated,
    setCurrentPage
  };
}
import { useState, useCallback, useEffect } from 'react';

export interface PaginationMetadata {
  total: number;
  page: number;
  size: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  status: string;
  message: string;
  data: T[];
  pagination: PaginationMetadata;
  status_code: number;
}

interface UsePaginationOptions {
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationReturn<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
}

/**
 * Hook for server-side pagination with the backend API.
 * 
 * This hook manages pagination state and fetches data from the backend
 * with proper pagination parameters (skip/limit based on page/size).
 * 
 * @param fetchFn - Async function that takes skip and limit parameters
 * @param options - Pagination options (pageSize, initialPage)
 * @returns Pagination state and controls
 * 
 * @example
 * ```typescript
 * const { data, isLoading, currentPage, totalPages, setPage } = usePagination(
 *   async (skip, limit) => {
 *     const response = await fetchEquipment(skip, limit);
 *     return response;
 *   },
 *   { pageSize: 20 }
 * );
 * ```
 */
export function usePagination<T>(
  fetchFn: (skip: number, limit: number) => Promise<PaginatedResponse<T>>,
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { pageSize: initialPageSize = 20, initialPage = 1 } = options;

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const skip = (currentPage - 1) * pageSize;
      const response = await fetchFn(skip, pageSize);

      setData(response.data);
      
      if (response.pagination) {
        setTotalItems(response.pagination.total);
        setTotalPages(response.pagination.total_pages);
        // Sync page if backend returns different page
        if (response.pagination.page !== currentPage) {
          setCurrentPage(response.pagination.page);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, fetchFn]);

  // Fetch data when page or pageSize changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const setPageSizeWithReset = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    setPage,
    setPageSize: setPageSizeWithReset,
    refresh
  };
}

/**
 * Hook for combining client-side filtering with server-side pagination.
 * 
 * Use this when you need to filter data on the client before displaying,
 * but still want to fetch data from the server in paginated chunks.
 * 
 * @param fetchFn - Async function that takes skip and limit parameters
 * @param filterFn - Function to filter items on the client
 * @param options - Pagination options
 * @returns Filtered pagination state and controls
 */
export function useFilteredPagination<T>(
  fetchFn: (skip: number, limit: number) => Promise<PaginatedResponse<T>>,
  filterFn: (item: T) => boolean,
  options: UsePaginationOptions = {}
) {
  const pagination = usePagination(fetchFn, options);

  const filteredData = pagination.data.filter(filterFn);

  return {
    ...pagination,
    data: filteredData,
    totalItems: filteredData.length // Override with filtered count for display
  };
}

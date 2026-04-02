import { useCallback, useState } from 'react';
import { ActivityIcon, FilterIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { HealthHistorySkeleton } from '@/components/ui/Skeleton';
import { User, Member, HealthMetric } from '@/data/types';
import * as membersApi from '@/apis/members';
import { usePagination } from '@/hooks/useServerPagination';

interface HealthHistoryPageProps {
  currentUser: User;
  members: Member[];
}

const PAGE_SIZE = 8;

export function HealthHistoryPage({
  currentUser,
  members,
}: HealthHistoryPageProps) {
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const member = members.find((m) => m.user_id === currentUser.user_id);

  // Server-side pagination for health metrics
  const fetchHealthMetrics = useCallback(async (skip: number, limit: number) => {
    if (!member) return { status: 'success', message: '', data: [], pagination: { total: 0, page: 1, size: limit, total_pages: 1 }, status_code: 200 };
    const res = await membersApi.listHealthHistory(skip, limit);
    return res;
  }, [member]);

  const {
    data: healthMetrics,
    isLoading,
    currentPage,
    totalPages,
    totalItems,
    setPage,
  } = usePagination<HealthMetric>(fetchHealthMetrics, { pageSize: PAGE_SIZE });

  // Filter metrics for current member and apply client-side filter/search
  const myMetrics = member
    ? healthMetrics
        .filter((m: HealthMetric) => m.member_id === member.member_id)
        .filter((m: HealthMetric) => !filterType || m.metric_type === filterType)
        .filter((m: HealthMetric) => !searchTerm || 
          m.metric_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
          m.value.toString().includes(searchTerm)
        )
    : [];

  // Early returns (render skeleton or not-found) after hooks
  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="text-slate-500 dark:text-slate-400 mb-4">
            <div className="text-lg font-semibold">Member Profile Not Found</div>
            <div className="text-sm mt-2">
              Unable to find your member profile. Please contact support or try logging out and logging back in.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && healthMetrics.length === 0) return <HealthHistorySkeleton />;
  
  // Note: For metric types, we could fetch from a separate endpoint
  const metricTypes = [...new Set(healthMetrics.map((m) => m.metric_type))];

  const filterOptions = [
    {
      value: '',
      label: 'All Types'
    },
    ...metricTypes.map((type) => ({
      value: type,
      label: type
    }))
  ];

  const typeDotColors: Record<string, string> = {
    Weight: 'bg-blue-400',
    'Heart Rate': 'bg-red-400',
    BMI: 'bg-purple-400',
    'Blood Pressure': 'bg-orange-400',
    'Body Fat': 'bg-teal-400'
  };

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

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <FilterIcon className="w-4 h-4 text-slate-400" />
          <Dropdown
            value={filterType}
            onChange={setFilterType}
            options={filterOptions}
            placeholder="Filter by type"
          />
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Search metrics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>
      </div>

      {/* Results count */}
      {(searchTerm || filterType) && (
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Found {myMetrics.length} metric{myMetrics.length !== 1 ? 's' : ''} 
          {searchTerm && ` matching "${searchTerm}"`}
          {filterType && ` of type "${filterType}"`}
        </div>
      )}

      {/* Metrics Grid */}
      <Card>
        {myMetrics.length === 0 ? (
          <div className="py-8 text-center">
            <ActivityIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {(searchTerm || filterType) 
                ? 'No health metrics found matching your criteria.' 
                : 'No health metrics recorded yet.'
              }
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              {(searchTerm || filterType) 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Start tracking your metrics in Profile.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {myMetrics.map((m) => (
              <div
                key={m.metric_id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {m.metric_type}
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(m.recorded_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${typeDotColors[m.metric_type] || 'bg-slate-400'}`} />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {m.value}{' '}
                  <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                    {m.unit}
                  </span>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  Recorded on {new Date(m.recorded_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pagination */}
      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
        />
      </div>
    </div>
  );
}

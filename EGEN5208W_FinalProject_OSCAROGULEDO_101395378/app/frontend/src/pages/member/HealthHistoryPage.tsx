import { useCallback, useState } from 'react';
import { ActivityIcon, FilterIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Dropdown } from '@/components/ui/Dropdown';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { HealthHistorySkeleton } from '@/components/ui/Skeleton';
import { User, HealthMetric } from '@/data/types';
import * as membersApi from '@/apis/members';
import { usePagination } from '@/hooks/useServerPagination';

interface HealthHistoryPageProps {
  currentUser: User;
}

const TYPE_COLORS: Record<string, string> = {
  Weight: 'bg-blue-400', 'Heart Rate': 'bg-red-400',
  BMI: 'bg-purple-400', 'Blood Pressure': 'bg-orange-400', 'Body Fat': 'bg-teal-400',
};

const PAGE_SIZE = 8;

export function HealthHistoryPage({ currentUser: _currentUser }: HealthHistoryPageProps) {
  const [filterType, setFilterType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMetrics = useCallback(async (skip: number, limit: number) => {
    return membersApi.listHealthHistory(skip, limit, filterType || undefined);
  }, [filterType]);

  const { data: metrics, isLoading, currentPage, totalPages, totalItems, setPage } =
    usePagination<HealthMetric>(fetchMetrics, { pageSize: PAGE_SIZE });

  const displayed = searchTerm
    ? metrics.filter(m =>
        m.metric_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(m.metric_value).includes(searchTerm)
      )
    : metrics;

  const metricTypes = [...new Set(metrics.map(m => m.metric_type))];
  const filterOptions = [
    { value: '', label: 'All Types' },
    ...metricTypes.map(t => ({ value: t, label: t })),
  ];

  if (isLoading && metrics.length === 0) return <HealthHistorySkeleton />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Health History</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track your fitness progress over time</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <FilterIcon className="w-4 h-4 text-slate-400" />
          <Dropdown value={filterType} onChange={setFilterType} options={filterOptions} placeholder="Filter by type" />
        </div>
        <Input placeholder="Search metrics…" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
      </div>

      {(searchTerm || filterType) && (
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Found {displayed.length} metric{displayed.length !== 1 ? 's' : ''}
          {searchTerm && ` matching "${searchTerm}"`}
          {filterType && ` of type "${filterType}"`}
        </div>
      )}

      <Card>
        {displayed.length === 0 ? (
          <div className="py-8 text-center">
            <ActivityIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {(searchTerm || filterType) ? 'No metrics match your criteria.' : 'No health metrics recorded yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map(m => (
              <div key={m.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{m.metric_type}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">{new Date(m.recorded_at).toLocaleDateString()}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${TYPE_COLORS[m.metric_type] || 'bg-slate-400'}`} />
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">{m.metric_value}</div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(m.recorded_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="mt-6 flex justify-center">
        <Pagination currentPage={currentPage} totalPages={totalPages}
          onPageChange={setPage} totalItems={totalItems} pageSize={PAGE_SIZE} />
      </div>
    </div>
  );
}

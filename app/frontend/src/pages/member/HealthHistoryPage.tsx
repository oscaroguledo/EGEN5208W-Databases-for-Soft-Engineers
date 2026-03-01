import React, { useEffect, useState } from 'react';
import { ActivityIcon, FilterIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Dropdown } from '../../components/ui/Dropdown';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { HealthHistorySkeleton } from '../../components/ui/Skeleton';
import { User, Member, HealthMetric } from '../../data/types';

interface HealthHistoryPageProps {
  currentUser: User;
  members: Member[];
  healthMetrics: HealthMetric[];
}

export function HealthHistoryPage({
  currentUser,
  members,
  healthMetrics
}: HealthHistoryPageProps) {
  console.log('HealthHistoryPage component rendering!', {
    currentUser,
    members: members.length,
    healthMetrics: healthMetrics.length
  });
  
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);
  
  const member = members.find((m) => m.user_id === currentUser.user_id);
  // compute metrics safely (may be empty if member not found)
  const myMetrics = member
    ? healthMetrics
        .filter((m) => m.member_id === member.member_id)
        .filter((m) => !filterType || m.metric_type === filterType)
        .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
    : [];

  // Call pagination hook unconditionally to preserve hooks order
  const pagination = usePagination(myMetrics, 8);
  
  // Debug pagination data
  console.log('Pagination Debug:', {
    myMetricsLength: myMetrics.length,
    currentPage: pagination.currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.totalItems,
    pageSize: pagination.pageSize,
    paginatedLength: pagination.paginated.length
  });

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

  if (loading) return <HealthHistorySkeleton />;
  
  const metricTypes = [
    ...new Set(
      healthMetrics.
        filter((m) => m.member_id === member.member_id).
        map((m) => m.metric_type)
    )
  ];

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

  const typeColors: Record<string, string> = {
    Weight: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    'Heart Rate': 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
    BMI: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    'Blood Pressure': 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    'Body Fat': 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300'
  };

  const typeDotColors: Record<string, string> = {
    Weight: 'bg-blue-400',
    'Heart Rate': 'bg-red-400',
    BMI: 'bg-purple-400',
    'Blood Pressure': 'bg-orange-400',
    'Body Fat': 'bg-teal-400'
  };

  return (
    <div>
      {/* Debug test - this should always be visible */}
      <div className="bg-red-500 text-white p-2 mb-4">
        HealthHistoryPage is rendering! Loading: {loading ? 'YES' : 'NO'}
      </div>
      
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
          <FilterIcon className="w-4 h-4 text-slate-400" />
          <Dropdown
            value={filterType}
            onChange={setFilterType}
            options={filterOptions}
            placeholder="Filter by type"
          />
        </div>
      </div>

      {/* Metrics Grid */}
      <Card>
        {pagination.paginated.length === 0 ? (
          <div className="py-8 text-center">
            <ActivityIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              No health metrics recorded yet.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Start tracking your metrics in Profile.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pagination.paginated.map((m) => (
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

      {/* Pagination - Always show for better UX */}
      <div className="mt-6 flex justify-center">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={pagination.setCurrentPage}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
        />
      </div>
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  const member = members.find((m) => m.user_id === currentUser.user_id);

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

  const myMetrics = healthMetrics.
    filter((m) => m.member_id === member.member_id).
    filter((m) => !filterType || m.metric_type === filterType).
    sort(
      (a, b) =>
      new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
    );

  const pagination = usePagination(myMetrics, 8);

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Health History
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Track your fitness progress over time
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <FilterIcon className="w-4 h-4 text-slate-400" />
          <Dropdown
            value={filterType}
            onChange={setFilterType}
            options={filterOptions}
            placeholder="Filter by type"
          />
                          Value
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Unit
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Recorded At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                      {pagination.paginated.map((m) =>
                    <tr
                      key={m.metric_id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-100">

                          <td className="px-4 sm:px-6 py-3.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                            {m.metric_id}
                          </td>
                          <td className="px-4 sm:px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              <span
                            className={`w-2 h-2 rounded-full flex-shrink-0 ${typeDotColors[m.metric_type] || 'bg-slate-400'}`} />

                              <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[m.metric_type] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>

                                {m.metric_type}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                            {m.value}
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                            {m.unit}
                          </td>
                          <td className="px-4 sm:px-6 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                            {new Date(m.recorded_at).toLocaleString()}
                          </td>
                        </tr>
                    )}
                    </tbody>
                  </table>
                </div>
                {pagination.totalPages > 1 &&
              <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
                    <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={pagination.setCurrentPage}
                  totalItems={pagination.totalItems}
                  pageSize={pagination.pageSize} />

                  </div>
              }
              </>
            }
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              Summary
            </h3>
            <div className="space-y-3">
              <div
                className="text-center p-4 rounded-xl"
                style={{
                  background: 'linear-gradient(135deg, #f0fdfa, #ccfbf1)'
                }}>

                <div className="text-3xl font-bold text-teal-600">
                  {myMetrics.length}
                </div>
                <div className="text-xs text-teal-700 font-medium mt-0.5">
                  Total Records
                </div>
              </div>
              {metricTypes.map((type) => {
                const count = healthMetrics.filter(
                  (m) =>
                  m.member_id === member.member_id && m.metric_type === type
                ).length;
                const latest = healthMetrics.
                filter(
                  (m) =>
                  m.member_id === member.member_id &&
                  m.metric_type === type
                ).
                sort(
                  (a, b) =>
                  new Date(b.recorded_at).getTime() -
                  new Date(a.recorded_at).getTime()
                )[0];
                return (
                  <div
                    key={type}
                    className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">

                    <div className="flex items-center gap-1.5 mb-1">
                      <span
                        className={`w-2 h-2 rounded-full ${typeDotColors[type] || 'bg-slate-400'}`} />

                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {type}
                      </div>
                    </div>
                    <div className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {latest?.value}{' '}
                      <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
                        {latest?.unit}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {count} record{count !== 1 ? 's' : ''}
                    </div>
                  </div>);

              })}
            </div>
          </Card>
        </div>
      </div>
    </div>);

}
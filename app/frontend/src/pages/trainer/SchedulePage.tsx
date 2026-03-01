import React, { useEffect, useState } from 'react';
import { CalendarIcon, UsersIcon, UserIcon } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/ui/Badge';
import { ScheduleSkeleton } from '../../components/ui/Skeleton';
import {
  User,
  Trainer,
  PersonalSession,
  GroupClass,
  Member,
  Room } from
'../../data/types';
interface SchedulePageProps {
  currentUser: User;
  trainers: Trainer[];
  personalSessions: PersonalSession[];
  groupClasses: GroupClass[];
  members: Member[];
  rooms: Room[];
}
export function SchedulePage({
  currentUser,
  trainers,
  personalSessions,
  groupClasses,
  members,
  rooms
}: SchedulePageProps) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);
  const trainer = trainers.find((t) => t.user_id === currentUser.user_id);
  const today = new Date().toISOString().split('T')[0];
  const upcomingSessions = trainer
    ? personalSessions
        .filter((s) => s.trainer_id === trainer.trainer_id && s.session_date >= today && s.status === 'scheduled')
        .sort((a, b) => a.session_date.localeCompare(b.session_date) || a.start_time.localeCompare(b.start_time))
    : [];

  const upcomingClasses = trainer
    ? groupClasses
        .filter((c) => c.trainer_id === trainer.trainer_id && c.class_date >= today && c.status !== 'cancelled')
        .sort((a, b) => a.class_date.localeCompare(b.class_date) || a.start_time.localeCompare(b.start_time))
    : [];

  const paginationSessions = usePagination(upcomingSessions, 6);
  const paginationClasses = usePagination(upcomingClasses, 6);

  if (!trainer)
    return <div className="text-slate-500 dark:text-slate-400">Trainer profile not found.</div>;

  if (loading) return <ScheduleSkeleton />;
  const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          My Schedule
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Upcoming sessions and classes
        </p>
      </div>

      {/* Trainer banner */}
      <div
        className="mb-6 rounded-xl overflow-hidden border border-teal-200 dark:border-teal-800"
        style={{
          background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)'
        }}>

        <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {trainer.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-base">
              {trainer.full_name}
            </div>
            <div className="text-teal-100 text-sm">
              {trainer.specialization}
            </div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-3xl font-bold text-white">
              {upcomingSessions.length + upcomingClasses.length}
            </div>
            <div className="text-teal-100 text-xs">Upcoming assignments</div>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-2 bg-black/10 flex gap-6">
          <div className="text-xs text-teal-100">
            <span className="font-semibold text-white">
              {upcomingSessions.length}
            </span>{' '}
            personal sessions
          </div>
          <div className="text-xs text-teal-100">
            <span className="font-semibold text-white">
              {upcomingClasses.length}
            </span>{' '}
            group classes
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Sessions */}
        <Card padding="none">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-teal-600" />
              Personal Training Sessions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{paginationSessions.totalItems} upcoming</p>
          </div>
          {paginationSessions.totalItems === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">No upcoming personal sessions.</p>
            </div>
          ) : (

          <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {paginationSessions.paginated.map((s) => {
              const member = members.find((m) => m.member_id === s.member_id);
              const room = rooms.find((r) => r.room_id === s.room_id);
              return (
                <div
                  key={s.session_id}
                  className="px-4 sm:px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">

                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(s.session_date)}
                      </div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {s.start_time} – {s.end_time}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                      <span>
                        <span className="font-medium">Member:</span>{' '}
                        {member?.full_name}
                      </span>
                      <span>
                        <span className="font-medium">Room:</span>{' '}
                        {room?.room_name}
                      </span>
                    </div>
                    {s.notes &&
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 italic">
                        "{s.notes}"
                      </div>
                  }
                  </div>);

            })}
            </div>
          )}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <Pagination
              currentPage={paginationSessions.currentPage}
              totalPages={paginationSessions.totalPages}
              onPageChange={paginationSessions.setCurrentPage}
              totalItems={paginationSessions.totalItems}
              pageSize={paginationSessions.pageSize}
            />
          </div>
        </Card>

        {/* Group Classes */}
        <Card padding="none">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-blue-600" />
              Group Fitness Classes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{paginationClasses.totalItems} upcoming</p>
          </div>
          {paginationClasses.totalItems === 0 ? (
            <div className="px-6 py-12 text-center">
              <UsersIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">No upcoming group classes.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {paginationClasses.paginated.map((c) => {
                const room = rooms.find((r) => r.room_id === c.room_id);
                const fillPct = Math.round((c.current_enrollment / c.max_capacity) * 100);
                return (
                  <div key={c.class_id} className="px-4 sm:px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{c.class_name}</div>
                      <StatusBadge status={c.status} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{formatDate(c.class_date)} · {c.start_time} – {c.end_time}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mb-2.5"><span className="font-medium">Room:</span> {room?.room_name}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full transition-all ${fillPct >= 100 ? 'bg-red-400' : fillPct >= 75 ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ width: `${Math.min(fillPct, 100)}%` }} />
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{c.current_enrollment}/{c.max_capacity}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <Pagination currentPage={paginationClasses.currentPage} totalPages={paginationClasses.totalPages} onPageChange={paginationClasses.setCurrentPage} totalItems={paginationClasses.totalItems} pageSize={paginationClasses.pageSize} />
          </div>
        </Card>
      </div>
    </div>);

}
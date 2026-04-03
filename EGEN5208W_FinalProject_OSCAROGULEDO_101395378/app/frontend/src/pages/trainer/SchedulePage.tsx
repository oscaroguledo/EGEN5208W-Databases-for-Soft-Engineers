import { useCallback, useEffect, useState } from 'react';
import { CalendarIcon, UsersIcon, UserIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/useServerPagination';
import { StatusBadge } from '@/components/ui/Badge';
import { ScheduleSkeleton } from '@/components/ui/Skeleton';
import { User, Trainer, TrainingSession, GroupClass, Member, Room } from '@/data/types';
import * as trainersApi from '@/apis/trainers';

interface SchedulePageProps {
  currentUser: User;
  trainers: Trainer[];
  trainingSessions: TrainingSession[];
  groupClasses: GroupClass[];
  members: Member[];
  rooms: Room[];
}

export function SchedulePage({ currentUser, members, rooms }: SchedulePageProps) {
  const [loading, setLoading] = useState(true);
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [upcomingSessions, setUpcomingSessions] = useState<TrainingSession[]>([]);
  const [upcomingClasses, setUpcomingClasses] = useState<GroupClass[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [trainerData, scheduleData] = await Promise.all([
          trainersApi.getTrainerMe(),
          trainersApi.getSchedule(30),
        ]);
        if (!mounted) return;
        if (trainerData) setTrainer(trainerData as Trainer);
        if (scheduleData) {
          setUpcomingSessions((scheduleData as any).upcoming_sessions ?? []);
          setUpcomingClasses((scheduleData as any).upcoming_classes ?? []);
        }
      } catch {
        // handled by empty state
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [currentUser.id]);

  const fetchSessions = useCallback(async (skip: number, limit: number) => {
    const filtered = upcomingSessions.slice(skip, skip + limit);
    return {
      status: 'success', message: '', status_code: 200,
      data: filtered,
      pagination: { total: upcomingSessions.length, page: Math.floor(skip / limit) + 1, size: limit, total_pages: Math.ceil(upcomingSessions.length / limit) || 1 },
    };
  }, [upcomingSessions]);

  const fetchClasses = useCallback(async (skip: number, limit: number) => {
    const filtered = upcomingClasses.slice(skip, skip + limit);
    return {
      status: 'success', message: '', status_code: 200,
      data: filtered,
      pagination: { total: upcomingClasses.length, page: Math.floor(skip / limit) + 1, size: limit, total_pages: Math.ceil(upcomingClasses.length / limit) || 1 },
    };
  }, [upcomingClasses]);

  const { data: sessionsData, currentPage: sessionsPage, totalPages: sessionsTotalPages, totalItems: sessionsTotalItems, setPage: setSessionsPage } =
    usePagination<TrainingSession>(fetchSessions, { pageSize: 6 });

  const { data: classesData, currentPage: classesPage, totalPages: classesTotalPages, totalItems: classesTotalItems, setPage: setClassesPage } =
    usePagination<GroupClass>(fetchClasses, { pageSize: 6 });

  if (loading) return <ScheduleSkeleton />;
  if (!trainer) return <div className="text-slate-500 dark:text-slate-400">Trainer profile not found.</div>;

  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">My Schedule</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Upcoming sessions and classes</p>
      </div>

      {/* Trainer banner */}
      <div className="mb-6 rounded-xl overflow-hidden border border-teal-200 dark:border-teal-800"
        style={{ background: 'linear-gradient(135deg,#0d9488 0%,#0f766e 100%)' }}>
        <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {trainer.full_name.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-base">{trainer.full_name}</div>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-3xl font-bold text-white">{upcomingSessions.length + upcomingClasses.length}</div>
            <div className="text-teal-100 text-xs">Upcoming assignments</div>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-2 bg-black/10 flex gap-6">
          <div className="text-xs text-teal-100"><span className="font-semibold text-white">{upcomingSessions.length}</span> personal sessions</div>
          <div className="text-xs text-teal-100"><span className="font-semibold text-white">{upcomingClasses.length}</span> group classes</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Sessions */}
        <Card padding="none">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-teal-600" /> Personal Training Sessions
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{sessionsTotalItems} upcoming</p>
          </div>
          {sessionsTotalItems === 0 ? (
            <div className="px-6 py-12 text-center">
              <CalendarIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">No upcoming personal sessions.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {sessionsData.map(s => {
                const member = members.find(m => m.id === s.member_id);
                const room = rooms.find(r => r.id === s.room_id);
                return (
                  <div key={s.id} className="px-4 sm:px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start justify-between mb-1">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{formatDate(s.session_date)}</div>
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{s.start_time} – {s.end_time}</div>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                      {member && <span><span className="font-medium">Member:</span> {member.full_name}</span>}
                      {room && <span><span className="font-medium">Room:</span> {room.name}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <Pagination currentPage={sessionsPage} totalPages={sessionsTotalPages}
              onPageChange={setSessionsPage} totalItems={sessionsTotalItems} pageSize={6} />
          </div>
        </Card>

        {/* Group Classes */}
        <Card padding="none">
          <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-blue-600" /> Group Fitness Classes
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{classesTotalItems} upcoming</p>
          </div>
          {classesTotalItems === 0 ? (
            <div className="px-6 py-12 text-center">
              <UsersIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-slate-400 dark:text-slate-500 text-sm">No upcoming group classes.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {classesData.map(c => {
                const room = rooms.find(r => r.id === c.room_id);
                return (
                  <div key={c.id} className="px-4 sm:px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">{c.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">{formatDate(c.class_date)} · {c.start_time} – {c.end_time}</div>
                    {room && <div className="text-xs text-slate-600 dark:text-slate-300"><span className="font-medium">Room:</span> {room.name}</div>}
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Max: {c.max_capacity}</div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
            <Pagination currentPage={classesPage} totalPages={classesTotalPages}
              onPageChange={setClassesPage} totalItems={classesTotalItems} pageSize={6} />
          </div>
        </Card>
      </div>
    </div>
  );
}

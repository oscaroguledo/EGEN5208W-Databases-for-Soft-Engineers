import { useCallback, useEffect, useState } from 'react';
import { ActivityIcon, TargetIcon, CalendarIcon, UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { User, Member, HealthMetric, TrainingSession, Trainer, Room, FitnessGoal } from '@/data/types';
import * as membersApi from '@/apis/members';
import * as trainersApi from '@/apis/trainers';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { usePagination } from '@/hooks/useServerPagination';
import { Pagination } from '@/components/ui/Pagination';

interface DashboardPageProps {
  currentUser: User;
  members: Member[];
  healthMetrics: HealthMetric[];
  trainingSessions: TrainingSession[];
  trainers: Trainer[];
  rooms: Room[];
  onBookSession?: (payload: { trainer_id: string; room_id: string; session_date: string; start_time: string; end_time: string }) => Promise<any>;
  onAddSession?: (session: TrainingSession) => void;
}

const PAGE_SIZE = 4;

export function DashboardPage({ currentUser, rooms, onBookSession, onAddSession }: DashboardPageProps) {
  const [member, setMember]                   = useState<Member | null>(null);
  const [myMetrics, setMyMetrics]             = useState<HealthMetric[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<TrainingSession[]>([]);
  const [sessionTrainers, setSessionTrainers] = useState<Trainer[]>([]);
  const [bookingOpen, setBookingOpen]         = useState(false);
  const [bookingForm, setBookingForm]         = useState({
    trainer_id: '',
    room_id: rooms[0]?.id ?? '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [memberData, dashData, metricsData, trainersData] = await Promise.allSettled([
          membersApi.getMemberMe(),
          membersApi.getDashboard(30),
          membersApi.listHealthHistory(0, 100),
          trainersApi.listTrainersPublic(),
        ]);
        if (!mounted) return;
        if (memberData.status === 'fulfilled') setMember(memberData.value as Member);
        if (dashData.status === 'fulfilled' && dashData.value) {
          const d = dashData.value as any;
          setUpcomingSessions(d.upcoming_sessions ?? []);
        }
        if (metricsData.status === 'fulfilled') {
          const val = metricsData.value as any;
          setMyMetrics(Array.isArray(val) ? val : (val?.data ?? []));
        }
        if (trainersData.status === 'fulfilled') {
          const val = trainersData.value as any;
          const list = Array.isArray(val) ? val : (val?.data ?? []);
          setSessionTrainers(list);
          if (list.length > 0) setBookingForm(f => ({ ...f, trainer_id: list[0].id }));
        }
      } catch { /* best-effort */ }
    })();
    return () => { mounted = false; };
  }, [currentUser.id]);
  const fetchGoals = useCallback(async (skip: number, limit: number) => {
    return membersApi.listGoals(undefined, skip, limit);
  }, []);

  const { data: goals, currentPage: goalsPage, totalPages: goalsTotalPages,
    totalItems: goalsTotalItems, setPage: setGoalsPage } = usePagination<FitnessGoal>(fetchGoals, { pageSize: PAGE_SIZE });

  // Latest metrics per type
  const metricTypes = [...new Set(myMetrics.map(m => m.metric_type))];
  const latestMetrics = metricTypes.map(type =>
    myMetrics.filter(m => m.metric_type === type)
      .sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]
  );

  if (!member) return <DashboardSkeleton />;

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await (onBookSession ? onBookSession(bookingForm) : membersApi.bookSession(bookingForm));
      if (res && onAddSession) onAddSession(res as TrainingSession);
      toast.success('Session booked successfully.');
      setBookingOpen(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to book session.');
    }
  };

  const metricColors = [
    'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300',
    'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300',
    'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300',
  ];

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back, {member.full_name.split(' ')[0]}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here's your fitness overview for today</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
        {[
          { icon: <ActivityIcon className="w-5 h-5 text-teal-600" />, value: myMetrics.length, label: 'Metric Records', bg: 'linear-gradient(135deg,#ccfbf1,#99f6e4)' },
          { icon: <UsersIcon className="w-5 h-5 text-blue-600" />, value: 0, label: 'Classes Attended', bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
          { icon: <TargetIcon className="w-5 h-5 text-amber-600" />, value: goals.length, label: 'Active Goals', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
          { icon: <CalendarIcon className="w-5 h-5 text-emerald-600" />, value: upcomingSessions.length, label: 'Upcoming Sessions', bg: 'linear-gradient(135deg,#d1fae5,#a7f3d0)' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{s.value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Metrics */}
        <Card>
          <CardHeader title="Latest Metrics" subtitle="Most recent per type" />
          {latestMetrics.length === 0 ? (
            <div className="py-8 text-center">
              <ActivityIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No metrics recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestMetrics.map((m, i) => (
                <div key={m.id} className={`p-3 rounded-xl border ${metricColors[i % metricColors.length]}`}>
                  <div className="text-xs font-medium opacity-70">{m.metric_type}</div>
                  <div className="text-xl font-bold mt-0.5">{m.metric_value}</div>
                  <div className="text-xs opacity-60 mt-0.5">{new Date(m.recorded_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Active Goals */}
        <Card>
          <CardHeader title="Active Goals" subtitle={`${goals.length} goal${goals.length !== 1 ? 's' : ''}`} />
          {goals.length === 0 ? (
            <div className="py-8 text-center">
              <TargetIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No goals yet. Add one in Profile.</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {goals.map(g => (
                  <div key={g.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{g.description}</span>
                      <Badge variant="teal">Active</Badge>
                    </div>
                    {g.target_value && (
                      <div className="text-xs font-semibold text-teal-600 dark:text-teal-400">Target: {g.target_value}</div>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-700">
                <Pagination currentPage={goalsPage} totalPages={goalsTotalPages}
                  onPageChange={setGoalsPage} totalItems={goalsTotalItems} pageSize={PAGE_SIZE} />
              </div>
            </>
          )}
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader title="Upcoming Sessions" subtitle="Personal training" />
          {upcomingSessions.length === 0 ? (
            <div className="py-8 text-center">
              <CalendarIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No upcoming sessions.</p>
              <div className="mt-4">
                <button className="text-sm text-teal-600 hover:underline" onClick={() => setBookingOpen(o => !o)}>
                  {bookingOpen ? 'Cancel' : 'Book a Session'}
                </button>
                {bookingOpen && (
                  <form onSubmit={handleBookSession} className="mt-3 space-y-2 max-w-md mx-auto text-left">
                    <div>
                      <label className="text-xs text-slate-500">Trainer</label>
                      <select className="w-full mt-1 p-2 border rounded" value={bookingForm.trainer_id}
                        onChange={e => setBookingForm(f => ({ ...f, trainer_id: e.target.value }))}>
                        {sessionTrainers.map((t: Trainer) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-500">Room</label>
                      <select className="w-full mt-1 p-2 border rounded" value={bookingForm.room_id}
                        onChange={e => setBookingForm(f => ({ ...f, room_id: e.target.value }))}>
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="date" className="p-2 border rounded" value={bookingForm.session_date}
                        onChange={e => setBookingForm(f => ({ ...f, session_date: e.target.value }))} />
                      <input type="time" className="p-2 border rounded" value={bookingForm.start_time}
                        onChange={e => setBookingForm(f => ({ ...f, start_time: e.target.value }))} />
                      <input type="time" className="p-2 border rounded" value={bookingForm.end_time}
                        onChange={e => setBookingForm(f => ({ ...f, end_time: e.target.value }))} />
                    </div>
                    <div className="text-right">
                      <button type="submit" className="px-3 py-2 bg-teal-600 text-white rounded">Confirm Booking</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map(s => {
                const trainer = sessionTrainers.find(t => t.id === s.trainer_id);
                const room = rooms.find(r => r.id === s.room_id);
                return (
                  <div key={s.id} className="p-3 rounded-xl border border-teal-100 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/20" style={{ borderLeft: '3px solid #0d9488' }}>
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {new Date(s.session_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.start_time} – {s.end_time}</div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 space-y-0.5">
                      {trainer && <div><span className="font-medium">Trainer:</span> {trainer.full_name}</div>}
                      {room && <div><span className="font-medium">Room:</span> {room.name}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

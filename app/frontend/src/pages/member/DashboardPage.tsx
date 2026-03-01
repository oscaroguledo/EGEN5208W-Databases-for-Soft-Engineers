import React, { useEffect, useState } from 'react';
import { ActivityIcon, TargetIcon, CalendarIcon, UsersIcon } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { Badge } from '../../components/ui/Badge';
import { DashboardSkeleton } from '../../components/ui/Skeleton';
import {
  User,
  Member,
  HealthMetric,
  FitnessGoal,
  ClassRegistration,
  PersonalSession,
  Trainer,
  Room } from
'../../data/types';
interface DashboardPageProps {
  currentUser: User;
  members: Member[];
  healthMetrics: HealthMetric[];
  fitnessGoals: FitnessGoal[];
  classRegistrations: ClassRegistration[];
  personalSessions: PersonalSession[];
  trainers: Trainer[];
  rooms: Room[];
  onAddSession?: (s: PersonalSession) => void;
  onBookSession?: (payload: { trainer_id: string; room_id: string; session_date: string; start_time: string; end_time: string; notes?: string }) => Promise<any> | void;
}
export function DashboardPage({
  currentUser,
  members,
  healthMetrics,
  fitnessGoals,
  classRegistrations,
  personalSessions,
  trainers,
  rooms
}: DashboardPageProps) {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Debug: Log current data
  console.log('Dashboard Data:', {
    currentUser,
    members: members.length,
    healthMetrics: healthMetrics.length,
    fitnessGoals: fitnessGoals.length,
    classRegistrations: classRegistrations.length,
    personalSessions: personalSessions.length,
    trainers: trainers.length,
    rooms: rooms.length
  });

  const member = members.find((m) => m.user_id === currentUser.user_id);
  console.log('Found member:', member, 'Looking for user_id:', currentUser.user_id);
  const mid = member?.member_id ?? -1;
  const activeGoals = fitnessGoals.filter(
    (g) => g.member_id === mid && g.is_active
  );
  const goalsPagination = usePagination(activeGoals, 4);

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="text-slate-500 dark:text-slate-400 mb-4">
            <div className="text-lg font-semibold">Member Profile Not Found</div>
            <div className="text-sm mt-2">
              Unable to find your member profile. Please contact support or try logging out and logging back in.
            </div>
            <div className="text-xs mt-4 text-slate-400">
              Debug Info: User ID: {currentUser.user_id}, Total Members: {members.length}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) return <DashboardSkeleton />;
  const myMetrics = healthMetrics.filter((m) => m.member_id === mid);
  const metricTypes = [...new Set(myMetrics.map((m) => m.metric_type))];
  const latestMetrics = metricTypes.map(
    (type) =>
    myMetrics.
    filter((m) => m.metric_type === type).
    sort(
      (a, b) =>
      new Date(b.recorded_at).getTime() -
      new Date(a.recorded_at).getTime()
    )[0]
  );
  // activeGoals and pagination are initialized above to keep hooks stable
  const classesAttended = classRegistrations.filter(
    (r) => r.member_id === mid && r.attended
  ).length;
  const today = new Date().toISOString().split('T')[0];
  const upcomingSessions = personalSessions.
  filter(
    (s) =>
    s.member_id === mid &&
    s.session_date >= today &&
    s.status === 'scheduled'
  ).
  sort(
    (a, b) =>
    a.session_date.localeCompare(b.session_date) ||
    a.start_time.localeCompare(b.start_time)
  );
  const [bookingOpen, setBookingOpen] = React.useState(false);
  const [bookingForm, setBookingForm] = React.useState({
    trainer_id: trainers[0]?.trainer_id ?? -1,
    room_id: rooms[0]?.room_id ?? -1,
    session_date: today,
    start_time: '09:00',
    end_time: '10:00',
    notes: ''
  });
  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      trainer_id: String(bookingForm.trainer_id),
      room_id: String(bookingForm.room_id),
      session_date: bookingForm.session_date,
      start_time: bookingForm.start_time,
      end_time: bookingForm.end_time,
      notes: bookingForm.notes
    };
    // Prefer app-level booking handler when provided
    if (typeof onBookSession === 'function') {
      try {
        const created = await onBookSession(payload);
        if (created) {
          toast.success('Session booked successfully.');
          setBookingOpen(false);
          return;
        }
      } catch (err) {
        // continue to fallback
      }
    }
    // Fallback: try members API directly
    try {
      const membersApi = await import('../../apis/members');
      const res = await membersApi.bookSession(payload);
      const created = res && (res.session || res);
      if (created && onAddSession) {
        onAddSession(created as PersonalSession);
        toast.success('Session booked successfully.');
        setBookingOpen(false);
        return;
      }
    } catch (err) {
      // fallback to local creation
    }
    if (onAddSession) {
      const newId = Math.max(...personalSessions.map((s) => s.session_id), 0) + 1;
      const created: PersonalSession = {
        session_id: newId,
        member_id: mid,
        trainer_id: bookingForm.trainer_id,
        room_id: bookingForm.room_id,
        session_date: bookingForm.session_date,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        status: 'scheduled',
        notes: bookingForm.notes
      };
      onAddSession(created);
      toast.success('Session booked (local).');
      setBookingOpen(false);
    }
  };
  const metricColors = [
  'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300',
  'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300',
  'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-300',
  'bg-teal-50 dark:bg-teal-900/30 border-teal-200 dark:border-teal-700 text-teal-700 dark:text-teal-300'];

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Welcome back, {member.full_name.split(' ')[0]}!
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Here's your fitness overview for today
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-7">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #ccfbf1, #99f6e4)'
            }}>

            <ActivityIcon className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {myMetrics.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Metric Records
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)'
            }}>

            <UsersIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {classesAttended}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Classes Attended
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #fef3c7, #fde68a)'
            }}>

            <TargetIcon className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {activeGoals.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Active Goals
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 flex items-center gap-3">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
            }}>

            <CalendarIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {upcomingSessions.length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight">
              Upcoming Sessions
            </div>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Metrics */}
        <div>
          <Card>
            <CardHeader
              title="Latest Metrics"
              subtitle="Most recent per type" />

            {latestMetrics.length === 0 ?
            <div className="py-8 text-center">
                <ActivityIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No metrics recorded yet.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Log your first metric in Profile.
                </p>
              </div> :

            <div className="space-y-3">
                {latestMetrics.map((m, i) =>
              <div
                key={m.metric_id}
                className={`p-3 rounded-xl border ${metricColors[i % metricColors.length]}`}>

                    <div className="text-xs font-medium opacity-70">
                      {m.metric_type}
                    </div>
                    <div className="text-xl font-bold mt-0.5">
                      {m.value}{' '}
                      <span className="text-sm font-normal">{m.unit}</span>
                    </div>
                    <div className="text-xs opacity-60 mt-0.5">
                      {new Date(m.recorded_at).toLocaleDateString()}
                    </div>
                  </div>
              )}
              </div>
            }
          </Card>
        </div>

        {/* Active Goals */}
        <div>
          <Card>
            <CardHeader
              title="Active Goals"
              subtitle={`${activeGoals.length} goal${activeGoals.length !== 1 ? 's' : ''}`} />

            {activeGoals.length === 0 ?
            <div className="py-8 text-center">
                <TargetIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No active goals yet.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Add one in Profile → Goals.
                </p>
              </div> : (

              <>
                <div className="space-y-3">
                  {goalsPagination.paginated.map((g) => (
                    <div
                      key={g.goal_id}
                      className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">

                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {g.goal_type}
                        </span>
                        <Badge variant="teal">Active</Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {g.description}
                      </p>
                      {g.target_value > 0 && (
                        <div className="mt-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400">
                          Target: {g.target_value} {g.target_unit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-700">
                  <Pagination
                    currentPage={goalsPagination.currentPage}
                    totalPages={goalsPagination.totalPages}
                    onPageChange={goalsPagination.setCurrentPage}
                    totalItems={goalsPagination.totalItems}
                    pageSize={goalsPagination.pageSize}
                  />
                </div>
              </>
            )
          </Card>
        </div>

        {/* Upcoming Sessions */}
        <div>
          <Card>
            <CardHeader
              title="Upcoming Sessions"
              subtitle="Personal training" />

            {upcomingSessions.length === 0 ?
            <div className="py-8 text-center">
                <CalendarIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No upcoming sessions.
                </p>
                      <div className="mt-4">
                        <button
                          className="text-sm text-teal-600 hover:underline"
                          onClick={() => setBookingOpen((s) => !s)}>
                          {bookingOpen ? 'Cancel' : 'Book a Session'}
                        </button>
                        {bookingOpen && (
                          <form onSubmit={handleBookSession} className="mt-3 space-y-2 max-w-md mx-auto text-left">
                            <div>
                              <label className="text-xs text-slate-500">Trainer</label>
                              <select className="w-full mt-1 p-2 border rounded" value={String(bookingForm.trainer_id)} onChange={(e) => setBookingForm((f) => ({ ...f, trainer_id: parseInt(e.target.value) }))}>
                                {trainers.map((t) => (
                                  <option key={t.trainer_id} value={t.trainer_id}>{t.full_name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-slate-500">Room</label>
                              <select className="w-full mt-1 p-2 border rounded" value={String(bookingForm.room_id)} onChange={(e) => setBookingForm((f) => ({ ...f, room_id: parseInt(e.target.value) }))}>
                                {rooms.map((r) => (
                                  <option key={r.room_id} value={r.room_id}>{r.room_name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <input type="date" className="p-2 border rounded col-span-1" value={bookingForm.session_date} onChange={(e) => setBookingForm((f) => ({ ...f, session_date: e.target.value }))} />
                              <input type="time" className="p-2 border rounded" value={bookingForm.start_time} onChange={(e) => setBookingForm((f) => ({ ...f, start_time: e.target.value }))} />
                              <input type="time" className="p-2 border rounded" value={bookingForm.end_time} onChange={(e) => setBookingForm((f) => ({ ...f, end_time: e.target.value }))} />
                            </div>
                            <div>
                              <input placeholder="Notes (optional)" className="w-full p-2 border rounded" value={bookingForm.notes} onChange={(e) => setBookingForm((f) => ({ ...f, notes: e.target.value }))} />
                            </div>
                            <div className="text-right">
                              <button type="submit" className="px-3 py-2 bg-teal-600 text-white rounded">Confirm Booking</button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div> :

            <div className="space-y-3">
                {upcomingSessions.map((s) => {
                const trainer = trainers.find(
                  (t) => t.trainer_id === s.trainer_id
                );
                const room = rooms.find((r) => r.room_id === s.room_id);
                return (
                  <div
                    key={s.session_id}
                    className="p-3 rounded-xl border border-teal-100 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/20"
                    style={{
                      borderLeft: '3px solid #0d9488'
                    }}>

                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {new Date(
                        s.session_date + 'T00:00:00'
                      ).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {s.start_time} – {s.end_time}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 space-y-0.5">
                        <div>
                          <span className="font-medium">Trainer:</span>{' '}
                          {trainer?.full_name}
                        </div>
                        <div>
                          <span className="font-medium">Room:</span>{' '}
                          {room?.room_name}
                        </div>
                      </div>
                      {s.notes &&
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 italic">
                          "{s.notes}"
                        </div>
                    }
                    </div>);

              })}
              </div>
            }
          </Card>
        </div>
      </div>
    </div>);

}
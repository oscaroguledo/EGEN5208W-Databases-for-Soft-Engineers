import { useCallback, useEffect, useState } from 'react';
import { CalendarIcon, UsersIcon, ClockIcon, PlusIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/useServerPagination';
import { ClassesSkeleton } from '@/components/ui/Skeleton';
import { GroupClass, Trainer, Room, TrainingSession } from '@/data/types';
import { listAvailableClasses, enrollInClass, bookSession, getDashboard } from '@/apis/members';
import * as trainersApi from '@/apis/trainers';
import * as adminApi from '@/apis/admin';

const PAGE_SIZE = 6;

export function ClassesPage() {
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [bookingForm, setBookingForm] = useState({
    trainer_id: '',
    room_id: '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    end_time: '10:00',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  const [mySessions, setMySessions] = useState<TrainingSession[]>([]);
  const [sessionTrainers, setSessionTrainers] = useState<Trainer[]>([]);

  const fetchClasses = useCallback(async (skip: number, limit: number) => {
    return listAvailableClasses(skip, limit);
  }, []);

  const { data: classes, isLoading, currentPage, totalPages, totalItems, setPage, refresh } =
    usePagination<GroupClass>(fetchClasses, { pageSize: PAGE_SIZE });

  const handleEnroll = async (classId: string) => {
    setEnrolling(classId);
    try {
      await enrollInClass(classId);
      toast.success('Successfully enrolled in class!');
      refresh();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to enroll. Please try again.');
    } finally {
      setEnrolling(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [trainersRes, roomsRes] = await Promise.allSettled([
          trainersApi.listTrainersPublic(),
          adminApi.listRooms(),
        ]);
        if (!mounted) return;
        if (trainersRes.status === 'fulfilled') {
          const val = trainersRes.value as any;
          const list = Array.isArray(val) ? val : (val?.data ?? []);
          setTrainers(list);
          if (list.length > 0) setBookingForm(f => ({ ...f, trainer_id: list[0].id }));
        }
        if (roomsRes.status === 'fulfilled') {
          const val = roomsRes.value as any;
          const list = Array.isArray(val) ? val : (val?.data ?? []);
          setRooms(list);
          if (list.length > 0) setBookingForm(f => ({ ...f, room_id: list[0].id }));
        }
      } catch { /* best-effort */ }
    })();
    return () => { mounted = false };
  }, []);

  const fetchMySessions = useCallback(async () => {
    try {
      const dashData = await getDashboard(30);
      if (dashData && (dashData as any).upcoming_sessions) {
        setMySessions((dashData as any).upcoming_sessions);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchMySessions();
  }, [fetchMySessions]);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingLoading(true);
    try {
      await bookSession(bookingForm);
      toast.success('Personal training session booked successfully!');
      setBookingModalOpen(false);
      fetchMySessions(); // Refresh sessions list
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to book session.');
    } finally {
      setBookingLoading(false);
    }
  };

  const filtered = searchTerm
    ? classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : classes;

  if (isLoading && classes.length === 0) return <ClassesSkeleton />;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Fitness Classes</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Browse and enroll in our fitness classes</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start">
        <Input placeholder="Search classes by name…" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} className="max-w-md" />
        <Button variant="primary" onClick={() => setBookingModalOpen(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Book Personal Session
        </Button>
      </div>

      {searchTerm && (
        <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Found {filtered.length} class{filtered.length !== 1 ? 'es' : ''} matching "{searchTerm}"
        </div>
      )}

      {/* Personal Training Sessions Section */}
      {mySessions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">My Personal Training Sessions</h2>
          <div className="space-y-3">
            {mySessions.map(session => (
              <Card key={session.id}>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                      <ClockIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">
                        Personal Training Session
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {new Date(session.session_date).toLocaleDateString()} • {session.start_time} – {session.end_time}
                      </div>
                    </div>
                  </div>
                  <Badge variant="teal">Scheduled</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card>
          <div className="py-8 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {searchTerm ? 'No classes found matching your search.' : 'No classes available at the moment.'}
            </p>
          </div>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {filtered.map(cls => (
              <Card key={cls.id}>
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{cls.name}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {new Date(cls.class_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {cls.start_time} – {cls.end_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="success">Available</Badge>
                      <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        <UsersIcon className="w-4 h-4" />
                        {cls.max_capacity} max
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button
                      onClick={() => handleEnroll(cls.id)}
                      disabled={enrolling === cls.id}
                      className="min-w-[100px]">
                      {enrolling === cls.id ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enrolling…
                        </div>
                      ) : 'Enroll'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <Pagination currentPage={currentPage} totalPages={totalPages}
              onPageChange={setPage} totalItems={totalItems} pageSize={PAGE_SIZE} />
          </div>
        </>
      )}

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader title="Book Personal Training" subtitle="Schedule a one-on-one session" />
            <form onSubmit={handleBookSession} className="p-6 space-y-4">
              <Dropdown
                label="Trainer"
                value={bookingForm.trainer_id}
                onChange={(val) => setBookingForm(f => ({ ...f, trainer_id: val }))}
                options={trainers.map((t: Trainer) => ({ value: t.id, label: t.full_name }))}
                placeholder="Select a trainer"
              />
              <Dropdown
                label="Room"
                value={bookingForm.room_id}
                onChange={(value) => setBookingForm(f => ({ ...f, room_id: value }))}
                options={rooms.map(r => ({ value: r.id, label: r.name }))}
              />
              <Dropdown
                label="Date"
                value={bookingForm.session_date}
                onChange={(value) => setBookingForm(f => ({ ...f, session_date: value }))}
                options={[
                  { value: new Date().toISOString().split('T')[0], label: new Date().toLocaleDateString() },
                ]}
              />
              <Dropdown
                label="Start Time"
                value={bookingForm.start_time}
                onChange={(value) => setBookingForm(f => ({ ...f, start_time: value }))}
                options={[
                  { value: '09:00', label: '09:00' },
                  { value: '10:00', label: '10:00' },
                  { value: '11:00', label: '11:00' },
                  { value: '12:00', label: '12:00' },
                  { value: '13:00', label: '13:00' },
                  { value: '14:00', label: '14:00' },
                  { value: '15:00', label: '15:00' },
                  { value: '16:00', label: '16:00' },
                  { value: '17:00', label: '17:00' },
                  { value: '18:00', label: '18:00' },
                  { value: '19:00', label: '19:00' },
                  { value: '20:00', label: '20:00' },
                ]}
              />
              <Dropdown
                label="End Time"
                value={bookingForm.end_time}
                onChange={(value) => setBookingForm(f => ({ ...f, end_time: value }))}
                options={[
                  { value: '09:00', label: '09:00' },
                  { value: '10:00', label: '10:00' },
                  { value: '11:00', label: '11:00' },
                  { value: '12:00', label: '12:00' },
                  { value: '13:00', label: '13:00' },
                  { value: '14:00', label: '14:00' },
                  { value: '15:00', label: '15:00' },
                  { value: '16:00', label: '16:00' },
                  { value: '17:00', label: '17:00' },
                  { value: '18:00', label: '18:00' },
                  { value: '19:00', label: '19:00' },
                  { value: '20:00', label: '20:00' },
                ]}
              />
              <div className="flex gap-3 pt-2">
                <Button type="submit" variant="primary" loading={bookingLoading} className="flex-1">
                  {bookingLoading ? 'Booking…' : 'Confirm Booking'}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setBookingModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

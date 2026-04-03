import { useCallback, useEffect, useState } from 'react';
import { DoorOpenIcon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/useServerPagination';
import { RoomBookingSkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { Room, TrainingSession, GroupClass, Trainer, Member, timesOverlap } from '@/data/types';
import * as membersApi from '@/apis/members';
import * as adminApi from '@/apis/admin';

interface RoomBookingPageProps {
  rooms: Room[];
  trainingSessions: TrainingSession[];
  groupClasses: GroupClass[];
  trainers: Trainer[];
  members: Member[];
  onUpdateSession: (s: TrainingSession) => void;
  onUpdateClass: (c: GroupClass) => void;
  onBookSession?: (payload: { trainer_id: string; room_id: string; session_date: string; start_time: string; end_time: string; member_id?: string }) => Promise<any>;
}

export function RoomBookingPage({
  rooms, trainingSessions, groupClasses, trainers, members,
  onUpdateSession, onUpdateClass, onBookSession,
}: RoomBookingPageProps) {
  const [loading, setLoading]         = useState(true);
  const [filterDate, setFilterDate]   = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd]     = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigning, setAssigning]     = useState(false);
  const [targetType, setTargetType]   = useState<'session' | 'class'>('session');
  const [targetId, setTargetId]       = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [creating, setCreating]       = useState(false);
  const [createForm, setCreateForm]   = useState({
    trainer_id: trainers[0]?.id ?? '',
    room_id: rooms[0]?.id ?? '',
    member_id: members[0]?.id ?? '',
    session_date: new Date().toISOString().split('T')[0],
    start_time: '09:00', end_time: '10:00',
  });

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300);
    return () => clearTimeout(t);
  }, []);

  // Paginated room list
  const fetchRooms = useCallback(async (skip: number, limit: number) => {
    const filtered = rooms.filter(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return {
      status: 'success', message: '', status_code: 200,
      data: filtered.slice(skip, skip + limit),
      pagination: { total: filtered.length, page: Math.floor(skip / limit) + 1, size: limit, total_pages: Math.ceil(filtered.length / limit) || 1 },
    };
  }, [rooms, searchQuery]);

  const { data: roomsData, currentPage: roomsPage, totalPages: roomsTotalPages,
    totalItems: roomsTotalItems, setPage: setRoomsPage } = usePagination<Room>(fetchRooms, { pageSize: 6 });

  const checkConflict = (roomId: string, date: string, start: string, end: string, exSessId?: string, exClassId?: string) =>
    trainingSessions.some(s => s.room_id === roomId && s.session_date === date && s.status !== 'cancelled' && s.id !== exSessId && timesOverlap(start, end, s.start_time, s.end_time)) ||
    groupClasses.some(c => c.room_id === roomId && c.class_date === date && c.id !== exClassId && timesOverlap(start, end, c.start_time, c.end_time));

  const availableRooms = filterDate && filterStart && filterEnd
    ? rooms.filter(r => !checkConflict(r.id, filterDate, filterStart, filterEnd))
    : [];

  const handleAssignRoom = async () => {
    if (!selectedRoomId || !targetId) { toast.error('Select both a room and a target.'); return; }
    setAssigning(true);
    try {
      if (targetType === 'session') {
        await adminApi.assignRoomToSession(targetId, selectedRoomId);
        const s = trainingSessions.find(x => x.id === targetId);
        if (s) onUpdateSession({ ...s, room_id: selectedRoomId });
        toast.success('Room assigned to session.');
      } else {
        await adminApi.assignRoomToClass(targetId, selectedRoomId);
        const c = groupClasses.find(x => x.id === targetId);
        if (c) onUpdateClass({ ...c, room_id: selectedRoomId });
        toast.success('Room assigned to class.');
      }
      setTargetId(''); setSelectedRoomId('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to assign room.');
    }
    setAssigning(false);
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await (onBookSession ? onBookSession(createForm) : membersApi.bookSession(createForm));
      if (res) { onUpdateSession(res as TrainingSession); toast.success('Session created.'); }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create session.');
    }
    setCreating(false);
  };

  const typeOptions = [{ value: 'session', label: 'Personal Session' }, { value: 'class', label: 'Group Class' }];

  if (loading || rooms.length === 0) return <RoomBookingSkeleton />;
  const sessionOptions = trainingSessions.filter(s => s.status !== 'cancelled').map(s => {
    const m = members.find(x => x.id === s.member_id);
    return { value: s.id, label: `${m?.full_name ?? 'Unknown'} (${s.session_date})` };
  });
  const classOptions = groupClasses.map(c => ({ value: c.id, label: `${c.name} (${c.class_date})` }));
  const roomOptions  = rooms.map(r => ({ value: r.id, label: `${r.name} (cap: ${r.capacity})` }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Room Booking</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Assign rooms to sessions and classes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          {/* Check availability */}
          <Card>
            <CardHeader title="Check Availability" subtitle="Find free rooms for a time window" />
            <div className="space-y-3">
              <Input label="Date" type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              <Input label="Start Time" type="time" value={filterStart} onChange={e => setFilterStart(e.target.value)} />
              <Input label="End Time" type="time" value={filterEnd} onChange={e => setFilterEnd(e.target.value)} />
            </div>
            {filterDate && filterStart && filterEnd && (
              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Available Rooms ({availableRooms.length})</div>
                {availableRooms.length === 0 ? (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-xs text-red-700 dark:text-red-300">No rooms available.</div>
                ) : (
                  <div className="space-y-2">
                    {availableRooms.map(r => (
                      <div key={r.id} className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl">
                        <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{r.name}</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Cap: {r.capacity}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Assign room */}
          <Card>
            <CardHeader title="Assign Room" subtitle="Update room for a session or class" />
            <div className="space-y-3">
              <Dropdown label="Type" value={targetType} onChange={v => { setTargetType(v as any); setTargetId(''); }} options={typeOptions} />
              <Dropdown label="Select Session/Class" value={targetId} onChange={setTargetId}
                options={targetType === 'session' ? sessionOptions : classOptions} placeholder="Choose…" />
              <Dropdown label="New Room" value={selectedRoomId} onChange={setSelectedRoomId} options={roomOptions} placeholder="Choose room…" />
              <Button variant="primary" className="w-full" onClick={handleAssignRoom} loading={assigning}>
                {assigning ? 'Assigning…' : 'Assign Room'}
              </Button>
            </div>
          </Card>

          {/* Create session */}
          <Card>
            <CardHeader title="Create Session" subtitle="Admin: create a personal session" />
            <form onSubmit={handleCreateSession} className="space-y-3">
              <Dropdown label="Member" value={createForm.member_id}
                onChange={v => setCreateForm(f => ({ ...f, member_id: v }))}
                options={members.map(m => ({ value: m.id, label: m.full_name }))}
                placeholder="Select member…" />
              <Dropdown label="Trainer" value={createForm.trainer_id}
                onChange={v => setCreateForm(f => ({ ...f, trainer_id: v }))}
                options={trainers.map(t => ({ value: t.id, label: t.full_name }))} />
              <Dropdown label="Room" value={createForm.room_id}
                onChange={v => setCreateForm(f => ({ ...f, room_id: v }))}
                options={rooms.map(r => ({ value: r.id, label: r.name }))} />
              <div className="grid grid-cols-3 gap-2">
                <input type="date" className="p-2 border rounded" value={createForm.session_date}
                  onChange={e => setCreateForm(f => ({ ...f, session_date: e.target.value }))} />
                <input type="time" className="p-2 border rounded" value={createForm.start_time}
                  onChange={e => setCreateForm(f => ({ ...f, start_time: e.target.value }))} />
                <input type="time" className="p-2 border rounded" value={createForm.end_time}
                  onChange={e => setCreateForm(f => ({ ...f, end_time: e.target.value }))} />
              </div>
              <div className="text-right">
                <Button type="submit" variant="primary" loading={creating}>{creating ? 'Creating…' : 'Create Session'}</Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Room overview */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Room Overview</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Current bookings per room</p>
            </div>
            <div className="px-4 sm:px-6 pt-4">
              <Input placeholder="Search rooms…" value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)} className="mb-4" />
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {roomsData.map(room => {
                const sessions = trainingSessions.filter(s => s.room_id === room.id && s.status !== 'cancelled');
                const classes  = groupClasses.filter(c => c.room_id === room.id);
                const total    = sessions.length + classes.length;
                return (
                  <div key={room.id} className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: total > 0 ? 'linear-gradient(135deg,#dbeafe,#bfdbfe)' : '#f8fafc' }}>
                          <DoorOpenIcon className={`w-4 h-4 ${total > 0 ? 'text-blue-600' : 'text-slate-400'}`} />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{room.name}</div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Cap: {room.capacity}</div>
                        </div>
                      </div>
                      <Badge variant={total > 0 ? 'info' : 'neutral'}>{total} booking{total !== 1 ? 's' : ''}</Badge>
                    </div>
                    {total === 0 ? (
                      <div className="text-xs text-slate-400 dark:text-slate-500 ml-14">No bookings</div>
                    ) : (
                      <div className="ml-14 space-y-1.5">
                        {sessions.map(s => {
                          const m = members.find(x => x.id === s.member_id);
                          return (
                            <div key={`s-${s.id}`} className="flex items-center gap-2 text-xs py-1 px-2.5 bg-teal-50 dark:bg-teal-900/30 rounded-lg">
                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-300 font-medium">{s.session_date} {s.start_time}–{s.end_time}</span>
                              <span className="text-slate-400 dark:text-slate-500">· {m?.full_name ?? 'Member'}</span>
                            </div>
                          );
                        })}
                        {classes.map(c => (
                          <div key={`c-${c.id}`} className="flex items-center gap-2 text-xs py-1 px-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                            <span className="text-slate-600 dark:text-slate-300 font-medium">{c.class_date} {c.start_time}–{c.end_time}</span>
                            <span className="text-slate-400 dark:text-slate-500">· {c.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
              <Pagination currentPage={roomsPage} totalPages={roomsTotalPages}
                onPageChange={setRoomsPage} totalItems={roomsTotalItems} pageSize={6} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

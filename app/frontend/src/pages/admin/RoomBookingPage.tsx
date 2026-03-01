import React, { useEffect, useState } from 'react';
import { DoorOpenIcon } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Badge } from '../../components/ui/Badge';
import { RoomBookingSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import {
  Room,
  PersonalSession,
  GroupClass,
  Trainer,
  Member,
  timesOverlap } from
'../../data/types';
interface RoomBookingPageProps {
  rooms: Room[];
  personalSessions: PersonalSession[];
  groupClasses: GroupClass[];
  trainers: Trainer[];
  members: Member[];
  onUpdateSession: (s: PersonalSession) => void;
  onUpdateClass: (c: GroupClass) => void;
}
export function RoomBookingPage({
  rooms,
  personalSessions,
  groupClasses,
  trainers,
  members,
  onUpdateSession,
  onUpdateClass
}: RoomBookingPageProps) {
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [filterDate, setFilterDate] = useState('');
  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [targetType, setTargetType] = useState<'session' | 'class'>('session');
  const [targetId, setTargetId] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(t);
  }, []);
  if (loading) return <RoomBookingSkeleton />;
  const getRoomBookings = (roomId: number) => ({
    sessions: personalSessions.filter(
      (s) => s.room_id === roomId && s.status !== 'cancelled'
    ),
    classes: groupClasses.filter(
      (c) => c.room_id === roomId && c.status !== 'cancelled'
    )
  });
  const checkRoomConflict = (
  roomId: number,
  date: string,
  start: string,
  end: string,
  excludeSessionId?: number,
  excludeClassId?: number)
  : boolean => {
    const sessionConflict = personalSessions.some(
      (s) =>
      s.room_id === roomId &&
      s.session_date === date &&
      s.status !== 'cancelled' &&
      s.session_id !== excludeSessionId &&
      timesOverlap(start, end, s.start_time, s.end_time)
    );
    const classConflict = groupClasses.some(
      (c) =>
      c.room_id === roomId &&
      c.class_date === date &&
      c.status !== 'cancelled' &&
      c.class_id !== excludeClassId &&
      timesOverlap(start, end, c.start_time, c.end_time)
    );
    return sessionConflict || classConflict;
  };
  const handleAssignRoom = () => {
    if (!selectedRoomId || !targetId) {
      toast.error('Please select both a room and a target session/class.');
      return;
    }
    const roomId = parseInt(selectedRoomId);
    const id = parseInt(targetId);
    const roomName = rooms.find((r) => r.room_id === roomId)?.room_name;
    setAssigning(true);
    setTimeout(() => {
      if (targetType === 'session') {
        const session = personalSessions.find((s) => s.session_id === id);
        if (!session) {
          toast.error('Session not found.');
          setAssigning(false);
          return;
        }
        const conflict = checkRoomConflict(
          roomId,
          session.session_date,
          session.start_time,
          session.end_time,
          session.session_id
        );
        if (conflict) {
          toast.error(
            `Room conflict detected on ${session.session_date} during ${session.start_time}–${session.end_time}.`
          );
          setAssigning(false);
          return;
        }
        onUpdateSession({
          ...session,
          room_id: roomId
        });
        toast.success(`Room "${roomName}" assigned to session #${id}.`);
      } else {
        const cls = groupClasses.find((c) => c.class_id === id);
        if (!cls) {
          toast.error('Class not found.');
          setAssigning(false);
          return;
        }
        const conflict = checkRoomConflict(
          roomId,
          cls.class_date,
          cls.start_time,
          cls.end_time,
          undefined,
          cls.class_id
        );
        if (conflict) {
          toast.error(
            `Room conflict detected on ${cls.class_date} during ${cls.start_time}–${cls.end_time}.`
          );
          setAssigning(false);
          return;
        }
        onUpdateClass({
          ...cls,
          room_id: roomId
        });
        toast.success(
          `Room "${roomName}" assigned to class "${cls.class_name}".`
        );
      }
      setAssigning(false);
      setTargetId('');
      setSelectedRoomId('');
    }, 400);
  };
  const availableRooms =
  filterDate && filterStart && filterEnd ?
  rooms.filter(
    (r) =>
    !checkRoomConflict(r.room_id, filterDate, filterStart, filterEnd)
  ) :
  [];
  const typeOptions = [
  {
    value: 'session',
    label: 'Personal Session'
  },
  {
    value: 'class',
    label: 'Group Class'
  }];

  const sessionOptions = personalSessions.
  filter((s) => s.status !== 'cancelled').
  map((s) => {
    const m = members.find((x) => x.member_id === s.member_id);
    return {
      value: String(s.session_id),
      label: `#${s.session_id} — ${m?.full_name} (${s.session_date})`
    };
  });
  const classOptions = groupClasses.
  filter((c) => c.status !== 'cancelled').
  map((c) => ({
    value: String(c.class_id),
    label: `#${c.class_id} — ${c.class_name} (${c.class_date})`
  }));
  const roomOptions = rooms.map((r) => ({
    value: String(r.room_id),
    label: `${r.room_name} (cap: ${r.capacity})`
  }));
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Room Booking
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Assign rooms to sessions and classes, prevent conflicts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Check Availability"
              subtitle="Find free rooms for a time window" />

            <div className="space-y-3">
              <Input
                label="Date"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)} />

              <Input
                label="Start Time"
                type="time"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)} />

              <Input
                label="End Time"
                type="time"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)} />

            </div>

            {filterDate && filterStart && filterEnd &&
            <div className="mt-4">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Available Rooms ({availableRooms.length})
                </div>
                {availableRooms.length === 0 ?
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl text-xs text-red-700 dark:text-red-300">
                    No rooms available for this time window.
                  </div> :

              <div className="space-y-2">
                    {availableRooms.map((r) =>
                <div
                  key={r.room_id}
                  className="p-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl">

                        <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                          {r.room_name}
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                          Cap: {r.capacity} · {r.location}
                        </div>
                      </div>
                )}
                  </div>
              }
              </div>
            }
          </Card>

          <Card>
            <CardHeader
              title="Assign Room"
              subtitle="Update room for a session or class" />

            <div className="space-y-3">
              <Dropdown
                label="Type"
                value={targetType}
                onChange={(v) => {
                  setTargetType(v as 'session' | 'class');
                  setTargetId('');
                }}
                options={typeOptions} />

              <Dropdown
                label="Select Session/Class"
                value={targetId}
                onChange={setTargetId}
                options={
                targetType === 'session' ? sessionOptions : classOptions
                }
                placeholder="Choose..." />

              <Dropdown
                label="New Room"
                value={selectedRoomId}
                onChange={setSelectedRoomId}
                options={roomOptions}
                placeholder="Choose room..." />

              <Button
                variant="primary"
                className="w-full"
                onClick={handleAssignRoom}
                loading={assigning}>

                {assigning ? 'Assigning…' : 'Assign Room'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Room overview */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Room Overview
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Current bookings per room
              </p>
            </div>
            <div className="divide-y divide-slate-50 dark:divide-slate-700">
              {rooms.map((room) => {
                const { sessions, classes } = getRoomBookings(room.room_id);
                const totalBookings = sessions.length + classes.length;
                return (
                  <div key={room.room_id} className="px-4 sm:px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{
                            background:
                            totalBookings > 0 ?
                            'linear-gradient(135deg, #dbeafe, #bfdbfe)' :
                            '#f8fafc'
                          }}>

                          <DoorOpenIcon
                            className={`w-4 h-4 ${totalBookings > 0 ? 'text-blue-600' : 'text-slate-400'}`} />

                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {room.room_name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            {room.location} · Cap: {room.capacity}
                          </div>
                        </div>
                      </div>
                      <Badge variant={totalBookings > 0 ? 'info' : 'neutral'}>
                        {totalBookings} booking{totalBookings !== 1 ? 's' : ''}
                      </Badge>
                    </div>

                    {totalBookings === 0 ?
                    <div className="text-xs text-slate-400 dark:text-slate-500 ml-14">
                        No bookings
                      </div> :

                    <div className="ml-14 space-y-1.5">
                        {sessions.map((s) => {
                        const m = members.find(
                          (x) => x.member_id === s.member_id
                        );
                        return (
                          <div
                            key={`s-${s.session_id}`}
                            className="flex items-center gap-2 text-xs py-1 px-2.5 bg-teal-50 dark:bg-teal-900/30 rounded-lg flex-wrap">

                              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 flex-shrink-0" />
                              <span className="text-slate-600 dark:text-slate-300 font-medium">
                                {s.session_date} {s.start_time}–{s.end_time}
                              </span>
                              <span className="text-slate-400 dark:text-slate-500">
                                · Session: {m?.full_name}
                              </span>
                            </div>);

                      })}
                        {classes.map((c) =>
                      <div
                        key={`c-${c.class_id}`}
                        className="flex items-center gap-2 text-xs py-1 px-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex-wrap">

                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                            <span className="text-slate-600 dark:text-slate-300 font-medium">
                              {c.class_date} {c.start_time}–{c.end_time}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">
                              · Class: {c.class_name}
                            </span>
                          </div>
                      )}
                      </div>
                    }
                  </div>);

              })}
            </div>
          </Card>
        </div>
      </div>
    </div>);

}
import React, { useEffect, useState } from 'react';
import {
  ClockIcon,
  PlusIcon,
  Trash2Icon,
  EditIcon,
  CheckIcon,
  XIcon } from
'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AvailabilitySkeleton } from '../../components/ui/Skeleton';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { toast } from 'sonner';
import {
  User,
  Trainer,
  TrainerAvailability,
  timesOverlap } from
'../../data/types';
interface AvailabilityPageProps {
  currentUser: User;
  trainers: Trainer[];
  availability: TrainerAvailability[];
  onAddAvailability: (slot: TrainerAvailability) => void;
  onUpdateAvailability: (slot: TrainerAvailability) => void;
  onDeleteAvailability: (id: number) => void;
}
export function AvailabilityPage({
  currentUser,
  trainers,
  availability,
  onAddAvailability,
  onUpdateAvailability,
  onDeleteAvailability
}: AvailabilityPageProps) {
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [form, setForm] = useState({
    available_date: '',
    start_time: '',
    end_time: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    available_date: '',
    start_time: '',
    end_time: ''
  });
  
  // Call pagination hook unconditionally to preserve hooks order
  const pagination = usePagination([], 6); // Initialize with empty array, will be updated
  
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);
  
  const trainer = trainers.find((t) => t.user_id === currentUser.user_id);
  if (!trainer)
  return (
    <div className="text-slate-500 dark:text-slate-400">
        Trainer profile not found.
      </div>);

  if (loading) return <AvailabilitySkeleton />;
  const mySlots = availability.
  filter((a) => a.trainer_id === trainer.trainer_id).
  sort(
    (a, b) =>
    a.available_date.localeCompare(b.available_date) ||
    a.start_time.localeCompare(b.start_time)
  );
  
  // We'll use mySlots directly in the display instead of the hook's paginated data
  // to avoid hook order issues while maintaining functionality
  const checkOverlap = (
  date: string,
  start: string,
  end: string,
  excludeId?: number)
  : boolean =>
  availability.some(
    (a) =>
    a.trainer_id === trainer.trainer_id &&
    a.available_date === date &&
    a.availability_id !== excludeId &&
    timesOverlap(start, end, a.start_time, a.end_time)
  );
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.available_date || !form.start_time || !form.end_time) {
      toast.error('All fields are required.');
      return;
    }
    if (form.end_time <= form.start_time) {
      toast.error('End time must be after start time.');
      return;
    }
    if (checkOverlap(form.available_date, form.start_time, form.end_time)) {
      toast.error(
        `This slot overlaps with an existing availability on ${form.available_date}.`
      );
      return;
    }
    setAddLoading(true);
    setTimeout(() => {
      const newId =
      Math.max(...availability.map((a) => a.availability_id), 0) + 1;
      onAddAvailability({
        availability_id: newId,
        trainer_id: trainer.trainer_id,
        ...form
      });
      setForm({
        available_date: '',
        start_time: '',
        end_time: ''
      });
      setAddLoading(false);
      toast.success(`Availability slot added for ${form.available_date}.`);
    }, 300);
  };
  const handleDelete = (id: number) => {
    onDeleteAvailability(id);
    toast.success('Availability slot deleted.');
  };
  const startEdit = (slot: TrainerAvailability) => {
    setEditingId(slot.availability_id);
    setEditForm({
      available_date: slot.available_date,
      start_time: slot.start_time,
      end_time: slot.end_time
    });
  };
  const handleUpdate = (id: number) => {
    if (editForm.end_time <= editForm.start_time) {
      toast.error('End time must be after start time.');
      return;
    }
    if (
    checkOverlap(
      editForm.available_date,
      editForm.start_time,
      editForm.end_time,
      id
    ))
    {
      toast.error('Updated slot overlaps with an existing availability slot.');
      return;
    }
    setUpdateLoading(true);
    setTimeout(() => {
      onUpdateAvailability({
        availability_id: id,
        trainer_id: trainer.trainer_id,
        ...editForm
      });
      setEditingId(null);
      setUpdateLoading(false);
      toast.success('Availability slot updated.');
    }, 300);
  };
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Set Availability
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Define your available time slots
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader
              title="Add Slot"
              subtitle="Define a new available time" />

            <form onSubmit={handleAdd} className="space-y-4">
              <Input
                label="Date"
                type="date"
                value={form.available_date}
                onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  available_date: e.target.value
                }))
                } />

              <Input
                label="Start Time"
                type="time"
                value={form.start_time}
                onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  start_time: e.target.value
                }))
                } />

              <Input
                label="End Time"
                type="time"
                value={form.end_time}
                onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  end_time: e.target.value
                }))
                } />

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                loading={addLoading}>

                <PlusIcon className="w-4 h-4" />
                {addLoading ? 'Adding…' : 'Add Slot'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  My Availability Slots
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {mySlots.length} slot{mySlots.length !== 1 ? 's' : ''} defined
                </p>
              </div>
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
            </div>

            {mySlots.length === 0 ?
            <div className="px-6 py-14 text-center">
                <ClockIcon className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">
                  No availability slots defined yet.
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                  Add your first slot using the form.
                </p>
              </div> :

            <>
                <div className="divide-y divide-slate-50 dark:divide-slate-700">
                  {mySlots.map((slot) =>
                <div
                  key={slot.availability_id}
                  className="px-4 sm:px-6 py-4">

                      {editingId === slot.availability_id ?
                  <div className="flex flex-wrap items-end gap-3">
                          <Input
                      label="Date"
                      type="date"
                      value={editForm.available_date}
                      onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        available_date: e.target.value
                      }))
                      }
                      className="w-36" />

                          <Input
                      label="Start"
                      type="time"
                      value={editForm.start_time}
                      onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        start_time: e.target.value
                      }))
                      }
                      className="w-28" />

                          <Input
                      label="End"
                      type="time"
                      value={editForm.end_time}
                      onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        end_time: e.target.value
                      }))
                      }
                      className="w-28" />

                          <div className="flex gap-2">
                            <Button
                        size="sm"
                        variant="primary"
                        loading={updateLoading}
                        onClick={() => handleUpdate(slot.availability_id)}>

                              <CheckIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setEditingId(null)}>

                              <XIcon className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div> :

                  <div className="flex items-center justify-between group">
                          <div className="flex items-center gap-4">
                            <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                          'linear-gradient(135deg, #ccfbf1, #99f6e4)'
                        }}>

                              <ClockIcon className="w-5 h-5 text-teal-600" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {new Date(
                            slot.available_date + 'T00:00:00'
                          ).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                                {slot.start_time} – {slot.end_time}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEdit(slot)}>

                              <EditIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(slot.availability_id)}>

                              <Trash2Icon className="w-3.5 h-3.5 text-red-400" />
                            </Button>
                          </div>
                    </div>
                  </div> :

            <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background:
                    'linear-gradient(135deg, #ccfbf1, #99f6e4)'
                  }}>

                        <ClockIcon className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(
                      slot.available_date + 'T00:00:00'
                    ).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                          {slot.start_time} – {slot.end_time}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => startEdit(slot)}>

                        <EditIcon className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(slot.availability_id)}>

                        <Trash2Icon className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </div>
                  </div>
            }
              </div>
          )}
          </div>
          {mySlots.length > 6 &&
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
              <Pagination
            currentPage={1}
            totalPages={Math.ceil(mySlots.length / 6)}
            onPageChange={() => {}}
            totalItems={mySlots.length}
            pageSize={6}
          />   </div>
        }
        </>
      }
    </Card>
  </div>
</div>
</div>);
    </div>);

}
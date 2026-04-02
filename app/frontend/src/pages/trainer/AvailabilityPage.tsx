import { useEffect, useState } from 'react';
import { ClockIcon, PlusIcon, Trash2Icon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { AvailabilitySkeleton } from '@/components/ui/Skeleton';
import { toast } from 'sonner';
import { User, Trainer, TrainerAvailability } from '@/data/types';
import * as trainersApi from '@/apis/trainers';

interface AvailabilityPageProps {
  currentUser: User;
  trainers: Trainer[];
  availability: TrainerAvailability[];
  onAddAvailability: (slot: TrainerAvailability) => void;
  onUpdateAvailability: (slot: TrainerAvailability) => void;
  onDeleteAvailability: (id: string) => void;
}

export function AvailabilityPage({
  currentUser,
  onAddAvailability, onDeleteAvailability,
}: AvailabilityPageProps) {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [trainer, setTrainer]   = useState<Trainer | null>(null);
  const [mySlots, setMySlots]   = useState<TrainerAvailability[]>([]);
  const [form, setForm]         = useState({ available_date: '', start_at: '', end_at: '' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [trainerData, slotsData] = await Promise.all([
          trainersApi.getTrainerMe(),
          trainersApi.getAvailability(),
        ]);
        if (!mounted) return;
        if (trainerData) setTrainer(trainerData as Trainer);
        if (Array.isArray(slotsData)) {
          setMySlots(slotsData as TrainerAvailability[]);
        }
      } catch {
        // handled by empty state
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [currentUser.id]);

  if (loading) return <AvailabilitySkeleton />;
  if (!trainer) return <div className="text-slate-500 dark:text-slate-400">Trainer profile not found.</div>;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.available_date || !form.start_at || !form.end_at) { toast.error('All fields are required.'); return; }
    if (form.end_at <= form.start_at) { toast.error('End time must be after start time.'); return; }
    setSaving(true);
    try {
      const res = await trainersApi.setAvailability(form.available_date, form.start_at, form.end_at);
      const slot: TrainerAvailability = {
        id: res?.availability_id || String(Date.now()),
        trainer_id: currentUser.id,
        available_date: form.available_date,
        start_at: form.start_at,
        end_at: form.end_at,
      };
      setMySlots(prev => [...prev, slot].sort((a, b) =>
        a.available_date.localeCompare(b.available_date) || a.start_at.localeCompare(b.start_at)
      ));
      onAddAvailability(slot);
      setForm({ available_date: '', start_at: '', end_at: '' });
      toast.success(`Availability added for ${form.available_date}.`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to add availability.');
    }
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Set Availability</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Define your available time slots</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <Card>
            <CardHeader title="Add Slot" subtitle="Define a new available time" />
            <form onSubmit={handleAdd} className="space-y-4">
              <Input label="Date" type="date" value={form.available_date}
                onChange={e => setForm(f => ({ ...f, available_date: e.target.value }))} />
              <Input label="Start Time" type="time" value={form.start_at}
                onChange={e => setForm(f => ({ ...f, start_at: e.target.value }))} />
              <Input label="End Time" type="time" value={form.end_at}
                onChange={e => setForm(f => ({ ...f, end_at: e.target.value }))} />
              <Button type="submit" variant="primary" className="w-full" loading={saving}>
                <PlusIcon className="w-4 h-4" />
                {saving ? 'Adding…' : 'Add Slot'}
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">My Availability Slots</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{mySlots.length} slot{mySlots.length !== 1 ? 's' : ''} defined</p>
              </div>
              <div className="w-8 h-8 bg-teal-100 dark:bg-teal-900/40 rounded-lg flex items-center justify-center">
                <ClockIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              </div>
            </div>

            {mySlots.length === 0 ? (
              <div className="px-6 py-14 text-center">
                <ClockIcon className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 dark:text-slate-400 font-medium">No availability slots defined yet.</p>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add your first slot using the form.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 dark:divide-slate-700">
                {mySlots.map(slot => (
                  <div key={slot.id} className="px-4 sm:px-6 py-4 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#ccfbf1,#99f6e4)' }}>
                        <ClockIcon className="w-5 h-5 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {new Date(slot.available_date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 inline-block" />
                          {slot.start_at} – {slot.end_at}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setMySlots(prev => prev.filter(s => s.id !== slot.id));
                        onDeleteAvailability(slot.id);
                        toast.success('Slot deleted.');
                      }}>
                      <Trash2Icon className="w-3.5 h-3.5 text-red-400" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useCallback, useEffect } from 'react';
import { WrenchIcon, PlusIcon, PencilIcon, Trash2Icon, FilterIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { StatusBadge } from '@/components/ui/Badge';
import { EquipmentSkeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { toast } from 'sonner';
import { Equipment, EquipmentStatus, Room } from '@/data/types';
import * as adminApi from '@/apis/admin';
import { usePagination } from '@/hooks/useServerPagination';

interface EquipmentPageProps {
  rooms: Room[];
}

const PAGE_SIZE = 8;

// Map API underscore values to display labels
const STATUS_DISPLAY: Record<string, string> = {
  operational: 'Operational',
  under_repair: 'Under Repair',
  out_of_service: 'Out of Service',
};

export function EquipmentPage({ rooms }: EquipmentPageProps) {
  const [filter, setFilter]         = useState<'all' | 'needs-attention'>('all');
  const [modalOpen, setModalOpen]   = useState(false);
  const [statusOptions, setStatusOptions] = useState([
    { value: 'operational', label: 'Operational' },
    { value: 'under_repair', label: 'Under Repair' },
    { value: 'out_of_service', label: 'Out of Service' },
  ]);
  const [newForm, setNewForm] = useState({ equipment_name: '', room_id: '', status: 'operational' as EquipmentStatus, notes: '' });
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [editForm, setEditForm] = useState({ equipment_name: '', room_id: '', status: 'operational' as EquipmentStatus, notes: '' });

  useEffect(() => {
    adminApi.getEquipmentStatusOptions()
      .then((res: any) => {
        const opts = Array.isArray(res) ? res : res?.data;
        if (Array.isArray(opts)) setStatusOptions(opts);
      })
      .catch(() => {});
  }, []);

  const fetchEquipment = useCallback(async (skip: number, limit: number) => {
    return adminApi.listEquipment(skip, limit);
  }, []);

  const { data: equipment, isLoading, currentPage, totalPages, totalItems, setPage, refresh } =
    usePagination<Equipment>(fetchEquipment, { pageSize: PAGE_SIZE });

  const displayed = filter === 'needs-attention'
    ? equipment.filter(e => e.status !== 'operational')
    : equipment;

  const roomOptions = rooms.map(r => ({ value: r.id, label: r.name }));

  const handleStatusChange = async (eq: Equipment, newStatus: EquipmentStatus) => {
    try {
      await adminApi.updateEquipmentStatus(eq.id, newStatus);
      toast.success(`"${eq.equipment_name}" updated to ${STATUS_DISPLAY[newStatus] || newStatus}.`);
      refresh();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to update status.'); }
  };

  const openEdit = (eq: Equipment) => {
    setEditing(eq);
    setEditForm({ equipment_name: eq.equipment_name, room_id: eq.room_id, status: eq.status, notes: eq.maintenance_notes || '' });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = editing ? editForm : newForm;
    if (!f.equipment_name.trim() || !f.room_id) { toast.error('Name and room are required.'); return; }
    try {
      if (editing) {
        await adminApi.updateEquipment(editing.id, { equipment_name: f.equipment_name, room_id: f.room_id, status: f.status, notes: f.notes });
        toast.success('Equipment updated.');
      } else {
        await adminApi.createEquipment({ equipment_name: f.equipment_name, room_id: f.room_id, status: f.status, notes: f.notes });
        toast.success('Equipment created.');
      }
      setModalOpen(false);
      setEditing(null);
      setNewForm({ equipment_name: '', room_id: '', status: 'operational', notes: '' });
      refresh();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to save equipment.'); }
  };

  const handleDelete = async (eq: Equipment) => {
    try {
      await adminApi.deleteEquipment(eq.id);
      toast.success(`"${eq.equipment_name}" deleted.`);
      refresh();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to delete equipment.'); }
  };

  if (isLoading && equipment.length === 0) return <EquipmentSkeleton />;

  const needsAttentionCount = equipment.filter(e => e.status !== 'operational').length;

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Equipment Maintenance</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Manage equipment records and maintenance status</p>
        </div>
        <Button variant="primary" onClick={() => { setEditing(null); setModalOpen(true); }} className="self-start">
          <PlusIcon className="w-4 h-4" /> Add Equipment
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        {[
          { label: 'Operational', count: equipment.filter(e => e.status === 'operational').length, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40', icon: '✓' },
          { label: 'Under Repair', count: equipment.filter(e => e.status === 'under_repair').length, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40', icon: <WrenchIcon className="w-4 h-4" /> },
          { label: 'Out of Service', count: equipment.filter(e => e.status === 'out_of_service').length, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40', icon: '✕' },
        ].map((s, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0 ${s.color} text-base font-bold`}>{s.icon}</div>
            <div>
              <div className={`text-xl sm:text-2xl font-bold ${s.color}`}>{s.count}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <Card padding="none">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex gap-1">
            {[
              { key: 'all', label: `All (${totalItems})` },
              { key: 'needs-attention', label: `Needs Attention (${needsAttentionCount})` },
            ].map(btn => (
              <button key={btn.key} onClick={() => setFilter(btn.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === btn.key ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                {['Equipment', 'Room', 'Status', 'Notes', 'Update', ''].map(h => (
                  <th key={h} className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {displayed.map(eq => {
                const room = rooms.find(r => r.id === eq.room_id);
                return (
                  <tr key={eq.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 sm:px-6 py-4">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{eq.equipment_name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">{eq.id.slice(0, 8)}…</div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">{room?.name ?? '—'}</td>
                    <td className="px-4 sm:px-6 py-4"><StatusBadge status={eq.status} /></td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">{eq.maintenance_notes || '—'}</td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Dropdown value={eq.status} onChange={v => handleStatusChange(eq, v as EquipmentStatus)}
                          options={statusOptions} className="w-36" />
                        <Button size="sm" variant="ghost" onClick={() => openEdit(eq)}>
                          <PencilIcon className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(eq)}>
                        <Trash2Icon className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <Pagination currentPage={currentPage} totalPages={totalPages}
            onPageChange={setPage} totalItems={totalItems} pageSize={PAGE_SIZE} />
        </div>
      </Card>

      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }}
        title={editing ? 'Edit Equipment' : 'Add Equipment'}
        footer={
          <>
            <Button variant="secondary" onClick={() => { setModalOpen(false); setEditing(null); }}>Cancel</Button>
            <Button variant="primary" onClick={handleSave as any}>{editing ? 'Save Changes' : 'Save Equipment'}</Button>
          </>
        }>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Equipment Name *" placeholder="e.g. Rowing Machine #1"
            value={editing ? editForm.equipment_name : newForm.equipment_name}
            onChange={e => editing ? setEditForm(f => ({ ...f, equipment_name: e.target.value })) : setNewForm(f => ({ ...f, equipment_name: e.target.value }))} />
          <Dropdown label="Room *"
            value={editing ? editForm.room_id : newForm.room_id}
            onChange={v => editing ? setEditForm(f => ({ ...f, room_id: v })) : setNewForm(f => ({ ...f, room_id: v }))}
            options={roomOptions} placeholder="Select room" />
          <Dropdown label="Status"
            value={editing ? editForm.status : newForm.status}
            onChange={v => editing ? setEditForm(f => ({ ...f, status: v as EquipmentStatus })) : setNewForm(f => ({ ...f, status: v as EquipmentStatus }))}
            options={statusOptions} />
          <Textarea label="Notes" placeholder="Describe the issue or details…"
            value={editing ? editForm.notes : newForm.notes}
            onChange={e => editing ? setEditForm(f => ({ ...f, notes: e.target.value })) : setNewForm(f => ({ ...f, notes: e.target.value }))} />
        </form>
      </Modal>
    </div>
  );
}

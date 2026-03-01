import React, { useEffect, useState } from 'react';
import { WrenchIcon, PlusIcon, FilterIcon, Trash2Icon, PencilIcon } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { Modal } from '../../components/ui/Modal';
import { StatusBadge } from '../../components/ui/Badge';
import { EquipmentSkeleton } from '../../components/ui/Skeleton';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { toast } from 'sonner';
import { Equipment, Room, EquipmentStatus } from '../../data/types';
interface EquipmentPageProps {
  equipment: Equipment[];
  rooms: Room[];
  onAddEquipment: (e: Equipment) => void;
  onUpdateEquipment: (e: Equipment) => void;
  onDeleteEquipment: (id: number) => void;
}
const STATUS_OPTIONS = [
{
  value: 'operational',
  label: 'Operational'
},
{
  value: 'under repair',
  label: 'Under Repair'
},
{
  value: 'out of service',
  label: 'Out of Service'
}];

export function EquipmentPage({
  equipment,
  rooms,
  onAddEquipment,
  onUpdateEquipment,
  onDeleteEquipment
}: EquipmentPageProps) {
  const [loading, setLoading] = useState(true);
  const [savingEquipment, setSavingEquipment] = useState(false);
  const [filter, setFilter] = useState<'all' | 'needs-attention'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    equipment_name: '',
    room_id: '',
    status: 'operational' as EquipmentStatus,
    notes: ''
  });
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [editingForm, setEditingForm] = useState({
    equipment_name: '',
    room_id: '',
    status: 'operational' as EquipmentStatus,
    notes: ''
  });
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);
  const displayed =
  filter === 'needs-attention' ?
  equipment.filter((e) => e.status !== 'operational') :
  equipment;
  const needsAttentionCount = equipment.filter(
    (e) => e.status !== 'operational'
  ).length;
  const roomOptions = rooms.map((r) => ({
    value: String(r.room_id),
    label: r.room_name
  }));
  const pagination = usePagination(displayed, 8);
  if (loading) return <EquipmentSkeleton />;
  const handleStatusChange = (eq: Equipment, newStatus: EquipmentStatus) => {
    const updated: Equipment = {
      ...eq,
      status: newStatus,
      last_maintained:
      newStatus === 'operational' ?
      new Date().toISOString().split('T')[0] :
      eq.last_maintained
    };
    onUpdateEquipment(updated);
    toast.success(`"${eq.equipment_name}" status updated to "${newStatus}".`);
  };
  const openEdit = (eq: Equipment) => {
    setEditing(eq);
    setEditingForm({
      equipment_name: eq.equipment_name,
      room_id: String(eq.room_id),
      status: eq.status,
      notes: eq.notes || ''
    });
    setModalOpen(true);
  };
  const handleUpdateSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!editing) return;
    if (!editingForm.equipment_name.trim() || !editingForm.room_id) {
      toast.error('Equipment name and room are required.');
      return;
    }
    setSavingEquipment(true);
    setTimeout(() => {
      const updated: Equipment = {
        ...editing,
        equipment_name: editingForm.equipment_name,
        room_id: parseInt(editingForm.room_id),
        status: editingForm.status,
        notes: editingForm.notes
      };
      onUpdateEquipment(updated);
      setSavingEquipment(false);
      setModalOpen(false);
      toast.success(`Equipment "${updated.equipment_name}" updated.`);
      setEditing(null);
    }, 300);
  };
  const handleAddEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.equipment_name.trim() || !newForm.room_id) {
      toast.error('Equipment name and room are required.');
      return;
    }
    setSavingEquipment(true);
    setTimeout(() => {
      const newId = Math.max(...equipment.map((e) => e.equipment_id), 0) + 1;
      onAddEquipment({
        equipment_id: newId,
        equipment_name: newForm.equipment_name,
        room_id: parseInt(newForm.room_id),
        status: newForm.status,
        last_maintained: new Date().toISOString().split('T')[0],
        notes: newForm.notes
      });
      setNewForm({
        equipment_name: '',
        room_id: '',
        status: 'operational',
        notes: ''
      });
      setModalOpen(false);
      setSavingEquipment(false);
      toast.success(
        `Equipment "${newForm.equipment_name}" logged successfully.`
      );
    }, 400);
  };
  const handleDeleteEquipment = (eq: Equipment) => {
    onDeleteEquipment(eq.equipment_id);
    toast.success(`"${eq.equipment_name}" has been removed.`);
  };
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Equipment Maintenance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Manage equipment records and maintenance status
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="self-start">

          <PlusIcon className="w-4 h-4" />
          Add Equipment
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-600 dark:text-emerald-400 text-base font-bold">
              ✓
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {equipment.filter((e) => e.status === 'operational').length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Operational
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <WrenchIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
              {equipment.filter((e) => e.status === 'under repair').length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Under Repair
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-3 sm:p-4 flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <span className="text-red-600 dark:text-red-400 text-base font-bold">
              ✕
            </span>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-bold text-red-600 dark:text-red-400">
              {equipment.filter((e) => e.status === 'out of service').length}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Out of Service
            </div>
          </div>
        </div>
      </div>

      <Card padding="none">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'all' ? 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>

              All ({equipment.length})
            </button>
            <button
              onClick={() => setFilter('needs-attention')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === 'needs-attention' ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>

              Needs Attention ({needsAttentionCount})
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Mobile: stacked list */}
          <div className="space-y-3 md:hidden px-4 sm:px-6">
            {pagination.paginated.map((eq) => {
              const room = rooms.find((r) => r.room_id === eq.room_id);
              return (
                <div key={eq.equipment_id} className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3`}> 
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{eq.equipment_name}</div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">ID: {eq.equipment_id} • {room?.room_name}</div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={eq.status} />
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Last: {eq.last_maintained || '—'}</div>
                  {eq.notes && <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">{eq.notes}</div>}
                  <div className="mt-3 flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={() => openEdit(eq)} title="Edit">
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteEquipment(eq)} title="Delete">
                      <Trash2Icon className="w-4 h-4 text-red-400" />
                    </Button>
                    <div className="ml-auto">
                      <Dropdown
                        value={eq.status}
                        onChange={(v) => handleStatusChange(eq, v as EquipmentStatus)}
                        options={STATUS_OPTIONS}
                        className="w-36"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop/tablet: regular table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full table-auto">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700">
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Room
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden md:table-cell">
                  Last Maintained
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider hidden lg:table-cell">
                  Notes
                </th>
                <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Update
                </th>
                <th className="px-4 sm:px-6 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Del
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
              {pagination.paginated.map((eq) => {
                const room = rooms.find((r) => r.room_id === eq.room_id);
                const rowBg =
                eq.status === 'operational' ?
                '' :
                eq.status === 'under repair' ?
                'bg-amber-50/60 dark:bg-amber-900/10' :
                'bg-red-50/60 dark:bg-red-900/10';
                return (
                  <tr
                    key={eq.equipment_id}
                    className={`${rowBg} hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors`}>

                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${eq.status === 'operational' ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700' : eq.status === 'under repair' ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700' : 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700'}`}>

                          <WrenchIcon
                            className={`w-3.5 h-3.5 ${eq.status === 'operational' ? 'text-emerald-500 dark:text-emerald-400' : eq.status === 'under repair' ? 'text-amber-500 dark:text-amber-400' : 'text-red-500 dark:text-red-400'}`} />

                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {eq.equipment_name}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500">
                            ID: {eq.equipment_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {room?.room_name}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <StatusBadge status={eq.status} />
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-slate-500 dark:text-slate-400 hidden md:table-cell">
                      {eq.last_maintained || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate hidden lg:table-cell">
                      {eq.notes || '—'}
                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Dropdown
                          value={eq.status}
                          onChange={(v) => handleStatusChange(eq, v as EquipmentStatus)}
                          options={STATUS_OPTIONS}
                          className="w-36"
                        />
                        <Button size="sm" variant="ghost" onClick={() => openEdit(eq)} title="Edit">
                          <PencilIcon className="w-3.5 h-3.5 text-slate-500" />
                        </Button>
                      </div>

                    </td>
                    <td className="px-4 sm:px-6 py-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteEquipment(eq)}
                        title="Delete equipment">

                        <Trash2Icon className="w-3.5 h-3.5 text-red-400" />
                      </Button>
                    </td>
                  </tr>);

              })}
            </tbody>
            </table>
          </div>
        </div>
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 dark:border-slate-700">
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.setCurrentPage}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
          />
        </div>
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? 'Edit Equipment' : 'Add Equipment'}
        footer={
        <>
            <Button variant="secondary" onClick={() => {
              setModalOpen(false);
              setEditing(null);
            }}>
              Cancel
            </Button>
            <Button
            variant="primary"
            loading={savingEquipment}
            onClick={(editing ? (handleUpdateSubmit as any) : (handleAddEquipment as any))}>

              {savingEquipment ? 'Saving…' : editing ? 'Save Changes' : 'Save Equipment'}
            </Button>
          </>
        }>

        <form onSubmit={editing ? handleUpdateSubmit : handleAddEquipment} className="space-y-4">
          <Input
            label="Equipment Name *"
            placeholder="e.g. Rowing Machine #1"
            value={editing ? editingForm.equipment_name : newForm.equipment_name}
            onChange={(e) =>
              editing ? setEditingForm((f) => ({ ...f, equipment_name: e.target.value })) : setNewForm((f) => ({ ...f, equipment_name: e.target.value }))
            } />

          <Dropdown
            label="Room *"
            value={editing ? editingForm.room_id : newForm.room_id}
            onChange={(v) =>
              editing ? setEditingForm((f) => ({ ...f, room_id: v })) : setNewForm((f) => ({ ...f, room_id: v }))
            }
            options={roomOptions}
            placeholder="Select room" />

          <Dropdown
            label={editing ? 'Status' : 'Initial Status'}
            value={editing ? editingForm.status : newForm.status}
            onChange={(v) =>
              editing ? setEditingForm((f) => ({ ...f, status: v as EquipmentStatus })) : setNewForm((f) => ({ ...f, status: v as EquipmentStatus }))
            }
            options={STATUS_OPTIONS} />

          <Textarea
            label="Notes"
            placeholder="Describe the issue or equipment details..."
            value={editing ? editingForm.notes : newForm.notes}
            onChange={(e) =>
              editing ? setEditingForm((f) => ({ ...f, notes: e.target.value })) : setNewForm((f) => ({ ...f, notes: e.target.value }))
            } />

        </form>
      </Modal>
    </div>);

}
import { useCallback, useEffect, useState } from 'react';
import { UserIcon, TargetIcon, HeartPulseIcon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { usePagination } from '@/hooks/useServerPagination';
import { Textarea } from '@/components/ui/Textarea';
import { User, Member, FitnessGoal, HealthMetric } from '@/data/types';
import { toast } from 'sonner';
import * as membersApi from '@/apis/members';
import { ProfileSkeleton } from '@/components/ui/Skeleton';

interface ProfilePageProps {
  currentUser: User;
  members: Member[];
  onUpdateMember: (updated: Member) => void;
  onAddGoal: (goal: FitnessGoal) => void;
  onAddMetric: (metric: HealthMetric) => void;
}

type Tab = 'profile' | 'goals' | 'metrics';

const METRIC_OPTIONS = [
  { value: '', label: 'Select metric type' },
  { value: 'Weight', label: 'Weight' },
  { value: 'Heart Rate', label: 'Heart Rate' },
  { value: 'BMI', label: 'BMI' },
  { value: 'Blood Pressure', label: 'Blood Pressure' },
  { value: 'Body Fat', label: 'Body Fat %' },
];

export function ProfilePage({ currentUser, onUpdateMember, onAddGoal, onAddMetric }: ProfilePageProps) {
  const [loading, setLoading]           = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGoal, setSavingGoal]     = useState(false);
  const [savingMetric, setSavingMetric] = useState(false);
  const [tab, setTab]                   = useState<Tab>('profile');
  const [member, setMember]             = useState<Member | null>(null);
  const PAGE_SIZE = 4;

  useEffect(() => {
    let mounted = true;
    membersApi.getMemberMe().then(data => {
      if (mounted && data) setMember(data as Member);
    }).catch(() => {}).finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [currentUser.id]);

  const fetchGoals = useCallback(async (skip: number, limit: number) => {
    return membersApi.listGoals(undefined, skip, limit);
  }, []);

  const { data: goalsData, currentPage: goalsPage, totalPages: goalsTotalPages,
    totalItems: goalsTotalItems, setPage: setGoalsPage, refresh: refreshGoals } = usePagination<FitnessGoal>(fetchGoals, { pageSize: PAGE_SIZE });

  const fetchMetrics = useCallback(async (skip: number, limit: number) => {
    return membersApi.listHealthHistory(skip, limit);
  }, []);

  const { data: metricsData, currentPage: metricsPage, totalPages: metricsTotalPages,
    totalItems: metricsTotalItems, setPage: setMetricsPage, refresh: refreshMetrics } = usePagination<HealthMetric>(fetchMetrics, { pageSize: PAGE_SIZE });

  const [profileForm, setProfileForm] = useState({ full_name: '', phone: '' });
  const [goalForm, setGoalForm]       = useState({ description: '', target_value: '' });
  const [metricForm, setMetricForm]   = useState({ metric_type: '', value: '' });
  const [editingGoal, setEditingGoal] = useState<FitnessGoal | null>(null);

  // Sync form once member data loads
  useEffect(() => {
    if (member) setProfileForm({ full_name: member.full_name || '', phone: member.phone || '' });
  }, [member]);

  if (loading) return <ProfileSkeleton />;
  if (!member) return <div className="text-slate-500 dark:text-slate-400">Member profile not found.</div>;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) { toast.error('Full name cannot be empty.'); return; }
    setSavingProfile(true);
    try {
      const updated = await membersApi.updateMemberMe({ full_name: profileForm.full_name, phone: profileForm.phone });
      setMember(updated as Member);
      onUpdateMember(updated as Member);
      toast.success('Profile updated successfully.');
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to update profile.'); }
    setSavingProfile(false);
  };

  const handleAddOrUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.description.trim()) { toast.error('Description is required.'); return; }
    setSavingGoal(true);
    try {
      const goalData = editingGoal 
        ? { id: editingGoal.id, description: goalForm.description, target_value: goalForm.target_value || null }
        : { description: goalForm.description, target_value: goalForm.target_value || null };
      const results = await membersApi.updateGoals([goalData]);
      const saved = Array.isArray(results) ? results[0] : results;
      if (saved) { 
        onAddGoal(saved as FitnessGoal); 
        setGoalForm({ description: '', target_value: '' }); 
        setEditingGoal(null);
        refreshGoals();
        toast.success(editingGoal ? 'Goal updated.' : 'Goal added.'); 
      }
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to save goal.'); }
    setSavingGoal(false);
  };

  const handleEditGoal = (goal: FitnessGoal) => {
    setEditingGoal(goal);
    setGoalForm({ description: goal.description, target_value: goal.target_value || '' });
  };

  const handleCancelEdit = () => {
    setEditingGoal(null);
    setGoalForm({ description: '', target_value: '' });
  };

  const handleAddMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricForm.metric_type || !metricForm.value) { toast.error('Metric type and value are required.'); return; }
    setSavingMetric(true);
    try {
      const res = await membersApi.addHealthMetric(metricForm.metric_type, parseFloat(metricForm.value));
      onAddMetric(res as HealthMetric);
      setMetricForm({ metric_type: '', value: '' });
      refreshMetrics();
      toast.success(`${metricForm.metric_type} recorded.`);
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Failed to record metric.'); }
    setSavingMetric(false);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'goals', label: 'Fitness Goals', icon: <TargetIcon className="w-4 h-4" /> },
    { id: 'metrics', label: 'Log Metric', icon: <HeartPulseIcon className="w-4 h-4" /> },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile Management</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Update your profile, manage goals, and log health metrics</p>
      </div>

      <div className="flex gap-0 mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit shadow-sm overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${tab === t.id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
            {t.icon}<span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Edit Profile" subtitle="Update your name and contact information" />
              <form onSubmit={handleProfileSave} className="space-y-4">
                <Input label="Full Name" value={profileForm.full_name}
                  onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
                <Input label="Email Address" value={currentUser.email} disabled hint="Email cannot be changed" />
                <Input label="Phone Number" value={profileForm.phone}
                  onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Date of Birth" value={member.date_of_birth} disabled />
                  <Input label="Gender" value={member.gender} disabled />
                </div>
                <Button type="submit" variant="primary" loading={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </Button>
              </form>
            </Card>
          </div>
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Account Info</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Member ID</span>
                <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{member.id.slice(0, 8)}…</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">Email</span>
                <span className="text-slate-700 dark:text-slate-300">{currentUser.email}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">Registered</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date(member.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'goals' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title={editingGoal ? 'Edit Fitness Goal' : 'Add Fitness Goal'} subtitle={editingGoal ? 'Update your fitness target' : 'Set a new target for your fitness journey'} />
              <form onSubmit={handleAddOrUpdateGoal} className="space-y-4">
                <Input label="Description *" placeholder="e.g. Run 5km without stopping"
                  value={goalForm.description} onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))} />
                <Input label="Target Value" placeholder="e.g. 5km, 70kg, 30 min"
                  value={goalForm.target_value} onChange={e => setGoalForm(f => ({ ...f, target_value: e.target.value }))} />
                <div className="flex gap-2">
                  <Button type="submit" variant="primary" loading={savingGoal}>
                    {savingGoal ? (editingGoal ? 'Saving…' : 'Adding…') : (editingGoal ? 'Save Changes' : 'Add Goal')}
                  </Button>
                  {editingGoal && (
                    <Button type="button" variant="secondary" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>
          <Card>
            <CardHeader title="My Goals" subtitle={`${goalsData.length} goal${goalsData.length !== 1 ? 's' : ''}`} />
            {goalsData.length === 0 ? (
              <div className="py-6 text-center">
                <TargetIcon className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No goals yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {goalsData.map(g => (
                    <div key={g.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{g.description}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="teal">Active</Badge>
                          <button 
                            onClick={() => handleEditGoal(g)}
                            className="p-1 text-slate-400 hover:text-teal-600 transition-colors"
                            title="Edit goal">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
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
        </div>
      )}

      {tab === 'metrics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader title="Log Health Metric" subtitle="Track your health over time" />
              <form onSubmit={handleAddMetric} className="space-y-4">
                <Dropdown label="Metric Type" value={metricForm.metric_type}
                  onChange={v => setMetricForm(f => ({ ...f, metric_type: v }))}
                  options={METRIC_OPTIONS} placeholder="Select metric type" />
                <Input label="Value" type="number" step="0.1" placeholder="e.g. 72.5"
                  value={metricForm.value} onChange={e => setMetricForm(f => ({ ...f, value: e.target.value }))} />
                <Button type="submit" variant="primary" loading={savingMetric}>
                  {savingMetric ? 'Recording…' : 'Record Metric'}
                </Button>
              </form>
            </Card>
          </div>
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Recent Metrics</h3>
            {metricsData.length === 0 ? (
              <div className="py-4 text-center">
                <HeartPulseIcon className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">No metrics recorded yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-4">
                  {metricsData.map(m => (
                    <div key={m.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{m.metric_type}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(m.recorded_at).toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">{m.metric_value}</div>
                    </div>
                  ))}
                </div>
                <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-700">
                  <Pagination currentPage={metricsPage} totalPages={metricsTotalPages}
                    onPageChange={setMetricsPage} totalItems={metricsTotalItems} pageSize={PAGE_SIZE} />
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

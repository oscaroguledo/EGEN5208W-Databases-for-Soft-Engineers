import React, { useEffect, useState } from 'react';
import { UserIcon, TargetIcon, HeartPulseIcon } from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Pagination, usePagination } from '../../components/ui/Pagination';
import { Button } from '../../components/ui/Button';
import { Input, Textarea } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Dropdown } from '../../components/ui/Dropdown';
import { ProfileSkeleton } from '../../components/ui/Skeleton';
import { toast } from 'sonner';
import { User, Member, FitnessGoal, HealthMetric } from '../../data/types';
interface ProfilePageProps {
  currentUser: User;
  members: Member[];
  fitnessGoals: FitnessGoal[];
  healthMetrics: HealthMetric[];
  onUpdateMember: (updated: Member) => void;
  onAddGoal: (goal: FitnessGoal) => void;
  onAddMetric: (metric: HealthMetric) => void;
}
type Tab = 'profile' | 'goals' | 'metrics';
const GOAL_OPTIONS = [
{
  value: '',
  label: 'Select goal type'
},
{
  value: 'Weight Loss',
  label: 'Weight Loss'
},
{
  value: 'Muscle Gain',
  label: 'Muscle Gain'
},
{
  value: 'Cardio Fitness',
  label: 'Cardio Fitness'
},
{
  value: 'Flexibility',
  label: 'Flexibility'
},
{
  value: 'Endurance',
  label: 'Endurance'
}];

const METRIC_OPTIONS = [
{
  value: '',
  label: 'Select metric type'
},
{
  value: 'Weight',
  label: 'Weight'
},
{
  value: 'Heart Rate',
  label: 'Heart Rate'
},
{
  value: 'BMI',
  label: 'BMI'
},
{
  value: 'Blood Pressure',
  label: 'Blood Pressure'
},
{
  value: 'Body Fat',
  label: 'Body Fat %'
}];

const METRIC_UNITS: Record<string, string> = {
  Weight: 'kg',
  'Heart Rate': 'bpm',
  BMI: 'kg/m²',
  'Blood Pressure': 'mmHg',
  'Body Fat': '%'
};
export function ProfilePage({
  currentUser,
  members,
  fitnessGoals,
  healthMetrics,
  onUpdateMember,
  onAddGoal,
  onAddMetric
}: ProfilePageProps) {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingGoal, setSavingGoal] = useState(false);
  const [savingMetric, setSavingMetric] = useState(false);
  const [tab, setTab] = useState<Tab>('profile');
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);
  const member = members.find((m) => m.user_id === currentUser.user_id)!;
  const mid = member?.member_id ?? -1;
  const myGoals = fitnessGoals.filter((g) => g.member_id === mid && g.is_active);
  const goalsPagination = usePagination(myGoals, 4);
  const [profileForm, setProfileForm] = useState({
    full_name: member?.full_name || '',
    phone: member?.phone || ''
  });
  const [goalForm, setGoalForm] = useState({
    goal_type: '',
    target_value: '',
    target_unit: '',
    description: ''
  });
  const [metricForm, setMetricForm] = useState({
    metric_type: '',
    value: '',
    unit: ''
  });
  if (!member)
  return (
    <div className="text-slate-500 dark:text-slate-400">
        Member profile not found.
      </div>);

  if (loading) return <ProfileSkeleton />;
  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.full_name.trim()) {
      toast.error('Full name cannot be empty.');
      return;
    }
    setSavingProfile(true);
    setTimeout(() => {
      onUpdateMember({
        ...member,
        full_name: profileForm.full_name,
        phone: profileForm.phone
      });
      setSavingProfile(false);
      toast.success('Profile updated successfully.');
    }, 400);
  };
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.goal_type.trim()) {
      toast.error('Goal type is required.');
      return;
    }
    setSavingGoal(true);
    setTimeout(() => {
      const newId = Math.max(...fitnessGoals.map((g) => g.goal_id), 0) + 1;
      onAddGoal({
        goal_id: newId,
        member_id: member.member_id,
        goal_type: goalForm.goal_type,
        target_value: parseFloat(goalForm.target_value) || 0,
        target_unit: goalForm.target_unit,
        description: goalForm.description,
        is_active: true,
        created_at: new Date().toISOString()
      });
      setGoalForm({
        goal_type: '',
        target_value: '',
        target_unit: '',
        description: ''
      });
      setSavingGoal(false);
      toast.success(`Fitness goal "${goalForm.goal_type}" added successfully.`);
    }, 400);
  };
  const handleAddMetric = (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricForm.metric_type || !metricForm.value) {
      toast.error('Metric type and value are required.');
      return;
    }
    setSavingMetric(true);
    setTimeout(() => {
      const newId = Math.max(...healthMetrics.map((m) => m.metric_id), 0) + 1;
      onAddMetric({
        metric_id: newId,
        member_id: member.member_id,
        metric_type: metricForm.metric_type,
        value: parseFloat(metricForm.value),
        unit: metricForm.unit,
        recorded_at: new Date().toISOString()
      });
      setMetricForm({
        metric_type: '',
        value: '',
        unit: ''
      });
      setSavingMetric(false);
      toast.success(
        `Health metric "${metricForm.metric_type}" recorded successfully.`
      );
    }, 400);
  };
  const tabs: {
    id: Tab;
    label: string;
    icon: React.ReactNode;
  }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: <UserIcon className="w-4 h-4" />
  },
  {
    id: 'goals',
    label: 'Fitness Goals',
    icon: <TargetIcon className="w-4 h-4" />
  },
  {
    id: 'metrics',
    label: 'Log Metric',
    icon: <HeartPulseIcon className="w-4 h-4" />
  }];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Profile Management
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Update your profile, manage goals, and log health metrics
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 mb-6 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1 w-fit shadow-sm overflow-x-auto">
        {tabs.map((t) =>
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${tab === t.id ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>

            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        )}
      </div>

      {tab === 'profile' &&
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
              title="Edit Profile"
              subtitle="Update your name and contact information" />

              <form onSubmit={handleProfileSave} className="space-y-4">
                <Input
                label="Full Name"
                value={profileForm.full_name}
                onChange={(e) =>
                setProfileForm((f) => ({
                  ...f,
                  full_name: e.target.value
                }))
                } />

                <Input
                label="Email Address"
                value={member.email}
                disabled
                hint="Email cannot be changed" />

                <Input
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) =>
                setProfileForm((f) => ({
                  ...f,
                  phone: e.target.value
                }))
                } />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                  label="Date of Birth"
                  value={member.date_of_birth}
                  disabled />

                  <Input label="Gender" value={member.gender} disabled />
                </div>
                <Button type="submit" variant="primary" loading={savingProfile}>
                  {savingProfile ? 'Saving…' : 'Save Changes'}
                </Button>
              </form>
            </Card>
          </div>
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
              Account Info
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">
                  Member ID
                </span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                  #{member.member_id}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-50 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400">
                  Username
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {currentUser.username}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500 dark:text-slate-400">
                  Registered
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(member.registered_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      }

      {tab === 'goals' &&
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
              title="Add Fitness Goal"
              subtitle="Set a new target for your fitness journey" />

              <form onSubmit={handleAddGoal} className="space-y-4">
                <Dropdown
                label="Goal Type"
                value={goalForm.goal_type}
                onChange={(v) =>
                setGoalForm((f) => ({
                  ...f,
                  goal_type: v
                }))
                }
                options={GOAL_OPTIONS}
                placeholder="Select goal type" />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                  label="Target Value"
                  type="number"
                  placeholder="e.g. 65"
                  value={goalForm.target_value}
                  onChange={(e) =>
                  setGoalForm((f) => ({
                    ...f,
                    target_value: e.target.value
                  }))
                  } />

                  <Input
                  label="Unit"
                  placeholder="e.g. kg, min, reps"
                  value={goalForm.target_unit}
                  onChange={(e) =>
                  setGoalForm((f) => ({
                    ...f,
                    target_unit: e.target.value
                  }))
                  } />

                </div>
                <Textarea
                label="Description"
                placeholder="Describe your goal..."
                value={goalForm.description}
                onChange={(e) =>
                setGoalForm((f) => ({
                  ...f,
                  description: e.target.value
                }))
                } />

                <Button type="submit" variant="primary" loading={savingGoal}>
                  {savingGoal ? 'Adding…' : 'Add Goal'}
                </Button>
              </form>
            </Card>
          </div>
          <Card>
              <CardHeader
                title="Active Goals"
                subtitle={`${myGoals.length} active`} />

              {myGoals.length === 0 ? (
                <div className="py-6 text-center">
                  <TargetIcon className="w-8 h-8 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    No active goals yet.
                  </p>
                </div>
              ) : (
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
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {g.description}
                        </div>
                        {g.target_value > 0 && (
                          <div className="text-xs font-semibold text-teal-600 dark:text-teal-400 mt-1">
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
              )}
          </Card>
        </div>
      }

      {tab === 'metrics' &&
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader
              title="Log Health Metric"
              subtitle="Track your health over time" />

              <form onSubmit={handleAddMetric} className="space-y-4">
                <Dropdown
                label="Metric Type"
                value={metricForm.metric_type}
                onChange={(v) =>
                setMetricForm((f) => ({
                  ...f,
                  metric_type: v,
                  unit: METRIC_UNITS[v] || ''
                }))
                }
                options={METRIC_OPTIONS}
                placeholder="Select metric type" />

                <div className="grid grid-cols-2 gap-4">
                  <Input
                  label="Value"
                  type="number"
                  step="0.1"
                  placeholder="e.g. 72.5"
                  value={metricForm.value}
                  onChange={(e) =>
                  setMetricForm((f) => ({
                    ...f,
                    value: e.target.value
                  }))
                  } />

                  <Input
                  label="Unit"
                  placeholder="e.g. kg"
                  value={metricForm.unit}
                  onChange={(e) =>
                  setMetricForm((f) => ({
                    ...f,
                    unit: e.target.value
                  }))
                  } />

                </div>
                <Button type="submit" variant="primary" loading={savingMetric}>
                  {savingMetric ? 'Recording…' : 'Record Metric'}
                </Button>
              </form>
            </Card>
          </div>
          <Card>
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              About Health Metrics
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Health metrics are stored as historical records. Each entry is
              timestamped and cannot be edited after saving.
            </p>
            <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/30 rounded-xl border border-teal-100 dark:border-teal-800">
              <p className="text-xs text-teal-700 dark:text-teal-300 font-medium">
                💡 Tip
              </p>
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">
                Log metrics regularly to track your progress over time.
              </p>
            </div>
          </Card>
        </div>
      }
    </div>);

}
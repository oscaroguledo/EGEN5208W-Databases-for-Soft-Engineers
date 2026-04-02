import { useCallback, useState } from 'react';
import { UserIcon } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Dropdown } from '@/components/ui/Dropdown';
import { toast } from 'sonner';
import { User, Member } from '@/data/types';
import * as membersApi from '@/apis/members';

interface RegistrationPageProps {
  onRegister: (user: User, member: Member) => void;
  onGoBack?: () => void;
}

interface FormState {
  email: string;
  password: string;
  confirm_password: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  phone: string;
}

const EMPTY_FORM: FormState = {
  email: '', password: '', confirm_password: '',
  full_name: '', date_of_birth: '', gender: '', phone: '',
};

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function RegistrationPage({ onRegister, onGoBack }: RegistrationPageProps) {
  const [form, setForm]       = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]   = useState<Partial<FormState>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [loading, setLoading] = useState(false);

  const validateField = useCallback((field: keyof FormState, value: string, f: FormState): string => {
    switch (field) {
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!isValidEmail(value)) return 'Enter a valid email';
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 6) return `Min 6 characters (${value.length}/6)`;
        return '';
      case 'confirm_password':
        if (!value) return 'Please confirm your password';
        if (value !== f.password) return 'Passwords do not match';
        return '';
      case 'full_name':
        if (!value.trim()) return 'Full name is required';
        return '';
      case 'date_of_birth':
        if (!value) return 'Date of birth is required';
        return '';
      case 'gender':
        if (!value) return 'Please select a gender';
        return '';
      default:
        return '';
    }
  }, []);

  const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    const newForm = { ...form, [field]: value };
    setForm(newForm);
    if (touched[field]) {
      const err = validateField(field, value, newForm);
      setErrors(prev => ({ ...prev, [field]: err }));
      if (field === 'password' && touched.confirm_password) {
        setErrors(prev => ({ ...prev, confirm_password: validateField('confirm_password', newForm.confirm_password, newForm) }));
      }
    }
  };

  const handleBlur = (field: keyof FormState) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(prev => ({ ...prev, [field]: validateField(field, form[field], form) }));
  };

  const handleGenderChange = (value: string) => {
    const newForm = { ...form, gender: value };
    setForm(newForm);
    setTouched(prev => ({ ...prev, gender: true }));
    setErrors(prev => ({ ...prev, gender: validateField('gender', value, newForm) }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const required: (keyof FormState)[] = ['email', 'password', 'confirm_password', 'full_name', 'date_of_birth', 'gender'];
    setTouched(Object.fromEntries(required.map(f => [f, true])));
    const newErrors: Partial<FormState> = {};
    for (const f of required) {
      const err = validateField(f, form[f], form);
      if (err) newErrors[f] = err;
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    (async () => {
      try {
        const member = await membersApi.registerMember({
          email: form.email.toLowerCase().trim(),
          password: form.password,
          full_name: form.full_name,
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          phone: form.phone,
        });
        // Build a minimal User from the member data (login happens separately)
        const user: User = { id: member.id, email: form.email.toLowerCase().trim(), role: 'member', full_name: form.full_name };
        onRegister(user, member as Member);
        toast.success(`Welcome, ${form.full_name}! Account created — please sign in.`);
        setForm(EMPTY_FORM);
        setErrors({});
        setTouched({});
        if (onGoBack) onGoBack();
      } catch (err: any) {
        toast.error(err?.message || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Member Registration</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Create a new member account</p>
        </div>
        <Card>
          <CardHeader title="New Member Account" subtitle="Fields marked * are required" action={<UserIcon className="w-5 h-5 text-teal-600" />} />
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input label="Email Address *" type="email" placeholder="you@example.com"
              value={form.email} onChange={handleChange('email')} onBlur={handleBlur('email')} error={errors.email} autoComplete="email" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Password *" type="password" placeholder="Min 6 characters"
                value={form.password} onChange={handleChange('password')} onBlur={handleBlur('password')}
                error={errors.password} showPasswordToggle autoComplete="new-password" />
              <Input label="Confirm Password *" type="password" placeholder="Repeat password"
                value={form.confirm_password} onChange={handleChange('confirm_password')} onBlur={handleBlur('confirm_password')}
                error={errors.confirm_password} showPasswordToggle autoComplete="new-password" />
            </div>
            <Input label="Full Name *" placeholder="e.g. John Doe"
              value={form.full_name} onChange={handleChange('full_name')} onBlur={handleBlur('full_name')} error={errors.full_name} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Date of Birth *" type="date"
                value={form.date_of_birth} onChange={handleChange('date_of_birth')} onBlur={handleBlur('date_of_birth')} error={errors.date_of_birth} />
              <Dropdown label="Gender *" value={form.gender} onChange={handleGenderChange}
                options={GENDER_OPTIONS} placeholder="Select gender" error={errors.gender} />
            </div>
            <Input label="Phone Number" type="tel" placeholder="e.g. 555-0100"
              value={form.phone} onChange={handleChange('phone')} />
            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" variant="primary" loading={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setForm(EMPTY_FORM); setErrors({}); setTouched({}); }}>
                Clear Form
              </Button>
              {onGoBack && <Button type="button" variant="ghost" onClick={onGoBack}>Back to Login</Button>}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

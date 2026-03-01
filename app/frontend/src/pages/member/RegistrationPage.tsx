import React, { useCallback, useState } from 'react';
import {
  UserPlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  InfoIcon } from
'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Dropdown } from '../../components/ui/Dropdown';
import { toast } from 'sonner';
import { User, Member, Gender } from '../../data/types';
interface RegistrationPageProps {
  users: User[];
  members: Member[];
  onRegister: (user: User, member: Member) => void;
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
  email: '',
  password: '',
  confirm_password: '',
  full_name: '',
  date_of_birth: '',
  gender: '',
  phone: ''
};
const GENDER_OPTIONS = [
{
  value: 'male',
  label: 'Male'
},
{
  value: 'female',
  label: 'Female'
},
{
  value: 'other',
  label: 'Other'
}];

const isValidEmail = (email: string) =>
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
export function RegistrationPage({
  users,
  members,
  onRegister
}: RegistrationPageProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormState, boolean>>>(
    {});
  const [loading, setLoading] = useState(false);
  // ─── Field-level validation ───────────────────────────────────────────────
  const validateField = useCallback(
    (field: keyof FormState, value: string, currentForm: FormState): string => {
      switch (field) {
        case 'email':{
            if (!value.trim()) return 'Email address is required';
            if (!isValidEmail(value)) return 'Please enter a valid email address';
            const taken =
            members.some(
              (m) => m.email.toLowerCase() === value.toLowerCase().trim()
            ) ||
            users.some(
              (u) => u.username.toLowerCase() === value.toLowerCase().trim()
            );
            if (taken) return 'An account with this email already exists';
            return '';
          }
        case 'password':
          if (!value) return 'Password is required';
          if (value.length < 6)
          return `Password must be at least 6 characters (${value.length}/6)`;
          return '';
        case 'confirm_password':
          if (!value) return 'Please confirm your password';
          if (value !== currentForm.password) return 'Passwords do not match';
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
    },
    [users, members]
  );
  // ─── onChange: update value + re-validate if already touched ─────────────
  const handleChange =
  (field: keyof FormState) =>
  (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.value;
    const newForm = {
      ...form,
      [field]: value
    };
    setForm(newForm);
    if (touched[field]) {
      const err = validateField(field, value, newForm);
      setErrors((prev) => ({
        ...prev,
        [field]: err
      }));
      // If password changes, also re-validate confirm_password if touched
      if (field === 'password' && touched.confirm_password) {
        const confirmErr = validateField(
          'confirm_password',
          newForm.confirm_password,
          newForm
        );
        setErrors((prev) => ({
          ...prev,
          confirm_password: confirmErr
        }));
      }
    }
  };
  // ─── onBlur: mark as touched + validate immediately ───────────────────────
  const handleBlur = (field: keyof FormState) => () => {
    setTouched((prev) => ({
      ...prev,
      [field]: true
    }));
    const err = validateField(field, form[field], form);
    setErrors((prev) => ({
      ...prev,
      [field]: err
    }));
  };
  // ─── Dropdown change (gender) ─────────────────────────────────────────────
  const handleGenderChange = (value: string) => {
    const newForm = {
      ...form,
      gender: value
    };
    setForm(newForm);
    setTouched((prev) => ({
      ...prev,
      gender: true
    }));
    const err = validateField('gender', value, newForm);
    setErrors((prev) => ({
      ...prev,
      gender: err
    }));
  };
  // ─── Submit: validate all fields ──────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Touch all required fields
    const allTouched: Partial<Record<keyof FormState, boolean>> = {
      email: true,
      password: true,
      confirm_password: true,
      full_name: true,
      date_of_birth: true,
      gender: true
    };
    setTouched(allTouched);
    // Validate all
    const newErrors: Partial<FormState> = {};
    const requiredFields: (keyof FormState)[] = [
    'email',
    'password',
    'confirm_password',
    'full_name',
    'date_of_birth',
    'gender'];

    for (const field of requiredFields) {
      const err = validateField(field, form[field], form);
      if (err) newErrors[field] = err;
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const newUserId = Math.max(...users.map((u) => u.user_id)) + 1;
      const newMemberId = Math.max(...members.map((m) => m.member_id)) + 1;
      const newUser: User = {
        user_id: newUserId,
        username: form.email.toLowerCase().trim(),
        password: form.password,
        role: 'member',
        created_at: new Date().toISOString()
      };
      const newMember: Member = {
        member_id: newMemberId,
        user_id: newUserId,
        full_name: form.full_name,
        email: form.email.toLowerCase().trim(),
        date_of_birth: form.date_of_birth,
        gender: form.gender as Gender,
        phone: form.phone,
        registered_at: new Date().toISOString()
      };
      onRegister(newUser, newMember);
      toast.success(
        `Welcome, ${form.full_name}! Your account has been created. You can now sign in.`
      );
      setForm(EMPTY_FORM);
      setErrors({});
      setTouched({});
    }, 400);
  };
  const handleClear = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
  };
  // ─── Live requirement checks ──────────────────────────────────────────────
  const emailValid = isValidEmail(form.email);
  const emailTaken =
  members.some(
    (m) => m.email.toLowerCase() === form.email.toLowerCase().trim()
  ) ||
  users.some(
    (u) => u.username.toLowerCase() === form.email.toLowerCase().trim()
  );
  const passwordLong = form.password.length >= 6;
  const passwordsMatch =
  form.password.length > 0 && form.confirm_password === form.password;
  const requiredFilled =
  form.email.trim() !== '' &&
  form.password !== '' &&
  form.confirm_password !== '' &&
  form.full_name.trim() !== '' &&
  form.date_of_birth !== '' &&
  form.gender !== '';
  const requirements = [
  {
    label: 'Email must be unique and valid',
    met: emailValid && !emailTaken,
    active: form.email.length > 0
  },
  {
    label: 'Password minimum 6 characters',
    met: passwordLong,
    active: form.password.length > 0
  },
  {
    label: 'Passwords must match',
    met: passwordsMatch,
    active: form.confirm_password.length > 0
  },
  {
    label: 'All required fields must be filled',
    met: requiredFilled,
    active: Object.values(form).some((v) => v !== '')
  }];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            Member Registration
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Create a new member account
          </p>
        </div>

        <Card>
          <CardHeader
            title="New Member Account"
            subtitle="All fields marked with * are required"
            action={<UserPlusIcon className="w-5 h-5 text-teal-600" />} />


          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label="Email Address *"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange('email')}
              onBlur={handleBlur('email')}
              error={errors.email}
              autoComplete="email" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password *"
                type="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange('password')}
                onBlur={handleBlur('password')}
                error={errors.password}
                showPasswordToggle={true}
                autoComplete="new-password" />

              <Input
                label="Confirm Password *"
                type="password"
                placeholder="Repeat password"
                value={form.confirm_password}
                onChange={handleChange('confirm_password')}
                onBlur={handleBlur('confirm_password')}
                error={errors.confirm_password}
                showPasswordToggle={true}
                autoComplete="new-password" />

            </div>
            <Input
              label="Full Name *"
              placeholder="e.g. John Doe"
              value={form.full_name}
              onChange={handleChange('full_name')}
              onBlur={handleBlur('full_name')}
              error={errors.full_name} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Date of Birth *"
                type="date"
                value={form.date_of_birth}
                onChange={handleChange('date_of_birth')}
                onBlur={handleBlur('date_of_birth')}
                error={errors.date_of_birth} />

              <Dropdown
                label="Gender *"
                value={form.gender}
                onChange={handleGenderChange}
                options={GENDER_OPTIONS}
                placeholder="Select gender"
                error={errors.gender} />

            </div>
            <Input
              label="Phone Number"
              type="tel"
              placeholder="e.g. 555-0100"
              value={form.phone}
              onChange={handleChange('phone')} />

            <div className="flex flex-wrap gap-3 pt-2">
              <Button type="submit" variant="primary" loading={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </Button>
              <Button type="button" variant="secondary" onClick={handleClear}>
                Clear Form
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>);

}
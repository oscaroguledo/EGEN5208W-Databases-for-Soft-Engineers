import React from 'react';
type BadgeVariant =
'success' |
'warning' |
'danger' |
'info' |
'neutral' |
'teal';
interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}
const variantClasses: Record<BadgeVariant, string> = {
  success:
  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  warning:
  'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  danger: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  neutral: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
};
export function Badge({
  variant = 'neutral',
  children,
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>

      {children}
    </span>);

}
export function RoleBadge({ role }: {role: string;}) {
  const map: Record<string, BadgeVariant> = {
    member: 'teal',
    trainer: 'info',
    admin: 'warning'
  };
  return (
    <Badge variant={map[role] || 'neutral'}>
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>);

}
export function StatusBadge({ status }: {status: string;}) {
  const map: Record<string, BadgeVariant> = {
    operational: 'success',
    'under repair': 'warning',
    'out of service': 'danger',
    scheduled: 'teal',
    full: 'warning',
    cancelled: 'danger',
    completed: 'neutral'
  };
  return <Badge variant={map[status] || 'neutral'}>{status}</Badge>;
}
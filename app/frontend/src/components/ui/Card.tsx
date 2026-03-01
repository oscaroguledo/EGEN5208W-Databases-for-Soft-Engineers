import React from 'react';
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}
export function Card({ children, className = '', padding = 'md' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${paddingClasses[padding]} ${className}`}>

      {children}
    </div>);

}
export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {subtitle &&
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {subtitle}
          </p>
        }
      </div>
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>);

}
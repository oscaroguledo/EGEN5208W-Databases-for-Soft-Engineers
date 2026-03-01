import React from 'react';
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
}
const variantClasses: Record<ButtonVariant, string> = {
  primary:
  'bg-teal-600 hover:bg-teal-700 text-white border-transparent dark:bg-teal-600 dark:hover:bg-teal-700',
  secondary:
  'bg-slate-100 hover:bg-slate-200 text-slate-700 border-transparent dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-200',
  danger:
  'bg-red-600 hover:bg-red-700 text-white border-transparent dark:bg-red-600 dark:hover:bg-red-700',
  ghost:
  'bg-transparent hover:bg-slate-100 text-slate-600 border-transparent dark:hover:bg-slate-700 dark:text-slate-400',
  outline:
  'bg-white hover:bg-slate-50 text-slate-700 border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-600'
};
const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base'
};
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg border
        transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1
        dark:focus:ring-offset-slate-900
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}>

      {loading &&
      <svg
        className="animate-spin h-4 w-4 flex-shrink-0"
        viewBox="0 0 24 24"
        fill="none">

          <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4" />

          <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />

        </svg>
      }
      {children}
    </button>);

}
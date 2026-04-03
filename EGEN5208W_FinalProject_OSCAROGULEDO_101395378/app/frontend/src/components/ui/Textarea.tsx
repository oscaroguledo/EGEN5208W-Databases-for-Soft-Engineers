import React from 'react';

interface TextareaProps extends
  React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({
  label,
  error,
  className = '',
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label &&
      <label
        htmlFor={textareaId}
        className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      }
      <textarea
        id={textareaId}
        rows={3}
        className={`
          w-full px-3 py-2 text-sm rounded-lg border
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-100
          placeholder:text-slate-400 dark:placeholder:text-slate-500
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
          transition-colors resize-none
          ${error ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}
          ${className}
        `}
        {...props} />

      {error &&
      <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      }
    </div>);
}

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  showPasswordToggle?: boolean;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  children: React.ReactNode;
}

interface TextareaProps extends
  React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  hint,
  className = '',
  id,
  showPasswordToggle = false,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  const togglePasswordVisibility = () => {
    console.log('Toggle password clicked, current state:', showPassword);
    setShowPassword(!showPassword);
  };

  const inputType = showPasswordToggle && props.type === 'password' 
    ? (showPassword ? 'text' : 'password')
    : props.type;
  
  console.log('Input type logic:', {
    showPasswordToggle,
    propsType: props.type,
    showPassword,
    finalType: inputType
  });

  return (
    <div className="flex flex-col gap-1 relative">
      {label &&
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      }
      <div className="relative">
        <input
          id={inputId}
          type={inputType}
          className={`
            w-full px-3 py-2 text-sm rounded-lg border
            bg-white dark:bg-slate-800
            text-slate-900 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
            transition-colors
            ${error ? 'border-red-400 dark:border-red-500 focus:ring-red-400 focus:border-red-400' : 'border-slate-300 dark:border-slate-600'}
            ${showPasswordToggle ? 'pr-10' : ''}
            ${className}
          `}
          {...props}
        />
        
        {showPasswordToggle && props.type === 'password' && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              togglePasswordVisibility();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus:outline-none bg-transparent z-10 p-1 rounded cursor-pointer"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={0}
            style={{
              right: '0.75rem'
            }}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      
      {error &&
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      }
      {hint && !error &&
        <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      }
    </div>
  );
}

export function Select({
  label,
  error,
  children,
  className = '',
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1">
      {label &&
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-slate-700 dark:text-slate-300">

          {label}
        </label>
      }
      <select
        id={selectId}
        className={`
          w-full px-3 py-2 text-sm rounded-lg border
          bg-white dark:bg-slate-800
          text-slate-900 dark:text-slate-100
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
          transition-colors
          ${error ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'}
          ${className}
        `}
        {...props}>

        {children}
      </select>
      {error &&
      <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      }
    </div>);

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
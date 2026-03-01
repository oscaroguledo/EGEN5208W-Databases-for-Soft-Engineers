import React, { useEffect, useState, useRef } from 'react';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';
export interface DropdownOption {
  value: string;
  label: string;
}
interface DropdownProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}
export function Dropdown({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  disabled = false,
  className = ''
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedOption = options.find((o) => o.value === value);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false);
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((o) => !o);
    }
    if (e.key === 'ArrowDown' && open) {
      e.preventDefault();
      const currentIndex = options.findIndex((o) => o.value === value);
      const next = options[currentIndex + 1];
      if (next) onChange(next.value);
    }
    if (e.key === 'ArrowUp' && open) {
      e.preventDefault();
      const currentIndex = options.findIndex((o) => o.value === value);
      const prev = options[currentIndex - 1];
      if (prev) onChange(prev.value);
    }
  };
  return (
    <div className={`flex flex-col gap-1 ${className}`} ref={ref}>
      {label &&
      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      }
      <div className="relative">
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={handleKeyDown}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`
            w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border
            bg-white dark:bg-slate-800 transition-colors text-left
            focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500'}
          `}>

          <span
            className={
            selectedOption ?
            'text-slate-900 dark:text-slate-100' :
            'text-slate-400 dark:text-slate-500'
            }>

            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDownIcon
            className={`w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />

        </button>

        {open &&
        <div
          className="dropdown-menu absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg overflow-hidden"
          role="listbox">

            <div className="max-h-52 overflow-y-auto py-1">
              {options.length === 0 ?
            <div className="px-3 py-2 text-sm text-slate-400 dark:text-slate-500">
                  No options available
                </div> :

            options.map((option) =>
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
              className={`
                      w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors
                      ${option.value === value ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}
                    `}>

                    <span>{option.label}</span>
                    {option.value === value &&
              <CheckIcon className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
              }
                  </button>
            )
            }
            </div>
          </div>
        }
      </div>
      {error &&
      <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      }
    </div>);

}
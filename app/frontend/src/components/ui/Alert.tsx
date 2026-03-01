import React from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  InfoIcon } from
'lucide-react';
type AlertVariant = 'success' | 'error' | 'warning' | 'info';
interface AlertProps {
  variant: AlertVariant;
  message: string;
  onDismiss?: () => void;
}
const config: Record<
  AlertVariant,
  {
    icon: React.ReactNode;
    classes: string;
  }> =
{
  success: {
    icon:
    <CheckCircleIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />,

    classes:
    'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
  },
  error: {
    icon:
    <XCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />,

    classes:
    'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-800 dark:text-red-300'
  },
  warning: {
    icon:
    <AlertTriangleIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />,

    classes:
    'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300'
  },
  info: {
    icon:
    <InfoIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />,

    classes:
    'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300'
  }
};
export function Alert({ variant, message, onDismiss }: AlertProps) {
  const { icon, classes } = config[variant];
  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-lg border text-sm ${classes}`}
      role="alert">

      {icon}
      <span className="flex-1">{message}</span>
      {onDismiss &&
      <button
        onClick={onDismiss}
        className="ml-2 opacity-60 hover:opacity-100 transition-opacity text-xs font-medium">

          ✕
        </button>
      }
    </div>);

}
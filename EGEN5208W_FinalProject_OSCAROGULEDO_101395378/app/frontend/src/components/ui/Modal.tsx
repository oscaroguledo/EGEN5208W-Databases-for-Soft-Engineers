import React, { useEffect } from 'react';
import { XIcon } from 'lucide-react';
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md'
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);
  if (!isOpen) return null;
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl'
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true" />

      <div
        className={`relative bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <h3
            id="modal-title"
            className="text-lg font-semibold text-slate-900 dark:text-slate-100">

            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal">

            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer &&
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
            {footer}
          </div>
        }
      </div>
    </div>);

}
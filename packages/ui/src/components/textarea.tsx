import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="flex flex-col gap-1">
      <textarea
        ref={ref}
        className={cn(
          'min-h-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-50',
          error && 'border-red-500 focus-visible:ring-red-500',
          className,
        )}
        aria-invalid={!!error}
        {...props}
      />
      {error && <span className="text-sm text-red-600 dark:text-red-400">{error}</span>}
    </div>
  ),
);
Textarea.displayName = 'Textarea';

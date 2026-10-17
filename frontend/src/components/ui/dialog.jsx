import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function Dialog({ open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100 max-h-[90vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, children, ...props }) {
  return <div className={cn('flex flex-col space-y-1.5 pb-4 border-b border-slate-100', className)} {...props}>{children}</div>;
}

export function DialogContent({ className, children, ...props }) {
  return <div className={cn('py-4', className)} {...props}>{children}</div>;
}


export function DialogTitle({ className, children, ...props }) {
  return <h2 className={cn('text-lg font-bold text-slate-900', className)} {...props}>{children}</h2>;
}

export function DialogDescription({ className, children, ...props }) {
  return <p className={cn('text-sm text-slate-500', className)} {...props}>{children}</p>;
}

export function DialogFooter({ className, children, ...props }) {
  return <div className={cn('flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6', className)} {...props}>{children}</div>;
}

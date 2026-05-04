import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-md', closeOnBackdropClick = false, breakSafe = false }) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdropClick && typeof onClose === 'function') onClose();
  };

  // If a modal must remain interactive during a break overlay, set `breakSafe` to true
  const backdropClass = breakSafe ? 'fixed inset-0 z-[100005] flex items-center justify-center bg-black/50' : 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';

  return (
    <div className={backdropClass} onClick={handleBackdropClick}>
      <div
        className={`w-full ${maxWidth} rounded-lg bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border border-slate-200 dark:border-slate-700 shadow-xl dark:shadow-slate-900/50`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

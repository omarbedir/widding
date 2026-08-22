import type { ToastNotification } from '../types';

interface ToastContainerProps {
  toasts: ToastNotification[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-300 shadow-emerald-950/50'
              : toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500 text-rose-300 shadow-rose-950/50'
              : 'bg-slate-900/95 border-amber-500 text-amber-300 shadow-amber-950/50'
          }`}
        >
          <i
            className={`fa-solid ${
              toast.type === 'success'
                ? 'fa-circle-check'
                : toast.type === 'error'
                ? 'fa-circle-xmark'
                : 'fa-bell'
            } text-sm`}
          ></i>
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  );
};

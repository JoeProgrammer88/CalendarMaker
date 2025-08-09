import React from 'react';
import { useCalendarStore } from '../../store/store';

export const ToastHost: React.FC = () => {
  const { toasts, remove } = useCalendarStore(s => ({ toasts: s.ui.toasts, remove: s.actions.removeToast }));
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={
          'min-w-[240px] max-w-[320px] px-3 py-2 rounded shadow text-sm text-white flex items-start gap-2 ' +
          (t.type === 'success' ? 'bg-green-600' : t.type === 'error' ? 'bg-red-600' : 'bg-gray-800')
        }>
          <div className="flex-1">{t.text}</div>
          <button onClick={() => remove(t.id)} className="opacity-80 hover:opacity-100">✕</button>
        </div>
      ))}
    </div>
  );
};

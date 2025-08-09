import React from 'react';
import { useCalendarStore } from '../../store/store';

export const EventModal: React.FC = () => {
  const { open, dateISO, editEventId, events, close, add, update, remove, toast } = useCalendarStore(s => ({
    open: s.ui.eventDialog.open,
    dateISO: s.ui.eventDialog.dateISO,
    editEventId: s.ui.eventDialog.editEventId,
    events: s.project.events,
    close: s.actions.closeEventDialog,
    add: s.actions.addEvent,
    update: s.actions.updateEvent,
    remove: s.actions.deleteEvent,
    toast: s.actions.addToast
  }));
  const [text, setText] = React.useState('');
  const [color, setColor] = React.useState<string>('');
  const dayEvents = React.useMemo(() => {
    if (!dateISO) return [] as typeof events;
    return events.filter(e => e.dateISO === dateISO);
  }, [events, dateISO]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!open) return;
    if (editEventId) {
      setSelectedId(editEventId);
      const ev = events.find(e => e.id === editEventId);
      setText(ev?.text || '');
      setColor(ev?.color || '');
    } else {
      setSelectedId(null);
      setText('');
      setColor('');
    }
  }, [open, editEventId, events]);
  if (!open || !dateISO) return null;
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (selectedId) {
      update(selectedId, { text: text.trim(), color: color || undefined });
      toast('Event saved', 'success');
    } else {
      add({ dateISO, text: text.trim(), color: color || undefined });
      toast('Event added', 'success');
    }
    close();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={close} />
      <div className="relative bg-white dark:bg-gray-800 rounded shadow-xl w-[360px] max-w-[90vw] p-4 border border-gray-200 dark:border-gray-700">
        <div className="text-sm font-semibold mb-2">{selectedId ? 'Edit Event' : 'Add Event'} – {dateISO}</div>
        {dayEvents.length > 1 && !selectedId && (
          <div className="mb-2 text-xs">
            <div className="mb-1">Multiple events on this day. Choose one to edit or create a new one:</div>
            <div className="space-y-1 max-h-24 overflow-auto">
              {dayEvents.map(ev => (
                <button key={ev.id} type="button" onClick={() => { setSelectedId(ev.id); setText(ev.text); setColor(ev.color || ''); }} className="w-full text-left px-2 py-1 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-900">
                  {ev.text}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <button type="button" onClick={() => { setSelectedId(null); setText(''); setColor(''); }} className="text-blue-600 hover:underline">+ Create new</button>
            </div>
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block text-xs">
            <span className="block mb-1">Text</span>
            <input autoFocus value={text} onChange={e => setText(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1" placeholder="Event description" />
          </label>
          <label className="block text-xs">
            <span className="block mb-1">Color (optional)</span>
            <input type="color" value={color || '#000000'} onChange={e => setColor(e.target.value)} className="w-16 h-8 p-0 border border-gray-300 dark:border-gray-600 rounded bg-transparent" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={close} className="px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600">Cancel</button>
            {selectedId && (
              <button type="button" onClick={() => { if (confirm('Delete this event?')) { remove(selectedId); toast('Event deleted', 'success'); close(); } }} className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700">Delete</button>
            )}
            <button type="submit" className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700">{selectedId ? 'Save' : 'Add'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

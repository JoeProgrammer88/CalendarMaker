import React from 'react';
import { useCalendarStore } from '../../store/store';
import { FONT_OPTIONS } from '../../util/constants';

export const RightPanel: React.FC = () => {
  const { fontFamily, setFontFamily } = useCalendarStore(s => ({
    fontFamily: s.project.calendar.fontFamily,
    setFontFamily: s.actions.setFontFamily
  }));
  const exportPng = useCalendarStore(s => s.actions.exportCurrentMonthPng);
  const clearAll = useCalendarStore(s => s.actions.clearAllData);
  return (
    <aside className="w-72 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col text-sm p-3 min-h-0 overflow-auto">
      <div className="font-semibold uppercase tracking-wide text-xs text-gray-600 dark:text-gray-300 mb-2">Font</div>
  <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 mb-2">
        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
  <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">Preview:</div>
  <div className="border border-gray-300 dark:border-gray-600 rounded p-2 mb-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100" style={{ fontFamily }}>The quick brown fox jumps over the lazy dog 123</div>
  {/* Caption and Alt text editors removed intentionally */}
  <div className="font-semibold uppercase tracking-wide text-xs text-gray-600 dark:text-gray-300 mb-2">Actions</div>
      <ExportButton />
      <div className="mt-2 grid grid-cols-2 gap-2">
  {/* Undo/Redo removed */}
        <button onClick={exportPng} className="col-span-2 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700">Export Current Page (PNG)</button>
        <button onClick={() => { if (confirm('Clear all saved data? This removes photos and the project.')) clearAll(); }} className="col-span-2 px-2 py-1 rounded border border-red-600 text-red-600 hover:bg-red-50">Clear All Data</button>
      </div>
    </aside>
  );
};

const ExportButton: React.FC = () => {
  const exportProject = useCalendarStore(s => s.actions.exportProject);
  const exporting = useCalendarStore(s => s.ui.exporting);
  const progress = useCalendarStore(s => s.ui.exportProgress);
  return (
    <div>
      <button disabled={exporting} onClick={exportProject} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm w-full">
        {exporting ? `Exporting… ${Math.round(progress*100)}%` : 'Export PDF'}
      </button>
      {exporting && (
        <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
          <div className="h-full bg-blue-600 transition-all" style={{ width: `${Math.round(progress*100)}%` }} />
        </div>
      )}
    </div>
  );
};

// (CaptionEditor and AltTextEditor components removed)

import React from 'react';
import { useCalendarStore } from '../../store/store.ts';
import { FONT_OPTIONS } from '../../util/constants.ts';

export const RightPanel: React.FC = () => {
  const { fontFamily, setFontFamily } = useCalendarStore(s => ({
    fontFamily: s.project.calendar.fontFamily,
    setFontFamily: s.actions.setFontFamily
  }));
  return (
    <aside className="w-72 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col text-sm p-3">
      <div className="font-semibold uppercase tracking-wide text-xs text-gray-500 mb-2">Font</div>
      <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 mb-4">
        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <div className="font-semibold uppercase tracking-wide text-xs text-gray-500 mb-2">Actions</div>
      <ExportButton />
    </aside>
  );
};

const ExportButton: React.FC = () => {
  const exportProject = useCalendarStore(s => s.actions.exportProject);
  const exporting = useCalendarStore(s => s.ui.exporting);
  return (
    <button disabled={exporting} onClick={exportProject} className="px-3 py-2 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm w-full">
      {exporting ? 'Exporting...' : 'Export PDF'}
    </button>
  );
};

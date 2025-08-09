import React from 'react';
import { useCalendarStore } from '../../store/store';
import { FONT_OPTIONS } from '../../util/constants';

export const RightPanel: React.FC = () => {
  const { fontFamily, setFontFamily } = useCalendarStore(s => ({
    fontFamily: s.project.calendar.fontFamily,
    setFontFamily: s.actions.setFontFamily
  }));
  return (
    <aside className="w-72 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col text-sm p-3">
      <div className="font-semibold uppercase tracking-wide text-xs text-gray-500 mb-2">Font</div>
  <select value={fontFamily} onChange={e => setFontFamily(e.target.value)} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 mb-2">
        {FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
  <div className="text-xs text-gray-500 mb-4">Preview:</div>
  <div className="border rounded p-2 mb-4" style={{ fontFamily }}>The quick brown fox jumps over the lazy dog 123</div>
  <CaptionEditor />
      <div className="font-semibold uppercase tracking-wide text-xs text-gray-500 mb-2">Actions</div>
      <ExportButton />
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

const CaptionEditor: React.FC = () => {
  const { caption, setCaption } = useCalendarStore(s => ({
    caption: s.project.monthData[s.ui.activeMonth]?.caption ?? '',
    setCaption: s.actions.setCaptionForActiveMonth
  }));
  return (
    <div className="mb-4">
      <div className="font-semibold uppercase tracking-wide text-xs text-gray-500 mb-2">Caption</div>
      <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1" placeholder="Add a caption for this month" />
    </div>
  );
};

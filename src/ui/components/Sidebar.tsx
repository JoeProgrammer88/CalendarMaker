import React from 'react';
import { useCalendarStore } from '../../store/store';
import { SIZES, LAYOUTS } from '../../util/constants';

export const Sidebar: React.FC = () => {
  const state = useCalendarStore(s => ({
    pageSize: s.project.calendar.pageSize,
    orientation: s.project.calendar.orientation,
    monthIndex: s.ui.activeMonth,
    layout: s.project.calendar.layoutStylePerMonth[s.ui.activeMonth],
    setPageSize: s.actions.setPageSize,
    setOrientation: s.actions.setOrientation,
    setLayoutForMonth: s.actions.setLayoutForMonth,
    setActiveMonth: s.actions.setActiveMonth,
  }));

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col text-sm">
      <div className="p-3 font-semibold uppercase tracking-wide text-xs text-gray-500">Project</div>
      <div className="px-3 space-y-2 pb-4">
        <label className="block">
          <span className="text-xs font-medium">Page Size</span>
          <select value={state.pageSize} onChange={e => state.setPageSize(e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            {Object.keys(SIZES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium">Orientation</span>
          <select value={state.orientation} onChange={e => state.setOrientation(e.target.value as any)} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium">Active Month</span>
          <select value={state.monthIndex} onChange={e => state.setActiveMonth(Number(e.target.value))} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            {Array.from({length:12}).map((_,i) => <option key={i} value={i}>{i+1}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium">Layout</span>
          <select value={state.layout} onChange={e => state.setLayoutForMonth(state.monthIndex, e.target.value)} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            {LAYOUTS.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
      </div>
    </aside>
  );
};

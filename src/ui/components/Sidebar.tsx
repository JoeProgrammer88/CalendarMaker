import React from 'react';
import { useCalendarStore } from '../../store/store';
import { SIZES, LAYOUTS } from '../../util/constants';
import type { CalendarPageSizeKey, LayoutId } from '../../types';

export const Sidebar: React.FC = () => {
  const state = useCalendarStore(s => ({
    pageSize: s.project.calendar.pageSize,
    orientation: s.project.calendar.orientation,
  splitDirection: s.project.calendar.splitDirection,
  startMonth: s.project.calendar.startMonth,
  startYear: s.project.calendar.startYear,
  showWeekNumbers: s.project.calendar.showWeekNumbers,
  includeYearlyOverview: s.project.calendar.includeYearlyOverview ?? false,
  showCommonHolidays: s.project.calendar.showCommonHolidays,
    monthIndex: s.ui.activeMonth,
    layout: s.project.calendar.layoutStylePerMonth[s.ui.activeMonth],
    setPageSize: s.actions.setPageSize,
    setOrientation: s.actions.setOrientation,
  setSplitDirection: s.actions.setSplitDirection,
  addToast: s.actions.addToast,
  setStartMonth: s.actions.setStartMonth,
  setStartYear: s.actions.setStartYear,
  setShowWeekNumbers: s.actions.setShowWeekNumbers,
  setShowCommonHolidays: s.actions.setShowCommonHolidays,
  setIncludeYearlyOverview: s.actions.setIncludeYearlyOverview,
    setLayoutForMonth: s.actions.setLayoutForMonth,
    setActiveMonth: s.actions.setActiveMonth,
  resetProject: s.actions.resetProject,
  }));

  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col text-sm">
      <div className="p-3 font-semibold uppercase tracking-wide text-xs text-gray-500">Project</div>
      <div className="px-3 space-y-2 pb-4">
        <label className="block">
          <span className="text-xs font-medium">Page Size</span>
          <select value={state.pageSize} onChange={e => state.setPageSize(e.target.value as CalendarPageSizeKey)} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
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
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium">Start Month</span>
            <select value={state.startMonth} onChange={e => state.setStartMonth(Number(e.target.value))} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium">Start Year</span>
            <input type="number" value={state.startYear} onChange={e => state.setStartYear(Number(e.target.value))} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1" />
          </label>
        </div>
        <div className="block">
          <span className="text-xs font-medium">Split</span>
          <div className="mt-1 flex items-center gap-2 text-xs">
            {(() => {
              const canLR = state.pageSize === '5x7' && state.orientation === 'landscape';
              return (
                <>
                  <label className="inline-flex items-center gap-1">
                    <input type="radio" name="split" value="tb" checked={state.splitDirection === 'tb'} onChange={() => state.setSplitDirection('tb')} />
                    Top/Bottom
                  </label>
                  <label className={"inline-flex items-center gap-1"}>
                    <input
                      type="radio"
                      name="split"
                      value="lr"
                      checked={state.splitDirection === 'lr'}
                      onChange={() => {
                        if (canLR) {
                          state.setSplitDirection('lr');
                        } else {
                          // Auto-adjust to 5×7 Landscape and enable L/R
                          state.setPageSize('5x7');
                          state.setOrientation('landscape');
                          state.setSplitDirection('lr');
                          state.addToast('Switched to 5×7 Landscape for Left/Right split', 'info');
                        }
                      }}
                    />
                    Left/Right
                  </label>
                </>
              );
            })()}
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            Left/Right places photos on the left and the calendar grid on the right. Available on 5×7 Landscape; choosing it will auto-switch if needed.
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-xs">
          <input type="checkbox" checked={state.showWeekNumbers} onChange={e => state.setShowWeekNumbers(e.target.checked)} />
          Show ISO week numbers
        </label>
        <label className="inline-flex items-center gap-2 text-xs">
          <input type="checkbox" checked={state.includeYearlyOverview} onChange={e => state.setIncludeYearlyOverview(e.target.checked)} />
          Include yearly overview
        </label>
        <label className="inline-flex items-center gap-2 text-xs">
          <input type="checkbox" checked={state.showCommonHolidays} onChange={e => state.setShowCommonHolidays(e.target.checked)} />
          Show common holidays (overview)
        </label>
        <label className="block">
          <span className="text-xs font-medium">Active Month</span>
          <select value={state.monthIndex} onChange={e => state.setActiveMonth(Number(e.target.value))} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            {Array.from({length:12}).map((_,i) => <option key={i} value={i}>{i+1}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium">Layout</span>
          <select value={state.layout} onChange={e => state.setLayoutForMonth(state.monthIndex, e.target.value as LayoutId)} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            {LAYOUTS.filter(l => !l.id.endsWith('-lr') && l.id !== 'single-left').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </label>
  <button onClick={() => { if (confirm('Reset the project to defaults? This will clear photos and events.')) state.resetProject(); }} className="w-full text-xs bg-red-600 text-white rounded py-1 hover:bg-red-700">Reset Project</button>
      </div>
      <div className="p-3 font-semibold uppercase tracking-wide text-xs text-gray-500">Photos</div>
      <div className="px-3 pb-4 space-y-2">
        <PhotoUploader />
        <PhotoList />
      </div>
      <div className="p-3 font-semibold uppercase tracking-wide text-xs text-gray-500">Events</div>
      <div className="px-3 pb-6 space-y-2">
        <div className="text-[11px] text-gray-500">Tip: Double‑click a day in the preview to add an event.</div>
        <EventList />
      </div>
    </aside>
  );
};

const PhotoUploader: React.FC = () => {
  const addPhotos = useCalendarStore(s => s.actions.addPhotos);
  return (
    <label className="block text-xs font-medium cursor-pointer">
      <span className="block mb-1">Add Photos</span>
      <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) addPhotos(e.target.files); e.target.value=''; }} />
      <div className="border border-dashed border-gray-400 dark:border-gray-600 rounded p-2 text-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-900">Click to choose</div>
    </label>
  );
};

const EventList: React.FC = () => {
  const { events, startMonth, startYear, monthIndex, openEventDialog } = useCalendarStore(s => ({ events: s.project.events, startMonth: s.project.calendar.startMonth, startYear: s.project.calendar.startYear, monthIndex: s.ui.activeMonth, openEventDialog: s.actions.openEventDialog }));
  const del = useCalendarStore(s => s.actions.deleteEvent);
  const toggle = useCalendarStore(s => s.actions.toggleEventVisible);
  const totalOffset = startMonth + monthIndex;
  const realMonth = totalOffset % 12;
  const realYear = startYear + Math.floor(totalOffset / 12);
  const filtered = events.filter(ev => {
    const [y, m] = ev.dateISO.split('-');
    return Number(y) === realYear && Number(m) === realMonth + 1;
  });
  return (
    <div className="max-h-40 overflow-auto space-y-1">
      {filtered.length === 0 && <div className="text-[11px] text-gray-500">No events for this month.</div>}
      {filtered.map(ev => (
        <div key={ev.id} className="flex items-center gap-2 text-xs">
          <button title="Toggle visibility" onClick={() => toggle(ev.id)} className={"w-5 h-5 rounded-full border flex items-center justify-center " + (ev.visible ? 'bg-blue-600 text-white border-blue-600' : 'bg-transparent border-gray-400 text-gray-400')}>{ev.visible ? '✓' : ''}</button>
          <button onClick={() => openEventDialog(ev.dateISO, ev.id)} className="flex-1 truncate text-left hover:underline" title={`${ev.dateISO} ${ev.text}`}>{ev.dateISO}: {ev.text}</button>
          <button onClick={() => del(ev.id)} className="text-red-600 hover:underline">Del</button>
        </div>
      ))}
    </div>
  );
};

const PhotoList: React.FC = () => {
  const photos = useCalendarStore(s => s.project.photos);
  const assign = useCalendarStore(s => s.actions.assignPhotoToActiveSlot);
  return (
    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-auto">
      {photos.map(p => (
        <button key={p.id} onClick={() => assign(p.id)} className="relative group border border-gray-300 dark:border-gray-600 rounded overflow-hidden aspect-square bg-gray-100 dark:bg-gray-700">
          {p.previewUrl ? <img src={p.previewUrl} alt={p.name} className="object-cover w-full h-full" /> : <span className="text-[10px] p-1">{p.name}</span>}
          <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 text-white text-[10px] flex items-center justify-center transition">Assign</span>
        </button>
      ))}
      {photos.length === 0 && <div className="col-span-3 text-[11px] text-gray-500">No photos yet.</div>}
    </div>
  );
};

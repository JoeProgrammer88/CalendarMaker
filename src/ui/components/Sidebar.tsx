import React, { useEffect, useRef, useState } from 'react';
import { computePagePixelSize } from '../../util/pageSize';
import { useCalendarStore } from '../../store/store';
import { SIZES, LAYOUTS } from '../../util/constants';
import type { CalendarPageSizeKey, LayoutId } from '../../types';

export const Sidebar: React.FC = () => {
  const state = useCalendarStore(s => ({
    pageSize: s.project.calendar.pageSize,
  splitDirection: s.project.calendar.splitDirection,
  startMonth: s.project.calendar.startMonth,
  startYear: s.project.calendar.startYear,
  showWeekNumbers: s.project.calendar.showWeekNumbers,
  includeYearlyOverview: s.project.calendar.includeYearlyOverview ?? false,
  includeCoverPage: s.project.calendar.includeCoverPage ?? false,
  coverStyle: s.project.calendar.coverStyle ?? 'large-photo',
  coverPhotoId: s.project.calendar.coverPhotoId,
  coverTransform: s.project.calendar.coverTransform,
  showCommonHolidays: s.project.calendar.showCommonHolidays,
    monthIndex: s.ui.activeMonth,
    layout: s.project.calendar.layoutStylePerMonth[s.ui.activeMonth],
    setPageSize: s.actions.setPageSize,
  // setSplitDirection removed from UI; split handled automatically by page size
  setStartMonth: s.actions.setStartMonth,
  setStartYear: s.actions.setStartYear,
  setShowWeekNumbers: s.actions.setShowWeekNumbers,
  setShowCommonHolidays: s.actions.setShowCommonHolidays,
  setIncludeYearlyOverview: s.actions.setIncludeYearlyOverview,
  setIncludeCoverPage: s.actions.setIncludeCoverPage,
  setCoverStyle: s.actions.setCoverStyle,
  setCoverPhoto: s.actions.setCoverPhoto,
  updateCoverTransform: s.actions.updateCoverTransform,
  resetCoverTransform: s.actions.resetCoverTransform,
    setLayoutForMonth: s.actions.setLayoutForMonth,
    setActiveMonth: s.actions.setActiveMonth,
  resetProject: s.actions.resetProject,
  }));
  const coverPhotos = useCalendarStore(s => s.project.coverPhotos ?? []);
  const photos = useCalendarStore(s => s.project.photos);

  return (
  <aside className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col text-sm text-gray-800 dark:text-gray-100 min-h-0 overflow-auto">
      <div className="p-3 font-semibold uppercase tracking-wide text-xs text-gray-600 dark:text-gray-300">Project</div>
      <div className="px-3 space-y-2 pb-4">
        <label className="block">
          <span className="text-xs font-medium">Page Size</span>
          <select value={state.pageSize} onChange={e => state.setPageSize(e.target.value as CalendarPageSizeKey)} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            {Object.keys(SIZES).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="text-xs font-medium">Start Month</span>
            <select value={state.startMonth} onChange={e => state.setStartMonth(Number(e.target.value))} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i) => <option key={i} value={i}>{m}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium">Start Year</span>
            <input type="number" value={state.startYear} onChange={e => state.setStartYear(Number(e.target.value))} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1" />
          </label>
        </div>
  {/* Split controls removed; split direction is derived from page size automatically. */}
  <label className="inline-flex items-center gap-2 text-xs text-gray-800 dark:text-gray-100">
          <input type="checkbox" checked={state.showWeekNumbers} onChange={e => state.setShowWeekNumbers(e.target.checked)} />
          <span className="inline-flex items-center gap-1">
            Show ISO week numbers
            <InfoTooltip content="Adds an extra leftmost column with ISO week numbers (weeks start on Monday as per ISO 8601) to the monthly grid." />
          </span>
        </label>
  <label className="inline-flex items-center gap-2 text-xs text-gray-800 dark:text-gray-100">
          <input type="checkbox" checked={state.includeYearlyOverview} onChange={e => state.setIncludeYearlyOverview(e.target.checked)} />
          <span className="inline-flex items-center gap-1">
            Include yearly overview
            <InfoTooltip content="Adds a single-page overview with mini calendars for all months." />
          </span>
        </label>
        <div className="space-y-1">
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={state.includeCoverPage} onChange={e => state.setIncludeCoverPage(e.target.checked)} />
            <span className="inline-flex items-center gap-1">
              Include cover page
              <InfoTooltip content="Adds a cover page before the months. Choose a style below." />
            </span>
          </label>
          {state.includeCoverPage && (
            <label className="block text-gray-800 dark:text-gray-100">
              <span className="text-xs font-medium inline-flex items-center gap-1">Cover Style <InfoTooltip content="Select the cover layout: a large single photo, or a 4×3 grid of month thumbnails." /></span>
              <select value={state.coverStyle} onChange={e => state.setCoverStyle(e.target.value as any)} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
                <option value="large-photo">Large Photo (90%)</option>
                <option value="grid-4x3">4×3 Month Grid</option>
              </select>
        {state.coverStyle === 'large-photo' && (
                <div className="mt-2 space-y-2">
                  <div className="text-xs font-medium">Cover Photo</div>
                  <div className="grid grid-cols-3 gap-2">
                    {(coverPhotos.length > 0 ? coverPhotos : photos).map(p => (
                      <button key={p.id} type="button" onClick={() => state.setCoverPhoto(p.id)} className={
                        'relative aspect-square rounded overflow-hidden border ' +
                        (state.coverPhotoId === p.id ? 'border-blue-600 ring-1 ring-blue-600' : 'border-gray-300 dark:border-gray-600')
                      }>
                        {p.previewUrl ? <img src={p.previewUrl} alt={p.name} className="object-cover w-full h-full" /> : <span className="text-[10px] p-1">{p.name}</span>}
                        {coverPhotos.length > 0 && (
                          <button
                            type="button"
                            title="Remove"
                            onClick={(e) => { e.stopPropagation(); useCalendarStore.getState().actions.removeCoverPhoto(p.id); }}
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center shadow"
                          >
                            ×
                          </button>
                        )}
                      </button>
                    ))}
                    {(coverPhotos.length === 0 && photos.length === 0) && (
                      <div className="col-span-3 text-[11px] text-gray-500 dark:text-gray-400">No photos yet. Upload some below, or add cover‑specific photos.</div>
                    )}
                  </div>
                  <label className="block text-xs font-medium cursor-pointer text-gray-800 dark:text-gray-100">
                    <span className="block mb-1">Add Cover Photos</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) useCalendarStore.getState().actions.addCoverPhotos(e.target.files); e.target.value=''; }} />
                    <div className="border border-dashed border-gray-400 dark:border-gray-600 rounded p-2 text-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900">Click to choose</div>
                  </label>
          {state.coverPhotoId && (
                    <div>
                      <div className="text-[11px] mb-1 text-gray-600 dark:text-gray-300">Selected cover preview</div>
            <CoverPreview photoId={state.coverPhotoId} />
                      <div className="mt-2">
                        <button type="button" onClick={() => state.setCoverPhoto(null)} className="text-xs text-red-600 hover:underline">Clear cover photo</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </label>
          )}
        </div>
  <label className="inline-flex items-center gap-2 text-xs text-gray-800 dark:text-gray-100">
          <input type="checkbox" checked={state.showCommonHolidays} onChange={e => state.setShowCommonHolidays(e.target.checked)} />
          <span className="inline-flex items-center gap-1">
            Show common holidays (overview)
            <InfoTooltip content="Highlights a few common fixed-date holidays in the yearly overview (demo: Jan 1, Jul 4, Dec 25)." />
          </span>
        </label>
        <label className="block text-gray-800 dark:text-gray-100">
          <span className="text-xs font-medium">Active Month</span>
          <select value={state.monthIndex} onChange={e => state.setActiveMonth(Number(e.target.value))} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
            {Array.from({length:12}).map((_,i) => <option key={i} value={i}>{i+1}</option>)}
          </select>
        </label>
        <label className="block text-gray-800 dark:text-gray-100">
          <span className="text-xs font-medium">Layout</span>
          {(() => {
            // Normalize any LR-specific ids to their TB counterparts so the value matches available options
            const normalize = (id: string): LayoutId => {
              if (id === 'single-left') return 'single-top' as LayoutId;
              if ((id as string) === 'dual-split-lr') return 'dual-split' as LayoutId;
              if ((id as string) === 'triple-strip-lr') return 'triple-strip' as LayoutId;
              if ((id as string) === 'quad-grid-lr') return 'quad-grid' as LayoutId;
              return id as LayoutId;
            };
            const value = normalize(state.layout as string);
            return (
              <select value={value} onChange={e => state.setLayoutForMonth(state.monthIndex, e.target.value as LayoutId)} className="mt-1 w-full bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded px-2 py-1">
                {LAYOUTS.filter(l => !l.id.endsWith('-lr') && l.id !== 'single-left').map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            );
          })()}
        </label>
  <button onClick={() => { if (confirm('Reset the project to defaults? This will clear photos and events.')) state.resetProject(); }} className="w-full text-xs bg-red-600 text-white rounded py-1 hover:bg-red-700">Reset Project</button>
      </div>
  <div className="p-3 font-semibold uppercase tracking-wide text-xs text-gray-600 dark:text-gray-300">Photos</div>
      <div className="px-3 pb-4 space-y-2">
        <PhotoUploader />
        <PhotoList />
      </div>
  <div className="p-3 font-semibold uppercase tracking-wide text-xs text-gray-600 dark:text-gray-300">Events</div>
      <div className="px-3 pb-6 space-y-2">
  <div className="text-[11px] text-gray-500 dark:text-gray-400">Tip: Double‑click a day in the preview to add an event.</div>
        <EventList />
      </div>
    </aside>
  );
};

// Interactive cover preview with pan/zoom/rotate controls (normalized like month slots)
const CoverPreview: React.FC<{ photoId: string }> = ({ photoId }) => {
  const photo = useCalendarStore(s => (s.project.coverPhotos?.find(p => p.id === photoId)) || s.project.photos.find(p => p.id === photoId));
  const t = useCalendarStore(s => s.project.calendar.coverTransform || { scale:1, translateX:0, translateY:0, rotationDegrees:0 });
  const { pageSize, orientation } = useCalendarStore(s => ({ pageSize: s.project.calendar.pageSize, orientation: s.project.calendar.orientation }));
  const update = useCalendarStore(s => s.actions.updateCoverTransform);
  const reset = useCalendarStore(s => s.actions.resetCoverTransform);
  const dragRef = useRef<{ active:boolean; startX:number; startY:number; startTX:number; startTY:number }|null>(null);
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLElement;
    if (target?.closest('[data-transform-controls]')) return; // allow button clicks
    const el = e.currentTarget as HTMLDivElement;
    try { (el as any).setPointerCapture?.(e.pointerId); } catch {}
    dragRef.current = { active:true, startX:e.clientX, startY:e.clientY, startTX: t.translateX || 0, startTY: t.translateY || 0 };
  };
  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
    const d = dragRef.current; if (!d?.active) return;
    const wrap = e.currentTarget.getBoundingClientRect();
    const nx = d.startTX + (e.clientX - d.startX) / wrap.width;
    const ny = d.startTY + (e.clientY - d.startY) / wrap.height;
    update({ translateX: nx, translateY: ny });
  };
  const end = () => { if (dragRef.current) dragRef.current.active = false; };
  if (!photo?.previewUrl) return null;
  const px = computePagePixelSize(pageSize, orientation, 100);
  const tx = (t.translateX || 0) * 100; // percent for CSS translate (relative to element size)
  const ty = (t.translateY || 0) * 100;
  const style: React.CSSProperties = {
    // Compose centering first, then user pan (percent), then scale/rotate
    transform: `translate(-50%, -50%) translate(${tx}%, ${ty}%) scale(${t.scale || 1}) rotate(${t.rotationDegrees || 0}deg)`,
    transformOrigin: 'center center'
  };
  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 1/1.1;
    update({ scale: (t.scale || 1) * factor });
  };
  return (
    <div className="w-full rounded overflow-hidden border border-gray-300 dark:border-gray-600 bg-black/10 relative select-none" style={{ aspectRatio: `${px.width} / ${px.height}` }}
         onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end}>
      <div className="absolute inset-0">
  <img src={photo.previewUrl} alt={photo.name} className="absolute left-1/2 top-1/2 w-[120%] h-[120%] object-cover pointer-events-none" style={style} />
      </div>
      <div className="absolute bottom-1 left-1 right-1 flex gap-1 justify-start bg-white/80 dark:bg-gray-900/80 backdrop-blur px-1 py-0.5 rounded text-[10px] pointer-events-auto" data-transform-controls onWheel={onWheel}>
        <button onClick={() => update({ scale: (t.scale || 1) * 1.1 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Zoom +</button>
        <button onClick={() => update({ scale: (t.scale || 1) / 1.1 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Zoom -</button>
        <button onClick={() => update({ rotationDegrees: (t.rotationDegrees || 0) + 90 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Rotate</button>
        <button onClick={() => reset()} className="px-1 py-0.5 bg-red-500 text-white rounded">Reset</button>
      </div>
    </div>
  );
};

// Small inline tooltip with a “?” trigger. Keeps native title on parent for hover support.
const InfoTooltip: React.FC<{ content: string }> = ({ content }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);
  return (
    <span className="relative inline-flex items-center" ref={ref as any}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
        aria-label="More info"
      >
        ?
      </button>
      {open && (
        <div className="absolute z-20 top-5 left-0 inline-block min-w-[20rem] max-w-[72rem] text-[11px] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded shadow p-2 whitespace-normal break-words">
          {content}
        </div>
      )}
    </span>
  );
};

const PhotoUploader: React.FC = () => {
  const addPhotos = useCalendarStore(s => s.actions.addPhotos);
  return (
    <label className="block text-xs font-medium cursor-pointer text-gray-800 dark:text-gray-100">
      <span className="block mb-1">Add Photos</span>
      <input type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) addPhotos(e.target.files); e.target.value=''; }} />
      <div className="border border-dashed border-gray-400 dark:border-gray-600 rounded p-2 text-center text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-900">Click to choose</div>
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
  {filtered.length === 0 && <div className="text-[11px] text-gray-500 dark:text-gray-400">No events for this month.</div>}
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
  const remove = useCalendarStore(s => s.actions.removePhoto);
  return (
    <div className="grid grid-cols-3 gap-2 max-h-40 overflow-auto">
      {photos.map(p => (
        <button key={p.id} onClick={() => assign(p.id)} className="relative group border border-gray-300 dark:border-gray-600 rounded overflow-hidden aspect-square bg-gray-100 dark:bg-gray-700">
          {p.previewUrl ? <img src={p.previewUrl} alt={p.name} className="object-cover w-full h-full" /> : <span className="text-[10px] p-1">{p.name}</span>}
          <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 text-white text-[10px] flex items-center justify-center transition">Assign</span>
          <button
            type="button"
            title="Remove"
            onClick={(e) => { e.stopPropagation(); remove(p.id); }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center shadow"
          >
            ×
          </button>
        </button>
      ))}
  {photos.length === 0 && <div className="col-span-3 text-[11px] text-gray-500 dark:text-gray-400">No photos yet.</div>}
    </div>
  );
};

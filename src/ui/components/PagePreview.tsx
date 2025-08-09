import React, { useMemo } from 'react';
import { useCalendarStore } from '../../store/store';
import { getLayoutById } from '../../util/layouts';
import { getEffectiveLayout } from '../../util/constants';
import { computePagePixelSize } from '../../util/pageSize';
import { generateMonthGrid, isoWeekNumber } from '../../util/calendar';

export const PagePreview: React.FC = () => {
  const { monthIndex, layoutId, pageSizeKey, orientation, splitDirection, photos, monthPage, activeSlotId, setActiveSlot, startMonth, startYear, showWeekNumbers, fontFamily, allEvents, openEventDialog } = useCalendarStore(s => ({
    monthIndex: s.ui.activeMonth,
    layoutId: s.project.calendar.layoutStylePerMonth[s.ui.activeMonth],
    pageSizeKey: s.project.calendar.pageSize,
    orientation: s.project.calendar.orientation,
    splitDirection: s.project.calendar.splitDirection,
    photos: s.project.photos,
    monthPage: s.project.monthData[s.ui.activeMonth],
    activeSlotId: s.ui.activeSlotId,
    setActiveSlot: s.actions.setActiveSlot,
    startMonth: s.project.calendar.startMonth,
    startYear: s.project.calendar.startYear,
    showWeekNumbers: s.project.calendar.showWeekNumbers,
    fontFamily: s.project.calendar.fontFamily,
  allEvents: s.project.events,
  openEventDialog: s.actions.openEventDialog
  }));
  const layout = getEffectiveLayout(layoutId, splitDirection);
  const size = computePagePixelSize(pageSizeKey, orientation, 100); // preview DPI

  const slotNodes = useMemo(() => {
    if (!layout) return null;
    return layout.slots.map(slot => {
      const left = slot.rect.x * size.width;
      const top = slot.rect.y * size.height;
      const w = slot.rect.w * size.width;
      const h = slot.rect.h * size.height;
      const monthSlot = monthPage.slots.find(s => s.slotId === slot.slotId);
      const photo = photos.find(p => p.id === monthSlot?.photoId);
      let img: React.ReactNode = null;
      if (photo?.previewUrl && monthSlot) {
        const t = monthSlot.transform;
        // scale & translate (normalized) applied via CSS transform
        const translateXpx = t.translateX * w;
        const translateYpx = t.translateY * h;
        const style: React.CSSProperties = {
          transform: `translate(${translateXpx}px, ${translateYpx}px) scale(${t.scale}) rotate(${t.rotationDegrees}deg)`,
          transformOrigin: 'center center'
        };
        img = <img draggable={false} src={photo.previewUrl} alt={photo.name} className="absolute inset-0 w-full h-full object-cover pointer-events-none" style={style} />;
      }
      const active = slot.slotId === activeSlotId;
      return (
        <div key={slot.slotId} onClick={() => setActiveSlot(slot.slotId)} className={"absolute overflow-hidden cursor-pointer group " + (active ? 'ring-2 ring-blue-500' : 'border border-blue-400/60')} style={{ left, top, width: w, height: h }}>
          {img}
          {!img && <div className="w-full h-full flex items-center justify-center text-[11px] text-blue-500/70">Click to assign</div>}
          {active && <TransformControls slotId={slot.slotId} />}
        </div>
      );
    });
  }, [layout, size, monthPage, photos, activeSlotId, setActiveSlot]);

  const { gridNode } = useMemo(() => {
    if (!layout) return { gridNode: null };
    // derive real calendar month/year
    const totalOffset = startMonth + monthIndex;
    const realMonth = totalOffset % 12;
    const realYear = startYear + Math.floor(totalOffset / 12);
  const grid = generateMonthGrid(realYear, realMonth);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthLabel = `${monthNames[realMonth]} ${realYear}`;
    const weekDayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const columns = 7 + (showWeekNumbers ? 1 : 0);
    const cellW = (layout.grid.w * size.width) / columns;
    const cellH = (layout.grid.h * size.height) / 7; // row 0 header, rows 1-6 weeks
    const left = layout.grid.x * size.width;
    const top = layout.grid.y * size.height;

    const header = [
      // Month label inside the grid header (bottom half of the page)
      <div key="month-label" className="absolute text-center text-[14px] font-semibold" style={{ left, top: top + 2, width: layout.grid.w * size.width }}>
        {monthLabel}
      </div>,
      ...(showWeekNumbers ? [<div key="wk" className="flex items-start justify-center text-[10px] font-medium border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900" style={{ position:'absolute', left, top, width: cellW, height: cellH, paddingTop: 18 }}>Wk</div>] : []),
      ...weekDayLabels.map((d,i) => (
        <div key={d} className="flex items-start justify-center text-[10px] font-medium border-b border-gray-300 dark:border-gray-600" style={{ position:'absolute', left: left + (i + (showWeekNumbers?1:0))*cellW, top, width: cellW, height: cellH, paddingTop: 18 }}>{d}</div>
      ))
    ];

    // events indexed by day
    const monthEvents: Record<number, { text: string; color?: string }[]> = {};
    allEvents.forEach(ev => {
      if (!ev.visible) return;
      const [y,m,d] = ev.dateISO.split('-').map(Number);
      if (y === realYear && m === realMonth + 1) {
        const day = d;
        if (!monthEvents[day]) monthEvents[day] = [];
        monthEvents[day].push({ text: ev.text, color: ev.color });
      }
    });

    const weeks = grid.weeks.map((week,wIdx) => {
      const weekStart = week.find(c => c.inMonth && c.date)?.date || undefined;
      const iso = weekStart ? isoWeekNumber(weekStart) : undefined;
      return [
        ...(showWeekNumbers ? [<div key={`wk-${wIdx}`} className="absolute border border-gray-200 dark:border-gray-700 text-[10px] flex items-center justify-center bg-gray-50 dark:bg-gray-900" style={{ left, top: top + (wIdx+1)*cellH, width: cellW, height: cellH }}>{iso ?? ''}</div>] : []),
        ...week.map((cell,dIdx) => {
          const x = left + (dIdx + (showWeekNumbers?1:0)) * cellW;
          const y = top + (wIdx+1) * cellH;
          const items = cell.day ? (monthEvents[cell.day] || []) : [];
          const onDoubleClick: React.MouseEventHandler<HTMLDivElement> | undefined = (cell.inMonth && cell.day) ? () => {
            const mm = String(realMonth + 1).padStart(2, '0');
            const dd = String(cell.day!).padStart(2, '0');
            const dateISO = `${realYear}-${mm}-${dd}`;
            const dayVisible = (monthEvents[cell.day!] || []).length;
            if (dayVisible === 1) {
              // Find the single visible event's id to open in edit mode
              const ev = allEvents.find(e => e.visible && e.dateISO === dateISO);
              openEventDialog(dateISO, ev?.id || null);
            } else {
              openEventDialog(dateISO, null);
            }
          } : undefined;
          return (
            <div onDoubleClick={onDoubleClick} key={wIdx+'-'+dIdx} className={"absolute border border-gray-200 dark:border-gray-700 text-[10px] p-0.5 space-y-0.5 " + (cell.inMonth ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900' : 'opacity-30')} style={{ left:x, top:y, width:cellW, height:cellH }}>
              {cell.day && <div className="font-medium select-none">{cell.day}</div>}
              {items.slice(0,2).map((it,idx) => (
                <div key={idx} className="truncate" title={it.text} style={{ color: it.color || undefined }}>{it.text}</div>
              ))}
              {items.length > 2 && <div className="text-[9px] text-gray-500">+{items.length-2} more</div>}
            </div>
          );
        })
      ];
    });

  return { gridNode: <>{header}{weeks}</> };
  }, [layout, size, monthIndex, startMonth, startYear, showWeekNumbers, allEvents, openEventDialog]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-medium">Month {monthIndex + 1} – Layout: {layout?.name}</div>
      <div className="relative bg-white dark:bg-gray-800 shadow-inner" style={{ width: size.width, height: size.height, fontFamily }}>
        {slotNodes}
        {gridNode}
        {layout && monthPage.caption && (
          <div className="absolute text-center text-[12px] text-gray-800 dark:text-gray-100 px-4" style={{ left: layout.grid.x * size.width, width: layout.grid.w * size.width, top: (layout.grid.y * size.height) - 22 }}>
            {monthPage.caption}
          </div>
        )}
      </div>
      <div className="text-xs text-gray-500">Preview (not final resolution)</div>
    </div>
  );
};

const TransformControls: React.FC<{ slotId: string }> = () => {
  const { transform, update, reset } = useCalendarStore(s => {
    const m = s.project.monthData[s.ui.activeMonth];
    const slot = m.slots.find(sl => sl.slotId === s.ui.activeSlotId) || m.slots[0];
    return {
      transform: slot?.transform ?? { scale:1, translateX:0, translateY:0, rotationDegrees:0 },
      update: s.actions.updateActiveSlotTransform,
      reset: s.actions.resetActiveSlotTransform
    };
  });
  return (
    <div className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-1 rounded shadow text-[10px] text-gray-800 dark:text-gray-200">
      <button onClick={() => update({ scale: transform.scale * 1.1 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Zoom +</button>
      <button onClick={() => update({ scale: transform.scale / 1.1 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Zoom -</button>
      <button onClick={() => update({ translateY: transform.translateY - 0.02 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Up</button>
      <button onClick={() => update({ translateY: transform.translateY + 0.02 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Down</button>
      <button onClick={() => update({ translateX: transform.translateX - 0.02 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Left</button>
      <button onClick={() => update({ translateX: transform.translateX + 0.02 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Right</button>
      <button onClick={() => update({ rotationDegrees: transform.rotationDegrees + 90 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Rotate</button>
      <button onClick={() => reset()} className="px-1 py-0.5 bg-red-500 text-white rounded">Reset</button>
    </div>
  );
};

import React, { useMemo, useRef } from 'react';
import { useCalendarStore } from '../../store/store';
import { getLayoutById } from '../../util/layouts';
import { getEffectiveLayout } from '../../util/constants';
import { computePagePixelSize } from '../../util/pageSize';
import { generateMonthGrid, isoWeekNumber } from '../../util/calendar';

export const PagePreview: React.FC = () => {
  const { monthIndex, layoutId, pageSizeKey, orientation, splitDirection, photos, monthPage, activeSlotId, setActiveSlot, updateTransform, startMonth, startYear, showWeekNumbers, fontFamily, allEvents, openEventDialog } = useCalendarStore(s => ({
    monthIndex: s.ui.activeMonth,
    layoutId: s.project.calendar.layoutStylePerMonth[s.ui.activeMonth],
    pageSizeKey: s.project.calendar.pageSize,
    orientation: s.project.calendar.orientation,
    splitDirection: s.project.calendar.splitDirection,
    photos: s.project.photos,
    monthPage: s.project.monthData[s.ui.activeMonth],
    activeSlotId: s.ui.activeSlotId,
    setActiveSlot: s.actions.setActiveSlot,
    updateTransform: s.actions.updateActiveSlotTransform,
    startMonth: s.project.calendar.startMonth,
    startYear: s.project.calendar.startYear,
    showWeekNumbers: s.project.calendar.showWeekNumbers,
    fontFamily: s.project.calendar.fontFamily,
  allEvents: s.project.events,
  openEventDialog: s.actions.openEventDialog
  }));
  const layout = getEffectiveLayout(layoutId, splitDirection);
  const previewDpi = 100;
  const size = computePagePixelSize(pageSizeKey, orientation, previewDpi); // preview DPI

  // Drag state for panning photos
  const dragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startX: number;
    startY: number;
    startTranslateX: number;
    startTranslateY: number;
    slotId: string | null;
    slotWidth: number;
    slotHeight: number;
  }>({ active: false, pointerId: null, startX: 0, startY: 0, startTranslateX: 0, startTranslateY: 0, slotId: null, slotWidth: 1, slotHeight: 1 });

  // Build a signature so memo invalidates when any slot transform changes
  const transformsSig = monthPage?.slots
    ? monthPage.slots.map(s => `${s.slotId}:${s.transform.scale}:${s.transform.translateX}:${s.transform.translateY}:${s.transform.rotationDegrees}`).join('|')
    : '';

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
      const onPointerDown: React.PointerEventHandler<HTMLDivElement> = (e) => {
        setActiveSlot(slot.slotId);
        // Ignore drags initiated on control UI
        const target = e.target as HTMLElement;
        if (target && target.closest('[data-transform-controls]')) return;
        if (!monthSlot) return;
        try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}
        dragRef.current = {
          active: true,
          pointerId: e.pointerId,
          startX: e.clientX,
          startY: e.clientY,
          startTranslateX: monthSlot.transform.translateX,
          startTranslateY: monthSlot.transform.translateY,
          slotId: slot.slotId,
          slotWidth: w,
          slotHeight: h,
        };
      };
      const onPointerMove: React.PointerEventHandler<HTMLDivElement> = (e) => {
        const d = dragRef.current;
        if (!d.active || d.pointerId !== e.pointerId || d.slotId !== slot.slotId) return;
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        const nx = d.startTranslateX + (dx / d.slotWidth);
        const ny = d.startTranslateY + (dy / d.slotHeight);
        // Update active slot transform with absolute normalized translate values
        updateTransform({ translateX: nx, translateY: ny });
      };
      const endDrag = () => { dragRef.current.active = false; dragRef.current.pointerId = null; };
      const onPointerUp: React.PointerEventHandler<HTMLDivElement> = () => endDrag();
      const onPointerCancel: React.PointerEventHandler<HTMLDivElement> = () => endDrag();
      return (
        <div
          key={slot.slotId}
          onClick={() => setActiveSlot(slot.slotId)}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          className={"absolute overflow-hidden group border border-gray-300 dark:border-gray-600 " + (active ? 'cursor-grabbing' : 'cursor-grab')}
          style={{ left, top, width: w, height: h, touchAction: 'none' }}
        >
          {img}
          {!img && <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-500 dark:text-gray-400">Click to assign</div>}
          {active && <TransformControls slotId={slot.slotId} />}
        </div>
      );
    });
  }, [layout, size, monthPage, photos, activeSlotId, setActiveSlot, updateTransform, transformsSig]);

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
  // Apply 1/4" top margin for 5x7 on the text (grid) side only
  const topMarginPx = pageSizeKey === '5x7' ? (0.25 * previewDpi) : 0;
  const left = layout.grid.x * size.width;
  const top = layout.grid.y * size.height + topMarginPx;
  const gridHeight = (layout.grid.h * size.height) - topMarginPx;
  const cellH = gridHeight / 7; // row 0 header, rows 1-6 weeks

  const headerLeft = Math.ceil(left);
  const headerWidth = Math.max(0, Math.floor(layout.grid.w * size.width) - 1);
  const header = [
      // Shaded header background spanning the full header row and filling the 1/4" margin for 5x7
  <div key="header-bg" className="absolute bg-gray-100 dark:bg-gray-800/80" style={{ left: headerLeft, top: top - (pageSizeKey === '5x7' ? topMarginPx : 0), width: headerWidth, height: cellH + (pageSizeKey === '5x7' ? topMarginPx : 0) }} />,
      // Month label inside the grid header (bottom half of the page)
  <div key="month-label" className="absolute text-center text-[14px] font-semibold text-gray-900 dark:text-gray-100" style={{ left: headerLeft, top: top + 2, width: headerWidth }}>
        {monthLabel}
      </div>,
   ...(showWeekNumbers ? [
  <div key="wk" className="flex items-start justify-center text-[10px] font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-900"
       style={{ position:'absolute', left: headerLeft, top, width: cellW, height: cellH, paddingTop: 22 }}>Wk</div>
      ] : []),
      ...weekDayLabels.map((d,i) => (
  <div key={d} className="flex items-start justify-center text-[10px] font-medium text-gray-700 dark:text-gray-200"
       style={{ position:'absolute', left: headerLeft + (i + (showWeekNumbers?1:0))*cellW, top, width: cellW, height: cellH, paddingTop: 22 }}>{d}</div>
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
        ...(showWeekNumbers ? [
          <div key={`wk-${wIdx}`} className={"absolute border border-gray-200 dark:border-gray-700 text-[10px] flex items-center justify-center bg-gray-50 dark:bg-gray-900"}
               style={{ left, top: top + (wIdx+1)*cellH, width: cellW, height: cellH }}>{iso ?? ''}</div>
        ] : []),
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
              {items.length > 2 && <div className="text-[9px] text-gray-500 dark:text-gray-400">+{items.length-2} more</div>}
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
  {/* Caption display removed */}
      </div>
  <div className="text-xs text-gray-500 dark:text-gray-400">Preview (not final resolution)</div>
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
    <div data-transform-controls className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-1 rounded shadow text-[10px] text-gray-800 dark:text-gray-200">
  <button onClick={() => update({ scale: transform.scale * 1.1 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Zoom +</button>
  <button onClick={() => update({ scale: transform.scale / 1.1 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Zoom -</button>
      <button onClick={() => update({ rotationDegrees: transform.rotationDegrees + 90 })} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Rotate</button>
      <button onClick={() => reset()} className="px-1 py-0.5 bg-red-500 text-white rounded">Reset</button>
    </div>
  );
};

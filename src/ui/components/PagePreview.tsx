import React, { useMemo } from 'react';
import { useCalendarStore } from '../../store/store';
import { getLayoutById } from '../../util/layouts';
import { computePagePixelSize } from '../../util/pageSize';
import { generateMonthGrid } from '../../util/calendar';

export const PagePreview: React.FC = () => {
  const { monthIndex, layoutId, pageSizeKey, orientation, photos, monthPage, activeSlotId, setActiveSlot, startMonth, startYear, showWeekNumbers } = useCalendarStore(s => ({
    monthIndex: s.ui.activeMonth,
    layoutId: s.project.calendar.layoutStylePerMonth[s.ui.activeMonth],
    pageSizeKey: s.project.calendar.pageSize,
    orientation: s.project.calendar.orientation,
    photos: s.project.photos,
    monthPage: s.project.monthData[s.ui.activeMonth],
    activeSlotId: s.ui.activeSlotId,
    setActiveSlot: s.actions.setActiveSlot,
    startMonth: s.project.calendar.startMonth,
    startYear: s.project.calendar.startYear,
    showWeekNumbers: s.project.calendar.showWeekNumbers
  }));
  const layout = getLayoutById(layoutId);
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
    const weekDayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const cellW = (layout.grid.w * size.width) / 7;
    const cellH = (layout.grid.h * size.height) / 7; // row 0 header, rows 1-6 weeks
    const left = layout.grid.x * size.width;
    const top = layout.grid.y * size.height;

    const header = weekDayLabels.map((d,i) => (
      <div key={d} className="flex items-center justify-center text-[10px] font-medium border-b border-gray-300 dark:border-gray-600" style={{ position:'absolute', left: left + i*cellW, top, width: cellW, height: cellH }}>{d}</div>
    ));

    const weeks = grid.weeks.map((week,wIdx) => week.map((cell,dIdx) => {
      const x = left + dIdx * cellW;
      const y = top + (wIdx+1) * cellH;
      return (
        <div key={wIdx+'-'+dIdx} className={"absolute border border-gray-200 dark:border-gray-700 text-[10px] p-0.5 " + (cell.inMonth ? '' : 'opacity-30')} style={{ left:x, top:y, width:cellW, height:cellH }}>
          {cell.day && <div className="font-medium select-none">{cell.day}</div>}
        </div>
      );
    }));

    return { gridNode: <>{header}{weeks}</> };
  }, [layout, size, monthIndex, startMonth, startYear]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-medium">Month {monthIndex + 1} – Layout: {layout?.name}</div>
      <div className="relative bg-white dark:bg-gray-800 shadow-inner" style={{ width: size.width, height: size.height }}>
        {slotNodes}
        {gridNode}
      </div>
      <div className="text-xs text-gray-500">Preview (not final resolution)</div>
    </div>
  );
};

const TransformControls: React.FC<{ slotId: string }> = () => {
  const { transform, update, reset } = useCalendarStore(s => {
    const m = s.project.monthData[s.ui.activeMonth];
    const slot = m.slots.find(sl => sl.slotId === s.ui.activeSlotId)!;
    return {
      transform: slot.transform,
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

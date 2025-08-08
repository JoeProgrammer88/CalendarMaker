import React, { useMemo } from 'react';
import { useCalendarStore } from '../../store/store.ts';
import { getLayoutById } from '../../util/layouts.ts';
import { computePagePixelSize } from '../../util/pageSize.ts';

export const PagePreview: React.FC = () => {
  const { monthIndex, layoutId, pageSizeKey, orientation } = useCalendarStore(s => ({
    monthIndex: s.ui.activeMonth,
    layoutId: s.project.calendar.layoutStylePerMonth[s.ui.activeMonth],
    pageSizeKey: s.project.calendar.pageSize,
    orientation: s.project.calendar.orientation
  }));
  const layout = getLayoutById(layoutId);
  const size = computePagePixelSize(pageSizeKey, orientation, 100); // preview ~100 DPI

  // Placeholder preview grid & slots
  const content = useMemo(() => {
    if (!layout) return null;
    return layout.slots.map(slot => {
      const left = slot.rect.x * size.width;
      const top = slot.rect.y * size.height;
      const w = slot.rect.w * size.width;
      const h = slot.rect.h * size.height;
      return <div key={slot.slotId} className="absolute border border-blue-400/60 bg-blue-200/10" style={{ left, top, width: w, height: h }} />;
    });
  }, [layout, size]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-sm font-medium">Month {monthIndex + 1} – Layout: {layout?.name}</div>
      <div className="relative bg-white dark:bg-gray-800 shadow-inner" style={{ width: size.width, height: size.height }}>
        {content}
        <div className="absolute inset-x-0 bottom-0 h-1/3 border-t border-gray-300 dark:border-gray-700 pointer-events-none" />
      </div>
      <div className="text-xs text-gray-500">Preview (not final resolution)</div>
    </div>
  );
};

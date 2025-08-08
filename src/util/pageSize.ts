import { PAGE_SIZES, CalendarPageSizeKey, Orientation } from '../types';

export function computePagePixelSize(key: CalendarPageSizeKey, orientation: Orientation, dpi: number) {
  const def = PAGE_SIZES[key];
  const widthIn = orientation === 'portrait' ? def.widthIn : def.heightIn;
  const heightIn = orientation === 'portrait' ? def.heightIn : def.widthIn;
  return { width: Math.round(widthIn * dpi), height: Math.round(heightIn * dpi) };
}

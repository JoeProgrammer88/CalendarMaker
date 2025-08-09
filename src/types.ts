export type CalendarPageSizeKey = '5x7' | 'Letter' | 'A4' | '11x17' | '13x19';
export interface PageSizeDef { widthIn: number; heightIn: number; }
export const PAGE_SIZES: Record<CalendarPageSizeKey, PageSizeDef> = {
  '5x7': { widthIn: 5, heightIn: 7 },
  'Letter': { widthIn: 8.5, heightIn: 11 },
  'A4': { widthIn: 8.27, heightIn: 11.69 },
  '11x17': { widthIn: 11, heightIn: 17 },
  '13x19': { widthIn: 13, heightIn: 19 }
};

export type Orientation = 'portrait' | 'landscape';

export interface LayoutSlot { slotId: string; rect: { x: number; y: number; w: number; h: number; }; }
export interface LayoutDef { id: LayoutId; name: string; slots: LayoutSlot[]; grid: { x: number; y: number; w: number; h: number; }; supportedOrientations: Orientation[]; }
export type LayoutId = 'single-top' | 'single-left' | 'full-bleed' | 'dual-split' | 'triple-strip' | 'quad-grid';

export interface PhotoTransform { scale: number; translateX: number; translateY: number; rotationDegrees: number; }
// translateX / translateY are normalized offsets relative to slot width/height (1 = 100% of slot dimension)
export interface MonthSlot { slotId: string; photoId?: string; transform: PhotoTransform; }
export interface MonthPage { index: number; slots: MonthSlot[]; caption?: string; events: string[]; }

export interface PhotoMeta { id: string; originalBlobRef?: string; previewBlobRef?: string; name: string; assignedMonths: number[]; previewUrl?: string; }
export interface EventItem { id: string; dateISO: string; text: string; color?: string; visible: boolean; }

export interface CalendarSettings { startMonth: number; startYear: number; months: number; layoutStylePerMonth: LayoutId[]; pageSize: CalendarPageSizeKey; orientation: Orientation; showWeekNumbers: boolean; showCommonHolidays: boolean; includeYearlyOverview?: boolean; fontFamily: string; }

export interface ProjectState { id: string; meta: { createdAt: string; updatedAt: string; appVersion: string; }; calendar: CalendarSettings; photos: PhotoMeta[]; monthData: MonthPage[]; events: EventItem[]; }

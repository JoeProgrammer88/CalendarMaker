import type { ProjectState, LayoutId } from '../types';

const DEFAULT_LAYOUT: LayoutId = 'single-top';

export function defaultProject(): ProjectState {
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  return {
    id: crypto.randomUUID(),
  meta: { createdAt: now, updatedAt: now, appVersion: '0.1.0', schemaVersion: 1 },
    calendar: {
      startMonth: 0,
      startYear: year,
      months: 12,
      layoutStylePerMonth: Array.from({length:12}, () => DEFAULT_LAYOUT),
  pageSize: 'Letter',
  orientation: 'portrait',
  splitDirection: 'tb',
      showWeekNumbers: false,
      showCommonHolidays: false,
  includeYearlyOverview: false,
  includeCoverPage: false,
  coverStyle: 'large-photo',
  coverPhotoId: undefined as any,
  coverTransform: { scale: 1, translateX: 0, translateY: 0, rotationDegrees: 0 },
      fontFamily: 'Inter'
    },
    photos: [],
  coverPhotos: [],
  monthData: Array.from({length:12}, (_,i) => ({ index: i, slots: [ { slotId: 'main', photoId: undefined, transform: { scale:1, translateX:0, translateY:0, rotationDegrees:0 } } ], caption: '', events: [] })),
    events: []
  };
}

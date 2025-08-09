import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { defaultProject } from '../util/defaultProject';
import type { ProjectState, CalendarPageSizeKey, LayoutId, MonthSlot } from '../types';
import { exportAsPdf } from '../util/exporter';

interface UIState {
  darkMode: boolean;
  activeMonth: number; // 0-11
  exporting: boolean;
  activeSlotId: string | null;
  eventDialog: { open: boolean; dateISO: string | null; editEventId: string | null };
  toasts: { id: string; text: string; type: 'info' | 'success' | 'error' }[];
  exportProgress: number; // 0..1
}

interface Actions {
  toggleDarkMode(): void;
  setPageSize(size: CalendarPageSizeKey): void;
  setOrientation(orientation: 'portrait' | 'landscape'): void;
  setStartMonth(m: number): void;
  setStartYear(y: number): void;
  setShowWeekNumbers(v: boolean): void;
  setShowCommonHolidays(v: boolean): void;
  setIncludeYearlyOverview(v: boolean): void;
  setLayoutForMonth(monthIndex: number, layoutId: LayoutId): void;
  setActiveMonth(idx: number): void;
  setActiveSlot(slotId: string): void;
  setFontFamily(font: string): void;
  setCaptionForActiveMonth(text: string): void;
  openEventDialog(dateISO: string, editEventId?: string | null): void;
  closeEventDialog(): void;
  exportProject(): Promise<void>;
  addPhotos(files: FileList | File[]): Promise<void>;
  assignPhotoToActiveSlot(photoId: string, slotId?: string): void;
  updateActiveSlotTransform(delta: Partial<{ scale: number; translateX: number; translateY: number; rotationDegrees: number }>): void;
  resetActiveSlotTransform(): void;
  addEvent(input: { dateISO: string; text: string; color?: string }): void;
  deleteEvent(id: string): void;
  toggleEventVisible(id: string): void;
  updateEvent(id: string, input: Partial<{ text: string; color?: string; dateISO: string }>): void;
  addToast(text: string, type?: 'info' | 'success' | 'error'): void;
  removeToast(id: string): void;
  setExportProgress(p: number): void;
}

interface StoreShape {
  project: ProjectState;
  ui: UIState;
  actions: Actions;
}

export const useCalendarStore = create<StoreShape>()(immer((set, get) => ({
  project: defaultProject(),
  ui: { darkMode: false, activeMonth: 0, exporting: false, activeSlotId: 'main', eventDialog: { open: false, dateISO: null, editEventId: null }, toasts: [], exportProgress: 0 },
  actions: {
    toggleDarkMode() { set(s => { s.ui.darkMode = !s.ui.darkMode; }); },
    setPageSize(size) { set(s => { s.project.calendar.pageSize = size; }); },
    setOrientation(o) { set(s => { s.project.calendar.orientation = o; }); },
  setStartMonth(m) { set(s => { s.project.calendar.startMonth = Math.max(0, Math.min(11, m)); }); },
  setStartYear(y) { set(s => { s.project.calendar.startYear = y; }); },
  setShowWeekNumbers(v) { set(s => { s.project.calendar.showWeekNumbers = v; }); },
  setShowCommonHolidays(v) { set(s => { s.project.calendar.showCommonHolidays = v; }); },
  setIncludeYearlyOverview(v) { set(s => { s.project.calendar.includeYearlyOverview = v; }); },
    setLayoutForMonth(monthIndex, layoutId) { set(s => { s.project.calendar.layoutStylePerMonth[monthIndex] = layoutId; const page = s.project.monthData[monthIndex]; if (page && !page.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId)) { s.ui.activeSlotId = page.slots[0]?.slotId || null; } }); },
    setActiveMonth(idx) { set(s => { s.ui.activeMonth = idx; const page = s.project.monthData[idx]; if (page && !page.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId)) { s.ui.activeSlotId = page.slots[0]?.slotId || null; } }); },
    setActiveSlot(slotId) { set(s => { s.ui.activeSlotId = slotId; }); },
    setFontFamily(font) { set(s => { s.project.calendar.fontFamily = font; }); },
  setCaptionForActiveMonth(text) { set(s => { const m = s.ui.activeMonth; const page = s.project.monthData[m]; if (page) page.caption = text; }); },
  openEventDialog(dateISO, editEventId) { set(s => { s.ui.eventDialog = { open: true, dateISO, editEventId: editEventId ?? null }; }); },
  closeEventDialog() { set(s => { s.ui.eventDialog = { open: false, dateISO: null, editEventId: null }; }); },
  async exportProject() { if (get().ui.exporting) return; set(s => { s.ui.exporting = true; s.ui.exportProgress = 0; }); try { await exportAsPdf(get().project, (p: number) => { set(s => { s.ui.exportProgress = p; }); }); } finally { set(s => { s.ui.exporting = false; s.ui.exportProgress = 0; }); } },
    async addPhotos(files) {
      const arr = Array.from(files);
      const newPhotos = await Promise.all(arr.map(async f => {
        const id = crypto.randomUUID();
        const blob = f;
        const previewUrl = URL.createObjectURL(blob);
        return { id, originalBlobRef: '', previewBlobRef: '', name: f.name, assignedMonths: [], previewUrl };
      }));
      set(s => { s.project.photos.push(...newPhotos); });
    },
    assignPhotoToActiveSlot(photoId, slotId) { set(s => { const m = s.ui.activeMonth; const monthPage = s.project.monthData[m]; const targetSlotId = slotId || s.ui.activeSlotId || monthPage.slots[0]?.slotId; const slot = monthPage.slots.find((sl: MonthSlot) => sl.slotId === targetSlotId); if (slot) slot.photoId = photoId; }); },
    updateActiveSlotTransform(delta) { set(s => { const m = s.ui.activeMonth; const monthPage = s.project.monthData[m]; const slot = monthPage.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId) || monthPage.slots[0]; if (!slot) return; if (delta.scale !== undefined) slot.transform.scale = Math.min(5, Math.max(0.1, delta.scale)); if (delta.translateX !== undefined) slot.transform.translateX = delta.translateX; if (delta.translateY !== undefined) slot.transform.translateY = delta.translateY; if (delta.rotationDegrees !== undefined) slot.transform.rotationDegrees = ((delta.rotationDegrees % 360) + 360) % 360; }); },
  resetActiveSlotTransform() { set(s => { const m = s.ui.activeMonth; const monthPage = s.project.monthData[m]; const slot = monthPage.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId); if (slot) { slot.transform = { scale:1, translateX:0, translateY:0, rotationDegrees:0 }; } }); },
  addEvent(input) { set(s => { const id = crypto.randomUUID(); s.project.events.push({ id, dateISO: input.dateISO, text: input.text, color: input.color, visible: true }); }); },
  deleteEvent(id) { set(s => { s.project.events = s.project.events.filter(ev => ev.id !== id); }); },
  toggleEventVisible(id) { set(s => { const ev = s.project.events.find(e => e.id === id); if (ev) ev.visible = !ev.visible; }); },
    updateEvent(id, input) { set(s => { const ev = s.project.events.find(e => e.id === id); if (!ev) return; if (input.text !== undefined) ev.text = input.text; if (input.color !== undefined) ev.color = input.color; if (input.dateISO !== undefined) ev.dateISO = input.dateISO; }); },
    addToast(text, type = 'info') {
      const id = crypto.randomUUID();
      set(s => { s.ui.toasts.push({ id, text, type }); });
      setTimeout(() => { set(s => { s.ui.toasts = s.ui.toasts.filter(t => t.id !== id); }); }, 2500);
    },
    removeToast(id) { set(s => { s.ui.toasts = s.ui.toasts.filter(t => t.id !== id); }); }
  , setExportProgress(p) { set(s => { s.ui.exportProgress = p; }); }
  }
})));

export { shallow };

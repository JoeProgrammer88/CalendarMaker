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
}

interface Actions {
  toggleDarkMode(): void;
  setPageSize(size: CalendarPageSizeKey): void;
  setOrientation(orientation: 'portrait' | 'landscape'): void;
  setLayoutForMonth(monthIndex: number, layoutId: LayoutId): void;
  setActiveMonth(idx: number): void;
  setActiveSlot(slotId: string): void;
  setFontFamily(font: string): void;
  exportProject(): Promise<void>;
  addPhotos(files: FileList | File[]): Promise<void>;
  assignPhotoToActiveSlot(photoId: string, slotId?: string): void;
  updateActiveSlotTransform(delta: Partial<{ scale: number; translateX: number; translateY: number; rotationDegrees: number }>): void;
  resetActiveSlotTransform(): void;
}

interface StoreShape {
  project: ProjectState;
  ui: UIState;
  actions: Actions;
}

export const useCalendarStore = create<StoreShape>()(immer((set, get) => ({
  project: defaultProject(),
  ui: { darkMode: false, activeMonth: 0, exporting: false, activeSlotId: 'main' },
  actions: {
    toggleDarkMode() { set(s => { s.ui.darkMode = !s.ui.darkMode; }); },
    setPageSize(size) { set(s => { s.project.calendar.pageSize = size; }); },
    setOrientation(o) { set(s => { s.project.calendar.orientation = o; }); },
    setLayoutForMonth(monthIndex, layoutId) { set(s => { s.project.calendar.layoutStylePerMonth[monthIndex] = layoutId; const page = s.project.monthData[monthIndex]; if (page && !page.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId)) { s.ui.activeSlotId = page.slots[0]?.slotId || null; } }); },
    setActiveMonth(idx) { set(s => { s.ui.activeMonth = idx; const page = s.project.monthData[idx]; if (page && !page.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId)) { s.ui.activeSlotId = page.slots[0]?.slotId || null; } }); },
    setActiveSlot(slotId) { set(s => { s.ui.activeSlotId = slotId; }); },
    setFontFamily(font) { set(s => { s.project.calendar.fontFamily = font; }); },
    async exportProject() { if (get().ui.exporting) return; set(s => { s.ui.exporting = true; }); try { await exportAsPdf(get().project); } finally { set(s => { s.ui.exporting = false; }); } },
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
    resetActiveSlotTransform() { set(s => { const m = s.ui.activeMonth; const monthPage = s.project.monthData[m]; const slot = monthPage.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId); if (slot) { slot.transform = { scale:1, translateX:0, translateY:0, rotationDegrees:0 }; } }); }
  }
})));

export { shallow };

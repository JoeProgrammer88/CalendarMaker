import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { defaultProject } from '../util/defaultProject.ts';
import type { ProjectState, CalendarPageSizeKey, LayoutId, MonthSlot } from '../types.ts';
import { exportAsPdf } from '../util/exporter.ts';

interface UIState {
  darkMode: boolean;
  activeMonth: number; // 0-11
  exporting: boolean;
}

interface Actions {
  toggleDarkMode(): void;
  setPageSize(size: CalendarPageSizeKey): void;
  setOrientation(orientation: 'portrait' | 'landscape'): void;
  setLayoutForMonth(monthIndex: number, layoutId: LayoutId): void;
  setActiveMonth(idx: number): void;
  setFontFamily(font: string): void;
  exportProject(): Promise<void>;
  addPhotos(files: FileList | File[]): Promise<void>;
  assignPhotoToActiveSlot(photoId: string, slotId?: string): void;
  updateActiveSlotTransform(delta: Partial<{ scale: number; translateX: number; translateY: number; rotationDegrees: number }>): void;
}

interface StoreShape {
  project: ProjectState;
  ui: UIState;
  actions: Actions;
}

export const useCalendarStore = create<StoreShape>()(immer((set, get) => ({
  project: defaultProject(),
  ui: { darkMode: false, activeMonth: 0, exporting: false },
  actions: {
    toggleDarkMode() { set(s => { s.ui.darkMode = !s.ui.darkMode; }); },
    setPageSize(size) { set(s => { s.project.calendar.pageSize = size; }); },
    setOrientation(o) { set(s => { s.project.calendar.orientation = o; }); },
    setLayoutForMonth(monthIndex, layoutId) { set(s => { s.project.calendar.layoutStylePerMonth[monthIndex] = layoutId; }); },
    setActiveMonth(idx) { set(s => { s.ui.activeMonth = idx; }); },
    setFontFamily(font) { set(s => { s.project.calendar.fontFamily = font; }); },
    async exportProject() {
      if (get().ui.exporting) return;
      set(s => { s.ui.exporting = true; });
      try {
        await exportAsPdf(get().project);
      } finally {
        set(s => { s.ui.exporting = false; });
      }
    },
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
    assignPhotoToActiveSlot(photoId, slotId) {
      set(s => {
        const m = s.ui.activeMonth;
        const monthPage = s.project.monthData[m];
        const slot = slotId ? monthPage.slots.find((sl: MonthSlot) => sl.slotId === slotId) : monthPage.slots[0];
        if (slot) slot.photoId = photoId;
      });
    },
    updateActiveSlotTransform(delta) {
      set(s => {
        const m = s.ui.activeMonth;
        const monthPage = s.project.monthData[m];
        const slot: MonthSlot | undefined = monthPage.slots[0]; // simple: first slot active (future: track active slot)
        if (!slot) return;
        if (delta.scale !== undefined) slot.transform.scale = Math.min(5, Math.max(0.1, delta.scale));
        if (delta.translateX !== undefined) slot.transform.translateX = delta.translateX;
        if (delta.translateY !== undefined) slot.transform.translateY = delta.translateY;
        if (delta.rotationDegrees !== undefined) slot.transform.rotationDegrees = ((delta.rotationDegrees % 360) + 360) % 360;
      });
    }
  }
})));

export { shallow };

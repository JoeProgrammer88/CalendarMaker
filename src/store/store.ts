import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { defaultProject } from '../util/defaultProject.ts';
import type { ProjectState, CalendarPageSizeKey, LayoutId } from '../types.ts';
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
    }
  }
})));

export { shallow };

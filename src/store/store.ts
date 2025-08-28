import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { defaultProject } from '../util/defaultProject';
import type { ProjectState, CalendarPageSizeKey, LayoutId, MonthSlot, SplitDirection } from '../types';
import { getLayoutById } from '../util/layouts';
import { exportAsPdf, exportCurrentPageAsPng } from '../util/exporter';
import { debounce, getLastProjectId, loadProjectById, savePhotoBlob, saveProject, clearProject, deletePhotoBlob } from '../util/persistence';
import { collectHolidayMap } from '../util/holidays';

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
  setSplitDirection(dir: SplitDirection): void;
  setStartMonth(m: number): void;
  setStartYear(y: number): void;
  setShowCommonHolidays(v: boolean): void;
  setIncludeCoverPage(v: boolean): void;
  setCoverStyle(style: 'large-photo' | 'grid-4x3'): void;
  setCoverPhoto(photoId: string | null): void;
  updateCoverTransform(delta: Partial<{ scale: number; translateX: number; translateY: number; rotationDegrees: number }>): void;
  resetCoverTransform(): void;
  resetProject(): void;
  setLayoutForMonth(monthIndex: number, layoutId: LayoutId): void;
  setActiveMonth(idx: number): void;
  setActiveSlot(slotId: string): void;
  setFontFamily(font: string): void;
  openEventDialog(dateISO: string, editEventId?: string | null): void;
  closeEventDialog(): void;
  exportProject(): Promise<void>;
  exportCurrentMonthPng(): Promise<void>;
  addPhotos(files: FileList | File[]): Promise<void>;
  addCoverPhotos(files: FileList | File[]): Promise<void>;
  removePhoto(photoId: string): Promise<void>;
  removeCoverPhoto(photoId: string): Promise<void>;
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
  saveNow(): Promise<void>;
  loadLastProject(): Promise<void>;
  clearAllData(): Promise<void>;
  syncHolidayEvents(): void;
  removeHolidayEvents(): void;
}
interface StoreShape {
  project: ProjectState;
  ui: UIState;
  actions: Actions;
}

// (Undo/redo removed; safeClone no longer needed)

export const useCalendarStore = create<StoreShape>()(immer((set, get) => ({
  project: defaultProject(),
  ui: { darkMode: false, activeMonth: 0, exporting: false, activeSlotId: 'main', eventDialog: { open: false, dateISO: null, editEventId: null }, toasts: [], exportProgress: 0 },
  actions: {
    toggleDarkMode() { set(s => { s.ui.darkMode = !s.ui.darkMode; }); },
  setPageSize(size) { set(s => { 
      s.project.calendar.pageSize = size; 
      if (size === '5x7') {
        s.project.calendar.orientation = 'landscape';
        s.project.calendar.splitDirection = 'lr';
        // Keep base layout ids (TB variants) in state; map any LR variants back to their TB equivalents
        s.project.calendar.layoutStylePerMonth = s.project.calendar.layoutStylePerMonth.map((id: any) => {
          if (id === 'single-left') return 'single-top' as any;
          if (id === 'dual-split-lr') return 'dual-split' as any;
          if (id === 'triple-strip-lr') return 'triple-strip' as any;
          if (id === 'quad-grid-lr') return 'quad-grid' as any;
          return id;
        });
      } else {
        // Default orientation for other sizes
        s.project.calendar.orientation = 'portrait';
        s.project.calendar.splitDirection = 'tb';
        // Ensure any LR-specific ids are normalized back to TB
        s.project.calendar.layoutStylePerMonth = s.project.calendar.layoutStylePerMonth.map((id: any) => {
          if (id === 'single-left') return 'single-top' as any;
          if (id === 'dual-split-lr') return 'dual-split' as any;
          if (id === 'triple-strip-lr') return 'triple-strip' as any;
          if (id === 'quad-grid-lr') return 'quad-grid' as any;
          return id;
        });
      }
  }); },
  setOrientation(o) { set(s => { s.project.calendar.orientation = o; }); },
  setShowCommonHolidays(v) { set(s => { s.project.calendar.showCommonHolidays = v; }); if (v) { get().actions.syncHolidayEvents(); } else { get().actions.removeHolidayEvents(); } },
  setSplitDirection(dir) { set(s => { s.project.calendar.splitDirection = dir; }); },
  setStartMonth(m) { set(s => { s.project.calendar.startMonth = Math.max(0, Math.min(11, m)); }); if (get().project.calendar.showCommonHolidays) get().actions.syncHolidayEvents(); },
  setStartYear(y) { set(s => { s.project.calendar.startYear = y; }); if (get().project.calendar.showCommonHolidays) get().actions.syncHolidayEvents(); },
  
  setIncludeCoverPage(v) { set(s => { s.project.calendar.includeCoverPage = v; }); },
  setCoverStyle(style) { set(s => { s.project.calendar.coverStyle = style; }); },
  setCoverPhoto(photoId) { set(s => { s.project.calendar.coverPhotoId = photoId || undefined; }); get().actions.saveNow(); },
  updateCoverTransform(delta) { set(s => {
      const t = s.project.calendar.coverTransform || { scale:1, translateX:0, translateY:0, rotationDegrees:0 };
      if (delta.scale !== undefined) t.scale = Math.min(5, Math.max(0.1, delta.scale));
      if (delta.translateX !== undefined) t.translateX = delta.translateX;
      if (delta.translateY !== undefined) t.translateY = delta.translateY;
      if (delta.rotationDegrees !== undefined) t.rotationDegrees = ((delta.rotationDegrees % 360) + 360) % 360;
      s.project.calendar.coverTransform = t;
    });
    if (!(window as any).__cm_save_debounced__) {
      (window as any).__cm_save_debounced__ = debounce(() => get().actions.saveNow(), 800);
    }
    (window as any).__cm_save_debounced__();
  },
  resetCoverTransform() { set(s => { s.project.calendar.coverTransform = { scale:1, translateX:0, translateY:0, rotationDegrees:0 }; }); },
  resetProject() { set(s => { s.project = defaultProject(); s.ui.activeMonth = 0; s.ui.activeSlotId = 'main'; }); get().actions.saveNow(); },
  // Ensure month slots match layout definition (preserve existing where possible)
  setLayoutForMonth(monthIndex, layoutId) { set(s => {
      s.project.calendar.layoutStylePerMonth[monthIndex] = layoutId;
      const layout = getLayoutById(layoutId);
      const page = s.project.monthData[monthIndex];
      if (layout && page) {
        const newSlots: MonthSlot[] = layout.slots.map(def => {
          const existing = page.slots.find(sl => sl.slotId === def.slotId);
          return existing ?? { slotId: def.slotId, photoId: undefined, transform: { scale:1, translateX:0, translateY:0, rotationDegrees:0 } } as MonthSlot;
        });
        page.slots = newSlots;
        if (!newSlots.find(sl => sl.slotId === s.ui.activeSlotId)) {
          s.ui.activeSlotId = newSlots[0]?.slotId || null;
        }
      }
      // Notify
  if (layout) {
        const name = layout.name || String(layoutId);
        // best-effort toast; ignore if not available early during init
        try { get().actions.addToast(`Layout changed to ${name}`, 'success'); } catch {}
      }
  }); get().actions.saveNow(); },
  setActiveMonth(idx) { set(s => { 
      s.ui.activeMonth = idx; 
      const layoutId = s.project.calendar.layoutStylePerMonth[idx];
      const layout = getLayoutById(layoutId);
      const page = s.project.monthData[idx];
      if (layout && page) {
        const newSlots: MonthSlot[] = layout.slots.map(def => {
          const existing = page.slots.find(sl => sl.slotId === def.slotId);
          return existing ?? { slotId: def.slotId, photoId: undefined, transform: { scale:1, translateX:0, translateY:0, rotationDegrees:0 } } as MonthSlot;
        });
        page.slots = newSlots;
        if (!newSlots.find(sl => sl.slotId === s.ui.activeSlotId)) {
          s.ui.activeSlotId = newSlots[0]?.slotId || null;
        }
      }
    }); },
    setActiveSlot(slotId) { set(s => { s.ui.activeSlotId = slotId; }); },
  setFontFamily(font) { set(s => { s.project.calendar.fontFamily = font; }); get().actions.saveNow(); },
  openEventDialog(dateISO, editEventId) { set(s => { s.ui.eventDialog = { open: true, dateISO, editEventId: editEventId ?? null }; }); },
  closeEventDialog() { set(s => { s.ui.eventDialog = { open: false, dateISO: null, editEventId: null }; }); },
  async exportProject() { if (get().ui.exporting) return; set(s => { s.ui.exporting = true; s.ui.exportProgress = 0; }); try { await exportAsPdf(get().project, (p: number) => { set(s => { s.ui.exportProgress = p; }); }); } finally { set(s => { s.ui.exporting = false; s.ui.exportProgress = 0; }); } },
  async exportCurrentMonthPng() { try { const idx = get().ui.activeMonth; await exportCurrentPageAsPng(get().project, idx); } catch (e) { get().actions.addToast('PNG export failed', 'error'); } },
    async addPhotos(files) {
      const arr = Array.from(files);
      const newPhotos = await Promise.all(arr.map(async f => {
        const id = crypto.randomUUID();
        const blob = f;
        const originalBlobRef = await savePhotoBlob(id, blob);
        const previewUrl = URL.createObjectURL(blob);
        return { id, originalBlobRef, previewBlobRef: '', name: f.name, assignedMonths: [], previewUrl };
      }));
      set(s => { s.project.photos.push(...newPhotos); });
      get().actions.saveNow();
    },
    async removePhoto(photoId) {
      const p = get().project.photos.find(p => p.id === photoId);
      // Clear any references from month slots
      set(s => {
        for (const page of s.project.monthData) {
          for (const slot of page.slots) {
            if (slot.photoId === photoId) slot.photoId = undefined;
          }
        }
        s.project.photos = s.project.photos.filter(pp => pp.id !== photoId);
      });
      // Delete blob after state update
      await deletePhotoBlob(p?.originalBlobRef);
      get().actions.saveNow();
    },
    async addCoverPhotos(files) {
      const arr = Array.from(files);
      const newPhotos = await Promise.all(arr.map(async f => {
        const id = crypto.randomUUID();
        const originalBlobRef = await savePhotoBlob(id, f);
        const previewUrl = URL.createObjectURL(f);
        return { id, originalBlobRef, previewBlobRef: '', name: f.name, assignedMonths: [], previewUrl };
      }));
      set(s => { s.project.coverPhotos.push(...newPhotos); });
      get().actions.saveNow();
    },
    async removeCoverPhoto(photoId) {
      const p = get().project.coverPhotos.find(p => p.id === photoId);
      set(s => {
        if (s.project.calendar.coverPhotoId === photoId) s.project.calendar.coverPhotoId = undefined;
        s.project.coverPhotos = s.project.coverPhotos.filter(pp => pp.id !== photoId);
      });
      await deletePhotoBlob(p?.originalBlobRef);
      get().actions.saveNow();
    },
    assignPhotoToActiveSlot(photoId, slotId) { set(s => { const m = s.ui.activeMonth; const monthPage = s.project.monthData[m]; const targetSlotId = slotId || s.ui.activeSlotId || monthPage.slots[0]?.slotId; const slot = monthPage.slots.find((sl: MonthSlot) => sl.slotId === targetSlotId); if (slot) slot.photoId = photoId; }); get().actions.saveNow(); },
  updateActiveSlotTransform(delta) { set(s => { const m = s.ui.activeMonth; const monthPage = s.project.monthData[m]; const slot = monthPage.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId) || monthPage.slots[0]; if (!slot) return; if (delta.scale !== undefined) slot.transform.scale = Math.min(5, Math.max(0.1, delta.scale)); if (delta.translateX !== undefined) slot.transform.translateX = delta.translateX; if (delta.translateY !== undefined) slot.transform.translateY = delta.translateY; if (delta.rotationDegrees !== undefined) slot.transform.rotationDegrees = ((delta.rotationDegrees % 360) + 360) % 360; });
      if (!(window as any).__cm_save_debounced__) {
        (window as any).__cm_save_debounced__ = debounce(() => get().actions.saveNow(), 800);
      }
      (window as any).__cm_save_debounced__();
    },
  resetActiveSlotTransform() { set(s => { const m = s.ui.activeMonth; const monthPage = s.project.monthData[m]; const slot = monthPage.slots.find((sl: MonthSlot) => sl.slotId === s.ui.activeSlotId); if (slot) { slot.transform = { scale:1, translateX:0, translateY:0, rotationDegrees:0 }; } }); },
  addEvent(input) { set(s => { const id = crypto.randomUUID(); s.project.events.push({ id, dateISO: input.dateISO, text: input.text, color: input.color, visible: true }); }); get().actions.saveNow(); },
  deleteEvent(id) { set(s => { s.project.events = s.project.events.filter(ev => ev.id !== id); }); },
  toggleEventVisible(id) { set(s => { const ev = s.project.events.find(e => e.id === id); if (ev) ev.visible = !ev.visible; }); get().actions.saveNow(); },
  updateEvent(id, input) { set(s => { const ev = s.project.events.find(e => e.id === id); if (!ev) return; if (input.text !== undefined) ev.text = input.text; if (input.color !== undefined) ev.color = input.color; if (input.dateISO !== undefined) ev.dateISO = input.dateISO; }); get().actions.saveNow(); },
    addToast(text, type = 'info') {
      const id = crypto.randomUUID();
      set(s => { s.ui.toasts.push({ id, text, type }); });
      setTimeout(() => { set(s => { s.ui.toasts = s.ui.toasts.filter(t => t.id !== id); }); }, 2500);
    },
  removeToast(id) { set(s => { s.ui.toasts = s.ui.toasts.filter(t => t.id !== id); }); },
  setExportProgress(p) { set(s => { s.ui.exportProgress = p; }); },
  async saveNow() { await saveProject(get().project); },
  async loadLastProject() {
      const lastId = getLastProjectId();
      if (!lastId) return;
      const loaded = await loadProjectById(lastId);
      if (loaded) {
        set(s => {
          // Normalize orientation based on page size (5x7 => landscape, others => portrait)
          if (loaded.calendar.pageSize === '5x7') {
            loaded.calendar.orientation = 'landscape';
            loaded.calendar.splitDirection = 'lr';
          } else {
            loaded.calendar.orientation = 'portrait';
            loaded.calendar.splitDirection = 'tb';
          }
          s.project = loaded; s.ui.activeMonth = 0; s.ui.activeSlotId = 'main';
        });
        if (loaded.calendar.showCommonHolidays) get().actions.syncHolidayEvents();
      }
  },
  async clearAllData() { const id = get().project.id; await clearProject(id); set(s => { s.project = defaultProject(); s.ui.activeMonth = 0; s.ui.activeSlotId = 'main'; }); }
  ,
  syncHolidayEvents() {
    const cal = get().project.calendar;
    if (!cal.showCommonHolidays) return;
    get().actions.removeHolidayEvents();
    const map = collectHolidayMap(cal.startMonth, cal.startYear, cal.months);
    set(s => {
      for (const iso of Object.keys(map)) {
        s.project.events.push({ id: crypto.randomUUID(), dateISO: iso, text: map[iso], color: '#b15c00', visible: true, systemTag: 'holiday' });
      }
    });
  },
  removeHolidayEvents() { set(s => { s.project.events = s.project.events.filter(ev => ev.systemTag !== 'holiday'); }); }
  }
})));

export { shallow };

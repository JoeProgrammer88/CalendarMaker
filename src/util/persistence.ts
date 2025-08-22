import { del, get, set } from 'idb-keyval';
import type { ProjectState, PhotoMeta } from '../types';

const LAST_PROJECT_KEY = 'calendar:lastProjectId';
const projectKey = (id: string) => `project:${id}:json`;
const photoKey = (id: string) => `photo:${id}:original`;

export function getLastProjectId(): string | null {
  try { return localStorage.getItem(LAST_PROJECT_KEY); } catch { return null; }
}

export function setLastProjectId(id: string) {
  try { localStorage.setItem(LAST_PROJECT_KEY, id); } catch {}
}

export async function savePhotoBlob(photoId: string, blob: Blob): Promise<string> {
  const key = photoKey(photoId);
  await set(key, blob);
  return key;
}

export async function loadPhotoBlob(photo: PhotoMeta): Promise<Blob | null> {
  const key = photo.originalBlobRef;
  if (!key) return null;
  try { return (await get(key)) as Blob | null; } catch { return null; }
}

export async function saveProject(project: ProjectState): Promise<void> {
  const now = new Date().toISOString();
  const toSave: ProjectState = {
    ...project,
    meta: { ...project.meta, updatedAt: now },
    // Strip volatile previewUrls before persisting JSON
    photos: project.photos.map(p => ({ ...p, previewUrl: undefined }))
  };
  await set(projectKey(project.id), toSave);
  setLastProjectId(project.id);
}

export async function loadProjectById(id: string): Promise<ProjectState | null> {
  let data: ProjectState | undefined;
  try { data = await get(projectKey(id)); } catch {}
  if (!data) return null;
  // Migrate if needed
  if (!data.meta || (data.meta as any).schemaVersion === undefined) {
    data = migrateToLatest(data as any);
  }
  // Recreate preview URLs from stored blobs
  const photos = await Promise.all(
    (data.photos || []).map(async (p) => {
      const blob = await loadPhotoBlob(p);
      const previewUrl = blob ? URL.createObjectURL(blob) : undefined;
      return { ...p, previewUrl } as PhotoMeta;
    })
  );
  return { ...data, photos };
}

export async function clearProject(id: string): Promise<void> {
  const data: ProjectState | null = await loadProjectById(id);
  if (data) {
    // delete photo blobs
    await Promise.all((data.photos || []).map(async p => { if (p.originalBlobRef) await del(p.originalBlobRef); }));
  }
  await del(projectKey(id));
}

// Delete a single photo blob given its storage key
export async function deletePhotoBlob(refKey?: string | null): Promise<void> {
  if (!refKey) return;
  try { await del(refKey); } catch {}
}

export function migrateToLatest(old: any): ProjectState {
  const migrated: ProjectState = {
    ...old,
    meta: { ...(old.meta||{}), schemaVersion: 1 }
  } as ProjectState;
  // Future migrations can be added here.
  try {
    if (migrated?.calendar?.layoutStylePerMonth) {
      migrated.calendar.layoutStylePerMonth = migrated.calendar.layoutStylePerMonth.map((id: any) => {
        if (id === 'single-left') return 'single-top' as any;
        if (id === 'dual-split-lr') return 'dual-split' as any;
        if (id === 'triple-strip-lr') return 'triple-strip' as any;
        if (id === 'quad-grid-lr') return 'quad-grid' as any;
        return id;
      });
    }
  } catch {}
  return migrated;
}

export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let t: any;
  return ((...args: any[]) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }) as T;
}

import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
// @ts-ignore - fontkit types not provided by default
import fontkit from '@pdf-lib/fontkit';
import type { ProjectState } from '../types';
import { computePagePixelSize } from './pageSize';
import { getLayoutById } from './layouts';
import { getEffectiveLayout } from './constants';
import { generateMonthGrid, isoWeekNumber } from './calendar';

function pickStandardFontName(fontFamily: string) {
  switch (fontFamily) {
    case 'Merriweather':
      return StandardFonts.TimesRoman;
    case 'JetBrains Mono':
      return StandardFonts.Courier;
    default:
      // Inter, Oswald, Dancing Script → Helvetica fallback
      return StandardFonts.Helvetica;
  }
}

async function tryFetchFontBytes(family: string): Promise<Uint8Array | undefined> {
  // Expect TTFs placed under public/fonts so they're served at /fonts/*.ttf
  // We'll try a few common filenames per family.
  const candidates: Record<string, string[]> = {
    'Inter': ['Inter-Regular.ttf', 'Inter.ttf'],
    'Merriweather': ['Merriweather-Regular.ttf', 'Merriweather.ttf'],
    'Dancing Script': ['DancingScript-Regular.ttf', 'DancingScript.ttf'],
    'Oswald': ['Oswald-Regular.ttf', 'Oswald.ttf'],
    'JetBrains Mono': ['JetBrainsMono-Regular.ttf', 'JetBrainsMono.ttf'],
  };
  const files = candidates[family] ?? [];
  for (const file of files) {
    const url = `/fonts/${file}`;
    try {
      const resp = await fetch(url);
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        return new Uint8Array(buf);
      }
    } catch (_) {
      // ignore and try next
    }
  }
  return undefined;
}

async function embedSelectedFont(pdf: PDFDocument, fontFamily: string) {
  // Try custom TTF first (subset for size), then fallback to core StandardFonts
  const bytes = await tryFetchFontBytes(fontFamily);
  if (bytes) {
    try {
      return await pdf.embedFont(bytes, { subset: true });
    } catch (_) {
      // fall through to standard font if embed fails
    }
  }
  return await pdf.embedFont(pickStandardFontName(fontFamily));
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

async function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve(new Uint8Array());
      const fr = new FileReader();
      fr.onload = () => {
        const buf = fr.result as ArrayBuffer;
        resolve(new Uint8Array(buf));
      };
      fr.readAsArrayBuffer(blob);
    }, 'image/png');
  });
}

function getMonthLabel(year: number, month0: number) {
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${monthNames[month0]} ${year}`;
}

function getCommonHolidays(year: number): Record<string, string> {
  // Very small subset: New Year's Day, Independence Day (US), Christmas; fixed dates only for demo.
  const map: Record<string, string> = {};
  const add = (m: number, d: number, name: string) => { map[`${year}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`] = name; };
  add(1, 1, "New Year's Day");
  add(7, 4, 'Independence Day');
  add(12, 25, 'Christmas Day');
  return map;
}

export async function exportAsPdf(project: ProjectState, onProgress?: (p: number) => void) {
  const pdf = await PDFDocument.create();
  // Register fontkit to allow embedding TrueType/OpenType fonts
  // Note: this call is harmless if fontkit cannot be loaded in some environments
  // and custom fonts will gracefully fall back to StandardFonts.
  try { (pdf as any).registerFontkit?.(fontkit); } catch {}
  const font = await embedSelectedFont(pdf, project.calendar.fontFamily);
  const hasCover = !!project.calendar.includeCoverPage;
  const totalPages = project.calendar.months + (project.calendar.includeYearlyOverview ? 1 : 0) + (hasCover ? 1 : 0);
  let pageCounter = 0;

  // Optional Cover Page
  if (hasCover) {
    const { pageSize, orientation } = project.calendar;
    const pt = computePagePixelSize(pageSize, orientation, 72);
    const page = pdf.addPage([pt.width, pt.height]);
    const { width, height } = page.getSize();
    const margin = 36;
    const infoH = height * 0.10;
    const photoH = height - infoH;
    const startMonth = project.calendar.startMonth;
    const startYear = project.calendar.startYear;
    const endOffset = startMonth + project.calendar.months - 1;
    const endMonth0 = endOffset % 12;
    const endYear = startYear + Math.floor(endOffset / 12);
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const startText = `${monthNames[startMonth]} ${startYear}`;
    const endText = `${monthNames[endMonth0]} ${endYear}`;

  if ((project.calendar.coverStyle ?? 'large-photo') === 'large-photo') {
      // Use dedicated cover photo if set; otherwise fallback to any available
      const coverId = project.calendar.coverPhotoId;
        let anyPhoto = coverId
          ? (project.coverPhotos?.find(p => p.id === coverId) || project.photos.find(p => p.id === coverId))
          : undefined;
        if (!anyPhoto) {
          anyPhoto = (project.coverPhotos?.find(p => !!p.previewUrl)) || project.photos.find(p => !!p.previewUrl);
        }
      if (anyPhoto?.previewUrl) {
        const img = await loadImage(anyPhoto.previewUrl);
        // draw covering the top 90%
        const coverH = photoH;
        const coverW = width;
        // render via canvas to preserve scaling quality
        const canvas = document.createElement('canvas');
        const scale = 300/72; // export at ~300 DPI equivalent
        canvas.width = Math.max(1, Math.round(coverW * scale));
        canvas.height = Math.max(1, Math.round(coverH * scale));
        const ctx = canvas.getContext('2d')!;
        ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
        const t = project.calendar.coverTransform || { scale:1, translateX:0, translateY:0, rotationDegrees:0 };
        const baseScale = Math.max(canvas.width / img.width, canvas.height / img.height);
        const s = baseScale * (t.scale || 1);
        const tx = (t.translateX || 0) * canvas.width;
        const ty = (t.translateY || 0) * canvas.height;
        const rad = (t.rotationDegrees || 0) * Math.PI/180;
        ctx.save();
        ctx.translate(canvas.width/2 + tx, canvas.height/2 + ty);
        if (rad) ctx.rotate(rad);
        ctx.scale(s, s);
        ctx.drawImage(img, -img.width/2, -img.height/2);
        ctx.restore();
        const png = await canvasToPngBytes(canvas);
        const embedded = await pdf.embedPng(png);
        page.drawImage(embedded, { x: 0, y: height - coverH, width: coverW, height: coverH });
      } else {
        // placeholder rect
        page.drawRectangle({ x: 0, y: height - photoH, width, height: photoH, borderColor: rgb(0.4,0.6,0.9), borderWidth: 1 });
      }
    } else {
      // grid-4x3: compile up to 12 month thumbnails (photos) into a 4x3 grid occupying 90%
      const rows = 3, cols = 4;
      const gap = 6;
      const areaX = margin, areaY = height - photoH + margin;
      const areaW = width - margin*2, areaH = photoH - margin*2;
      const cellW = (areaW - gap*(cols-1)) / cols;
      const cellH = (areaH - gap*(rows-1)) / rows;
      // pick photos in month order
      const photos: (string|undefined)[] = [];
      for (let i = 0; i < Math.min(project.calendar.months, 12); i++) {
        const pageData = project.monthData[i];
        // prefer first slot with a photo
        const slot = pageData?.slots?.find(s => !!s.photoId);
        const p = slot ? project.photos.find(pp => pp.id === slot.photoId) : undefined;
        photos.push(p?.previewUrl);
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r*cols + c;
          const x = areaX + c * (cellW + gap);
          const y = areaY + (rows - 1 - r) * (cellH + gap);
          const url = photos[idx];
          if (url) {
            const img = await loadImage(url);
            // embed with simple fit cover into cell
            const canvas = document.createElement('canvas');
            const scale = 300/72;
            canvas.width = Math.max(1, Math.round(cellW * scale));
            canvas.height = Math.max(1, Math.round(cellH * scale));
            const ctx = canvas.getContext('2d')!;
            ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
            const baseScale = Math.max(canvas.width / img.width, canvas.height / img.height);
            ctx.save();
            ctx.translate(canvas.width/2, canvas.height/2);
            ctx.scale(baseScale, baseScale);
            ctx.drawImage(img, -img.width/2, -img.height/2);
            ctx.restore();
            const png = await canvasToPngBytes(canvas);
            const embedded = await pdf.embedPng(png);
            page.drawImage(embedded, { x, y, width: cellW, height: cellH });
          } else {
            page.drawRectangle({ x, y, width: cellW, height: cellH, borderColor: rgb(0.8,0.8,0.8), borderWidth: 0.5 });
          }
        }
      }
    }
    // Info stripe (10%) with start/end dates centered
    const infoY = 0;
    page.drawRectangle({ x: 0, y: infoY, width, height: infoH, color: rgb(1,1,1) });
    const label = `${startText} — ${endText}`;
    const size = 20;
    const textW = font.widthOfTextAtSize(label, size);
    page.drawText(label, { x: (width - textW)/2, y: infoY + (infoH - size)/2, size, font, color: rgb(0,0,0) });

    pageCounter++;
    if (onProgress) onProgress(pageCounter / totalPages);
  }

  // Optional Yearly Overview
  if (project.calendar.includeYearlyOverview) {
    const { pageSize, orientation } = project.calendar;
    const pt = computePagePixelSize(pageSize, orientation, 72);
    const page = pdf.addPage([pt.width, pt.height]);
    const { width, height } = page.getSize();
    const startMonth = project.calendar.startMonth;
    const startYear = project.calendar.startYear;
    page.drawText(`${startYear} Overview`, { x: 40, y: height - 50, size: 24, font, color: rgb(0,0,0) });
    const cols = 3, rows = 4;
    const margin = 36;
    const gapX = 14, gapY = 14;
    const gridW = width - margin*2 - gapX*(cols-1);
    const gridH = height - margin*2 - 60 - gapY*(rows-1);
    const cellW = gridW / cols;
    const cellH = gridH / rows;
    const holidays = project.calendar.showCommonHolidays ? getCommonHolidays(startYear) : {};

    for (let i = 0; i < 12; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const x = margin + c * (cellW + gapX);
      const y = height - margin - (r + 1) * cellH - r * gapY;
      const m0 = (startMonth + i) % 12;
      const yOffset = Math.floor((startMonth + i) / 12);
      const yReal = startYear + yOffset;
      // month label
      page.drawText(getMonthLabel(yReal, m0), { x: x + 6, y: y + cellH - 16, size: 12, font, color: rgb(0,0,0) });
      // mini grid
      const headerH = 12;
      const weeks = generateMonthGrid(yReal, m0).weeks;
      const cols2 = 7;
      const cellW2 = (cellW - 12) / cols2;
      const cellH2 = (cellH - 24) / 7; // header + 6
      const gx = x + 6;
      const gy = y + 6;
      // header labels
      ['S','M','T','W','T','F','S'].forEach((d, idx) => {
        page.drawText(d, { x: gx + idx * cellW2 + 2, y: gy + 6 + 6 * cellH2 + 2, size: 8, font, color: rgb(0,0,0) });
      });
      // grid lines
      for (let rr = 0; rr <= 7; rr++) {
        const yy = gy + rr * cellH2 + headerH;
        page.drawLine({ start: { x: gx, y: yy }, end: { x: gx + cols2 * cellW2, y: yy }, thickness: 0.25, color: rgb(0.8,0.8,0.8) });
      }
      for (let cc = 0; cc <= cols2; cc++) {
        const xx = gx + cc * cellW2;
        page.drawLine({ start: { x: xx, y: gy + headerH }, end: { x: xx, y: gy + headerH + 6 * cellH2 }, thickness: 0.25, color: rgb(0.8,0.8,0.8) });
      }
      // days
      for (let w = 0; w < weeks.length; w++) {
        for (let d = 0; d < 7; d++) {
          const cell = weeks[w][d];
          const cx = gx + d * cellW2 + 2;
          const cy = gy + headerH + (5 - w) * cellH2 + cellH2 - 12; // invert for PDF coords
          if (cell.inMonth && cell.day) {
            const dateISO = `${yReal}-${String(m0+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
            const isHoliday = holidays[dateISO];
            if (isHoliday) {
              // subtle highlight
              page.drawRectangle({ x: gx + d*cellW2 + 0.5, y: gy + headerH + (5 - w)*cellH2 + 0.5, width: cellW2 - 1, height: cellH2 - 1, color: rgb(1,0.95,0.8) });
            }
            page.drawText(String(cell.day), { x: cx, y: cy, size: 8, font, color: rgb(0,0,0) });
          }
        }
      }
      // border
      page.drawRectangle({ x, y, width: cellW, height: cellH, borderColor: rgb(0.6,0.6,0.6), borderWidth: 0.5 });
    }
    pageCounter++;
    if (onProgress) onProgress(pageCounter / totalPages);
  }
  for (let m = 0; m < project.calendar.months; m++) {
  const layoutId = project.calendar.layoutStylePerMonth[m];
  const { pageSize, orientation, splitDirection } = project.calendar;
  const layout = getEffectiveLayout(layoutId, splitDirection)!;
    const pt = computePagePixelSize(pageSize, orientation, 72); // PDF points = inches * 72
    const px = computePagePixelSize(pageSize, orientation, 300); // export DPI pixels
    const page = pdf.addPage([pt.width, pt.height]);
    const { width, height } = page.getSize();

  // Derive current month/year
  const startMonth = project.calendar.startMonth;
  const startYear = project.calendar.startYear;
  const totalOffset = startMonth + m;
  const realMonth = totalOffset % 12;
  const realYear = startYear + Math.floor(totalOffset / 12);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthLabel = `${monthNames[realMonth]} ${realYear}`;

    // Render photo slots using per-slot canvas (clipped) then embed as PNG
    const monthPage = project.monthData[m];
    for (const slot of layout.slots) {
      const slotPointW = slot.rect.w * width;
      const slotPointH = slot.rect.h * height;
      const slotPixelW = Math.max(1, Math.round(slot.rect.w * px.width));
      const slotPixelH = Math.max(1, Math.round(slot.rect.h * px.height));
      const s = monthPage.slots.find(s => s.slotId === slot.slotId);
      const photo = s?.photoId ? project.photos.find(p => p.id === s.photoId) : undefined;
      if (!s || !photo?.previewUrl) {
        // draw placeholder outline
        const x = slot.rect.x * width;
        const y = height - (slot.rect.y * height) - slotPointH;
        page.drawRectangle({ x, y, width: slotPointW, height: slotPointH, borderColor: rgb(0.3,0.5,0.9), borderWidth: 1 });
        continue;
      }
      const img = await loadImage(photo.previewUrl);
      const canvas = document.createElement('canvas');
      canvas.width = slotPixelW;
      canvas.height = slotPixelH;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      // Fill transparent background
      ctx.clearRect(0,0,slotPixelW, slotPixelH);
      // Compute cover scale and apply transform
      const t = s.transform;
      const baseScale = Math.max(slotPixelW / img.width, slotPixelH / img.height);
      const scale = baseScale * (t.scale || 1);
      const tx = (t.translateX || 0) * slotPixelW;
      const ty = (t.translateY || 0) * slotPixelH;
      const rad = (t.rotationDegrees || 0) * Math.PI / 180;
      ctx.save();
      ctx.translate(slotPixelW/2 + tx, slotPixelH/2 + ty);
      if (rad) ctx.rotate(rad);
      ctx.scale(scale, scale);
      ctx.drawImage(img, -img.width/2, -img.height/2);
      ctx.restore();
      const pngBytes = await canvasToPngBytes(canvas);
      const embedded = await pdf.embedPng(pngBytes);
      const x = slot.rect.x * width;
      const y = height - (slot.rect.y * height) - slotPointH;
      page.drawImage(embedded, { x, y, width: slotPointW, height: slotPointH });
    }

  // Calendar grid with days and events
  const g = layout.grid;
  const gx = g.x * width;
  // Apply 0.25 inch top margin for 5x7 page size on the text (grid) side only
  const topMarginPt = project.calendar.pageSize === '5x7' ? (0.25 * 72) : 0;
  // Position the grid so the entire grid (including the header) is shifted DOWN by the top margin on 5x7
  // Keep the bottom the same and reduce height so the top drops by topMarginPt
  const gy = height - (g.y * height) - (g.h * height);
  const gw = g.w * width;
  const gh = (g.h * height) - topMarginPt;
  // Compute header metrics first
  const columns = 7 + (project.calendar.showWeekNumbers ? 1 : 0);
  const cellW = gw / columns;
  const cellH = gh / 7; // header + 6 weeks
  // Header background fill (draw BEFORE text so it doesn't cover the label)
  // Extend upward into the top margin for 5x7 so the gray covers the gap above the header, not week 1
  page.drawRectangle({ x: gx, y: gy + gh - cellH, width: gw, height: cellH + topMarginPt, color: rgb(0.96,0.96,0.96) });
  // Shade the week-number header cell slightly differently (to match preview), if enabled
  if (project.calendar.showWeekNumbers) {
    page.drawRectangle({ x: gx, y: gy + gh - cellH, width: cellW, height: cellH, color: rgb(0.98,0.98,0.98) });
  }
  // Month label inside grid header (bottom half)
  const labelSize = 16;
  const labelWidth = font.widthOfTextAtSize(monthLabel, labelSize);
  const labelX = gx + (gw - labelWidth) / 2;
  const labelY = gy + gh - labelSize - 2; // near top of header row
  page.drawText(monthLabel, { x: labelX, y: labelY, size: labelSize, font, color: rgb(0,0,0) });
  // Note: Do not draw an outer border across the full grid, to avoid vertical lines in the header area.
    const weekDayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    // Header labels
    if (project.calendar.showWeekNumbers) {
      page.drawText('Wk', { x: gx + 4, y: gy + gh - cellH + 4, size: 10, font, color: rgb(0,0,0) });
    }
    weekDayLabels.forEach((d, i) => {
      const cx = gx + (i + (project.calendar.showWeekNumbers ? 1 : 0)) * cellW;
      // Add a bit more gap below the month label
      page.drawText(d, { x: cx + 4, y: gy + gh - cellH + 8, size: 10, font, color: rgb(0,0,0) });
    });
    // Grid lines
      // horizontal lines: draw all rows except the top-of-header line (r=7); include header bottom (r=6)
      for (let r = 0; r <= 7; r++) {
        if (r === 7) continue; // no top border on header
        const y = gy + r * cellH;
        page.drawLine({ start: { x: gx, y }, end: { x: gx + gw, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
      }
  // vertical lines: draw only for the days area (exclude the header entirely)
  const headerBottomY = gy + gh - cellH; // bottom edge of header row
      for (let c = 0; c <= columns; c++) {
        const x = gx + c * cellW;
        page.drawLine({ start: { x, y: gy }, end: { x, y: headerBottomY }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
      }

    // Days and events (truncate to 2 lines)
    const grid = generateMonthGrid(realYear, realMonth);
    const events = project.events.filter(e => e.visible && e.dateISO.startsWith(`${realYear}-${String(realMonth+1).padStart(2,'0')}`));
    for (let w = 0; w < grid.weeks.length; w++) {
      const week = grid.weeks[w];
      // Week number column (shade background like preview and draw the ISO week)
      if (project.calendar.showWeekNumbers) {
        const cx = gx;
        const cy = gy + gh - (w + 2) * cellH; // bottom of this week row
        // subtle background shade for the Wk column
        page.drawRectangle({ x: cx, y: cy, width: cellW, height: cellH, color: rgb(0.98,0.98,0.98) });
        const first = week.find(c => c?.date)?.date;
        if (first) {
          const wk = isoWeekNumber(first);
          const wx = gx + 4;
          const wy = gy + gh - (w + 2) * cellH + cellH - 14;
          page.drawText(String(wk), { x: wx, y: wy, size: 10, font, color: rgb(0,0,0) });
        }
      }
      for (let d = 0; d < week.length; d++) {
        const cell = week[d];
        const col = d + (project.calendar.showWeekNumbers ? 1 : 0);
        const cx = gx + col * cellW;
        const cy = gy + gh - (w + 2) * cellH; // header is row 0
        if (cell.inMonth && cell.day) {
          page.drawText(String(cell.day), { x: cx + 4, y: cy + cellH - 14, size: 10, font, color: rgb(0,0,0) });
          const dateISO = `${realYear}-${String(realMonth+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
          const cellEvents = events.filter(e => e.dateISO === dateISO).slice(0,2);
          cellEvents.forEach((ev, idx) => {
            const y = cy + cellH - 28 - idx * 12;
            const color = parseHexColor(ev.color);
            page.drawText(ev.text, { x: cx + 4, y, size: 9, font, color });
          });
        }
      }
    }

  // Caption removed
    // Progress update per page
  pageCounter++;
  if (onProgress) onProgress(pageCounter / totalPages);
  }

  const bytes = await pdf.save();
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  const blob = new Blob([ab], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'calendar.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

// Export the currently active month as a PNG via canvas rendering path.
export async function exportCurrentPageAsPng(project: ProjectState, monthIndex: number): Promise<void> {
  // Reuse PDF logic: render each slot to a canvas and the grid to canvas, then download PNG
  // For MVP, we'll call into PDF pipeline’s per-slot canvas steps quickly by duplicating minimal logic here.
  const { pageSize, orientation, layoutStylePerMonth, splitDirection } = project.calendar;
  const px = computePagePixelSize(pageSize, orientation, 300);
  const canvas = document.createElement('canvas');
  canvas.width = px.width; canvas.height = px.height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,px.width, px.height);
  const layout = getEffectiveLayout(layoutStylePerMonth[monthIndex], splitDirection)!;
  // Draw photos
  const monthPage = project.monthData[monthIndex];
  for (const slot of layout.slots) {
    const slotPixelW = Math.max(1, Math.round(slot.rect.w * px.width));
    const slotPixelH = Math.max(1, Math.round(slot.rect.h * px.height));
    const s = monthPage.slots.find(ss => ss.slotId === slot.slotId);
    const photo = s?.photoId ? project.photos.find(p => p.id === s.photoId) : undefined;
    const x = Math.round(slot.rect.x * px.width);
    const y = Math.round(slot.rect.y * px.height);
    if (!s || !photo?.previewUrl) {
      ctx.strokeStyle = '#4d80e5'; ctx.lineWidth = 2; ctx.strokeRect(x, y, slotPixelW, slotPixelH);
      continue;
    }
    const img = await loadImage(photo.previewUrl);
    const t = s.transform;
    const baseScale = Math.max(slotPixelW / img.width, slotPixelH / img.height);
    const scale = baseScale * (t.scale || 1);
    const tx = (t.translateX || 0) * slotPixelW;
    const ty = (t.translateY || 0) * slotPixelH;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, slotPixelW, slotPixelH); ctx.clip();
    ctx.translate(x + slotPixelW/2 + tx, y + slotPixelH/2 + ty);
    if (t.rotationDegrees) ctx.rotate((t.rotationDegrees * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.width/2, -img.height/2);
    ctx.restore();
  }
  // Simple month label (header only) to signal success; full grid PNG export can be deepened post-MVP
  ctx.fillStyle = '#000';
  ctx.font = '24px sans-serif';
  const totalOffset = project.calendar.startMonth + monthIndex;
  const realMonth = totalOffset % 12;
  const realYear = project.calendar.startYear + Math.floor(totalOffset / 12);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const text = `${monthNames[realMonth]} ${realYear}`;
  const textWidth = ctx.measureText(text).width;
  ctx.fillText(text, (px.width - textWidth)/2, 32);
  // Download
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a'); a.href = url; a.download = `calendar-${realYear}-${String(realMonth+1).padStart(2,'0')}.png`; a.click();
}

function parseHexColor(hex?: string) {
  if (!hex) return rgb(0,0,0);
  let h = hex.trim();
  if (h.startsWith('#')) h = h.slice(1);
  if (h.length === 3) {
    const r = parseInt(h[0]+h[0],16)/255;
    const g = parseInt(h[1]+h[1],16)/255;
    const b = parseInt(h[2]+h[2],16)/255;
    return rgb(r,g,b);
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0,2),16)/255;
    const g = parseInt(h.slice(2,4),16)/255;
    const b = parseInt(h.slice(4,6),16)/255;
    return rgb(r,g,b);
  }
  return rgb(0,0,0);
}

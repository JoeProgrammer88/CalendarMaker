import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ProjectState } from '../types';
import { computePagePixelSize } from './pageSize';
import { getLayoutById } from './layouts';
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
  const font = await pdf.embedFont(pickStandardFontName(project.calendar.fontFamily));
  const totalPages = project.calendar.months + (project.calendar.includeYearlyOverview ? 1 : 0);
  let pageCounter = 0;

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
    const layout = getLayoutById(layoutId)!;
    const { pageSize, orientation } = project.calendar;
    const pt = computePagePixelSize(pageSize, orientation, 72); // PDF points = inches * 72
    const px = computePagePixelSize(pageSize, orientation, 300); // export DPI pixels
    const page = pdf.addPage([pt.width, pt.height]);
    const { width, height } = page.getSize();

    // Draw title
  const startMonth = project.calendar.startMonth;
  const startYear = project.calendar.startYear;
  const totalOffset = startMonth + m;
  const realMonth = totalOffset % 12;
  const realYear = startYear + Math.floor(totalOffset / 12);
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthLabel = `${monthNames[realMonth]} ${realYear}`;
  page.drawText(monthLabel, { x: 40, y: height - 50, size: 24, font, color: rgb(0,0,0) });

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
    const gy = height - (g.y * height) - (g.h * height);
    const gw = g.w * width;
    const gh = g.h * height;
  page.drawRectangle({ x: gx, y: gy, width: gw, height: gh, borderColor: rgb(0.6,0.6,0.6), borderWidth: 1 });
    const columns = 7 + (project.calendar.showWeekNumbers ? 1 : 0);
    const cellW = gw / columns;
    const cellH = gh / 7; // header + 6 weeks
    const weekDayLabels = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    // Header labels
    if (project.calendar.showWeekNumbers) {
      page.drawText('Wk', { x: gx + 4, y: gy + gh - cellH + 6, size: 10, font, color: rgb(0,0,0) });
    }
    weekDayLabels.forEach((d, i) => {
      const cx = gx + (i + (project.calendar.showWeekNumbers ? 1 : 0)) * cellW;
      page.drawText(d, { x: cx + 4, y: gy + gh - cellH + 6, size: 10, font, color: rgb(0,0,0) });
    });
    // Grid lines
    for (let r = 0; r <= 7; r++) {
      const y = gy + r * cellH;
      page.drawLine({ start: { x: gx, y }, end: { x: gx + gw, y }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
    }
    for (let c = 0; c <= columns; c++) {
      const x = gx + c * cellW;
      page.drawLine({ start: { x, y: gy }, end: { x, y: gy + gh }, thickness: 0.5, color: rgb(0.8,0.8,0.8) });
    }

    // Days and events (truncate to 2 lines)
    const grid = generateMonthGrid(realYear, realMonth);
    const events = project.events.filter(e => e.visible && e.dateISO.startsWith(`${realYear}-${String(realMonth+1).padStart(2,'0')}`));
    for (let w = 0; w < grid.weeks.length; w++) {
      const week = grid.weeks[w];
      // Week number column
      if (project.calendar.showWeekNumbers) {
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

    // Caption above grid
    const pageData = project.monthData[m];
    if (pageData?.caption) {
      page.drawText(pageData.caption, { x: gx + 4, y: gy + gh + 6, size: 12, font, color: rgb(0,0,0) });
    }
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

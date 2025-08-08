import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { ProjectState } from '../types';
import { computePagePixelSize } from './pageSize';
import { getLayoutById } from './layouts';

export async function exportAsPdf(project: ProjectState) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  for (let m = 0; m < project.calendar.months; m++) {
    const layoutId = project.calendar.layoutStylePerMonth[m];
    const layout = getLayoutById(layoutId)!;
    const { pageSize, orientation } = project.calendar;
    const px = computePagePixelSize(pageSize, orientation, 72); // PDF points approximation
    const page = pdf.addPage([px.width, px.height]);
    const { width, height } = page.getSize();

    // Draw title
    const monthLabel = `Month ${m + 1}`;
    page.drawText(monthLabel, { x: 40, y: height - 50, size: 24, font, color: rgb(0,0,0) });

    // Draw slot outlines
    layout.slots.forEach((slot) => {
      const x = slot.rect.x * width;
      const y = height - (slot.rect.y * height) - (slot.rect.h * height);
      const w = slot.rect.w * width;
      const h = slot.rect.h * height;
      page.drawRectangle({ x, y, width: w, height: h, borderColor: rgb(0.3,0.5,0.9), borderWidth: 1 });
    });

    // Placeholder calendar grid rectangle
    const g = layout.grid;
    const gx = g.x * width;
    const gy = height - (g.y * height) - (g.h * height);
    const gw = g.w * width;
    const gh = g.h * height;
    page.drawRectangle({ x: gx, y: gy, width: gw, height: gh, borderColor: rgb(0.6,0.6,0.6), borderWidth: 1 });
  }

  const bytes = await pdf.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'calendar.pdf';
  a.click();
  URL.revokeObjectURL(url);
}

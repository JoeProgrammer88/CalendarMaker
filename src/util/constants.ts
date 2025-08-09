import type { LayoutDef, LayoutId } from '../types';

export const SIZES = {
  '5x7': true,
  'Letter': true,
  'A4': true,
  '11x17': true,
  '13x19': true
};

export const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Sans)' },
  { value: 'Merriweather', label: 'Merriweather (Serif)' },
  { value: 'Dancing Script', label: 'Dancing Script (Script)' },
  { value: 'Oswald', label: 'Oswald (Display)' },
  { value: 'JetBrains Mono', label: 'JetBrains Mono (Mono)' }
];

export const LAYOUTS: LayoutDef[] = [
  { id: 'single-top', name: 'Single Top', supportedOrientations: ['portrait','landscape'], slots: [ { slotId: 'main', rect: { x:0, y:0, w:1, h:0.55 } } ], grid: { x:0, y:0.55, w:1, h:0.45 } },
  { id: 'single-left', name: 'Single Left', supportedOrientations: ['landscape','portrait'], slots: [ { slotId: 'main', rect: { x:0, y:0, w:0.5, h:1 } } ], grid: { x:0.5, y:0, w:0.5, h:1 } },
  { id: 'full-bleed', name: 'Full Bleed', supportedOrientations: ['portrait','landscape'], slots: [ { slotId: 'main', rect: { x:0, y:0, w:1, h:0.65 } } ], grid: { x:0, y:0.65, w:1, h:0.35 } },
  // Dual Split (top/bottom container) but photos arranged as columns in photo area; grid at bottom
  { id: 'dual-split', name: 'Dual Split', supportedOrientations: ['portrait','landscape'],
  slots: [ { slotId: 'a', rect: { x:0, y:0, w:0.5, h:0.50 } }, { slotId: 'b', rect: { x:0.5, y:0, w:0.5, h:0.50 } } ],
  grid: { x:0, y:0.50, w:1, h:0.50 } },
  // Triple Strip (top/bottom container) but photos arranged as 3 columns in photo area; grid at bottom
  { id: 'triple-strip', name: 'Triple Strip', supportedOrientations: ['portrait','landscape'],
  slots: [ { slotId: 'a', rect: { x:0/3, y:0, w:1/3, h:0.50 } }, { slotId: 'b', rect: { x:1/3, y:0, w:1/3, h:0.50 } }, { slotId: 'c', rect: { x:2/3, y:0, w:1/3, h:0.50 } } ],
  grid: { x:0, y:0.50, w:1, h:0.50 } },
  // Quad Grid (top/bottom): photo area only half page height (top 50%), 2x2 collage inside
  { id: 'quad-grid', name: 'Quad Grid', supportedOrientations: ['portrait','landscape'],
    slots: [ { slotId: 'a', rect: { x:0, y:0, w:0.5, h:0.25 } }, { slotId: 'b', rect: { x:0.5, y:0, w:0.5, h:0.25 } }, { slotId: 'c', rect: { x:0, y:0.25, w:0.5, h:0.25 } }, { slotId: 'd', rect: { x:0.5, y:0.25, w:0.5, h:0.25 } } ],
    grid: { x:0, y:0.50, w:1, h:0.50 } },
  // LR Variants for 5x7 landscape
  { id: 'dual-split-lr', name: 'Dual Split (LR)', supportedOrientations: ['landscape','portrait'], slots: [ { slotId: 'a', rect: { x: 0.00, y: 0, w: 0.25, h: 1 } }, { slotId: 'b', rect: { x: 0.25, y: 0, w: 0.25, h: 1 } } ], grid: { x: 0.5, y: 0, w: 0.5, h: 1 } },
  { id: 'triple-strip-lr', name: 'Triple Strip (LR)', supportedOrientations: ['landscape','portrait'], slots: [ { slotId: 'a', rect: { x: 0.00, y: 0, w: 1/6, h: 1 } }, { slotId: 'b', rect: { x: 1/6, y: 0, w: 1/6, h: 1 } }, { slotId: 'c', rect: { x: 2/6, y: 0, w: 1/6, h: 1 } } ], grid: { x: 0.5, y: 0, w: 0.5, h: 1 } },
  { id: 'quad-grid-lr', name: 'Quad Grid (LR)', supportedOrientations: ['landscape','portrait'], slots: [ { slotId: 'a', rect: { x: 0.00, y: 0.00, w: 0.25, h: 0.5 } }, { slotId: 'b', rect: { x: 0.25, y: 0.00, w: 0.25, h: 0.5 } }, { slotId: 'c', rect: { x: 0.00, y: 0.50, w: 0.25, h: 0.5 } }, { slotId: 'd', rect: { x: 0.25, y: 0.50, w: 0.25, h: 0.5 } } ], grid: { x: 0.5, y: 0, w: 0.5, h: 1 } }
];

export function getLayoutById(id: LayoutId) {
  return LAYOUTS.find(l => l.id === id);
}

export function getEffectiveLayout(id: LayoutId, splitDirection: 'tb'|'lr') {
  let mapped: LayoutId = id;
  if (splitDirection === 'lr') {
    if (id === 'single-top') mapped = 'single-left';
    if (id === 'dual-split') mapped = 'dual-split-lr' as LayoutId;
    if (id === 'triple-strip') mapped = 'triple-strip-lr' as LayoutId;
    if (id === 'quad-grid') mapped = 'quad-grid-lr' as LayoutId;
  } else {
    // Map LR-only ids back to base TB equivalents
    if (id === 'single-left') mapped = 'single-top';
    if ((id as string) === 'dual-split-lr') mapped = 'dual-split';
    if ((id as string) === 'triple-strip-lr') mapped = 'triple-strip';
    if ((id as string) === 'quad-grid-lr') mapped = 'quad-grid';
  }
  return getLayoutById(mapped) || getLayoutById(id);
}

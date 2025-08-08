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
  { id: 'single-left', name: 'Single Left', supportedOrientations: ['landscape','portrait'], slots: [ { slotId: 'main', rect: { x:0, y:0, w:0.55, h:1 } } ], grid: { x:0.55, y:0, w:0.45, h:1 } },
  { id: 'full-bleed', name: 'Full Bleed', supportedOrientations: ['portrait','landscape'], slots: [ { slotId: 'main', rect: { x:0, y:0, w:1, h:0.65 } } ], grid: { x:0, y:0.65, w:1, h:0.35 } },
  { id: 'dual-split', name: 'Dual Split', supportedOrientations: ['portrait','landscape'], slots: [ { slotId: 'a', rect: { x:0, y:0, w:1, h:0.32 } }, { slotId: 'b', rect: { x:0, y:0.32, w:1, h:0.32 } } ], grid: { x:0, y:0.64, w:1, h:0.36 } },
  { id: 'triple-strip', name: 'Triple Strip', supportedOrientations: ['portrait','landscape'], slots: [ { slotId: 'a', rect: { x:0, y:0, w:1, h:0.25 } }, { slotId: 'b', rect: { x:0, y:0.25, w:1, h:0.25 } }, { slotId: 'c', rect: { x:0, y:0.50, w:1, h:0.25 } } ], grid: { x:0, y:0.75, w:1, h:0.25 } },
  { id: 'quad-grid', name: 'Quad Grid', supportedOrientations: ['portrait','landscape'], slots: [ { slotId: 'a', rect: { x:0, y:0, w:0.5, h:0.4 } }, { slotId: 'b', rect: { x:0.5, y:0, w:0.5, h:0.4 } }, { slotId: 'c', rect: { x:0, y:0.4, w:0.5, h:0.4 } }, { slotId: 'd', rect: { x:0.5, y:0.4, w:0.5, h:0.4 } } ], grid: { x:0, y:0.80, w:1, h:0.20 } }
];

export function getLayoutById(id: LayoutId) {
  return LAYOUTS.find(l => l.id === id);
}

import { LAYOUTS } from './constants.ts';
import type { LayoutId, LayoutDef } from '../types.ts';

export function getLayoutById(id: LayoutId): LayoutDef | undefined {
  return LAYOUTS.find(l => l.id === id);
}

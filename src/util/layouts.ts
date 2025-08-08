import { LAYOUTS } from './constants';
import type { LayoutId, LayoutDef } from '../types';

export function getLayoutById(id: LayoutId): LayoutDef | undefined {
  return LAYOUTS.find((l: LayoutDef) => l.id === id);
}

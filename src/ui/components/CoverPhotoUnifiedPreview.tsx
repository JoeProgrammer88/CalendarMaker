import React, { useRef } from 'react';
import { useCalendarStore } from '../../store/store';
import { computePagePixelSize } from '../../util/pageSize';

interface UnifiedCoverPreviewProps {
  which: 'legacy' | 'front' | 'rear';
  label: string;
}

// Re-usable preview matching month photo interaction (pan/zoom/rotate + overlay controls)
export const CoverPhotoUnifiedPreview: React.FC<UnifiedCoverPreviewProps> = ({ which, label }) => {
  const {
    pageSize, orientation,
    photoId, transform,
    setLegacy, setFront, setRear,
    updateLegacy, updateFront, updateRear,
    resetLegacy, resetFront, resetRear,
    openPicker
  } = useCalendarStore(s => ({
    pageSize: s.project.calendar.pageSize,
    orientation: s.project.calendar.orientation,
    photoId: which === 'legacy' ? s.project.calendar.coverPhotoId : (which === 'front' ? s.project.calendar.frontCoverPhotoId : s.project.calendar.rearCoverPhotoId),
    transform: which === 'legacy' ? (s.project.calendar.coverTransform || { scale:1, translateX:0, translateY:0, rotationDegrees:0 }) : (which === 'front' ? (s.project.calendar.frontCoverTransform || { scale:1, translateX:0, translateY:0, rotationDegrees:0 }) : (s.project.calendar.rearCoverTransform || { scale:1, translateX:0, translateY:0, rotationDegrees:0 })),
    setLegacy: s.actions.setCoverPhoto,
    setFront: s.actions.setFrontCoverPhoto,
    setRear: s.actions.setRearCoverPhoto,
    updateLegacy: s.actions.updateCoverTransform,
    updateFront: s.actions.updateFrontCoverTransform,
    updateRear: s.actions.updateRearCoverTransform,
    resetLegacy: s.actions.resetCoverTransform,
    resetFront: s.actions.resetFrontCoverTransform,
    resetRear: s.actions.resetRearCoverTransform,
    openPicker: s.actions.openCoverPicker
  }));
  const coverPhotos = useCalendarStore(s => s.project.coverPhotos);
  const allPhotos = useCalendarStore(s => s.project.photos);
  const photo = coverPhotos.find(p => p.id === photoId) || allPhotos.find(p => p.id === photoId);
  const px = computePagePixelSize(pageSize, orientation, 100);
  const dragRef = useRef<{ active:boolean; startX:number; startY:number; startTX:number; startTY:number }|null>(null);
  const update = (delta: Partial<{ scale:number; translateX:number; translateY:number; rotationDegrees:number }>) => {
    if (which === 'legacy') updateLegacy(delta);
    else if (which === 'front') updateFront(delta);
    else updateRear(delta);
  };
  const reset = () => { if (which === 'legacy') resetLegacy(); else if (which === 'front') resetFront(); else resetRear(); };
  const clear = () => { if (which === 'legacy') setLegacy(null); else if (which === 'front') setFront(null); else setRear(null); };
  const openSelect = () => { if (which === 'legacy') { /* reuse legacy adding process: open picker for front, fallback */ openPicker('front'); } else openPicker(which as 'front' | 'rear'); };
  const onPointerDown: React.PointerEventHandler<HTMLDivElement> = e => {
    if (!photo) { openSelect(); return; }
    const target = e.target as HTMLElement; if (target.closest('[data-controls]')) return;
    try { (e.currentTarget as any).setPointerCapture?.(e.pointerId); } catch {}
    dragRef.current = { active:true, startX:e.clientX, startY:e.clientY, startTX: transform.translateX||0, startTY: transform.translateY||0 };
    e.preventDefault();
  };
  const onPointerMove: React.PointerEventHandler<HTMLDivElement> = e => {
    const d = dragRef.current; if (!d?.active) return; e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = d.startTX + (e.clientX - d.startX)/rect.width;
    const ny = d.startTY + (e.clientY - d.startY)/rect.height;
    update({ translateX: nx, translateY: ny });
  };
  const end = () => { if (dragRef.current) dragRef.current.active = false; };
  const onWheel: React.WheelEventHandler<HTMLDivElement> = e => { e.preventDefault(); const factor = e.deltaY < 0 ? 1.1 : 1/1.1; update({ scale: (transform.scale||1)*factor }); };
  const tx = (transform.translateX||0)*100; const ty = (transform.translateY||0)*100;
  const style: React.CSSProperties = { transform:`translate(-50%, -50%) translate(${tx}%, ${ty}%) scale(${transform.scale||1}) rotate(${transform.rotationDegrees||0}deg)`, transformOrigin:'center center' };
  return (
    <div className="w-full">
      <div className="text-[11px] font-medium mb-1 flex items-center justify-between">
        <span>{label}</span>
        {photoId && <button onClick={clear} className="text-[10px] text-red-600 hover:underline">Clear</button>}
      </div>
      <div className="relative w-full rounded border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-700 overflow-hidden select-none" style={{ aspectRatio: `${px.width} / ${px.height}`, touchAction:'none' }} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={end} onPointerCancel={end} onWheel={onWheel} onDoubleClick={openSelect}>
        {!photo && <button type="button" onClick={openSelect} className="absolute inset-0 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-300/30 text-[10px]">Click to choose</button>}
        {photo?.previewUrl && <img src={photo.previewUrl} alt={photo.name} className="absolute left-1/2 top-1/2 w-[130%] h-[130%] object-cover" style={style} draggable={false} />}
        {photo && (
          <div data-controls className="absolute bottom-1 left-1 right-1 flex flex-wrap gap-1 bg-white/80 dark:bg-gray-900/80 backdrop-blur p-1 rounded text-[9px]">
            <button onClick={() => update({ scale:(transform.scale||1)*1.1 })} className="px-1 py-0.5 bg-gray-300 dark:bg-gray-600 rounded">+</button>
            <button onClick={() => update({ scale:(transform.scale||1)/1.1 })} className="px-1 py-0.5 bg-gray-300 dark:bg-gray-600 rounded">-</button>
            <button onClick={() => update({ rotationDegrees:(transform.rotationDegrees||0)+90 })} className="px-1 py-0.5 bg-gray-300 dark:bg-gray-600 rounded">⟳</button>
            <button onClick={() => update({ translateX:0, translateY:0 })} className="px-1 py-0.5 bg-gray-300 dark:bg-gray-600 rounded">Center</button>
            <button onClick={reset} className="px-1 py-0.5 bg-red-500 text-white rounded">Reset</button>
            <button onClick={openSelect} className="px-1 py-0.5 bg-blue-600 text-white rounded">Change</button>
          </div>
        )}
      </div>
    </div>
  );
};

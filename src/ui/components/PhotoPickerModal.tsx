import React from 'react';
import { useCalendarStore } from '../../store/store';
import { shallow } from 'zustand/shallow';

export const PhotoPickerModal: React.FC = () => {
  const { isOpen, monthIndex, slotId, photos, actions } = useCalendarStore(s => ({
    isOpen: s.ui.photoPicker.open,
    monthIndex: s.ui.photoPicker.monthIndex,
    slotId: s.ui.photoPicker.slotId,
    photos: s.project.photos,
    actions: s.actions,
  }), shallow);

  if (!isOpen || monthIndex === null || !slotId) {
    return null;
  }

  const handleSelectPhoto = (photoId: string) => {
    actions.assignPhotoToSlot(photoId, monthIndex, slotId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={actions.closePhotoPicker}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-4xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Choose a Photo</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-auto">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => handleSelectPhoto(photo.id)}
              className="relative group border border-gray-300 dark:border-gray-600 rounded overflow-hidden aspect-square bg-gray-100 dark:bg-gray-700"
            >
              {photo.previewUrl ? (
                <img src={photo.previewUrl} alt={photo.name} className="object-cover w-full h-full" />
              ) : (
                <span className="text-xs p-1">{photo.name}</span>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center transition-all">
                <span className="text-white opacity-0 group-hover:opacity-100">Select</span>
              </div>
            </button>
          ))}
          {photos.length === 0 && (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
              You haven't uploaded any photos yet.
            </p>
          )}
        </div>
        <div className="mt-4 text-right">
          <button
            onClick={actions.closePhotoPicker}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export const CoverPhotoPickerModal: React.FC = () => {
  const { isOpen, target, photos, actions } = useCalendarStore(s => ({
    isOpen: s.ui.coverPicker?.open,
    target: s.ui.coverPicker?.target,
    photos: s.project.coverPhotos.length ? s.project.coverPhotos : s.project.photos,
    actions: s.actions
  }), shallow);
  if (!isOpen || !target) return null;
  const handleSelect = (photoId: string) => {
    if (target === 'front') actions.setFrontCoverPhoto(photoId);
    else if (target === 'rear') actions.setRearCoverPhoto(photoId);
    else if (target === 'legacy') actions.setCoverPhoto(photoId);
    actions.closeCoverPicker();
  };
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={actions.closeCoverPicker}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 w-full max-w-3xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
  <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Select {target === 'front' ? 'Front' : target === 'rear' ? 'Rear' : 'Cover'} Photo</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 overflow-auto">
          {photos.map(photo => (
            <button key={photo.id} onClick={() => handleSelect(photo.id)} className="relative group border border-gray-300 dark:border-gray-600 rounded overflow-hidden aspect-square bg-gray-100 dark:bg-gray-700">
              {photo.previewUrl ? <img src={photo.previewUrl} alt={photo.name} className="object-cover w-full h-full" /> : <span className="text-xs p-1">{photo.name}</span>}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all"><span className="text-white opacity-0 group-hover:opacity-100">Select</span></div>
            </button>
          ))}
          {photos.length === 0 && <p className="col-span-full text-center text-gray-500 dark:text-gray-400 text-sm">No cover photos uploaded yet.</p>}
        </div>
        <div className="mt-4 text-right">
          <button onClick={actions.closeCoverPicker} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 rounded text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { PagePreview } from './components/PagePreview';
import { RightPanel } from './components/RightPanel';
import { useCalendarStore } from '../store/store';
import { EventModal } from './components/EventModal';
import { ToastHost } from './components/ToastHost';

export const App: React.FC = () => {
  const dark = useCalendarStore(s => s.ui.darkMode);
  const { monthIndex, startMonth, startYear } = useCalendarStore(s => ({ monthIndex: s.ui.activeMonth, startMonth: s.project.calendar.startMonth, startYear: s.project.calendar.startYear }));
  const load = useCalendarStore(s => s.actions.loadLastProject);
  const nudge = useCalendarStore(s => s.actions.updateActiveSlotTransform);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const ctrlOrMeta = e.ctrlKey || e.metaKey;
      // Undo/Redo removed
      const step = e.shiftKey ? 0.02 : 0.005;
      if (e.key === 'ArrowLeft') { nudge({ translateX: (val => val - step)(0) }); }
      if (e.key === 'ArrowRight') { nudge({ translateX: (val => val + step)(0) }); }
      if (e.key === 'ArrowUp') { nudge({ translateY: (val => val - step)(0) }); }
      if (e.key === 'ArrowDown') { nudge({ translateY: (val => val + step)(0) }); }
      if (e.key === '+') { nudge({ scale: (val => val + 0.05)(0) }); }
      if (e.key === '-') { nudge({ scale: (val => val - 0.05)(0) }); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [nudge]);
  const totalOffset = startMonth + monthIndex;
  const realMonth = totalOffset % 12;
  const realYear = startYear + Math.floor(totalOffset / 12);
  return (
    <div className={dark ? 'dark min-h-screen flex flex-col' : 'min-h-screen flex flex-col'}>
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100">
  <h1 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Calendar Customizer</h1>
        <div className="text-sm text-gray-600 dark:text-gray-200">Viewing: {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][realMonth]} {realYear}</div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-auto bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-100 p-4">
          <PagePreview />
        </main>
        <RightPanel />
      </div>
  <EventModal />
  <ToastHost />
    </div>
  );
};

const ThemeToggle: React.FC = () => {
  const toggle = useCalendarStore(s => s.actions.toggleDarkMode);
  const dark = useCalendarStore(s => s.ui.darkMode);
  return (
  <button onClick={toggle} className="px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700/80">
      {dark ? 'Light' : 'Dark'} Mode
    </button>
  );
};

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
  const totalOffset = startMonth + monthIndex;
  const realMonth = totalOffset % 12;
  const realYear = startYear + Math.floor(totalOffset / 12);
  return (
    <div className={dark ? 'dark h-full flex flex-col' : 'h-full flex flex-col'}>
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 className="font-semibold text-lg">Calendar Customizer (MVP)</h1>
        <div className="text-sm text-gray-600 dark:text-gray-300">Viewing: {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][realMonth]} {realYear}</div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 min-h-0 overflow-auto bg-gray-100 dark:bg-gray-900 p-4">
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
    <button onClick={toggle} className="px-3 py-1 rounded text-sm border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700">
      {dark ? 'Light' : 'Dark'} Mode
    </button>
  );
};

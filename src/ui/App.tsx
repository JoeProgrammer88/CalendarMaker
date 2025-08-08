import React from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { PagePreview } from './components/PagePreview.tsx';
import { RightPanel } from './components/RightPanel.tsx';
import { useCalendarStore } from '../store/store.ts';

export const App: React.FC = () => {
  const dark = useCalendarStore(s => s.ui.darkMode);
  return (
    <div className={dark ? 'dark h-full flex flex-col' : 'h-full flex flex-col'}>
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 className="font-semibold text-lg">Calendar Customizer (MVP)</h1>
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

import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './ui/App';
// @ts-ignore virtual module provided by vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

createRoot(document.getElementById('root')!).render(<App />);

// PWA: auto-update registration
registerSW({ immediate: true });

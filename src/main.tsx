import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './ui/App';

createRoot(document.getElementById('root')!).render(<App />);

// PWA: register service worker when supported
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('/sw.js').catch(() => {});
	});
}

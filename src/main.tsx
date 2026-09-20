import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Intercept and handle iframe cross-origin SecurityErrors gracefully
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('cross-origin frame') ||
      msg.includes('SecurityError') ||
      msg.includes('Blocked a frame') ||
      event.error?.name === 'SecurityError'
    ) {
      event.preventDefault();
      console.warn('Handled cross-origin frame access restriction:', msg);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = event.reason?.message || String(event.reason || '');
    if (
      reasonMsg.includes('cross-origin frame') ||
      reasonMsg.includes('SecurityError') ||
      reasonMsg.includes('Blocked a frame') ||
      event.reason?.name === 'SecurityError'
    ) {
      event.preventDefault();
      console.warn('Handled cross-origin promise rejection:', reasonMsg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

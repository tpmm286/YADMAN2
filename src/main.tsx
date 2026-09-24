import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register service worker in production, clean up lingering workers in development
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    registerSW({
      immediate: true,
      onNeedRefresh() {
        console.log('یادمان: نسخه جدید در دسترس است.');
      },
      onOfflineReady() {
        console.log('یادمان: اپلیکیشن به صورت آفلاین آماده کار است.');
      },
    });
  } else {
    // Unregister any lingering service workers in dev environment to avoid websocket/HMR conflicts
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

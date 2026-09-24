import React, { useState } from 'react';
import { WifiOff, CheckCircle, X } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [isDismissed, setIsDismissed] = useState(false);

  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div
      id="pwa-offline-banner"
      className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 flex items-center justify-between gap-3 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700/80 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
      dir="rtl"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
          <WifiOff className="w-5 h-5 animate-pulse" />
        </div>
        <div className="text-right">
          <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
            <span>حالت آفلاین فعال است</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5 leading-normal">
            تمام قابلیت‌ها و مرورهای ابینگهاوس بدون نیاز به اینترنت در دسترس هستند.
          </p>
        </div>
      </div>

      <button
        onClick={() => setIsDismissed(true)}
        className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
        title="بستن اعلان"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

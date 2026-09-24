import React, { useState } from 'react';
import { Download, Smartphone, Share2, PlusSquare, X, CheckCircle2, Monitor, ChevronLeft, Info } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'menuItem' | 'drawer' | 'header';
  onAction?: () => void;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ 
  variant = 'menuItem',
  onAction
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'desktop'>(
    isIOS ? 'ios' : 'android'
  );
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isInstalled) {
      setShowGuideModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        const success = await install();
        if (success && onAction) {
          onAction();
        }
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Open helpful guide modal
      setShowGuideModal(true);
    }
  };

  // If header variant is requested, don't show it (PWA shouldn't be in the header)
  if (variant === 'header') {
    return null;
  }

  return (
    <>
      {/* Standard Menu Item in Drawer/System */}
      {variant === 'menuItem' && (
        <button
          id="pwa-install-menu-item"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-700 group"
          title="نصب وب‌اپلیکیشن یادمان (PWA)"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm flex items-center gap-2">
                <span>نصب وب‌اپلیکیشن (PWA)</span>
                {isInstalled ? (
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    نصب شده
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                    اختیاری
                  </span>
                )}
              </div>
              <div className="text-xs opacity-70 mt-0.5 text-slate-500">
                {isInstalled
                  ? 'برنامه در حالت مستقل و آفلاین فعال است'
                  : 'افزودن به صفحه اصلی و استفاده آفلاین'}
              </div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 opacity-40 group-hover:opacity-70 transition-opacity" />
        </button>
      )}

      {/* Legacy Drawer Variant (if used, rendered cleanly) */}
      {variant === 'drawer' && (
        <button
          id="pwa-install-drawer-btn"
          onClick={handleInstallClick}
          className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="text-right">
              <div className="font-semibold text-sm">نصب وب‌اپلیکیشن (PWA)</div>
              <div className="text-xs opacity-70 mt-0.5 text-slate-500">افزودن به صفحه اصلی</div>
            </div>
          </div>
          <ChevronLeft className="w-4 h-4 opacity-40" />
        </button>
      )}

      {/* Guided Install Modal for Android / iOS / Desktop */}
      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          dir="rtl"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 text-right space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-slate-900 font-bold text-base">
                <div className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3>نصب و افزودن وب‌اپلیکیشن (PWA)</h3>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Already installed notice */}
            {isInstalled ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>اپلیکیشن در حال حاضر نصب است</span>
                </div>
                <p className="text-xs leading-relaxed text-emerald-800">
                  شما در حال استفاده از نسخه نصب‌شده یادمان به صورت تمام‌صفحه و با پشتیبانی کامل آفلاین هستید. نیازی به نصب مجدد نیست.
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  با افزودن یادمان به صفحه اصلی، برنامه بدون نوار مرورگر و مانند یک اپلیکیشن بومی با سرعت بالا و قابلیت کار آفلاین اجرا می‌شود.
                </p>

                {/* Direct install trigger if browser supports it */}
                {isInstallable && (
                  <div className="p-3 bg-teal-50 border border-teal-200/80 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-teal-900">نصب مستقیم در مرورگر</div>
                      <div className="text-[11px] text-teal-700">مرورگر شما از نصب خودکار پشتیبانی می‌کند.</div>
                    </div>
                    <button
                      onClick={handleInstallClick}
                      disabled={isInstalling}
                      className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isInstalling ? 'در حال نصب...' : 'نصب مستقیم'}</span>
                    </button>
                  </div>
                )}

                {/* Platform Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setActiveTab('android')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'android'
                        ? 'bg-white text-teal-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>اندروید (Chrome)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('ios')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'ios'
                        ? 'bg-white text-blue-700 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>آیفون / آیپد (Safari)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('desktop')}
                    className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                      activeTab === 'desktop'
                        ? 'bg-white text-slate-800 shadow-xs font-bold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>کامپیوتر (PC/Mac)</span>
                  </button>
                </div>

                {/* Tab Instructions */}
                <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  {activeTab === 'android' && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          ۱
                        </span>
                        <span>
                          در مرورگر کروم یا سامسونگ، روی علامت <strong>سه نقطه (⋮)</strong> در بالا یا پایین صفحه بزنید.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          ۲
                        </span>
                        <span>
                          گزینه <strong>«افزودن به صفحه اصلی» (Add to Home screen)</strong> یا <strong>«نصب برنامه» (Install app)</strong> را لمس کنید.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-teal-950">
                        <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>آیکون یادمان به لیست برنامه‌های گوشی اضافه می‌شود.</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'ios' && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <Share2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>
                          ۱. در مرورگر Safari، روی آیکون <strong>اشتراک‌گذاری (Share)</strong> در پایین صفحه بزنید.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <PlusSquare className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>
                          ۲. در منوی بازشده، گزینه <strong>Add to Home Screen (افزودن به صفحه اصلی)</strong> را انتخاب کنید.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>
                          ۳. در گوشه بالا روی <strong>Add</strong> بزنید تا آیکون روی صفحه شما قرار گیرد.
                        </span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'desktop' && (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <Monitor className="w-4 h-4 text-slate-700 shrink-0 mt-0.5" />
                        <span>
                          ۱. در مرورگر <strong>Google Chrome</strong> یا <strong>Microsoft Edge</strong>، به انتهای سمت راست نوار آدرس توجه کنید.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <Download className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>
                          ۲. روی آیکون کوچک <strong>نصب (Install / دسکتاپ با فلش رو به پایین)</strong> کلیک کنید.
                        </span>
                      </div>
                      <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-teal-50/70 border border-teal-100 text-teal-950">
                        <Info className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                        <span>یا از منوی سه نقطه مرورگر: گزینه <strong>Save and share &gt; Install Yadman</strong> را انتخاب کنید.</span>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full rounded-xl bg-slate-800 hover:bg-slate-900 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </>
  );
};


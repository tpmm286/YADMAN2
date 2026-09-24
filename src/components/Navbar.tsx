import React, { useState, useEffect } from 'react';
import { Brain, Bell, Plus, BookOpen, FileEdit, Download, Sun, Moon, Palette, Clock, Sparkles, GraduationCap, Timer, FileText, Menu, X, ChevronLeft, RotateCcw, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { toPersianDigits, formatPersianDate } from '../utils/dateUtils';
import { ThemeMode } from '../types';
import { LicenseSystemInfo } from '../utils/licenseUtils';
import { PWAInstallButton } from './PWAInstallButton';

interface NavbarProps {
  dueCount: number;
  activeTab: 'dashboard' | 'schedule' | 'topics';
  setActiveTab: (tab: 'dashboard' | 'schedule' | 'topics') => void;
  onOpenAddModal: () => void;
  onOpenInfoModal: () => void;
  onOpenBackupModal: () => void;
  onOpenBusyModal: () => void;
  activeBusyCount?: number;
  onOpenStudentModal?: () => void;
  isStudentModeActive?: boolean;
  onOpenPomodoroModal?: () => void;
  onOpenReportModal?: () => void;
  onOpenFactoryResetModal?: () => void;
  onOpenPdfExportModal?: () => void;
  licenseInfo?: LicenseSystemInfo;
  onOpenLicenseModal?: () => void;
  currentDateText: string;
  hasDraft?: boolean;
  currentTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  dueCount,
  activeTab,
  setActiveTab,
  onOpenAddModal,
  onOpenInfoModal,
  onOpenBackupModal,
  onOpenBusyModal,
  activeBusyCount = 0,
  onOpenStudentModal,
  isStudentModeActive = false,
  onOpenPomodoroModal,
  onOpenReportModal,
  onOpenFactoryResetModal,
  onOpenPdfExportModal,
  licenseInfo,
  onOpenLicenseModal,
  currentDateText,
  hasDraft = false,
  currentTheme,
  onThemeChange,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-xs transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Hamburger */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMenuOpen(true)}
                className="p-2 -ml-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                title="منوی اصلی"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Brain className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-base sm:text-xl font-bold text-slate-900">
                      مرور ابینگهاوس
                    </h1>
                  </div>
                  <p className="text-[10px] sm:text-xs text-slate-500 hidden lg:block">
                    برنامه‌ریزی هوشمند بر اساس منحنی فراموشی
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Center Navigation (Tabs in Header) */}
            <div className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/50 rounded-2xl border border-slate-200/50 shadow-xs">
              <button
                onClick={() => setActiveTab('topics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                  activeTab === 'topics'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <BookOpen className={`w-4 h-4 ${activeTab === 'topics' ? 'fill-blue-50' : ''}`} />
                <span className="hidden lg:inline">فهرست مطالب</span>
                <span className="lg:hidden">مطالب</span>
              </button>

              {isStudentModeActive && (
                <button
                  onClick={() => setActiveTab('schedule')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                    activeTab === 'schedule'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                  }`}
                >
                  <Clock className={`w-4 h-4 ${activeTab === 'schedule' ? 'fill-blue-50' : ''}`} />
                  <span className="hidden lg:inline">برنامه درسی</span>
                  <span className="lg:hidden">برنامه</span>
                </button>
              )}

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs lg:text-sm font-bold transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                }`}
              >
                <Sparkles className={`w-4 h-4 ${activeTab === 'dashboard' ? 'fill-blue-50' : ''}`} />
                <span className="hidden lg:inline">تحلیل حافظه</span>
                <span className="lg:hidden">تحلیل</span>
              </button>
            </div>

            {/* Right Controls (Main Actions) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Notification Badge / Ready Counter */}
              <div
                id="header-due-counter"
                className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  dueCount > 0
                    ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
                title={`${dueCount} مطلب آماده مرور است`}
              >
                <Bell className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${dueCount > 0 ? 'text-rose-600' : 'text-slate-400'}`} />
                <span className="whitespace-nowrap">
                  {dueCount > 0 ? `${toPersianDigits(dueCount)} مرور` : 'تکمیل'}
                </span>
              </div>

              {/* Add New Topic Button */}
              <button
                id="add-topic-header-btn"
                onClick={onOpenAddModal}
                className="relative flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all transform active:scale-98"
              >
                {hasDraft && (
                  <span
                    className="absolute -top-1 -right-1 flex h-3 w-3"
                    title="پیش‌نویس ذخیره‌شده در فرم موجود است"
                  >
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-white"></span>
                  </span>
                )}
                {hasDraft ? <FileEdit className="w-4 h-4 text-amber-200" /> : <Plus className="w-4 h-4" />}
                <span className="hidden sm:inline">{hasDraft ? 'ادامه پیش‌نویس' : 'مطلب جدید'}</span>
                <span className="sm:hidden">جدید</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile & Desktop Right Sidebar Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Drawer */}
          <div className="relative w-72 sm:w-80 h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">منوی امکانات</h2>
              <button 
                onClick={() => setIsMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Theme Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">پوسته ظاهری</label>
                <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 text-sm border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => onThemeChange('light')}
                    className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      currentTheme === 'light'
                        ? 'bg-white text-blue-600 shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>روشن</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onThemeChange('classic')}
                    className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      currentTheme === 'classic'
                        ? 'bg-white text-amber-700 shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Palette className="w-4 h-4" />
                    <span>کلاسیک</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onThemeChange('dark')}
                    className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                      currentTheme === 'dark'
                        ? 'bg-slate-800 text-yellow-400 shadow-sm font-semibold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>تیره</span>
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* Tools Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">ابزارهای تحصیلی</label>
                <div className="space-y-1">
                  
                  {/* Student Schedule */}
                  {onOpenStudentModal && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenStudentModal();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        isStudentModeActive
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isStudentModeActive ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
                          <GraduationCap className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            برنامه هوشمند دانش‌آموز
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold">بتا</span>
                          </div>
                          <div className="text-xs opacity-70 mt-0.5 text-slate-500">تحلیل بار شناختی ابینگهاوس</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-40" />
                    </button>
                  )}

                  {/* PDF Export Download */}
                  {onOpenPdfExportModal && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenPdfExportModal();
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-amber-50/70 rounded-xl transition-all text-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100 text-amber-700 font-bold">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            دانلود PDF برنامه تحصیلی
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[9px] font-bold">جدید</span>
                          </div>
                          <div className="text-xs opacity-70 mt-0.5 text-slate-500">خروجی ماهیانه و سالیانه (رنگی / پرینت)</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-40" />
                    </button>
                  )}

                  {/* Busy Schedule */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenBusyModal();
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm flex items-center gap-2">
                          مدیریت مشغله‌ها
                          {activeBusyCount > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                              {toPersianDigits(activeBusyCount)} فعال
                            </span>
                          )}
                        </div>
                        <div className="text-xs opacity-70 mt-0.5 text-slate-500">تطبیق زمان باشگاه و دانشگاه</div>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-40" />
                  </button>

                  {/* Pomodoro Timer */}
                  {onOpenPomodoroModal && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenPomodoroModal();
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                          <Timer className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">تایمر تمرکز پومودورو</div>
                          <div className="text-xs opacity-70 mt-0.5 text-slate-500">مطالعه با فواصل استراحت</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-40" />
                    </button>
                  )}
                  
                  {/* Weekly Report */}
                  {onOpenReportModal && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenReportModal();
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">گزارش هفتگی PDF</div>
                          <div className="text-xs opacity-70 mt-0.5 text-slate-500">خروجی گرافیکی پیشرفت</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-40" />
                    </button>
                  )}
                </div>
              </div>

              <div className="h-px bg-slate-100"></div>

              {/* System Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">سیستم</label>
                <div className="space-y-1">
                  {/* License & Activation */}
                  {onOpenLicenseModal && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenLicenseModal();
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
                        licenseInfo?.isActivated
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : licenseInfo?.isExpired
                          ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                          : 'hover:bg-slate-50 border-transparent text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          licenseInfo?.isActivated
                            ? 'bg-amber-100 text-amber-700'
                            : licenseInfo?.status === 'LICENSE_EXPIRED' || licenseInfo?.isExpired
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-indigo-50 text-indigo-600'
                        }`}>
                          {licenseInfo?.isActivated ? (
                            <ShieldCheck className="w-5 h-5" />
                          ) : (
                            <KeyRound className="w-5 h-5" />
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm flex items-center gap-1.5">
                            <span>لایسنس و فعال‌سازی</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                              licenseInfo?.isActivated
                                ? 'bg-amber-200 text-amber-900'
                                : licenseInfo?.status === 'LICENSE_EXPIRED' || licenseInfo?.isExpired
                                ? 'bg-rose-200 text-rose-900'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {licenseInfo?.isActivated
                                ? licenseInfo.licenseDetails?.duration === 'LIFETIME'
                                  ? 'دائمی'
                                  : `${toPersianDigits(licenseInfo.remainingDays)} روز مانده`
                                : licenseInfo?.status === 'LICENSE_EXPIRED'
                                ? 'منقضی شده'
                                : licenseInfo?.isExpired
                                ? 'اتمام ۷ روز'
                                : `${toPersianDigits(licenseInfo?.remainingDays ?? 0)} روز آزمایشی`}
                            </span>
                          </div>
                          <div className="text-xs opacity-75 mt-0.5 text-slate-500">
                            {licenseInfo?.isActivated
                              ? `${licenseInfo.licenseDetails?.tierLabel} • ${
                                  licenseInfo.licenseDetails?.duration === 'LIFETIME'
                                    ? 'مادام‌العمر'
                                    : `انقضا: ${licenseInfo.exactExpiresAt ? formatPersianDate(licenseInfo.exactExpiresAt) : '-'}`
                                }`
                              : `مهلت آزمایشی تا ${licenseInfo?.exactExpiresAt ? formatPersianDate(licenseInfo.exactExpiresAt) : '-'}`}
                          </div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-40" />
                    </button>
                  )}

                  {/* Backup */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenBackupModal();
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                        <Download className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">پشتیبان‌گیری (Backup)</div>
                        <div className="text-xs opacity-70 mt-0.5 text-slate-500">ذخیره و بازیابی داده‌ها</div>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-40" />
                  </button>

                  {/* Info */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      onOpenInfoModal();
                    }}
                    className="w-full flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-all text-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">درباره سیستم ابینگهاوس</div>
                        <div className="text-xs opacity-70 mt-0.5 text-slate-500">راهنمای فواصل مرور</div>
                      </div>
                    </div>
                    <ChevronLeft className="w-4 h-4 opacity-40" />
                  </button>

                  {/* PWA Install (Optional for users who want to add it themselves) */}
                  <PWAInstallButton 
                    variant="menuItem" 
                    onAction={() => setIsMenuOpen(false)} 
                  />

                  {/* Factory Reset */}
                  {onOpenFactoryResetModal && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenFactoryResetModal();
                      }}
                      className="w-full flex items-center justify-between p-3 hover:bg-rose-50/70 rounded-xl transition-all text-rose-800 border border-transparent hover:border-rose-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-sm text-rose-900">حالت کارخانه (Reset)</div>
                          <div className="text-xs opacity-80 mt-0.5 text-rose-700">تست مجدد برنامه از اول</div>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 opacity-50 text-rose-600" />
                    </button>
                  )}
                </div>
              </div>

            </div>
            
            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <p className="text-[10px] text-slate-400 font-medium">امروز: {currentDateText}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

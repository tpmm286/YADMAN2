import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Lock,
  Download,
  X,
  Hourglass,
  Calendar,
  Monitor,
  Layers,
  Unlock,
} from 'lucide-react';
import {
  LicenseSystemInfo,
  validateLicenseKey,
  activateAppWithKey,
  deactivateAppLicense,
  detectCurrentPlatform,
  TRIAL_MAX_DAYS,
} from '../utils/licenseUtils';
import { toPersianDigits, formatPersianDate, formatPersianDateTime } from '../utils/dateUtils';

interface LicenseActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseInfo: LicenseSystemInfo;
  onRefreshLicense: () => void;
  onOpenBackupModal?: () => void;
  isBlocking?: boolean;
}

export const LicenseActivationModal: React.FC<LicenseActivationModalProps> = ({
  isOpen,
  onClose,
  licenseInfo,
  onRefreshLicense,
  onOpenBackupModal,
  isBlocking = false,
}) => {
  const [licenseInput, setLicenseInput] = useState('');
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error?: string;
    details?: any;
  } | null>(null);
  const [activationMessage, setActivationMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isReportCopied, setIsReportCopied] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // Live countdown timer ticking every 1 second when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const currentClientPlatform = detectCurrentPlatform();

  // Format and validate on typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^23456789ABCDEFGHJKLMNPQRSTUVWXYZ-]/g, '');

    // Auto dash insertion if typing without dashes
    const clean = val.replace(/-/g, '');
    if (clean.length > 4 && !val.includes('-')) {
      const parts = clean.match(/.{1,4}/g);
      if (parts) val = parts.join('-');
    }

    setLicenseInput(val);
    setActivationMessage(null);

    if (val.length >= 10) {
      const res = validateLicenseKey(val, {
        checkPlatform: true,
        checkActivationWindow: true,
      });
      setValidationResult({
        isValid: res.isValid,
        error: res.error,
        details: res.details,
      });
    } else {
      setValidationResult(null);
    }
  };

  const handlePasteKey = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const cleaned = text.trim().toUpperCase();
        setLicenseInput(cleaned);
        const res = validateLicenseKey(cleaned, {
          checkPlatform: true,
          checkActivationWindow: true,
        });
        setValidationResult({
          isValid: res.isValid,
          error: res.error,
          details: res.details,
        });
      }
    } catch (err) {
      console.error('Clipboard paste error', err);
    }
  };

  const handleActivate = () => {
    if (!licenseInput.trim()) return;
    const res = activateAppWithKey(licenseInput.trim());
    if (res.success) {
      setActivationMessage({ text: res.message, type: 'success' });
      onRefreshLicense();
      setTimeout(() => {
        if (!isBlocking) {
          onClose();
        }
      }, 1500);
    } else {
      setActivationMessage({ text: res.message, type: 'error' });
    }
  };

  const handleDeactivate = () => {
    if (window.confirm('آیا از غیرفعال‌سازی لایسنس فعلی و بازگشت به حالت آزمایشی اطمینان دارید؟')) {
      deactivateAppLicense();
      setLicenseInput('');
      setValidationResult(null);
      setActivationMessage({ text: 'لایسنس غیرفعال گردید.', type: 'error' });
      onRefreshLicense();
    }
  };

  // Exact remaining time and live countdown calculations
  const isLifetime = licenseInfo.isActivated && licenseInfo.licenseDetails?.duration === 'LIFETIME';
  const expiresTimestamp = licenseInfo.exactExpiresAt ? new Date(licenseInfo.exactExpiresAt).getTime() : null;
  const isLiveExpired = licenseInfo.isExpired || (expiresTimestamp !== null && currentTime >= expiresTimestamp);
  const remainingTotalMs = expiresTimestamp ? Math.max(0, expiresTimestamp - currentTime) : 0;

  const liveRemainingDays = Math.floor(remainingTotalMs / (24 * 3600 * 1000));
  const liveRemainingHours = Math.floor((remainingTotalMs % (24 * 3600 * 1000)) / (3600 * 1000));
  const liveRemainingMinutes = Math.floor((remainingTotalMs % (3600 * 1000)) / (60 * 1000));
  const liveRemainingSeconds = Math.floor((remainingTotalMs % (60 * 1000)) / 1000);

  const totalDurationDays = licenseInfo.totalDurationDays || (licenseInfo.isActivated ? (licenseInfo.licenseDetails?.durationDays || 365) : TRIAL_MAX_DAYS);

  let livePercentUsed = 0;
  if (!isLifetime && expiresTimestamp) {
    const startDateMs = new Date(
      licenseInfo.isActivated && licenseInfo.licenseDetails?.activatedAt
        ? licenseInfo.licenseDetails.activatedAt
        : licenseInfo.installDate
    ).getTime();
    const totalWindowMs = Math.max(1, expiresTimestamp - startDateMs);
    const elapsedWindowMs = Math.max(0, currentTime - startDateMs);
    livePercentUsed = Math.min(100, Math.max(0, Math.round((elapsedWindowMs / totalWindowMs) * 100)));
  }
  const livePercentRemaining = isLifetime ? 100 : Math.max(0, 100 - livePercentUsed);

  // Status & Urgency
  let currentUrgency: 'safe' | 'warning' | 'urgent' | 'expired' | 'lifetime' = 'safe';
  let urgencyBadgeText = 'وضعیت اعتبار: پایدار و مطلوب';

  if (isLifetime) {
    currentUrgency = 'lifetime';
    urgencyBadgeText = 'دسترسی دائمی و نامحدود (مادام‌العمر)';
  } else if (isLiveExpired) {
    currentUrgency = 'expired';
    urgencyBadgeText = 'اعتبار دسترسی به پایان رسیده است';
  } else if (licenseInfo.isActivated) {
    if (liveRemainingDays <= 7) {
      currentUrgency = 'urgent';
      urgencyBadgeText = `هشدار فوری: فقط ${toPersianDigits(liveRemainingDays)} روز تا پایان اعتبار!`;
    } else if (liveRemainingDays <= 30) {
      currentUrgency = 'warning';
      urgencyBadgeText = `توصیه به تمدید: ${toPersianDigits(liveRemainingDays)} روز اعتبار باقیمانده`;
    } else {
      currentUrgency = 'safe';
      urgencyBadgeText = `اعتبار پایدار و معتبر: ${toPersianDigits(liveRemainingDays)} روز مانده`;
    }
  } else {
    // Free Trial
    if (liveRemainingDays <= 1) {
      currentUrgency = 'urgent';
      urgencyBadgeText = 'هشدار: کمتر از ۲۴ ساعت تا پایان مهلت ۷ روزه رایگان';
    } else if (liveRemainingDays <= 3) {
      currentUrgency = 'warning';
      urgencyBadgeText = `مهلت آزمایشی رو به پایان: ${toPersianDigits(liveRemainingDays)} روز مانده`;
    } else {
      currentUrgency = 'safe';
      urgencyBadgeText = `دوره آزمایشی ۷ روزه رایگان فعال (${toPersianDigits(liveRemainingDays)} روز مانده)`;
    }
  }

  const handleCopyStatusReport = () => {
    const startDateText = formatPersianDateTime(
      licenseInfo.isActivated && licenseInfo.licenseDetails?.activatedAt
        ? licenseInfo.licenseDetails.activatedAt
        : licenseInfo.installDate
    );
    const expiryDateText = isLifetime
      ? 'مادام‌العمر (بدون محدودیت زمانی)'
      : licenseInfo.exactExpiresAt
      ? formatPersianDateTime(licenseInfo.exactExpiresAt)
      : '-';

    const lines = [
      '📋 شناسنامه و وضعیت اعتبار سیستم لایسنس یادم (YADAM):',
      `• وضعیت لحظه‌ای: ${urgencyBadgeText}`,
      `• نوع دسترسی: ${licenseInfo.isActivated ? (licenseInfo.licenseDetails?.tierLabel || 'حرفه‌ای') : 'دوره آزمایشی ۷ روزه رایگان'}`,
      `• مدت دوره اعتبار: ${licenseInfo.isActivated ? (licenseInfo.licenseDetails?.durationLabel || 'دائمی') : '۷ روز'}`,
      `• پلتفرم مجاز: ${licenseInfo.licenseDetails?.platformLabel || 'تمامی دستگاه‌ها (ویندوز، اندروید، وب، iOS)'}`,
      `• تاریخ و زمان شروع: ${startDateText}`,
      `• تاریخ و زمان دقیق انقضا: ${expiryDateText}`,
      `• باقیمانده اعتبار: ${
        isLifetime
          ? 'دائمی'
          : `${toPersianDigits(liveRemainingDays)} روز و ${toPersianDigits(liveRemainingHours)} ساعت و ${toPersianDigits(liveRemainingMinutes)} دقیقه`
      }`,
    ];
    if (licenseInfo.licenseDetails?.key) {
      lines.push(`• کلید ثبت‌شده: ${licenseInfo.licenseDetails.key}`);
    }
    navigator.clipboard.writeText(lines.join('\n'));
    setIsReportCopied(true);
    setTimeout(() => setIsReportCopied(false), 2500);
  };

  if (!isOpen) return null;

  // Calculate percentage of elapsed trial
  const trialPercent = Math.min(
    100,
    Math.round((licenseInfo.elapsedDays / licenseInfo.totalTrialDays) * 100)
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className={`p-4 sm:p-6 border-b flex items-center justify-between text-white ${
          licenseInfo.isActivated
            ? 'bg-gradient-to-r from-amber-600 via-amber-700 to-yellow-600 border-amber-500'
            : licenseInfo.status === 'LICENSE_EXPIRED'
            ? 'bg-gradient-to-r from-red-700 via-rose-800 to-pink-900 border-rose-600'
            : licenseInfo.isExpired
            ? 'bg-gradient-to-r from-rose-700 via-rose-800 to-red-900 border-rose-600'
            : 'bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 border-indigo-600'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              {licenseInfo.isActivated ? (
                <ShieldCheck className="w-6 h-6 text-yellow-300" />
              ) : licenseInfo.status === 'LICENSE_EXPIRED' ? (
                <AlertTriangle className="w-6 h-6 text-yellow-300" />
              ) : licenseInfo.isExpired ? (
                <Lock className="w-6 h-6 text-rose-200" />
              ) : (
                <KeyRound className="w-6 h-6 text-blue-200" />
              )}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                {licenseInfo.isActivated
                  ? 'لایسنس نرم‌افزار فعال است'
                  : licenseInfo.status === 'LICENSE_EXPIRED'
                  ? 'اتمام اعتبار لایسنس زمان‌دار'
                  : licenseInfo.isExpired
                  ? 'اتمام مهلت ۷ روزه رایگان - فعال‌سازی لایسنس'
                  : 'مدیریت لایسنس و دوره آزمایشی (۷ روزه)'}
              </h2>
              <p className="text-xs text-white/80 mt-0.5">
                {licenseInfo.isActivated && licenseInfo.licenseDetails
                  ? `${licenseInfo.licenseDetails.tierLabel} • ${licenseInfo.licenseDetails.durationLabel}`
                  : `نرم‌افزار مرور هوشمند ابینگهاوس (یادمان)`}
              </p>
            </div>
          </div>

          {/* Close button (allowed if not blocking) */}
          {!isBlocking && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="بستن"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Comprehensive Access Validity & Expiry Countdown Section */}
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-4 shadow-xs ${
                isLifetime
                  ? 'bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/70 border-amber-300 text-amber-950'
                  : isLiveExpired
                  ? 'bg-gradient-to-br from-rose-50 via-red-50 to-rose-100/80 border-2 border-rose-300 text-rose-950'
                  : currentUrgency === 'urgent'
                  ? 'bg-gradient-to-br from-rose-50/90 via-amber-50/60 to-orange-50/80 border-2 border-rose-300 text-rose-950'
                  : currentUrgency === 'warning'
                  ? 'bg-gradient-to-br from-amber-50/90 via-yellow-50/60 to-orange-50/70 border border-amber-300 text-amber-950'
                  : licenseInfo.isActivated
                  ? 'bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-50 border border-emerald-300 text-emerald-950'
                  : 'bg-gradient-to-br from-indigo-50/90 via-blue-50/50 to-indigo-100/40 border border-indigo-200 text-indigo-950'
              }`}>
                {/* Status Header */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {isLifetime ? (
                      <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
                    ) : isLiveExpired ? (
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    ) : licenseInfo.isActivated ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <Clock className="w-5 h-5 text-indigo-600 shrink-0" />
                    )}
                    <span className="font-extrabold text-sm sm:text-base">
                      {isLifetime
                        ? 'لایسنس دائمی فعال است'
                        : isLiveExpired
                        ? 'اعتبار دسترسی به پایان رسیده است'
                        : licenseInfo.isActivated
                        ? 'لایسنس زمان‌دار فعال و معتبر است'
                        : 'دوره آزمایشی ۷ روزه رایگان'}
                    </span>
                  </div>

                  {/* Urgency Pill Badge */}
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
                    isLifetime
                      ? 'bg-amber-200/80 text-amber-900 border-amber-300'
                      : isLiveExpired
                      ? 'bg-rose-200 text-rose-900 border-rose-400 animate-pulse'
                      : currentUrgency === 'urgent'
                      ? 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse'
                      : currentUrgency === 'warning'
                      ? 'bg-amber-200/80 text-amber-900 border-amber-300'
                      : licenseInfo.isActivated
                      ? 'bg-emerald-200/80 text-emerald-900 border-emerald-300'
                      : 'bg-indigo-200/80 text-indigo-900 border-indigo-300'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      isLifetime
                        ? 'bg-amber-600'
                        : isLiveExpired || currentUrgency === 'urgent'
                        ? 'bg-rose-600'
                        : currentUrgency === 'warning'
                        ? 'bg-amber-600'
                        : 'bg-emerald-600'
                    }`} />
                    <span>{urgencyBadgeText}</span>
                  </div>
                </div>

                {/* Expiration Notice if Expired */}
                {isLiveExpired && (
                  <div className="p-3.5 rounded-xl bg-white/90 border border-rose-200 text-rose-900 text-xs leading-relaxed space-y-1">
                    <p className="font-bold text-rose-950 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>
                        مهلت اعتبار دسترسی شما در تاریخ{' '}
                        <strong className="underline underline-offset-4">
                          {formatPersianDateTime(licenseInfo.exactExpiresAt)}
                        </strong>{' '}
                        به اتمام رسیده است.
                      </span>
                    </p>
                    <p className="text-rose-800 text-[11px]">
                      کلیه سوابق، فلش‌کارت‌ها و مرورهای شما کاملاً محفوظ هستند. جهت ادامه فرآیند ثبت و مرور، کلید لایسنس جدید خود را در کادر زیر وارد فرمایید.
                    </p>
                  </div>
                )}

                {/* Lifetime Banner */}
                {isLifetime && (
                  <div className="p-3.5 rounded-xl bg-white/80 border border-amber-200 text-xs text-amber-900 leading-relaxed flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-amber-950">دسترسی دائمی و نامحدود (Lifetime VIP)</div>
                      <div className="text-amber-800 text-[11px] mt-0.5">
                        این نسخه دارای مجوز مادام‌العمر است و هیچ‌گونه محدودیت زمانی یا تاریخ انقضایی برای استفاده وجود ندارد.
                      </div>
                    </div>
                  </div>
                )}

                {/* Live 4-Segment Countdown Boxes (Active time-bound or trial) */}
                {!isLifetime && !isLiveExpired && (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Hourglass className="w-4 h-4 text-blue-600" />
                        <span>شمارش معکوس دقیق زمان باقیمانده تا انقضا:</span>
                      </span>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                        <span>محاسبه لحظه‌ای (ثانیه‌شمار زنده)</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="bg-white/95 p-2 sm:p-2.5 rounded-2xl shadow-xs border border-slate-200/90">
                        <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-tight">
                          {toPersianDigits(liveRemainingDays)}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">روز باقیمانده</div>
                      </div>

                      <div className="bg-white/95 p-2 sm:p-2.5 rounded-2xl shadow-xs border border-slate-200/90">
                        <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-tight">
                          {toPersianDigits(String(liveRemainingHours).padStart(2, '0'))}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">ساعت</div>
                      </div>

                      <div className="bg-white/95 p-2 sm:p-2.5 rounded-2xl shadow-xs border border-slate-200/90">
                        <div className="text-xl sm:text-2xl font-black font-mono text-slate-800 tracking-tight">
                          {toPersianDigits(String(liveRemainingMinutes).padStart(2, '0'))}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">دقیقه</div>
                      </div>

                      <div className="bg-white/95 p-2 sm:p-2.5 rounded-2xl shadow-xs border border-blue-200 bg-blue-50/30">
                        <div className="text-xl sm:text-2xl font-black font-mono text-blue-600 tracking-tight">
                          {toPersianDigits(String(liveRemainingSeconds).padStart(2, '0'))}
                        </div>
                        <div className="text-[10px] sm:text-xs font-bold text-blue-600 mt-0.5">ثانیه</div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[11px] font-semibold text-slate-700">
                        <span>مصرف اعتبارزمانی ({toPersianDigits(livePercentUsed)}٪ سپری شده)</span>
                        <span className="text-blue-700 font-bold">
                          {toPersianDigits(livePercentRemaining)}٪ مانده ({toPersianDigits(liveRemainingDays)} روز از {toPersianDigits(totalDurationDays)} روز)
                        </span>
                      </div>
                      <div className="w-full h-3 bg-white/90 rounded-full overflow-hidden border border-slate-200/80 p-0.5 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            currentUrgency === 'urgent'
                              ? 'bg-gradient-to-l from-rose-600 via-red-500 to-amber-500'
                              : currentUrgency === 'warning'
                              ? 'bg-gradient-to-l from-amber-500 via-yellow-500 to-emerald-500'
                              : 'bg-gradient-to-l from-emerald-500 via-teal-500 to-blue-500'
                          }`}
                          style={{ width: `${Math.max(2, livePercentRemaining)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Timetable & Specification Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-white/90 p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">تاریخ شروع دسترسی:</span>
                      <strong className="text-slate-900 font-bold">
                        {formatPersianDateTime(
                          licenseInfo.isActivated && licenseInfo.licenseDetails?.activatedAt
                            ? licenseInfo.licenseDetails.activatedAt
                            : licenseInfo.installDate
                        )}
                      </strong>
                    </div>
                  </div>

                  <div className={`flex items-start gap-2 p-1.5 rounded-lg ${
                    isLiveExpired
                      ? 'bg-rose-50 text-rose-950 border border-rose-200'
                      : currentUrgency === 'urgent'
                      ? 'bg-rose-50/80 text-rose-900 border border-rose-200'
                      : 'bg-blue-50/60 text-blue-950 border border-blue-100'
                  }`}>
                    <Clock className={`w-4 h-4 shrink-0 mt-0.5 ${
                      isLiveExpired ? 'text-rose-600' : 'text-blue-600'
                    }`} />
                    <div>
                      <span className="text-slate-500 block text-[11px]">تاریخ و ساعت دقیق انقضا:</span>
                      <strong className="font-extrabold">
                        {isLifetime
                          ? 'مادام‌العمر (بدون پایان)'
                          : licenseInfo.exactExpiresAt
                          ? formatPersianDateTime(licenseInfo.exactExpiresAt)
                          : '-'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Monitor className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">پلتفرم مجاز:</span>
                      <strong className="text-slate-900 font-bold">
                        {licenseInfo.licenseDetails?.platformLabel || 'تمامی دستگاه‌ها (ویندوز، اندروید، وب، iOS)'}
                      </strong>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Layers className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 block text-[11px]">نسخه و مدت دوره:</span>
                      <strong className="text-slate-900 font-bold">
                        {licenseInfo.isActivated
                          ? `${licenseInfo.licenseDetails?.tierLabel} (${licenseInfo.licenseDetails?.durationLabel})`
                          : `دوره آزمایشی رایگان (${toPersianDigits(TRIAL_MAX_DAYS)} روزه)`}
                      </strong>
                    </div>
                  </div>

                  {/* Registered License Key row if activated */}
                  {licenseInfo.licenseDetails?.key && (
                    <div className="sm:col-span-2 pt-2 mt-1 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500">کلید لایسنس فعال روی این سامانه:</span>
                      <code className="font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-300 text-slate-800 font-bold text-xs select-all" dir="ltr">
                        {licenseInfo.licenseDetails.key}
                      </code>
                    </div>
                  )}
                </div>

                {/* Status Toolbar Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                  <button
                    type="button"
                    onClick={handleCopyStatusReport}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 transition-all shadow-2xs cursor-pointer"
                  >
                    {isReportCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">شناسنامه کپی شد!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>کپی شناسنامه و وضعیت لایسنس</span>
                      </>
                    )}
                  </button>

                  {onOpenBackupModal && (
                    <button
                      type="button"
                      onClick={onOpenBackupModal}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200 transition-all shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>پشتیبان‌گیری از داده‌ها</span>
                    </button>
                  )}
                </div>
              </div>

              {/* License Input Form */}
              <div className="space-y-3 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-blue-600" />
                    <span>کد کلید لایسنس (License Key):</span>
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteKey}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>جای‌گذاری از کلیپ‌بورد</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    value={licenseInput}
                    onChange={handleInputChange}
                    placeholder="مثال: YADM-PAY3-XXXX-XXXX-XXXX"
                    className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl font-mono text-center text-sm sm:text-base font-bold tracking-widest text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 uppercase shadow-inner"
                    dir="ltr"
                  />
                </div>

                {/* Validation Indicator & Live Info */}
                {validationResult && (
                  <div className={`p-3 rounded-xl text-xs space-y-2 ${
                    validationResult.isValid
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {validationResult.isValid && validationResult.details ? (
                      <>
                        <div className="flex items-center gap-2 font-bold text-emerald-800">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>کلید معتبر است و آماده فعال‌سازی می‌باشد:</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] text-emerald-900 pr-6">
                          <div>نوع: <strong>{validationResult.details.tierLabel}</strong></div>
                          <div>اعتبار: <strong>{validationResult.details.durationLabel}</strong></div>
                          <div>مهلت وارد کردن: <strong>{validationResult.details.activationWindowLabel}</strong></div>
                          <div>پلتفرم: <strong>{validationResult.details.platformLabel}</strong></div>
                          <div className="col-span-2 text-emerald-700">
                            تاریخ صدور: {formatPersianDate(validationResult.details.issueDate)}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>{validationResult.error}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Activation Message Toast */}
                {activationMessage && (
                  <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    activationMessage.type === 'success'
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'bg-rose-100 text-rose-900 border border-rose-300'
                  }`}>
                    {activationMessage.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
                    )}
                    <span>{activationMessage.text}</span>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleActivate}
                    disabled={!licenseInput.trim()}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>فعال‌سازی نرم‌افزار با این کلید</span>
                  </button>

                  {licenseInfo.isActivated && (
                    <button
                      type="button"
                      onClick={handleDeactivate}
                      className="px-3 py-3 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                      title="غیرفعال کردن لایسنس فعلی"
                    >
                      غیرفعال‌سازی
                    </button>
                  )}
                </div>
              </div>

              {/* Data Safeguard / Backup Notice */}
              <div className="flex items-center justify-between p-3.5 bg-slate-100/70 border border-slate-200 rounded-2xl text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>داده‌های شما همیشه ایمن هستند:</span>
                </div>
                {onOpenBackupModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenBackupModal();
                    }}
                    className="font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    دانلود بکاپ JSON از مطالب
                  </button>
                )}
              </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>سیستم فعال‌سازی زمان‌دار نسخه ۳ یادمان</span>
          </div>

          {!isBlocking && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 transition-colors cursor-pointer"
            >
              بستن
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

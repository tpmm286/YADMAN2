import React, { useState } from 'react';
import {
  RotateCcw,
  X,
  AlertTriangle,
  Sparkles,
  Trash2,
  Calendar,
  Download,
  CheckCircle2,
  Layers,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { TopicItem, StudentLesson } from '../types';
import { toPersianDigits } from '../utils/dateUtils';
import { FullAppData } from './BackupModal';
import { exportFile } from '../utils/fileExportUtils';

interface FactoryResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResetToPreset: () => void;
  onResetToCleanSlate: () => void;
  onResetScheduleOnly: () => void;
  data: FullAppData;
}

type ResetType = 'preset' | 'clean' | 'schedule';

export const FactoryResetModal: React.FC<FactoryResetModalProps> = ({
  isOpen,
  onClose,
  onResetToPreset,
  onResetToCleanSlate,
  onResetScheduleOnly,
  data,
}) => {
  const { topics, studentLessons: lessons } = data;
  const [selectedType, setSelectedType] = useState<ResetType>('preset');
  const [confirmStep, setConfirmStep] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleDownloadBackup = async () => {
    try {
      const backupData = {
        app: 'Ebbinghaus Spaced Repetition',
        version: 2,
        exportedAt: new Date().toISOString(),
        ...data
      };

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
        now.getDate()
      ).padStart(2, '0')}`;
      const fileName = `ebbinghaus-pre-reset-backup-${dateStr}.json`;

      await exportFile({
        fileName,
        blob,
        mimeType: 'application/json',
        shareTitle: 'پشتیبان اضطراری یادمان',
        shareText: 'نسخه پشتیبان اطلاعات قبل از بازنشانی',
      });
    } catch (e) {
      console.error('Backup error before reset', e);
    }
  };

  const handleExecuteReset = () => {
    if (selectedType === 'preset') {
      onResetToPreset();
      setSuccessMessage('برنامه با موفقیت به تنظیمات اولیه کارخانه (پیش‌فرض تجربی) بازنشانی شد.');
    } else if (selectedType === 'clean') {
      onResetToCleanSlate();
      setSuccessMessage('کلیه اطلاعات پاک‌سازی شد. اکنون می‌توانید برنامه شخصی خود را از صفر بچینید.');
    } else if (selectedType === 'schedule') {
      onResetScheduleOnly();
      setSuccessMessage('جدول زمان‌بندی و پارت‌های هفتگی با موفقیت مجدداً بازچینی و محاسبه شد.');
    }

    setIsDone(true);
    setTimeout(() => {
      setIsDone(false);
      setConfirmStep(false);
      onClose();
    }, 1200);
  };

  return (
    <div
      id="factory-reset-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isDone) onClose();
      }}
      dir="rtl"
    >
      <div
        id="factory-reset-modal"
        className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-200/60 flex items-center justify-center shadow-xs">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                بازنشانی به حالت کارخانه (شروع از اول)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                امتحان قابلیت‌ها و بازچینی سریع کل برنامه درسی و مرورها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDone}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDone ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center animate-bounce shadow-xs">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">بازنشانی با موفقیت انجام شد!</h3>
            <p className="text-xs text-slate-600">{successMessage}</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Warning & Backup Option */}
            <div className="p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-2xl text-xs text-amber-950 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">
                    می‌توانید پیش از بازنشانی، یک فایل پشتیبان (Backup) ذخیره کنید:
                  </p>
                  <p className="text-[11px] text-amber-900/80">
                    تعداد مطالب فعلی: {toPersianDigits(topics.length)} مبحث | تعداد دروس مدرسه: {toPersianDigits(lessons.length)} زنگ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-amber-100/60 border border-amber-300 rounded-xl text-[11px] font-bold text-amber-800 transition-colors shadow-2xs"
                title="دانلود فایل پشتیبان جیسون"
              >
                <Download className="w-3.5 h-3.5" />
                <span>دانلود بکاپ</span>
              </button>
            </div>

            {/* Selection Options */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold text-slate-700">
                نوع بازنشانی مورد نظر خود را انتخاب کنید:
              </label>

              {/* Option 1: Preset Default */}
              <label
                onClick={() => {
                  setSelectedType('preset');
                  setConfirmStep(false);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedType === 'preset'
                    ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="resetType"
                  checked={selectedType === 'preset'}
                  onChange={() => setSelectedType('preset')}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      ۱. بازنشانی کامل به حالت پیش‌فرض کارخانه (پیشنهادی)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      شروع سریع
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    بارگذاری مجدد برنامه هفتگی نمونه (رشته تجربی)، ساعات روتین استاندارد و ۴ مبحث درسی آماده جهت آزمایش تمام مراحل مرور ابینگهاوس.
                  </p>
                </div>
              </label>

              {/* Option 2: Clean Slate (Zero Data) */}
              <label
                onClick={() => {
                  setSelectedType('clean');
                  setConfirmStep(false);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedType === 'clean'
                    ? 'bg-rose-50/80 border-rose-400 ring-2 ring-rose-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="resetType"
                  checked={selectedType === 'clean'}
                  onChange={() => setSelectedType('clean')}
                  className="mt-1 text-rose-600 focus:ring-rose-500"
                />
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      ۲. پاک‌سازی کامل کلیه داده‌ها (شروع از صفر و جدول سفید)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold">
                      شخصی‌سازی خالص
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    حذف تمام مطالب آزمایشی، دروس، پارت‌ها و نمرات برای ورود دستی و صفر تا صدی دروس، مشغله‌ها و برنامه اختصاصی شما.
                  </p>
                </div>
              </label>

              {/* Option 3: Reset Schedule Only */}
              <label
                onClick={() => {
                  setSelectedType('schedule');
                  setConfirmStep(false);
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                  selectedType === 'schedule'
                    ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="resetType"
                  checked={selectedType === 'schedule'}
                  onChange={() => setSelectedType('schedule')}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                <div className="space-y-1 text-xs flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      ۳. بازچینی مجدد جدول زمان‌بندی و پارت‌های مطالعه
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                      حفظ مطالب
                    </span>
                  </div>
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    کلیه مباحث و زنگ‌های کلاسی شما باقی می‌مانند؛ فقط جدول ساعات مطالعه عصر، پارت‌های مرور و تثبیت از اول تمیز محاسبه می‌شوند.
                  </p>
                </div>
              </label>
            </div>

            {/* Confirmation & Action Buttons */}
            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                انصراف و بستن
              </button>

              {!confirmStep ? (
                <button
                  type="button"
                  onClick={() => setConfirmStep(true)}
                  className={`w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-xs ${
                    selectedType === 'clean'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : selectedType === 'preset'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  ادامه و بازنشانی...
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleExecuteReset}
                  className="w-full sm:w-auto px-6 py-2.5 text-xs font-extrabold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md animate-pulse"
                >
                  بله، مطمئنم — اکنون بازنشانی کن
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

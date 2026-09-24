import React, { useState, useRef } from 'react';
import {
  Download,
  Upload,
  X,
  FileJson,
  CheckCircle2,
  AlertCircle,
  FileDown,
  HardDrive,
  RefreshCw,
  Copy,
  Check,
  ClipboardPaste,
} from 'lucide-react';
import { TopicItem, BusySlot, StudentLesson, StudentRoutineConfig, GeneratedStudyBlock, StudentScore, ThemeMode } from '../types';
import { toPersianDigits, formatPersianDateTime } from '../utils/dateUtils';
import { exportFile, copyTextToClipboard } from '../utils/fileExportUtils';

export interface FullAppData {
  topics: TopicItem[];
  busySlots: BusySlot[];
  autoShiftEnabled: boolean;
  studentLessons: StudentLesson[];
  isStudentModeActive: boolean;
  studentRoutine: StudentRoutineConfig;
  generatedStudyBlocks: GeneratedStudyBlock[];
  studentScores: StudentScore[];
  autoAddToTodayEnabled: boolean;
  theme: ThemeMode;
  licenseKey?: string | null;
}

interface BackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FullAppData;
  onRestoreAll: (restoredData: FullAppData) => void;
}

export const BackupModal: React.FC<BackupModalProps> = ({
  isOpen,
  onClose,
  data,
  onRestoreAll,
}) => {
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [showPasteSection, setShowPasteSection] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handler to export and download JSON
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
      const fileName = `ebbinghaus-backup-${dateStr}.json`;

      const result = await exportFile({
        fileName,
        blob,
        mimeType: 'application/json',
        shareTitle: 'فایل پشتیبان یادمان',
        shareText: 'نسخه پشتیبان کامل اطلاعات برنامه یادمان',
      });

      if (result.success) {
        setExportMessage('فایل پشتیبان با موفقیت صادر / ذخیره شد.');
        setTimeout(() => setExportMessage(''), 4000);
      }
    } catch (e) {
      console.error('Download backup error', e);
      setExportMessage('خطا در ذخیره فایل. از گزینه کپی متن استفاده کنید.');
    }
  };

  // Copy JSON backup directly to clipboard
  const handleCopyBackup = async () => {
    try {
      const backupData = {
        app: 'Ebbinghaus Spaced Repetition',
        version: 2,
        exportedAt: new Date().toISOString(),
        ...data
      };
      const jsonString = JSON.stringify(backupData, null, 2);
      const success = await copyTextToClipboard(jsonString);
      if (success) {
        setCopiedBackup(true);
        setTimeout(() => setCopiedBackup(false), 3000);
      }
    } catch (err) {
      console.error('Copy backup error', err);
    }
  };

  // Restore directly from pasted text
  const handleRestoreFromPaste = () => {
    try {
      if (!pasteText.trim()) return;
      const parsed = JSON.parse(pasteText.trim());
      if (parsed && typeof parsed === 'object') {
        if (parsed.version === 2 || (parsed.topics && parsed.studentLessons)) {
          onRestoreAll(parsed as FullAppData);
          setImportStatus('success');
          setPasteText('');
          setShowPasteSection(false);
          return;
        }
        if (Array.isArray(parsed.topics)) {
          const legacyAdapted: FullAppData = {
            ...data,
            topics: parsed.topics,
            busySlots: parsed.busySlots || data.busySlots,
            autoShiftEnabled: parsed.autoShiftEnabled ?? data.autoShiftEnabled,
          };
          onRestoreAll(legacyAdapted);
          setImportStatus('success');
          setPasteText('');
          setShowPasteSection(false);
          return;
        }
      }
      setErrorMessage('فرمت متن معتبر نیست.');
      setImportStatus('error');
    } catch {
      setErrorMessage('متن وارد شده ساختار معتبر JSON ندارد.');
      setImportStatus('error');
    }
  };

  // Handler to read and import JSON backup file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Check if structure matches
        if (parsed && typeof parsed === 'object') {
          // Robust checking for full backup v2
          if (parsed.version === 2 || (parsed.topics && parsed.studentLessons)) {
            onRestoreAll(parsed as FullAppData);
            setImportedCount(parsed.topics?.length || 0);
          } else if (Array.isArray(parsed)) {
            // Support legacy array-only format
            onRestoreAll({ ...data, topics: parsed });
            setImportedCount(parsed.length);
          } else if (parsed.topics && Array.isArray(parsed.topics)) {
            // Support legacy v1 object format
            onRestoreAll({ ...data, topics: parsed.topics });
            setImportedCount(parsed.topics.length);
          } else {
            throw new Error('ساختار فایل JSON معتبر نیست.');
          }
        } else {
          throw new Error('فایل پشتیبان معتبر یافت نشد.');
        }

        setImportStatus('success');
        setErrorMessage('');
      } catch (err: any) {
        setImportStatus('error');
        setErrorMessage(err.message || 'خطا در باز کردن فایل JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="backup-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="backup-modal"
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">پشتیبان‌گیری و ذخیره اطلاعات</h2>
              <p className="text-xs text-slate-500">
                دریافت خروجی JSON از تمامی مطالب و سابقه مرورها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          {/* Download Backup Section */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/80 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <FileDown className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  دانلود فایل پشتیبان کامل (Full Backup JSON)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  تمامی مطالب ({toPersianDigits(data.topics.length)} مورد)، تنظیمات روتین دانش‌آموزی، دروس هفتگی، مشغله‌ها، نمرات و سوابق مرور در یک فایل واحد ذخیره می‌شود. این فایل شامل تمامی پیکربندی‌های فعلی شماست.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                onClick={handleDownloadBackup}
                id="download-backup-json-btn"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs shadow-blue-600/30 transition-all active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>دانلود / ذخیره در گوشی (JSON)</span>
              </button>

              <button
                onClick={handleCopyBackup}
                type="button"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-98"
                title="کپی متن پشتیبان"
              >
                {copiedBackup ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>کپی متن پشتیبان</span>
                  </>
                )}
              </button>
            </div>

            {exportMessage && (
              <div className="text-xs text-blue-800 bg-blue-100/70 p-2 rounded-lg font-medium text-center">
                {exportMessage}
              </div>
            )}
          </div>

          {/* Import / Restore Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-900">
                  بازیابی از فایل پشتیبان (Import)
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  فایل پشتیبان را از حافظه انتخاب کنید یا متن آن را مستقیماً جای‌گذاری فرمایید.
                </p>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium transition-colors"
              >
                <FileJson className="w-4 h-4 text-blue-600" />
                <span>انتخاب فایل JSON پشتیبان...</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPasteSection(!showPasteSection)}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium transition-colors"
              >
                <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                <span>ورود دستی متن</span>
              </button>
            </div>

            {/* Collapsible Direct Paste Area */}
            {showPasteSection && (
              <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in">
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="متن JSON پشتیبان را در اینجا جای‌گذاری (Paste) کنید..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={handleRestoreFromPaste}
                  disabled={!pasteText.trim()}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
                >
                  بازیابی از متن بالا
                </button>
              </div>
            )}

            {/* Status Feedback */}
            {importStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  تمامی اطلاعات و تنظیمات با موفقیت از فایل پشتیبان بازیابی شد.
                </span>
              </div>
            )}

            {importStatus === 'error' && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

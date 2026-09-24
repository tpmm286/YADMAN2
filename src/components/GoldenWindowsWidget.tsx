import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Plus,
  Zap,
  Brain,
  CheckCircle,
  Flame,
  Calendar,
  ChevronDown,
  ChevronUp,
  Coffee,
  Eye,
  Heart,
  BatteryCharging,
  Smile,
} from 'lucide-react';
import {
  GoldenFreeWindow,
  StudentLesson,
  TopicItem,
  GeneratedStudyBlock,
  StudyBlockCategory,
  SmartShortRestSuggestion,
} from '../types';
import { toPersianDigits } from '../utils/dateUtils';

interface GoldenWindowsWidgetProps {
  goldenWindows: GoldenFreeWindow[];
  shortRestSuggestions?: SmartShortRestSuggestion[];
  topics: TopicItem[];
  lessons: StudentLesson[];
  onAddBlockInWindow: (block: Omit<GeneratedStudyBlock, 'id'>) => void;
  onAutoAssignEbbinghausToWindow?: (window: GoldenFreeWindow) => void;
}

export const GoldenWindowsWidget: React.FC<GoldenWindowsWidgetProps> = ({
  goldenWindows,
  shortRestSuggestions = [],
  topics,
  lessons,
  onAddBlockInWindow,
  onAutoAssignEbbinghausToWindow,
}) => {
  const [selectedWindow, setSelectedWindow] = useState<GoldenFreeWindow | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<StudyBlockCategory>('free_study');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<string | null>(null);

  // Collapsible toggle states (Default to false/collapsed to avoid desk clutter as requested by user)
  const [isGoldenExpanded, setIsGoldenExpanded] = useState<boolean>(false);
  const [isRestExpanded, setIsRestExpanded] = useState<boolean>(false);

  // Top 4 windows
  const topWindows = goldenWindows.slice(0, 4);
  const topRests = shortRestSuggestions.slice(0, 4);

  const handleOpenReserveModal = (window: GoldenFreeWindow) => {
    setSelectedWindow(window);
    setCustomTitle(window.title.replace('🌟 ', '').replace('🧠 ', '').replace('⚡ ', ''));
    if (lessons.length > 0) {
      setSelectedSubject(lessons[0].subject);
    }
  };

  const handleConfirmReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWindow) return;

    const titleToUse = customTitle.trim() || selectedWindow.title;
    const newBlock: Omit<GeneratedStudyBlock, 'id'> = {
      dayOfWeek: selectedWindow.dayOfWeek,
      startTime: selectedWindow.startTime,
      endTime: selectedWindow.endTime,
      title: titleToUse,
      category: selectedCategory,
      relatedSubject: selectedSubject || undefined,
      lessonSubject: selectedSubject || undefined,
      difficulty: 'hard',
      isCompleted: false,
      notes: `پارت رزروشده در بازه طلایی (${selectedWindow.durationMinutes} دقیقه یکپارچه)`,
    };

    onAddBlockInWindow(newBlock);
    setIsSuccess(`پارت «${titleToUse}» در روز ${selectedWindow.dayName} ساعت ${toPersianDigits(selectedWindow.startTime)} ثبت شد.`);
    setSelectedWindow(null);
    setTimeout(() => setIsSuccess(null), 3500);
  };

  const getRestIcon = (iconType: SmartShortRestSuggestion['iconType']) => {
    switch (iconType) {
      case 'battery':
        return <BatteryCharging className="w-4 h-4 text-emerald-600" />;
      case 'eye':
        return <Eye className="w-4 h-4 text-sky-600" />;
      case 'heart':
        return <Heart className="w-4 h-4 text-rose-600" />;
      case 'coffee':
      default:
        return <Coffee className="w-4 h-4 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-3" dir="rtl">
      {/* SUCCESS BANNER */}
      {isSuccess && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{isSuccess}</span>
        </div>
      )}

      {/* 1. GOLDEN STUDY WINDOWS (COLLAPSIBLE) */}
      <div className="bg-gradient-to-br from-indigo-900/5 via-purple-900/5 to-white rounded-3xl border border-indigo-200/80 shadow-2xs transition-all overflow-hidden">
        {/* Header Bar */}
        <div
          onClick={() => setIsGoldenExpanded((prev) => !prev)}
          className="p-3.5 sm:p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-indigo-50/40 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Flame className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  پیشنهاد هوشمند بازه‌های طلایی مطالعه (Deep Work & Review)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                  {toPersianDigits(topWindows.length)} بازه
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isGoldenExpanded
                  ? 'شناسایی خودکار بازه‌های زمانی یکپارچه بدون تداخل برای یادگیری عمیق'
                  : 'برای مشاهده بازه‌های طلایی پیشنهادی مطالعه کلیک کنید (قابل باز و بسته شدن)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200 shrink-0"
          >
            <span>{isGoldenExpanded ? 'بستن' : 'مشاهده'}</span>
            {isGoldenExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Content Body */}
        {isGoldenExpanded && (
          <div className="p-4 pt-0 border-t border-indigo-100/60 space-y-3 animate-in fade-in duration-200">
            {topWindows.length === 0 ? (
              <div className="p-3 mt-3 bg-slate-50 rounded-2xl text-xs text-slate-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>برنامه هفتگی شما پر است. برای ایجاد بازه طلایی جدید، می‌توانید ساعات مشغله غیرضروری را ویرایش کنید.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {topWindows.map((win) => (
                  <div
                    key={win.id}
                    className="p-3.5 bg-white rounded-2xl border border-indigo-100 hover:border-indigo-300 shadow-2xs flex flex-col justify-between transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-xl bg-indigo-50 text-indigo-800 text-xs font-bold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>روز {win.dayName}</span>
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 text-[10px] font-bold flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-600" />
                          <span>تمرکز: {toPersianDigits(win.qualityScore)}٪</span>
                        </span>
                      </div>

                      <div>
                        <h5 className="text-xs font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                          {win.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{win.reason}</p>
                      </div>

                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-slate-700 bg-slate-50 p-2 rounded-xl">
                        <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>
                          ساعت {toPersianDigits(win.startTime)} تا {toPersianDigits(win.endTime)}
                        </span>
                        <span className="text-indigo-600 text-[11px] font-sans font-semibold mr-auto">
                          ({toPersianDigits(Math.floor(win.durationMinutes / 60))}س{win.durationMinutes % 60 > 0 ? ` و ${toPersianDigits(win.durationMinutes % 60)}د` : ''})
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 mt-1 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenReserveModal(win)}
                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>رزرو پارت مطالعه در این بازه</span>
                      </button>

                      {onAutoAssignEbbinghausToWindow && topics.length > 0 && (
                        <button
                          type="button"
                          onClick={() => onAutoAssignEbbinghausToWindow(win)}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-xl border border-purple-200 transition-all shrink-0"
                          title="تخصیص خودکار مرورهای ابینگهاوس آماده"
                        >
                          <Brain className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. SMART SHORT REST SUGGESTIONS (COLLAPSIBLE) */}
      <div className="bg-gradient-to-br from-emerald-900/5 via-teal-900/5 to-white rounded-3xl border border-emerald-200/80 shadow-2xs transition-all overflow-hidden">
        {/* Header Bar */}
        <div
          onClick={() => setIsRestExpanded((prev) => !prev)}
          className="p-3.5 sm:p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-emerald-50/40 transition-colors select-none"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <Coffee className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  پیشنهاد هوشمند استراحت‌های کوتاه و بازیابی توان ذهنی (Micro-Breaks)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {toPersianDigits(topRests.length)} زمان استراحت
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {isRestExpanded
                  ? 'پیشنهاد بهترین زمان‌ها برای چُرت کوتاه‌مدت، تکنیک ۲۰-۲۰-۲۰ چشمی و هیدراتاسیون'
                  : 'برای مشاهده زمان‌های پیشنهادی استراحت کوتاه جهت جلوگیری از خستگی کلیک کنید'}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all border border-emerald-200 shrink-0"
          >
            <span>{isRestExpanded ? 'بستن' : 'مشاهده'}</span>
            {isRestExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Collapsible Content Body */}
        {isRestExpanded && (
          <div className="p-4 pt-0 border-t border-emerald-100/60 space-y-3 animate-in fade-in duration-200">
            {topRests.length === 0 ? (
              <div className="p-3 mt-3 bg-slate-50 rounded-2xl text-xs text-slate-600 flex items-center gap-2">
                <Smile className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>برنامه شما توازن مناسبی دارد و فواصل استراحت به‌خوبی توزیع شده‌اند.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                {topRests.map((rest) => (
                  <div
                    key={rest.id}
                    className="p-3.5 bg-white rounded-2xl border border-emerald-100/90 shadow-2xs flex flex-col justify-between transition-all space-y-2"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>روز {rest.dayName}</span>
                        </span>
                        <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-lg font-mono text-[11px] font-bold text-slate-700">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          <span>
                            {toPersianDigits(rest.startTime)} تا {toPersianDigits(rest.endTime)}
                          </span>
                          <span className="text-emerald-700 font-sans font-semibold">
                            ({toPersianDigits(rest.durationMinutes)} دقیقه)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 pt-1">
                        <div className="p-1.5 rounded-lg bg-emerald-50 shrink-0 mt-0.5">
                          {getRestIcon(rest.iconType)}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-800">{rest.title}</h5>
                          <p className="text-[11px] text-emerald-800 font-medium mt-0.5 leading-snug">
                            💡 {rest.benefit}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-[10px] text-slate-600 leading-relaxed">
                      📌 <span className="font-semibold text-slate-700">توصیه شناختی:</span> {rest.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Reserve Modal for Golden Windows */}
      {selectedWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">رزرو مطالعه در بازه طلایی</h4>
                  <p className="text-xs text-slate-500">
                    روز {selectedWindow.dayName} ساعت {toPersianDigits(selectedWindow.startTime)} تا {toPersianDigits(selectedWindow.endTime)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWindow(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReservation} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">عنوان پارت مطالعه:</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  placeholder="مثلاً: حل تست جامع فیزیک / مرور ابینگهاوس زیست..."
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">درس مربوطه (اختیاری):</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="">بدون درس خاص (عمومی)</option>
                  {Array.from(new Set(lessons.map((l) => l.subject))).map((subj) => (
                    <option key={subj} value={subj}>
                      {subj}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">نوع و دسته‌بندی پارت:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as StudyBlockCategory)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="free_study">یادگیری عمیق و حل تست (Deep Work)</option>
                  <option value="ebbinghaus_review">مرور فعال ابینگهاوس</option>
                  <option value="same_day_consolidation">تثبیت درس مدرسه</option>
                  <option value="prep_tomorrow">پیش‌خوانی و تکالیف فردا</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedWindow(null)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  ثبت پارت مطالعه
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

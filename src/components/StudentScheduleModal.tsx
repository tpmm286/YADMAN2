import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Sparkles,
  Calendar,
  Clock,
  Plus,
  Trash2,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Zap,
  X,
  Info,
  Sliders,
  TrendingUp,
  Brain,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
  Moon,
  Sun,
  Coffee,
  CheckSquare,
  Square,
  Activity,
  Award,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
} from 'lucide-react';
import {
  StudentLesson,
  TopicItem,
  LessonDifficulty,
  LessonType,
  BusySlot,
  StudentRoutineConfig,
  GeneratedStudyBlock,
  StudyBlockCategory,
} from '../types';
import { PERSIAN_WEEK_DAYS, toPersianDigits, formatMinutesToTimeStr } from '../utils/dateUtils';
import {
  STUDENT_PRESETS,
  DEFAULT_STUDENT_ROUTINE,
  analyzeStudentSchedule,
  generateSmartStudyPlan,
  calculateSleepDuration,
  parseTimeStrToMinutes,
} from '../utils/studentAnalysisUtils';
import { WeeklyCognitiveHeatmap } from './WeeklyCognitiveHeatmap';

interface StudentScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessons: StudentLesson[];
  onSaveLessons: (lessons: StudentLesson[]) => void;
  isStudentModeActive: boolean;
  onToggleStudentMode: (active: boolean) => void;
  topics: TopicItem[];
  busySlots: BusySlot[];
  onSyncWithBusySlots?: (newSlots: BusySlot[]) => void;
  routine: StudentRoutineConfig;
  onSaveRoutine: (routine: StudentRoutineConfig) => void;
  studyBlocks: GeneratedStudyBlock[];
  onSaveStudyBlocks: (blocks: GeneratedStudyBlock[]) => void;
  onToggleBlockCompletion: (blockId: string) => void;
  onAutoPopulateTopics?: (lessonsToUse?: StudentLesson[]) => void;
  onOpenPdfExportModal?: () => void;
}

export const StudentScheduleModal: React.FC<StudentScheduleModalProps> = ({
  isOpen,
  onClose,
  lessons,
  onSaveLessons,
  isStudentModeActive,
  onToggleStudentMode,
  topics,
  busySlots,
  onSyncWithBusySlots,
  routine,
  onSaveRoutine,
  studyBlocks,
  onSaveStudyBlocks,
  onToggleBlockCompletion,
  onAutoPopulateTopics,
  onOpenPdfExportModal,
}) => {
  // Navigation tabs: 'routine' | 'school' | 'generated_plan' | 'analysis'
  const [activeTab, setActiveTab] = useState<'routine' | 'school' | 'generated_plan' | 'analysis'>('generated_plan');
  const [selectedDayTab, setSelectedDayTab] = useState<number>(6); // Default Saturday (شنبه)

  // Temporary state for editing routine
  const [tempRoutine, setTempRoutine] = useState<StudentRoutineConfig>(routine);

  // Add Lesson Form State
  const [subject, setSubject] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<number>(6);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:30');
  const [difficulty, setDifficulty] = useState<LessonDifficulty>('medium');
  const [lessonType, setLessonType] = useState<LessonType>('school_class');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [copySuccessMsg, setCopySuccessMsg] = useState<string | null>(null);

  // Manual Add Custom Block state
  const [isAddingCustomBlock, setIsAddingCustomBlock] = useState(false);
  const [customBlockTitle, setCustomBlockTitle] = useState('');
  const [customBlockStart, setCustomBlockStart] = useState('16:00');
  const [customBlockEnd, setCustomBlockEnd] = useState('17:15');
  const [customBlockCategory, setCustomBlockCategory] = useState<StudyBlockCategory>('free_study');

  // Cross-analysis calculation
  const analysis = useMemo(() => {
    return analyzeStudentSchedule(lessons, topics, routine, studyBlocks);
  }, [lessons, topics, routine, studyBlocks]);

  if (!isOpen) return null;

  const handleApplyPreset = (presetId: string) => {
    const preset = STUDENT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      onSaveLessons(preset.lessons);
      if (onAutoPopulateTopics) {
        onAutoPopulateTopics(preset.lessons);
      }
      // Auto-regenerate plan with new preset lessons
      const newPlan = generateSmartStudyPlan(preset.lessons, topics, routine, busySlots);
      onSaveStudyBlocks(newPlan);
      setErrorMsg(null);
      setSyncSuccessMsg(`برنامه ${preset.title} با موفقیت اعمال شد و عناوین درسی در چرخه مرور ابینگهاوس قرار گرفتند.`);
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    }
  };

  const handleRegeneratePlan = (overrideRoutine?: StudentRoutineConfig) => {
    const r = overrideRoutine || routine;
    const newPlan = generateSmartStudyPlan(lessons, topics, r, busySlots);
    onSaveStudyBlocks(newPlan);
    setSyncSuccessMsg('برنامه مطالعاتی هوشمند بر اساس آخرین ساعات مدرسه، اوقات مشغله و مرورهای ابینگهاوس بازتولید شد.');
    setTimeout(() => setSyncSuccessMsg(null), 3500);
  };

  const handleSaveRoutineSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveRoutine(tempRoutine);
    handleRegeneratePlan(tempRoutine);
    setSyncSuccessMsg('تنظیمات روتین ذخیره شد و برنامه هفتگی با موفقیت به‌روزرسانی گردید.');
    setTimeout(() => setSyncSuccessMsg(null), 3500);
  };

  const handleAddLesson = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setErrorMsg('لطفاً عنوان درس یا جلسه مطالعه را وارد کنید.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg('ساعت پایان باید پس از ساعت شروع باشد.');
      return;
    }

    const newLesson: StudentLesson = {
      id: 'lesson_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      subject: subject.trim(),
      dayOfWeek,
      startTime,
      endTime,
      difficulty,
      type: lessonType,
      notes: notes.trim() || undefined,
    };

    const updated = [...lessons, newLesson];
    onSaveLessons(updated);
    if (onAutoPopulateTopics) {
      onAutoPopulateTopics(updated);
    }
    // Regenerate study plan to incorporate the new lesson
    const newPlan = generateSmartStudyPlan(updated, topics, routine, busySlots);
    onSaveStudyBlocks(newPlan);

    setSubject('');
    setNotes('');
    setErrorMsg(null);
  };

  const handleDeleteLesson = (id: string) => {
    const updated = lessons.filter((l) => l.id !== id);
    onSaveLessons(updated);
    const newPlan = generateSmartStudyPlan(updated, topics, routine, busySlots);
    onSaveStudyBlocks(newPlan);
  };

  const handleClearSchedule = () => {
    if (window.confirm('آیا از پاکسازی تمامی برنامه‌های هفتگی مطمئن هستید؟')) {
      onSaveLessons([]);
      const newPlan = generateSmartStudyPlan([], topics, routine, busySlots);
      onSaveStudyBlocks(newPlan);
    }
  };

  const handleAddCustomBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBlockTitle.trim()) return;

    const newBlock: GeneratedStudyBlock = {
      id: 'custom_block_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      dayOfWeek: selectedDayTab,
      startTime: customBlockStart,
      endTime: customBlockEnd,
      title: customBlockTitle.trim(),
      category: customBlockCategory,
      difficulty: 'medium',
      isCompleted: false,
    };

    onSaveStudyBlocks([...studyBlocks, newBlock]);
    setCustomBlockTitle('');
    setIsAddingCustomBlock(false);
  };

  const handleDeleteStudyBlock = (blockId: string) => {
    onSaveStudyBlocks(studyBlocks.filter((b) => b.id !== blockId));
  };

  const handleSyncToBusySlots = () => {
    if (!onSyncWithBusySlots) return;

    const newBusySlots: BusySlot[] = lessons
      .filter((l) => l.type === 'school_class' || l.type === 'exam')
      .map((l) => ({
        id: 'busy_sync_' + l.id,
        title: `مدرسه: ${l.subject}`,
        daysOfWeek: [l.dayOfWeek],
        startTime: l.startTime,
        endTime: l.endTime,
        repeatWeekly: true,
        category: 'university',
        isActive: true,
      }));

    // Merge
    const merged = [...busySlots];
    newBusySlots.forEach((ns) => {
      const exists = merged.some(
        (m) =>
          m.title === ns.title &&
          m.startTime === ns.startTime &&
          m.daysOfWeek.includes(ns.daysOfWeek[0])
      );
      if (!exists) {
        merged.push(ns);
      }
    });

    onSyncWithBusySlots(merged);
    setSyncSuccessMsg('کلاس‌های مدرسه به اوقات مشغله سامانه اضافه شدند. سیستم مرورهای ابینگهاوس را به ساعات آزاد منتقل می‌کند.');
    setTimeout(() => setSyncSuccessMsg(null), 4000);
  };

  // Copy full weekly study plan to clipboard
  const handleCopyWeeklyPlan = () => {
    let text = `🗓️ برنامه هفتگی جامع مطالعه و مرورهای ابینگهاوس\n`;
    text += `⏰ ساعات مدرسه: ${routine.schoolDepartureTime} تا ${routine.schoolReturnTime} | خواب: ${routine.bedTime} تا ${routine.wakeUpTime}\n\n`;

    PERSIAN_WEEK_DAYS.forEach((pwd) => {
      const dayLessons = lessons.filter((l) => l.dayOfWeek === pwd.dayIndex);
      const dayBlocks = studyBlocks
        .filter((b) => b.dayOfWeek === pwd.dayIndex)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📅 ${pwd.name}:\n`;
      if (dayLessons.length > 0) {
        text += `🏫 مدرسه: ${dayLessons.map((l) => `${l.subject} (${l.startTime}-${l.endTime})`).join('، ')}\n`;
      }
      if (dayBlocks.length === 0) {
        text += `  بدون پارت مطالعه خانگی\n`;
      } else {
        dayBlocks.forEach((b) => {
          const status = b.isCompleted ? '✓' : '○';
          text += `  ${status} ${b.startTime} تا ${b.endTime}: ${b.title}\n`;
        });
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      setCopySuccessMsg('متن کامل برنامه هفتگی در کلیپ‌بورد کپی شد (مناسب چاپ یا ارسال).');
      setTimeout(() => setCopySuccessMsg(null), 3500);
    });
  };

  // Filter lessons and study blocks for selected day
  const currentDayLessons = lessons
    .filter((l) => l.dayOfWeek === selectedDayTab)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const currentDayBlocks = studyBlocks
    .filter((b) => b.dayOfWeek === selectedDayTab)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const completedBlocksCount = currentDayBlocks.filter((b) => b.isCompleted).length;
  const currentDayProgressPercent =
    currentDayBlocks.length > 0 ? Math.round((completedBlocksCount / currentDayBlocks.length) * 100) : 0;

  const currentDayAnalysis = analysis.dailyLoads.find((d) => d.dayIndex === selectedDayTab);

  const getDifficultyBadge = (diff?: LessonDifficulty) => {
    switch (diff) {
      case 'hard':
        return <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold">سنگین و تخصصی</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-medium">متوسط</span>;
      case 'easy':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-medium">سبک / عمومی</span>;
      default:
        return null;
    }
  };

  const getCategoryBadge = (cat: StudyBlockCategory) => {
    switch (cat) {
      case 'ebbinghaus_review':
        return (
          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold flex items-center gap-1">
            <Brain className="w-3 h-3" />
            <span>مرور فعال ابینگهاوس</span>
          </span>
        );
      case 'same_day_consolidation':
        return (
          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>تثبیت درس امروز مدرسه</span>
          </span>
        );
      case 'prep_tomorrow':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            <span>تکالیف و پیش‌خوانی فردا</span>
          </span>
        );
      case 'night_wind_down':
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-800 text-[10px] font-medium flex items-center gap-1">
            <Moon className="w-3 h-3" />
            <span>مرور سبک قبل خواب</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium">
            مطالعه و حل تست
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden transition-colors"
        dir="rtl"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  دستیار برنامه درسی و تولید هوشمند ساعات مطالعه
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                  سیستم هوشمند (Beta)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                تطبیق زمان مدرسه، ساعات شلوغی و اوقات آزاد با مرورهای منحنی ابینگهاوس جهت حداکثر بازده حافظه
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Summary & Toggle Bar */}
        <div className="bg-slate-50/90 px-4 sm:px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isStudentModeActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              <span className="font-semibold text-slate-700">حالت دانش‌آموزی:</span>
              <span className={`font-bold ${isStudentModeActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                {isStudentModeActive ? 'فعال (ویجت در صفحه اصلی)' : 'غیرفعال'}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-3 text-slate-600 border-r border-slate-200 pr-3">
              <span>
                مدرسه: <strong className="text-slate-900">{toPersianDigits(routine.schoolDepartureTime)} تا {toPersianDigits(routine.schoolReturnTime)}</strong>
              </span>
              <span>•</span>
              <span>
                مطالعه منزل: <strong className="text-indigo-600">{toPersianDigits(analysis.totalHomeStudyHours)} ساعت/هفته</strong>
              </span>
              <span>•</span>
              <span>
                خواب شبانه: <strong className="text-purple-600">{toPersianDigits(analysis.averageSleepHours)} ساعت</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenPdfExportModal && (
              <button
                type="button"
                onClick={onOpenPdfExportModal}
                className="px-3.5 py-1 text-xs font-extrabold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-2xs transition-all flex items-center gap-1.5"
                title="دانلود خروجی PDF برنامه بصورت ماهیانه یا سالیانه"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>دانلود PDF برنامه</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onToggleStudentMode(!isStudentModeActive)}
              className={`px-3 py-1 font-semibold rounded-xl border transition-all ${
                isStudentModeActive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {isStudentModeActive ? 'غیرفعال کردن' : 'فعال‌سازی حالت دانش‌آموزی'}
            </button>
          </div>
        </div>

        {/* 4 Tabs Navigation */}
        <div className="px-4 sm:px-6 pt-2 border-b border-slate-200 flex items-center gap-1 sm:gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('generated_plan')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'generated_plan'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>برنامه مطالعاتی هوشمند</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
              {toPersianDigits(studyBlocks.length)} پارت
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('school')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'school'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>برنامه مدرسه ({toPersianDigits(lessons.length)} زنگ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routine')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'routine'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>روتین روزانه و رفتن به مدرسه</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`pb-2.5 px-3 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'analysis'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>تحلیل بار شناختی و خواب</span>
            {analysis.recommendations.some((r) => r.type === 'warning') && (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            )}
          </button>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* Notifications */}
          {syncSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {copySuccessMsg && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-2xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>{copySuccessMsg}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: SMART AUTO-GENERATED STUDY PLAN                                   */}
          {/* ========================================================================= */}
          {activeTab === 'generated_plan' && (
            <div className="space-y-5">
              {/* Plan Action Bar */}
              <div className="bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/80 p-4 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-sm font-bold text-slate-900">
                      برنامه مطالعاتی تولیدشده توسط موتور هوشمند
                    </h3>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    این برنامه بر اساس ساعات مدرسه، اوقات مشغله و موعد مرورهای ابینگهاوس اختصاصی شما چیده شده است.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleRegeneratePlan()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تولید مجدد برنامه</span>
                  </button>

                  {onOpenPdfExportModal && (
                    <button
                      type="button"
                      onClick={handleCopyWeeklyPlan}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors shadow-2xs"
                      title="کپی کردن ساختار متنی برنامه برای چاپ یا ذخیره"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>کپی برای پرینت</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsAddingCustomBlock(!isAddingCustomBlock)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-medium rounded-xl border border-indigo-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن پارت دستی</span>
                  </button>
                </div>
              </div>

              {/* Day Selector Buttons with Progress Percentage */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {PERSIAN_WEEK_DAYS.map((d) => {
                  const dayBlocks = studyBlocks.filter((b) => b.dayOfWeek === d.dayIndex);
                  const completed = dayBlocks.filter((b) => b.isCompleted).length;
                  const isSelected = selectedDayTab === d.dayIndex;
                  const hasEbbinghaus = dayBlocks.some((b) => b.category === 'ebbinghaus_review');

                  return (
                    <button
                      key={d.dayIndex}
                      type="button"
                      onClick={() => setSelectedDayTab(d.dayIndex)}
                      className={`p-2 sm:p-2.5 text-center rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md scale-[1.02]'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <div className="text-xs font-bold">{d.name}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                        {toPersianDigits(dayBlocks.length)} پارت
                      </div>
                      {dayBlocks.length > 0 && (
                        <div className="mt-1 flex items-center justify-center gap-1">
                          <span className={`text-[9px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-500'}`}>
                            {toPersianDigits(completed)}/{toPersianDigits(dayBlocks.length)}
                          </span>
                          {hasEbbinghaus && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-indigo-500'}`}
                              title="شامل مرور ابینگهاوس"
                            />
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Custom Block Form (Collapsible) */}
              {isAddingCustomBlock && (
                <form
                  onSubmit={handleAddCustomBlock}
                  className="p-4 bg-slate-50 rounded-2xl border border-indigo-200 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">
                      افزودن پارت مطالعه دستی به روز {PERSIAN_WEEK_DAYS.find((d) => d.dayIndex === selectedDayTab)?.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomBlock(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs"
                    >
                      بستن
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] text-slate-500 block mb-1">عنوان پارت:</label>
                      <input
                        type="text"
                        value={customBlockTitle}
                        onChange={(e) => setCustomBlockTitle(e.target.value)}
                        placeholder="مثلاً: حل تست‌های زیست فصل ۳ یا رفع اشکال شیمی"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">ساعت شروع:</label>
                      <input
                        type="time"
                        value={customBlockStart}
                        onChange={(e) => setCustomBlockStart(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">ساعت پایان:</label>
                      <input
                        type="time"
                        value={customBlockEnd}
                        onChange={(e) => setCustomBlockEnd(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomBlock(false)}
                      className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-xl"
                    >
                      انصراف
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs bg-indigo-600 text-white font-bold rounded-xl"
                    >
                      افزودن پارت
                    </button>
                  </div>
                </form>
              )}

              {/* Day Routine & Progress Banner */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {toPersianDigits(currentDayProgressPercent)}٪
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">
                      پیشرفت پارت‌های روز {PERSIAN_WEEK_DAYS.find((d) => d.dayIndex === selectedDayTab)?.name}:
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      {toPersianDigits(completedBlocksCount)} از {toPersianDigits(currentDayBlocks.length)} پارت با موفقیت مطالعه و انجام شده است.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-slate-600">
                  <span>مدرسه: {toPersianDigits(currentDayLessons.length)} زنگ</span>
                  <span>•</span>
                  <span>مطالعه خانگی: {toPersianDigits(currentDayAnalysis?.homeStudyHours || 0)} ساعت</span>
                </div>
              </div>

              {/* Day's Fixed Context (School + Lunch) */}
              {currentDayLessons.length > 0 && (
                <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-amber-900 font-semibold">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>حضور در مدرسه و کلاس‌ها:</span>
                    <span className="font-mono font-bold">
                      {toPersianDigits(routine.schoolDepartureTime)} تا {toPersianDigits(routine.schoolReturnTime)}
                    </span>
                    <span className="text-amber-700 text-[11px]">
                      ({currentDayLessons.map((l) => l.subject).join('، ')})
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-800 bg-white/80 px-2.5 py-1 rounded-xl border border-amber-200">
                    ناهار و ریکاوری: {toPersianDigits(routine.schoolReturnTime)} تا{' '}
                    {toPersianDigits(
                      formatMinutesToTimeStr(
                        (parseTimeStrToMinutes(routine.schoolReturnTime) + routine.lunchRestMinutes) % 1440
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Timeline of Generated Study Blocks */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-700 font-bold px-1">
                  <span>پارت‌های زمان‌بندی‌شده مطالعه و مرور:</span>
                  <span className="text-slate-400 font-normal text-[11px]">
                    برای ثبت انجام هر پارت روی تیک آن کلیک کنید
                  </span>
                </div>

                {currentDayBlocks.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
                    <p>برای این روز هنوز پارتی تولید نشده است.</p>
                    <button
                      type="button"
                      onClick={() => handleRegeneratePlan()}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                    >
                      تولید خودکار برنامه
                    </button>
                  </div>
                ) : (
                  currentDayBlocks.map((block) => (
                    <div
                      key={block.id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-start sm:items-center justify-between gap-3 ${
                        block.isCompleted
                          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                          : block.category === 'ebbinghaus_review'
                          ? 'bg-indigo-50/50 border-indigo-200/90 shadow-2xs'
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3">
                        <button
                          type="button"
                          onClick={() => onToggleBlockCompletion(block.id)}
                          className={`mt-0.5 sm:mt-0 p-1 rounded-lg transition-colors ${
                            block.isCompleted
                              ? 'text-emerald-600 bg-emerald-100 hover:bg-emerald-200'
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                          }`}
                          title={block.isCompleted ? 'علامت به عنوان مطالعه نشده' : 'ثبت انجام پارت'}
                        >
                          {block.isCompleted ? (
                            <CheckSquare className="w-5 h-5 text-emerald-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-xs sm:text-sm font-bold ${
                                block.isCompleted ? 'line-through text-slate-500' : 'text-slate-900'
                              }`}
                            >
                              {block.title}
                            </span>
                            {getCategoryBadge(block.category)}
                            {getDifficultyBadge(block.difficulty)}
                          </div>

                          {block.notes && (
                            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                              {block.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-left font-mono font-semibold text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded-xl">
                          {toPersianDigits(block.startTime)} تا {toPersianDigits(block.endTime)}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteStudyBlock(block.id)}
                          className="p-1 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                          title="حذف این پارت"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: SCHOOL WEEKLY TIMETABLE                                           */}
          {/* ========================================================================= */}
          {activeTab === 'school' && (
            <div className="space-y-6">
              {/* Presets Bar */}
              <div className="bg-indigo-50/60 p-3.5 rounded-2xl border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">الگوهای آماده دبیرستان / کنکور:</h4>
                    <p className="text-[11px] text-slate-500">بارگذاری سریع دروس هفتگی رشته شما</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {STUDENT_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApplyPreset(preset.id)}
                      className="px-2.5 py-1.5 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors shadow-2xs"
                    >
                      {preset.title.split('(')[0].trim()}
                    </button>
                  ))}
                  {lessons.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSchedule}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-xl border border-rose-200 transition-colors"
                    >
                      پاکسازی همه
                    </button>
                  )}
                </div>
              </div>

              {/* Ebbinghaus Auto-Populate Banner */}
              {onAutoPopulateTopics && lessons.length > 0 && (
                <div className="bg-white p-3.5 rounded-2xl border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Brain className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">
                        همگام‌سازی و تولید خودکار عناوین درسی در چرخه ۵ مرحله‌ای ابینگهاوس
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        تمامی دروس برنامه هفتگی مدرسه به طور خودکار در فهرست مطالب درج شده و در مسیر تثبیت حافظه بلندمدت قرار می‌گیرند.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onAutoPopulateTopics(lessons);
                      setSyncSuccessMsg('همگام‌سازی انجام شد: تمامی دروس در فهرست مطالب و چرخه ابینگهاوس قرار گرفتند.');
                      setTimeout(() => setSyncSuccessMsg(null), 3500);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shrink-0 shadow-2xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>همگام‌سازی با فهرست مطالب</span>
                  </button>
                </div>
              )}

              {/* Day Selector Buttons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">انتخاب روز هفته برای مشاهده و ویرایش زنگ‌های مدرسه:</span>
                  <span className="text-[11px] text-slate-500">
                    مجموع: {toPersianDigits(lessons.length)} زنگ درسی
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1 sm:gap-2">
                  {PERSIAN_WEEK_DAYS.map((d) => {
                    const count = lessons.filter((l) => l.dayOfWeek === d.dayIndex).length;
                    const isSelected = selectedDayTab === d.dayIndex;
                    return (
                      <button
                        key={d.dayIndex}
                        type="button"
                        onClick={() => {
                          setSelectedDayTab(d.dayIndex);
                          setDayOfWeek(d.dayIndex);
                        }}
                        className={`p-2 text-center rounded-2xl border transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        <div className="text-xs font-bold">{d.name}</div>
                        <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {toPersianDigits(count)} زنگ
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lessons for selected day */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <span>برنامه زنگ‌های درسی روز {PERSIAN_WEEK_DAYS.find((d) => d.dayIndex === selectedDayTab)?.name}:</span>
                  </h4>
                  <button
                    type="button"
                    onClick={handleSyncToBusySlots}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>همگام‌سازی ساعات مدرسه با مشغله‌های سامانه</span>
                  </button>
                </div>

                {currentDayLessons.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500">
                    برای روز {PERSIAN_WEEK_DAYS.find((d) => d.dayIndex === selectedDayTab)?.name} زنگ کلاسی ثبت نشده است.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {currentDayLessons.map((lesson) => (
                      <div
                        key={lesson.id}
                        className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-slate-800">{lesson.subject}</span>
                            {getDifficultyBadge(lesson.difficulty)}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="font-mono">
                              {toPersianDigits(lesson.startTime)} تا {toPersianDigits(lesson.endTime)}
                            </span>
                            <span>•</span>
                            <span>
                              {lesson.type === 'school_class'
                                ? 'کلاس مدرسه'
                                : lesson.type === 'homework'
                                ? 'تکلیف و تمرین'
                                : lesson.type === 'exam'
                                ? 'آزمون و کوئیز'
                                : 'مطالعه تستی'}
                            </span>
                          </div>
                          {lesson.notes && <p className="text-[10px] text-slate-400 mt-1">{lesson.notes}</p>}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                          title="حذف این درس"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Lesson Form */}
              <form onSubmit={handleAddLesson} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>ثبت زنگ درسی جدید برای {PERSIAN_WEEK_DAYS.find((d) => d.dayIndex === dayOfWeek)?.name}:</span>
                </h4>

                {errorMsg && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">نام درس / مبحث:</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثلاً: زیست‌شناسی، حسابان..."
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">روز هفته:</label>
                    <select
                      value={dayOfWeek}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setDayOfWeek(val);
                        setSelectedDayTab(val);
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      {PERSIAN_WEEK_DAYS.map((d) => (
                        <option key={d.dayIndex} value={d.dayIndex}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">ساعت شروع:</label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">ساعت پایان:</label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">میزان سختی و فشار ذهنی:</label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as LessonDifficulty)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="easy">سبک و عمومی (ادبیات، دینی...)</option>
                      <option value="medium">متوسط (عربی، زبان، زمین...)</option>
                      <option value="hard">سنگین و تخصصی (حسابان، فیزیک، زیست، شیمی...)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-500 block mb-1">نوع جلسه:</label>
                    <select
                      value={lessonType}
                      onChange={(e) => setLessonType(e.target.value as LessonType)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value="school_class">کلاس رسمی مدرسه</option>
                      <option value="study_session">مطالعه تستی / خودخوان</option>
                      <option value="homework">تکلیف و حل تمرین</option>
                      <option value="exam">آزمون و کوئیز</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>افزودن زنگ به برنامه</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DAILY ROUTINE, COMMUTE & BUSY HOURS CONFIG                        */}
          {/* ========================================================================= */}
          {activeTab === 'routine' && (
            <form onSubmit={handleSaveRoutineSettings} className="space-y-6">
              <div className="bg-indigo-50/70 p-4 rounded-2xl border border-indigo-200/80">
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>پیکربندی زمان‌بندی روزانه، رفتن به مدرسه و استراحت</span>
                </div>
                <p className="text-xs text-indigo-700/90 mt-1 leading-relaxed">
                  سیستم هوشمند با استفاده از این ساعت‌ها، زمان‌های آزاد بعدازظهر و شب شما را محاسبه کرده و پارت‌های پومودورو، مرورهای ابینگهاوس و تکالیف را بدون تداخل می‌چیند.
                </p>
              </div>

              {/* Commute & School Times */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>ساعات رفتن به مدرسه، بازگشت و ناهار:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                      ساعت خروج از منزل برای رفتن به مدرسه:
                    </label>
                    <input
                      type="time"
                      value={tempRoutine.schoolDepartureTime}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, schoolDepartureTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">معمولاً ۰۷:۰۰ یا ۰۷:۱۵</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                      ساعت بازگشت به خانه از مدرسه:
                    </label>
                    <input
                      type="time"
                      value={tempRoutine.schoolReturnTime}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, schoolReturnTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">معمولاً ۱۳:۳۰ یا ۱۴:۰۰</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                      مدت ناهار، استراحت و ریکاوری (دقیقه):
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={150}
                      step={15}
                      value={tempRoutine.lunchRestMinutes}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, lunchRestMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      شروع مطالعه بعدازظهر از ساعت{' '}
                      {toPersianDigits(
                        formatMinutesToTimeStr(
                          (parseTimeStrToMinutes(tempRoutine.schoolReturnTime) + tempRoutine.lunchRestMinutes) % 1440
                        )
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sleep & Biological Rhythm */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-purple-600" />
                  <span>ساعات خواب و بیداری (ریتم تثبیت حافظه شبانه):</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-semibold">ساعت خواب شبانه:</label>
                    <input
                      type="time"
                      value={tempRoutine.bedTime}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, bedTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">معمولاً ۲۲:۴۵ تا ۲۳:۳۰</span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1 font-semibold">ساعت بیداری صبح:</label>
                    <input
                      type="time"
                      value={tempRoutine.wakeUpTime}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, wakeUpTime: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                      required
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">معمولاً ۰۶:۰۰ تا ۰۶:۳۰</span>
                  </div>

                  <div className="p-3 bg-purple-50/70 rounded-xl border border-purple-100 flex flex-col justify-center">
                    <span className="text-[10px] text-purple-800 font-semibold">مدت خواب شبانه محاسبه‌شده:</span>
                    <span className="text-base font-bold text-purple-900 mt-0.5 font-mono">
                      {toPersianDigits(calculateSleepDuration(tempRoutine.bedTime, tempRoutine.wakeUpTime))} ساعت
                    </span>
                    <span className="text-[9px] text-purple-700 mt-0.5">
                      {calculateSleepDuration(tempRoutine.bedTime, tempRoutine.wakeUpTime) >= 7
                        ? '✓ عالی برای پردازش امواج دلتا و تثبیت حافظه'
                        : '⚠️ کمتر از ۷ ساعت؛ خطر فرسودگی حافظه'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Study Blocks & Focus Priorities */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>تنظیمات پارت‌های پومودورو و اهداف مطالعه منزل:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">طول هر پارت مطالعه:</label>
                    <select
                      value={tempRoutine.studyBlockDuration}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, studyBlockDuration: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value={45}>۴۵ دقیقه (پومودورو فشرده)</option>
                      <option value={60}>۶۰ دقیقه (استاندارد دبیرستان)</option>
                      <option value={75}>۷۵ دقیقه (تخصصی کنکور)</option>
                      <option value={90}>۹۰ دقیقه (جلسات طولانی)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">استراحت بین پارت‌ها:</label>
                    <select
                      value={tempRoutine.breakDuration}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, breakDuration: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    >
                      <option value={10}>۱۰ دقیقه استراحت</option>
                      <option value={15}>۱۵ دقیقه استراحت طلایی</option>
                      <option value={20}>۲۰ دقیقه استراحت عمیق</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">هدف مطالعه روزهای مدرسه:</label>
                    <input
                      type="number"
                      min={2}
                      max={8}
                      step={0.5}
                      value={tempRoutine.targetHomeStudyHoursWeekdays}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, targetHomeStudyHoursWeekdays: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-600 block mb-1">هدف مطالعه تعطیلات (پنج‌شنبه/جمعه):</label>
                    <input
                      type="number"
                      min={4}
                      max={12}
                      step={0.5}
                      value={tempRoutine.targetHomeStudyHoursWeekend}
                      onChange={(e) => setTempRoutine({ ...tempRoutine, targetHomeStudyHoursWeekend: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 font-mono"
                    />
                  </div>
                </div>

                {/* Flexible Rest Windows Settings */}
                <div className="pt-3 mt-3 border-t border-slate-100">
                  <div className="p-3.5 bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 rounded-xl border border-amber-200/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          ⚖️
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-amber-950">پیکربندی «بازه استراحت منعطف» و رفع هوشمند تداخل</h5>
                          <p className="text-[10px] text-amber-800 leading-tight">
                            در صورت بروز تداخل برنامه‌ای، سیستم ابتدا با جابجایی و فشرده‌سازی این بازه‌ها تداخل را رفع می‌کند تا پارت‌های درسی حذف نشوند.
                          </p>
                        </div>
                      </div>

                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={tempRoutine.allowFlexibleBreakWindows !== false}
                          onChange={(e) =>
                            setTempRoutine({
                              ...tempRoutine,
                              allowFlexibleBreakWindows: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {tempRoutine.allowFlexibleBreakWindows !== false && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-medium text-amber-900 block mb-1">
                            حداقل استراحت/ناهار بعد مدرسه در شرایط تداخل:
                          </label>
                          <select
                            value={tempRoutine.minLunchRestMinutes ?? 30}
                            onChange={(e) =>
                              setTempRoutine({
                                ...tempRoutine,
                                minLunchRestMinutes: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white text-slate-800"
                          >
                            <option value={20}>۲۰ دقیقه (کف استراحت فشرده)</option>
                            <option value={30}>۳۰ دقیقه (استاندارد منعطف)</option>
                            <option value={45}>۴۵ دقیقه (استراحت متوسط)</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] font-medium text-amber-900 block mb-1">
                            حداقل زنگ استراحت بین پارت‌ها در شرایط تداخل:
                          </label>
                          <select
                            value={tempRoutine.minBreakDuration ?? 5}
                            onChange={(e) =>
                              setTempRoutine({
                                ...tempRoutine,
                                minBreakDuration: Number(e.target.value),
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs rounded-xl border border-amber-200 bg-white text-slate-800"
                          >
                            <option value={5}>۵ دقیقه (تنفس سریع)</option>
                            <option value={10}>۱۰ دقیقه (تنفس متوسط)</option>
                            <option value={15}>۱۵ دقیقه (ثابت)</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[11px] text-slate-600 block mb-1 font-semibold">
                    استراتژی و اولویت هوشمند چیدمان برنامه:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                        tempRoutine.priorityFocus === 'balanced'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        checked={tempRoutine.priorityFocus === 'balanced'}
                        onChange={() => setTempRoutine({ ...tempRoutine, priorityFocus: 'balanced' })}
                        className="accent-indigo-600"
                      />
                      <div className="text-xs">
                        <div>توازن همه‌جانبه (پیشنهادی)</div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          ترکیب مرورهای ابینگهاوس، حل تمرین امروز و پیش‌خوانی فردا
                        </span>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                        tempRoutine.priorityFocus === 'ebbinghaus_first'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        checked={tempRoutine.priorityFocus === 'ebbinghaus_first'}
                        onChange={() => setTempRoutine({ ...tempRoutine, priorityFocus: 'ebbinghaus_first' })}
                        className="accent-indigo-600"
                      />
                      <div className="text-xs">
                        <div>اولویت اول با مرورهای ابینگهاوس</div>
                        <span className="text-[10px] text-slate-500 font-normal">
                          اختصاص بهترین ساعت عصر به تثبیت موضوعات در موعد مرور
                        </span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-sm transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ذخیره روتین و تولید خودکار برنامه مطالعاتی</span>
                </button>
              </div>
            </form>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ADVANCED COGNITIVE LOAD & SLEEP ANALYSIS                           */}
          {/* ========================================================================= */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              {/* Burnout Risk & Sleep Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">شاخص خطر فرسودگی ذهنی:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-slate-900">
                      {toPersianDigits(analysis.burnoutIndex)}٪
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        analysis.burnoutIndex > 65
                          ? 'bg-rose-100 text-rose-800'
                          : analysis.burnoutIndex > 40
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {analysis.burnoutIndex > 65 ? 'بالا (نیازمند استراحت)' : analysis.burnoutIndex > 40 ? 'متوسط' : 'ایمن و مطلوب'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">محاسبه‌شده از ترکیب ساعات کلاس، مطالعه و استراحت</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">خواب شبانه تثبیت‌کننده:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-purple-600">
                      {toPersianDigits(analysis.averageSleepHours)} ساعت
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      ({toPersianDigits(routine.bedTime)} تا {toPersianDigits(routine.wakeUpTime)})
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">حداقل استاندارد برای انتقال حافظه به کورتکس: ۷ ساعت</p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
                  <span className="text-[11px] text-slate-500 font-medium">مجموع آموزش و مطالعه در هفته:</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-indigo-600">
                      {toPersianDigits(analysis.totalStudyHours)} ساعت
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    شامل {toPersianDigits(analysis.totalHomeStudyHours)} ساعت مطالعه فعال خانگی
                  </p>
                </div>
              </div>

              {/* Weekly Daily Load Bars */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>توزیع بار شناختی و فشار ذهنی در روزهای هفته:</span>
                </h4>

                <div className="space-y-2.5">
                  {analysis.dailyLoads.map((day) => (
                    <div key={day.dayIndex} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 flex items-center gap-2">
                          <span>{day.dayName}</span>
                          <span className="text-[10px] text-slate-400">
                            ({toPersianDigits(day.lessonsCount)} زنگ مدرسه • {toPersianDigits(day.homeStudyHours)} ساعت مطالعه منزل)
                          </span>
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-500 text-[11px]">{toPersianDigits(day.loadScore)}٪</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              day.loadLevel === 'overload'
                                ? 'bg-rose-100 text-rose-800'
                                : day.loadLevel === 'heavy'
                                ? 'bg-amber-100 text-amber-800'
                                : day.loadLevel === 'balanced'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {day.loadLevel === 'overload'
                              ? 'فوق سنگین'
                              : day.loadLevel === 'heavy'
                              ? 'سنگین'
                              : day.loadLevel === 'balanced'
                              ? 'متعادل'
                              : 'سبک'}
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            day.loadLevel === 'overload'
                              ? 'bg-rose-500'
                              : day.loadLevel === 'heavy'
                              ? 'bg-amber-500'
                              : day.loadLevel === 'balanced'
                              ? 'bg-emerald-500'
                              : 'bg-indigo-300'
                          }`}
                          style={{ width: `${day.loadScore}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Cognitive Heatmap */}
              <WeeklyCognitiveHeatmap
                lessons={lessons}
                studyBlocks={studyBlocks}
                busySlots={busySlots}
                routine={routine}
              />

              {/* Actionable Recommendations */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Brain className="w-4 h-4 text-indigo-600" />
                  <span>توصیه‌های عصب‌شناختی ابینگهاوس برای بهبود یادگیری:</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={`p-3.5 rounded-2xl border ${
                        rec.type === 'warning'
                          ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                          : rec.type === 'timing'
                          ? 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
                          : rec.type === 'tip'
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {rec.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : rec.type === 'timing' ? (
                          <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                        ) : rec.type === 'tip' ? (
                          <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span>{rec.title}</span>
                      </div>
                      <p className="text-[11px] mt-1.5 leading-relaxed opacity-90">{rec.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Golden Windows */}
              <div className="bg-gradient-to-r from-indigo-50/80 to-purple-50/80 p-4 rounded-2xl border border-indigo-100 space-y-2">
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>پنجره‌های طلایی فعالیت مغز شما:</span>
                </span>
                <ul className="space-y-1.5 text-xs text-indigo-900/90 leading-relaxed pr-2">
                  {analysis.goldenStudyWindows.map((gw, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-indigo-600 font-bold">•</span>
                      <span>{gw}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-500">
            تغییرات به صورت آنی در حافظه محلی (LocalStorage) مرورگر شما ذخیره می‌گردد.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            تأیید و بازگشت
          </button>
        </div>
      </div>
    </div>
  );
};

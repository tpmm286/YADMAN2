import React, { useMemo } from 'react';
import {
  GraduationCap,
  Calendar,
  Brain,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Clock,
  CheckSquare,
  Square,
  Moon,
  Zap,
  BookOpen,
  Timer,
  Plus,
  FileText,
  Download,
} from 'lucide-react';
import { StudentLesson, TopicItem, StudentRoutineConfig, GeneratedStudyBlock, BusySlot, GoldenFreeWindow } from '../types';
import { PERSIAN_WEEK_DAYS, toPersianDigits, formatMinutesToTimeStr } from '../utils/dateUtils';
import { analyzeStudentSchedule, parseTimeStrToMinutes, detectScheduleConflicts, findGoldenFreeWindows, findSmartShortRestSuggestions } from '../utils/studentAnalysisUtils';
import { GoldenWindowsWidget } from './GoldenWindowsWidget';

interface StudentScheduleWidgetProps {
  isStudentModeActive: boolean;
  onOpenStudentModal: () => void;
  lessons: StudentLesson[];
  topics: TopicItem[];
  routine: StudentRoutineConfig;
  studyBlocks: GeneratedStudyBlock[];
  onToggleBlockCompletion: (blockId: string) => void;
  busySlots?: BusySlot[];
  onStartPomodoro?: (blockId: string) => void;
  onShiftSchedule?: () => void;
  onResolveConflicts?: () => void;
  onToggleExamMode?: (active: boolean) => void;
  onAutoPopulateTopics?: () => void;
  onAddSubtopicForLesson?: (lessonSubject: string) => void;
  onAddBlockInWindow?: (block: Omit<GeneratedStudyBlock, 'id'>) => void;
  onAutoAssignEbbinghausToWindow?: (window: GoldenFreeWindow) => void;
  onOpenPdfExportModal?: () => void;
}

export const StudentScheduleWidget: React.FC<StudentScheduleWidgetProps> = ({
  isStudentModeActive,
  onOpenStudentModal,
  lessons,
  topics,
  routine,
  studyBlocks,
  onToggleBlockCompletion,
  busySlots = [],
  onStartPomodoro,
  onShiftSchedule,
  onResolveConflicts,
  onToggleExamMode,
  onAutoPopulateTopics,
  onAddSubtopicForLesson,
  onAddBlockInWindow,
  onAutoAssignEbbinghausToWindow,
  onOpenPdfExportModal,
}) => {
  if (!isStudentModeActive) return null;

  const todayIndex = new Date().getDay();
  const todayName = PERSIAN_WEEK_DAYS.find((d) => d.dayIndex === todayIndex)?.name || 'امروز';

  const todayLessons = lessons
    .filter((l) => l.dayOfWeek === todayIndex)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const todayBlocks = studyBlocks
    .filter((b) => b.dayOfWeek === todayIndex)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const completedBlocksCount = todayBlocks.filter((b) => b.isCompleted).length;
  const progressPercent = todayBlocks.length > 0 ? Math.round((completedBlocksCount / todayBlocks.length) * 100) : 0;
  
  const conflicts = detectScheduleConflicts(studyBlocks, busySlots, routine, lessons);
  const hasConflicts = conflicts.length > 0;

  const analysis = analyzeStudentSchedule(lessons, topics, routine, studyBlocks);
  const todayAnalysis = analysis.dailyLoads.find((d) => d.dayIndex === todayIndex);

  const goldenWindows = useMemo(() => {
    return findGoldenFreeWindows(lessons, busySlots, routine, studyBlocks);
  }, [lessons, busySlots, routine, studyBlocks]);

  const shortRestSuggestions = useMemo(() => {
    return findSmartShortRestSuggestions(lessons, busySlots, routine, studyBlocks);
  }, [lessons, busySlots, routine, studyBlocks]);

  return (
    <div
      id="student-schedule-widget"
      className="mb-6 p-4 sm:p-5 rounded-xl bg-indigo-50 border border-indigo-200 shadow-xs transition-colors"
      dir="rtl"
    >
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/80 pb-3 mb-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                میز مطالعه و برنامه هوشمند امروز ({todayName})
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                دستیار دانش‌آموزی
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              هماهنگی خودکار زنگ‌های مدرسه و اوقات فراغت با مرورهای منحنی ابینگهاوس
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          {onAddSubtopicForLesson && (
            <button
              type="button"
              onClick={() => onAddSubtopicForLesson('')}
              className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3.5 py-1.5 rounded-xl shadow-2xs transition-all"
              title="ثبت سرفصل یا مبحث جدید برای دروس مدرسه (مثلاً داینامیک فیزیک، ژنتیک زیست...)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ ثبت مبحث یا فصل جدید کتاب</span>
            </button>
          )}

          {onToggleExamMode && (
            <button
              type="button"
              onClick={() => onToggleExamMode(!routine.isExamModeActive)}
              className={`flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-bold px-3.5 py-1.5 rounded-xl border shadow-2xs transition-all ${
                routine.isExamModeActive
                  ? 'bg-rose-100 text-rose-800 border-rose-300 hover:bg-rose-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="نادیده گرفتن فعالیت‌های با اولویت پایین برای باز کردن وقت بیشتر جهت مطالعه"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>مود امتحانات: {routine.isExamModeActive ? 'روشن' : 'خاموش'}</span>
            </button>
          )}

          {onOpenPdfExportModal && (
            <button
              type="button"
              onClick={onOpenPdfExportModal}
              className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-3.5 py-1.5 rounded-xl shadow-2xs transition-all"
              title="خروجی و دانلود PDF برنامه تحصیلی به صورت رنگی یا سیاه/سفید"
            >
              <FileText className="w-3.5 h-3.5 text-amber-700" />
              <span>📥 دانلود PDF (ماهیانه/سالیانه)</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenStudentModal}
            className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-white hover:bg-indigo-50 px-3.5 py-1.5 rounded-xl border border-indigo-200 shadow-2xs transition-all"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>تنظیم ساعات، مدرسه و برنامه کامل</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Routine Quick Overview & Weekly Hours Breakdown Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-xs">
        <div className="p-2.5 bg-white rounded-2xl border border-indigo-100/80 flex items-center gap-2 shadow-2xs">
          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">ساعات مدرسه:</span>
            <span className="font-bold text-slate-800 font-mono text-[11px]">
              {toPersianDigits(routine.schoolDepartureTime)} تا {toPersianDigits(routine.schoolReturnTime)}
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-2xl border border-indigo-100/80 flex items-center gap-2 shadow-2xs">
          <BookOpen className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">کل مطالعه هفتگی منزل:</span>
            <span className="font-bold text-emerald-700 text-[11px]">
              {toPersianDigits(analysis.totalHomeStudyHours)} ساعت / هفته
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-2xl border border-indigo-100/80 flex items-center gap-2 shadow-2xs">
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">پارت‌های مطالعه امروز:</span>
            <span className="font-bold text-indigo-700 text-[11px]">
              {toPersianDigits(completedBlocksCount)} از {toPersianDigits(todayBlocks.length)} پارت ({toPersianDigits(progressPercent)}٪)
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-white rounded-2xl border border-indigo-100/80 flex items-center gap-2 shadow-2xs">
          <TrendingUp className="w-4 h-4 text-purple-600 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-400 block">فشار ذهنی امروز:</span>
            <span
              className={`font-bold text-[11px] ${
                todayAnalysis?.loadLevel === 'overload'
                  ? 'text-rose-600'
                  : todayAnalysis?.loadLevel === 'heavy'
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {todayAnalysis?.loadLevel === 'overload'
                ? 'فوق سنگین'
                : todayAnalysis?.loadLevel === 'heavy'
                ? 'سنگین'
                : 'متعادل و مطلوب'}
            </span>
          </div>
        </div>
      </div>

      {/* Detailed Weekly Breakdown Card */}
      <div className="mb-3 p-3 bg-indigo-900 text-white rounded-2xl shadow-xs text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-extrabold text-amber-300">
            <Timer className="w-4 h-4 text-amber-400" />
            <span>نظم‌دهی و تفکیک مطالعه هفتگی:</span>
          </div>
          <div className="flex items-center gap-3 text-indigo-100">
            <span>🧠 مرور ابینگهاوس: <strong className="text-white">{toPersianDigits(analysis.totalEbbinghausReviewHours)} ساعت</strong></span>
            <span>•</span>
            <span>🏫 تثبیت دروس مدرسه: <strong className="text-white">{toPersianDigits(analysis.totalSameDayConsolidationHours)} ساعت</strong></span>
            <span>•</span>
            <span>📚 تکالیف و پیش‌خوانی: <strong className="text-white">{toPersianDigits(analysis.totalPrepTomorrowHours)} ساعت</strong></span>
          </div>
        </div>

        {hasConflicts ? (
          <div className="flex items-center gap-2">
            <span className="text-rose-300 font-bold animate-pulse text-[11px]">⚠️ {toPersianDigits(conflicts.length)} تداخل زمانی شناسایی شد</span>
            {onResolveConflicts && (
              <button
                type="button"
                onClick={onResolveConflicts}
                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold rounded-xl text-xs transition-colors shadow-2xs"
              >
                🔄 رفع هوشمند تداخل‌ها
              </button>
            )}
          </div>
        ) : (
          <span className="text-emerald-300 font-bold text-[11px] flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span>برنامه ۱۰۰٪ هماهنگ و بدون تداخل</span>
          </span>
        )}
      </div>

      {hasConflicts && (
        <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 text-rose-800">
            <Zap className="w-5 h-5 shrink-0" />
            <div className="text-xs">
              <p className="font-bold">تداخل در برنامه مطالعه!</p>
              <p className="opacity-90">برخی از پارت‌های مطالعه با ساعات کلاس یا مشغله‌های شما تداخل دارند.</p>
            </div>
          </div>
          {onResolveConflicts && (
            <button
              onClick={onResolveConflicts}
              className="shrink-0 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
            >
              اصلاح خودکار تداخل‌ها
            </button>
          )}
        </div>
      )}

      {/* Progress Bar for Today's Study Blocks */}
      {todayBlocks.length > 0 && (
        <div className="mb-3 bg-white p-2.5 rounded-2xl border border-indigo-100/90 shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">
              پیشرفت پارت‌های مطالعه خانگی امروز:
            </span>
            <span className="font-mono font-bold text-indigo-600">
              {toPersianDigits(progressPercent)}٪ انجام شده
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Content Columns: Today's Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* School Classes Today */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-700 font-semibold px-1">
            <span>زنگ‌های کلاسی مدرسه:</span>
            <span className="text-slate-500 text-[11px]">
              {toPersianDigits(todayLessons.length)} زنگ
            </span>
          </div>

          {todayLessons.length === 0 ? (
            <div className="p-3.5 bg-white/90 rounded-2xl border border-indigo-100 text-xs text-slate-500 text-center">
              امروز زنگ کلاسی رسمی در مدرسه ندارید (فرصت عالی برای جبران و پیش‌روی).
            </div>
          ) : (
            <div className="space-y-1.5">
              {todayLessons.map((l) => (
                <div
                  key={l.id}
                  className="px-3 py-2 bg-white rounded-2xl border border-indigo-100/90 text-xs flex items-center justify-between shadow-2xs gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{l.subject}</span>
                    {l.difficulty === 'hard' && (
                      <span className="px-1.5 py-0.2 bg-rose-100 text-rose-800 text-[9px] font-bold rounded">
                        سنگین
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {toPersianDigits(l.startTime)} - {toPersianDigits(l.endTime)}
                    </span>
                    {onAddSubtopicForLesson && (
                      <button
                        type="button"
                        onClick={() => onAddSubtopicForLesson(l.subject)}
                        className="px-2 py-0.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200/80 transition-all"
                        title={`ثبت مبحث یا فصل جدید برای درس ${l.subject}`}
                      >
                        + مبحث جدید
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated Study Blocks (Directly Interactive!) */}
        <div className="lg:col-span-8 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 font-semibold px-1 gap-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>پارت‌های هوشمند مطالعه در منزل (عصر و شب):</span>
            </span>
            
            {onShiftSchedule && todayBlocks.some(b => !b.isCompleted) && (
              <button
                type="button"
                onClick={onShiftSchedule}
                className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                title="اگر پارت‌های قبلی طول کشیده است، زمان پارت‌های باقی‌مانده را از همین الان مجدداً محاسبه و شیفت بده"
              >
                <Clock className="w-3 h-3" />
                <span>بروزرسانی ساعت پارت‌های باقی‌مانده</span>
              </button>
            )}
          </div>

          {todayBlocks.length === 0 ? (
            <div className="p-4 bg-white/90 rounded-2xl border border-indigo-100 text-xs text-slate-500 text-center space-y-2">
              <p>پارتی برای امروز تعریف نشده است.</p>
              <button
                type="button"
                onClick={onOpenStudentModal}
                className="px-3 py-1 bg-indigo-600 text-white font-bold rounded-xl text-xs"
              >
                تولید برنامه هوشمند با یک کلیک
              </button>
            </div>
          ) : (
            <div className="space-y-0 relative before:absolute before:inset-y-0 before:right-6 before:w-px before:bg-indigo-100/80">
              {todayBlocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="relative pl-2 pr-12 py-3 group"
                >
                  {/* Timeline Dot */}
                  <div className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-xs transition-colors z-10 ${
                    block.isCompleted ? 'bg-emerald-500' : 'bg-indigo-300 group-hover:bg-indigo-400'
                  }`}>
                    {block.isCompleted && <CheckSquare className="w-2.5 h-2.5 text-white" />}
                  </div>

                  {/* Block Card */}
                  <div className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    block.isCompleted
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 opacity-75'
                      : block.category === 'ebbinghaus_review'
                      ? 'bg-indigo-50/60 border-indigo-200 shadow-2xs'
                      : 'bg-white border-indigo-100/90 hover:border-indigo-200 shadow-2xs'
                  }`}>
                    <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => onToggleBlockCompletion(block.id)}
                        className={`mt-0.5 sm:mt-0 p-1.5 rounded-lg transition-colors shrink-0 border ${
                          block.isCompleted
                            ? 'text-emerald-600 bg-emerald-100/50 border-emerald-200 hover:bg-emerald-200'
                            : 'text-slate-400 border-slate-200 bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50'
                        }`}
                        title={block.isCompleted ? 'علامت به عنوان انجام‌نشده' : 'علامت به عنوان انجام‌شده'}
                      >
                        {block.isCompleted ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>

                      <div className="min-w-0 flex flex-col gap-1.5">
                        <span
                          className={`text-sm font-bold truncate ${
                            block.isCompleted ? 'line-through text-slate-500' : 'text-slate-800'
                          }`}
                        >
                          {block.title}
                        </span>

                        <div className="flex items-center gap-2 flex-wrap">
                          {block.category === 'ebbinghaus_review' && (
                            <span className="px-1.5 py-0.2 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold shrink-0">
                              مرور ابینگهاوس
                            </span>
                          )}
                          {block.category === 'same_day_consolidation' && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                              تثبیت درس امروز
                            </span>
                          )}
                          {block.category === 'prep_tomorrow' && (
                            <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold shrink-0">
                              پیش‌خوانی فردا
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 border-t sm:border-t-0 border-indigo-100/50 pt-2 sm:pt-0 mt-2 sm:mt-0">
                      <span className="font-mono text-xs font-bold text-slate-600 bg-white/60 border border-slate-200/60 px-2 py-1 rounded-lg">
                        {toPersianDigits(block.startTime)} تا {toPersianDigits(block.endTime)}
                      </span>
                      
                      {onStartPomodoro && (
                        <button
                          type="button"
                          onClick={() => onStartPomodoro(block.id)}
                          className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 rounded-xl transition-all border border-indigo-200 shadow-2xs"
                          title="شروع مطالعه این پارت با تایمر متمرکز پومودورو"
                        >
                          <Timer className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Golden Free Time Windows & Short Rest Widget */}
      <GoldenWindowsWidget
        goldenWindows={goldenWindows}
        shortRestSuggestions={shortRestSuggestions}
        topics={topics}
        lessons={lessons}
        onAddBlockInWindow={onAddBlockInWindow}
        onAutoAssignEbbinghausToWindow={onAutoAssignEbbinghausToWindow}
      />

      {/* Robust Weekly Timetable Preview (نمای هفتگی جامع - منتقل‌شده به پایین و آخر تب) */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-2xs">
        <div className="bg-indigo-50/60 p-3 border-b border-indigo-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <h4 className="text-xs font-black text-indigo-950">نمای هفتگی جامع (برنامه کلاسی و مطالعه)</h4>
          </div>
          <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 shadow-2xs">
            شنبه تا جمعه
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed text-right min-w-[800px] print:min-w-0">
            <thead>
              <tr className="bg-slate-50">
                <th className="w-20 p-1 text-center text-[10px] font-black text-slate-400 border-b border-l border-slate-100">ساعت</th>
                {PERSIAN_WEEK_DAYS.map(day => (
                  <th key={day.dayIndex} className="p-1 text-center text-[11px] font-black text-slate-700 border-b border-l border-slate-100 last:border-l-0">
                    {day.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, slotIdx) => (
                <tr key={slotIdx} className="group hover:bg-slate-50/30 transition-colors">
                  <td className="p-1 text-center border-b border-l border-slate-50 bg-slate-50/20">
                    <span className="text-[10px] font-black text-slate-400">پارت {toPersianDigits(slotIdx + 1)}</span>
                  </td>
                  {PERSIAN_WEEK_DAYS.map(day => {
                    const dayEvents = [...lessons.filter(l => l.dayOfWeek === day.dayIndex), ...studyBlocks.filter(b => b.dayOfWeek === day.dayIndex)]
                      .sort((a, b) => parseTimeStrToMinutes(a.startTime) - parseTimeStrToMinutes(b.startTime));
                    const event = dayEvents[slotIdx];

                    return (
                      <td key={day.dayIndex} className="p-1 border-b border-l border-slate-50 last:border-l-0 relative overflow-hidden" style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                        {event ? (
                          <div className={`p-1 border transition-all text-right rounded-lg ${
                            'type' in event && event.type === 'school_class'
                              ? 'bg-indigo-50 border-indigo-100 text-indigo-900'
                              : !('type' in event) && event.category === 'ebbinghaus_review'
                                ? 'bg-purple-50 border-purple-100 text-purple-900'
                                : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                          }`}>
                            <div className="text-[7px] font-bold opacity-60 mb-0.5 dir-ltr">{toPersianDigits(event.startTime)}</div>
                            <div className="text-[9px] font-black leading-tight break-words">
                              {'subject' in event ? event.subject : (event.title || 'مطالعه')}
                            </div>
                          </div>
                        ) : (
                          <div className="h-6" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

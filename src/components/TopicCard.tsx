import React, { useState } from 'react';
import {
  CheckCircle,
  Trash2,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Edit3,
  CalendarCheck,
  ShieldCheck,
  Tag,
  Folder,
  Target,
  Award,
  Zap,
  GraduationCap,
  Plus,
  Flame,
  AlertTriangle,
  Brain,
  Info,
} from 'lucide-react';
import { TopicItem, STAGES, TOTAL_STAGES, BusySlot } from '../types';
import {
  getNextReviewDate,
  isItemDue,
  formatPersianDateTime,
  formatPersianDate,
  formatPersianTime,
  getRelativeTimePersian,
  toPersianDigits,
  calculateStageDate,
  getConsolidationEstimate,
  checkReviewConflict,
  calculateForgettingProbability,
} from '../utils/dateUtils';

interface TopicCardProps {
  item: TopicItem;
  onConfirmReview: (id: string) => void;
  onDeleteRequest: (item: TopicItem) => void;
  onEditDateRequest: (item: TopicItem) => void;
  onTagClick?: (tag: string) => void;
  onCategoryClick?: (category: string) => void;
  busySlots?: BusySlot[];
  autoShiftEnabled?: boolean;
  isStudentModeActive?: boolean;
  hasTodayStudyBlock?: boolean;
  todayStudyBlockTime?: string;
  autoAddToTodayEnabled?: boolean;
  onAddToTodaySchedule?: (item: TopicItem) => void;
  onAddNextChapter?: (item: TopicItem) => void;
}

export const TopicCard: React.FC<TopicCardProps> = ({
  item,
  onConfirmReview,
  onDeleteRequest,
  onEditDateRequest,
  onTagClick,
  onCategoryClick,
  busySlots = [],
  autoShiftEnabled = true,
  isStudentModeActive = false,
  hasTodayStudyBlock = false,
  todayStudyBlockTime,
  autoAddToTodayEnabled = false,
  onAddToTodaySchedule,
  onAddNextChapter,
}) => {
  const [showTimeline, setShowTimeline] = useState(false);
  const [showForgettingDetails, setShowForgettingDetails] = useState(false);
  const now = new Date();
  const isCompleted = item.completedStages >= TOTAL_STAGES;
  const nextReviewDate = getNextReviewDate(item);

  // Check if standard review time conflicts with any weekly busy commitment (gym, university, work)
  const conflict = !isCompleted && nextReviewDate ? checkReviewConflict(nextReviewDate, busySlots, now) : null;

  // Effective review date: if conflict detected & autoShift is enabled, use nearest free time slot
  const effectiveReviewDate = conflict && autoShiftEnabled ? conflict.adjustedDate : nextReviewDate;

  const isDue = effectiveReviewDate ? now.getTime() >= effectiveReviewDate.getTime() : false;

  // Progress percentage (0% to 100%)
  const progressPercent = Math.min(100, Math.round((item.completedStages / TOTAL_STAGES) * 100));

  // Visual Ebbinghaus forgetting probability calculation
  const forgettingInfo = calculateForgettingProbability(item, now);

  // Memory retention strength level
  const getRetentionStrength = (completed: number) => {
    switch (completed) {
      case 0:
        return { label: 'استحکام اولیه (۲۰٪)', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 1:
        return { label: 'تثبیت اولیه (۴۰٪)', badge: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 2:
        return { label: 'تثبیت میان‌مدت (۶۰٪)', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 3:
        return { label: 'تقویت ارتباطات عصبی (۸۰٪)', badge: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 4:
        return { label: 'مقاومت بالا در برابر فراموشی (۹۰٪)', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 5:
      default:
        return { label: 'حداکثر استحکام در یادآوری (۱۰۰٪)', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold' };
    }
  };
  const retentionInfo = getRetentionStrength(item.completedStages);

  // Current stage label (e.g. "مرحله ۲ از ۵" or "کامل شده")
  const currentStageDisplay = isCompleted
    ? 'کامل شده'
    : `مرحله ${toPersianDigits(item.completedStages + 1)} از ${toPersianDigits(TOTAL_STAGES)}`;

  // Relative time info
  const relativeTime = effectiveReviewDate ? getRelativeTimePersian(effectiveReviewDate, now) : null;

  // Estimated memory consolidation date & remaining time (Stage 5 completion)
  const consolidation = getConsolidationEstimate(item, now);

  return (
    <div
      id={`topic-card-${item.id}`}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isDue
          ? 'bg-rose-50/40 border-rose-300 shadow-md ring-1 ring-rose-200'
          : isCompleted
          ? 'bg-white border-emerald-200/80 shadow-xs'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      {/* Header Banner if Due */}
      {isDue && (
        <div className="bg-rose-500 text-white px-4 py-1.5 flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span>آماده مرور فوری!</span>
          </div>
          <span className="opacity-95">{relativeTime?.text}</span>
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-4">
        {/* Title & Status Badges */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {item.title}
              </h3>

              {/* Stage Badge */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : isDue
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                {isCompleted ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                <span>{currentStageDisplay}</span>
              </span>

              {/* Student Lesson Badge */}
              {item.lessonSubject && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-900 border border-indigo-200 shadow-2xs">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>درس: {item.lessonSubject}</span>
                  {item.difficulty && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                        item.difficulty === 'hard'
                          ? 'bg-rose-100 text-rose-800'
                          : item.difficulty === 'medium'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {item.difficulty === 'hard' ? 'سخت' : item.difficulty === 'medium' ? 'متوسط' : 'ساده'}
                    </span>
                  )}
                </span>
              )}

              {isCompleted && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>تثبیت در حافظه بلندمدت</span>
                </span>
              )}
            </div>

            {/* Description (Optional) */}
            {item.description ? (
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap pt-1">
                {item.description}
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">بدون توضیحات تکمیلی</p>
            )}

            {/* Category and Tags Badges */}
            {(item.category || (item.tags && item.tags.length > 0)) && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                {item.category && (
                  <button
                    type="button"
                    onClick={() => onCategoryClick && onCategoryClick(item.category!)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition-colors"
                    title={`فیلتر بر اساس دسته «${item.category}»`}
                  >
                    <Folder className="w-3 h-3 text-blue-600" />
                    <span>{item.category}</span>
                  </button>
                )}

                {item.tags &&
                  item.tags.map((tag, tIdx) => (
                    <button
                      key={tIdx}
                      type="button"
                      onClick={() => onTagClick && onTagClick(tag)}
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 border border-slate-200/70 hover:border-indigo-200 transition-colors"
                      title={`فیلتر بر اساس تگ «${tag}»`}
                    >
                      <Tag className="w-2.5 h-2.5 text-slate-400" />
                      <span>#{tag}</span>
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Quick Edit initial date button */}
          <button
            onClick={() => onEditDateRequest(item)}
            title="ویرایش زمان اولین مطالعه (محاسبه مجدد مراحل بر اساس تاریخ جدید)"
            className="self-end sm:self-start p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit3 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">میزان پیشرفت در چرخه ابینگهاوس:</span>
            <span className="font-bold text-slate-800">
              {toPersianDigits(progressPercent)}٪
              <span className="text-slate-400 text-[11px] font-normal mr-1">
                ({toPersianDigits(item.completedStages)} از {toPersianDigits(TOTAL_STAGES)} مرحله)
              </span>
            </span>
          </div>

          {/* Graphical Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted
                  ? 'bg-emerald-500'
                  : isDue
                  ? 'bg-gradient-to-l from-rose-500 to-amber-500'
                  : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 5 Step Indicator Dots */}
          <div className="grid grid-cols-5 gap-1 pt-1">
            {STAGES.map((st) => {
              const isDone = item.completedStages >= st.stageNumber;
              const isCurrent = !isCompleted && item.completedStages + 1 === st.stageNumber;
              return (
                <div
                  key={st.stageNumber}
                  className={`text-center py-1 px-1 rounded-md text-[10px] sm:text-xs transition-colors ${
                    isDone
                      ? 'bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/50'
                      : isCurrent
                      ? isDue
                        ? 'bg-rose-100 text-rose-800 font-bold border border-rose-300'
                        : 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                      : 'bg-slate-50 text-slate-400'
                  }`}
                  title={`${st.title}: ${st.description}`}
                >
                  <div className="truncate">مرحله {toPersianDigits(st.stageNumber)}</div>
                  <div className="text-[9px] text-slate-400 truncate">
                    {st.stageNumber === 1 && '۹ ساعت'}
                    {st.stageNumber === 2 && '۲۴ ساعت'}
                    {st.stageNumber === 3 && '۴۸ ساعت'}
                    {st.stageNumber === 4 && '۷ روز'}
                    {st.stageNumber === 5 && '۳۰ روز'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Retention Strength Badge */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>استحکام یادگیری:</span>
            </div>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-md border ${retentionInfo.badge}`}
            >
              {retentionInfo.label}
            </span>
          </div>
        </div>

        {/* Visual Forgetting Probability Indicator (Ebbinghaus Decay Curve) */}
        <div
          className={`p-3 rounded-xl border flex flex-col gap-2.5 transition-all ${
            forgettingInfo.riskLevel === 'critical'
              ? 'bg-rose-50/90 border-rose-300 ring-1 ring-rose-200'
              : forgettingInfo.riskLevel === 'warning'
              ? 'bg-amber-50/90 border-amber-200'
              : forgettingInfo.riskLevel === 'consolidated'
              ? 'bg-emerald-50/80 border-emerald-200'
              : 'bg-teal-50/80 border-teal-200'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-start gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs mt-0.5 ${
                  forgettingInfo.riskLevel === 'critical'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : forgettingInfo.riskLevel === 'warning'
                    ? 'bg-amber-500 text-white'
                    : forgettingInfo.riskLevel === 'consolidated'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-teal-600 text-white'
                }`}
              >
                {forgettingInfo.riskLevel === 'critical' ? (
                  <Flame className="w-4 h-4" />
                ) : forgettingInfo.riskLevel === 'warning' ? (
                  <AlertTriangle className="w-4 h-4" />
                ) : forgettingInfo.riskLevel === 'consolidated' ? (
                  <Award className="w-4 h-4" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-800">
                    شاخص احتمال فراموشی (نمودار ابینگهاوس):
                  </span>
                  <span
                    className={`font-black text-xs px-2 py-0.5 rounded-md ${
                      forgettingInfo.riskLevel === 'critical'
                        ? 'bg-rose-200/90 text-rose-950 font-bold'
                        : forgettingInfo.riskLevel === 'warning'
                        ? 'bg-amber-200/90 text-amber-950 font-bold'
                        : forgettingInfo.riskLevel === 'consolidated'
                        ? 'bg-emerald-200/90 text-emerald-950 font-bold'
                        : 'bg-teal-200/90 text-teal-950 font-bold'
                    }`}
                  >
                    {toPersianDigits(forgettingInfo.forgettingProbability)}٪
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  {forgettingInfo.description}
                </p>
              </div>
            </div>

            {/* Visual Decay Meter */}
            <div className="w-full sm:w-44 flex flex-col gap-1 shrink-0 bg-white p-2 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span>یادآوری: {toPersianDigits(forgettingInfo.retentionRate)}٪</span>
                <span className={forgettingInfo.riskLevel === 'critical' ? 'text-rose-600 font-bold' : ''}>
                  افت: {toPersianDigits(forgettingInfo.forgettingProbability)}٪
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className={`h-full transition-all duration-500 ${
                    forgettingInfo.riskLevel === 'critical'
                      ? 'bg-rose-500'
                      : forgettingInfo.riskLevel === 'warning'
                      ? 'bg-amber-500'
                      : forgettingInfo.riskLevel === 'consolidated'
                      ? 'bg-emerald-500'
                      : 'bg-teal-500'
                  }`}
                  style={{ width: `${forgettingInfo.retentionRate}%` }}
                />
                <div
                  className="h-full bg-rose-200 transition-all duration-500"
                  style={{ width: `${forgettingInfo.forgettingProbability}%` }}
                />
              </div>
              <div className="text-[9px] text-slate-400 text-center mt-0.5">
                {forgettingInfo.riskLevel === 'critical'
                  ? '⚠️ احتمال افت شدید قبل از مرور بعدی'
                  : forgettingInfo.riskLevel === 'warning'
                  ? '⚡ موعد مرور نزدیک است'
                  : '✓ وضعیت ایمن در منحنی حافظه'}
              </div>
            </div>
          </div>
        </div>

        {/* Student Schedule Connection Bar */}
        {isStudentModeActive && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 p-3 rounded-xl bg-slate-50/90 border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <CalendarCheck
                className={`w-4 h-4 shrink-0 ${hasTodayStudyBlock ? 'text-emerald-600' : 'text-slate-400'}`}
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-600 font-medium">وضعیت در برنامه درسی امروز:</span>
                {hasTodayStudyBlock ? (
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
                    ✓ دارای پارت مطالعه فعال در برنامه امروز
                    {todayStudyBlockTime && ` (ساعت ${toPersianDigits(todayStudyBlockTime)} - بدون تداخل)`}
                  </span>
                ) : (
                  <span className="text-slate-500 flex items-center gap-1">
                    {autoAddToTodayEnabled ? (
                      <span className="text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        در نوبت زمان‌بندی خودکار بدون تداخل
                      </span>
                    ) : (
                      'هنوز در برنامه امروز قرار نگرفته'
                    )}
                  </span>
                )}
              </div>
            </div>

            {!isCompleted && !hasTodayStudyBlock && onAddToTodaySchedule && (
              <button
                type="button"
                onClick={() => onAddToTodaySchedule(item)}
                className="self-end sm:self-center px-3 py-1.5 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
                title="افزودن هوشمند به برنامه امروز با پیشگیری خودکار از تداخل با مدرسه و مشغله‌ها"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ افزودن هوشمند به برنامه امروز (بدون تداخل)</span>
              </button>
            )}
          </div>
        )}

        {/* Next Review & Initial Study Info Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
          {/* Initial Date */}
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[11px]">زمان اولین مطالعه / ثبت:</span>
              <span className="font-medium text-slate-800">
                {formatPersianDateTime(item.initialDate)}
              </span>
            </div>
          </div>

          {/* Next Review Date */}
          <div className="flex items-center gap-2 text-slate-600">
            <Clock
              className={`w-4 h-4 shrink-0 ${isDue ? 'text-rose-500' : 'text-blue-500'}`}
            />
            <div>
              <span className="text-slate-400 block text-[11px]">موعد مرور بعدی:</span>
              {isCompleted ? (
                <span className="font-semibold text-emerald-700">
                  تمامی مراحل با موفقیت انجام شد
                </span>
              ) : effectiveReviewDate ? (
                <div>
                  <span className={`font-semibold ${isDue ? 'text-rose-700' : 'text-slate-800'}`}>
                    {formatPersianDateTime(effectiveReviewDate)}
                  </span>
                  {conflict && autoShiftEnabled && (
                    <span className="text-[10px] text-amber-700 block font-medium mt-0.5">
                      (تطبیق‌یافته بر اساس زمان آزاد پس از مشغله)
                    </span>
                  )}
                </div>
              ) : (
                <span>-</span>
              )}
            </div>
          </div>
        </div>

        {/* Conflict & Smart Auto-Shift Alert Box */}
        {conflict && (
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
              hasTodayStudyBlock
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/90 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-start sm:items-center gap-2.5">
              <div
                className={`w-8 h-8 rounded-lg text-white flex items-center justify-center shrink-0 shadow-xs ${
                  hasTodayStudyBlock ? 'bg-emerald-600' : 'bg-amber-500'
                }`}
              >
                {hasTodayStudyBlock ? <CheckCircle className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900">
                    {hasTodayStudyBlock
                      ? `تداخل با «${conflict.busySlot?.title}» برطرف شد:`
                      : `پیشگیری از تداخل با «${conflict.busySlot?.title}»:`}
                  </span>
                  <span className={hasTodayStudyBlock ? 'text-emerald-800 font-medium' : 'text-amber-800 font-medium'}>
                    (مشغله: {toPersianDigits(conflict.busySlot?.startTime || '')} تا {toPersianDigits(conflict.busySlot?.endTime || '')})
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                  {hasTodayStudyBlock && todayStudyBlockTime
                    ? `به دلیل تداخل با مشغله، این مبحث به ساعت ${toPersianDigits(todayStudyBlockTime)} در برنامه درسی امروز منتقل شده و بدون هیچ‌گونه هم‌پوشانی اجرا خواهد شد.`
                    : conflict.explanation}
                </p>
              </div>
            </div>

            <div
              className={`self-end sm:self-center shrink-0 px-2.5 py-1 rounded-lg border text-[11px] font-bold shadow-xs ${
                hasTodayStudyBlock
                  ? 'bg-white text-emerald-800 border-emerald-300'
                  : 'bg-white text-amber-700 border-amber-200'
              }`}
            >
              {hasTodayStudyBlock && todayStudyBlockTime
                ? `زمان زمان‌بندی‌شده: ${toPersianDigits(todayStudyBlockTime)}`
                : `نزدیک‌ترین وقت آزاد: ساعت ${toPersianDigits(formatPersianTime(conflict.adjustedDate))}`}
            </div>
          </div>
        )}

        {/* Memory Consolidation Estimate Box (Requirement 1) */}
        <div
          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition-colors ${
            isCompleted
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-indigo-50/60 border-indigo-200/90 text-indigo-950'
          }`}
        >
          <div className="flex items-start sm:items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-xs ${
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {isCompleted ? <Award className="w-4 h-4" /> : <Target className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-900">
                  {isCompleted
                    ? 'پایان موفقیت‌آمیز دوره تثبیت:'
                    : 'تاریخ تخمینی پایان دوره تثبیت حافظه:'}
                </span>
                <span
                  className={`font-extrabold ${
                    isCompleted ? 'text-emerald-700' : 'text-indigo-700'
                  }`}
                >
                  {consolidation.formattedTargetDate}
                </span>
              </div>
              <p
                className={`text-[11px] mt-0.5 ${
                  isCompleted ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                {consolidation.statusText}
              </p>
            </div>
          </div>

          {!isCompleted && consolidation.remainingDays > 0 && (
            <div className="self-end sm:self-center shrink-0 px-2.5 py-1 bg-white rounded-lg border border-indigo-200 text-[11px] font-bold text-indigo-700 shadow-xs">
              {toPersianDigits(consolidation.remainingDays)} روز تا تثبیت دائمی
            </div>
          )}
        </div>

        {/* Expandable 5-Stage Schedule Timeline */}
        <div>
          <button
            type="button"
            onClick={() => setShowTimeline(!showTimeline)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
          >
            {showTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{showTimeline ? 'بستن جدول زمان‌بندی مراحل' : 'مشاهده جدول زمان‌بندی ۵ مرحله'}</span>
          </button>

          {showTimeline && (
            <div className="mt-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span>زمان‌بندی مرورها بر اساس زمان ثبت اولیه:</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {formatPersianDate(item.initialDate)} - ساعت {formatPersianTime(item.initialDate)}
                </span>
              </div>

              <div className="space-y-1.5">
                {STAGES.map((st) => {
                  const stageTargetDate = calculateStageDate(item.initialDate, st.stageNumber);
                  const isDone = item.completedStages >= st.stageNumber;
                  const isTarget = !isCompleted && item.completedStages + 1 === st.stageNumber;

                  return (
                    <div
                      key={st.stageNumber}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        isDone
                          ? 'bg-emerald-50/60 text-emerald-900 border border-emerald-200/50'
                          : isTarget
                          ? isDue
                            ? 'bg-rose-50 text-rose-900 font-semibold border border-rose-200'
                            : 'bg-blue-50 text-blue-900 font-medium border border-blue-200'
                          : 'bg-white text-slate-600 border border-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : isTarget
                              ? isDue
                                ? 'bg-rose-600 text-white'
                                : 'bg-blue-600 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {toPersianDigits(st.stageNumber)}
                        </span>
                        <div>
                          <span className="font-medium">{st.title}: </span>
                          <span className="text-slate-500 text-[11px]">{st.description}</span>
                        </div>
                      </div>

                      <div className="text-left font-sans text-[11px]">
                        <span>{formatPersianDateTime(stageTargetDate)}</span>
                        {isDone && (
                          <span className="mr-2 text-emerald-700 font-medium">✓ انجام شد</span>
                        )}
                        {isTarget && isDue && (
                          <span className="mr-2 text-rose-600 font-bold">● زمان مرور است!</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            {/* Delete Button */}
            <button
              id={`delete-btn-${item.id}`}
              onClick={() => onDeleteRequest(item)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 active:bg-rose-100 rounded-xl border border-transparent hover:border-rose-200 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>حذف</span>
            </button>

            {/* Add Next Topic/Chapter for this subject */}
            {onAddNextChapter && (
              <button
                type="button"
                onClick={() => onAddNextChapter(item)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl border border-indigo-200/80 transition-all"
                title="ثبت سرفصل یا مبحث بعدی این درس بدون نیاز به اتمام کل کتاب"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ ثبت مبحث بعدی این درس</span>
              </button>
            )}
          </div>

          {/* Confirm Review Button */}
          {isCompleted ? (
            <div className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 rounded-xl border border-emerald-200">
              <CheckCircle className="w-4 h-4" />
              <span>دوره مرور کامل شده است</span>
            </div>
          ) : (
            <button
              id={`confirm-review-btn-${item.id}`}
              onClick={() => onConfirmReview(item.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-xs active:scale-98 ${
                isDue
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-rose-600/30 ring-2 ring-rose-300'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-600/20'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              <span>تایید مرور (انتقال به مرحله بعد)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  Filter,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Settings2,
} from 'lucide-react';
import { TopicItem, STAGES, BusySlot } from '../types';
import {
  getNextReviewDate,
  calculateStageDate,
  isItemDue,
  formatPersianDate,
  toPersianDigits,
  isSameDay,
  getStartOfPersianWeek,
  checkReviewConflict,
} from '../utils/dateUtils';

interface MiniCalendarProps {
  topics: TopicItem[];
  selectedCalendarDay: Date | null;
  onSelectCalendarDay: (day: Date | null) => void;
  busySlots?: BusySlot[];
  autoShiftEnabled?: boolean;
}

type StartMode = 'saturday' | 'today';
type ViewRange = 7 | 14 | 30;

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  topics,
  selectedCalendarDay,
  onSelectCalendarDay,
  busySlots = [],
  autoShiftEnabled = true,
}) => {
  const [startMode, setStartMode] = useState<StartMode>('saturday');
  const [viewRange, setViewRange] = useState<ViewRange>(7);
  const [weekOffset, setWeekOffset] = useState<number>(0); // 0 = current week, 1 = next week, etc.
  const [monthOffset, setMonthOffset] = useState<number>(0); // 0 = current month, 1 = next month, -1 = prev month

  const now = new Date();

  // Compute the starting date based on user configuration & month/week offsets
  const startDate = useMemo(() => {
    let base: Date;
    if (startMode === 'saturday') {
      base = getStartOfPersianWeek(now);
    } else {
      base = new Date(now);
      base.setHours(0, 0, 0, 0);
    }

    if (monthOffset !== 0) {
      base = new Date(base);
      base.setDate(base.getDate() + monthOffset * 30);
    }

    if (weekOffset !== 0) {
      base = new Date(base);
      base.setDate(base.getDate() + weekOffset * 7);
    }
    return base;
  }, [startMode, weekOffset, monthOffset, now]);

  // Current Month/Year label for the displayed date window
  const currentMonthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', year: 'numeric' }).format(startDate);
    } catch (e) {
      return 'برنامه مرورها';
    }
  }, [startDate]);

  // Generate list of days to display
  const calendarDays = useMemo(() => {
    const days: {
      date: Date;
      dayName: string;
      dateNumberStr: string;
      monthStr: string;
      isToday: boolean;
      isPast: boolean;
      dayBusySlots: BusySlot[];
      reviews: {
        topic: TopicItem;
        stage: number;
        reviewDate: Date;
        isDue: boolean;
        isShifted: boolean;
      }[];
    }[] = [];

    const todayZero = new Date(now);
    todayZero.setHours(0, 0, 0, 0);

    for (let i = 0; i < viewRange; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      d.setHours(0, 0, 0, 0);

      const dayOfWeek = d.getDay();
      const dayBusySlots = (busySlots || []).filter(
        (s) => s.isActive && s.daysOfWeek.includes(dayOfWeek)
      );

      const dayName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'short' }).format(d);
      const dateNumberStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric' }).format(d);
      const monthStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' }).format(d);

      // Find all reviews scheduled for this day
      const dayReviews: {
        topic: TopicItem;
        stage: number;
        reviewDate: Date;
        isDue: boolean;
        isShifted: boolean;
      }[] = [];

      topics.forEach((topic) => {
        if (topic.completedStages >= 5) return;

        // Check next review
        const nextReview = getNextReviewDate(topic);
        if (nextReview) {
          const conflict = checkReviewConflict(nextReview, busySlots, now);
          const effectiveDate = conflict && autoShiftEnabled ? conflict.adjustedDate : nextReview;

          if (isSameDay(effectiveDate, d)) {
            dayReviews.push({
              topic,
              stage: topic.completedStages + 1,
              reviewDate: effectiveDate,
              isDue: now.getTime() >= effectiveDate.getTime(),
              isShifted: !!conflict,
            });
          }
        }

        // Also check future stages if viewRange is 14 days
        for (let st = topic.completedStages + 2; st <= 5; st++) {
          const futureDate = calculateStageDate(topic.initialDate, st);
          if (isSameDay(futureDate, d)) {
            dayReviews.push({
              topic,
              stage: st,
              reviewDate: futureDate,
              isDue: false,
              isShifted: false,
            });
          }
        }
      });

      days.push({
        date: d,
        dayName,
        dateNumberStr,
        monthStr,
        isToday: isSameDay(d, now),
        isPast: d < todayZero,
        dayBusySlots,
        reviews: dayReviews,
      });
    }

    return days;
  }, [startDate, viewRange, topics, busySlots, autoShiftEnabled, now]);

  return (
    <div
      id="mini-calendar-panel"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-6 overflow-hidden transition-all"
    >
      {/* Calendar Header & Settings Controls */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                نمای تقویمی مرورهای پیش‌رو
              </h3>
              {selectedCalendarDay && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-200">
                  <Filter className="w-3 h-3" />
                  <span>فیلتر روز: {formatPersianDate(selectedCalendarDay)}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              مشاهده روزهای موعد مرور با نشانگرهای رنگی و تنظیم روز آغازین
            </p>
          </div>
        </div>

        {/* Configuration Toolbar */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {/* Month Navigation with Arrows */}
          <div className="flex items-center gap-1.5 bg-indigo-50/90 border border-indigo-200/90 px-2.5 py-1 rounded-xl text-xs font-bold text-indigo-950 shadow-2xs">
            <button
              type="button"
              onClick={() => setMonthOffset((prev) => prev - 1)}
              className="p-1 text-indigo-700 hover:text-indigo-950 hover:bg-indigo-100 rounded-lg transition-all"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1 text-xs font-extrabold px-1 text-indigo-900">
              <CalendarIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>{toPersianDigits(currentMonthLabel)}</span>
            </div>
            <button
              type="button"
              onClick={() => setMonthOffset((prev) => prev + 1)}
              className="p-1 text-indigo-700 hover:text-indigo-950 hover:bg-indigo-100 rounded-lg transition-all"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {monthOffset !== 0 && (
              <button
                type="button"
                onClick={() => {
                  setMonthOffset(0);
                  setWeekOffset(0);
                }}
                className="mr-1 px-2 py-0.5 text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-md shadow-2xs transition-all"
                title="بازگشت به ماه جاری"
              >
                ماه جاری
              </button>
            )}
          </div>

          {/* Day of week start toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => {
                setStartMode('saturday');
                setWeekOffset(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                startMode === 'saturday'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="آغاز از شنبه (هفته تقویمی استاندارد شمسی)"
            >
              از شنبه (تقویمی)
            </button>
            <button
              onClick={() => {
                setStartMode('today');
                setWeekOffset(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                startMode === 'today'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="آغاز از روز جاری"
            >
              از امروز
            </button>
          </div>

          {/* View range: 7, 14, or 30 days */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setViewRange(7)}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                viewRange === 7
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {toPersianDigits(7)} روز
            </button>
            <button
              onClick={() => setViewRange(14)}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                viewRange === 14
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {toPersianDigits(14)} روز
            </button>
            <button
              onClick={() => setViewRange(30)}
              className={`px-2 py-1 rounded-lg font-medium transition-all ${
                viewRange === 30
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {toPersianDigits(30)} روز (یک ماه)
            </button>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs">
            <button
              onClick={() => setWeekOffset((prev) => prev - 1)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="هفته قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {weekOffset !== 0 ? (
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2 py-0.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
              >
                امروز
              </button>
            ) : (
              <span className="px-1.5 text-[11px] text-slate-500">جاری</span>
            )}
            <button
              onClick={() => setWeekOffset((prev) => prev + 1)}
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              title="هفته بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {selectedCalendarDay && (
            <button
              onClick={() => onSelectCalendarDay(null)}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 px-2 py-1 hover:bg-rose-50 rounded-lg transition-colors"
              title="حذف فیلتر روز"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>نمایش همه</span>
            </button>
          )}
        </div>
      </div>

      {/* Calendar Days Grid */}
      <div className="p-4 sm:p-5">
        <div
          className={`grid gap-2 ${
            viewRange === 7
              ? 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7'
              : 'grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-7'
          }`}
        >
          {calendarDays.map((dayItem, idx) => {
            const isSelected = selectedCalendarDay ? isSameDay(dayItem.date, selectedCalendarDay) : false;
            const hasReviews = dayItem.reviews.length > 0;
            const hasDueReviews = dayItem.reviews.some((r) => r.isDue);

            return (
              <button
                key={idx}
                onClick={() => {
                  if (isSelected) {
                    onSelectCalendarDay(null);
                  } else {
                    onSelectCalendarDay(dayItem.date);
                  }
                }}
                className={`flex flex-col items-center p-2.5 rounded-xl border text-center transition-all relative ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-300 shadow-sm'
                    : dayItem.isToday
                    ? 'border-blue-300 bg-blue-50/50 shadow-xs'
                    : 'border-slate-200/70 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                {/* Today Badge */}
                {dayItem.isToday && (
                  <span className="absolute -top-2 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-xs">
                    امروز
                  </span>
                )}

                {/* Day name */}
                <span className="text-[11px] font-medium text-slate-500">
                  {dayItem.dayName}
                </span>

                {/* Date Number & Month */}
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-base sm:text-lg font-extrabold text-slate-800">
                    {toPersianDigits(dayItem.dateNumberStr)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {dayItem.monthStr}
                  </span>
                </div>

                {/* Review status or count */}
                {hasReviews ? (
                  <div className="w-full space-y-1 mt-1">
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        hasDueReviews
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}
                    >
                      {toPersianDigits(dayItem.reviews.length)} مرور
                    </span>

                    {/* Colored Dots Representing Review Types */}
                    <div className="flex items-center justify-center gap-1 flex-wrap pt-0.5">
                      {dayItem.reviews.slice(0, 4).map((rev, rIdx) => {
                        let dotColor = 'bg-blue-500';
                        if (rev.isDue) dotColor = 'bg-rose-500 animate-pulse';
                        else if (rev.stage === 5) dotColor = 'bg-emerald-500';
                        else if (rev.stage >= 3) dotColor = 'bg-indigo-500';

                        return (
                          <span
                            key={rIdx}
                            className={`w-2 h-2 rounded-full ${dotColor}`}
                            title={`${rev.topic.title} (مرحله ${rev.stage})`}
                          />
                        );
                      })}
                      {dayItem.reviews.length > 4 && (
                        <span className="text-[9px] text-slate-400 font-bold">
                          +{toPersianDigits(dayItem.reviews.length - 4)}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-2">بدون مرور</span>
                )}

                {/* Busy commitments badge for this day */}
                {dayItem.dayBusySlots && dayItem.dayBusySlots.length > 0 && (
                  <div
                    className="w-full mt-1.5 pt-1 border-t border-slate-100/80 flex items-center justify-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium"
                    title={dayItem.dayBusySlots
                      .map((s) => `${s.title} (${toPersianDigits(s.startTime)} تا ${toPersianDigits(s.endTime)})`)
                      .join(' | ')}
                  >
                    <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                    <span className="truncate max-w-[70px] sm:max-w-[85px]">
                      {dayItem.dayBusySlots[0].title}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-500 pt-3 mt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-700">راهنمای نشانگرها:</span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span>موعد رسیده (فوری)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>مراحل اولیه (۱ و ۲)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span>مراحل میانی (۳ و ۴)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>مرحله پایانی (۳۰ روزه - تثبیت ۱۰۰٪)</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 font-medium">
              <Clock className="w-3 h-3 text-amber-600" />
              <span>دارای برنامه مشغله / کلاس</span>
            </span>
          </div>

          <div className="text-slate-400">
            برای فیلتر کردن مطالب هر روز، روی کارت آن روز کلیک کنید.
          </div>
        </div>
      </div>
    </div>
  );
};

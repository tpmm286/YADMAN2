import React, { useState } from 'react';
import { Flame, Clock, Info, CheckCircle, AlertTriangle, Sparkles, Calendar } from 'lucide-react';
import { StudentLesson, GeneratedStudyBlock, BusySlot, StudentRoutineConfig } from '../types';
import { toPersianDigits, PERSIAN_WEEK_DAYS, parseTimeStrToMinutes } from '../utils/dateUtils';

interface WeeklyCognitiveHeatmapProps {
  lessons: StudentLesson[];
  studyBlocks: GeneratedStudyBlock[];
  busySlots?: BusySlot[];
  routine: StudentRoutineConfig;
}

interface ShiftDefinition {
  id: string;
  name: string;
  startMinutes: number;
  endMinutes: number;
  timeRangeLabel: string;
}

const SHIFTS: ShiftDefinition[] = [
  { id: 'morning', name: 'صبح', startMinutes: 7 * 60, endMinutes: 12 * 60, timeRangeLabel: '۰۷:۰۰ - ۱۲:۰۰' },
  { id: 'midday', name: 'ظهر و بعدازظهر', startMinutes: 12 * 60, endMinutes: 17 * 60, timeRangeLabel: '۱۲:۰۰ - ۱۷:۰۰' },
  { id: 'evening', name: 'عصر و غروب', startMinutes: 17 * 60, endMinutes: 21 * 60, timeRangeLabel: '۱۷:۰۰ - ۲۱:۰۰' },
  { id: 'night', name: 'شب', startMinutes: 21 * 60, endMinutes: 24 * 60, timeRangeLabel: '۲۱:۰۰ - ۲۴:۰۰' },
];

export const WeeklyCognitiveHeatmap: React.FC<WeeklyCognitiveHeatmapProps> = ({
  lessons,
  studyBlocks,
  busySlots = [],
  routine,
}) => {
  const [selectedCell, setSelectedCell] = useState<{
    dayName: string;
    shiftName: string;
    minutes: number;
    items: string[];
    level: string;
  } | null>(null);

  // Helper to compute overlapping minutes between two intervals
  const getOverlapMinutes = (startA: number, endA: number, startB: number, endB: number) => {
    const maxStart = Math.max(startA, startB);
    const minEnd = Math.min(endA, endB);
    return Math.max(0, minEnd - maxStart);
  };

  // Matrix construction
  const heatmapData = PERSIAN_WEEK_DAYS.map((day) => {
    const dayLessons = lessons.filter((l) => l.dayOfWeek === day.dayIndex);
    const dayBlocks = studyBlocks.filter((b) => b.dayOfWeek === day.dayIndex);
    const dayBusy = busySlots.filter((s) => s.daysOfWeek.includes(day.dayIndex));

    const shifts = SHIFTS.map((shift) => {
      let totalMinutes = 0;
      const items: string[] = [];

      // Lessons overlap
      dayLessons.forEach((l) => {
        const start = parseTimeStrToMinutes(l.startTime);
        const end = parseTimeStrToMinutes(l.endTime);
        const overlap = getOverlapMinutes(start, end, shift.startMinutes, shift.endMinutes);
        if (overlap > 0) {
          totalMinutes += overlap;
          items.push(`زنگ مدرسه: ${l.subject} (${overlap} دقیقه)`);
        }
      });

      // Study blocks overlap
      dayBlocks.forEach((b) => {
        const start = parseTimeStrToMinutes(b.startTime);
        const end = parseTimeStrToMinutes(b.endTime);
        const overlap = getOverlapMinutes(start, end, shift.startMinutes, shift.endMinutes);
        if (overlap > 0) {
          totalMinutes += overlap;
          items.push(`پارت مطالعه: ${b.title} (${overlap} دقیقه)`);
        }
      });

      // Busy slots overlap
      dayBusy.forEach((s) => {
        const start = parseTimeStrToMinutes(s.startTime);
        const end = parseTimeStrToMinutes(s.endTime);
        const overlap = getOverlapMinutes(start, end, shift.startMinutes, shift.endMinutes);
        if (overlap > 0) {
          totalMinutes += overlap;
          items.push(`مشغله: ${s.title} (${overlap} دقیقه)`);
        }
      });

      // Determine intensity level
      let level: 'free' | 'light' | 'balanced' | 'heavy' | 'overload' = 'free';
      if (totalMinutes === 0) level = 'free';
      else if (totalMinutes <= 60) level = 'light';
      else if (totalMinutes <= 120) level = 'balanced';
      else if (totalMinutes <= 180) level = 'heavy';
      else level = 'overload';

      return {
        shiftId: shift.id,
        shiftName: shift.name,
        timeRangeLabel: shift.timeRangeLabel,
        minutes: totalMinutes,
        level,
        items,
      };
    });

    const dayTotalMinutes = shifts.reduce((acc, s) => acc + s.minutes, 0);

    return {
      dayIndex: day.dayIndex,
      dayName: day.name,
      shifts,
      dayTotalMinutes,
    };
  });

  // Calculate day with max and min load to give smart feedback
  const nonZeroDays = heatmapData.filter((d) => d.dayTotalMinutes > 0);
  const maxDay = nonZeroDays.reduce(
    (max, d) => (d.dayTotalMinutes > max.dayTotalMinutes ? d : max),
    heatmapData[0]
  );
  const minDay = nonZeroDays.reduce(
    (min, d) => (d.dayTotalMinutes < min.dayTotalMinutes ? d : min),
    heatmapData[0]
  );

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 text-slate-800">
      {/* Title & Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
              <span>نقشه حرارتی هفتگی بار شناختی (Weekly Cognitive Heatmap)</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              شناسایی نقاط اوج فشار ذهنی و ساعات خلوت برای ایجاد توازن و تعادل در برنامه درسی
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200" />
            <span className="text-slate-500">آزاد</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300" />
            <span className="text-emerald-800">سبک</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-blue-100 border border-blue-300" />
            <span className="text-blue-800">متعادل</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300" />
            <span className="text-amber-800">سنگین</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-300" />
            <span className="text-rose-800">بسیار بالا</span>
          </div>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[540px]">
          {/* Shift Headers */}
          <div className="grid grid-cols-5 gap-2 text-center text-xs font-bold text-slate-600 mb-2">
            <div className="text-right pr-2">روز هفته</div>
            {SHIFTS.map((s) => (
              <div key={s.id} className="p-1.5 bg-slate-50 rounded-xl border border-slate-100">
                <div>{s.name}</div>
                <div className="text-[9px] text-slate-400 font-normal">{toPersianDigits(s.timeRangeLabel)}</div>
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {heatmapData.map((row) => (
              <div key={row.dayIndex} className="grid grid-cols-5 gap-2 items-center text-xs">
                {/* Day Name & Total */}
                <div className="pr-2">
                  <div className="font-bold text-slate-800">{row.dayName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {row.dayTotalMinutes > 0
                      ? `${toPersianDigits((row.dayTotalMinutes / 60).toFixed(1))} ساعت`
                      : 'کاملاً آزاد'}
                  </div>
                </div>

                {/* 4 Shift Cells */}
                {row.shifts.map((shift) => {
                  let bgClasses = 'bg-slate-50 text-slate-400 border-slate-200';
                  if (shift.level === 'light') bgClasses = 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200';
                  else if (shift.level === 'balanced') bgClasses = 'bg-blue-50 hover:bg-blue-100 text-blue-800 border-blue-200';
                  else if (shift.level === 'heavy') bgClasses = 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-300 font-semibold';
                  else if (shift.level === 'overload') bgClasses = 'bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300 font-bold';

                  return (
                    <button
                      key={shift.shiftId}
                      type="button"
                      onClick={() =>
                        setSelectedCell({
                          dayName: row.dayName,
                          shiftName: shift.shiftName,
                          minutes: shift.minutes,
                          items: shift.items,
                          level: shift.level,
                        })
                      }
                      className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center min-h-[46px] cursor-pointer ${bgClasses}`}
                      title="کلیک برای مشاهده جزئیات فعالیت‌های این بازه"
                    >
                      {shift.minutes > 0 ? (
                        <>
                          <span className="font-mono text-xs">
                            {shift.minutes >= 60
                              ? `${toPersianDigits((shift.minutes / 60).toFixed(1))} س`
                              : `${toPersianDigits(shift.minutes)} د`}
                          </span>
                          <span className="text-[9px] opacity-75">
                            {shift.level === 'overload'
                              ? 'بسیار بالا'
                              : shift.level === 'heavy'
                              ? 'سنگین'
                              : shift.level === 'balanced'
                              ? 'متعادل'
                              : 'سبک'}
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-300">—</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Cell Detail Modal / Toast */}
      {selectedCell && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2 animate-in fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-indigo-600" />
              <span>
                جزئیات بازه {selectedCell.shiftName} ({selectedCell.dayName}):
              </span>
            </span>
            <button
              type="button"
              onClick={() => setSelectedCell(null)}
              className="text-slate-400 hover:text-slate-600 font-bold px-1.5 py-0.5"
            >
              ✕
            </button>
          </div>

          <div className="text-slate-600 text-[11px]">
            {selectedCell.minutes > 0 ? (
              <div className="space-y-1">
                <div>مجموع فعالیت این بازه: <strong>{toPersianDigits(selectedCell.minutes)} دقیقه</strong></div>
                <ul className="list-disc pr-4 space-y-0.5 text-slate-700">
                  {selectedCell.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <span>این بازه کاملاً آزاد بوده و برای استراحت، خواب یا کارهای جانبی رزرو شده است.</span>
            )}
          </div>
        </div>
      )}

      {/* Balancing Advisor Note */}
      <div className="p-3 bg-gradient-to-r from-amber-50/60 to-indigo-50/60 rounded-2xl border border-amber-200/80 text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>راهنمای توازن شناختی برنامه:</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-600">
          روز <strong>«{maxDay.dayName}»</strong> با مجموع {toPersianDigits((maxDay.dayTotalMinutes / 60).toFixed(1))} ساعت بیشترین بار هفتگی را داراست. در صورت احساس خستگی، می‌توانید بخشی از تکالیف را به روز <strong>«{minDay.dayName}»</strong> که سبک‌ترین روز است منتقل نمایید تا از فرسودگی ذهنی جلوگیری شود.
        </p>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TopicItem } from '../types';
import { toPersianDigits, getStartOfPersianWeek } from '../utils/dateUtils';
import { BarChart3, PieChart as PieIcon, Flame, Trophy, TrendingUp, ChevronDown, ChevronUp, Calendar } from 'lucide-react';

interface WeeklyReviewChartProps {
  topics: TopicItem[];
}

const STAGE_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981'];

export const WeeklyReviewChart: React.FC<WeeklyReviewChartProps> = ({ topics }) => {
  const [chartType, setChartType] = useState<'bar' | 'pie'>('bar');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [startDayMode, setStartDayMode] = useState<'saturday' | 'trailing'>('saturday');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // Calculate 7 days data based on start day configuration
  const { dailyData, totalWeeklyReviews, mostActiveDay, stageDistribution } = useMemo(() => {
    const days: { date: Date; dayName: string; shortDate: string; count: number }[] = [];
    const now = new Date();

    if (startDayMode === 'saturday') {
      // Calculate starting Saturday of target week
      const startSat = getStartOfPersianWeek(now);
      if (weekOffset !== 0) {
        startSat.setDate(startSat.getDate() + weekOffset * 7);
      }

      // Generate 7 days from Saturday to Friday
      for (let i = 0; i < 7; i++) {
        const d = new Date(startSat);
        d.setDate(startSat.getDate() + i);
        d.setHours(0, 0, 0, 0);

        const dayName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'short' }).format(d);
        const shortDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'numeric', day: 'numeric' }).format(d);

        days.push({
          date: d,
          dayName,
          shortDate,
          count: 0,
        });
      }
    } else {
      // Trailing 7 days ending today
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i + weekOffset * 7);
        d.setHours(0, 0, 0, 0);

        const dayName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'short' }).format(d);
        const shortDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'numeric', day: 'numeric' }).format(d);

        days.push({
          date: d,
          dayName,
          shortDate,
          count: 0,
        });
      }
    }

    const periodStart = new Date(days[0].date);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(days[days.length - 1].date);
    periodEnd.setHours(23, 59, 59, 999);

    // Count reviews per day and per stage
    const stageCounts = [0, 0, 0, 0, 0]; // stages 1 to 5
    let totalWeekly = 0;

    topics.forEach((topic) => {
      topic.history.forEach((entry) => {
        const reviewDate = new Date(entry.reviewedAt);
        if (reviewDate >= periodStart && reviewDate <= periodEnd) {
          totalWeekly++;

          // Match day
          days.forEach((day) => {
            const startOfDay = new Date(day.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(day.date);
            endOfDay.setHours(23, 59, 59, 999);

            if (reviewDate >= startOfDay && reviewDate <= endOfDay) {
              day.count++;
            }
          });
        }

        // All-time or weekly stage distribution
        if (entry.stage >= 1 && entry.stage <= 5) {
          stageCounts[entry.stage - 1]++;
        }
      });
    });

    // Find best day
    let bestDay = days[0];
    days.forEach((d) => {
      if (d.count > bestDay.count) bestDay = d;
    });

    const pieData = [
      { name: 'مرحله ۱ (۹ ساعت)', value: stageCounts[0], color: STAGE_COLORS[0] },
      { name: 'مرحله ۲ (۲۴ ساعت)', value: stageCounts[1], color: STAGE_COLORS[1] },
      { name: 'مرحله ۳ (۴۸ ساعت)', value: stageCounts[2], color: STAGE_COLORS[2] },
      { name: 'مرحله ۴ (۷ روز)', value: stageCounts[3], color: STAGE_COLORS[3] },
      { name: 'مرحله ۵ (۳۰ روز)', value: stageCounts[4], color: STAGE_COLORS[4] },
    ].filter((item) => item.value > 0);

    return {
      dailyData: days.map((d) => ({
        name: d.dayName,
        fullName: `${d.dayName} (${toPersianDigits(d.shortDate)})`,
        تعداد: d.count,
      })),
      totalWeeklyReviews: totalWeekly,
      mostActiveDay: bestDay.count > 0 ? `${bestDay.dayName} (${toPersianDigits(bestDay.count)} مرور)` : 'هنوز مروری ثبت نشده',
      stageDistribution: pieData.length > 0 ? pieData : [{ name: 'بدون مرور', value: 1, color: '#cbd5e1' }],
    };
  }, [topics, startDayMode, weekOffset]);

  // Motivational message based on activity
  const motivationalMessage = useMemo(() => {
    if (totalWeeklyReviews >= 10) {
      return 'فوق‌العاده است! تداوم مرورهای شما باعث شده اطلاعات در حافظه بلندمدت با بیشترین قدرت تثبیت شوند.';
    }
    if (totalWeeklyReviews >= 5) {
      return 'آفرین! ریتم مرورهای فاصله‌دار شما عالی است. هر کلیک تایید مرور، مانع از فراموشی ۸۰٪ مطالب می‌شود.';
    }
    if (totalWeeklyReviews > 0) {
      return 'شروع خوبی است! با انجام منظم مرورهای هفتگی، مسیر یادگیری دائمی خود را هموارتر کنید.';
    }
    return 'مرورهای این هفته هنوز شروع نشده‌اند. با انجام اولین مرورهای موعدرسیده، نمودار پیشرفت خود را بسازید!';
  }, [totalWeeklyReviews]);

  return (
    <div
      id="weekly-analytics-panel"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-6 overflow-hidden transition-all"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                گزارش انگیزه و تحلیل مرورها
              </h3>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
                <Flame className="w-3 h-3 text-amber-500" />
                <span>{toPersianDigits(totalWeeklyReviews)} مرور در این دوره</span>
              </span>
            </div>
            <p className="text-xs text-slate-500">
              تنظیم شروع هفته از شنبه برای حفظ نظم و ساختار تقویمی نمودار
            </p>
          </div>
        </div>

        {/* Controls: Start Day Selector & Chart Type toggle & Collapse button */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
          {/* Start day setting */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => {
                setStartDayMode('saturday');
                setWeekOffset(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                startDayMode === 'saturday'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="نمودار مرتب از شنبه آغاز می‌شود (شنبه تا جمعه)"
            >
              شروع از شنبه (مرتب)
            </button>
            <button
              onClick={() => {
                setStartDayMode('trailing');
                setWeekOffset(0);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                startDayMode === 'trailing'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="نمایش ۷ روز اخیر منتهی به امروز"
            >
              ۷ روز اخیر
            </button>
          </div>

          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                chartType === 'bar'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>ستونی</span>
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                chartType === 'pie'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>توزیع مراحل</span>
            </button>
          </div>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title={isCollapsed ? 'نمایش نمودار' : 'بستن نمودار'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Top Motivator Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">مجموع مرورهای این هفته:</span>
                <span className="text-base font-bold text-blue-900">
                  {toPersianDigits(totalWeeklyReviews)} نوبت مرور
                </span>
              </div>
            </div>

            <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-slate-500 block">فعال‌ترین روز هفته:</span>
                <span className="text-base font-bold text-amber-900">
                  {mostActiveDay}
                </span>
              </div>
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-100 flex items-center gap-3 md:col-span-1">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] text-slate-500 block">وضعیت پایداری حافظه:</span>
                <span className="text-xs font-semibold text-emerald-900 truncate block">
                  {totalWeeklyReviews > 0 ? 'در حال تقویت و تثبیت' : 'نیازمند مرور مداوم'}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Rendering */}
          <div className="h-60 sm:h-64 w-full pt-2">
            {chartType === 'bar' ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'Vazirmatn' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-700 space-y-0.5">
                            <p className="font-bold text-blue-300">{data.fullName}</p>
                            <p>
                              تعداد مرورها:{' '}
                              <strong className="text-emerald-400">
                                {toPersianDigits(data.تعداد)} نوبت
                              </strong>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="تعداد"
                    fill="#3b82f6"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={45}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col sm:flex-row items-center justify-around gap-4">
                <div className="h-48 w-48 sm:h-56 sm:w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stageDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stageDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0];
                            return (
                              <div className="bg-slate-900 text-white text-xs px-3 py-2 rounded-xl shadow-lg border border-slate-700">
                                <span className="font-bold">{data.name}: </span>
                                <span className="text-emerald-400">
                                  {toPersianDigits(Number(data.value) || 0)} بار
                                </span>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Pie legend */}
                <div className="flex flex-wrap sm:flex-col gap-2 text-xs text-slate-700">
                  {stageDistribution.map((st, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: st.color }}
                      />
                      <span className="font-medium">{st.name}:</span>
                      <span className="text-slate-500 font-bold">
                        {toPersianDigits(st.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Motivational Footer Note */}
          <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex items-center justify-between">
            <p className="leading-relaxed">
              💡 <strong>پیام انگیزشی:</strong> {motivationalMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TopicItem } from '../types';
import { toPersianDigits, getStartOfPersianWeek } from '../utils/dateUtils';
import {
  BarChart3,
  Calendar,
  Clock,
  TrendingUp,
  Award,
  CheckCircle2,
  Brain,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

interface ReviewPerformanceBarChartProps {
  topics: TopicItem[];
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

const STAGE_COLORS = {
  stage1: '#3b82f6', // Blue (9h)
  stage2: '#06b6d4', // Cyan (24h)
  stage3: '#8b5cf6', // Purple (48h)
  stage4: '#ec4899', // Pink (7d)
  stage5: '#10b981', // Emerald (30d)
};

const PERSIAN_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

export const ReviewPerformanceBarChart: React.FC<ReviewPerformanceBarChartProps> = ({ topics }) => {
  const [period, setPeriod] = useState<PeriodType>('daily');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showStageBreakdown, setShowStageBreakdown] = useState(true);

  // Extract all review events from topics history
  const allReviews = useMemo(() => {
    const list: {
      topicId: string;
      title: string;
      stage: number;
      date: Date;
      category?: string;
      difficulty?: string;
    }[] = [];

    topics.forEach((topic) => {
      if (topic.history && topic.history.length > 0) {
        topic.history.forEach((h) => {
          const d = new Date(h.reviewedAt);
          if (!isNaN(d.getTime())) {
            list.push({
              topicId: topic.id,
              title: topic.title,
              stage: h.stage,
              date: d,
              category: topic.category,
              difficulty: topic.difficulty,
            });
          }
        });
      }
    });

    return list;
  }, [topics]);

  // Total completed reviews across all time
  const totalCompletedReviewsCount = allReviews.length;

  // Total consolidated topics (Stage 5)
  const consolidatedCount = useMemo(() => {
    return topics.filter((t) => t.completedStages >= 5).length;
  }, [topics]);

  // Compute dataset for selected period
  const { chartData, periodSummary } = useMemo(() => {
    const now = new Date();

    if (period === 'daily') {
      // 7 Days of current Persian week
      const startSat = getStartOfPersianWeek(now);
      const daysData: {
        key: string;
        label: string;
        fullLabel: string;
        total: number;
        stage1: number;
        stage2: number;
        stage3: number;
        stage4: number;
        stage5: number;
      }[] = [];

      for (let i = 0; i < 7; i++) {
        const d = new Date(startSat);
        d.setDate(startSat.getDate() + i);
        d.setHours(0, 0, 0, 0);

        const endD = new Date(d);
        endD.setHours(23, 59, 59, 999);

        const dayName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { weekday: 'short' }).format(d);
        const shortDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'numeric', day: 'numeric' }).format(d);

        let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0;
        let total = 0;

        allReviews.forEach((rev) => {
          if (rev.date >= d && rev.date <= endD) {
            total++;
            if (rev.stage === 1) s1++;
            else if (rev.stage === 2) s2++;
            else if (rev.stage === 3) s3++;
            else if (rev.stage === 4) s4++;
            else if (rev.stage === 5) s5++;
          }
        });

        daysData.push({
          key: `day_${i}`,
          label: dayName,
          fullLabel: `${dayName} (${toPersianDigits(shortDate)})`,
          total,
          stage1: s1,
          stage2: s2,
          stage3: s3,
          stage4: s4,
          stage5: s5,
        });
      }

      const totalPeriodReviews = daysData.reduce((acc, curr) => acc + curr.total, 0);
      const bestDay = [...daysData].sort((a, b) => b.total - a.total)[0];

      return {
        chartData: daysData,
        periodSummary: {
          periodLabel: 'هفته جاری (شنبه تا جمعه)',
          totalReviews: totalPeriodReviews,
          average: Math.round((totalPeriodReviews / 7) * 10) / 10,
          peak: bestDay && bestDay.total > 0 ? `${bestDay.fullLabel} با ${toPersianDigits(bestDay.total)} مرور` : 'هنوز رکوردی ثبت نشده',
        },
      };
    } else if (period === 'weekly') {
      // Past 5 Weeks
      const weeksData: {
        key: string;
        label: string;
        fullLabel: string;
        total: number;
        stage1: number;
        stage2: number;
        stage3: number;
        stage4: number;
        stage5: number;
      }[] = [];

      for (let w = 4; w >= 0; w--) {
        const weekStart = getStartOfPersianWeek(now);
        weekStart.setDate(weekStart.getDate() - w * 7);
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const startStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short', day: 'numeric' }).format(weekStart);
        const endStr = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short', day: 'numeric' }).format(weekEnd);

        const label = w === 0 ? 'هفته جاری' : w === 1 ? 'هفته قبل' : `${toPersianDigits(w)} هفته پیش`;
        const fullLabel = `${label} (${toPersianDigits(startStr)} تا ${toPersianDigits(endStr)})`;

        let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0;
        let total = 0;

        allReviews.forEach((rev) => {
          if (rev.date >= weekStart && rev.date <= weekEnd) {
            total++;
            if (rev.stage === 1) s1++;
            else if (rev.stage === 2) s2++;
            else if (rev.stage === 3) s3++;
            else if (rev.stage === 4) s4++;
            else if (rev.stage === 5) s5++;
          }
        });

        weeksData.push({
          key: `week_${w}`,
          label,
          fullLabel,
          total,
          stage1: s1,
          stage2: s2,
          stage3: s3,
          stage4: s4,
          stage5: s5,
        });
      }

      const totalPeriodReviews = weeksData.reduce((acc, curr) => acc + curr.total, 0);
      const bestWeek = [...weeksData].sort((a, b) => b.total - a.total)[0];

      return {
        chartData: weeksData,
        periodSummary: {
          periodLabel: '۵ هفته اخیر',
          totalReviews: totalPeriodReviews,
          average: Math.round((totalPeriodReviews / 5) * 10) / 10,
          peak: bestWeek && bestWeek.total > 0 ? `${bestWeek.label} با ${toPersianDigits(bestWeek.total)} مرور` : 'هنوز رکوردی ثبت نشده',
        },
      };
    } else {
      // Past 6 Solar Hijri Months
      const monthsData: {
        key: string;
        label: string;
        fullLabel: string;
        total: number;
        stage1: number;
        stage2: number;
        stage3: number;
        stage4: number;
        stage5: number;
      }[] = [];

      for (let m = 5; m >= 0; m--) {
        const d = new Date(now);
        d.setMonth(d.getMonth() - m);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);

        const endD = new Date(d);
        endD.setMonth(d.getMonth() + 1);
        endD.setDate(0);
        endD.setHours(23, 59, 59, 999);

        const monthName = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'long', year: 'numeric' }).format(d);
        const shortMonth = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short' }).format(d);

        let s1 = 0, s2 = 0, s3 = 0, s4 = 0, s5 = 0;
        let total = 0;

        allReviews.forEach((rev) => {
          if (rev.date >= d && rev.date <= endD) {
            total++;
            if (rev.stage === 1) s1++;
            else if (rev.stage === 2) s2++;
            else if (rev.stage === 3) s3++;
            else if (rev.stage === 4) s4++;
            else if (rev.stage === 5) s5++;
          }
        });

        monthsData.push({
          key: `month_${m}`,
          label: shortMonth,
          fullLabel: monthName,
          total,
          stage1: s1,
          stage2: s2,
          stage3: s3,
          stage4: s4,
          stage5: s5,
        });
      }

      const totalPeriodReviews = monthsData.reduce((acc, curr) => acc + curr.total, 0);
      const bestMonth = [...monthsData].sort((a, b) => b.total - a.total)[0];

      return {
        chartData: monthsData,
        periodSummary: {
          periodLabel: '۶ ماه اخیر',
          totalReviews: totalPeriodReviews,
          average: Math.round((totalPeriodReviews / 6) * 10) / 10,
          peak: bestMonth && bestMonth.total > 0 ? `${bestMonth.fullLabel} با ${toPersianDigits(bestMonth.total)} مرور` : 'هنوز رکوردی ثبت نشده',
        },
      };
    }
  }, [allReviews, period]);

  // Custom tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataItem = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white text-xs p-3 rounded-xl shadow-xl border border-slate-700 min-w-[190px] space-y-2">
          <div className="font-bold border-b border-slate-700 pb-1.5 text-blue-300">
            {dataItem.fullLabel || label}
          </div>
          <div className="flex items-center justify-between font-bold text-sm">
            <span>مجموع مرورهای موفق:</span>
            <span className="text-emerald-400">{toPersianDigits(dataItem.total)} مرور</span>
          </div>
          {dataItem.total > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-800 text-[11px]">
              <div className="flex items-center justify-between text-blue-400">
                <span>مرحله ۱ (۹ ساعت):</span>
                <span>{toPersianDigits(dataItem.stage1)}</span>
              </div>
              <div className="flex items-center justify-between text-cyan-400">
                <span>مرحله ۲ (۲۴ ساعت):</span>
                <span>{toPersianDigits(dataItem.stage2)}</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>مرحله ۳ (۴۸ ساعت):</span>
                <span>{toPersianDigits(dataItem.stage3)}</span>
              </div>
              <div className="flex items-center justify-between text-pink-400">
                <span>مرحله ۴ (۷ روز):</span>
                <span>{toPersianDigits(dataItem.stage4)}</span>
              </div>
              <div className="flex items-center justify-between text-emerald-400">
                <span>مرحله ۵ (۳۰ روز - تثبیت):</span>
                <span>{toPersianDigits(dataItem.stage5)}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="review-performance-bar-chart"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-xs mb-6 overflow-hidden transition-all"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                نمودار مقایسه‌ای مرورهای موفق ابینگهاوس
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-200/60">
                {period === 'daily' ? 'بازه روزانه' : period === 'weekly' ? 'بازه هفتگی' : 'بازه ماهانه'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مقایسه تعداد تکرارهای فاصله‌دار انجام‌شده و پیشرفت مراحل در بازه‌های زمانی مختلف
            </p>
          </div>
        </div>

        {/* Controls & Period Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Tabs */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === 'daily'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              روزانه (هفته)
            </button>
            <button
              type="button"
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === 'weekly'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هفتگی
            </button>
            <button
              type="button"
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                period === 'monthly'
                  ? 'bg-white text-indigo-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ماهانه
            </button>
          </div>

          {/* Toggle breakdown */}
          <button
            type="button"
            onClick={() => setShowStageBreakdown(!showStageBreakdown)}
            className={`p-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all ${
              showStageBreakdown
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="نمایش یا پنهان‌سازی تفکیک مراحل مرور"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">تفکیک ۵ مرحله</span>
          </button>

          {/* Collapse Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title={isCollapsed ? 'باز کردن پنل' : 'بستن پنل'}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Summary Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>مرورهای این بازه</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
              </div>
              <div className="text-lg font-extrabold text-slate-800">
                {toPersianDigits(periodSummary.totalReviews)}
                <span className="text-[11px] font-normal text-slate-400 mr-1">مرور</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>میانگین دوره</span>
                <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="text-lg font-extrabold text-slate-800">
                {toPersianDigits(periodSummary.average)}
                <span className="text-[11px] font-normal text-slate-400 mr-1">
                  {period === 'daily' ? 'در روز' : period === 'weekly' ? 'در هفته' : 'در ماه'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>کل مرورهای تاریخچه</span>
                <Brain className="w-3.5 h-3.5 text-purple-600" />
              </div>
              <div className="text-lg font-extrabold text-slate-800">
                {toPersianDigits(totalCompletedReviewsCount)}
                <span className="text-[11px] font-normal text-slate-400 mr-1">مرور موفق</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200/70">
              <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
                <span>تثبیت‌شده در مرحله ۵</span>
                <Award className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-lg font-extrabold text-emerald-700">
                {toPersianDigits(consolidatedCount)}
                <span className="text-[11px] font-normal text-slate-400 mr-1">مبحث دائمی</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Canvas */}
          <div className="h-64 sm:h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => toPersianDigits(val)}
                />
                <Tooltip content={<CustomTooltip />} />
                {showStageBreakdown ? (
                  <>
                    <Bar dataKey="stage1" name="مرحله ۱ (۹ ساعت)" stackId="a" fill={STAGE_COLORS.stage1} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="stage2" name="مرحله ۲ (۲۴ ساعت)" stackId="a" fill={STAGE_COLORS.stage2} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="stage3" name="مرحله ۳ (۴۸ ساعت)" stackId="a" fill={STAGE_COLORS.stage3} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="stage4" name="مرحله ۴ (۷ روز)" stackId="a" fill={STAGE_COLORS.stage4} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="stage5" name="مرحله ۵ (۳۰ روز)" stackId="a" fill={STAGE_COLORS.stage5} radius={[4, 4, 0, 0]} />
                  </>
                ) : (
                  <Bar
                    dataKey="total"
                    name="مجموع مرورهای موفق"
                    fill="#6366f1"
                    radius={[6, 6, 0, 0]}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stage Legend and Peak Highlight */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
            {/* Legend */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-500 font-medium">راهنمای رنگ مراحل:</span>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS.stage1 }} />
                <span>م۱ (۹h)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS.stage2 }} />
                <span>م۲ (۲۴h)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS.stage3 }} />
                <span>م۳ (۴۸h)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS.stage4 }} />
                <span>م۴ (۷d)</span>
              </div>
              <div className="flex items-center gap-1 text-[11px]">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS.stage5 }} />
                <span>م۵ (۳۰d)</span>
              </div>
            </div>

            {/* Peak activity summary */}
            <div className="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-800">بیشترین رکورد: </span>
              <span>{periodSummary.peak}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

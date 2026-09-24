import React, { useState, useMemo } from 'react';
import {
  PieChart as PieIcon,
  TrendingUp,
  Activity,
  Award,
  Sparkles,
  Brain,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { toPersianDigits } from '../utils/dateUtils';
import { TopicItem, TOTAL_STAGES, GeneratedStudyBlock, StudentScore } from '../types';

interface MemoryConsolidationPieChartProps {
  dueCount: number;
  inProgressCount: number;
  completedCount: number;
  totalCount: number;
  topics?: TopicItem[];
  isStudentModeActive?: boolean;
  generatedStudyBlocks?: GeneratedStudyBlock[];
  studentScores?: StudentScore[];
  onOpenScoresModal?: () => void;
}

const COLORS = {
  completed: '#10b981', // Emerald for long-term consolidated memory
  inProgress: '#3b82f6', // Blue for in-progress active review
};

export const MemoryConsolidationPieChart: React.FC<MemoryConsolidationPieChartProps> = ({
  dueCount,
  inProgressCount,
  completedCount,
  totalCount,
  topics = [],
  isStudentModeActive,
  generatedStudyBlocks = [],
  studentScores = [],
  onOpenScoresModal,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'forecast' | 'performance'>('donut');

  // Percentage calculation
  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const inProgressPercent = totalCount > 0 ? 100 - completedPercent : 0;

  const donutChartData = [
    {
      name: 'تثبیت‌شده در حافظه بلندمدت',
      value: completedCount,
      percent: completedPercent,
      color: COLORS.completed,
    },
    {
      name: 'در حال مرور و یادگیری',
      value: inProgressCount,
      percent: inProgressPercent,
      color: COLORS.inProgress,
    },
  ];

  // 7-day memory retention forecast calculation based on Ebbinghaus forgetting curve
  const forecastData = useMemo(() => {
    const baseRetention = totalCount > 0
      ? Math.round(
          ((completedCount * 100) +
            topics.reduce((acc, t) => acc + (t.completedStages / TOTAL_STAGES) * 80, 0)) /
            (totalCount || 1)
        )
      : 85;

    const days = [
      { label: 'امروز', offset: 0 },
      { label: 'فردا', offset: 1 },
      { label: '+۲ روز', offset: 2 },
      { label: '+۳ روز', offset: 3 },
      { label: '+۴ روز', offset: 4 },
      { label: '+۵ روز', offset: 5 },
      { label: '+۶ روز', offset: 6 },
      { label: '+۷ روز', offset: 7 },
    ];

    return days.map((d) => {
      const withReview = Math.min(97, Math.max(80, Math.round(baseRetention * 0.95 + (d.offset * 0.5))));
      const decayFactor = Math.exp(-d.offset / 3.2);
      const withoutReview = Math.max(25, Math.round(baseRetention * decayFactor));

      return {
        day: d.label,
        'تثبیت با مرور ابینگهاوس': withReview,
        'زوال بدون مرور (منحنی فراموشی)': withoutReview,
      };
    });
  }, [topics, completedCount, totalCount]);

  // Custom tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 text-xs font-sans transition-colors"
          dir="rtl"
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <span className="font-bold text-slate-800">{data.name}</span>
          </div>
          <div className="text-slate-600 flex items-center justify-between gap-3">
            <span>تعداد مطالب:</span>
            <span className="font-bold text-slate-900">{toPersianDigits(data.value)} مطلب</span>
          </div>
          <div className="text-slate-600 flex items-center justify-between gap-3 mt-0.5">
            <span>سهم از کل:</span>
            <span className="font-bold text-indigo-600">{toPersianDigits(data.percent)}٪</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for Line Forecast Chart
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="bg-white p-3.5 rounded-2xl shadow-xl border border-slate-200 text-xs font-sans"
          dir="rtl"
        >
          <div className="font-bold text-slate-900 mb-2 border-b border-slate-100 pb-1 flex items-center justify-between gap-3">
            <span>پیش‌بینی تثبیت حافظه ({label}):</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-4 text-emerald-700">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>با مرور به‌موقع:</span>
              </span>
              <span className="font-bold font-mono text-sm">
                {toPersianDigits(payload[0]?.value)}٪
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-rose-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span>بدون مرور (فراموشی):</span>
              </span>
              <span className="font-bold font-mono text-sm">
                {toPersianDigits(payload[1]?.value)}٪
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      id="stats-charts-card"
      className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition-colors mb-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            {activeChartTab === 'donut' ? <PieIcon className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
              <span>
                {activeChartTab === 'donut'
                  ? 'نمودار دایره‌ای نسبت تثبیت در حافظه بلندمدت'
                  : 'نمودار پیش‌بینی پایداری حافظه در هفته آینده'}
              </span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                {toPersianDigits(completedPercent)}٪ تثبیت دائم
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeChartTab === 'donut'
                ? 'مقایسه درصد موضوعات به پایان رسیده (مرحله ۵) با مباحث در حال تکرار فعال'
                : 'برآورد درصد مطالب پایدار در حافظه بلندمدت با انجام مرورهای ابینگهاوس در برابر زوال طبیعی'}
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setActiveChartTab('donut')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeChartTab === 'donut'
                ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>نسبت فعلی</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveChartTab('forecast')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeChartTab === 'forecast'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>پیش‌بینی ۷ روز آینده</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveChartTab('performance')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeChartTab === 'performance'
                ? 'bg-white text-rose-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>عملکرد و نمرات</span>
          </button>
        </div>
      </div>

      {totalCount === 0 && activeChartTab !== 'performance' ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
          <PieIcon className="w-8 h-8 opacity-40" />
          <span>هنوز موضوعی برای محاسبه شاخص‌های حافظه ثبت نشده است.</span>
        </div>
      ) : activeChartTab === 'donut' ? (
        /* TAB 1: DONUT / PIE CHART */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Donut Chart Container */}
          <div className="md:col-span-5 h-44 sm:h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip content={<CustomPieTooltip />} />
                <Pie
                  data={donutChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={totalCount > 1 && completedCount > 0 && inProgressCount > 0 ? 3 : 0}
                  dataKey="value"
                  stroke="transparent"
                >
                  {donutChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center text inside Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {toPersianDigits(completedPercent)}٪
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                تثبیت کامل
              </span>
            </div>
          </div>

          {/* Detailed Legend & Insights */}
          <div className="md:col-span-7 space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-500 shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    تثبیت‌شده در حافظه بلندمدت (مرحله ۵ تکمیل شده)
                  </div>
                  <div className="text-[11px] text-emerald-800 mt-0.5">
                    اطلاعات به پایداری بالا رسیده و اثر فراموشی ناچیز است
                  </div>
                </div>
              </div>
              <div className="text-left shrink-0">
                <span className="text-sm sm:text-base font-bold text-emerald-700">
                  {toPersianDigits(completedPercent)}٪
                </span>
                <div className="text-[10px] text-slate-500">
                  ({toPersianDigits(completedCount)} مطلب)
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-md bg-blue-500 shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    در حال مرور فعال (مراحل ۱ تا ۵)
                  </div>
                  <div className="text-[11px] text-blue-800 mt-0.5">
                    در چرخه تکرار فاصله‌دار برای جلوگیری از فراموشی
                  </div>
                </div>
              </div>
              <div className="text-left shrink-0">
                <span className="text-sm sm:text-base font-bold text-blue-700">
                  {toPersianDigits(inProgressPercent)}٪
                </span>
                <div className="text-[10px] text-slate-500">
                  ({toPersianDigits(inProgressCount)} مطلب)
                </div>
              </div>
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-medium">
                <span>نسبت تثبیت دائمی به کل محتوا</span>
                <span>{toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} مطلب</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/60">
                <div
                  style={{ width: `${completedPercent}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                />
                <div
                  style={{ width: `${inProgressPercent}%` }}
                  className="bg-blue-500 h-full transition-all duration-500"
                />
              </div>
            </div>

            {/* Integration with Study Schedule */}
            {isStudentModeActive && (
              <div className="mt-4 p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900">تاثیر برنامه درسی امروز روی تثبیت:</span>
                </div>
                {(() => {
                  const reviewBlocks = generatedStudyBlocks.filter(b => b.category === 'ebbinghaus_review');
                  const totalReviewBlocks = reviewBlocks.length;
                  const completedReviewBlocks = reviewBlocks.filter(b => b.isCompleted).length;

                  if (totalReviewBlocks === 0) {
                    return <p className="text-[11px] text-indigo-700">امروز پارت مرور ابینگهاوس در برنامه شما وجود ندارد. به خواندن دروس جدید ادامه دهید.</p>;
                  }

                  return (
                    <div className="space-y-2">
                      <p className="text-[11px] text-indigo-800 leading-relaxed">
                        شما امروز <strong>{toPersianDigits(totalReviewBlocks)}</strong> پارت مرور در برنامه خود دارید. با انجام این پارت‌ها، مطالب در حال تکرار یک قدم به <strong>تثبیت دائم (مرحله ۵)</strong> نزدیک‌تر می‌شوند.
                      </p>
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-indigo-600">پارت‌های انجام شده:</span>
                        <span className={completedReviewBlocks === totalReviewBlocks ? 'text-emerald-600' : 'text-indigo-700'}>
                          {toPersianDigits(completedReviewBlocks)} از {toPersianDigits(totalReviewBlocks)}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-indigo-200/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 transition-all"
                          style={{ width: `${(completedReviewBlocks / totalReviewBlocks) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      ) : activeChartTab === 'forecast' ? (
        /* TAB 2: RETENTION FORECAST LINE CHART */
        <div className="space-y-4 animate-in fade-in">
          <div className="h-56 sm:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={11} unit="٪" tickLine={false} />
                <RechartsTooltip content={<CustomLineTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 11 }}
                  iconType="circle"
                />
                <Line
                  type="monotone"
                  dataKey="تثبیت با مرور ابینگهاوس"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="زوال بدون مرور (منحنی فراموشی)"
                  stroke="#f43f5e"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#f43f5e' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
            <Brain className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>تحلیل علمی نمودار:</strong> در صورت انجام مرورهای زمان‌بندی‌شده، درصد تثبیت مطالب در هفته آینده روی مرز <strong>۹۰ الی ۹۵ درصد</strong> پایدار خواهد ماند. در مقابل، بدون تکرار فاصله‌دار، درصد یادآوری پس از ۷ روز به کمتر از ۳۵ درصد سقوط می‌کند.
            </div>
          </div>
        </div>
      ) : activeChartTab === 'performance' ? (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Award className="w-4 h-4 text-rose-500" />
              تحلیل جامع عملکرد دانش‌آموز
            </h4>
            {onOpenScoresModal && (
              <button
                onClick={onOpenScoresModal}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors"
              >
                ثبت / مشاهده نمرات
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Blocks Completion Analysis */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <h5 className="text-xs font-bold text-slate-700 mb-2">روند اجرای برنامه</h5>
              {isStudentModeActive ? (
                generatedStudyBlocks.length > 0 ? (
                  (() => {
                    const total = generatedStudyBlocks.length;
                    const completed = generatedStudyBlocks.filter(b => b.isCompleted).length;
                    const rate = Math.round((completed / total) * 100);

                    let msg = '';
                    let color = '';

                    if (rate >= 80) {
                      msg = 'عالی! پایبندی شما به برنامه بسیار بالاست.';
                      color = 'text-emerald-700';
                    } else if (rate >= 50) {
                      msg = 'متوسط. سعی کنید زمان‌های تلف‌شده را کاهش دهید و پارت‌ها را کامل کنید.';
                      color = 'text-amber-700';
                    } else {
                      msg = 'ضعیف. میزان اجرای برنامه پایین است. آیا مشغله‌های جانبی (مثل باشگاه و...) زیاد است؟ لطفاً از زمان آنها کم کرده و به مطالعه بیفزایید.';
                      color = 'text-rose-700';
                    }

                    return (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">پارت‌های تیک‌خورده:</span>
                          <span className="font-bold">{completed} از {total} ({rate}٪)</span>
                        </div>
                        <div className={`text-xs p-2 rounded-lg bg-white border border-slate-200/60 ${color}`}>
                          {msg}
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <p className="text-xs text-slate-500">برنامه‌ای تولید نشده است.</p>
                )
              ) : (
                <p className="text-xs text-slate-500">مود دانش‌آموز غیرفعال است.</p>
              )}
            </div>

            {/* Grades Analysis */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <h5 className="text-xs font-bold text-slate-700 mb-2">تحلیل نمرات</h5>
              {studentScores.length > 0 ? (
                (() => {
                  const avg = studentScores.reduce((acc, s) => acc + (s.score / s.maxScore), 0) / studentScores.length;
                  const percentage = Math.round(avg * 100);

                  let msg = '';
                  let color = '';

                  if (percentage >= 85) {
                    msg = 'درصد نمرات شما عالی است. همین روند مطالعه را حفظ کنید.';
                    color = 'text-emerald-700';
                  } else if (percentage >= 60) {
                    msg = 'نمرات شما در سطح متوسط است. پیشنهاد می‌شود ساعات مطالعه (یا هدف‌گذاری در روزهای تعطیل) را افزایش دهید.';
                    color = 'text-amber-700';
                  } else {
                    msg = 'نمرات شما پایین است! روش مطالعه شما نیاز به بازنگری دارد و حتماً باید زمان کارهای غیرضروری را به درس اختصاص دهید (مود امتحانات را روشن کنید).';
                    color = 'text-rose-700';
                  }

                  return (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">میانگین کل نمرات:</span>
                        <span className="font-bold">{percentage}٪</span>
                      </div>
                      <div className={`text-xs p-2 rounded-lg bg-white border border-slate-200/60 ${color}`}>
                        {msg}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <p className="text-xs text-slate-500">نمره‌ای ثبت نشده است. برای تحلیل، نمرات خود را وارد کنید.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

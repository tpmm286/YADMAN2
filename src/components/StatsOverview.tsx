import React, { useState, useMemo } from 'react';
import {
  Clock,
  CheckCircle2,
  BookMarked,
  Layers,
  PieChart as PieIcon,
  TrendingUp,
  Award,
  Sparkles,
  Brain,
  Calendar,
  Activity,
  FileText,
  ShieldCheck,
  Zap,
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
import { TopicItem, TOTAL_STAGES, GeneratedStudyBlock, BusySlot, StudentScore, StudentRoutineConfig } from '../types';

interface StatsOverviewProps {
  dueCount: number;
  inProgressCount: number;
  completedCount: number;
  totalCount: number;
  topics?: TopicItem[];
  isStudentModeActive?: boolean;
  generatedStudyBlocks?: GeneratedStudyBlock[];
  busySlots?: BusySlot[];
  studentRoutine?: StudentRoutineConfig;
  studentScores?: StudentScore[];
  onOpenScoresModal?: () => void;
  onOpenReportModal?: () => void;
}

const COLORS = {
  completed: '#10b981', // Emerald for long-term consolidated memory
  inProgress: '#3b82f6', // Blue for in-progress active review
};

export const StatsOverview: React.FC<StatsOverviewProps> = ({
  dueCount,
  inProgressCount,
  completedCount,
  totalCount,
  topics = [],
  isStudentModeActive,
  generatedStudyBlocks = [],
  busySlots = [],
  studentRoutine,
  studentScores = [],
  onOpenScoresModal,
  onOpenReportModal,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'donut' | 'forecast' | 'performance'>('donut');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Percentage calculation (percentage of consolidated in long-term memory vs in-progress active reviews)
  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const inProgressPercent = totalCount > 0 ? 100 - completedPercent : 0;

  // Calculation of monthly checkmark success rate and long-term memory retention estimate
  const retentionEstimate = useMemo(() => {
    const totalBlocks = generatedStudyBlocks.length;
    const completedBlocks = generatedStudyBlocks.filter((b) => b.isCompleted).length;
    const checkRate = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 85;

    // Stage progression weight (each completed stage gives 20% baseline consolidation)
    const stageSum = topics.reduce((acc, t) => acc + (t.completedStages / TOTAL_STAGES) * 100, 0);
    const avgStageProgress = topics.length > 0 ? Math.round(stageSum / topics.length) : 80;

    // Estimated Long-term Retention Rate
    const rawScore = isStudentModeActive && totalBlocks > 0
      ? Math.round(checkRate * 0.4 + avgStageProgress * 0.6)
      : Math.round(avgStageProgress * 0.85 + 10);

    const score = Math.min(98, Math.max(15, rawScore));

    let status = 'پایدار و عالی';
    let statusColor = 'text-emerald-700 bg-emerald-100 border-emerald-300';
    let description = 'نرخ تیک‌های موفق و مرورهای شما در سطح ایده‌آل است؛ احتمال فراموشی کمتر از ۱۰٪ خواهد بود.';

    if (score < 50) {
      status = 'خطر زوال حافظه';
      statusColor = 'text-rose-700 bg-rose-100 border-rose-300';
      description = 'به دلیل تیک نخوردن پارت‌های مرور و فاصله افتادن بین تکرارها، احتمال زوال بخش زیادی از مطالب وجود دارد.';
    } else if (score < 75) {
      status = 'متوسط - نیازمند استمرار';
      statusColor = 'text-amber-700 bg-amber-100 border-amber-300';
      description = 'پایبندی به پارت‌های مرور در سطح متوسط است. با تیک زدن پارت‌های باقی‌مانده، ماندگاری را افزایش دهید.';
    }

    return {
      score,
      checkRate,
      avgStageProgress,
      completedBlocks,
      totalBlocks,
      status,
      statusColor,
      description,
    };
  }, [generatedStudyBlocks, topics, isStudentModeActive]);

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
    // Baseline retention metrics
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
      // With spaced repetitions: each scheduled review maintains retention high (90-95%)
      const withReview = Math.min(97, Math.max(80, Math.round(baseRetention * 0.95 + (d.offset * 0.5))));
      // Without reviews: classic Ebbinghaus decay exponential factor R = e^(-t/S)
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
    <div className="mb-6 space-y-3 sm:space-y-4">
      {/* Header with Collapse Toggle */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <Activity className="w-5 h-5" />
          </div>
          <h2 className="text-sm sm:text-base font-black text-slate-900 leading-none">وضعیت یادگیری و حافظه</h2>
        </div>
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-[11px] font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
        >
          {isCollapsed ? 'نمایش آمار' : 'بستن آمار'}
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* 4 Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* Ready for Review */}
            <div
              id="stat-card-due"
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                dueCount > 0
                  ? 'bg-rose-50/70 border-rose-200/80 shadow-xs'
                  : 'bg-white border-slate-200/80 shadow-xs'
              }`}
            >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">آماده مرور فوری</span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                dueCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`text-2xl sm:text-3xl font-bold ${
                dueCount > 0 ? 'text-rose-700' : 'text-slate-800'
              }`}
            >
              {toPersianDigits(dueCount)}
            </span>
            <span className="text-xs text-slate-400">مطلب</span>
          </div>
        </div>

        {/* In Progress */}
        <div
          id="stat-card-inprogress"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">در حال تکرار فعال</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookMarked className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-blue-600">
              {toPersianDigits(inProgressCount)}
            </span>
            <span className="text-xs text-slate-400">مطلب</span>
          </div>
        </div>

        {/* Consolidated Long-term Memory */}
        <div
          id="stat-card-completed"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">تثبیت حافظه بلندمدت</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600">
              {toPersianDigits(completedCount)}
            </span>
            <span className="text-xs text-slate-400">
              ({toPersianDigits(completedPercent)}٪ کل)
            </span>
          </div>
        </div>

        {/* Total Topics */}
        <div
          id="stat-card-total"
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500">کل مطالب ثبت‌شده</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold text-slate-800">
              {toPersianDigits(totalCount)}
            </span>
            <span className="text-xs text-slate-400">مطلب</span>
          </div>
        </div>
      </div>

      {/* NEW WIDGET: Retention Estimate Widget based on monthly checkmark success rate and review stages */}
      <div
        id="retention-estimate-widget"
        className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md relative overflow-hidden border border-indigo-500/20"
      >
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
              <Brain className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <span>تخمین درصد ماندگاری در حافظه بلندمدت</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/20">
                    مبتنی بر تیک‌های ماه گذشته و مراحل طی‌شده
                  </span>
                </h3>
              </div>
              <p className="text-xs text-indigo-200/80 mt-1 leading-relaxed">
                {retentionEstimate.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-indigo-800/60">
            <div className="text-right">
              <div className="text-[10px] text-indigo-300">نرخ ماندگاری پیش‌بینی‌شده</div>
              <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
                {toPersianDigits(retentionEstimate.score)}٪
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${retentionEstimate.statusColor}`}>
                {retentionEstimate.status}
              </div>
              {onOpenReportModal && (
                <button
                  type="button"
                  onClick={onOpenReportModal}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                  title="باز کردن گزارش جامع هفتگی"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-200" />
                  <span>گزارش هوشمند هفتگی</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Progress details */}
        <div className="mt-4 pt-3 border-t border-indigo-800/40 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-indigo-200/90">
          <div className="flex items-center justify-between bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300">تیک‌های موفق پارت‌ها:</span>
            <span className="font-bold text-white font-mono">{toPersianDigits(retentionEstimate.checkRate)}٪</span>
          </div>
          <div className="flex items-center justify-between bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300">میانگین پیشرفت مراحل:</span>
            <span className="font-bold text-white font-mono">{toPersianDigits(retentionEstimate.avgStageProgress)}٪</span>
          </div>
          <div className="flex items-center justify-between bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300">تثبیت دائم (مرحله ۵):</span>
            <span className="font-bold text-emerald-400 font-mono">{toPersianDigits(completedCount)} مطلب</span>
          </div>
          <div className="flex items-center justify-between bg-indigo-950/60 px-3 py-2 rounded-xl border border-indigo-800/40">
            <span className="text-[11px] text-indigo-300">در حال تکرار فعال:</span>
            <span className="font-bold text-cyan-300 font-mono">{toPersianDigits(inProgressCount)} مطلب</span>
          </div>
        </div>
      </div>
    </>
  )}
</div>
);
};

import React, { useRef } from 'react';
import {
  FileText,
  Printer,
  Download,
  X,
  Brain,
  CheckCircle,
  Clock,
  Layers,
  Award,
  Calendar,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  BookOpen,
  Copy,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { TopicItem, StudentLesson, StudentRoutineConfig, GeneratedStudyBlock, TOTAL_STAGES } from '../types';
import { toPersianDigits, formatPersianDateTime, PERSIAN_WEEK_DAYS, formatPersianDate } from '../utils/dateUtils';
import { analyzeStudentSchedule } from '../utils/studentAnalysisUtils';

interface WeeklyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: TopicItem[];
  lessons: StudentLesson[];
  routine: StudentRoutineConfig;
  studyBlocks: GeneratedStudyBlock[];
}

export const WeeklyReportModal: React.FC<WeeklyReportModalProps> = ({
  isOpen,
  onClose,
  topics,
  lessons,
  routine,
  studyBlocks,
}) => {
  const printContentRef = useRef<HTMLDivElement>(null);
  const [copySuccess, setCopySuccess] = React.useState(false);

  if (!isOpen) return null;

  const completedTopics = topics.filter((t) => t.completedStages >= TOTAL_STAGES);
  const inProgressTopics = topics.filter((t) => t.completedStages < TOTAL_STAGES);
  const completedCount = completedTopics.length;
  const inProgressCount = inProgressTopics.length;
  const totalCount = topics.length;
  const completedPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Spaced repetition stages distribution
  const stageCounts = [0, 0, 0, 0, 0, 0];
  topics.forEach((t) => {
    stageCounts[t.completedStages] = (stageCounts[t.completedStages] || 0) + 1;
  });

  // Chart data for comparative active repeating items vs consolidated items
  const stageComparisonData = [
    {
      name: 'مرحله ۱ (+۲۰ دقیقه)',
      shortName: 'مرحله ۱',
      count: stageCounts[0] || 0,
      color: '#3b82f6',
      description: 'مرور بلافاصله پس از یادگیری',
    },
    {
      name: 'مرحله ۲ (+۱ روز)',
      shortName: 'مرحله ۲',
      count: stageCounts[1] || 0,
      color: '#06b6d4',
      description: 'تثبیت حافظه کوتاه‌مدت',
    },
    {
      name: 'مرحله ۳ (+۱ هفته)',
      shortName: 'مرحله ۳',
      count: stageCounts[2] || 0,
      color: '#8b5cf6',
      description: 'انتقال به حافظه میان‌مدت',
    },
    {
      name: 'مرحله ۴ (+۱ ماه)',
      shortName: 'مرحله ۴',
      count: stageCounts[3] || 0,
      color: '#f59e0b',
      description: 'مرحله نهایی پیش از تثبیت دائم',
    },
    {
      name: 'مرحله ۵ (تثبیت دائم)',
      shortName: 'تثبیت دائم',
      count: stageCounts[5] || 0,
      color: '#10b981',
      description: 'ماندگاری دائمی در حافظه بلندمدت',
    },
  ];

  const analysis = analyzeStudentSchedule(lessons, topics, routine, studyBlocks);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyTextReport = () => {
    let report = `📋 گزارش تحلیلی هفتگی تثبیت حافظه و عملکرد درسی\n`;
    report += `📅 تاریخ تولید: ${formatPersianDateTime(new Date())}\n\n`;
    report += `📊 شاخص‌های کلیدی حافظه:\n`;
    report += `• کل موضوعات: ${toPersianDigits(totalCount)} مطلب\n`;
    report += `• تثبیت‌شده در حافظه بلندمدت: ${toPersianDigits(completedCount)} مطلب (${toPersianDigits(completedPercent)}٪)\n`;
    report += `• در حال تکرار فعال: ${toPersianDigits(inProgressCount)} مطلب\n\n`;
    report += `🏫 عملکرد درسی و روتین:\n`;
    report += `• مجموع آموزش و مطالعه: ${toPersianDigits(analysis.totalStudyHours)} ساعت در هفته\n`;
    report += `• مطالعه مفید خانگی: ${toPersianDigits(analysis.totalHomeStudyHours)} ساعت\n`;
    report += `• شاخص خطر فرسودگی ذهنی: ${toPersianDigits(analysis.burnoutIndex)}٪\n`;
    report += `• میانگین خواب شبانه: ${toPersianDigits(analysis.averageSleepHours)} ساعت\n\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `توصیه راهبردی: استمرار مرورهای فعال ابینگهاوس مانع از زوال ۹۰ درصدی اطلاعات در هفته نخست می‌شود.\n`;

    navigator.clipboard.writeText(report).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      {/* Print-specific style block to format clean PDF page */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-report-area, #printable-report-area * {
            visibility: visible;
          }
          #printable-report-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col overflow-hidden"
        dir="rtl"
      >
        {/* Modal Action Header (Excluded in print) */}
        <div className="no-print p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                گزارش هفتگی تحلیلی تثبیت حافظه و برنامه درسی
              </h2>
              <p className="text-xs text-slate-500">
                قابل دانلود مستقیم و ذخیره به عنوان فایل PDF استاندارد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyTextReport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
              title="کپی کردن متن خلاصه گزارش"
            >
              <Copy className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline">{copySuccess ? 'کپی شد!' : 'کپی متن'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs"
              title="چاپ یا ذخیره به صورت PDF"
            >
              <Printer className="w-4 h-4" />
              <span>دانلود / چاپ PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200 transition-colors mr-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Report Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 text-slate-800" id="printable-report-area" ref={printContentRef}>
          {/* Report Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900">
                  سامانه مدیریت و تثبیت حافظه ابینگهاوس
                </h1>
                <p className="text-xs text-slate-600 mt-0.5">
                  کارنامه جامع عملکرد درسی و تثبیت اطلاعات در حافظه بلندمدت (Spaced Repetition)
                </p>
              </div>
            </div>

            <div className="text-left text-xs font-mono text-slate-600 space-y-0.5">
              <div>تاریخ گزارش: {toPersianDigits(formatPersianDateTime(new Date()))}</div>
              <div>وضعیت داده‌ها: آفلاین و رمزنگاری محلی</div>
            </div>
          </div>

          {/* Section 1: Executive KPI Cards */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              ۱. خلاصه شاخص‌های پایداری حافظه و روتین
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">نرخ تثبیت دائم:</span>
                <span className="text-xl sm:text-2xl font-black text-emerald-700 font-mono">
                  {toPersianDigits(completedPercent)}٪
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  ({toPersianDigits(completedCount)} از {toPersianDigits(totalCount)} مطلب)
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">در حال تکرار فعال:</span>
                <span className="text-xl sm:text-2xl font-black text-blue-700 font-mono">
                  {toPersianDigits(inProgressCount)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">مباحث چرخه ۵ مرحله‌ای</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">ساعات مطالعه خانگی:</span>
                <span className="text-xl sm:text-2xl font-black text-indigo-700 font-mono">
                  {toPersianDigits(analysis.totalHomeStudyHours)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">ساعت در طول هفته</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[11px] text-slate-500 block">شاخص فرسودگی ذهنی:</span>
                <span className="text-xl sm:text-2xl font-black text-purple-700 font-mono">
                  {toPersianDigits(analysis.burnoutIndex)}٪
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {analysis.burnoutIndex > 60 ? 'فشار بالا' : 'مطلوب و پایدار'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Spaced Repetition Progression Breakdown & Comparative Chart */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
              <span>۲. نمودار مقایسه‌ای وضعیت مطالب در حال تکرار و تثبیت‌شده‌ها</span>
              <span className="text-[11px] text-indigo-600 font-normal">
                {toPersianDigits(completedCount)} مطلب تثبیت‌شده • {toPersianDigits(inProgressCount)} در حال تکرار
              </span>
            </h3>

            <div className="p-4 sm:p-5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-4">
              {/* Stage Progression Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">مرحله ۱ (+۲۰ دقیقه)</div>
                  <div className="text-base font-bold text-blue-600 mt-1">{toPersianDigits(stageCounts[0] || 0)}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">مرور اولیه</div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">مرحله ۲ (+۱ روز)</div>
                  <div className="text-base font-bold text-cyan-600 mt-1">{toPersianDigits(stageCounts[1] || 0)}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">تثبیت روز اول</div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">مرحله ۳ (+۱ هفته)</div>
                  <div className="text-base font-bold text-purple-600 mt-1">{toPersianDigits(stageCounts[2] || 0)}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">حافظه میان‌مدت</div>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-slate-200 text-center shadow-2xs">
                  <div className="text-[10px] text-slate-500 font-medium">مرحله ۴ (+۱ ماه)</div>
                  <div className="text-base font-bold text-amber-600 mt-1">{toPersianDigits(stageCounts[3] || 0)}</div>
                  <div className="text-[9px] text-slate-400 mt-0.5">پیش‌تثبیت دائم</div>
                </div>

                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-300 text-center col-span-2 sm:col-span-1 shadow-2xs">
                  <div className="text-[10px] text-emerald-800 font-bold">تثبیت دائم (مرحله ۵)</div>
                  <div className="text-base font-black text-emerald-700 mt-1">{toPersianDigits(stageCounts[5] || 0)}</div>
                  <div className="text-[9px] text-emerald-600 mt-0.5">پایداری کامل</div>
                </div>
              </div>

              {/* Comparative Recharts Bar Chart */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-indigo-600" />
                    نمودار مقایسه‌ای حجم مطالب در مراحل چرخه ابینگهاوس
                  </span>
                  <span className="text-slate-500 font-mono text-[11px]">مجموع: {toPersianDigits(totalCount)} مطلب</span>
                </div>
                
                <div className="h-48 sm:h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stageComparisonData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="shortName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} allowDecimals={false} />
                      <RechartsTooltip
                        formatter={(val: any) => [`${toPersianDigits(val)} مطلب`, 'تعداد']}
                        labelFormatter={(label) => `مرحله: ${label}`}
                        contentStyle={{ direction: 'rtl', borderRadius: '12px', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {stageComparisonData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Summary of Stage 5 Consolidated Topics */}
              <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    خلاصه مطالب تثبیت‌شده در حافظه بلندمدت (مرحله ۵):
                  </span>
                  <span className="text-xs font-bold text-emerald-800">
                    {toPersianDigits(completedCount)} مطلب ({toPersianDigits(completedPercent)}٪ از کل)
                  </span>
                </div>

                {completedTopics.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {completedTopics.slice(0, 10).map((t) => (
                      <span
                        key={t.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-[11px] font-semibold text-emerald-900 shadow-2xs"
                      >
                        <span>{t.title}</span>
                        {t.category && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-700">
                            {t.category}
                          </span>
                        )}
                      </span>
                    ))}
                    {completedTopics.length > 10 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-lg bg-emerald-100 text-[11px] font-bold text-emerald-800">
                        + {toPersianDigits(completedTopics.length - 10)} مطلب دیگر
                      </span>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-emerald-700 mt-1">
                    هنوز مطلبی به مرحله ۵ نرسیده است. با تداوم در انجام تیک‌های مرور روزانه، اولین مطالب شما در روزهای آتی تثبیت خواهند شد.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Daily Load and Schedule Analysis Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              ۳. تراز هفتگی بار شناختی و زمان‌بندی روزانه
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">روز هفته</th>
                    <th className="py-2.5 px-3">زنگ‌های کلاسی مدرسه</th>
                    <th className="py-2.5 px-3">پارت‌های مطالعه در منزل</th>
                    <th className="py-2.5 px-3">سطح فشار ذهنی</th>
                    <th className="py-2.5 px-3">وضعیت بار</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {analysis.dailyLoads.map((dl) => {
                    const dayLessons = lessons.filter((l) => l.dayOfWeek === dl.dayIndex);
                    const dayBlocks = studyBlocks.filter((b) => b.dayOfWeek === dl.dayIndex);
                    return (
                      <tr key={dl.dayIndex} className="hover:bg-slate-50/60">
                        <td className="py-2 px-3 font-bold text-slate-800">{dl.dayName}</td>
                        <td className="py-2 px-3">
                          {dayLessons.length > 0
                            ? `${toPersianDigits(dayLessons.length)} زنگ (${dayLessons.map((l) => l.subject).join('، ')})`
                            : 'بدون کلاس رسمی'}
                        </td>
                        <td className="py-2 px-3">
                          {toPersianDigits(dayBlocks.length)} پارت ({toPersianDigits(dl.homeStudyHours)} ساعت)
                        </td>
                        <td className="py-2 px-3 font-mono">{toPersianDigits(dl.loadScore)}٪</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              dl.loadLevel === 'overload'
                                ? 'bg-rose-100 text-rose-800'
                                : dl.loadLevel === 'heavy'
                                ? 'bg-amber-100 text-amber-800'
                                : dl.loadLevel === 'balanced'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {dl.loadLevel === 'overload'
                              ? 'فوق سنگین'
                              : dl.loadLevel === 'heavy'
                              ? 'سنگین'
                              : dl.loadLevel === 'balanced'
                              ? 'متعادل'
                              : 'سبک'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Neuro-cognitive Recommendations */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              ۴. راهبردهای عصب‌شناختی ابینگهاوس برای هفته آینده
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.recommendations.map((rec) => (
                <div key={rec.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <span className="font-bold text-slate-900 block mb-1">• {rec.title}</span>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Report Footer Note */}
          <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>سامانه مرور ابینگهاوس • گزارش ذخیره‌شده به عنوان سند PDF</span>
            <span>طراحی علمی بر مبنای روانشناسی شناختی و منحنی فراموشی هرمان ابینگهاوس</span>
          </div>
        </div>
      </div>
    </div>
  );
};

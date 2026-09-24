import React from 'react';
import { X, Brain, CheckCircle2, TrendingUp, ShieldCheck, Zap, Clock, ArrowLeft } from 'lucide-react';
import { STAGES } from '../types';
import { toPersianDigits } from '../utils/dateUtils';

interface EbbinghausInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EbbinghausInfoModal: React.FC<EbbinghausInfoModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="ebbinghaus-info-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="ebbinghaus-info-modal"
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                رسیدن به بالاترین درجه استحکام در یادآوری
              </h2>
              <p className="text-xs text-slate-500">
                چرا محاسبه خودکار این برنامه مانع از خستگی و فراموشی می‌شود؟
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 text-xs sm:text-sm text-slate-700 leading-relaxed max-h-[75vh] overflow-y-auto">
          {/* Main Problem & Solution */}
          <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 space-y-2.5">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Zap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>حل بزرگترین چالش: حذف بار محاسبات ذهنی</span>
            </div>
            <p className="text-slate-700 leading-relaxed text-xs sm:text-sm">
              محاسبه دستی ساعت‌های ۹، ۲۴، ۴۸، ۱۶۸ و ۷۲۰ برای ده‌ها مطلب در تقویم‌های مختلف برای مغز انسان
              فرساینده است و به همین دلیل اکثر افراد پس از چند روز روش ابینگهاوس را رها می‌کنند. این سامانه
              <strong> تمامی این بار ذهنی را بر دوش می‌گیرد</strong>: شما فقط مطلب را وارد می‌کنید، و سیستم دقیقاً در ثانیه‌ای که مطلب در آستانه فراموشی قرار دارد، با هشدار قرمز آن را به شما یادآوری می‌کند.
            </p>
          </div>

          {/* Graphical SVG Curve Diagram */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                نمودار اثر مرورهای ۵گانه بر ماندگاری حافظه (درصد یادآوری)
              </span>
              <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800">
                تثبیت ۱۰۰٪
              </span>
            </div>

            {/* SVG Visual */}
            <div className="w-full bg-slate-950/60 p-3 rounded-xl border border-slate-800" dir="ltr">
              <svg viewBox="0 0 500 160" className="w-full h-auto text-xs overflow-visible">
                {/* Grid lines */}
                <line x1="40" y1="20" x2="480" y2="20" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="70" x2="480" y2="70" stroke="#334155" strokeDasharray="3 3" />
                <line x1="40" y1="120" x2="480" y2="120" stroke="#334155" strokeDasharray="3 3" />

                {/* Y-axis labels */}
                <text x="5" y="24" fill="#94a3b8" fontSize="10">۱۰۰٪</text>
                <text x="12" y="74" fill="#94a3b8" fontSize="10">۵۰٪</text>
                <text x="18" y="124" fill="#94a3b8" fontSize="10">۰٪</text>

                {/* Red dropping curve without review */}
                <path
                  d="M 40 20 Q 90 115 170 120"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                />
                <text x="80" y="138" fill="#fda4af" fontSize="9" textAnchor="middle">
                  بدون مرور (فراموشی ۷۵٪)
                </text>

                {/* Green Spaced review curves */}
                {/* Stage 1: 9h */}
                <path d="M 40 20 Q 70 70 95 85" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <line x1="95" y1="85" x2="95" y2="20" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx="95" cy="20" r="3.5" fill="#10b981" />

                {/* Stage 2: 24h */}
                <path d="M 95 20 Q 130 55 160 65" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <line x1="160" y1="65" x2="160" y2="20" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx="160" cy="20" r="3.5" fill="#10b981" />

                {/* Stage 3: 48h */}
                <path d="M 160 20 Q 210 45 250 50" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <line x1="250" y1="50" x2="250" y2="20" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx="250" cy="20" r="3.5" fill="#10b981" />

                {/* Stage 4: 7d */}
                <path d="M 250 20 Q 320 35 360 38" fill="none" stroke="#10b981" strokeWidth="2.5" />
                <line x1="360" y1="38" x2="360" y2="20" stroke="#10b981" strokeWidth="2" strokeDasharray="2 2" />
                <circle cx="360" cy="20" r="3.5" fill="#10b981" />

                {/* Stage 5: 30d -> permanent flat line */}
                <path d="M 360 20 Q 430 25 470 26" fill="none" stroke="#10b981" strokeWidth="3" />
                <circle cx="470" cy="26" r="4" fill="#34d399" />

                {/* Timeline labels */}
                <text x="95" y="152" fill="#6ee7b7" fontSize="9" textAnchor="middle">۹ ساعت</text>
                <text x="160" y="152" fill="#6ee7b7" fontSize="9" textAnchor="middle">۲۴ ساعت</text>
                <text x="250" y="152" fill="#6ee7b7" fontSize="9" textAnchor="middle">۴۸ ساعت</text>
                <text x="360" y="152" fill="#6ee7b7" fontSize="9" textAnchor="middle">۷ روز</text>
                <text x="450" y="152" fill="#34d399" fontSize="9" textAnchor="middle">۳۰ روز (ثابت)</text>
              </svg>
            </div>

            <div className="text-[11px] text-slate-300 space-y-1 leading-relaxed">
              <p>
                ● با هر بار تایید مرور در زمان مشخص‌شده، منحنی شیب کمتری پیدا می‌کند و فراموشی کندتر می‌شود.
              </p>
              <p>
                ● پس از مرور پنجم (روز ۳۰)، اطلاعات وارد <strong>حافظه معنایی و بلندمدت پایدار</strong> شده و نیاز به مرورهای مکرر نخواهد داشت.
              </p>
            </div>
          </div>

          {/* Stages Breakdown */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>مراتب استحکام در ۵ مرحله برنامه:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800">مرحله ۱ (۹ ساعت):</span>
                <p className="text-slate-500 mt-0.5">تثبیت اولیه و جلوگیری از سقوط شدید حافظه کوتاه‌مدت.</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800">مرحله ۲ (۲۴ ساعت):</span>
                <p className="text-slate-500 mt-0.5">بازسازی سیناپس‌های عصبی پس از یک چرخه خواب کامل.</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800">مرحله ۳ (۴۸ ساعت):</span>
                <p className="text-slate-500 mt-0.5">تبدیل تدریجی به حافظه میان‌مدت و تعمیق درک مفاهیم.</p>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                <span className="font-bold text-slate-800">مرحله ۴ (۷ روز):</span>
                <p className="text-slate-500 mt-0.5">مقاوم‌سازی داده‌ها در برابر فراموشی ناشی از ورود اطلاعات جدید.</p>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 sm:col-span-2">
                <span className="font-bold text-emerald-900">مرحله ۵ (۳۰ روز) - استحکام نهایی:</span>
                <p className="text-emerald-800 mt-0.5">
                  انتقال کامل به حافظه بلندمدت دائمی. مطلب برای ماه‌ها و سال‌ها با کمترین تلاش بازیابی خواهد شد.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-slate-50/70">
          <span className="text-[11px] text-slate-500">
            تمرکز شما فقط روی یادگیری باشد؛ زمان‌بندی را به سیستم بسپارید.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl transition-all"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertTriangle, ArrowLeft, Clock } from 'lucide-react';
import { toPersianDigits } from '../utils/dateUtils';

interface AlertBannerProps {
  dueCount: number;
  onFilterDue: () => void;
  isFilteredOnDue: boolean;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  dueCount,
  onFilterDue,
  isFilteredOnDue,
}) => {
  if (dueCount === 0) {
    return null;
  }

  return (
    <div
      id="in-app-due-alert"
      className="bg-gradient-to-r from-rose-500/10 via-rose-50 to-orange-50/50 border border-rose-200 rounded-2xl p-4 sm:p-5 shadow-xs mb-6 relative overflow-hidden transition-all"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                زمان مرور {toPersianDigits(dueCount)} مطلب فرارسیده است!
              </h3>
              <span className="px-2.5 py-0.5 text-[11px] font-extrabold bg-rose-100 text-rose-800 rounded-full border border-rose-300/80 whitespace-nowrap shrink-0">
                فوری
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              مطابق منحنی ابینگهاوس، مرور به‌موقع در این ساعات مانع از فراموشی ۸۰ درصدی مطالب
              می‌شود. لطفاً مطالب مشخص‌شده را مرور و تایید کنید.
            </p>
          </div>
        </div>

        <button
          onClick={onFilterDue}
          id="alert-filter-due-btn"
          className={`w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all ${
            isFilteredOnDue
              ? 'bg-rose-600 text-white shadow-xs hover:bg-rose-700'
              : 'bg-white text-rose-800 hover:bg-rose-600 hover:text-white border border-rose-300 shadow-xs'
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">{isFilteredOnDue ? 'در حال نمایش موارد آماده' : 'مشاهده فقط موارد آماده'}</span>
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  );
};

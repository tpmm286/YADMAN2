import React, { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  Dumbbell,
  GraduationCap,
  Briefcase,
  User,
  Check,
  X,
  Zap,
  Info,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { BusySlot } from '../types';
import { PERSIAN_WEEK_DAYS, toPersianDigits, formatMinutesToTimeStr } from '../utils/dateUtils';

interface BusyScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  busySlots: BusySlot[];
  onSaveBusySlots: (slots: BusySlot[]) => void;
  autoShiftEnabled: boolean;
  onToggleAutoShift: (enabled: boolean) => void;
}

export const BusyScheduleModal: React.FC<BusyScheduleModalProps> = ({
  isOpen,
  onClose,
  busySlots,
  onSaveBusySlots,
  autoShiftEnabled,
  onToggleAutoShift,
}) => {
  const [title, setTitle] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]); // Default Sun, Tue, Thu
  const [startTime, setStartTime] = useState('17:30');
  const [endTime, setEndTime] = useState('19:30');
  const [category, setCategory] = useState<'gym' | 'university' | 'work' | 'personal'>('gym');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggleDay = (dayIndex: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((d) => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleSelectPreset = (
    presetTitle: string,
    days: number[],
    start: string,
    end: string,
    cat: 'gym' | 'university' | 'work' | 'personal',
    pri: 'low' | 'medium' | 'high' = 'medium'
  ) => {
    setTitle(presetTitle);
    setSelectedDays(days);
    setStartTime(start);
    setEndTime(end);
    setCategory(cat);
    setPriority(pri);
    setErrorMsg(null);
  };

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('لطفاً عنوان فعالیت را وارد کنید.');
      return;
    }
    if (selectedDays.length === 0) {
      setErrorMsg('حداقل یک روز از روزهای هفته را انتخاب کنید.');
      return;
    }
    if (startTime >= endTime) {
      setErrorMsg('ساعت پایان باید بعد از ساعت شروع باشد.');
      return;
    }

    const newSlot: BusySlot = {
      id: 'busy_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      daysOfWeek: [...selectedDays].sort((a, b) => a - b),
      startTime,
      endTime,
      repeatWeekly: true,
      category,
      isActive: true,
      priority,
    };

    onSaveBusySlots([...busySlots, newSlot]);
    setTitle('');
    setErrorMsg(null);
  };

  const handleDeleteSlot = (id: string) => {
    onSaveBusySlots(busySlots.filter((s) => s.id !== id));
  };

  const handleToggleSlotActive = (id: string) => {
    onSaveBusySlots(
      busySlots.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
    );
  };

  const getCategoryIcon = (cat?: string) => {
    switch (cat) {
      case 'gym':
        return <Dumbbell className="w-4 h-4 text-emerald-500" />;
      case 'university':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case 'work':
        return <Briefcase className="w-4 h-4 text-purple-500" />;
      default:
        return <User className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                مدیریت معذوریت‌ها و ساعات مشغله هفتگی
              </h2>
              <p className="text-xs text-slate-500">
                تنظیم ساعات ثابت دانشگاه، باشگاه، کار و تطبیق هوشمند خودکار مرورها
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Smart Auto-Shift Toggle Banner */}
          <div className="bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-3.5 sm:p-4 rounded-2xl border border-blue-200/80 flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-xl bg-blue-600 text-white shadow-xs shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  یافتن و تطبیق خودکار نزدیک‌ترین زمان آزاد برای مرور
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-600 mt-0.5 leading-relaxed">
                  اگر موعد یک مرحله مرور دقیقاً همزمان با ساعات باشگاه یا کلاس شما بیفتد، سامانه نزدیک‌ترین زمان آزاد خالی (قبل یا بلافاصله پس از اتمام فعالیت) را محاسبه کرده و در لیست قرار می‌دهد.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggleAutoShift(!autoShiftEnabled)}
              className="shrink-0 p-1 text-blue-600 hover:text-blue-700 transition-transform active:scale-95"
              title={autoShiftEnabled ? 'غیرفعال‌سازی تطبیق خودکار' : 'فعال‌سازی تطبیق خودکار'}
            >
              {autoShiftEnabled ? (
                <ToggleRight className="w-8 h-8 text-blue-600" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-slate-400" />
              )}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div>
            <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>الگوهای آماده و پرتکرار:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    'تمرین باشگاه بدنسازی',
                    [0, 2, 4], // یکشنبه، سه‌شنبه، پنج‌شنبه
                    '18:00',
                    '20:00',
                    'gym'
                  )
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 text-slate-700"
              >
                <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                <span>باشگاه (روزهای فرد ۱۸ تا ۲۰)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    'کلاس دانشگاه / مدرسه',
                    [6, 1, 3], // شنبه، دوشنبه، چهارشنبه
                    '08:30',
                    '12:30',
                    'university'
                  )
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 text-slate-700"
              >
                <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                <span>کلاس‌های دانشگاه (صبح ۸:۳۰ تا ۱۲:۳۰)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  handleSelectPreset(
                    'شیفت کاری یا کارآموزی',
                    [6, 0, 1, 2, 3], // شنبه تا چهارشنبه
                    '09:00',
                    '16:30',
                    'work'
                  )
                }
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5 text-slate-700"
              >
                <Briefcase className="w-3.5 h-3.5 text-purple-600" />
                <span>شیفت کاری (۹ تا ۱۶:۳۰)</span>
              </button>
            </div>
          </div>

          {/* Form to Add New Busy Slot */}
          <form onSubmit={handleAddSlot} className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-4">
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-600" />
              <span>افزودن فعالیت یا مشغله جدید</span>
            </h4>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <Info className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-1">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  عنوان معذوریت یا فعالیت:
                </label>
                <input
                  type="text"
                  placeholder="مثال: تمرین باشگاه، کلاس شیمی، شیفت..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  نوع فعالیت:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="gym">🏋️ ورزشی و باشگاه</option>
                  <option value="university">🎓 دانشگاه و مدرسه</option>
                  <option value="work">💼 کار، شیفت و ماموریت</option>
                  <option value="personal">👤 شخصی و خانوادگی</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1" title="اگر درسی وقت گیر شود، فعالیت با اولویت پایین می‌تواند حذف یا جابجا شود.">
                  اولویت (انعطاف‌پذیری):
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="low">🟡 پایین (قابل جایگزینی با درس)</option>
                  <option value="medium">🟠 متوسط (در صورت اجبار جابجا شود)</option>
                  <option value="high">🔴 بالا (غیرقابل تغییر و مهم)</option>
                </select>
              </div>
            </div>

            {/* Days of Week Selector */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                روزهای تکرار در هفته:
              </label>
              <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                {PERSIAN_WEEK_DAYS.map((d) => {
                  const isSelected = selectedDays.includes(d.dayIndex);
                  return (
                    <button
                      key={d.dayIndex}
                      type="button"
                      onClick={() => handleToggleDay(d.dayIndex)}
                      className={`py-1.5 text-center text-xs font-semibold rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d.name.replace('شنبه', 'ش')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot Range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ساعت شروع فعالیت:
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ساعت پایان فعالیت:
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ثبت در برنامه هفتگی</span>
              </button>
            </div>
          </form>

          {/* List of Registered Busy Slots */}
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
              <span>فعالیت‌های ثبت‌شده ({toPersianDigits(busySlots.length)}):</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {busySlots.filter((s) => s.isActive).length} مورد فعال
              </span>
            </h4>

            {busySlots.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-xs">
                هنوز معذوریت یا ساعات مشغله‌ای ثبت نشده است. با استفاده از دکمه‌های الگو بالا یا فرم بالا، ساعت باشگاه یا کلاس‌های خود را ثبت کنید.
              </div>
            ) : (
              <div className="space-y-2">
                {busySlots.map((slot) => {
                  const dayNames = slot.daysOfWeek
                    .map((idx) => PERSIAN_WEEK_DAYS.find((pwd) => pwd.dayIndex === idx)?.name || '')
                    .join('، ');

                  return (
                    <div
                      key={slot.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                        slot.isActive
                          ? 'bg-white border-slate-200 shadow-xs'
                          : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-slate-100 shrink-0">
                          {getCategoryIcon(slot.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-slate-900">
                              {slot.title}
                            </span>
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/80">
                              {toPersianDigits(slot.startTime)} تا {toPersianDigits(slot.endTime)}
                            </span>
                            {slot.priority === 'low' && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-yellow-50 text-yellow-700 border border-yellow-200" title="اولویت پایین">پایین</span>}
                            {slot.priority === 'high' && <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-200" title="اولویت بالا">بالا</span>}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            روزهای: {dayNames}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleSlotActive(slot.id)}
                          className={`p-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                            slot.isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-slate-200 text-slate-600 border-slate-300'
                          }`}
                          title={slot.isActive ? 'فعال (تداخل چک می‌شود)' : 'غیرفعال شده'}
                        >
                          {slot.isActive ? 'فعال' : 'غیرفعال'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="حذف فعالیت"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-200/80 bg-slate-200 rounded-xl transition-colors"
          >
            بستن و اعمال
          </button>
        </div>
      </div>
    </div>
  );
};

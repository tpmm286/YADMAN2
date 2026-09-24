import React, { useState, useEffect } from 'react';
import { X, Calendar, RefreshCw, AlertCircle } from 'lucide-react';
import { TopicItem, STAGES } from '../types';
import {
  toDatetimeLocalValue,
  calculateStageDate,
  formatPersianDateTime,
  toPersianDigits,
} from '../utils/dateUtils';

interface EditDateModalProps {
  item: TopicItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, newInitialDate: string) => void;
}

export const EditDateModal: React.FC<EditDateModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
}) => {
  const [datetimeLocal, setDatetimeLocal] = useState('');

  useEffect(() => {
    if (item) {
      setDatetimeLocal(toDatetimeLocalValue(new Date(item.initialDate)));
    }
  }, [item]);

  if (!isOpen || !item) return null;

  const currentInitialDate = datetimeLocal ? new Date(datetimeLocal) : new Date(item.initialDate);
  const isValidDate = !isNaN(currentInitialDate.getTime());

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidDate) return;
    onSave(item.id, currentInitialDate.toISOString());
    onClose();
  };

  return (
    <div
      id="edit-date-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="edit-date-modal"
        className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden my-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900">
              تغییر تاریخ ثبت / مطالعه اولیه
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div>
            <span className="text-xs text-slate-500 block">عنوان مطلب:</span>
            <span className="text-sm font-bold text-slate-800">{item.title}</span>
          </div>

          <div className="space-y-1.5 bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
            <label className="block text-xs font-semibold text-blue-900">
              تاریخ و ساعت جدید مطالعه اولیه:
            </label>
            <input
              type="datetime-local"
              value={datetimeLocal}
              onChange={(e) => setDatetimeLocal(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            />
            {isValidDate && (
              <div className="text-[11px] text-blue-800 pt-1">
                معادل شمسی: <strong>{formatPersianDateTime(currentInitialDate)}</strong>
              </div>
            )}
          </div>

          {/* Schedule Recalculation Preview */}
          {isValidDate && (
            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700 block">
                محاسبه مجدد زمان مراحل ۵ گانه با تاریخ جدید:
              </span>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1">
                {STAGES.map((st) => {
                  const targetDate = calculateStageDate(currentInitialDate, st.stageNumber);
                  return (
                    <div key={st.stageNumber} className="flex justify-between text-slate-600 py-0.5">
                      <span>{st.title} ({toPersianDigits(st.hoursFromStart)} ساعت بعد):</span>
                      <span className="font-medium text-blue-700">
                        {formatPersianDateTime(targetDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>محاسبه مجدد و ذخیره</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

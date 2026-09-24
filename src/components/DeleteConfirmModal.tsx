import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { TopicItem } from '../types';

interface DeleteConfirmModalProps {
  item: TopicItem | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  item,
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div
      id="delete-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="delete-confirm-modal"
        className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden my-6 p-5 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">آیا از حذف این مطلب مطمئن هستید؟</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              مطلب «<strong>{item.title}</strong>» و سابقه مرورهای ثبت‌شده برای آن به طور کامل پاک
              خواهد شد. این عملیات قابل بازگشت نیست.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            انصراف
          </button>
          <button
            type="button"
            id="confirm-delete-action-btn"
            onClick={() => {
              onConfirm(item.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 rounded-xl transition-all shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>بله، حذف شود</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { X, Plus, Trash2, Edit2, Award, Percent } from 'lucide-react';
import { StudentScore } from '../types';

interface ExamScoresModalProps {
  isOpen: boolean;
  onClose: () => void;
  scores: StudentScore[];
  onSaveScores: (scores: StudentScore[]) => void;
}

export const ExamScoresModal: React.FC<ExamScoresModalProps> = ({
  isOpen,
  onClose,
  scores,
  onSaveScores,
}) => {
  const [subject, setSubject] = useState('');
  const [examName, setExamName] = useState('');
  const [score, setScore] = useState<number | ''>('');
  const [maxScore, setMaxScore] = useState<number | ''>(20);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!subject || score === '' || maxScore === '') return;
    const newScore: StudentScore = {
      id: `score_${Date.now()}`,
      subject,
      examName: examName || 'آزمون',
      score: Number(score),
      maxScore: Number(maxScore),
      date: new Date().toISOString(),
    };
    onSaveScores([...scores, newScore]);
    setSubject('');
    setExamName('');
    setScore('');
    setMaxScore(20);
  };

  const handleDelete = (id: string) => {
    onSaveScores(scores.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">نمرات و ارزیابی‌ها</h2>
              <p className="text-xs text-slate-500 mt-0.5">ثبت نمرات آزمون‌ها برای تحلیل عملکرد</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="text-sm font-bold text-slate-700">ثبت نمره جدید</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">درس:</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="مثلا: ریاضی"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">نام آزمون:</label>
                <input
                  type="text"
                  value={examName}
                  onChange={(e) => setExamName(e.target.value)}
                  placeholder="مثلا: میان‌ترم"
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">نمره کسب شده:</label>
                <input
                  type="number"
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">از سقف نمره:</label>
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={handleAdd}
              disabled={!subject || score === '' || maxScore === ''}
              className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors mt-2"
            >
              <Plus className="w-4 h-4" />
              افزودن نمره
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-700">تاریخچه نمرات</h3>
            {scores.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">هنوز نمره‌ای ثبت نشده است.</p>
            ) : (
              scores.map((s) => {
                const percentage = Math.round((s.score / s.maxScore) * 100);
                return (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{s.subject}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{s.examName}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-mono">
                        {s.score} / {s.maxScore}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                        percentage >= 80 ? 'bg-emerald-100 text-emerald-700' :
                        percentage >= 50 ? 'bg-amber-100 text-amber-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {percentage}%
                      </span>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
};

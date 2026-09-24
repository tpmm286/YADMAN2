import React, { useState, useEffect, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  CheckCircle,
  Coffee,
  Brain,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { GeneratedStudyBlock, StudentRoutineConfig } from '../types';
import { toPersianDigits, PERSIAN_WEEK_DAYS } from '../utils/dateUtils';

interface PomodoroTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  studyBlocks: GeneratedStudyBlock[];
  activeBlockId?: string | null;
  onToggleBlockCompletion: (blockId: string) => void;
  routine: StudentRoutineConfig;
}

type TimerMode = 'study' | 'short_break' | 'long_break';

export const PomodoroTimerModal: React.FC<PomodoroTimerModalProps> = ({
  isOpen,
  onClose,
  studyBlocks,
  activeBlockId,
  onToggleBlockCompletion,
  routine,
}) => {
  const todayIndex = new Date().getDay();
  const todayBlocks = studyBlocks.filter((b) => b.dayOfWeek === todayIndex);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(activeBlockId || null);
  const [mode, setMode] = useState<TimerMode>('study');
  
  // Durations in minutes
  const studyDuration = routine.studyBlockDuration || 50;
  const breakDuration = routine.breakDuration || 10;
  const longBreakDuration = 20;

  const getInitialSeconds = (m: TimerMode) => {
    switch (m) {
      case 'study':
        return studyDuration * 60;
      case 'short_break':
        return breakDuration * 60;
      case 'long_break':
        return longBreakDuration * 60;
    }
  };

  const [timeLeft, setTimeLeft] = useState<number>(getInitialSeconds('study'));
  const [isRunning, setIsRunning] = useState(false);
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCompletionPrompt, setShowCompletionPrompt] = useState(false);

  // Sync selected block when prop changes
  useEffect(() => {
    if (activeBlockId) {
      setSelectedBlockId(activeBlockId);
    } else if (todayBlocks.length > 0 && !selectedBlockId) {
      const firstUncompleted = todayBlocks.find((b) => !b.isCompleted);
      setSelectedBlockId(firstUncompleted ? firstUncompleted.id : todayBlocks[0].id);
    }
  }, [activeBlockId, todayBlocks, selectedBlockId]);

  // Web Audio chime generator (100% offline, zero network requests, mobile-safe)
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(528, audioCtx.currentTime); // 528Hz Solfeggio frequency
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.8);
    } catch {}
  };

  // Main countdown timer interval
  useEffect(() => {
    let interval: any = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      playChime();
      setIsRunning(false);

      if (mode === 'study') {
        setCompletedPomodoros((prev) => prev + 1);
        if (selectedBlockId) {
          setShowCompletionPrompt(true);
        } else {
          // Switch to break automatically
          setMode('short_break');
          setTimeLeft(getInitialSeconds('short_break'));
        }
      } else {
        // Break finished, back to study
        setMode('study');
        setTimeLeft(getInitialSeconds('study'));
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode, selectedBlockId]);

  if (!isOpen) return null;

  const currentBlock = studyBlocks.find((b) => b.id === selectedBlockId);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSwitchMode = (newMode: TimerMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(getInitialSeconds(newMode));
    setShowCompletionPrompt(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(getInitialSeconds(mode));
    setShowCompletionPrompt(false);
  };

  const handleConfirmBlockDone = () => {
    if (selectedBlockId) {
      onToggleBlockCompletion(selectedBlockId);
    }
    setShowCompletionPrompt(false);
    setMode('short_break');
    setTimeLeft(getInitialSeconds('short_break'));
  };

  const totalCurrentModeSeconds = getInitialSeconds(mode);
  const progressPercent = totalCurrentModeSeconds > 0 ? ((totalCurrentModeSeconds - timeLeft) / totalCurrentModeSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div
        className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-5 sm:p-6 flex flex-col items-center text-center relative overflow-hidden"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <Timer className="w-5 h-5" />
          </div>
          <div className="text-right">
            <h2 className="text-base font-bold text-slate-900">تایمر تمرکز پومودورو</h2>
            <p className="text-[11px] text-slate-500">مدیریت زمان جلسات مطالعه و استراحت مغز</p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl mb-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleSwitchMode('study')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'study'
                ? 'bg-white text-indigo-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>مطالعه ({toPersianDigits(studyDuration)} دقیقه)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('short_break')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'short_break'
                ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>استراحت کوتاه ({toPersianDigits(breakDuration)} دقیقه)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchMode('long_break')}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              mode === 'long_break'
                ? 'bg-white text-blue-700 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>استراحت عمیق ({toPersianDigits(longBreakDuration)} دقیقه)</span>
          </button>
        </div>

        {/* Attached Study Block Selector */}
        <div className="w-full bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-5 text-right">
          <label className="text-[11px] text-slate-500 block mb-1 font-semibold flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            <span>پارت مطالعاتی متصل به این تایمر:</span>
          </label>
          <select
            value={selectedBlockId || ''}
            onChange={(e) => setSelectedBlockId(e.target.value || null)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white font-sans text-slate-800"
          >
            <option value="">مطالعه آزاد (بدون اتصال به پارت مشخص)</option>
            {todayBlocks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.isCompleted ? '✓ ' : '○ '}
                {b.title} ({toPersianDigits(b.startTime)} تا {toPersianDigits(b.endTime)})
              </option>
            ))}
          </select>
        </div>

        {/* Circular Display / Big Digits */}
        <div className="relative w-52 h-52 sm:w-56 sm:h-56 flex items-center justify-center mb-5">
          {/* SVG Progress Circle */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="stroke-slate-100"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`transition-all duration-500 ${
                mode === 'study'
                  ? 'stroke-indigo-600'
                  : mode === 'short_break'
                  ? 'stroke-emerald-500'
                  : 'stroke-blue-500'
              }`}
              strokeWidth="6"
              strokeDasharray={276.4}
              strokeDashoffset={276.4 - (276.4 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time digits in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight font-mono">
              {toPersianDigits(formatTime(timeLeft))}
            </span>
            <span className="text-xs text-slate-500 mt-1 font-semibold">
              {mode === 'study' ? 'تمرکز عمیق' : 'استراحت و ریکاوری'}
            </span>
            {currentBlock && (
              <span className="text-[10px] text-indigo-700 max-w-[140px] truncate mt-1">
                {currentBlock.title}
              </span>
            )}
          </div>
        </div>

        {/* Completion Prompt when Study Session Finishes */}
        {showCompletionPrompt && currentBlock && (
          <div className="w-full p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 mb-4 animate-in fade-in space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>پارت مطالعاتی با موفقیت به پایان رسید!</span>
            </div>
            <p className="text-[11px] text-emerald-800">
              آیا مایلید پارت <strong>«{currentBlock.title}»</strong> در برنامه هفتگی به عنوان مطالعه‌شده تیک بخورد؟
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowCompletionPrompt(false)}
                className="px-3 py-1 text-slate-600 hover:bg-slate-200 rounded-xl"
              >
                رد کردن
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockDone}
                className="px-3.5 py-1 bg-emerald-600 text-white font-bold rounded-xl shadow-xs"
              >
                ثبت تیک پارت و شروع استراحت
              </button>
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={handleReset}
            className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200"
            title="بازنشانی زمان"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-3 rounded-2xl text-white font-bold text-sm flex items-center gap-2 shadow-md transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span>مکث</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>شروع تمرکز</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              if (mode === 'study') {
                handleSwitchMode('short_break');
              } else {
                handleSwitchMode('study');
              }
            }}
            className="p-3 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200"
            title="رد کردن به فاز بعدی"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Bar: Sound Chime Toggle & Counter */}
        <div className="w-full pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 hover:text-slate-800 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-indigo-600" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            <span>صدای زنگ: {soundEnabled ? 'فعال' : 'خاموش'}</span>
          </button>

          <div className="flex items-center gap-1 font-semibold">
            <span>پومودوروهای امروز:</span>
            <span className="text-indigo-600 font-mono font-bold">{toPersianDigits(completedPomodoros)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

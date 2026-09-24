import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  X,
  Calendar,
  Clock,
  BookPlus,
  Sparkles,
  AlertCircle,
  FileText,
  RotateCcw,
  Check,
  Tag,
  Folder,
  Plus,
  GraduationCap,
  BookOpen,
  Layers,
  CalendarCheck,
} from 'lucide-react';
import { STAGES, DEFAULT_CATEGORIES, StudentLesson, StudentRoutineConfig, LessonDifficulty } from '../types';
import {
  toDatetimeLocalValue,
  calculateStageDate,
  formatPersianDateTime,
  toPersianDigits,
} from '../utils/dateUtils';

const DRAFT_STORAGE_KEY = 'ebbinghaus_topic_form_draft_v1';

interface TopicFormDraft {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  datetimeLocal: string;
  savedAt: string;
  lessonSubject?: string;
  difficulty?: LessonDifficulty;
  targetStudyMinutes?: number;
  addToScheduleToday?: boolean;
}

// Popular chapters and subtopics for Iranian school and university courses
export const COURSE_SUBTOPIC_PRESETS: Record<string, { chapters: string[]; tags: string[]; category: string }> = {
  'فیزیک': {
    chapters: [
      'فصل ۱: حرکت بر خط راست (سینماتیک)',
      'فصل ۲: دینامیک و قوانین نیوتون',
      'فصل ۳: کار، انرژی و توان',
      'فصل ۴: نوسان، موج و صوت',
      'فصل ۵: فیزیک اتمی و هسته‌ای',
      'الکتریسیته ساکن و خازن‌ها',
      'جریان الکتریکی و مدارهای الکتریکی',
      'مغناطیس و القای الکترومغناطیسی',
      'فشار، چگالی و حالت‌های ماده',
      'دما، گرما و قانون گازها',
    ],
    tags: ['فیزیک', 'فرمول', 'تست', 'مسئله'],
    category: 'درسی و کنکور',
  },
  'شیمی': {
    chapters: [
      'فصل ۱: ساختار اتم، ایزوتوپ‌ها و جدول تناوبی',
      'فصل ۲: استوکیومتری، درصد جرمی و روابط مولی',
      'فصل ۳: ترمودینامیک، آنتالپی و قانون هس',
      'فصل ۴: محلول‌ها، انحلال‌پذیری و مولاریته',
      'فصل ۵: سینتیک و سرعت واکنش‌های شیمیایی',
      'اسیدها، بازها و مفاهیم pH',
      'شیمی آلی، هیدروکربن‌ها و گروه‌های عاملی',
      'الکتروشیمی، اکسایش و کاهش و سلول‌های گالوانی',
    ],
    tags: ['شیمی', 'مفاهیم', 'مسئله', 'کنکور'],
    category: 'درسی و کنکور',
  },
  'زیست‌شناسی': {
    chapters: [
      'فصل ۱: مولکول‌های زیستی، یاخته و بافت‌ها',
      'فصل ۲: گوارش و جذب مواد در انسان و جانوران',
      'فصل ۳: تبادلات گازی و دستگاه تنفس',
      'فصل ۴: گردش مواد، قلب و رگ‌های خونی',
      'فصل ۵: تنظیم اسمزی، کلیه و دفع مواد زائد',
      'فصل ۶: حواس و ساختار دستگاه عصبی',
      'فصل ۷: ژنتیک، تقسیم یاخته (میتوز و میوز)',
      'فصل ۸: فناوری‌های نوین زیستی و جهش ژنتیکی',
      'زیست‌شناسی و فیزیولوژی گیاهی',
    ],
    tags: ['زیست‌شناسی', 'حفظی', 'ترکیبی', 'کنکور'],
    category: 'درسی و کنکور',
  },
  'ریاضی': {
    chapters: [
      'فصل ۱: معادلات، نامعادلات و تعیین علامت',
      'فصل ۲: تابع، دامنه، برد و ترکیب توابع',
      'فصل ۳: مثلثات، روابط زاویه‌ها و معادلات مثلثاتی',
      'فصل ۴: حد، پیوستگی و رفع ابهام',
      'فصل ۵: مشتق، مشتق‌پذیری و فرمول‌های آن',
      'فصل ۶: کاربرد مشتق، اکسترمم‌ها و بهینه‌سازی',
      'فصل ۷: انتگرال نامعین و معین و محاسبه مساحت',
      'هندسه تحلیلی و مقاطع مخروطی',
      'آمار، احتمال شرطی و ترکیبیات',
    ],
    tags: ['ریاضیات', 'فرمول', 'تست', 'تمرین'],
    category: 'درسی و کنکور',
  },
  'حسابان': {
    chapters: [
      'فصل ۱: جبر، معادله و توابع درجه دو و گویا',
      'فصل ۲: تابع و نمودارهای توابع مثلثاتی و نمایی',
      'فصل ۳: مثلثات پیشرفته و فرمول‌های جمع و تفریق',
      'فصل ۴: حد و پیوستگی و مجانب‌های قائم و افقی',
      'فصل ۵: مشتق و قضایای مشتق‌پذیری',
      'فصل ۶: کاربرد مشتق و رسم نمودار تابع',
    ],
    tags: ['حسابان', 'ریاضی', 'فرمول', 'مسئله'],
    category: 'درسی و کنکور',
  },
  'هندسه': {
    chapters: [
      'فصل ۱: ترسیم‌های هندسی، زاویه‌ها و استدلال',
      'فصل ۲: قضیه تالس، تشابه و کاربردها',
      'فصل ۳: روابط طولی در مثلث و دایره',
      'فصل ۴: ماتریس، دترمینان و تبدیلات هندسی',
      'فصل ۵: بردارها، ضرب داخلی و برداری',
      'مقاطع مخروطی (دایره، بیضی، سهمی و هذلولی)',
    ],
    tags: ['هندسه', 'ترسیم', 'قضیه', 'تمرین'],
    category: 'درسی و کنکور',
  },
  'فلسفه و منطق': {
    chapters: [
      'منطق: تعریف، تصور و تصدیق و مغالطات',
      'منطق: قضایا، احکام قضایا و استدلال قیاسی',
      'فلسفه: هستی‌شناسی، وجود و علیت',
      'فلسفه: معرفت‌شناسی و ابزارهای شناخت',
      'فلسفه: سیر اندیشه در جهان اسلام و غرب',
    ],
    tags: ['فلسفه', 'منطق', 'مفاهیم', 'تحلیلی'],
    category: 'درسی و کنکور',
  },
  'ادبیات فارسی': {
    chapters: [
      'مبحث آرایه‌های ادبی (تشبیه، استعاره، ایهام، مجاز)',
      'مبحث دستور زبان، نقش‌های کلمات و گروه‌های اسمی',
      'مبحث قرابت معنایی و درک مفاهیم اشعار',
      'مبحث لغت، واژگان مهم و املای کلمات',
      'مبحث تاریخ ادبیات و سبک‌های شعری',
    ],
    tags: ['ادبیات', 'دستور_زبان', 'قرابت', 'آرایه‌ها'],
    category: 'درسی و کنکور',
  },
  'عربی': {
    chapters: [
      'قواعد ترجمه و فن ترجمه عبارات کنکور',
      'قواعد اعراب و نقش‌های نحوی (فاعل، مفعول، مبتدا)',
      'افعال ثلاثی مجرد و باب‌های مزید',
      'منصوبات (مفعول‌مطلق، مفعول‌فیه، حال، تمییز)',
      'تحلیل صرفی و اعراب کلمات',
      'درک مطلب و متون اختصاصی',
    ],
    tags: ['عربی', 'قواعد', 'ترجمه', 'تست'],
    category: 'درسی و کنکور',
  },
  'زبان انگلیسی': {
    chapters: [
      'گرامر: زمان‌های افعال و افعال مجهول',
      'گرامر: جملات شرطی و عبارات موصولی',
      'واژگان کلیدی ۵۰۴ و واژگان تخصصی کنکور',
      'مهارت‌های درک مطلب (Reading) و کلوزتست',
    ],
    tags: ['انگلیسی', 'گرامر', 'واژگان', 'Reading'],
    category: 'زبان خارجی',
  },
  'دین و زندگی': {
    chapters: [
      'پیام و ارتباط معنایی آیات کتاب درسی',
      'توحید و مراتب آن در زندگی فردی و اجتماعی',
      'معاد و مراحل جهان پس از مرگ',
      'اخلاق اسلامی، توبه و سبک زندگی',
    ],
    tags: ['دینی', 'آیات', 'مفاهیم', 'کنکور'],
    category: 'درسی و کنکور',
  },
};

interface AddTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTopic: (data: {
    title: string;
    description: string;
    category?: string;
    tags?: string[];
    initialDate: string;
    lessonSubject?: string;
    difficulty?: LessonDifficulty;
    targetStudyMinutes?: number;
    addToScheduleToday?: boolean;
  }) => void;
  isStudentModeActive?: boolean;
  studentLessons?: StudentLesson[];
  studentRoutine?: StudentRoutineConfig;
  initialLessonSubject?: string;
  initialTitle?: string;
}

export const AddTopicModal: React.FC<AddTopicModalProps> = ({
  isOpen,
  onClose,
  onAddTopic,
  isStudentModeActive = false,
  studentLessons = [],
  studentRoutine,
  initialLessonSubject,
  initialTitle,
}) => {
  // Read initial values from draft if available
  const [title, setTitle] = useState(() => {
    if (initialTitle) return initialTitle;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        return parsed.title || '';
      }
    } catch {}
    return '';
  });

  const [description, setDescription] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        return parsed.description || '';
      }
    } catch {}
    return '';
  });

  const [category, setCategory] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        return parsed.category || '';
      }
    } catch {}
    return '';
  });

  const [tags, setTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        return parsed.tags || [];
      }
    } catch {}
    return [];
  });

  const [lessonSubject, setLessonSubject] = useState<string>(() => {
    if (initialLessonSubject) return initialLessonSubject;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        return parsed.lessonSubject || '';
      }
    } catch {}
    return '';
  });

  const [difficulty, setDifficulty] = useState<LessonDifficulty>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        return parsed.difficulty || 'medium';
      }
    } catch {}
    return 'medium';
  });

  const [addToScheduleToday, setAddToScheduleToday] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        return parsed.addToScheduleToday ?? true;
      }
    } catch {}
    return true;
  });

  const [targetStudyMinutes, setTargetStudyMinutes] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        return parsed.targetStudyMinutes || (studentRoutine?.studyBlockDuration || 60);
      }
    } catch {}
    return studentRoutine?.studyBlockDuration || 60;
  });

  const [tagInput, setTagInput] = useState('');

  const uniqueLessons = useMemo(() => {
    const set = new Set<string>();
    studentLessons.forEach((l) => {
      if (l.subject?.trim()) set.add(l.subject.trim());
    });
    return Array.from(set);
  }, [studentLessons]);

  const [datetimeLocal, setDatetimeLocal] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed: TopicFormDraft = JSON.parse(saved);
        if (parsed.datetimeLocal) return parsed.datetimeLocal;
      }
    } catch {}
    return toDatetimeLocalValue(new Date());
  });

  const [error, setError] = useState('');
  const [isDraftSaved, setIsDraftSaved] = useState(false);

  const titleInputId = useId();
  const descInputId = useId();
  const dateInputId = useId();
  const categoryInputId = useId();
  const tagInputId = useId();
  const lessonInputId = useId();

  // Matching presets for suggested chapters
  const activeSubjectKey = useMemo(() => {
    const raw = (lessonSubject || '').trim().toLowerCase();
    if (!raw) return 'فیزیک'; // Default suggestion subject
    for (const key of Object.keys(COURSE_SUBTOPIC_PRESETS)) {
      if (raw.includes(key.toLowerCase()) || key.toLowerCase().includes(raw)) {
        return key;
      }
    }
    return 'فیزیک';
  }, [lessonSubject]);

  const currentPresetData = COURSE_SUBTOPIC_PRESETS[activeSubjectKey];

  const handleSelectChapter = (chapterName: string, subjectKey: string) => {
    const data = COURSE_SUBTOPIC_PRESETS[subjectKey];
    setTitle(`${subjectKey}: ${chapterName}`);
    setLessonSubject(subjectKey);
    setCategory(data?.category || 'درسی و کنکور');
    if (data?.tags) {
      const merged = Array.from(new Set([...tags, ...data.tags]));
      setTags(merged);
    }
    setError('');
  };

  // Check if current form has non-empty content
  const hasDraftContent = useMemo(() => {
    return Boolean(
      title.trim() ||
        description.trim() ||
        category.trim() ||
        tags.length > 0 ||
        lessonSubject.trim()
    );
  }, [title, description, category, tags, lessonSubject]);

  // Load draft or initial props when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialLessonSubject) {
        setLessonSubject(initialLessonSubject);
      }
      if (initialTitle) {
        setTitle(initialTitle);
      }
      if (!initialTitle && !initialLessonSubject) {
        try {
          const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
          if (saved) {
            const parsed: TopicFormDraft = JSON.parse(saved);
            if (parsed.title) setTitle(parsed.title);
            if (parsed.description) setDescription(parsed.description);
            if (parsed.category) setCategory(parsed.category);
            if (parsed.tags) setTags(parsed.tags);
            if (parsed.datetimeLocal) setDatetimeLocal(parsed.datetimeLocal);
            if (parsed.lessonSubject) setLessonSubject(parsed.lessonSubject);
            if (parsed.difficulty) setDifficulty(parsed.difficulty);
            if (parsed.targetStudyMinutes) setTargetStudyMinutes(parsed.targetStudyMinutes);
            if (parsed.addToScheduleToday !== undefined) setAddToScheduleToday(parsed.addToScheduleToday);
          }
        } catch {}
      }
    }
  }, [isOpen, initialLessonSubject, initialTitle]);

  // Auto-save draft to localStorage whenever fields change
  useEffect(() => {
    if (
      title.trim() ||
      description.trim() ||
      category.trim() ||
      tags.length > 0 ||
      lessonSubject.trim()
    ) {
      const draft: TopicFormDraft = {
        title,
        description,
        category,
        tags,
        datetimeLocal,
        lessonSubject,
        difficulty,
        targetStudyMinutes,
        addToScheduleToday,
        savedAt: new Date().toISOString(),
      };
      try {
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
        setIsDraftSaved(true);
      } catch (e) {
        console.error('Failed to save draft to localStorage', e);
      }
    } else {
      // Clear draft if fields are completely emptied
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setIsDraftSaved(false);
      } catch {}
    }
  }, [
    title,
    description,
    category,
    tags,
    datetimeLocal,
    lessonSubject,
    difficulty,
    targetStudyMinutes,
    addToScheduleToday,
  ]);

  if (!isOpen) return null;

  const currentInitialDate = datetimeLocal ? new Date(datetimeLocal) : new Date();
  const isValidDate = !isNaN(currentInitialDate.getTime());

  const handleClearDraft = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setTags([]);
    setLessonSubject('');
    setDifficulty('medium');
    setAddToScheduleToday(true);
    setTargetStudyMinutes(studentRoutine?.studyBlockDuration || 60);
    setTagInput('');
    setDatetimeLocal(toDatetimeLocalValue(new Date()));
    setError('');
    setIsDraftSaved(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}
  };

  const handleAddTag = () => {
    const cleanTag = tagInput.trim().replace(/^#/, '');
    if (!cleanTag) return;
    if (!tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('لطفاً عنوان مطلب را وارد کنید (اجباری)');
      return;
    }

    const finalDate = isValidDate ? currentInitialDate : new Date();

    onAddTopic({
      title: trimmedTitle,
      description: description.trim(),
      category: category.trim() || (lessonSubject.trim() ? 'درسی و کنکور' : undefined),
      tags: tags.length > 0 ? tags : undefined,
      initialDate: finalDate.toISOString(),
      lessonSubject: lessonSubject.trim() || undefined,
      difficulty: isStudentModeActive ? difficulty : undefined,
      targetStudyMinutes: isStudentModeActive ? targetStudyMinutes : undefined,
      addToScheduleToday: isStudentModeActive ? addToScheduleToday : false,
    });

    // Clear draft from localStorage on successful submission
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {}

    // Reset form state
    setTitle('');
    setDescription('');
    setCategory('');
    setTags([]);
    setLessonSubject('');
    setDifficulty('medium');
    setAddToScheduleToday(true);
    setTagInput('');
    setDatetimeLocal(toDatetimeLocalValue(new Date()));
    setError('');
    setIsDraftSaved(false);
    onClose();
  };

  const handleSetQuickDate = (hoursAgo: number) => {
    const d = new Date(Date.now() - hoursAgo * 3600 * 1000);
    setDatetimeLocal(toDatetimeLocalValue(d));
  };

  return (
    <div
      id="add-topic-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="add-topic-modal"
        className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden my-6 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BookPlus className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">ثبت مطلب جدید برای مطالعه و مرور</h2>
                {hasDraftContent && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200/80">
                    <FileText className="w-3 h-3" />
                    <span>پیش‌نویس خودکار</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">
                برنامه‌ریزی خودکار ۵ مرحله مرور با منحنی ابینگهاوس و هماهنگی با برنامه درسی
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

        {/* Auto-save status banner */}
        {hasDraftContent && (
          <div className="bg-amber-50/70 px-5 py-2 border-b border-amber-100 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-amber-600" />
              <span>
                متن این فرم به‌صورت خودکار در مرورگر ذخیره می‌شود تا با بستن تصادفی صفحه از دست نرود.
              </span>
            </div>
            <button
              type="button"
              onClick={handleClearDraft}
              className="flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-rose-700 hover:underline shrink-0 mr-2"
              title="پاک کردن اطلاعات پیش‌نویس"
            >
              <RotateCcw className="w-3 h-3" />
              <span>پاک‌کردن پیش‌نویس</span>
            </button>
          </div>
        )}

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Title field */}
          <div className="space-y-1.5">
            <label htmlFor={titleInputId} className="block text-xs font-semibold text-slate-800">
              عنوان مبحث یا فصل <span className="text-rose-500">* (اجباری)</span>
            </label>
            <input
              id={titleInputId}
              type="text"
              placeholder="مثال: فصل ۲ فیزیک (دینامیک و قوانین نیوتون)، فصل ۳ زیست‌شناسی (ژنتیک)..."
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
              autoFocus
            />
          </div>

          {/* Quick Subtopic & Chapter Suggester (Interactive Chapter Selector) */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>پیشنهاد و انتخاب سریع سرفصل‌های کتاب (مانند دینامیک، ژنتیک و...):</span>
              </span>
              <span className="text-[10px] text-slate-500">کلیک برای درج خودکار</span>
            </div>

            {/* Course Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              {Object.keys(COURSE_SUBTOPIC_PRESETS).map((subjKey) => (
                <button
                  key={subjKey}
                  type="button"
                  onClick={() => {
                    setLessonSubject(subjKey);
                    setCategory(COURSE_SUBTOPIC_PRESETS[subjKey].category);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    activeSubjectKey === subjKey
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {subjKey}
                </button>
              ))}
            </div>

            {/* Chapters Cloud for Active Course */}
            {currentPresetData && (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pt-1">
                {currentPresetData.chapters.map((ch, chIdx) => (
                  <button
                    key={chIdx}
                    type="button"
                    onClick={() => handleSelectChapter(ch, activeSubjectKey)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200/90 hover:border-blue-300 text-[11px] font-medium transition-all shadow-2xs text-right"
                  >
                    + {ch}
                  </button>
                ))}
              </div>
            )}

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-slate-200/60 pt-2">
              💡 <span className="font-semibold text-slate-700">پیش‌روی مرحله‌ای کتاب:</span> دروسی نظیر فیزیک، زیست یا شیمی را می‌توانید فصل‌به‌فصل ثبت کنید تا هر مبحث در چرخه ۵ مرحله‌ای ابینگهاوس به تثبیت برسد و مباحث قبلی فراموش نشوند.
            </p>
          </div>

          {/* STUDENT SCHEDULE INTEGRATION SECTION (Displayed if Student Mode is active) */}
          {isStudentModeActive && (
            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-bold text-indigo-950">
                    هماهنگی با برنامه درسی دانش‌آموز
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200/60 text-indigo-900 font-semibold">
                  مود تحصیلی فعال
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Linked Student Lesson / Subject */}
                <div className="space-y-1.5">
                  <label htmlFor={lessonInputId} className="flex items-center gap-1 text-xs font-semibold text-indigo-900">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>کتاب یا درس مربوطه:</span>
                  </label>
                  <input
                    id={lessonInputId}
                    list="student-lesson-suggestions"
                    type="text"
                    placeholder="انتخاب یا تایپ نام درس (مثلاً ریاضی، زیست...)"
                    value={lessonSubject}
                    onChange={(e) => setLessonSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                  <datalist id="student-lesson-suggestions">
                    {uniqueLessons.map((subj, idx) => (
                      <option key={idx} value={subj} />
                    ))}
                    {DEFAULT_CATEGORIES.map((cat, idx) => (
                      <option key={`cat-${idx}`} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* Subject Difficulty (Cognitive Load impact) */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1 text-xs font-semibold text-indigo-900">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>سطح دشواری (بار شناختی):</span>
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setDifficulty('easy')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        difficulty === 'easy'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-indigo-200 hover:bg-emerald-50'
                      }`}
                    >
                      ساده
                    </button>
                    <button
                      type="button"
                      onClick={() => setDifficulty('medium')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        difficulty === 'medium'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-indigo-200 hover:bg-blue-50'
                      }`}
                    >
                      متوسط
                    </button>
                    <button
                      type="button"
                      onClick={() => setDifficulty('hard')}
                      className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                        difficulty === 'hard'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : 'bg-white text-slate-700 border-indigo-200 hover:bg-rose-50'
                      }`}
                    >
                      دشوار
                    </button>
                  </div>
                </div>
              </div>

              {/* Add to today's schedule toggle */}
              <div className="pt-2 border-t border-indigo-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addToScheduleToday}
                    onChange={(e) => setAddToScheduleToday(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 border-indigo-300 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-indigo-950 flex items-center gap-1.5">
                    <CalendarCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>افزودن پارت مطالعه برای این مبحث در برنامه امروز</span>
                  </span>
                </label>

                {addToScheduleToday && (
                  <div className="flex items-center gap-1.5 text-xs text-indigo-900 font-medium">
                    <span>مدت پارت:</span>
                    <select
                      value={targetStudyMinutes}
                      onChange={(e) => setTargetStudyMinutes(Number(e.target.value))}
                      className="px-2 py-1 bg-white border border-indigo-200 rounded-lg text-xs font-bold text-indigo-900"
                    >
                      <option value={30}>۳۰ دقیقه</option>
                      <option value={45}>۴۵ دقیقه</option>
                      <option value={60}>۶۰ دقیقه</option>
                      <option value={75}>۷۵ دقیقه</option>
                      <option value={90}>۹۰ دقیقه</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Category & Tags section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor={categoryInputId} className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                <Folder className="w-3.5 h-3.5 text-blue-600" />
                <span>دسته‌بندی موضوعی <span className="text-slate-400 font-normal">(اختیاری)</span></span>
              </label>
              <input
                id={categoryInputId}
                list="category-suggestions"
                type="text"
                placeholder="انتخاب یا تایپ دسته‌بندی..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
              <datalist id="category-suggestions">
                {DEFAULT_CATEGORIES.map((cat, cIdx) => (
                  <option key={cIdx} value={cat} />
                ))}
              </datalist>
            </div>

            {/* Tags Input */}
            <div className="space-y-1.5">
              <label htmlFor={tagInputId} className="flex items-center gap-1 text-xs font-semibold text-slate-800">
                <Tag className="w-3.5 h-3.5 text-indigo-600" />
                <span>برچسب‌ها (تگ‌ها) <span className="text-slate-400 font-normal">(اختیاری)</span></span>
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id={tagInputId}
                  type="text"
                  placeholder="افزودن برچسب (Enter)..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="p-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 rounded-xl transition-colors shrink-0"
                  title="افزودن برچسب"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Tags list */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[11px] text-slate-400">برچسب‌ها:</span>
              {tags.map((t, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/70"
                >
                  <span>#{t}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="text-indigo-400 hover:text-rose-600 rounded-full"
                    title="حذف این برچسب"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Description field */}
          <div className="space-y-1.5">
            <label htmlFor={descInputId} className="block text-xs font-semibold text-slate-800">
              توضیحات و نکات کلیدی <span className="text-slate-400 font-normal">(اختیاری)</span>
            </label>
            <textarea
              id={descInputId}
              rows={2}
              placeholder="یادداشت‌ها، منابع، صفحات کتاب یا چکیده‌ای برای یادآوری سریع..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none"
            />
          </div>

          {/* Initial Study Date & Time */}
          <div className="space-y-2 bg-blue-50/40 p-3.5 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <label
                htmlFor={dateInputId}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-900"
              >
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>تاریخ و ساعت مطالعه اولیه:</span>
              </label>
              <span className="text-[11px] text-blue-700">
                (پیش‌فرض: زمان فعلی)
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id={dateInputId}
                type="datetime-local"
                value={datetimeLocal}
                onChange={(e) => setDatetimeLocal(e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>

            {/* Quick time selection presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] text-slate-500 ml-1">انتخاب سریع:</span>
              <button
                type="button"
                onClick={() => setDatetimeLocal(toDatetimeLocalValue(new Date()))}
                className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-blue-100/60 text-blue-700 rounded-md border border-blue-200 transition-colors"
              >
                هم‌اکنون
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(10)}
                className="px-2 py-0.5 text-[11px] font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md border border-rose-200 transition-colors"
                title="برای آزمایش حالت آماده مرور (۱۰ ساعت قبل)"
              >
                ۱۰ ساعت پیش (تست حالت آماده مرور)
              </button>
              <button
                type="button"
                onClick={() => handleSetQuickDate(24)}
                className="px-2 py-0.5 text-[11px] font-medium bg-white hover:bg-blue-100/60 text-blue-700 rounded-md border border-blue-200 transition-colors"
              >
                دیروز همین ساعت
              </button>
            </div>

            {/* Converted Persian Solar Date Live Preview */}
            {isValidDate && (
              <div className="text-[11px] text-blue-800 bg-white/80 p-2 rounded-lg border border-blue-100">
                معادل تاریخ شمسی انتخابی: <strong>{formatPersianDateTime(currentInitialDate)}</strong>
              </div>
            )}
          </div>

          {/* Live Preview of Calculated Spaced Review Schedule */}
          {isValidDate && (
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-semibold text-slate-700 block">
                پیش‌نمایش زمان‌بندی مرورهای خودکار بر اساس این تاریخ:
              </span>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-[11px] space-y-1">
                {STAGES.map((st) => {
                  const targetDate = calculateStageDate(currentInitialDate, st.stageNumber);
                  return (
                    <div
                      key={st.stageNumber}
                      className="flex items-center justify-between text-slate-600 py-0.5 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-medium text-slate-800">
                        {st.title} ({toPersianDigits(st.hoursFromStart)} ساعت بعد):
                      </span>
                      <span className="text-blue-700 font-medium">
                        {formatPersianDateTime(targetDate)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-400">
              {isDraftSaved && <span>✓ پیش‌نویس ذخیره شد</span>}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                انصراف
              </button>
              <button
                type="submit"
                id="submit-add-topic-btn"
                className="flex items-center gap-1.5 px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xl shadow-xs shadow-blue-600/30 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>ثبت و شروع برنامه‌ریزی</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

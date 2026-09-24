import React, { useState, useEffect, useMemo } from 'react';
import { TopicItem, FilterStatus, TOTAL_STAGES, ThemeMode, TagMatchMode, BusySlot, StudentLesson, StudentRoutineConfig, GeneratedStudyBlock, StudentScore, GoldenFreeWindow } from './types';
import {
  isItemDue,
  getNextReviewDate,
  calculateStageDate,
  isSameDay,
  formatPersianDateTime,
  formatPersianDate,
  toPersianDigits,
  checkReviewConflict,
  parseTimeStrToMinutes,
  formatMinutesToTimeStr,
} from './utils/dateUtils';
import { STUDENT_PRESETS, DEFAULT_STUDENT_ROUTINE, generateSmartStudyPlan, shiftRemainingBlocks, autoResolveConflicts, detectScheduleConflicts, autoPopulateTopicsFromLessons, scheduleTopicIntoDayWithoutConflict, autoSyncAllDueTopicsToToday } from './utils/studentAnalysisUtils';
import { Navbar } from './components/Navbar';
import { AlertBanner } from './components/AlertBanner';
import { StatsOverview } from './components/StatsOverview';
import { FilterBar } from './components/FilterBar';
import { TopicCard } from './components/TopicCard';
import { AddTopicModal } from './components/AddTopicModal';
import { EditDateModal } from './components/EditDateModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { EbbinghausInfoModal } from './components/EbbinghausInfoModal';
import { WeeklyReviewChart } from './components/WeeklyReviewChart';
import { ReviewPerformanceBarChart } from './components/ReviewPerformanceBarChart';
import { MemoryConsolidationPieChart } from './components/MemoryConsolidationPieChart';
import { MiniCalendar } from './components/MiniCalendar';
import { BackupModal, FullAppData } from './components/BackupModal';
import { BusyScheduleModal } from './components/BusyScheduleModal';
import { StudentScheduleModal } from './components/StudentScheduleModal';
import { StudentScheduleWidget } from './components/StudentScheduleWidget';
import { SchedulePdfExportModal } from './components/SchedulePdfExportModal';
import { PomodoroTimerModal } from './components/PomodoroTimerModal';
import { WeeklyReportModal } from './components/WeeklyReportModal';
import { ExamScoresModal } from './components/ExamScoresModal';
import { FactoryResetModal } from './components/FactoryResetModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LicenseActivationModal } from './components/LicenseActivationModal';
import { evaluateLicenseSystem, LicenseSystemInfo, activateAppWithKey, canExportStudentSchedule } from './utils/licenseUtils';
import { Plus, BookOpen, Sparkles, Inbox, RefreshCw, CheckCircle2, Download, Tag, Folder, Clock, GraduationCap, TrendingUp, ShieldAlert, Zap, CalendarCheck, Lock, KeyRound, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'ebbinghaus_topics_v1';
const THEME_STORAGE_KEY = 'ebbinghaus_theme_v1';
const BUSY_SLOTS_STORAGE_KEY = 'ebbinghaus_busy_slots_v1';
const AUTO_SHIFT_STORAGE_KEY = 'ebbinghaus_auto_shift_v1';
const STUDENT_LESSONS_STORAGE_KEY = 'ebbinghaus_student_lessons_v1';
const STUDENT_MODE_STORAGE_KEY = 'ebbinghaus_student_mode_v1';
const STUDENT_ROUTINE_STORAGE_KEY = 'ebbinghaus_student_routine_v1';
const STUDENT_BLOCKS_STORAGE_KEY = 'ebbinghaus_student_blocks_v1';
const AUTO_ADD_TODAY_STORAGE_KEY = 'ebbinghaus_auto_add_today_schedule_v1';
const ONBOARDING_KEY = 'ebbinghaus_onboarding_v1';

// Initial sample data if storage is empty with rich review history, categories and tags
const INITIAL_DEMO_DATA: TopicItem[] = [
  {
    id: 'demo-1',
    title: 'واژگان کلیدی زبان انگلیسی (درس ۳)',
    description: 'مرور ۵۰ لغت تخصصی همراه با مثال‌های کاربردی در جمله',
    category: 'زبان خارجی',
    tags: ['واژگان', 'انگلیسی', 'تست'],
    // Registered 10 hours ago: Stage 1 is due at +9 hours, so this is ready for review right now!
    initialDate: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
    completedStages: 0,
    history: [],
    createdAt: new Date(Date.now() - 10 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-2',
    title: 'فصل سینتیک شیمی پیش‌دانشگاهی',
    description: 'فرمول‌های سرعت واکنش، نمودارهای انرژی و کاتالیزورها',
    category: 'درسی و کنکور',
    tags: ['شیمی', 'کنکور', 'مسئله'],
    // Registered 28 hours ago: Completed stage 1 yesterday
    initialDate: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
    completedStages: 1,
    history: [
      { stage: 1, reviewedAt: new Date(Date.now() - 19 * 3600 * 1000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-3',
    title: 'قواعد دستوری زبان فارسی (دستور زبان)',
    description: 'انواع صفت، مضاف‌الیه و نقش‌های دستوری در کنکور',
    category: 'درسی و کنکور',
    tags: ['ادبیات', 'دستور_زبان'],
    // Registered 5 days ago, completed stages 1, 2, and 3 across the week
    initialDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
    completedStages: 3,
    history: [
      { stage: 1, reviewedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
      { stage: 2, reviewedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString() },
      { stage: 3, reviewedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'demo-4',
    title: 'فرمول‌های مشتق و انتگرال ریاضی عمومی',
    description: 'قواعد زنجیره‌ای، مشتق توابع مثلثاتی و کسری',
    category: 'برنامه‌نویسی و مهندسی',
    tags: ['ریاضیات', 'فرمول'],
    // Registered 8 days ago, completed stages 1, 2, 3, 4
    initialDate: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
    completedStages: 4,
    history: [
      { stage: 1, reviewedAt: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString() },
      { stage: 2, reviewedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString() },
      { stage: 3, reviewedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString() },
      { stage: 4, reviewedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString() },
    ],
    createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
  },
];

export default function App() {
  // Theme state: 'light' | 'dark' | 'classic' (Requirement 2)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'classic' || saved === 'light') {
        return saved;
      }
    } catch {}
    return 'classic';
  });

  // Apply theme to HTML root element
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}
    const root = document.documentElement;
    root.classList.remove('theme-light', 'theme-dark', 'theme-classic', 'dark');
    root.classList.add(`theme-${theme}`);
    if (theme === 'dark') {
      root.classList.add('dark');
    }
  }, [theme]);

  // Topics state loaded from localStorage
  const [topics, setTopics] = useState<TopicItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error reading localStorage', e);
    }
    return INITIAL_DEMO_DATA;
  });

  // Current time state that ticks to re-evaluate isItemDue in real-time
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Filters & Search
  const [currentFilter, setCurrentFilter] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Multi-tag filtering and matching mode state (Requirement 3)
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagMatchMode, setTagMatchMode] = useState<TagMatchMode>('AND');

  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isBusyModalOpen, setIsBusyModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState(false);
  const [isPomodoroModalOpen, setIsPomodoroModalOpen] = useState(false);
  const [isScoresModalOpen, setIsScoresModalOpen] = useState(false);
  const [isFactoryResetModalOpen, setIsFactoryResetModalOpen] = useState(false);
  const [initialTopicLessonSubject, setInitialTopicLessonSubject] = useState<string | undefined>(undefined);
  const [initialTopicTitle, setInitialTopicTitle] = useState<string | undefined>(undefined);
  const [pomodoroActiveBlockId, setPomodoroActiveBlockId] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TopicItem | null>(null);
  const [itemToEditDate, setItemToEditDate] = useState<TopicItem | null>(null);

  // License & 7-day Free Trial Management
  const [licenseInfo, setLicenseInfo] = useState<LicenseSystemInfo>(() => evaluateLicenseSystem());
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);

  // Student schedule PDF export capability (hidden after trial for expired/student tier)
  const canExportSchedule = useMemo(() => canExportStudentSchedule(licenseInfo), [licenseInfo]);

  const handleRefreshLicense = () => {
    const updated = evaluateLicenseSystem();
    setLicenseInfo(updated);
    if (updated.isActivated) {
      showToast('لایسنس دائمی با موفقیت فعال شد!');
    }
  };

  // Automatically prompt license modal on launch if trial expired
  useEffect(() => {
    if (licenseInfo.isExpired) {
      setIsLicenseModalOpen(true);
    }
  }, [licenseInfo.isExpired]);

  // Mobile Bottom Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'topics'>('topics');

  const [studentScores, setStudentScores] = useState<StudentScore[]>(() => {
    try {
      const saved = localStorage.getItem('ebbinghaus_student_scores');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Student Timetable & Cognitive Load Analyzer State (Experimental & Optional)
  const [isStudentModeActive, setIsStudentModeActive] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_MODE_STORAGE_KEY);
      if (saved !== null) return JSON.parse(saved);
    } catch {}
    return false; // Default off since it's optional & experimental
  });

  const [studentLessons, setStudentLessons] = useState<StudentLesson[]>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_LESSONS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    // Starter curriculum for students
    return STUDENT_PRESETS[0].lessons;
  });

  const [studentRoutine, setStudentRoutine] = useState<StudentRoutineConfig>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_ROUTINE_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_STUDENT_ROUTINE;
  });

  const [generatedStudyBlocks, setGeneratedStudyBlocks] = useState<GeneratedStudyBlock[]>(() => {
    try {
      const saved = localStorage.getItem(STUDENT_BLOCKS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return generateSmartStudyPlan(STUDENT_PRESETS[0].lessons, INITIAL_DEMO_DATA, DEFAULT_STUDENT_ROUTINE, []);
  });

  // Persist student mode and lessons to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_MODE_STORAGE_KEY, JSON.stringify(isStudentModeActive));
    } catch {}
  }, [isStudentModeActive]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_LESSONS_STORAGE_KEY, JSON.stringify(studentLessons));
    } catch {}
  }, [studentLessons]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_ROUTINE_STORAGE_KEY, JSON.stringify(studentRoutine));
    } catch {}
  }, [studentRoutine]);

  useEffect(() => {
    try {
      localStorage.setItem(STUDENT_BLOCKS_STORAGE_KEY, JSON.stringify(generatedStudyBlocks));
    } catch {}
  }, [generatedStudyBlocks]);

  // Move to line 445 after handleConfirmReview

  // Weekly Busy Slots & Constraints state (e.g. gym, university class, work)
  const [busySlots, setBusySlots] = useState<BusySlot[]>(() => {
    try {
      const saved = localStorage.getItem(BUSY_SLOTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    // Default initial busy slots for realistic student / workout routine
    return [
      {
        id: 'busy_default_gym',
        title: 'تمرین باشگاه بدنسازی',
        daysOfWeek: [0, 2, 4], // Sun, Tue, Thu (روزهای فرد)
        startTime: '18:00',
        endTime: '20:00',
        repeatWeekly: true,
        category: 'gym',
        isActive: true,
      },
      {
        id: 'busy_default_uni',
        title: 'کلاس‌های دانشگاه',
        daysOfWeek: [6, 1, 3], // Sat, Mon, Wed (روزهای زوج)
        startTime: '08:30',
        endTime: '12:30',
        repeatWeekly: true,
        category: 'university',
        isActive: true,
      },
    ];
  });

  // Auto-shift reviews to nearest free time slot when conflict occurs
  const [autoShiftEnabled, setAutoShiftEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_SHIFT_STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {}
    return true;
  });

  // Auto-add topics in review queue to today's schedule with guaranteed conflict prevention
  const [autoAddToTodayEnabled, setAutoAddToTodayEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_ADD_TODAY_STORAGE_KEY);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch {}
    return true; // Default ON so all active items seamlessly flow into today's timetable without conflicts
  });

  useEffect(() => {
    try {
      localStorage.setItem(AUTO_ADD_TODAY_STORAGE_KEY, JSON.stringify(autoAddToTodayEnabled));
    } catch {}
  }, [autoAddToTodayEnabled]);

  useEffect(() => {
    try {
      localStorage.setItem('ebbinghaus_student_scores', JSON.stringify(studentScores));
    } catch {}
  }, [studentScores]);

  // Persist busy slots to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(BUSY_SLOTS_STORAGE_KEY, JSON.stringify(busySlots));
    } catch {}
  }, [busySlots]);

  // Persist auto-shift setting to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(AUTO_SHIFT_STORAGE_KEY, JSON.stringify(autoShiftEnabled));
    } catch {}
  }, [autoShiftEnabled]);

  // Form draft presence in localStorage
  const [hasDraft, setHasDraft] = useState(() => {
    try {
      const saved = localStorage.getItem('ebbinghaus_topic_form_draft_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.title?.trim() || parsed.description?.trim());
      }
    } catch {}
    return false;
  });

  const checkDraftStatus = () => {
    try {
      const saved = localStorage.getItem('ebbinghaus_topic_form_draft_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        setHasDraft(Boolean(parsed.title?.trim() || parsed.description?.trim()));
        return;
      }
    } catch {}
    setHasDraft(false);
  };

  // Success notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Onboarding State
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(ONBOARDING_KEY);
      return saved !== 'true';
    } catch {
      return true;
    }
  });

  const handleCompleteOnboarding = (choice: 'automated' | 'manual') => {
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {}
    setShowOnboarding(false);
    
    // Clear initial demo data for a fresh user experience
    setTopics([]);
    
    if (choice === 'automated') {
      setIsStudentModeActive(true);
      setActiveTab('schedule');
    } else {
      setIsStudentModeActive(false);
      setActiveTab('topics');
    }
  };

  // Save to localStorage whenever topics change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
    } catch (e) {
      console.error('Failed to write to localStorage', e);
    }
  }, [topics]);

  // Tick clock every 15 seconds to update due state and countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Extract all unique categories and tags across all topics
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    topics.forEach((t) => {
      if (t.category?.trim()) set.add(t.category.trim());
    });
    return Array.from(set);
  }, [topics]);

  const availableTags = useMemo(() => {
    const set = new Set<string>();
    topics.forEach((t) => {
      t.tags?.forEach((tag) => {
        if (tag.trim()) set.add(tag.trim());
      });
    });
    return Array.from(set);
  }, [topics]);

  // Tag toggle handler for multi-select
  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      const isPresent = prev.includes(tag);
      if (isPresent) {
        return prev.filter((t) => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleClearTags = () => {
    setSelectedTags([]);
  };

  // Add new topic handler
  const handleAddTopic = (data: {
    title: string;
    description: string;
    category?: string;
    tags?: string[];
    initialDate: string;
  }) => {
    const newTopic: TopicItem = {
      id: 'topic_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: data.title,
      description: data.description,
      category: data.category,
      tags: data.tags,
      initialDate: data.initialDate,
      completedStages: 0,
      history: [],
      createdAt: new Date().toISOString(),
    };

    setTopics((prev) => [newTopic, ...prev]);
    setHasDraft(false);
    showToast(`مطلب «${data.title}» با موفقیت ثبت شد و زمان‌بندی مرور فعال گردید.`);
  };

  // Handler to open Add Topic Modal prefilled for a specific lesson/chapter
  const handleOpenAddTopicForLesson = (lessonSubject: string, initialTitle?: string) => {
    if (licenseInfo.isExpired) {
      setIsLicenseModalOpen(true);
      showToast(
        licenseInfo.status === 'LICENSE_EXPIRED'
          ? 'اعتبار لایسنس به پایان رسیده است. جهت ثبت مطلب، لطفاً لایسنس جدید وارد کنید.'
          : 'مهلت ۷ روزه استفاده رایگان به پایان رسیده است. جهت ثبت مطلب، لطفاً کلید لایسنس را وارد کنید.'
      );
      return;
    }
    setInitialTopicLessonSubject(lessonSubject || undefined);
    setInitialTopicTitle(initialTitle || undefined);
    setIsAddModalOpen(true);
  };

  // Factory Reset Handlers
  const handleResetToPreset = () => {
    setTopics(INITIAL_DEMO_DATA);
    setStudentLessons(STUDENT_PRESETS[0].lessons);
    setStudentRoutine(DEFAULT_STUDENT_ROUTINE);
    setBusySlots([
      {
        id: 'busy_default_gym',
        title: 'تمرین باشگاه بدنسازی',
        daysOfWeek: [0, 2, 4],
        startTime: '18:00',
        endTime: '20:00',
        repeatWeekly: true,
        category: 'gym',
        isActive: true,
      },
      {
        id: 'busy_default_uni',
        title: 'کلاس‌های دانشگاه / مدرسه',
        daysOfWeek: [6, 1, 3],
        startTime: '08:30',
        endTime: '12:30',
        repeatWeekly: true,
        category: 'university',
        isActive: true,
      },
    ]);
    const refreshedBlocks = generateSmartStudyPlan(
      STUDENT_PRESETS[0].lessons,
      INITIAL_DEMO_DATA,
      DEFAULT_STUDENT_ROUTINE,
      []
    );
    setGeneratedStudyBlocks(refreshedBlocks);
    setStudentScores([]);
    try {
      localStorage.removeItem('ebbinghaus_topic_form_draft_v1');
    } catch {}
    setHasDraft(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, 'false');
    } catch {}
    setShowOnboarding(true);
    showToast('برنامه با موفقیت به تنظیمات اولیه کارخانه (پیش‌فرض تجربی) بازنشانی شد.');
  };

  const handleResetToCleanSlate = () => {
    setTopics([]);
    setStudentLessons([]);
    setGeneratedStudyBlocks([]);
    setBusySlots([]);
    setStudentScores([]);
    try {
      localStorage.removeItem('ebbinghaus_topic_form_draft_v1');
      localStorage.setItem(ONBOARDING_KEY, 'false');
    } catch {}
    setHasDraft(false);
    setShowOnboarding(true);
    showToast('کلیه اطلاعات پاک‌سازی شد. اکنون می‌توانید برنامه شخصی خود را از صفر بچینید.');
  };

  const handleResetScheduleOnly = () => {
    const refreshedBlocks = generateSmartStudyPlan(
      studentLessons,
      topics,
      studentRoutine,
      busySlots
    );
    setGeneratedStudyBlocks(refreshedBlocks);
    showToast('جدول زمان‌بندی و پارت‌های هفتگی با موفقیت مجدداً بازچینی و محاسبه شد.');
  };

  // Restore backup handler
  const handleRestoreAll = (restoredData: FullAppData) => {
    if (restoredData.topics) setTopics(restoredData.topics);
    if (restoredData.busySlots) setBusySlots(restoredData.busySlots);
    if (restoredData.autoShiftEnabled !== undefined) setAutoShiftEnabled(restoredData.autoShiftEnabled);
    if (restoredData.studentLessons) setStudentLessons(restoredData.studentLessons);
    if (restoredData.isStudentModeActive !== undefined) setIsStudentModeActive(restoredData.isStudentModeActive);
    if (restoredData.studentRoutine) setStudentRoutine(restoredData.studentRoutine);
    if (restoredData.generatedStudyBlocks) setGeneratedStudyBlocks(restoredData.generatedStudyBlocks);
    if (restoredData.studentScores) setStudentScores(restoredData.studentScores);
    if (restoredData.autoAddToTodayEnabled !== undefined) setAutoAddToTodayEnabled(restoredData.autoAddToTodayEnabled);
    if (restoredData.theme) setTheme(restoredData.theme);
    if (restoredData.licenseKey) {
      activateAppWithKey(restoredData.licenseKey);
      handleRefreshLicense();
    }

    showToast(`تمامی اطلاعات و تنظیمات با موفقیت از فایل پشتیبان بازیابی شد.`);
  };

  // Confirm review handler (advances stage by 1)
  const handleConfirmReview = (id: string) => {
    setTopics((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newCompleted = Math.min(TOTAL_STAGES, item.completedStages + 1);
        const newHistory = [
          ...item.history,
          { stage: newCompleted, reviewedAt: new Date().toISOString() },
        ];
        return {
          ...item,
          completedStages: newCompleted,
          history: newHistory,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const targetItem = topics.find((t) => t.id === id);
    if (targetItem) {
      const nextStageNum = targetItem.completedStages + 1;
      if (nextStageNum >= TOTAL_STAGES) {
        showToast(`تبریک! تمامی ۵ مرحله مرور «${targetItem.title}» کامل شد و مطلب تثبیت گردید.`);
      } else {
        showToast(
          `مرور مرحله ${toPersianDigits(nextStageNum)} برای «${targetItem.title}» تایید شد.`
        );
      }
    }
  };

  // Auto-sync topics removed per user request to not populate Ebbinghaus list directly from lessons
  // User can still trigger this manually via the "Sync" button in the schedule widget

  // Auto-heal / auto-resolve conflicts in generated study blocks whenever busy slots, student lessons, or routine change
  useEffect(() => {
    if (isStudentModeActive && generatedStudyBlocks.length > 0) {
      const conflicts = detectScheduleConflicts(generatedStudyBlocks, busySlots, studentRoutine, studentLessons);
      if (conflicts.length > 0) {
        const resolved = autoResolveConflicts(generatedStudyBlocks, busySlots, studentRoutine, studentLessons);
        setGeneratedStudyBlocks(resolved);
      }
    }
  }, [isStudentModeActive, busySlots, studentRoutine, studentLessons]);

  // Auto-add topics in review cycle to today's schedule with ZERO conflicts when option is enabled
  useEffect(() => {
    if (isStudentModeActive && autoAddToTodayEnabled && topics.length > 0) {
      const { updatedBlocks, addedCount } = autoSyncAllDueTopicsToToday(
        topics,
        generatedStudyBlocks,
        studentRoutine,
        busySlots,
        studentLessons
      );
      if (addedCount > 0) {
        setGeneratedStudyBlocks(updatedBlocks);
      }
    }
  }, [isStudentModeActive, autoAddToTodayEnabled, topics.length, studentRoutine, busySlots, studentLessons]);

  const handleAutoPopulateTopics = (lessonsToUse?: StudentLesson[]) => {
    const list = lessonsToUse || studentLessons;
    const { updatedTopics, createdCount } = autoPopulateTopicsFromLessons(topics, list);
    if (createdCount > 0) {
      setTopics(updatedTopics);
      showToast(`تعداد ${toPersianDigits(createdCount)} عنوان درسی به فهرست مطالب اضافه شد و در چرخه مرور ابینگهاوس قرار گرفت.`);
    } else {
      showToast('تمامی عناوین برنامه درسی در حال حاضر در فهرست مطالب و چرخه مرور ابینگهاوس قرار دارند.');
    }
  };

  const handleSyncAllTopicsToTodaySchedule = () => {
    const { updatedBlocks, addedCount } = autoSyncAllDueTopicsToToday(
      topics,
      generatedStudyBlocks,
      studentRoutine,
      busySlots,
      studentLessons
    );
    if (addedCount > 0) {
      setGeneratedStudyBlocks(updatedBlocks);
      showToast(`تعداد ${toPersianDigits(addedCount)} مبحث با موفقیت و بدون هیچ‌گونه تداخل به برنامه درسی امروز افزوده شد.`);
    } else {
      showToast('کلیه مباحث در نوبت مرور در حال حاضر بدون تداخل در برنامه درسی امروز قرار دارند.');
    }
  };

  const handleAddBlockInWindow = (blockData: Omit<GeneratedStudyBlock, 'id'>) => {
    const newBlock: GeneratedStudyBlock = {
      ...blockData,
      id: `block_golden_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    setGeneratedStudyBlocks((prev) => [...prev, newBlock]);
    showToast(`پارت جدید «${newBlock.title}» در پنجره طلایی زمان‌بندی شد.`);
  };

  const handleAutoAssignEbbinghausToWindow = (win: GoldenFreeWindow) => {
    // Find due topics or uncompleted review topics
    const dueTopics = topics.filter((t) => isItemDue(t));
    const targetTopic = dueTopics[0] || topics[0];

    const title = targetTopic
      ? `مرور طلایی: ${targetTopic.lessonSubject ? `${targetTopic.lessonSubject} - ` : ''}${targetTopic.title}`
      : 'پارت طلایی مرور و یادگیری عمیق';

    const newBlock: GeneratedStudyBlock = {
      id: `block_golden_ebb_${Date.now()}`,
      dayOfWeek: win.dayOfWeek,
      startTime: win.startTime,
      endTime: formatMinutesToTimeStr((parseTimeStrToMinutes(win.startTime) + Math.min(win.durationMinutes, studentRoutine.studyBlockDuration)) % 1440),
      title,
      category: targetTopic ? 'ebbinghaus_review' : 'free_study',
      isCompleted: false,
      difficulty: targetTopic?.difficulty || 'medium',
      topicId: targetTopic?.id,
      relatedSubject: targetTopic?.lessonSubject,
    };

    setGeneratedStudyBlocks((prev) => [...prev, newBlock]);
    showToast(`پارت مطالعاتی «${title}» با موفقیت در پنجره طلایی ${win.dayName} رزرو شد.`);
  };

  const handleToggleStudentMode = (active: boolean) => {
    setIsStudentModeActive(active);
    if (active) {
      const { updatedTopics, createdCount } = autoPopulateTopicsFromLessons(topics, studentLessons);
      if (createdCount > 0) {
        setTopics(updatedTopics);
        showToast(`برنامه درسی فعال شد: تعداد ${toPersianDigits(createdCount)} مبحث درسی در چرخه مرور و تثبیت ابینگهاوس قرار گرفتند.`);
      } else {
        showToast('برنامه درسی فعال شد (کلیه مباحث درسی در چرخه مرور قرار دارند).');
      }
    } else {
      showToast('حالت برنامه درسی غیرفعال شد.');
    }
  };

  const handleToggleStudyBlockCompletion = (blockId: string) => {
    let blockToComplete: GeneratedStudyBlock | undefined;
    
    setGeneratedStudyBlocks((prev) =>
      prev.map((b) => {
        if (b.id === blockId) {
          blockToComplete = { ...b, isCompleted: !b.isCompleted };
          return blockToComplete;
        }
        return b;
      })
    );

    // When a study block is completed in the student schedule, automatically advance the Ebbinghaus review stage!
    if (blockToComplete && blockToComplete.isCompleted) {
      const candidateTopicIds = new Set<string>();

      if (blockToComplete.topicId) {
        candidateTopicIds.add(blockToComplete.topicId);
      }
      if (blockToComplete.relatedTopicIds && blockToComplete.relatedTopicIds.length > 0) {
        blockToComplete.relatedTopicIds.forEach((id) => candidateTopicIds.add(id));
      }

      // If no explicit ID, match by lessonSubject or title
      if (candidateTopicIds.size === 0 && blockToComplete.relatedSubject) {
        const sub = blockToComplete.relatedSubject.trim().toLowerCase();
        const matched = topics.find(
          (t) =>
            (t.lessonSubject && t.lessonSubject.trim().toLowerCase() === sub) ||
            t.title.trim().toLowerCase() === sub ||
            t.title.trim().toLowerCase().includes(sub)
        );
        if (matched) {
          candidateTopicIds.add(matched.id);
        }
      }

      // Advance Ebbinghaus stage for linked topics
      if (candidateTopicIds.size > 0) {
        candidateTopicIds.forEach((topicId) => {
          handleConfirmReview(topicId);
        });
      }
    }
  };

  const handleShiftSchedule = () => {
    setGeneratedStudyBlocks(prev => shiftRemainingBlocks(prev, busySlots, studentRoutine, studentLessons));
    showToast('زمان‌بندی پارت‌های باقی‌مانده از همین لحظه مجدداً توزیع شد.');
  };

  const handleResolveConflicts = () => {
    setGeneratedStudyBlocks(prev => autoResolveConflicts(prev, busySlots, studentRoutine, studentLessons));
    showToast('تداخل‌ها با موفقیت برطرف و زمان‌ها مجدداً توزیع شد.');
  };

  const handleToggleExamMode = (active: boolean) => {
    setStudentRoutine(prev => {
      const newRoutine = { ...prev, isExamModeActive: active };
      // Also regenerate blocks to reflect the new mode immediately
      setGeneratedStudyBlocks(generateSmartStudyPlan(studentLessons, topics, newRoutine, busySlots));
      return newRoutine;
    });
    showToast(active ? 'مود امتحانات فعال شد. فعالیت‌های غیرضروری نادیده گرفته می‌شوند.' : 'مود امتحانات غیرفعال شد.');
  };

  // Delete topic handler
  const handleDeleteConfirm = (id: string) => {
    const targetItem = topics.find((t) => t.id === id);
    setTopics((prev) => prev.filter((item) => item.id !== id));
    if (targetItem) {
      showToast(`مطلب «${targetItem.title}» حذف شد.`);
    }
  };

  // Edit initial date handler
  const handleSaveInitialDate = (id: string, newInitialDate: string) => {
    setTopics((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        return {
          ...item,
          initialDate: newInitialDate,
          updatedAt: new Date().toISOString(),
        };
      })
    );
    showToast('تاریخ اولین مطالعه به‌روزرسانی شد و کلیه مراحل مرور مجدداً محاسبه شدند.');
  };

  // Intelligent Quick Add a topic to today's study schedule with GUARANTEED CONFLICT PREVENTION
  const handleQuickAddToTodaySchedule = (topic: TopicItem) => {
    const result = scheduleTopicIntoDayWithoutConflict(
      topic,
      generatedStudyBlocks,
      studentRoutine,
      busySlots
    );

    if (result.added) {
      setGeneratedStudyBlocks(result.updatedBlocks);
      showToast(result.reason);
    } else {
      showToast(result.reason);
    }
  };

  // Helper to compute effective review date taking busy slots into account
  const getTopicEffectiveReviewDate = (item: TopicItem): Date | null => {
    if (item.completedStages >= TOTAL_STAGES) return null;
    const nextReview = getNextReviewDate(item);
    if (!nextReview) return null;
    const conflict = checkReviewConflict(nextReview, busySlots, currentTime);
    return conflict && autoShiftEnabled ? conflict.adjustedDate : nextReview;
  };

  const isTopicDue = (item: TopicItem): boolean => {
    const effective = getTopicEffectiveReviewDate(item);
    return effective ? currentTime.getTime() >= effective.getTime() : false;
  };

  // Calculate counts for stats
  const dueItems = useMemo(() => {
    return topics.filter(isTopicDue);
  }, [topics, currentTime, busySlots, autoShiftEnabled]);

  const dueCount = dueItems.length;

  const completedCount = useMemo(() => {
    return topics.filter((item) => item.completedStages >= TOTAL_STAGES).length;
  }, [topics]);

  const inProgressCount = useMemo(() => {
    return topics.filter((item) => item.completedStages < TOTAL_STAGES).length;
  }, [topics]);

  // Priority sorting:
  // 1. Due items first (ready for review), sorted by effective review date ascending
  // 2. Upcoming incomplete items, sorted by effective review date ascending
  // 3. Completed items, sorted by createdAt descending
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => {
      const isDueA = isTopicDue(a);
      const isDueB = isTopicDue(b);

      // 1. Ready for review always takes top priority
      if (isDueA && !isDueB) return -1;
      if (!isDueA && isDueB) return 1;

      const isCompletedA = a.completedStages >= TOTAL_STAGES;
      const isCompletedB = b.completedStages >= TOTAL_STAGES;

      // Incomplete items come before completed items
      if (!isCompletedA && isCompletedB) return -1;
      if (isCompletedA && !isCompletedB) return 1;

      // Both incomplete: sort by effective review date
      if (!isCompletedA && !isCompletedB) {
        const nextA = getTopicEffectiveReviewDate(a)?.getTime() || 0;
        const nextB = getTopicEffectiveReviewDate(b)?.getTime() || 0;
        return nextA - nextB;
      }

      // Both completed: sort by creation date descending
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [topics, currentTime, busySlots, autoShiftEnabled]);

  // Filtered list according to current tab, search query, category, multi-tags (AND/OR), and calendar day
  const filteredTopics = useMemo(() => {
    return sortedTopics.filter((item) => {
      // Category filter
      if (selectedCategory && item.category !== selectedCategory) {
        return false;
      }

      // Smart Multi-Tag filter with AND / OR matching (Requirement 3)
      if (selectedTags.length > 0) {
        if (!item.tags || item.tags.length === 0) return false;
        if (tagMatchMode === 'AND') {
          // Every selected tag must be present on the item
          const hasAll = selectedTags.every((st) => item.tags!.includes(st));
          if (!hasAll) return false;
        } else {
          // At least one selected tag must be present on the item
          const hasAny = selectedTags.some((st) => item.tags!.includes(st));
          if (!hasAny) return false;
        }
      }

      // Search filter
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

      if (!matchesSearch) return false;

      // Calendar Day filter
      if (selectedCalendarDay) {
        if (item.completedStages >= TOTAL_STAGES) return false;

        const effectiveReview = getTopicEffectiveReviewDate(item);
        let matchesDay = effectiveReview ? isSameDay(effectiveReview, selectedCalendarDay) : false;

        if (!matchesDay) {
          // Check future stages
          for (let st = item.completedStages + 2; st <= TOTAL_STAGES; st++) {
            const fDate = calculateStageDate(item.initialDate, st);
            if (isSameDay(fDate, selectedCalendarDay)) {
              matchesDay = true;
              break;
            }
          }
        }

        if (!matchesDay) return false;
      }

      // Status filter
      if (currentFilter === 'due') {
        return isTopicDue(item);
      }
      if (currentFilter === 'in_progress') {
        return item.completedStages < TOTAL_STAGES;
      }
      if (currentFilter === 'completed') {
        return item.completedStages >= TOTAL_STAGES;
      }
      return true; // 'all'
    });
  }, [
    sortedTopics,
    currentFilter,
    searchQuery,
    selectedCategory,
    selectedTags,
    tagMatchMode,
    selectedCalendarDay,
    currentTime,
    busySlots,
    autoShiftEnabled,
  ]);

  return (
    <div className="min-h-screen app-container text-slate-800 flex flex-col font-sans antialiased transition-colors">
      {showOnboarding && <OnboardingScreen onComplete={handleCompleteOnboarding} />}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs sm:text-sm animate-bounce border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar with Theme switcher, live clock, due count & actions */}
      <Navbar
        dueCount={dueCount}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAddModal={() => {
          if (licenseInfo.isExpired) {
            setIsLicenseModalOpen(true);
            showToast(
              licenseInfo.status === 'LICENSE_EXPIRED'
                ? 'اعتبار لایسنس به پایان رسیده است. جهت ثبت مطلب، لطفاً لایسنس جدید وارد کنید.'
                : 'مهلت ۷ روزه استفاده رایگان به پایان رسیده است. جهت ثبت مطلب، لطفاً کلید لایسنس را وارد کنید.'
            );
            return;
          }
          setInitialTopicLessonSubject(undefined);
          setInitialTopicTitle(undefined);
          setIsAddModalOpen(true);
        }}
        onOpenInfoModal={() => setIsInfoModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenBusyModal={() => setIsBusyModalOpen(true)}
        activeBusyCount={busySlots.filter((s) => s.isActive).length}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        isStudentModeActive={isStudentModeActive}
        onOpenPomodoroModal={() => {
          setPomodoroActiveBlockId(null);
          setIsPomodoroModalOpen(true);
        }}
        onOpenReportModal={() => setIsReportModalOpen(true)}
        onOpenFactoryResetModal={() => setIsFactoryResetModalOpen(true)}
        onOpenPdfExportModal={canExportSchedule ? () => setIsPdfExportModalOpen(true) : undefined}
        licenseInfo={licenseInfo}
        onOpenLicenseModal={() => setIsLicenseModalOpen(true)}
        currentDateText={formatPersianDateTime(currentTime)}
        hasDraft={hasDraft}
        currentTheme={theme}
        onThemeChange={setTheme}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
        {/* Trial Expired Alert Banner */}
        {licenseInfo.isExpired && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-900 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in fade-in" dir="rtl">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-200 text-rose-800 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm text-rose-950">
                  {licenseInfo.status === 'LICENSE_EXPIRED'
                    ? 'اعتبار لایسنس نرم‌افزار به پایان رسیده است'
                    : 'دوره آزمایشی رایگان ۷ روزه به پایان رسیده است'}
                </h3>
                <p className="text-xs text-rose-800 mt-0.5">
                  {licenseInfo.status === 'LICENSE_EXPIRED'
                    ? 'تمامی داده‌ها و مرورهای شما به صورت امن ذخیره است. جهت فعال‌سازی مجدد، لطفاً لایسنس جدید ثبت فرمایید.'
                    : 'تمامی داده‌ها و پیشرفت‌های شما محفوظ است. جهت ادامه ثبت و مرور مطالب، لطفاً کلید لایسنس خود را وارد نمایید.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <button
                type="button"
                onClick={() => setIsLicenseModalOpen(true)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>فعال‌سازی لایسنس</span>
              </button>
              <button
                type="button"
                onClick={() => setIsBackupModalOpen(true)}
                className="px-3 py-2.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                title="دانلود بکاپ فایل پشتیبان داده‌ها"
              >
                <Download className="w-4 h-4" />
                <span className="sm:hidden">بکاپ</span>
              </button>
            </div>
          </div>
        )}
        
        {/* Desktop grid layout / Mobile Tab layout */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8">
          
          {/* TAB 1: DASHBOARD (نمای کلی و آمار) */}
          <div className={`space-y-6 lg:space-y-8 ${activeTab !== 'dashboard' ? 'hidden' : 'animate-in fade-in slide-in-from-bottom-2 duration-300'}`}>
            {/* Stats Overview with Metrics & Retention Estimate Widget */}
            <StatsOverview
              dueCount={dueCount}
              inProgressCount={inProgressCount}
              completedCount={completedCount}
              totalCount={topics.length}
              topics={topics}
              isStudentModeActive={isStudentModeActive}
              generatedStudyBlocks={generatedStudyBlocks}
              busySlots={busySlots}
              studentRoutine={studentRoutine}
              studentScores={studentScores}
              onOpenScoresModal={() => setIsScoresModalOpen(true)}
              onOpenReportModal={() => setIsReportModalOpen(true)}
            />

            {/* Weekly Spaced Review Motivation Chart (گزارش انگیزه و تحلیل مرورها) - Swapped here */}
            <WeeklyReviewChart topics={topics} />

            {/* Mini Calendar View for Upcoming Spaced Repetitions */}
            <MiniCalendar
              topics={topics}
              selectedCalendarDay={selectedCalendarDay}
              onSelectCalendarDay={setSelectedCalendarDay}
              busySlots={busySlots}
              autoShiftEnabled={autoShiftEnabled}
            />

            {/* Multi-Period Review Performance Comparative Bar Chart (Day / Week / Month) */}
            <ReviewPerformanceBarChart topics={topics} />

            {/* Donut/Pie Chart of Memory Consolidation Ratio (نمودار دایره‌ای نسبت تثبیت در حافظه بلندمدت) - Swapped here */}
            <MemoryConsolidationPieChart
              dueCount={dueCount}
              inProgressCount={inProgressCount}
              completedCount={completedCount}
              totalCount={topics.length}
              topics={topics}
              isStudentModeActive={isStudentModeActive}
              generatedStudyBlocks={generatedStudyBlocks}
              studentScores={studentScores}
              onOpenScoresModal={() => setIsScoresModalOpen(true)}
            />
          </div>

          {/* TAB 2: SCHEDULE (برنامه روزانه و پارت‌ها) - Only visible if student mode active */}
          {isStudentModeActive && (
            <div className={`space-y-6 lg:space-y-8 ${activeTab !== 'schedule' ? 'hidden' : 'animate-in fade-in slide-in-from-bottom-2 duration-300'}`}>
              {/* Optional & Experimental Student Timetable & Cognitive Load Analyzer Widget */}
              <StudentScheduleWidget
                isStudentModeActive={isStudentModeActive}
                onOpenStudentModal={() => setIsStudentModalOpen(true)}
                lessons={studentLessons}
                topics={topics}
                routine={studentRoutine}
                studyBlocks={generatedStudyBlocks}
                onToggleBlockCompletion={handleToggleStudyBlockCompletion}
                busySlots={busySlots}
                onStartPomodoro={(blockId) => {
                  setPomodoroActiveBlockId(blockId);
                  setIsPomodoroModalOpen(true);
                }}
                onShiftSchedule={handleShiftSchedule}
                onResolveConflicts={handleResolveConflicts}
                onToggleExamMode={handleToggleExamMode}
                onAutoPopulateTopics={() => handleAutoPopulateTopics()}
                onAddSubtopicForLesson={(subject) => handleOpenAddTopicForLesson(subject)}
                onAddBlockInWindow={handleAddBlockInWindow}
                onAutoAssignEbbinghausToWindow={handleAutoAssignEbbinghausToWindow}
                onOpenPdfExportModal={canExportSchedule ? () => setIsPdfExportModalOpen(true) : undefined}
              />
            </div>
          )}

          {/* TAB 3: TOPICS (مطالب و فیلترها) */}
          <div className={`space-y-4 lg:space-y-6 ${activeTab !== 'topics' ? 'hidden' : 'animate-in fade-in slide-in-from-bottom-2 duration-300'}`}>
            {/* In-App Alert Banner */}
            <AlertBanner
              dueCount={dueCount}
              onFilterDue={() => {
                setCurrentFilter(currentFilter === 'due' ? 'all' : 'due');
              }}
              isFilteredOnDue={currentFilter === 'due'}
            />

            {/* Auto-Add to Today's Schedule with Conflict Prevention Banner */}
            {isStudentModeActive && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-indigo-50 via-blue-50 to-indigo-50/70 border border-indigo-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-800 text-sm">
                        زمان‌بندی خودکار در برنامه امروز (پیشگیری کامل از تداخل)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                        ساعات خالی + بدون هم‌پوشانی
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs mt-1 leading-relaxed">
                      هنگام فعال بودن این گزینه، کلیه مباحث در نوبت مرور به‌صورت خودکار در اوقات آزاد امروز (پس از مدرسه و استراحت، با رعایت ساعات باشگاه و استراحت) درج می‌شوند تا هیچ تداخلی رخ ندهد.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={handleSyncAllTopicsToTodaySchedule}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs transition-all flex items-center gap-1.5"
                    title="هماهنگ‌سازی فوری کلیه مباحث در نوبت مرور به جدول امروز بدون ایجاد تداخل"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>هماهنگ‌سازی همه به امروز</span>
                  </button>

                  <label className="flex items-center gap-2 cursor-pointer select-none bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold shadow-2xs transition-all">
                    <input
                      type="checkbox"
                      checked={autoAddToTodayEnabled}
                      onChange={(e) => {
                        setAutoAddToTodayEnabled(e.target.checked);
                        showToast(
                          e.target.checked
                            ? 'افزودن خودکار به برنامه امروز (با پیشگیری از تداخل) فعال شد.'
                            : 'افزودن خودکار به برنامه امروز غیرفعال شد.'
                        );
                      }}
                      className="w-4 h-4 rounded text-indigo-600 accent-white"
                    />
                    <span>افزودن خودکار</span>
                  </label>
                </div>
              </div>
            )}

            {/* Filter and Search Bar with Category and Smart Multi-Tag selectors (AND/OR) */}
            <FilterBar
              currentFilter={currentFilter}
              onFilterChange={setCurrentFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              availableCategories={availableCategories}
              selectedTags={selectedTags}
              onToggleTag={handleToggleTag}
              onClearTags={handleClearTags}
              tagMatchMode={tagMatchMode}
              onTagMatchModeChange={setTagMatchMode}
              availableTags={availableTags}
              counts={{
                all: topics.length,
                due: dueCount,
                in_progress: inProgressCount,
                completed: completedCount,
              }}
            />

            {/* Calendar Day active notice */}
            {selectedCalendarDay && (
              <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center justify-between text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">فیلتر تقویم فعال است:</span>
                  <span>تنها مطالب دارای مرور در تاریخ <strong>{formatPersianDate(selectedCalendarDay)}</strong> نمایش داده می‌شوند.</span>
                </div>
                <button
                  onClick={() => setSelectedCalendarDay(null)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 underline mr-2"
                >
                  حذف فیلتر تقویم
                </button>
              </div>
            )}

            {/* Topic List */}
            {filteredTopics.length > 0 ? (
              <div className="space-y-4">
                {filteredTopics.map((item) => {
                  const todayDay = new Date().getDay();
                  const todayBlocks = generatedStudyBlocks.filter((b) => b.dayOfWeek === todayDay);
                  const matchingBlock = todayBlocks.find(
                    (b) =>
                      b.topicId === item.id ||
                      (b.relatedTopicIds && b.relatedTopicIds.includes(item.id)) ||
                      (item.lessonSubject && b.relatedSubject === item.lessonSubject && b.category === 'ebbinghaus_review')
                  );

                  return (
                    <TopicCard
                      key={item.id}
                      item={item}
                      onConfirmReview={handleConfirmReview}
                      onDeleteRequest={(target) => setItemToDelete(target)}
                      onEditDateRequest={(target) => setItemToEditDate(target)}
                      onTagClick={(tag) => handleToggleTag(tag)}
                      onCategoryClick={(cat) => setSelectedCategory(cat)}
                      busySlots={busySlots}
                      autoShiftEnabled={autoShiftEnabled}
                      isStudentModeActive={isStudentModeActive}
                      hasTodayStudyBlock={Boolean(matchingBlock)}
                      todayStudyBlockTime={matchingBlock ? `${matchingBlock.startTime} تا ${matchingBlock.endTime}` : undefined}
                      autoAddToTodayEnabled={autoAddToTodayEnabled}
                      onAddToTodaySchedule={handleQuickAddToTodaySchedule}
                      onAddNextChapter={(topic) => handleOpenAddTopicForLesson(topic.lessonSubject || topic.title)}
                    />
                  );
                })}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center max-w-lg mx-auto my-8 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
                  <Inbox className="w-7 h-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">
                  {searchQuery || selectedCategory || selectedTags.length > 0 || selectedCalendarDay
                    ? 'مطلبی با این فیلترها یافت نشد'
                    : 'هنوز مطلبی در این بخش وجود ندارد'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                  {searchQuery || selectedCategory || selectedTags.length > 0 || selectedCalendarDay
                    ? 'لطفاً فیلتر برچسب، دسته‌بندی یا تاریخ را بازنشانی کنید.'
                    : 'برای شروع برنامه‌ریزی مرور بر اساس منحنی ابینگهاوس، اولین مطلب خود را اضافه کنید.'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3">
                  {searchQuery || selectedCategory || selectedTags.length > 0 || selectedCalendarDay ? (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory(null);
                        setSelectedTags([]);
                        setSelectedCalendarDay(null);
                      }}
                      className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      پاک کردن تمام فیلترها
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        <span>ثبت اولین مطلب</span>
                      </button>

                      <button
                        onClick={() => setTopics(INITIAL_DEMO_DATA)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-medium rounded-xl transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        <span>بارگذاری داده‌های نمونه</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around z-40 pb-safe shadow-[0_-5px_15px_-10px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => setActiveTab('topics')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${
            activeTab === 'topics' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab === 'topics' ? 'bg-indigo-100' : ''}`}>
            <BookOpen className={`w-5 h-5 ${activeTab === 'topics' ? 'fill-indigo-100' : ''}`} />
          </div>
          <span className="text-[10px] font-bold">فهرست مطالب</span>
        </button>

        {isStudentModeActive && (
          <button
            onClick={() => setActiveTab('schedule')}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${
              activeTab === 'schedule' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === 'schedule' ? 'bg-indigo-100' : ''}`}>
              <Clock className={`w-5 h-5 ${activeTab === 'schedule' ? 'fill-indigo-100' : ''}`} />
            </div>
            <span className="text-[10px] font-bold">برنامه درسی</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-20 ${
            activeTab === 'dashboard' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className={`p-1.5 rounded-lg ${activeTab === 'dashboard' ? 'bg-indigo-100' : ''}`}>
            <Sparkles className={`w-5 h-5 ${activeTab === 'dashboard' ? 'fill-indigo-100' : ''}`} />
          </div>
          <span className="text-[10px] font-bold">تحلیل حافظه</span>
        </button>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/70 py-6 text-center text-xs text-slate-500 transition-colors">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>سامانه هوشمند مرور مطالب بر اساس منحنی فراموشی هرمان ابینگهاوس (Spaced Repetition)</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>پشتیبان‌گیری JSON</span>
            </button>
            <span>•</span>
            <span>ذخیره‌سازی پایدار در مرورگر (Local Storage)</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AddTopicModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setInitialTopicLessonSubject(undefined);
          setInitialTopicTitle(undefined);
          checkDraftStatus();
        }}
        onAddTopic={handleAddTopic}
        isStudentModeActive={isStudentModeActive}
        studentLessons={studentLessons}
        studentRoutine={studentRoutine}
        initialLessonSubject={initialTopicLessonSubject}
        initialTitle={initialTopicTitle}
      />

      <FactoryResetModal
        isOpen={isFactoryResetModalOpen}
        onClose={() => setIsFactoryResetModalOpen(false)}
        onResetToPreset={handleResetToPreset}
        onResetToCleanSlate={handleResetToCleanSlate}
        onResetScheduleOnly={handleResetScheduleOnly}
        data={{
          topics,
          busySlots,
          autoShiftEnabled,
          studentLessons,
          isStudentModeActive,
          studentRoutine,
          generatedStudyBlocks,
          studentScores,
          autoAddToTodayEnabled,
          theme,
          licenseKey: licenseInfo.licenseDetails?.key || null,
        }}
      />

      <EditDateModal
        item={itemToEditDate}
        isOpen={!!itemToEditDate}
        onClose={() => setItemToEditDate(null)}
        onSave={handleSaveInitialDate}
      />

      <DeleteConfirmModal
        item={itemToDelete}
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      <EbbinghausInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      <BackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        data={{
          topics,
          busySlots,
          autoShiftEnabled,
          studentLessons,
          isStudentModeActive,
          studentRoutine,
          generatedStudyBlocks,
          studentScores,
          autoAddToTodayEnabled,
          theme,
          licenseKey: licenseInfo.licenseDetails?.key || null,
        }}
        onRestoreAll={handleRestoreAll}
      />

      <BusyScheduleModal
        isOpen={isBusyModalOpen}
        onClose={() => setIsBusyModalOpen(false)}
        busySlots={busySlots}
        onSaveBusySlots={setBusySlots}
        autoShiftEnabled={autoShiftEnabled}
        onToggleAutoShift={setAutoShiftEnabled}
      />

      <StudentScheduleModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        lessons={studentLessons}
        onSaveLessons={setStudentLessons}
        isStudentModeActive={isStudentModeActive}
        onToggleStudentMode={handleToggleStudentMode}
        topics={topics}
        busySlots={busySlots}
        onSyncWithBusySlots={setBusySlots}
        routine={studentRoutine}
        onSaveRoutine={setStudentRoutine}
        studyBlocks={generatedStudyBlocks}
        onSaveStudyBlocks={setGeneratedStudyBlocks}
        onToggleBlockCompletion={handleToggleStudyBlockCompletion}
        onAutoPopulateTopics={handleAutoPopulateTopics}
        onOpenPdfExportModal={canExportSchedule ? () => setIsPdfExportModalOpen(true) : undefined}
      />

      {canExportSchedule && (
        <SchedulePdfExportModal
          isOpen={isPdfExportModalOpen}
          onClose={() => setIsPdfExportModalOpen(false)}
          lessons={studentLessons}
          topics={topics}
          busySlots={busySlots}
          routine={studentRoutine}
          studyBlocks={generatedStudyBlocks}
        />
      )}

      <PomodoroTimerModal
        isOpen={isPomodoroModalOpen}
        onClose={() => setIsPomodoroModalOpen(false)}
        studyBlocks={generatedStudyBlocks}
        activeBlockId={pomodoroActiveBlockId}
        onToggleBlockCompletion={handleToggleStudyBlockCompletion}
        routine={studentRoutine}
      />

      <WeeklyReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        topics={topics}
        lessons={studentLessons}
        routine={studentRoutine}
        studyBlocks={generatedStudyBlocks}
      />

      <ExamScoresModal
        isOpen={isScoresModalOpen}
        onClose={() => setIsScoresModalOpen(false)}
        scores={studentScores}
        onSaveScores={setStudentScores}
      />

      {/* License & Trial Management Modal */}
      <LicenseActivationModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        licenseInfo={licenseInfo}
        onRefreshLicense={handleRefreshLicense}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        isBlocking={licenseInfo.isExpired}
      />

      {/* PWA Offline Mode Indicator */}
      <OfflineIndicator />
    </div>
  );
}

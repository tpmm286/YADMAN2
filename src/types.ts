export interface ReviewHistoryEntry {
  stage: number;
  reviewedAt: string; // ISO string
}

export interface TopicItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  tags?: string[];
  initialDate: string; // ISO string of initial study/registration time
  completedStages: number; // 0 to 5
  history: ReviewHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
  lessonSubject?: string; // e.g. "زیست‌شناسی", "ریاضی ۳", "فیزیک"
  difficulty?: LessonDifficulty; // 'easy' | 'medium' | 'hard'
  targetStudyMinutes?: number; // duration of study block e.g. 45 or 60 min
}

export const DEFAULT_CATEGORIES = [
  'درسی و کنکور',
  'زبان خارجی',
  'برنامه‌نویسی و مهندسی',
  'کتاب و مطالعه',
  'توسعه فردی',
  'عمومی',
];

export interface StageDefinition {
  stageNumber: number; // 1 to 5
  hoursFromStart: number;
  title: string;
  description: string;
}

export const STAGES: StageDefinition[] = [
  {
    stageNumber: 1,
    hoursFromStart: 9,
    title: 'مرحله ۱',
    description: '۹ ساعت پس از مطالعه اولیه',
  },
  {
    stageNumber: 2,
    hoursFromStart: 24,
    title: 'مرحله ۲',
    description: '۲۴ ساعت پس از مطالعه اولیه (روز بعد)',
  },
  {
    stageNumber: 3,
    hoursFromStart: 48,
    title: 'مرحله ۳',
    description: '۴۸ ساعت پس از مطالعه اولیه (۲ روز بعد)',
  },
  {
    stageNumber: 4,
    hoursFromStart: 168,
    title: 'مرحله ۴',
    description: '۱۶۸ ساعت پس از مطالعه اولیه (۷ روز بعد)',
  },
  {
    stageNumber: 5,
    hoursFromStart: 720,
    title: 'مرحله ۵',
    description: '۷۲۰ ساعت پس از مطالعه اولیه (۳۰ روز بعد)',
  },
];

export const TOTAL_STAGES = 5;

export type FilterStatus = 'all' | 'due' | 'in_progress' | 'completed';

export type ThemeMode = 'light' | 'dark' | 'classic';

export type LicenseTier = 'PRO' | 'STUDENT' | 'ENTERPRISE';
export type LicensePlatform = 'ALL' | 'DESKTOP' | 'MOBILE' | 'WEB';
export type LicenseDuration = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'LIFETIME';
export type ActivationWindow = '3D' | '7D' | '14D' | '30D' | 'UNLIMITED';
export type LicenseStatus = 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'ACTIVATED' | 'LICENSE_EXPIRED' | 'CLOCK_TAMPERED';

export type TagMatchMode = 'AND' | 'OR';

export interface BusySlot {
  id: string;
  title: string; // e.g. "باشگاه بدنسازی", "کلاس دانشگاه"
  daysOfWeek: number[]; // 0=Sunday (یکشنبه), 1=Monday, ..., 6=Saturday (شنبه)
  startTime: string; // "17:00"
  endTime: string; // "19:00"
  repeatWeekly: boolean;
  category?: 'gym' | 'university' | 'work' | 'personal';
  isActive: boolean;
  priority?: 'low' | 'medium' | 'high'; // low: Can be overridden by study, high: Cannot be overridden
}

export interface ConflictResolution {
  hasConflict: boolean;
  busySlot?: BusySlot;
  originalDate: Date;
  adjustedDate: Date;
  explanation: string;
  shiftMinutes: number;
}

export type LessonDifficulty = 'easy' | 'medium' | 'hard';
export type LessonType = 'school_class' | 'study_session' | 'homework' | 'exam';

export interface StudentLesson {
  id: string;
  subject: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  startTime: string; // "08:00"
  endTime: string; // "09:30"
  difficulty: LessonDifficulty;
  type: LessonType;
  notes?: string;
}

export interface StudentRoutineConfig {
  wakeUpTime: string; // e.g. "06:30"
  schoolDepartureTime: string; // e.g. "07:15"
  schoolReturnTime: string; // e.g. "14:00"
  lunchRestMinutes: number; // e.g. 60 (recharge & lunch, 14:00 - 15:00)
  minLunchRestMinutes?: number; // e.g. 30 (minimum flexible lunch rest limit during conflicts)
  allowFlexibleBreakWindows?: boolean; // When true, system compresses/shifts flexible rest windows first to resolve conflicts without deleting study blocks
  bedTime: string; // e.g. "23:00"
  studyBlockDuration: number; // e.g. 60 minutes
  breakDuration: number; // e.g. 15 minutes break
  minBreakDuration?: number; // e.g. 5 minutes (minimum flexible inter-block break duration)
  targetHomeStudyHoursWeekdays: number; // e.g. 4 hours
  targetHomeStudyHoursWeekend: number; // e.g. 7 hours
  priorityFocus: 'balanced' | 'ebbinghaus_first' | 'homework_first' | 'exam_prep';
  isExamModeActive?: boolean; // When true, low priority busy slots are ignored automatically
}

export interface GoldenFreeWindow {
  id: string;
  dayOfWeek: number; // 0..6
  dayName: string; // "شنبه", "پنج‌شنبه", ...
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  durationMinutes: number; // e.g. 180
  qualityScore: number; // 0..100
  type: 'deep_work' | 'long_review' | 'exam_simulation' | 'consolidation';
  title: string;
  description: string;
  reason: string;
  suggestedActionLabel: string;
}

export interface SmartShortRestSuggestion {
  id: string;
  dayOfWeek: number;
  dayName: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  type: 'power_nap' | 'eye_relax' | 'walk_hydration' | 'buffer_recharge';
  title: string;
  benefit: string;
  recommendation: string;
  iconType: 'coffee' | 'eye' | 'heart' | 'battery';
}

export type StudyBlockCategory =
  | 'school'
  | 'commute_lunch'
  | 'ebbinghaus_review'
  | 'same_day_consolidation'
  | 'prep_tomorrow'
  | 'free_study'
  | 'personal_busy'
  | 'night_wind_down';

export interface GeneratedStudyBlock {
  id: string;
  dayOfWeek: number; // 0..6
  startTime: string; // "15:30"
  endTime: string; // "16:45"
  title: string;
  category: StudyBlockCategory;
  relatedSubject?: string;
  relatedTopicIds?: string[];
  topicId?: string;
  targetMinutes?: number;
  lessonSubject?: string;
  difficulty?: LessonDifficulty;
  isCompleted: boolean;
  notes?: string;
}

export interface StudentScore {
  id: string;
  subject: string;
  score: number;
  maxScore: number;
  date: string;
  examName?: string;
}

export interface DayScheduleAnalysis {
  dayIndex: number;
  dayName: string;
  lessonsCount: number;
  studyMinutes: number;
  reviewItemsCount: number;
  loadScore: number; // 0 to 100
  loadLevel: 'light' | 'balanced' | 'heavy' | 'overload';
  summary: string;
  schoolHours: number;
  homeStudyHours: number;
  sleepHours: number;
  burnoutRisk: 'low' | 'moderate' | 'high';
}

export interface ScheduleAnalysisResult {
  totalStudyHours: number;
  totalHomeStudyHours: number;
  totalEbbinghausReviewHours: number;
  totalSameDayConsolidationHours: number;
  totalPrepTomorrowHours: number;
  hardSubjectsCount: number;
  averageSleepHours: number;
  burnoutIndex: number; // 0 to 100
  dailyLoads: DayScheduleAnalysis[];
  recommendations: {
    id: string;
    type: 'warning' | 'tip' | 'success' | 'timing';
    title: string;
    description: string;
  }[];
  goldenStudyWindows: string[];
}

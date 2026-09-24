import {
  StudentLesson,
  DayScheduleAnalysis,
  ScheduleAnalysisResult,
  TopicItem,
  StudentRoutineConfig,
  GeneratedStudyBlock,
  BusySlot,
  GoldenFreeWindow,
  SmartShortRestSuggestion,
} from '../types';
import {
  getNextReviewDate,
  isItemDue,
  toPersianDigits,
  PERSIAN_WEEK_DAYS,
  parseTimeStrToMinutes,
  formatMinutesToTimeStr,
} from './dateUtils';

export { parseTimeStrToMinutes, formatMinutesToTimeStr };

// Default daily routine for school students
export const DEFAULT_STUDENT_ROUTINE: StudentRoutineConfig = {
  wakeUpTime: '06:30',
  schoolDepartureTime: '07:15',
  schoolReturnTime: '13:45',
  lunchRestMinutes: 60, // 13:45 to 14:45
  minLunchRestMinutes: 30, // Flexible limit under conflict
  allowFlexibleBreakWindows: true, // Auto-adjust rest windows on conflict
  bedTime: '23:00',
  studyBlockDuration: 60, // 60 minutes
  breakDuration: 15, // 15 minutes pomodoro break
  minBreakDuration: 5, // Flexible inter-block break limit under conflict
  targetHomeStudyHoursWeekdays: 4,
  targetHomeStudyHoursWeekend: 6.5,
  priorityFocus: 'balanced',
  isExamModeActive: false,
};

// Default starter templates for high school students
export const STUDENT_PRESETS = [
  {
    id: 'experimental_science',
    title: 'رشته علوم تجربی (دبیرستان / کنکور)',
    description: 'ترکیب زیست‌شناسی، شیمی، فیزیک، ریاضی و دروس عمومی',
    lessons: [
      { id: 'l_sat_1', subject: 'زیست‌شناسی تخصصی', dayOfWeek: 6, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'l_sat_2', subject: 'شیمی', dayOfWeek: 6, startTime: '09:45', endTime: '11:15', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'l_sat_3', subject: 'ادبیات فارسی', dayOfWeek: 6, startTime: '11:30', endTime: '13:00', difficulty: 'easy' as const, type: 'school_class' as const },
      
      { id: 'l_sun_1', subject: 'فیزیک', dayOfWeek: 0, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'l_sun_2', subject: 'ریاضی تجربی', dayOfWeek: 0, startTime: '09:45', endTime: '11:15', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'l_sun_3', subject: 'دین و زندگی', dayOfWeek: 0, startTime: '11:30', endTime: '13:00', difficulty: 'easy' as const, type: 'school_class' as const },

      { id: 'l_mon_1', subject: 'زیست‌شناسی (آزمایشگاه و تست)', dayOfWeek: 1, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'l_mon_2', subject: 'عربی تخصصی', dayOfWeek: 1, startTime: '09:45', endTime: '11:15', difficulty: 'medium' as const, type: 'school_class' as const },
      { id: 'l_mon_3', subject: 'زبان انگلیسی', dayOfWeek: 1, startTime: '11:30', endTime: '13:00', difficulty: 'medium' as const, type: 'school_class' as const },

      { id: 'l_tue_1', subject: 'شیمی و حل تمرین', dayOfWeek: 2, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'l_tue_2', subject: 'فیزیک تجربی', dayOfWeek: 2, startTime: '09:45', endTime: '11:15', difficulty: 'hard' as const, type: 'school_class' as const },

      { id: 'l_wed_1', subject: 'زمین‌شناسی و عمومی', dayOfWeek: 3, startTime: '08:00', endTime: '09:30', difficulty: 'easy' as const, type: 'school_class' as const },
      { id: 'l_wed_2', subject: 'آزمون هفتگی / مرور', dayOfWeek: 3, startTime: '10:00', endTime: '12:00', difficulty: 'medium' as const, type: 'exam' as const },
    ],
  },
  {
    id: 'mathematics',
    title: 'رشته ریاضی و فیزیک (دبیرستان / کنکور)',
    description: 'ترکیب حسابان، هندسه، گسسته، فیزیک، شیمی و دروس عمومی',
    lessons: [
      { id: 'm_sat_1', subject: 'حسابان', dayOfWeek: 6, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'm_sat_2', subject: 'فیزیک', dayOfWeek: 6, startTime: '09:45', endTime: '11:15', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'm_sat_3', subject: 'شیمی', dayOfWeek: 6, startTime: '11:30', endTime: '13:00', difficulty: 'medium' as const, type: 'school_class' as const },

      { id: 'm_sun_1', subject: 'هندسه تحلیلی', dayOfWeek: 0, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'm_sun_2', subject: 'گسسته و جبر', dayOfWeek: 0, startTime: '09:45', endTime: '11:15', difficulty: 'hard' as const, type: 'school_class' as const },

      { id: 'm_mon_1', subject: 'فیزیک پیشرفته', dayOfWeek: 1, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'm_mon_2', subject: 'ادبیات و زبان', dayOfWeek: 1, startTime: '09:45', endTime: '11:15', difficulty: 'easy' as const, type: 'school_class' as const },

      { id: 'm_tue_1', subject: 'حسابان و حل مسائل', dayOfWeek: 2, startTime: '08:00', endTime: '10:00', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'm_wed_1', subject: 'شیمی تخصصی', dayOfWeek: 3, startTime: '08:30', endTime: '10:30', difficulty: 'hard' as const, type: 'school_class' as const },
    ],
  },
  {
    id: 'humanities',
    title: 'رشته علوم انسانی',
    description: 'ترکیب فلسفه و منطق، ادبیات تخصصی، عربی، جامعه‌شناسی، تاریخ و جغرافیا',
    lessons: [
      { id: 'h_sat_1', subject: 'فلسفه و منطق', dayOfWeek: 6, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'h_sat_2', subject: 'علوم و فنون ادبی', dayOfWeek: 6, startTime: '09:45', endTime: '11:15', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'h_sun_1', subject: 'عربی اختصاصی', dayOfWeek: 0, startTime: '08:00', endTime: '09:30', difficulty: 'hard' as const, type: 'school_class' as const },
      { id: 'h_sun_2', subject: 'جامعه‌شناسی', dayOfWeek: 0, startTime: '09:45', endTime: '11:15', difficulty: 'medium' as const, type: 'school_class' as const },
      { id: 'h_mon_1', subject: 'تاریخ و جغرافیا', dayOfWeek: 1, startTime: '08:00', endTime: '09:30', difficulty: 'medium' as const, type: 'school_class' as const },
      { id: 'h_tue_1', subject: 'اقتصاد و روان‌شناسی', dayOfWeek: 2, startTime: '08:00', endTime: '09:30', difficulty: 'medium' as const, type: 'school_class' as const },
    ],
  },
];

/**
 * Calculates night sleep duration in hours from bedTime to wakeUpTime
 */
export function calculateSleepDuration(bedTime: string, wakeUpTime: string): number {
  const bedMinutes = parseTimeStrToMinutes(bedTime);
  const wakeMinutes = parseTimeStrToMinutes(wakeUpTime);
  let diff = wakeMinutes - bedMinutes;
  if (diff < 0) {
    diff += 24 * 60;
  }
  return Math.round((diff / 60) * 10) / 10;
}

/**
 * Automatically synchronizes student lessons/curriculum with Ebbinghaus review topics list.
 * For each lesson in the student's schedule:
 * 1. Checks if an Ebbinghaus topic already exists for this lesson subject.
 * 2. If not, automatically creates a new TopicItem in the 5-stage Ebbinghaus spaced-repetition curve.
 * 3. Returns the merged/updated topic list and newly created topics.
 */
export function autoPopulateTopicsFromLessons(
  currentTopics: TopicItem[],
  lessons: StudentLesson[]
): { updatedTopics: TopicItem[]; createdCount: number; newTopics: TopicItem[] } {
  // Extract unique lesson subjects
  const uniqueLessonsMap = new Map<string, StudentLesson>();
  lessons.forEach((l) => {
    const key = l.subject.trim().toLowerCase();
    if (!uniqueLessonsMap.has(key)) {
      uniqueLessonsMap.set(key, l);
    }
  });

  const newTopics: TopicItem[] = [];
  const now = new Date();

  let index = 0;
  uniqueLessonsMap.forEach((lesson, key) => {
    const alreadyExists = currentTopics.some((t) => {
      const tSubject = (t.lessonSubject || '').trim().toLowerCase();
      const tTitle = t.title.trim().toLowerCase();
      return tSubject === key || tTitle === key || tTitle.includes(key);
    });

    if (!alreadyExists) {
      // Stagger initial dates realistically so they populate the Ebbinghaus pipeline smoothly
      const hoursAgo = (index % 5) * 7 + 8; // e.g. 8h, 15h, 22h, 29h ago
      const initialDate = new Date(now.getTime() - hoursAgo * 3600 * 1000).toISOString();

      const newTopic: TopicItem = {
        id: `topic_lesson_${lesson.id || Date.now()}_${index}`,
        title: lesson.subject,
        description: `مبحث درس «${lesson.subject}» (تولید خودکار از برنامه درسی هفتگی) - در چرخه ۵ مرحله‌ای مرور ابینگهاوس جهت دستیابی به تثبیت دائمی`,
        category: 'درسی و کنکور',
        lessonSubject: lesson.subject,
        difficulty: lesson.difficulty,
        tags: [
          'برنامه_درسی',
          lesson.subject,
          lesson.difficulty === 'hard' ? 'سخت' : lesson.difficulty === 'medium' ? 'متوسط' : 'ساده',
        ],
        initialDate,
        completedStages: 0,
        history: [],
        createdAt: now.toISOString(),
      };

      newTopics.push(newTopic);
      index++;
    }
  });

  return {
    updatedTopics: [...newTopics, ...currentTopics],
    createdCount: newTopics.length,
    newTopics,
  };
}

/**
 * Generates an intelligent, personalized weekly study timetable based on:
 * 1. School attendance and commute/lunch times
 * 2. Personal busy slots (sports, tutor, etc.)
 * 3. Daily active Ebbinghaus Spaced Repetitions (highest cognitive priority)
 * 4. Same-day school lessons consolidation (prevents immediate forgetting)
 * 5. Tomorrow's school lessons pre-study and homework preparation
 */
export interface TimeInterval {
  start: number;
  end: number;
  name: string;
}

/**
 * Merges overlapping or contiguous time intervals into clean disjoint intervals sorted by start time.
 */
export function mergeTimeIntervals(intervals: TimeInterval[]): TimeInterval[] {
  if (intervals.length === 0) return [];

  const sorted = [...intervals].sort((a, b) => a.start - b.start);
  const merged: TimeInterval[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.start <= last.end) {
      last.end = Math.max(last.end, current.end);
      if (current.name && !last.name.includes(current.name)) {
        last.name += ` + ${current.name}`;
      }
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

/**
 * Finds the next clean gap of `durationMinutes` starting from `startSearchMin` up to `availableEndMinutes`,
 * respecting all merged occupied intervals and maintaining a minimum buffer.
 */
export function findNextCleanSlot(
  startSearchMin: number,
  durationMinutes: number,
  mergedOccupied: TimeInterval[],
  availableEndMinutes: number,
  bufferMinutes: number = 10
): number {
  let candidate = Math.ceil(startSearchMin / 15) * 15;

  while (candidate + durationMinutes <= availableEndMinutes) {
    let hasConflict = false;
    for (const occ of mergedOccupied) {
      if (
        (candidate >= occ.start && candidate < occ.end) ||
        (candidate + durationMinutes > occ.start && candidate + durationMinutes <= occ.end) ||
        (candidate <= occ.start && candidate + durationMinutes >= occ.end)
      ) {
        hasConflict = true;
        candidate = Math.ceil((occ.end + bufferMinutes) / 15) * 15;
        break;
      }
    }
    if (!hasConflict) {
      return candidate;
    }
  }

  return -1;
}

/**
 * Collects all base occupied intervals for a given day (school hours, commute/rest, personal busy slots, dinner break).
 */
export function getOccupiedIntervalsForDay(
  dayOfWeek: number,
  lessons: StudentLesson[],
  busySlots: BusySlot[],
  routine: StudentRoutineConfig,
  ignoreLowPriorityBusy: boolean = false,
  overrideLunchRestMinutes?: number
): TimeInterval[] {
  const intervals: TimeInterval[] = [];
  const isWeekend = dayOfWeek === 4 || dayOfWeek === 5;

  // 1. School Lessons
  const todaySchoolLessons = lessons.filter((l) => l.dayOfWeek === dayOfWeek);
  todaySchoolLessons.forEach((l) => {
    intervals.push({
      start: parseTimeStrToMinutes(l.startTime),
      end: parseTimeStrToMinutes(l.endTime),
      name: `کلاس مدرسه: ${l.subject}`,
    });
  });

  // 2. School commute & lunch rest block
  if (!isWeekend) {
    const maxSchoolLessonEnd = todaySchoolLessons.reduce((max, l) => Math.max(max, parseTimeStrToMinutes(l.endTime)), 0);
    const schoolDept = parseTimeStrToMinutes(routine.schoolDepartureTime);
    const actualSchoolReturn = Math.max(parseTimeStrToMinutes(routine.schoolReturnTime), maxSchoolLessonEnd);
    const lunchMinutes = overrideLunchRestMinutes !== undefined ? overrideLunchRestMinutes : routine.lunchRestMinutes;
    intervals.push({
      start: schoolDept,
      end: actualSchoolReturn + lunchMinutes,
      name: 'ساعات مدرسه، مسیر برگشت و استراحت/ناهار',
    });
  }

  // 3. Personal active busy slots
  const activeBusyForDay = busySlots.filter((b) => b.isActive && b.daysOfWeek.includes(dayOfWeek));
  const filteredBusy = ignoreLowPriorityBusy
    ? activeBusyForDay.filter((b) => b.priority !== 'low')
    : activeBusyForDay;

  filteredBusy.forEach((b) => {
    intervals.push({
      start: parseTimeStrToMinutes(b.startTime),
      end: parseTimeStrToMinutes(b.endTime),
      name: b.title,
    });
  });

  // 4. Dinner & family break (20:00 - 20:45)
  intervals.push({
    start: 20 * 60,
    end: 20 * 60 + 45,
    name: 'شام و استراحت خانواده',
  });

  return mergeTimeIntervals(intervals);
}

/**
 * Generates an optimized, conflict-free weekly study plan based on school timetable,
 * personal busy commitments, and Ebbinghaus repetition queue.
 */
export function generateSmartStudyPlan(
  lessons: StudentLesson[],
  topics: TopicItem[],
  routine: StudentRoutineConfig = DEFAULT_STUDENT_ROUTINE,
  busySlots: BusySlot[] = []
): GeneratedStudyBlock[] {
  const generatedBlocks: GeneratedStudyBlock[] = [];

  const lessonsByDay: Record<number, StudentLesson[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  lessons.forEach((l) => {
    lessonsByDay[l.dayOfWeek]?.push(l);
  });

  const reviewsByDayOfWeek: Record<number, TopicItem[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  topics.forEach((t) => {
    if (t.completedStages < 5) {
      const nextDate = getNextReviewDate(t);
      if (nextDate) {
        reviewsByDayOfWeek[nextDate.getDay()]?.push(t);
      }
    }
  });

  const weekDays = [6, 0, 1, 2, 3, 4, 5];

  weekDays.forEach((dayOfWeek, idx) => {
    const nextDayOfWeek = weekDays[(idx + 1) % weekDays.length];
    const todaySchoolLessons = lessonsByDay[dayOfWeek] || [];
    const tomorrowSchoolLessons = lessonsByDay[nextDayOfWeek] || [];
    const todayReviews = reviewsByDayOfWeek[dayOfWeek] || [];
    const isWeekend = dayOfWeek === 4 || dayOfWeek === 5;

    const maxSchoolEnd = todaySchoolLessons.reduce((max, l) => Math.max(max, parseTimeStrToMinutes(l.endTime)), 0);

    let availableStartMinutes: number;
    if (isWeekend) {
      availableStartMinutes = parseTimeStrToMinutes(routine.wakeUpTime) + 75;
    } else {
      const actualSchoolReturn = Math.max(parseTimeStrToMinutes(routine.schoolReturnTime), maxSchoolEnd);
      availableStartMinutes = actualSchoolReturn + routine.lunchRestMinutes;
    }

    let bedMinutes = parseTimeStrToMinutes(routine.bedTime);
    if (bedMinutes < parseTimeStrToMinutes(routine.wakeUpTime)) {
      bedMinutes += 1440;
    }
    const availableEndMinutes = bedMinutes - 30;

    let occupied = getOccupiedIntervalsForDay(dayOfWeek, lessons, busySlots, routine, routine.isExamModeActive);

    const targetMinutes = (isWeekend ? routine.targetHomeStudyHoursWeekend : routine.targetHomeStudyHoursWeekdays) * 60;
    let allocatedMinutes = 0;
    let blockCounter = 1;

    const studyTasks: {
      title: string;
      category: GeneratedStudyBlock['category'];
      difficulty: 'easy' | 'medium' | 'hard';
      relatedSubject?: string;
      relatedTopicIds?: string[];
      notes?: string;
      priority: number;
    }[] = [];

    if (todayReviews.length > 0) {
      const reviewTitles = todayReviews.slice(0, 3).map((t) => t.title).join('، ') + (todayReviews.length > 3 ? '...' : '');
      studyTasks.push({
        title: `مرور فعال ابینگهاوس (${toPersianDigits(todayReviews.length)} مبحث: ${reviewTitles})`,
        category: 'ebbinghaus_review',
        difficulty: 'medium',
        relatedTopicIds: todayReviews.map((t) => t.id),
        notes: 'با تیک زدن این پارت، مراحل مرور این مباحث به صورت خودکار در سیستم ثبت می‌شود.',
        priority: routine.priorityFocus === 'ebbinghaus_first' ? 10 : 8,
      });
    }

    if (todaySchoolLessons.length > 0) {
      todaySchoolLessons.forEach((lesson) => {
        studyTasks.push({
          title: `تثبیت و مرور درس امروز: ${lesson.subject}`,
          category: 'same_day_consolidation',
          difficulty: lesson.difficulty,
          relatedSubject: lesson.subject,
          notes: 'حل تمارین کلاسی و خواندن جزوه تدریس‌شده امروز جهت تثبیت فوری سیناپسی',
          priority: lesson.difficulty === 'hard' ? 9 : 7,
        });

        if (lesson.difficulty === 'hard') {
          studyTasks.push({
            title: `تست و تمرین پیشرفته: ${lesson.subject}`,
            category: 'same_day_consolidation',
            difficulty: 'hard',
            relatedSubject: lesson.subject,
            notes: 'حل تست‌های چالشی و تمرین بیشتر برای درس سنگین امروز',
            priority: 8,
          });
        }
      });
    }

    if (tomorrowSchoolLessons.length > 0) {
      tomorrowSchoolLessons.forEach((lesson) => {
        studyTasks.push({
          title: `تکالیف و پیش‌خوانی فردا: ${lesson.subject}`,
          category: 'prep_tomorrow',
          difficulty: lesson.difficulty,
          relatedSubject: lesson.subject,
          notes: 'آمادگی برای تدریس یا پرسش کلاسی فردا',
          priority: routine.priorityFocus === 'homework_first' ? 10 : 6,
        });
      });
    }

    if (isWeekend) {
      studyTasks.push({
        title: 'حل تست و تسلط تحلیلی بر مباحث هفته',
        category: 'free_study',
        difficulty: 'hard',
        notes: 'تست‌زنی زمان‌دار و بررسی پاسخ‌نامه تشریحی مباحث دشوار',
        priority: 7,
      });
      studyTasks.push({
        title: 'جمع‌بندی دروس عمومی و مرور مراحل ۳ و ۴',
        category: 'free_study',
        difficulty: 'medium',
        notes: 'مرور متون، لغات و نکات کلیدی دروس عمومی',
        priority: 6,
      });
    }

    studyTasks.sort((a, b) => b.priority - a.priority);

    let cursor = availableStartMinutes;
    let taskIndex = 0;

    while (allocatedMinutes < targetMinutes) {
      const slotStart = findNextCleanSlot(cursor, routine.studyBlockDuration, occupied, availableEndMinutes, routine.breakDuration);
      if (slotStart === -1) {
        break;
      }

      const slotEnd = slotStart + routine.studyBlockDuration;
      const currentTask = studyTasks[taskIndex % Math.max(1, studyTasks.length)];
      taskIndex++;

      const blockTitle = currentTask ? currentTask.title : `پارت مطالعه و تست شماره ${toPersianDigits(blockCounter)}`;
      const blockCat = currentTask ? currentTask.category : 'free_study';
      const blockDiff = currentTask ? currentTask.difficulty : 'medium';
      const subjectMatch = currentTask?.relatedSubject;

      const matchedTopic = subjectMatch
        ? topics.find(
            (t) =>
              (t.lessonSubject && t.lessonSubject.trim().toLowerCase() === subjectMatch.trim().toLowerCase()) ||
              t.title.trim().toLowerCase() === subjectMatch.trim().toLowerCase() ||
              t.title.trim().toLowerCase().includes(subjectMatch.trim().toLowerCase())
          )
        : undefined;

      const blockRelatedTopicIds = currentTask?.relatedTopicIds || (matchedTopic ? [matchedTopic.id] : undefined);

      generatedBlocks.push({
        id: `gen_block_${dayOfWeek}_${blockCounter}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        dayOfWeek,
        startTime: formatMinutesToTimeStr(slotStart % 1440),
        endTime: formatMinutesToTimeStr(slotEnd % 1440),
        title: blockTitle,
        category: blockCat,
        difficulty: blockDiff,
        relatedSubject: subjectMatch,
        lessonSubject: subjectMatch,
        topicId: matchedTopic?.id,
        relatedTopicIds: blockRelatedTopicIds,
        targetMinutes: routine.studyBlockDuration,
        isCompleted: false,
        notes: currentTask?.notes,
      });

      occupied.push({
        start: slotStart,
        end: slotEnd,
        name: blockTitle,
      });
      occupied = mergeTimeIntervals(occupied);

      allocatedMinutes += routine.studyBlockDuration;
      blockCounter++;
      cursor = slotEnd + routine.breakDuration;
    }

    const windDownStart = availableEndMinutes - 20;
    if (windDownStart > cursor) {
      const cleanWindDown = findNextCleanSlot(windDownStart, 20, occupied, availableEndMinutes, 0);
      if (cleanWindDown !== -1) {
        generatedBlocks.push({
          id: `gen_block_${dayOfWeek}_wind_down_${Date.now()}`,
          dayOfWeek,
          startTime: formatMinutesToTimeStr(cleanWindDown % 1440),
          endTime: formatMinutesToTimeStr((cleanWindDown + 20) % 1440),
          title: 'مرور سریع قبل از خواب و آرام‌سازی ذهن',
          category: 'night_wind_down',
          difficulty: 'easy',
          isCompleted: false,
          notes: 'ورق زدن فلش‌کارت‌ها و خلاصه‌ها در تاریکی ملایم جهت تسریع تثبیت شبانه حافظه',
        });
      }
    }
  });

  return generatedBlocks;
}

export interface ScheduleConflict {
  block: GeneratedStudyBlock;
  conflictingTitle: string;
}

export function detectScheduleConflicts(
  blocks: GeneratedStudyBlock[],
  busySlots: BusySlot[],
  routine: StudentRoutineConfig,
  lessons: StudentLesson[] = []
): ScheduleConflict[] {
  const conflicts: ScheduleConflict[] = [];

  blocks.forEach((block) => {
    if (block.isCompleted) return;

    const blockStart = parseTimeStrToMinutes(block.startTime);
    let blockEnd = parseTimeStrToMinutes(block.endTime);
    if (blockEnd <= blockStart) blockEnd += 1440;

    const occupied = getOccupiedIntervalsForDay(block.dayOfWeek, lessons, busySlots, routine);

    for (const occ of occupied) {
      if (
        (blockStart >= occ.start && blockStart < occ.end) ||
        (blockEnd > occ.start && blockEnd <= occ.end) ||
        (blockStart <= occ.start && blockEnd >= occ.end)
      ) {
        conflicts.push({ block, conflictingTitle: occ.name });
        return;
      }
    }

    const sameDayBlocks = blocks.filter((b) => b.dayOfWeek === block.dayOfWeek && b.id !== block.id && !b.isCompleted);
    for (const other of sameDayBlocks) {
      const otherStart = parseTimeStrToMinutes(other.startTime);
      let otherEnd = parseTimeStrToMinutes(other.endTime);
      if (otherEnd <= otherStart) otherEnd += 1440;

      if (
        (blockStart >= otherStart && blockStart < otherEnd) ||
        (blockEnd > otherStart && blockEnd <= otherEnd) ||
        (blockStart <= otherStart && blockEnd >= otherEnd)
      ) {
        conflicts.push({ block, conflictingTitle: `پارت مطالعه دیگر: ${other.title}` });
        return;
      }
    }
  });

  return conflicts;
}

export function autoResolveConflicts(
  blocks: GeneratedStudyBlock[],
  busySlots: BusySlot[],
  routine: StudentRoutineConfig,
  lessons: StudentLesson[] = []
): GeneratedStudyBlock[] {
  let newBlocks = [...blocks];

  // Detect which days have conflicts
  const daysWithConflicts = new Set(
    detectScheduleConflicts(newBlocks, busySlots, routine, lessons).map((c) => c.block.dayOfWeek)
  );

  if (daysWithConflicts.size === 0) {
    return newBlocks;
  }

  daysWithConflicts.forEach((dayIndex) => {
    const dayBlocks = newBlocks.filter((b) => b.dayOfWeek === dayIndex);
    const otherDaysBlocks = newBlocks.filter((b) => b.dayOfWeek !== dayIndex);

    const completed = dayBlocks.filter((b) => b.isCompleted);
    // Sort uncompleted by cognitive priority (Ebbinghaus review first, hard lessons second), then original start time
    const uncompleted = dayBlocks
      .filter((b) => !b.isCompleted)
      .sort((a, b) => {
        const priorityA = a.category === 'ebbinghaus_review' ? 10 : a.difficulty === 'hard' ? 7 : 5;
        const priorityB = b.category === 'ebbinghaus_review' ? 10 : b.difficulty === 'hard' ? 7 : 5;
        if (priorityB !== priorityA) return priorityB - priorityA;
        return parseTimeStrToMinutes(a.startTime) - parseTimeStrToMinutes(b.startTime);
      });

    let bedMinutes = parseTimeStrToMinutes(routine.bedTime);
    if (bedMinutes < 720) bedMinutes += 1440;
    const availableEndMinutes = bedMinutes - 20;

    const useFlexibleBreaks = routine.allowFlexibleBreakWindows !== false;
    const effectiveLunchRest = useFlexibleBreaks ? (routine.minLunchRestMinutes ?? 30) : routine.lunchRestMinutes;
    const effectiveBreakDuration = useFlexibleBreaks ? (routine.minBreakDuration ?? 5) : routine.breakDuration;

    let occupied = getOccupiedIntervalsForDay(
      dayIndex,
      lessons,
      busySlots,
      routine,
      routine.isExamModeActive,
      effectiveLunchRest
    );

    completed.forEach((cb) => {
      const cStart = parseTimeStrToMinutes(cb.startTime);
      let cEnd = parseTimeStrToMinutes(cb.endTime);
      if (cEnd <= cStart) cEnd += 1440;
      occupied.push({ start: cStart, end: cEnd, name: cb.title });
    });
    occupied = mergeTimeIntervals(occupied);

    const now = new Date();
    const isWeekend = dayIndex === 4 || dayIndex === 5;
    let baseStart = 0;

    if (isWeekend) {
      baseStart = parseTimeStrToMinutes(routine.wakeUpTime) + 30;
    } else {
      const todaySchoolLessons = lessons.filter((l) => l.dayOfWeek === dayIndex);
      const maxSchoolEnd = todaySchoolLessons.reduce((max, l) => Math.max(max, parseTimeStrToMinutes(l.endTime)), 0);
      const actualSchoolReturn = Math.max(parseTimeStrToMinutes(routine.schoolReturnTime), maxSchoolEnd);
      baseStart = actualSchoolReturn + effectiveLunchRest;
    }

    let cursorMinutes = baseStart;
    if (dayIndex === now.getDay()) {
      const currentMins = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15;
      cursorMinutes = Math.max(cursorMinutes, currentMins);
    }

    const shifted: GeneratedStudyBlock[] = [];

    for (const block of uncompleted) {
      let origDur = parseTimeStrToMinutes(block.endTime) - parseTimeStrToMinutes(block.startTime);
      if (origDur <= 0) origDur = routine.studyBlockDuration;

      const durationsToTry = Array.from(
        new Set([origDur, 60, 45, 30, 20].filter((d) => d <= origDur && d >= 20))
      );
      if (durationsToTry.length === 0) durationsToTry.push(20);

      let foundSlot = -1;
      let chosenDur = origDur;

      // Pass 1: Try from cursorMinutes onwards
      for (const durCandidate of durationsToTry) {
        foundSlot = findNextCleanSlot(
          cursorMinutes,
          durCandidate,
          occupied,
          availableEndMinutes,
          effectiveBreakDuration
        );
        if (foundSlot !== -1) {
          chosenDur = durCandidate;
          break;
        }
      }

      // Pass 2: Search from baseStart onwards if cursor was ahead
      if (foundSlot === -1 && cursorMinutes > baseStart) {
        for (const durCandidate of durationsToTry) {
          foundSlot = findNextCleanSlot(
            baseStart,
            durCandidate,
            occupied,
            availableEndMinutes,
            effectiveBreakDuration
          );
          if (foundSlot !== -1) {
            chosenDur = durCandidate;
            break;
          }
        }
      }

      // Pass 3: Locate largest free gap anywhere on this day
      if (foundSlot === -1) {
        let maxGapStart = -1;
        let maxGapLength = 0;
        let searchCursor = baseStart;

        while (searchCursor + 15 <= availableEndMinutes) {
          const inOcc = occupied.find((o) => searchCursor >= o.start && searchCursor < o.end);
          if (inOcc) {
            searchCursor = Math.ceil(inOcc.end / 15) * 15;
          } else {
            const nextOcc = occupied
              .filter((o) => o.start > searchCursor)
              .sort((a, b) => a.start - b.start)[0];
            const gapEnd = nextOcc ? Math.min(nextOcc.start, availableEndMinutes) : availableEndMinutes;
            const gapLength = gapEnd - searchCursor;
            if (gapLength > maxGapLength) {
              maxGapLength = gapLength;
              maxGapStart = searchCursor;
            }
            searchCursor = gapEnd;
          }
        }

        if (maxGapStart !== -1 && maxGapLength >= 15) {
          foundSlot = maxGapStart;
          chosenDur = Math.min(origDur, maxGapLength);
        } else {
          const lastEnd = occupied.reduce((max, o) => Math.max(max, o.end), baseStart);
          foundSlot = Math.min(lastEnd + 5, availableEndMinutes - 20);
          chosenDur = 20;
        }
      }

      const newStartStr = formatMinutesToTimeStr(foundSlot % 1440);
      const newEndStr = formatMinutesToTimeStr((foundSlot + chosenDur) % 1440);

      const newBlock: GeneratedStudyBlock = {
        ...block,
        startTime: newStartStr,
        endTime: newEndStr,
      };

      shifted.push(newBlock);

      occupied.push({ start: foundSlot, end: foundSlot + chosenDur, name: block.title });
      occupied = mergeTimeIntervals(occupied);
      cursorMinutes = foundSlot + chosenDur + effectiveBreakDuration;
    }

    newBlocks = [...otherDaysBlocks, ...completed, ...shifted];
  });

  return newBlocks;
}

export function shiftRemainingBlocks(
  blocks: GeneratedStudyBlock[],
  busySlots: BusySlot[],
  routine: StudentRoutineConfig,
  lessons: StudentLesson[] = []
): GeneratedStudyBlock[] {
  const now = new Date();
  const todayIndex = now.getDay();
  let currentMinutes = Math.ceil((now.getHours() * 60 + now.getMinutes()) / 15) * 15;

  const todayBlocks = blocks.filter((b) => b.dayOfWeek === todayIndex);
  const otherDaysBlocks = blocks.filter((b) => b.dayOfWeek !== todayIndex);

  const completedToday = todayBlocks.filter((b) => b.isCompleted);
  const uncompletedToday = todayBlocks
    .filter((b) => !b.isCompleted)
    .sort((a, b) => {
      const priorityA = a.category === 'ebbinghaus_review' ? 10 : a.difficulty === 'hard' ? 7 : 5;
      const priorityB = b.category === 'ebbinghaus_review' ? 10 : b.difficulty === 'hard' ? 7 : 5;
      if (priorityB !== priorityA) return priorityB - priorityA;
      return parseTimeStrToMinutes(a.startTime) - parseTimeStrToMinutes(b.startTime);
    });

  let bedMinutes = parseTimeStrToMinutes(routine.bedTime);
  if (bedMinutes < 720) bedMinutes += 1440;
  const availableEndMinutes = bedMinutes - 20;

  if (uncompletedToday.length === 0 || currentMinutes >= availableEndMinutes) {
    return blocks;
  }

  let occupied = getOccupiedIntervalsForDay(todayIndex, lessons, busySlots, routine, routine.isExamModeActive);

  completedToday.forEach((cb) => {
    const cStart = parseTimeStrToMinutes(cb.startTime);
    let cEnd = parseTimeStrToMinutes(cb.endTime);
    if (cEnd <= cStart) cEnd += 1440;
    occupied.push({ start: cStart, end: cEnd, name: cb.title });
  });
  occupied = mergeTimeIntervals(occupied);

  const newUncompleted: GeneratedStudyBlock[] = [];
  let cursorMinutes = currentMinutes;

  for (const block of uncompletedToday) {
    let origDur = parseTimeStrToMinutes(block.endTime) - parseTimeStrToMinutes(block.startTime);
    if (origDur <= 0) origDur = routine.studyBlockDuration;

    const durationsToTry = Array.from(
      new Set([origDur, 60, 45, 30, 20].filter((d) => d <= origDur && d >= 20))
    );
    if (durationsToTry.length === 0) durationsToTry.push(20);

    let foundSlot = -1;
    let chosenDur = origDur;

    for (const durCandidate of durationsToTry) {
      foundSlot = findNextCleanSlot(cursorMinutes, durCandidate, occupied, availableEndMinutes, routine.breakDuration);
      if (foundSlot !== -1) {
        chosenDur = durCandidate;
        break;
      }
    }

    if (foundSlot === -1) {
      // Find largest remaining free gap after cursorMinutes
      let maxGapStart = -1;
      let maxGapLength = 0;
      let searchCursor = cursorMinutes;

      while (searchCursor + 15 <= availableEndMinutes) {
        const inOcc = occupied.find((o) => searchCursor >= o.start && searchCursor < o.end);
        if (inOcc) {
          searchCursor = Math.ceil(inOcc.end / 15) * 15;
        } else {
          const nextOcc = occupied
            .filter((o) => o.start > searchCursor)
            .sort((a, b) => a.start - b.start)[0];
          const gapEnd = nextOcc ? Math.min(nextOcc.start, availableEndMinutes) : availableEndMinutes;
          const gapLength = gapEnd - searchCursor;
          if (gapLength > maxGapLength) {
            maxGapLength = gapLength;
            maxGapStart = searchCursor;
          }
          searchCursor = gapEnd;
        }
      }

      if (maxGapStart !== -1 && maxGapLength >= 15) {
        foundSlot = maxGapStart;
        chosenDur = Math.min(origDur, maxGapLength);
      } else {
        const lastEnd = occupied.reduce((max, o) => Math.max(max, o.end), cursorMinutes);
        foundSlot = Math.min(lastEnd + 5, availableEndMinutes - 20);
        chosenDur = 20;
      }
    }

    newUncompleted.push({
      ...block,
      startTime: formatMinutesToTimeStr(foundSlot % 1440),
      endTime: formatMinutesToTimeStr((foundSlot + chosenDur) % 1440),
    });

    occupied.push({ start: foundSlot, end: foundSlot + chosenDur, name: block.title });
    occupied = mergeTimeIntervals(occupied);
    cursorMinutes = foundSlot + chosenDur + routine.breakDuration;
  }

  return [...completedToday, ...newUncompleted, ...otherDaysBlocks];
}

/**
 * Automatically schedules a study/review block for a specific topic into today's timetable
 * guaranteeing ZERO conflicts with school hours, busy slots, and existing study blocks.
 */
export function scheduleTopicIntoDayWithoutConflict(
  topic: TopicItem,
  currentBlocks: GeneratedStudyBlock[],
  routine: StudentRoutineConfig,
  busySlots: BusySlot[],
  lessons: StudentLesson[] = [],
  dayOfWeek: number = new Date().getDay()
): { updatedBlocks: GeneratedStudyBlock[]; newBlock: GeneratedStudyBlock; added: boolean; reason: string } {
  const alreadyScheduled = currentBlocks.find(
    (b) =>
      b.dayOfWeek === dayOfWeek &&
      (b.topicId === topic.id ||
        (b.relatedTopicIds && b.relatedTopicIds.includes(topic.id)) ||
        (topic.lessonSubject && b.relatedSubject === topic.lessonSubject && b.category === 'ebbinghaus_review'))
  );

  if (alreadyScheduled) {
    return {
      updatedBlocks: currentBlocks,
      newBlock: alreadyScheduled,
      added: false,
      reason: `این مبحث از قبل برای ساعت ${toPersianDigits(alreadyScheduled.startTime)} تا ${toPersianDigits(alreadyScheduled.endTime)} در برنامه امروز قرار دارد.`,
    };
  }

  const now = new Date();
  const currentMinutes = dayOfWeek === now.getDay() ? now.getHours() * 60 + now.getMinutes() : 0;

  const todaySchoolLessons = lessons.filter((l) => l.dayOfWeek === dayOfWeek);
  const maxSchoolEnd = todaySchoolLessons.reduce((max, l) => Math.max(max, parseTimeStrToMinutes(l.endTime)), 0);
  const actualSchoolReturn = Math.max(parseTimeStrToMinutes(routine.schoolReturnTime), maxSchoolEnd);

  const schoolReturnMin = actualSchoolReturn + routine.lunchRestMinutes;
  let startSearchMin = Math.max(schoolReturnMin, currentMinutes + 10);
  startSearchMin = Math.ceil(startSearchMin / 15) * 15;

  let bedMin = parseTimeStrToMinutes(routine.bedTime);
  if (bedMin < 720) bedMin += 1440;
  const maxAvailableMin = bedMin - 25;

  let occupied = getOccupiedIntervalsForDay(dayOfWeek, lessons, busySlots, routine, routine.isExamModeActive);

  currentBlocks
    .filter((b) => b.dayOfWeek === dayOfWeek)
    .forEach((b) => {
      const bStart = parseTimeStrToMinutes(b.startTime);
      let bEnd = parseTimeStrToMinutes(b.endTime);
      if (bEnd <= bStart) bEnd += 1440;
      occupied.push({ start: bStart, end: bEnd, name: b.title });
    });

  occupied = mergeTimeIntervals(occupied);

  let targetDuration = topic.targetStudyMinutes || Math.min(45, routine.studyBlockDuration);

  let cleanStart = findNextCleanSlot(startSearchMin, targetDuration, occupied, maxAvailableMin, 10);

  if (cleanStart === -1 && targetDuration > 30) {
    targetDuration = 30;
    cleanStart = findNextCleanSlot(startSearchMin, targetDuration, occupied, maxAvailableMin, 10);
  }

  if (cleanStart === -1) {
    const lastEnd = occupied.length > 0 ? occupied[occupied.length - 1].end + 10 : startSearchMin;
    cleanStart = Math.ceil(lastEnd / 15) * 15;
  }

  const newBlock: GeneratedStudyBlock = {
    id: `auto_block_${topic.id}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
    dayOfWeek,
    startTime: formatMinutesToTimeStr(cleanStart % 1440),
    endTime: formatMinutesToTimeStr((cleanStart + targetDuration) % 1440),
    title: `مرور ابینگهاوس: ${topic.title}`,
    category: 'ebbinghaus_review',
    difficulty: topic.difficulty || 'medium',
    relatedSubject: topic.lessonSubject || topic.category,
    lessonSubject: topic.lessonSubject,
    topicId: topic.id,
    relatedTopicIds: [topic.id],
    targetMinutes: targetDuration,
    isCompleted: false,
    notes: `پارت مطالعه هوشمند بدون تداخل برای مرحله ${toPersianDigits(topic.completedStages + 1)} ابینگهاوس`,
  };

  const updatedBlocks = [...currentBlocks, newBlock].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
    return parseTimeStrToMinutes(a.startTime) - parseTimeStrToMinutes(b.startTime);
  });

  return {
    updatedBlocks,
    newBlock,
    added: true,
    reason: `پارت مرور در ساعت ${toPersianDigits(newBlock.startTime)} تا ${toPersianDigits(newBlock.endTime)} بدون تداخل با برنامه روزانه تنظیم شد.`,
  };
}

/**
 * Automatically places all active / due topics into today's timetable with guaranteed conflict prevention.
 */
export function autoSyncAllDueTopicsToToday(
  topics: TopicItem[],
  currentBlocks: GeneratedStudyBlock[],
  routine: StudentRoutineConfig,
  busySlots: BusySlot[],
  lessons: StudentLesson[] = [],
  dayOfWeek: number = new Date().getDay()
): { updatedBlocks: GeneratedStudyBlock[]; addedCount: number; reasons: string[] } {
  let blocks = [...currentBlocks];
  let addedCount = 0;
  const reasons: string[] = [];
  const now = new Date();

  const targetTopics = topics.filter((t) => {
    if (t.completedStages >= 5) return false;
    return isItemDue(t, now) || t.completedStages < 5;
  });

  targetTopics.forEach((topic) => {
    const res = scheduleTopicIntoDayWithoutConflict(topic, blocks, routine, busySlots, lessons, dayOfWeek);
    if (res.added) {
      blocks = res.updatedBlocks;
      addedCount++;
      reasons.push(`${topic.title}: ${res.newBlock.startTime} تا ${res.newBlock.endTime}`);
    }
  });

  return { updatedBlocks: blocks, addedCount, reasons };
}

/**
 * Advanced cross-analysis between school timetable, daily routine, and active Ebbinghaus repetitions

 */
export function analyzeStudentSchedule(
  lessons: StudentLesson[],
  topics: TopicItem[],
  routine: StudentRoutineConfig = DEFAULT_STUDENT_ROUTINE,
  generatedBlocks: GeneratedStudyBlock[] = []
): ScheduleAnalysisResult {
  let totalSchoolMinutes = 0;
  let totalHomeStudyMinutes = 0;
  let hardCount = 0;

  // Group lessons by day (0 to 6)
  const lessonsByDay: Record<number, StudentLesson[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  lessons.forEach((lesson) => {
    lessonsByDay[lesson.dayOfWeek]?.push(lesson);
    const duration = Math.max(0, parseTimeStrToMinutes(lesson.endTime) - parseTimeStrToMinutes(lesson.startTime));
    totalSchoolMinutes += duration;
    if (lesson.difficulty === 'hard') {
      hardCount++;
    }
  });

  let totalEbbinghausMinutes = 0;
  let totalSameDayMinutes = 0;
  let totalPrepTomorrowMinutes = 0;

  // Group generated home study blocks by day
  const blocksByDay: Record<number, GeneratedStudyBlock[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  generatedBlocks.forEach((block) => {
    blocksByDay[block.dayOfWeek]?.push(block);
    const duration = Math.max(0, parseTimeStrToMinutes(block.endTime) - parseTimeStrToMinutes(block.startTime));
    totalHomeStudyMinutes += duration;
    if (block.category === 'ebbinghaus_review') {
      totalEbbinghausMinutes += duration;
    } else if (block.category === 'same_day_consolidation') {
      totalSameDayMinutes += duration;
    } else if (block.category === 'prep_tomorrow') {
      totalPrepTomorrowMinutes += duration;
    }
  });

  // Calculate upcoming reviews per day of week
  const reviewsByDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
  topics.forEach((t) => {
    if (t.completedStages < 5) {
      const nextDate = getNextReviewDate(t);
      if (nextDate) {
        reviewsByDayOfWeek[nextDate.getDay()] = (reviewsByDayOfWeek[nextDate.getDay()] || 0) + 1;
      }
    }
  });

  // Sleep hours
  const sleepHours = calculateSleepDuration(routine.bedTime, routine.wakeUpTime);

  const dailyLoads: DayScheduleAnalysis[] = PERSIAN_WEEK_DAYS.map((pwd) => {
    const dayLessons = lessonsByDay[pwd.dayIndex] || [];
    const dayBlocks = blocksByDay[pwd.dayIndex] || [];
    let daySchoolMinutes = 0;
    let dayHardCount = 0;

    dayLessons.forEach((l) => {
      const dur = Math.max(0, parseTimeStrToMinutes(l.endTime) - parseTimeStrToMinutes(l.startTime));
      daySchoolMinutes += dur;
      if (l.difficulty === 'hard') dayHardCount += 1.5;
    });

    let dayHomeStudyMinutes = 0;
    dayBlocks.forEach((b) => {
      const dur = Math.max(0, parseTimeStrToMinutes(b.endTime) - parseTimeStrToMinutes(b.startTime));
      dayHomeStudyMinutes += dur;
      if (b.difficulty === 'hard') dayHardCount += 1;
    });

    const reviewsCount = reviewsByDayOfWeek[pwd.dayIndex] || 0;

    // Load score formula: (school minutes / 6) + (home study / 5) + (hard lessons * 8) + (reviews * 10)
    const rawScore = Math.round((daySchoolMinutes / 6) + (dayHomeStudyMinutes / 5) + (dayHardCount * 8) + (reviewsCount * 10));
    const loadScore = Math.min(100, Math.max(0, rawScore));

    let loadLevel: 'light' | 'balanced' | 'heavy' | 'overload' = 'light';
    let summary = 'روز سبک و آرام با فرصت عالی برای تثبیت عمیق یا استراحت ریکاوری';

    if (loadScore > 75) {
      loadLevel = 'overload';
      summary = `فشردگی بسیار بالا (${toPersianDigits(dayLessons.length)} زنگ مدرسه + ${toPersianDigits(dayBlocks.length)} پارت منزل). ریسک خستگی عصبی و کاهش تمرکز.`;
    } else if (loadScore > 50) {
      loadLevel = 'heavy';
      summary = `روز پرمشغله با دروس تخصصی. حتماً بین پارت‌ها استراحت پومودورو را جدی بگیرید.`;
    } else if (loadScore > 25) {
      loadLevel = 'balanced';
      summary = `توازن ایده‌آل بین کلاس مدرسه، مرورهای ابینگهاوس و مطالعه منزل.`;
    }

    let burnoutRisk: 'low' | 'moderate' | 'high' = 'low';
    if (loadScore > 75 || (sleepHours < 6.5 && loadScore > 60)) {
      burnoutRisk = 'high';
    } else if (loadScore > 50 || sleepHours < 7) {
      burnoutRisk = 'moderate';
    }

    return {
      dayIndex: pwd.dayIndex,
      dayName: pwd.name,
      lessonsCount: dayLessons.length,
      studyMinutes: daySchoolMinutes + dayHomeStudyMinutes,
      reviewItemsCount: reviewsCount,
      loadScore,
      loadLevel,
      summary,
      schoolHours: Math.round((daySchoolMinutes / 60) * 10) / 10,
      homeStudyHours: Math.round((dayHomeStudyMinutes / 60) * 10) / 10,
      sleepHours,
      burnoutRisk,
    };
  });

  // Calculate overall burnout index
  const avgLoad = dailyLoads.reduce((acc, d) => acc + d.loadScore, 0) / 7;
  const sleepDeficitPenalty = sleepHours < 7 ? (7 - sleepHours) * 12 : 0;
  const burnoutIndex = Math.min(100, Math.round(avgLoad * 0.7 + sleepDeficitPenalty));

  // Generate actionable recommendations
  const recommendations: ScheduleAnalysisResult['recommendations'] = [];

  // Sleep check
  if (sleepHours < 7) {
    recommendations.push({
      id: 'rec_sleep_deficit',
      type: 'warning',
      title: `کسری خواب شبانه (${toPersianDigits(sleepHours)} ساعت)`,
      description: `طبق یافته‌های عصب‌شناختی، تثبیت طولانی‌مدت رد حافظه در هیپوکامپ نیازمند حداقل ۷ الی ۸ ساعت خواب مداوم است. بیداری دیرهنگام (ساعت ${toPersianDigits(routine.bedTime)}) سبب پاک‌شدن مرورهای روز قبل می‌شود.`,
    });
  } else {
    recommendations.push({
      id: 'rec_sleep_good',
      type: 'success',
      title: `ساعات خواب شبانه استاندارد (${toPersianDigits(sleepHours)} ساعت)`,
      description: `خواب کافی شبانه از ساعت ${toPersianDigits(routine.bedTime)} تا ${toPersianDigits(routine.wakeUpTime)} بهترین بستر فیزیولوژیک را برای تثبیت سیناپسی مباحث ابینگهاوس فراهم می‌کند.`,
    });
  }

  // Check 1: Overloaded days
  const overloadedDays = dailyLoads.filter((d) => d.loadLevel === 'overload');
  if (overloadedDays.length > 0) {
    const dayNames = overloadedDays.map((d) => d.dayName).join(' و ');
    recommendations.push({
      id: 'rec_heavy_days',
      type: 'warning',
      title: `تراکم شناختی فوق سنگین در روزهای ${dayNames}`,
      description: `در این روزها هم‌پوشانی کلاس‌های مدرسه، تکالیف و موعدهای ابینگهاوس بسیار فشرده است. سیستم بخش عمده مرورهای سنگین را به روزهای خلوت‌تر منتقل می‌کند.`,
    });
  }

  // Check 2: Weekend efficiency
  const weekendLoads = dailyLoads.filter((d) => d.dayIndex === 5 || d.dayIndex === 4);
  const freeWeekend = weekendLoads.find((d) => d.loadLevel === 'light' || d.loadLevel === 'balanced');
  if (freeWeekend) {
    recommendations.push({
      id: 'rec_golden_weekend',
      type: 'timing',
      title: `پنجره طلایی روز ${freeWeekend.dayName} برای مرورهای مرحله ۴ و ۵`,
      description: `به دلیل تعطیلی مدرسه در روز ${freeWeekend.dayName}، پارت‌های صبحگاهی (ساعت ۹ الی ۱۲) بالاترین تمرکز را برای مرورهای ۱۵ روزه و ۳۰ روزه فراهم می‌سازد.`,
    });
  }

  // Check 3: Ratio of hard subjects
  if (hardCount >= 5) {
    recommendations.push({
      id: 'rec_hard_balance',
      type: 'tip',
      title: `تکنیک تغییر درس (Interleaving) برای ${toPersianDigits(hardCount)} زنگ سنگین`,
      description: `خواندن دو درس محاسباتی سنگین به صورت متوالی سبب تداخل پرواکتیو (Proactive Interference) می‌شود. برنامه خودکار یک پارت عمومی یا مرور ابینگهاوس بین دروس سنگین قرار داده است.`,
    });
  }

  // Golden study windows calculated based on routine
  const returnMinutes = parseTimeStrToMinutes(routine.schoolReturnTime);
  const primeAfternoonStart = formatMinutesToTimeStr(returnMinutes + routine.lunchRestMinutes);
  const primeAfternoonEnd = formatMinutesToTimeStr(returnMinutes + routine.lunchRestMinutes + 90);
  const bedMinutes = parseTimeStrToMinutes(routine.bedTime);
  const primeEveningStart = formatMinutesToTimeStr((bedMinutes - 100 + 1440) % 1440);
  const primeEveningEnd = formatMinutesToTimeStr((bedMinutes - 25 + 1440) % 1440);

  const goldenStudyWindows = [
    `پنجره طلایی ۱ (عصر): ساعت ${toPersianDigits(primeAfternoonStart)} تا ${toPersianDigits(primeAfternoonEnd)} (پس از ریکاوری بازگشت از مدرسه، بالاترین بازده شناختی قشر پیش‌پیشانی)`,
    `پنجره طلایی ۲ (شبانه): ساعت ${toPersianDigits(primeEveningStart)} تا ${toPersianDigits(primeEveningEnd)} (مرورهای سریع ابینگهاوس پیش از خواب، ورود مستقیم اطلاعات به چرخه REM خواب)`,
  ];

  return {
    totalStudyHours: Math.round(((totalSchoolMinutes + totalHomeStudyMinutes) / 60) * 10) / 10,
    totalHomeStudyHours: Math.round((totalHomeStudyMinutes / 60) * 10) / 10,
    totalEbbinghausReviewHours: Math.round((totalEbbinghausMinutes / 60) * 10) / 10,
    totalSameDayConsolidationHours: Math.round((totalSameDayMinutes / 60) * 10) / 10,
    totalPrepTomorrowHours: Math.round((totalPrepTomorrowMinutes / 60) * 10) / 10,
    hardSubjectsCount: hardCount,
    averageSleepHours: sleepHours,
    burnoutIndex,
    dailyLoads,
    recommendations,
    goldenStudyWindows,
  };
}

/**
 * Scans the student's entire week and identifies contiguous unassigned golden free time windows
 * (>= 45 mins) suitable for deep work, long reviews, and Ebbinghaus consolidation.
 */
export function findGoldenFreeWindows(
  lessons: StudentLesson[],
  busySlots: BusySlot[],
  routine: StudentRoutineConfig,
  studyBlocks: GeneratedStudyBlock[] = []
): GoldenFreeWindow[] {
  const goldenWindows: GoldenFreeWindow[] = [];
  const weekDays = [6, 0, 1, 2, 3, 4, 5]; // Sat to Fri
  const wakeMins = parseTimeStrToMinutes(routine.wakeUpTime);
  let bedMins = parseTimeStrToMinutes(routine.bedTime);
  if (bedMins <= wakeMins) bedMins += 1440;

  weekDays.forEach((dayIndex) => {
    const dayName = PERSIAN_WEEK_DAYS.find((d) => d.dayIndex === dayIndex)?.name || '';
    const isWeekend = dayIndex === 4 || dayIndex === 5;

    // Occupied intervals on this day including school, busy slots, routine lunch, and existing study blocks
    let occupied = getOccupiedIntervalsForDay(dayIndex, lessons, busySlots, routine, routine.isExamModeActive);

    const dayBlocks = studyBlocks.filter((b) => b.dayOfWeek === dayIndex);
    dayBlocks.forEach((b) => {
      const bStart = parseTimeStrToMinutes(b.startTime);
      let bEnd = parseTimeStrToMinutes(b.endTime);
      if (bEnd <= bStart) bEnd += 1440;
      occupied.push({
        start: bStart,
        end: bEnd,
        name: b.title,
      });
    });
    occupied = mergeTimeIntervals(occupied);

    // Calculate free scan boundaries
    const scanStart = isWeekend ? wakeMins + 45 : parseTimeStrToMinutes(routine.schoolReturnTime) + routine.lunchRestMinutes;
    const scanEnd = bedMins - 20;

    let currentCursor = scanStart;
    while (currentCursor + 45 <= scanEnd) {
      const inOcc = occupied.find((o) => currentCursor >= o.start && currentCursor < o.end);
      if (inOcc) {
        currentCursor = Math.ceil(inOcc.end / 15) * 15;
      } else {
        const nextOcc = occupied.filter((o) => o.start > currentCursor).sort((a, b) => a.start - b.start)[0];
        const gapEnd = nextOcc ? Math.min(nextOcc.start, scanEnd) : scanEnd;
        const duration = gapEnd - currentCursor;

        if (duration >= 45) {
          // Calculate Quality Score (0 - 100)
          let score = Math.min(60, Math.round((duration / 180) * 50) + 15);

          // Cognitive alertness time-of-day bonus
          if (currentCursor >= 480 && currentCursor <= 720) {
            // 08:00 to 12:00
            score += 25;
          } else if (currentCursor >= 900 && currentCursor <= 1140) {
            // 15:00 to 19:00
            score += 15;
          } else if (currentCursor >= 1140 && currentCursor <= 1320) {
            // 19:00 to 22:00
            score += 10;
          }

          if (isWeekend) score += 15;
          if (duration >= 120) score += 15;

          score = Math.min(100, score);

          let type: GoldenFreeWindow['type'] = 'consolidation';
          let title = 'بازه متمرکز مطالعه و حل تمرین';
          let description = `${toPersianDigits(Math.floor(duration / 60))} ساعت${duration % 60 > 0 ? ` و ${toPersianDigits(duration % 60)} دقیقه` : ''} زمان آزاد یکپارچه`;
          let reason = 'فرصت عالی برای مطالعه عمیق و پیش‌برد اهداف درسی هفته';

          if (duration >= 120) {
            type = 'deep_work';
            title = '🌟 بازه طلایی یادگیری عمیق (Deep Work)';
            description = `${toPersianDigits(Math.floor(duration / 60))} ساعت و ${toPersianDigits(duration % 60)} دقیقه زمان طلایی کاملاً یکپارچه و بدون تداخل`;
            reason = 'ایده‌آل برای یادگیری فصل‌های سنگین (زیست، حسابان، فیزیک)، حل تست‌های کنکوری و تحلیل پیشرفته';
          } else if (duration >= 90) {
            type = 'long_review';
            title = '🧠 بازه ویژه مرورهای جامع و ابینگهاوس';
            description = `${toPersianDigits(duration)} دقیقه بازه عمیق مطالعاتی بدون وقفه`;
            reason = 'مناسب برای مرور مراحل ۳ و ۴ ابینگهاوس، خلاصه‌نویسی و بازیابی فعال مطالب';
          } else if (currentCursor < 720) {
            type = 'consolidation';
            title = '⚡ بازه تمرکز صبحگاهی با بازدهی بالا';
            reason = 'سطح بالای هوشیاری ذهنی در ساعات اولیه روز برای دروس تخصصی و مفهومی';
          }

          goldenWindows.push({
            id: `golden_${dayIndex}_${currentCursor}_${duration}`,
            dayOfWeek: dayIndex,
            dayName,
            startTime: formatMinutesToTimeStr(currentCursor % 1440),
            endTime: formatMinutesToTimeStr(gapEnd % 1440),
            durationMinutes: duration,
            qualityScore: score,
            type,
            title,
            description,
            reason,
            suggestedActionLabel: 'افزودن پارت مطالعه در این بازه',
          });
        }

        currentCursor = Math.ceil(gapEnd / 15) * 15;
      }
    }
  });

  return goldenWindows.sort((a, b) => b.qualityScore - a.qualityScore);
}

/**
 * Scans the student's schedule for short free gaps (10 to 35 mins) between heavy study blocks or busy slots,
 * and recommends cognitive micro-breaks (Power Nap, Eye Relaxation, Hydration & Stretching) to prevent mental fatigue.
 */
export function findSmartShortRestSuggestions(
  lessons: StudentLesson[],
  busySlots: BusySlot[],
  routine: StudentRoutineConfig,
  studyBlocks: GeneratedStudyBlock[] = []
): SmartShortRestSuggestion[] {
  const suggestions: SmartShortRestSuggestion[] = [];
  const weekDays = [6, 0, 1, 2, 3, 4, 5];
  const wakeMins = parseTimeStrToMinutes(routine.wakeUpTime);
  let bedMins = parseTimeStrToMinutes(routine.bedTime);
  if (bedMins <= wakeMins) bedMins += 1440;

  weekDays.forEach((dayIndex) => {
    const dayName = PERSIAN_WEEK_DAYS.find((d) => d.dayIndex === dayIndex)?.name || '';
    const isWeekend = dayIndex === 4 || dayIndex === 5;

    let occupied = getOccupiedIntervalsForDay(dayIndex, lessons, busySlots, routine, routine.isExamModeActive);

    const dayBlocks = studyBlocks.filter((b) => b.dayOfWeek === dayIndex);
    dayBlocks.forEach((b) => {
      const bStart = parseTimeStrToMinutes(b.startTime);
      let bEnd = parseTimeStrToMinutes(b.endTime);
      if (bEnd <= bStart) bEnd += 1440;
      occupied.push({ start: bStart, end: bEnd, name: b.title });
    });

    occupied = mergeTimeIntervals(occupied);

    const scanStart = isWeekend ? wakeMins + 60 : parseTimeStrToMinutes(routine.schoolReturnTime);
    const scanEnd = bedMins - 15;

    let cursor = scanStart;
    while (cursor + 10 <= scanEnd) {
      const inOcc = occupied.find((o) => cursor >= o.start && cursor < o.end);
      if (inOcc) {
        cursor = inOcc.end;
      } else {
        const nextOcc = occupied.filter((o) => o.start > cursor).sort((a, b) => a.start - b.start)[0];
        const gapEnd = nextOcc ? Math.min(nextOcc.start, scanEnd) : scanEnd;
        const gapMins = gapEnd - cursor;

        if (gapMins >= 10 && gapMins <= 35) {
          let type: SmartShortRestSuggestion['type'] = 'eye_relax';
          let iconType: SmartShortRestSuggestion['iconType'] = 'eye';
          let title = 'استراحت کوتاه چشمی و تکنیک ۲۰-۲۰-۲۰';
          let benefit = 'کاهش خستگی عضلات چشم و بازیابی تمرکز مانیتورینگ';
          let recommendation = 'به مدت ۲۰ ثانیه به شیئی در فاصله ۶ متری نگاه کرده و کشش گردن انجام دهید.';

          if (cursor >= 810 && cursor <= 960 && gapMins >= 15) {
            type = 'power_nap';
            iconType = 'battery';
            title = 'چُرت انرژی‌بخش (Power Nap ۱۵ الی ۲۰ دقیقه‌ای)';
            benefit = 'شارژ هوشیاری و تخلیه آدنوزین مغزی برای یادگیری سنگین بعدازظهر';
            recommendation = 'در فضایی تاریک و آرام ۱۵ تا ۲۰ دقیقه چشمان خود را ببندید (خواب بیش از ۳۰ دقیقه پیشنهاد نمی‌شود).';
          } else if (gapMins >= 15 && gapMins <= 25) {
            type = 'walk_hydration';
            iconType = 'heart';
            title = 'هیدراتاسیون و تحرک سبک بین‌پارتی';
            benefit = 'افزایش اکسیژن‌رسانی به قشر پیش‌پیشانی و بهبود سرعت پردازش';
            recommendation = 'یک لیوان آب خنک بنوشید و ۵ دقیقه پیاده‌روی کوتاه در منزل داشته باشید.';
          } else if (cursor >= 1140) {
            type = 'buffer_recharge';
            iconType = 'coffee';
            title = 'تنفس عمیق و بازیابی آرامش شبانگاهی';
            benefit = 'کاهش سطح کورتیزول و تثبیت بهتر داده‌های درسی در حافظه بلدمدت';
            recommendation = 'تکنیک تنفس ۴-۷-۸ انجام دهید و از نور آبی موبایل و لپ‌تاپ فاصله بگیرید.';
          }

          suggestions.push({
            id: `short_rest_${dayIndex}_${cursor}_${gapMins}`,
            dayOfWeek: dayIndex,
            dayName,
            startTime: formatMinutesToTimeStr(cursor % 1440),
            endTime: formatMinutesToTimeStr(gapEnd % 1440),
            durationMinutes: gapMins,
            type,
            title,
            benefit,
            recommendation,
            iconType,
          });
        }

        cursor = gapEnd;
      }
    }
  });

  return suggestions.slice(0, 4);
}


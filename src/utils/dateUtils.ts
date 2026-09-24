import { STAGES, TopicItem, BusySlot, ConflictResolution } from '../types';

/**
 * Converts English digits to Persian digits
 */
export function toPersianDigits(input: number | string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(input).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

/**
 * Calculates the exact review Date for a given stage (1 to 5)
 * based strictly on the initial registration / study date.
 */
export function calculateStageDate(initialDateInput: Date | string, stageNumber: number): Date {
  const initialDate = typeof initialDateInput === 'string' ? new Date(initialDateInput) : initialDateInput;
  const stage = STAGES.find((s) => s.stageNumber === stageNumber);
  if (!stage) {
    throw new Error(`مرحله نامعتبر: ${stageNumber}`);
  }
  return new Date(initialDate.getTime() + stage.hoursFromStart * 60 * 60 * 1000);
}

/**
 * Gets the next review Date for a topic item.
 * If completedStages >= 5, returns null (topic is completed).
 */
export function getNextReviewDate(item: TopicItem): Date | null {
  if (item.completedStages >= 5) {
    return null;
  }
  const nextStageNumber = item.completedStages + 1;
  return calculateStageDate(item.initialDate, nextStageNumber);
}

/**
 * Checks if a topic is ready for review (now >= nextReviewDate and not completed)
 */
export function isItemDue(item: TopicItem, now: Date = new Date()): boolean {
  if (item.completedStages >= 5) {
    return false;
  }
  const nextReview = getNextReviewDate(item);
  if (!nextReview) return false;
  return now.getTime() >= nextReview.getTime();
}

/**
 * Formats a Date object into Persian (Solar Hijri) Date & Time
 * e.g., "دوشنبه ۱۷ شهریور ۱۴۰۵، ساعت ۱۳:۴۵"
 */
export function formatPersianDateTime(dateInput: Date | string | null): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date);
  } catch {
    // Fallback if Intl is not supported with calendar
    return date.toLocaleString('fa-IR');
  }
}

/**
 * Formats date into simple Shamsi date
 * e.g. "۱۷ شهریور ۱۴۰۵"
 */
export function formatPersianDate(dateInput: Date | string | null): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return formatter.format(date);
  } catch {
    return date.toLocaleDateString('fa-IR');
  }
}

/**
 * Formats time into HH:mm in Persian digits
 */
export function formatPersianTime(dateInput: Date | string | null): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  try {
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(date);
  } catch {
    return date.toLocaleTimeString('fa-IR');
  }
}

/**
 * Calculates human-readable relative time in Persian
 */
export function getRelativeTimePersian(targetDateInput: Date | string, now: Date = new Date()): {
  text: string;
  isDue: boolean;
  diffMinutes: number;
} {
  const targetDate = typeof targetDateInput === 'string' ? new Date(targetDateInput) : targetDateInput;
  const diffMs = targetDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  const absMinutes = Math.abs(diffMinutes);

  if (diffMs <= 0) {
    if (absMinutes < 2) {
      return { text: 'هم‌اکنون موعد مرور است!', isDue: true, diffMinutes };
    }
    const hours = Math.floor(absMinutes / 60);
    const mins = absMinutes % 60;
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remHours = hours % 24;
      return {
        text: `${toPersianDigits(days)} روز و ${toPersianDigits(remHours)} ساعت پیش موعد بوده`,
        isDue: true,
        diffMinutes,
      };
    }
    if (hours > 0) {
      return {
        text: `${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه گذشته (آماده مرور)`,
        isDue: true,
        diffMinutes,
      };
    }
    return {
      text: `${toPersianDigits(mins)} دقیقه پیش موعد رسیده (آماده مرور)`,
      isDue: true,
      diffMinutes,
    };
  } else {
    const hours = Math.floor(diffMinutes / 60);
    const mins = diffMinutes % 60;
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remHours = hours % 24;
      return {
        text: `در ${toPersianDigits(days)} روز و ${toPersianDigits(remHours)} ساعت آینده`,
        isDue: false,
        diffMinutes,
      };
    }
    if (hours > 0) {
      return {
        text: `در ${toPersianDigits(hours)} ساعت و ${toPersianDigits(mins)} دقیقه آینده`,
        isDue: false,
        diffMinutes,
      };
    }
    return {
      text: `در ${toPersianDigits(mins)} دقیقه آینده`,
      isDue: false,
      diffMinutes,
    };
  }
}

/**
 * Converts a Date object to YYYY-MM-DDTHH:mm string for datetime-local input in local time
 */
export function toDatetimeLocalValue(date: Date = new Date()): string {
  const pad = (num: number) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Checks if two dates fall on the same day in local time
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Gets the Saturday (start of week in Persian calendar) for a given date
 */
export function getStartOfPersianWeek(date: Date): Date {
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  const diff = (day + 1) % 7; // days to subtract to get to Saturday
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - diff);
  saturday.setHours(0, 0, 0, 0);
  return saturday;
}

export interface ConsolidationEstimate {
  isCompleted: boolean;
  targetDate: Date;
  formattedTargetDate: string;
  remainingStages: number;
  remainingDays: number;
  remainingHours: number;
  statusText: string;
}

/**
 * Estimates the exact date and remaining time for full memory consolidation (Stage 5 completion)
 */
export function getConsolidationEstimate(item: TopicItem, now: Date = new Date()): ConsolidationEstimate {
  // Target date for stage 5 (720 hours = 30 days after initial date)
  const targetDate = calculateStageDate(item.initialDate, 5);
  const isCompleted = item.completedStages >= 5;
  const remainingStages = Math.max(0, 5 - item.completedStages);

  if (isCompleted) {
    const lastReview = item.history[item.history.length - 1];
    const completedAtDate = lastReview ? new Date(lastReview.reviewedAt) : targetDate;
    return {
      isCompleted: true,
      targetDate: completedAtDate,
      formattedTargetDate: formatPersianDateTime(completedAtDate),
      remainingStages: 0,
      remainingDays: 0,
      remainingHours: 0,
      statusText: 'دوره تثبیت در حافظه بلندمدت با موفقیت کامل شده است.',
    };
  }

  const diffMs = targetDate.getTime() - now.getTime();
  const remainingDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  const remainingHours = Math.max(0, Math.ceil(diffMs / (60 * 60 * 1000)));

  let statusText = '';
  if (diffMs <= 0) {
    statusText = 'موعد مرحله نهایی تثبیت فرا رسیده است (منتظر تایید مرور نهایی)';
  } else if (remainingDays <= 1) {
    statusText = `کمتر از ۲۴ ساعت (${toPersianDigits(remainingHours)} ساعت) تا پایان دوره تثبیت`;
  } else {
    statusText = `حدود ${toPersianDigits(remainingDays)} روز مانده تا تثبیت کامل (${toPersianDigits(remainingStages)} مرحله باقیمانده)`;
  }

  return {
    isCompleted: false,
    targetDate,
    formattedTargetDate: formatPersianDateTime(targetDate),
    remainingStages,
    remainingDays,
    remainingHours,
    statusText,
  };
}

export const PERSIAN_WEEK_DAYS = [
  { dayIndex: 6, key: 'sat', name: 'شنبه' },
  { dayIndex: 0, key: 'sun', name: 'یکشنبه' },
  { dayIndex: 1, key: 'mon', name: 'دوشنبه' },
  { dayIndex: 2, key: 'tue', name: 'سه‌شنبه' },
  { dayIndex: 3, key: 'wed', name: 'چهارشنبه' },
  { dayIndex: 4, key: 'thu', name: 'پنج‌شنبه' },
  { dayIndex: 5, key: 'fri', name: 'جمعه' },
];

export function parseTimeStrToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatMinutesToTimeStr(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Checks if a scheduled review datetime conflicts with any active busy slots (e.g. gym, university class, work).
 * If a conflict is found, automatically finds the nearest available free time slot (before or after the commitment).
 */
export function checkReviewConflict(
  scheduledDate: Date | null,
  busySlots: BusySlot[],
  now: Date = new Date()
): ConflictResolution | null {
  if (!scheduledDate || isNaN(scheduledDate.getTime())) return null;
  if (!busySlots || busySlots.length === 0) return null;

  const dayOfWeek = scheduledDate.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  const reviewMinutes = scheduledDate.getHours() * 60 + scheduledDate.getMinutes();

  // Find if any active busy slot covers this day and time
  for (const slot of busySlots) {
    if (!slot.isActive) continue;
    if (!slot.daysOfWeek.includes(dayOfWeek)) continue;

    const startMin = parseTimeStrToMinutes(slot.startTime);
    const endMin = parseTimeStrToMinutes(slot.endTime);

    // Review falls inside or within 10 minutes of the busy window
    if (reviewMinutes >= startMin - 10 && reviewMinutes <= endMin) {
      // Conflict detected! Calculate nearest available free time slot rounded to clean 15-minute intervals
      // Option A: 20 minutes before slot starts
      const rawBeforeMin = Math.max(0, startMin - 20);
      const beforeMin = Math.floor(rawBeforeMin / 15) * 15;
      const optBefore = new Date(scheduledDate);
      optBefore.setHours(Math.floor(beforeMin / 60), beforeMin % 60, 0, 0);

      // Option B: at least 10-15 minutes after slot ends, rounded up to clean 15-minute boundary
      const rawAfterMin = Math.min(1425, endMin + 10);
      const afterMin = Math.min(1425, Math.ceil(rawAfterMin / 15) * 15);
      const optAfter = new Date(scheduledDate);
      optAfter.setHours(Math.floor(afterMin / 60), afterMin % 60, 0, 0);

      // Decide which option is better:
      // If optBefore is already in the past relative to now, optAfter is the safe choice
      let chosenDate: Date;
      let reason: string;

      if (optBefore.getTime() < now.getTime()) {
        chosenDate = optAfter;
        reason = `به دلیل تداخل با «${slot.title}» (${slot.startTime} تا ${slot.endTime})، زمان مرور خودکار به ساعت ${toPersianDigits(formatMinutesToTimeStr(afterMin))} (اولین بازه آزاد و بدون تداخل پس از اتمام فعالیت) منتقل شد.`;
      } else {
        // Both are future: pick the one closest to original scheduled time
        const distBefore = Math.abs(scheduledDate.getTime() - optBefore.getTime());
        const distAfter = Math.abs(optAfter.getTime() - scheduledDate.getTime());

        if (distBefore <= distAfter) {
          chosenDate = optBefore;
          reason = `به دلیل تداخل با «${slot.title}» (${slot.startTime} تا ${slot.endTime})، زمان مرور خودکار به ساعت ${toPersianDigits(formatMinutesToTimeStr(beforeMin))} (قبل از شروع فعالیت) منتقل شد.`;
        } else {
          chosenDate = optAfter;
          reason = `به دلیل تداخل با «${slot.title}» (${slot.startTime} تا ${slot.endTime})، زمان مرور خودکار به ساعت ${toPersianDigits(formatMinutesToTimeStr(afterMin))} (اولین بازه آزاد پس از فعالیت) منتقل شد.`;
        }
      }

      const shiftMinutes = Math.round((chosenDate.getTime() - scheduledDate.getTime()) / 60000);

      return {
        hasConflict: true,
        busySlot: slot,
        originalDate: scheduledDate,
        adjustedDate: chosenDate,
        explanation: reason,
        shiftMinutes,
      };
    }
  }

  return null;
}

export interface ForgettingProbabilityResult {
  retentionRate: number; // 0 to 100% (e.g. 74)
  forgettingProbability: number; // 0 to 100% (e.g. 26)
  riskLevel: 'safe' | 'warning' | 'critical' | 'consolidated';
  badgeBg: string;
  badgeBorder: string;
  badgeTextColor: string;
  statusLabel: string;
  description: string;
  hoursElapsed: number;
  stabilityHours: number;
  decayPercent: number;
}

/**
 * Calculates the approximate probability of forgetting according to the Ebbinghaus exponential decay equation:
 * R(t) = exp(-t / S)
 * where t = elapsed time in hours since last review (or initial study),
 * and S = memory stability/strength in hours based on the completed spaced-repetition stage & difficulty.
 *
 * Forgetting Probability F(t) = 100 - R(t).
 */
export function calculateForgettingProbability(
  item: TopicItem,
  now: Date = new Date()
): ForgettingProbabilityResult {
  const isCompleted = item.completedStages >= 5;

  if (isCompleted) {
    return {
      retentionRate: 96,
      forgettingProbability: 4,
      riskLevel: 'consolidated',
      badgeBg: 'bg-emerald-50',
      badgeBorder: 'border-emerald-200',
      badgeTextColor: 'text-emerald-800',
      statusLabel: 'تثبیت دائمی در حافظه بلندمدت (افت نامحسوس: ۴٪)',
      description: 'این مطلب هر ۵ مرحله مرور فاصله‌دار را گذرانده و در شبکه نورونی بلندمدت تثبیت شده است.',
      hoursElapsed: 720,
      stabilityHours: 5000,
      decayPercent: 4,
    };
  }

  // Determine elapsed time t in hours since last action
  let referenceDate: Date;
  if (item.history && item.history.length > 0) {
    const lastEntry = item.history[item.history.length - 1];
    referenceDate = new Date(lastEntry.reviewedAt);
  } else {
    referenceDate = new Date(item.initialDate);
  }

  const diffMs = Math.max(0, now.getTime() - referenceDate.getTime());
  const hoursElapsed = Math.max(0.1, diffMs / (1000 * 60 * 60));

  // Determine base stability S (in hours) according to completed stage count
  // Stage 0 -> Target 9h: S ~ 18h (after 9h, R = exp(-9/18) = 60.6%, F = 39.4%)
  // Stage 1 -> Target 24h: S ~ 42h (after 24h, R = exp(-24/42) = 56.4%, F = 43.6%)
  // Stage 2 -> Target 48h: S ~ 96h (after 48h, R = exp(-48/96) = 60.6%, F = 39.4%)
  // Stage 3 -> Target 168h: S ~ 320h (after 168h, R = exp(-168/320) = 59.1%, F = 40.9%)
  // Stage 4 -> Target 720h: S ~ 1350h (after 720h, R = exp(-720/1350) = 58.6%, F = 41.4%)
  const baseStabilityMap: Record<number, number> = {
    0: 18,
    1: 42,
    2: 96,
    3: 320,
    4: 1350,
  };

  let baseStability = baseStabilityMap[item.completedStages] || 18;

  // Adjust stability for lesson difficulty
  if (item.difficulty === 'hard') {
    baseStability *= 0.78; // harder topics decay faster
  } else if (item.difficulty === 'easy') {
    baseStability *= 1.32; // easier topics decay slower
  }

  // Ebbinghaus exponential decay
  const rawRetention = Math.exp(-hoursElapsed / baseStability) * 100;
  const retentionRate = Math.min(99, Math.max(5, Math.round(rawRetention)));
  const forgettingProbability = Math.min(95, Math.max(1, 100 - retentionRate));

  let riskLevel: 'safe' | 'warning' | 'critical' = 'safe';
  let badgeBg = 'bg-emerald-50';
  let badgeBorder = 'border-emerald-200';
  let badgeTextColor = 'text-emerald-800';
  let statusLabel = '';
  let description = '';

  if (forgettingProbability < 30) {
    riskLevel = 'safe';
    badgeBg = 'bg-teal-50/90';
    badgeBorder = 'border-teal-200';
    badgeTextColor = 'text-teal-900';
    statusLabel = `احتمال فراموشی کم (${toPersianDigits(forgettingProbability)}٪) - پایداری عالی`;
    description = `اطلاعات در وضعیت سیناپسی قوی قرار دارند و حدود ${toPersianDigits(retentionRate)}٪ در حافظه فعال موجود است.`;
  } else if (forgettingProbability < 60) {
    riskLevel = 'warning';
    badgeBg = 'bg-amber-50';
    badgeBorder = 'border-amber-200';
    badgeTextColor = 'text-amber-900';
    statusLabel = `احتمال فراموشی متوسط (${toPersianDigits(forgettingProbability)}٪) - نزدیک به موعد`;
    description = `با گذشت زمان، اثر حافظه در حال افت است. برای پیشگیری از ورود به فاز فراموشی حاد، مرور را در موعد مقرر انجام دهید.`;
  } else {
    riskLevel = 'critical';
    badgeBg = 'bg-rose-50';
    badgeBorder = 'border-rose-300';
    badgeTextColor = 'text-rose-900';
    statusLabel = `احتمال فراموشی بالا (${toPersianDigits(forgettingProbability)}٪) - نیازمند مرور فوری!`;
    description = `بیش از ${toPersianDigits(forgettingProbability)}٪ جزئیات در معرض فراموشی قرار دارند! مرور فوری در این لحظه اثر ضربه‌ای در تثبیت مجدد دارد.`;
  }

  return {
    retentionRate,
    forgettingProbability,
    riskLevel,
    badgeBg,
    badgeBorder,
    badgeTextColor,
    statusLabel,
    description,
    hoursElapsed: Math.round(hoursElapsed * 10) / 10,
    stabilityHours: Math.round(baseStability),
    decayPercent: forgettingProbability,
  };
}



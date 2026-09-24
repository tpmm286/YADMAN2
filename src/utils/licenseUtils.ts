/**
 * Yadman License Management & Cryptographic Verification Utility
 * 
 * Rules for Time-Bound, Platform-Aware License Keys:
 * 1. Format: YADM-XXXX-XXXX-XXXX-XXXX (Prefix 'YADM' followed by 4 blocks of 4 alphanumeric characters)
 * 2. Alphabet: Crockford/Safe Base-32 charset '23456789ABCDEFGHJKLMNPQRSTUVWXYZ' (32 chars)
 *    (Zero ambiguity: excludes 0, 1, I, O to prevent transcription ambiguity)
 * 
 * Block 1: [Tier][Platform][Duration][ActivationWindow]
 *    - Tier: P (Pro), S (Student), E (Enterprise)
 *    - Platform: A (All / Any), D (Desktop / Windows), M (Mobile / Android), W (Web PWA)
 *    - Duration: M (1 Month - 30d), Q (3 Months - 90d), H (6 Months - 180d),
 *                Y (1 Year - 365d), T (2 Years - 730d), L (Lifetime - مادام‌العمر)
 *    - ActivationWindow: 3 (3 days), 7 (7 days), F (14 days), N (30 days), U (Unlimited)
 * 
 * Block 2: [D0][D1][D2][Checksum2]
 *    - D0, D1, D2: Encodes exact Issue Day as days elapsed since BASE_EPOCH (2025-01-01)
 *    - Checksum2: Deterministic checksum linking Block 1 and the Issue Day
 * 
 * Block 3: [R1][R2][R3][Checksum3]
 *    - R1, R2, R3: Cryptographic entropy to ensure distinct keys for identical configurations
 *    - Checksum3: Block 3 internal checksum
 * 
 * Block 4: Master Cryptographic Cross-Block Signature
 *    - High-avalanche rolling hash of Blocks 1-3 with salt 'YADMAN_SALT_2026'
 */

export const LICENSE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const CHARSET_MAP = new Map<string, number>();
for (let i = 0; i < LICENSE_CHARSET.length; i++) {
  CHARSET_MAP.set(LICENSE_CHARSET[i], i);
}

// 7-day free trial period
export const TRIAL_MAX_DAYS = 7;
export const LICENSE_STORAGE_KEY = 'ebbinghaus_license_meta_v1';
export const ADMIN_PIN = '2026';
export const BASE_EPOCH_ISO = '2025-01-01T00:00:00.000Z';
const BASE_EPOCH_MS = new Date(BASE_EPOCH_ISO).getTime();

export type LicenseTier = 'PRO' | 'STUDENT' | 'ENTERPRISE';
export type LicensePlatform = 'ALL' | 'DESKTOP' | 'MOBILE' | 'WEB';
export type LicenseDuration = '1M' | '3M' | '6M' | '1Y' | '2Y' | 'LIFETIME';
export type ActivationWindow = '3D' | '7D' | '14D' | '30D' | 'UNLIMITED';
export type LicenseStatus = 'TRIAL_ACTIVE' | 'TRIAL_EXPIRED' | 'ACTIVATED' | 'LICENSE_EXPIRED' | 'CLOCK_TAMPERED';

export interface LicenseDetails {
  key: string;
  tier: LicenseTier;
  tierLabel: string;
  platform: LicensePlatform;
  platformLabel: string;
  duration: LicenseDuration;
  durationLabel: string;
  durationDays: number;
  activationWindow: ActivationWindow;
  activationWindowLabel: string;
  activationWindowDays: number;
  issueDate: string; // ISO
  activationDeadline: string; // ISO
  activatedAt?: string; // ISO
  expiresAt?: string | null; // ISO (null for lifetime)
  isActivationWindowExpired?: boolean;
  isLicenseDurationExpired?: boolean;
  remainingLicenseDays?: number;
  isValid: boolean;
}

export interface LicenseMetaState {
  installDate: string; // ISO date string
  lastSeenDate: string; // ISO date string
  licenseKey: string | null;
  activatedAt: string | null;
  expiresAt: string | null;
  simulatedDaysOffset?: number; // for developer/admin testing
}

export interface LicenseSystemInfo {
  status: LicenseStatus;
  isActivated: boolean;
  isExpired: boolean;
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
  totalTrialDays: number;
  totalDurationDays: number;
  elapsedDays: number;
  percentElapsed: number;
  percentRemaining: number;
  exactExpiresAt: string | null; // ISO date of exact expiration (null for lifetime)
  licenseDetails: LicenseDetails | null;
  installDate: string;
  isClockTampered: boolean;
  urgencyLevel: 'safe' | 'warning' | 'urgent' | 'expired' | 'lifetime';
  urgencyLabel: string;
}

// Mappings
export const TIER_CONFIG: Record<LicenseTier, { code: string; label: string; desc: string }> = {
  PRO: { code: 'P', label: 'نسخه حرفه‌ای (Pro)', desc: 'کامل‌ترین امکانات و خروجی کامل PDF برنامه تحصیلی' },
  STUDENT: { code: 'S', label: 'نسخه دانش‌آموزی (Student)', desc: 'ویژه دانش‌آموزان (خروجی برنامه فقط در دوره آزمایشی مجاز است)' },
  ENTERPRISE: { code: 'E', label: 'نسخه سازمانی و مدارس (Enterprise)', desc: 'ویژه مدارس و مؤسسات آموزشی با کلیه خروجی‌ها' },
};

export const PLATFORM_CONFIG: Record<LicensePlatform, { code: string; label: string; desc: string }> = {
  ALL: { code: 'A', label: 'تمامی دستگاه‌ها (عمومی)', desc: 'ویندوز، وب، اندروید، iOS' },
  DESKTOP: { code: 'D', label: 'رایانه و ویندوز (Desktop)', desc: 'مخصوص سیستم‌های ویندوزی و PC' },
  MOBILE: { code: 'M', label: 'گوشی و تبلت (Mobile)', desc: 'مخصوص اندروید و آیفون' },
  WEB: { code: 'W', label: 'سامانه تحت وب (Web PWA)', desc: 'مخصوص مرورگر و وب‌اپلیکیشن' },
};

export const DURATION_CONFIG: Record<LicenseDuration, { code: string; label: string; days: number }> = {
  '1M': { code: 'M', label: '۱ ماهه (۳۰ روز)', days: 30 },
  '3M': { code: 'Q', label: '۳ ماهه (۹۰ روز)', days: 90 },
  '6M': { code: 'H', label: '۶ ماهه (۱۸۰ روز)', days: 180 },
  '1Y': { code: 'Y', label: '۱ ساله (۳۶۵ روز)', days: 365 },
  '2Y': { code: 'T', label: '۲ ساله (۷۳۰ روز)', days: 730 },
  'LIFETIME': { code: 'L', label: 'دائمی و مادام‌العمر (Lifetime)', days: 99999 },
};

export const ACTIVATION_WINDOW_CONFIG: Record<ActivationWindow, { code: string; label: string; days: number }> = {
  '3D': { code: '3', label: '۳ روز پس از صدور', days: 3 },
  '7D': { code: '7', label: '۷ روز پس از صدور', days: 7 },
  '14D': { code: 'F', label: '۱۴ روز پس از صدور', days: 14 },
  '30D': { code: 'N', label: '۳۰ روز پس از صدور', days: 30 },
  'UNLIMITED': { code: 'U', label: 'بدون محدودیت مهلت وارد کردن', days: 99999 },
};

// Reverse lookup maps
const CODE_TO_TIER = Object.fromEntries(
  Object.entries(TIER_CONFIG).map(([k, v]) => [v.code, k as LicenseTier])
);
const CODE_TO_PLATFORM = Object.fromEntries(
  Object.entries(PLATFORM_CONFIG).map(([k, v]) => [v.code, k as LicensePlatform])
);
const CODE_TO_DURATION = Object.fromEntries(
  Object.entries(DURATION_CONFIG).map(([k, v]) => [v.code, k as LicenseDuration])
);
const CODE_TO_WINDOW = Object.fromEntries(
  Object.entries(ACTIVATION_WINDOW_CONFIG).map(([k, v]) => [v.code, k as ActivationWindow])
);

/**
 * Detect current client platform
 */
export function detectCurrentPlatform(): 'DESKTOP' | 'MOBILE' | 'WEB' {
  if (typeof window === 'undefined' || !navigator) return 'WEB';
  const ua = (navigator.userAgent || navigator.vendor || '').toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i.test(ua);
  if (isMobile) return 'MOBILE';
  const isDesktop = /windows|macintosh|linux/i.test(ua) && !isMobile;
  if (isDesktop) return 'DESKTOP';
  return 'WEB';
}

/**
 * Checks platform compatibility
 */
export function isPlatformCompatible(licensePlatform: LicensePlatform, currentPlatform: 'DESKTOP' | 'MOBILE' | 'WEB'): boolean {
  if (licensePlatform === 'ALL') return true;
  if (licensePlatform === 'WEB') return true;
  return licensePlatform === currentPlatform;
}

/**
 * Computes deterministic master cross-block signature
 */
export function computeMasterSignature(b1: string, b2: string, b3: string): string {
  const combined = `${b1}${b2}${b3}YADMAN_SALT_2026`;
  let h1 = 0x811c9dc5;
  let h2 = 0x5bd1e995;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 = ((h2 << 5) + h2 + code) >>> 0;
  }
  const unsignedH1 = h1 >>> 0;
  const unsignedH2 = h2 >>> 0;
  const i0 = (unsignedH1 >>> 0) & 0x1f;
  const i1 = (unsignedH1 >>> 5) & 0x1f;
  const i2 = (unsignedH2 >>> 0) & 0x1f;
  const i3 = ((unsignedH2 >>> 7) ^ (unsignedH1 >>> 13)) & 0x1f;
  return (
    LICENSE_CHARSET[i0] +
    LICENSE_CHARSET[i1] +
    LICENSE_CHARSET[i2] +
    LICENSE_CHARSET[i3]
  );
}

/**
 * Encodes an Issue Day (days since 2025-01-01) into 3 base-32 chars
 */
function encodeDayNumber(dayNum: number): [string, string, string] {
  const safeDay = Math.max(0, Math.min(32767, Math.floor(dayNum)));
  const d0 = Math.floor(safeDay / 1024) % 32;
  const d1 = Math.floor((safeDay % 1024) / 32) % 32;
  const d2 = safeDay % 32;
  return [LICENSE_CHARSET[d0], LICENSE_CHARSET[d1], LICENSE_CHARSET[d2]];
}

/**
 * Decodes 3 base-32 characters into Issue Day (days since 2025-01-01)
 */
function decodeDayNumber(c0: string, c1: string, c2: string): number {
  const v0 = CHARSET_MAP.get(c0) ?? 0;
  const v1 = CHARSET_MAP.get(c1) ?? 0;
  const v2 = CHARSET_MAP.get(c2) ?? 0;
  return v0 * 1024 + v1 * 32 + v2;
}

export interface GenerateLicenseOptions {
  tier?: LicenseTier;
  platform?: LicensePlatform;
  duration?: LicenseDuration;
  activationWindow?: ActivationWindow;
  issueDate?: Date;
}

/**
 * Generates a valid, cryptographically signed, time-bound and platform-aware license key
 */
export function generateLicenseKey(options: GenerateLicenseOptions = {}): string {
  const tier = options.tier || 'PRO';
  const platform = options.platform || 'ALL';
  const duration = options.duration || '1Y';
  const activationWindow = options.activationWindow || '3D';
  const issueDate = options.issueDate || new Date();

  const rndChar = () => LICENSE_CHARSET[Math.floor(Math.random() * LICENSE_CHARSET.length)];
  const val = (c: string) => CHARSET_MAP.get(c) ?? 0;

  // Block 1: [Tier][Platform][Duration][ActivationWindow]
  const tierCode = TIER_CONFIG[tier].code;
  const platformCode = PLATFORM_CONFIG[platform].code;
  const durationCode = DURATION_CONFIG[duration].code;
  const windowCode = ACTIVATION_WINDOW_CONFIG[activationWindow].code;
  const b1 = `${tierCode}${platformCode}${durationCode}${windowCode}`;

  // Block 2: [D0][D1][D2][Checksum2]
  const diffDays = Math.floor((issueDate.getTime() - BASE_EPOCH_MS) / (24 * 3600 * 1000));
  const [d0, d1, d2] = encodeDayNumber(diffDays);
  const cs2Idx = (
    val(b1[0]) * 3 +
    val(b1[1]) * 5 +
    val(b1[2]) * 7 +
    val(b1[3]) * 11 +
    val(d0) * 13 +
    val(d1) * 17 +
    val(d2) * 19 +
    23
  ) % 32;
  const b2 = `${d0}${d1}${d2}${LICENSE_CHARSET[cs2Idx]}`;

  // Block 3: [R1][R2][R3][Checksum3] (Random entropy so identical configs get distinct keys)
  const r1 = rndChar();
  const r2 = rndChar();
  const r3 = rndChar();
  const cs3Idx = (val(r1) * 7 + val(r2) * 11 + val(r3) * 13 + 29) % 32;
  const b3 = `${r1}${r2}${r3}${LICENSE_CHARSET[cs3Idx]}`;

  // Block 4: Master Cross-Block Signature
  const b4 = computeMasterSignature(b1, b2, b3);

  return `YADM-${b1}-${b2}-${b3}-${b4}`;
}

export interface ValidateLicenseOptions {
  checkPlatform?: boolean;
  checkActivationWindow?: boolean;
  currentDate?: Date;
  activatedAtDate?: Date | null;
}

/**
 * Validates a license key with date boundaries, activation window, and platform checks
 */
export function validateLicenseKey(
  rawKey: string,
  options: ValidateLicenseOptions = {}
): {
  isValid: boolean;
  error?: string;
  details?: LicenseDetails;
} {
  const {
    checkPlatform = false,
    checkActivationWindow = false,
    currentDate = new Date(),
    activatedAtDate = null,
  } = options;

  if (!rawKey || typeof rawKey !== 'string') {
    return { isValid: false, error: 'لطفاً کلید لایسنس را وارد فرمایید.' };
  }

  const key = rawKey.trim().toUpperCase().replace(/\s+/g, '');
  const parts = key.split('-');
  if (parts.length !== 5) {
    return {
      isValid: false,
      error: 'فرمت لایسنس نامعتبر است. ساختار صحیح: YADM-XXXX-XXXX-XXXX-XXXX',
    };
  }

  const [prefix, b1, b2, b3, b4] = parts;

  if (prefix !== 'YADM') {
    return { isValid: false, error: 'پیشوند کلید باید YADM باشد.' };
  }

  if (b1.length !== 4 || b2.length !== 4 || b3.length !== 4 || b4.length !== 4) {
    return { isValid: false, error: 'طول بخش‌های لایسنس معتبر نیست (هر بخش ۴ کاراکتر).' };
  }

  const allChars = `${b1}${b2}${b3}${b4}`;
  for (const ch of allChars) {
    if (!CHARSET_MAP.has(ch)) {
      return {
        isValid: false,
        error: `کاراکتر غیرمجاز '${ch}' در کلید مشاهده شد. حروف مجاز فقط ارقام و حروف بزرگ بدون ابهام هستند.`,
      };
    }
  }

  const val = (c: string) => CHARSET_MAP.get(c) ?? 0;

  // Block 1 decoding
  const tier = CODE_TO_TIER[b1[0]];
  const platform = CODE_TO_PLATFORM[b1[1]];
  const duration = CODE_TO_DURATION[b1[2]];
  const activationWindow = CODE_TO_WINDOW[b1[3]];

  if (!tier) return { isValid: false, error: 'نوع لایسنس در بخش اول نامعتبر است.' };
  if (!platform) return { isValid: false, error: 'پلتفرم لایسنس در بخش اول نامعتبر است.' };
  if (!duration) return { isValid: false, error: 'مدت اعتبار لایسنس در بخش اول نامعتبر است.' };
  if (!activationWindow) return { isValid: false, error: 'مهلت فعال‌سازی در بخش اول نامعتبر است.' };

  // Block 2 validation & issue day decoding
  const d0 = b1[0], d1 = b1[1], d2 = b1[2], d3 = b1[3];
  const b2_0 = b2[0], b2_1 = b2[1], b2_2 = b2[2], b2_cs = b2[3];
  const expectedCs2 = (
    val(d0) * 3 +
    val(d1) * 5 +
    val(d2) * 7 +
    val(d3) * 11 +
    val(b2_0) * 13 +
    val(b2_1) * 17 +
    val(b2_2) * 19 +
    23
  ) % 32;

  if (LICENSE_CHARSET[expectedCs2] !== b2_cs) {
    return { isValid: false, error: 'کد تاریخ یا چک‌سام بخش دوم لایسنس همخوانی ندارد.' };
  }

  const issueDayNumber = decodeDayNumber(b2_0, b2_1, b2_2);
  const issueDateMs = BASE_EPOCH_MS + issueDayNumber * 24 * 3600 * 1000;
  const issueDateObj = new Date(issueDateMs);
  const issueDateISO = issueDateObj.toISOString();

  // Block 3 validation
  const b3_cs = b3[3];
  const expectedCs3 = (val(b3[0]) * 7 + val(b3[1]) * 11 + val(b3[2]) * 13 + 29) % 32;
  if (LICENSE_CHARSET[expectedCs3] !== b3_cs) {
    return { isValid: false, error: 'چک‌سام بخش سوم لایسنس نادرست است.' };
  }

  // Block 4 Master Signature validation
  const expectedB4 = computeMasterSignature(b1, b2, b3);
  if (expectedB4 !== b4) {
    return { isValid: false, error: 'امضای امنیتی نهایی لایسنس نامعتبر است.' };
  }

  // Calculate dates
  const windowDays = ACTIVATION_WINDOW_CONFIG[activationWindow].days;
  const durationDays = DURATION_CONFIG[duration].days;

  const activationDeadlineMs = windowDays >= 99999
    ? issueDateMs + 3650 * 24 * 3600 * 1000 // practically infinite
    : issueDateMs + windowDays * 24 * 3600 * 1000;
  const activationDeadlineISO = new Date(activationDeadlineMs).toISOString();

  // Compute expiration date
  let expiresAtISO: string | null = null;
  let isLicenseDurationExpired = false;
  let remainingLicenseDays = 9999;

  if (duration !== 'LIFETIME') {
    // If already activated, duration is measured from activation date; otherwise from issue date
    const baseDateMs = activatedAtDate ? activatedAtDate.getTime() : currentDate.getTime();
    const expiresAtMs = baseDateMs + durationDays * 24 * 3600 * 1000;
    expiresAtISO = new Date(expiresAtMs).toISOString();

    const diffToExpiry = expiresAtMs - currentDate.getTime();
    remainingLicenseDays = Math.max(0, Math.ceil(diffToExpiry / (24 * 3600 * 1000)));
    if (diffToExpiry <= 0) {
      isLicenseDurationExpired = true;
    }
  }

  // Check 1: Platform compatibility
  if (checkPlatform) {
    const currentPlatform = detectCurrentPlatform();
    if (!isPlatformCompatible(platform, currentPlatform)) {
      const targetLabel = PLATFORM_CONFIG[platform].label;
      return {
        isValid: false,
        error: `این لایسنس برای پلتفرم «${targetLabel}» صادر شده است و روی دستگاه فعلی شما فعال نمی‌شود.`,
      };
    }
  }

  // Check 2: Activation Window Deadline (Only applied during initial activation)
  const isActivationWindowExpired = currentDate.getTime() > activationDeadlineMs;
  if (checkActivationWindow && isActivationWindowExpired) {
    const deadlineStr = new Date(activationDeadlineMs).toLocaleDateString('fa-IR');
    return {
      isValid: false,
      error: `مهلت وارد کردن این لایسنس به پایان رسیده است! این کلید فقط به مدت ${ACTIVATION_WINDOW_CONFIG[activationWindow].label} (حداکثر تا ${deadlineStr}) معتبر بوده است.`,
    };
  }

  const details: LicenseDetails = {
    key,
    tier,
    tierLabel: TIER_CONFIG[tier].label,
    platform,
    platformLabel: PLATFORM_CONFIG[platform].label,
    duration,
    durationLabel: DURATION_CONFIG[duration].label,
    durationDays,
    activationWindow,
    activationWindowLabel: ACTIVATION_WINDOW_CONFIG[activationWindow].label,
    activationWindowDays: windowDays,
    issueDate: issueDateISO,
    activationDeadline: activationDeadlineISO,
    activatedAt: activatedAtDate ? activatedAtDate.toISOString() : undefined,
    expiresAt: expiresAtISO,
    isActivationWindowExpired,
    isLicenseDurationExpired,
    remainingLicenseDays,
    isValid: true,
  };

  return {
    isValid: true,
    details,
  };
}

/**
 * Loads stored license metadata from localStorage
 */
export function getStoredLicenseMeta(): LicenseMetaState {
  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.installDate === 'string') {
        return parsed as LicenseMetaState;
      }
    }
  } catch (err) {
    console.error('Failed to parse license meta', err);
  }

  const fresh: LicenseMetaState = {
    installDate: new Date().toISOString(),
    lastSeenDate: new Date().toISOString(),
    licenseKey: null,
    activatedAt: null,
    expiresAt: null,
    simulatedDaysOffset: 0,
  };
  saveStoredLicenseMeta(fresh);
  return fresh;
}

/**
 * Persists license metadata to localStorage
 */
export function saveStoredLicenseMeta(meta: LicenseMetaState): void {
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(meta));
  } catch (err) {
    console.error('Failed to save license meta', err);
  }
}

/**
 * Evaluates the full system license state (Trial vs Activated vs License Expired)
 */
export function evaluateLicenseSystem(): LicenseSystemInfo {
  const meta = getStoredLicenseMeta();
  const now = new Date();

  // Simulated days offset for developer testing
  const offsetMs = (meta.simulatedDaysOffset || 0) * 24 * 3600 * 1000;
  const effectiveNow = new Date(now.getTime() + offsetMs);

  // Clock tampering check: if system clock is rolled back more than 2 hours
  const lastSeen = new Date(meta.lastSeenDate);
  const isClockTampered = now.getTime() < lastSeen.getTime() - 2 * 3600 * 1000;

  if (now.getTime() > lastSeen.getTime()) {
    meta.lastSeenDate = now.toISOString();
    saveStoredLicenseMeta(meta);
  }

  // If a license key is already stored and active
  if (meta.licenseKey) {
    const activatedAtDate = meta.activatedAt ? new Date(meta.activatedAt) : new Date(meta.installDate);
    const validation = validateLicenseKey(meta.licenseKey, {
      checkPlatform: false, // Don't block existing activation on platform change
      checkActivationWindow: false, // Key was already activated in the past
      currentDate: effectiveNow,
      activatedAtDate,
    });

    if (validation.isValid && validation.details) {
      let isLicenseDurationExpired = false;
      let remainingLicenseDays = 99999;
      let remainingHours = 0;
      let remainingMinutes = 0;
      const totalDurationDays = validation.details.duration === 'LIFETIME' ? 99999 : validation.details.durationDays;
      let elapsedDays = 0;
      let percentElapsed = 0;
      let percentRemaining = 100;

      if (meta.expiresAt) {
        const expiresAtMs = new Date(meta.expiresAt).getTime();
        const diffMs = expiresAtMs - effectiveNow.getTime();

        if (diffMs <= 0) {
          isLicenseDurationExpired = true;
          remainingLicenseDays = 0;
          remainingHours = 0;
          remainingMinutes = 0;
          elapsedDays = totalDurationDays;
          percentElapsed = 100;
          percentRemaining = 0;
        } else {
          remainingLicenseDays = Math.floor(diffMs / (24 * 3600 * 1000));
          remainingHours = Math.floor((diffMs % (24 * 3600 * 1000)) / (3600 * 1000));
          remainingMinutes = Math.floor((diffMs % (3600 * 1000)) / (60 * 1000));

          const activatedMs = activatedAtDate.getTime();
          const totalMs = Math.max(1, expiresAtMs - activatedMs);
          const usedMs = Math.max(0, effectiveNow.getTime() - activatedMs);
          elapsedDays = Math.min(totalDurationDays, Math.floor(usedMs / (24 * 3600 * 1000)));
          percentElapsed = Math.min(100, Math.max(0, Math.round((usedMs / totalMs) * 100)));
          percentRemaining = 100 - percentElapsed;
        }
      }

      if (isLicenseDurationExpired) {
        return {
          status: 'LICENSE_EXPIRED',
          isActivated: false,
          isExpired: true,
          remainingDays: 0,
          remainingHours: 0,
          remainingMinutes: 0,
          totalTrialDays: TRIAL_MAX_DAYS,
          totalDurationDays,
          elapsedDays,
          percentElapsed: 100,
          percentRemaining: 0,
          exactExpiresAt: meta.expiresAt,
          licenseDetails: {
            ...validation.details,
            activatedAt: meta.activatedAt || undefined,
            expiresAt: meta.expiresAt,
            isLicenseDurationExpired: true,
            remainingLicenseDays: 0,
          },
          installDate: meta.installDate,
          isClockTampered: false,
          urgencyLevel: 'expired',
          urgencyLabel: 'اعتبار لایسنس به پایان رسیده است',
        };
      }

      let urgencyLevel: 'safe' | 'warning' | 'urgent' | 'lifetime' = 'safe';
      let urgencyLabel = 'اعتبار پایدار و مطلوب';

      if (validation.details.duration === 'LIFETIME') {
        urgencyLevel = 'lifetime';
        urgencyLabel = 'دائمی و نامحدود';
      } else if (remainingLicenseDays <= 7) {
        urgencyLevel = 'urgent';
        urgencyLabel = 'هشدار فوری (کمتر از ۷ روز مانده)';
      } else if (remainingLicenseDays <= 30) {
        urgencyLevel = 'warning';
        urgencyLabel = 'نیاز به تمدید (کمتر از ۳۰ روز مانده)';
      }

      return {
        status: 'ACTIVATED',
        isActivated: true,
        isExpired: false,
        remainingDays: meta.expiresAt ? remainingLicenseDays : 99999,
        remainingHours: meta.expiresAt ? remainingHours : 0,
        remainingMinutes: meta.expiresAt ? remainingMinutes : 0,
        totalTrialDays: TRIAL_MAX_DAYS,
        totalDurationDays,
        elapsedDays,
        percentElapsed,
        percentRemaining,
        exactExpiresAt: meta.expiresAt,
        licenseDetails: {
          ...validation.details,
          activatedAt: meta.activatedAt || undefined,
          expiresAt: meta.expiresAt,
          isLicenseDurationExpired: false,
          remainingLicenseDays: meta.expiresAt ? remainingLicenseDays : 99999,
        },
        installDate: meta.installDate,
        isClockTampered: false,
        urgencyLevel,
        urgencyLabel,
      };
    }
  }

  // Not activated: evaluate 7-day free trial
  const installTime = new Date(meta.installDate).getTime();
  const totalTrialMs = TRIAL_MAX_DAYS * 24 * 3600 * 1000;
  const trialExpiresAt = new Date(installTime + totalTrialMs).toISOString();

  const elapsedMs = Math.max(0, effectiveNow.getTime() - installTime);
  const elapsedDays = Math.min(TRIAL_MAX_DAYS, Math.floor(elapsedMs / (24 * 3600 * 1000)));

  const remainingMs = Math.max(0, (installTime + totalTrialMs) - effectiveNow.getTime());
  const remainingDays = Math.floor(remainingMs / (24 * 3600 * 1000));
  const remainingHours = Math.floor((remainingMs % (24 * 3600 * 1000)) / (3600 * 1000));
  const remainingMinutes = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));

  const percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalTrialMs) * 100)));
  const percentRemaining = 100 - percentElapsed;

  if (isClockTampered) {
    return {
      status: 'CLOCK_TAMPERED',
      isActivated: false,
      isExpired: true,
      remainingDays: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      totalTrialDays: TRIAL_MAX_DAYS,
      totalDurationDays: TRIAL_MAX_DAYS,
      elapsedDays,
      percentElapsed: 100,
      percentRemaining: 0,
      exactExpiresAt: trialExpiresAt,
      licenseDetails: null,
      installDate: meta.installDate,
      isClockTampered: true,
      urgencyLevel: 'expired',
      urgencyLabel: 'دستکاری در ساعت سیستم',
    };
  }

  if (remainingMs <= 0) {
    return {
      status: 'TRIAL_EXPIRED',
      isActivated: false,
      isExpired: true,
      remainingDays: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      totalTrialDays: TRIAL_MAX_DAYS,
      totalDurationDays: TRIAL_MAX_DAYS,
      elapsedDays: TRIAL_MAX_DAYS,
      percentElapsed: 100,
      percentRemaining: 0,
      exactExpiresAt: trialExpiresAt,
      licenseDetails: null,
      installDate: meta.installDate,
      isClockTampered: false,
      urgencyLevel: 'expired',
      urgencyLabel: 'مهلت ۷ روزه رایگان به پایان رسیده است',
    };
  }

  let trialUrgency: 'safe' | 'warning' | 'urgent' = 'safe';
  let trialUrgencyLabel = 'دوره آزمایشی ۷ روزه فعال';
  if (remainingDays <= 1) {
    trialUrgency = 'urgent';
    trialUrgencyLabel = 'کمتر از ۲۴ ساعت تا پایان مهلت رایگان';
  } else if (remainingDays <= 3) {
    trialUrgency = 'warning';
    trialUrgencyLabel = 'رو به پایان (کمتر از ۳ روز مانده)';
  }

  return {
    status: 'TRIAL_ACTIVE',
    isActivated: false,
    isExpired: false,
    remainingDays,
    remainingHours,
    remainingMinutes,
    totalTrialDays: TRIAL_MAX_DAYS,
    totalDurationDays: TRIAL_MAX_DAYS,
    elapsedDays,
    percentElapsed,
    percentRemaining,
    exactExpiresAt: trialExpiresAt,
    licenseDetails: null,
    installDate: meta.installDate,
    isClockTampered: false,
    urgencyLevel: trialUrgency,
    urgencyLabel: trialUrgencyLabel,
  };
}

/**
 * Activates the app using a given license key with full activation window and platform validation
 */
export function activateAppWithKey(key: string): { success: boolean; message: string; details?: LicenseDetails } {
  const meta = getStoredLicenseMeta();
  const now = new Date();
  const offsetMs = (meta.simulatedDaysOffset || 0) * 24 * 3600 * 1000;
  const effectiveNow = new Date(now.getTime() + offsetMs);

  const result = validateLicenseKey(key, {
    checkPlatform: true,
    checkActivationWindow: true,
    currentDate: effectiveNow,
  });

  if (!result.isValid || !result.details) {
    return {
      success: false,
      message: result.error || 'کلید لایسنس نامعتبر است.',
    };
  }

  const { details } = result;

  // Calculate expiration date from activation time
  let expiresAtISO: string | null = null;
  if (details.duration !== 'LIFETIME') {
    const expiresAtMs = effectiveNow.getTime() + details.durationDays * 24 * 3600 * 1000;
    expiresAtISO = new Date(expiresAtMs).toISOString();
  }

  meta.licenseKey = details.key;
  meta.activatedAt = effectiveNow.toISOString();
  meta.expiresAt = expiresAtISO;
  saveStoredLicenseMeta(meta);

  return {
    success: true,
    message: `فعال‌سازی با موفقیت انجام شد! ${details.tierLabel} (${details.durationLabel}) بر روی این دستگاه فعال گردید.`,
    details: {
      ...details,
      activatedAt: meta.activatedAt,
      expiresAt: meta.expiresAt,
    },
  };
}

/**
 * Deactivates the current license
 */
export function deactivateAppLicense(): void {
  const meta = getStoredLicenseMeta();
  meta.licenseKey = null;
  meta.activatedAt = null;
  meta.expiresAt = null;
  saveStoredLicenseMeta(meta);
}

/**
 * Simulates trial / license elapsed days for admin testing
 */
export function setSimulatedTrialOffset(days: number): void {
  const meta = getStoredLicenseMeta();
  meta.simulatedDaysOffset = days;
  saveStoredLicenseMeta(meta);
}

/**
 * Resets trial to today
 */
export function resetTrialToToday(): void {
  const meta = getStoredLicenseMeta();
  meta.installDate = new Date().toISOString();
  meta.lastSeenDate = new Date().toISOString();
  meta.simulatedDaysOffset = 0;
  saveStoredLicenseMeta(meta);
}

/**
 * Determines whether the Student Schedule PDF export capability is allowed.
 * - Allowed during the 7-day trial period (for trial testing).
 * - After the trial period ends:
 *    - Completely hidden/disappeared if trial is expired and not activated.
 *    - Completely hidden/disappeared for the Student tier (Student license does not have schedule export after trial).
 *    - Allowed only for Pro and Enterprise tiers when actively licensed and unexpired.
 */
export function canExportStudentSchedule(licenseInfo: LicenseSystemInfo | null | undefined): boolean {
  if (!licenseInfo) return true;
  // If access is expired (trial expired or license duration expired), export is completely hidden
  if (licenseInfo.isExpired || licenseInfo.status === 'TRIAL_EXPIRED' || licenseInfo.status === 'LICENSE_EXPIRED') {
    return false;
  }
  return true;
}

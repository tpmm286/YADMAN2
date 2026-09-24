# راهنمای کامل ساخت لایسنس‌های زمان‌دار و پلتفرم‌محور نرم‌افزار یادمان (ابینگهاوس)

این راهنما ساختار کلیدهای لایسنس، متغیرهای زمان‌بندی (مهلت وارد کردن، مدت اعتبار و تاریخ انقضا)، پشتیبانی از پلتفرم‌ها، فرمول‌های ریاضی و کدهای مستقل پایتون و جاوااسکریپت را تشریح می‌کند.

---

## ۱. مشخصات و ساختار کلید لایسنس

- **دوره آزمایشی رایگان:** **۷ روز** از تاریخ اولین نصب برنامه.
- **فرمت کلی کلید:** `YADM-XXXX-XXXX-XXXX-XXXX` (۴ بلوک ۴ کاراکتری با پیشوند `YADM-`)
- **الفبای مجاز (۳۲ کاراکتر Base-32 ایمن):**  
  `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`  
  *(کاراکترهای مبهم نظیر `0`، `1`، `O`، `I` به طور کامل حذف شده‌اند).*
- **تاریخ مبدأ شمارش روزها (Base Epoch):** `2025-01-01T00:00:00.000Z`

---

## ۲. رمزنگاری بلوک‌ها (Block Encoding)

### بلوک اول (B1): مشخصات لایسنس `[Tier][Platform][Duration][ActivationWindow]`
- **کاراکتر ۱ - نوع لایسنس (Tier):**
  - `P`: حرفه‌ای (Pro)
  - `S`: دانش‌آموزی و کنکور (Student)
  - `E`: سازمانی و مدارس (Enterprise)
- **کاراکتر ۲ - پلتفرم مجاز (Platform):**
  - `A`: همه دستگاه‌ها و پلتفرم‌ها (عمومی)
  - `D`: فقط رایانه و ویندوز (Desktop / PC)
  - `M`: فقط موبایل و تبلت (Android / iOS)
  - `W`: فقط سامانه تحت وب (Web PWA)
- **کاراکتر ۳ - مدت اعتبار لایسنس (Duration):**
  - `M`: ۱ ماهه (۳۰ روز)
  - `Q`: ۳ ماهه (۹۰ روز)
  - `H`: ۶ ماهه (۱۸۰ روز)
  - `Y`: ۱ ساله (۳۶۵ روز)
  - `T`: ۲ ساله (۷۳۰ روز)
  - `L`: دائمی و مادام‌العمر (Lifetime)
- **کاراکتر ۴ - مهلت زمان وارد کردن (Activation Window):**
  - `3`: حداکثر ۳ روز پس از صدور کلید
  - `7`: حداکثر ۷ روز پس از صدور کلید
  - `F`: حداکثر ۱۴ روز پس از صدور کلید
  - `N`: حداکثر ۳۰ روز پس از صدور کلید
  - `U`: بدون محدودیت مهلت وارد کردن (نامحدود)

> **مثال قابل خواندن:** کلید با شروع `YADM-PAY3-...` یعنی نسخه **P**ro، برای پلتفرم **A**ll، با اعتبار **Y** (یک ساله)، که حداکثر تا **3** روز پس از تاریخ صدور باید در برنامه وارد و فعال شود.

### بلوک دوم (B2): کدگذاری روز صدور و چک‌سام `[D0][D1][D2][Checksum2]`
- کاراکترهای ۱ تا ۳ ($D_0, D_1, D_2$): کدگذاری تعداد روزهای سپری‌شده از مبدأ ۲۰۲۵-۰۱-۰۱ در مبنای ۳۲:
  $$D = \lfloor(\text{IssueDate} - \text{Epoch}) / 86400000\rfloor$$
  $$D_0 = \lfloor D / 1024 \rfloor \pmod{32}, \quad D_1 = \lfloor(D \pmod{1024}) / 32\rfloor, \quad D_2 = D \pmod{32}$$
- کاراکتر ۴ ($\text{Checksum}_2$): پیوند ریاضی بلوک ۱ و روز صدور:
  $$\text{Index} = (v(b_1[0]) \times 3 + v(b_1[1]) \times 5 + v(b_1[2]) \times 7 + v(b_1[3]) \times 11 + v(D_0) \times 13 + v(D_1) \times 17 + v(D_2) \times 19 + 23) \pmod{32}$$

### بلوک سوم (B3): آنتروپی تصادفی و چک‌سام `[R1][R2][R3][Checksum3]`
- کاراکترهای ۱ تا ۳ ($R_1, R_2, R_3$): کاراکترهای تصادفی از الفبا جهت تمایز کلیدهای هم‌تنظیم.
- کاراکتر ۴ ($\text{Checksum}_3$):
  $$\text{Index} = (v(R_1) \times 7 + v(R_2) \times 11 + v(R_3) \times 13 + 29) \pmod{32}$$

### بلوک چهارم (B4): امضای دیجیتال رمزنگاری‌شده چندجمله‌ای
- امضای ۴ کاراکتری حاصل از ترکیب هش پرسرعت با سالت اختصاصی `YADMAN_SALT_2026`.

---

## ۳. استفاده از پنل مولد داخلی در برنامه (سریع‌ترین روش)

در نوار بالای برنامه، روی دکمه **لایسنس و فعال‌سازی** کلیک کرده و به تب **«مولد لایسنس زمان‌دار و پلتفرم (Admin)»** بروید:
- **پین‌کد مدیریت:** `2026`
- در آنجا می‌توانید:
  1. نوع نسخه (حرفه‌ای، دانش‌آموزی، سازمانی)
  2. مدت اعتبار (۱ ساله، ۶ ماهه، ۳ ماهه، ۱ ماهه، ۲ ساله، دائمی)
  3. مهلت وارد کردن کلید (۳ روزه، ۷ روزه، ۱۴ روزه، ۳۰ روزه، نامحدود)
  4. پلتفرم مجاز (همه دستگاه‌ها، ویندوز، موبایل، وب)
  را انتخاب کرده و کلید معتبر تولید فرمایید.
- همچنین ابزار تست شبیه‌سازی سناریوهای زمانی (روز ۱، ۳، ۶، روز ۸ انقضای مهلت ۷ روزه، و جلو بردن ۴۰۰ روز برای تست انقضای لایسنس ۱ ساله) در اختیارتان قرار دارد.

---

## ۴. اسکریپت مستقل جاوااسکریپت / Node.js (برای صدور لایسنس خارج از برنامه)

این اسکریپت را می‌توانید در هر فایل `generate.js` با `node generate.js` اجرا نمایید:

```javascript
const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const BASE_EPOCH_MS = new Date("2025-01-01T00:00:00.000Z").getTime();
const SALT = "YADMAN_SALT_2026";

const TIERS = { PRO: "P", STUDENT: "S", ENTERPRISE: "E" };
const PLATFORMS = { ALL: "A", DESKTOP: "D", MOBILE: "M", WEB: "W" };
const DURATIONS = { "1M": "M", "3M": "Q", "6M": "H", "1Y": "Y", "2Y": "T", LIFETIME: "L" };
const WINDOWS = { "3D": "3", "7D": "7", "14D": "F", "30D": "N", UNLIMITED: "U" };

function v(ch) { return CHARSET.indexOf(ch); }
function rndChar() { return CHARSET[Math.floor(Math.random() * CHARSET.length)]; }

function computeMasterSignature(b1, b2, b3) {
  const combined = `${b1}${b2}${b3}${SALT}`;
  let h1 = 0x811c9dc5, h2 = 0x5bd1e995;
  for (let i = 0; i < combined.length; i++) {
    const code = combined.charCodeAt(i);
    h1 ^= code;
    h1 = Math.imul(h1, 0x01000193);
    h2 = ((h2 << 5) + h2 + code) >>> 0;
  }
  const u1 = h1 >>> 0, u2 = h2 >>> 0;
  return CHARSET[u1 & 0x1f] + CHARSET[(u1 >>> 5) & 0x1f] + CHARSET[u2 & 0x1f] + CHARSET[((u2 >>> 7) ^ (u1 >>> 13)) & 0x1f];
}

function generateLicense({
  tier = "PRO",
  platform = "ALL",
  duration = "1Y",
  activationWindow = "3D",
  issueDate = new Date()
} = {}) {
  const b1 = `${TIERS[tier]}${PLATFORMS[platform]}${DURATIONS[duration]}${WINDOWS[activationWindow]}`;

  const diffDays = Math.floor((issueDate.getTime() - BASE_EPOCH_MS) / (24 * 3600 * 1000));
  const safeDay = Math.max(0, Math.min(32767, diffDays));
  const d0 = CHARSET[Math.floor(safeDay / 1024) % 32];
  const d1 = CHARSET[Math.floor((safeDay % 1024) / 32) % 32];
  const d2 = CHARSET[safeDay % 32];

  const cs2 = (v(b1[0]) * 3 + v(b1[1]) * 5 + v(b1[2]) * 7 + v(b1[3]) * 11 + v(d0) * 13 + v(d1) * 17 + v(d2) * 19 + 23) % 32;
  const b2 = `${d0}${d1}${d2}${CHARSET[cs2]}`;

  const r1 = rndChar(), r2 = rndChar(), r3 = rndChar();
  const cs3 = (v(r1) * 7 + v(r2) * 11 + v(r3) * 13 + 29) % 32;
  const b3 = `${r1}${r2}${r3}${CHARSET[cs3]}`;

  const b4 = computeMasterSignature(b1, b2, b3);
  return `YADM-${b1}-${b2}-${b3}-${b4}`;
}

// نمونه اجرا:
console.log("لایسنس ۱ ساله، مهلت ۳ روز وارد کردن، همه دستگاه‌ها:");
console.log(generateLicense({ tier: "PRO", platform: "ALL", duration: "1Y", activationWindow: "3D" }));

console.log("لایسنس ۶ ماهه، مخصوص ویندوز، مهلت ۷ روز:");
console.log(generateLicense({ tier: "PRO", platform: "DESKTOP", duration: "6M", activationWindow: "7D" }));
```

---

## ۵. اسکریپت مستقل پایتون ۳ (Python 3)

```python
import datetime
import random

CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
BASE_EPOCH = datetime.datetime(2025, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
SALT = "YADMAN_SALT_2026"

TIERS = {"PRO": "P", "STUDENT": "S", "ENTERPRISE": "E"}
PLATFORMS = {"ALL": "A", "DESKTOP": "D", "MOBILE": "M", "WEB": "W"}
DURATIONS = {"1M": "M", "3M": "Q", "6M": "H", "1Y": "Y", "2Y": "T", "LIFETIME": "L"}
WINDOWS = {"3D": "3", "7D": "7", "14D": "F", "30D": "N", "UNLIMITED": "U"}

def v(ch):
    return CHARSET.index(ch)

def rnd_char():
    return random.choice(CHARSET)

def compute_master_signature(b1, b2, b3):
    combined = f"{b1}{b2}{b3}{SALT}"
    h1 = 0x811c9dc5
    h2 = 0x5bd1e995
    for ch in combined:
        code = ord(ch)
        h1 = ((h1 ^ code) * 0x01000193) & 0xFFFFFFFF
        h2 = (((h2 << 5) + h2 + code)) & 0xFFFFFFFF
    
    i0 = h1 & 0x1F
    i1 = (h1 >> 5) & 0x1F
    i2 = h2 & 0x1F
    i3 = ((h2 >> 7) ^ (h1 >> 13)) & 0x1F
    return f"{CHARSET[i0]}{CHARSET[i1]}{CHARSET[i2]}{CHARSET[i3]}"

def generate_license(tier="PRO", platform="ALL", duration="1Y", activation_window="3D", issue_date=None):
    if issue_date is None:
        issue_date = datetime.datetime.now(datetime.timezone.utc)
    
    b1 = f"{TIERS[tier]}{PLATFORMS[platform]}{DURATIONS[duration]}{WINDOWS[activation_window]}"
    
    diff_days = int((issue_date - BASE_EPOCH).total_seconds() // 86400)
    safe_day = max(0, min(32767, diff_days))
    d0 = CHARSET[(safe_day // 1024) % 32]
    d1 = CHARSET[((safe_day % 1024) // 32) % 32]
    d2 = CHARSET[safe_day % 32]
    
    cs2 = (v(b1[0]) * 3 + v(b1[1]) * 5 + v(b1[2]) * 7 + v(b1[3]) * 11 + v(d0) * 13 + v(d1) * 17 + v(d2) * 19 + 23) % 32
    b2 = f"{d0}{d1}{d2}{CHARSET[cs2]}"
    
    r1, r2, r3 = rnd_char(), rnd_char(), rnd_char()
    cs3 = (v(r1) * 7 + v(r2) * 11 + v(r3) * 13 + 29) % 32
    b3 = f"{r1}{r2}{r3}{CHARSET[cs3]}"
    
    b4 = compute_master_signature(b1, b2, b3)
    return f"YADM-{b1}-{b2}-{b3}-{b4}"

if __name__ == "__main__":
    print("1-Year Pro (All Platforms, 3-Day Window):")
    print(generate_license("PRO", "ALL", "1Y", "3D"))
```

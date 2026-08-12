# دنیای بقا — اپ مستقل اندروید (APK)

بازی بقای دوبعدی از بالا (top-down)، شبیه‌سازی زمین بی‌پایان، جمع‌آوری منابع،
ساخت‌وساز، زامبی، و ماشین قابل تعمیر.

⚠️ **این پروژه دیگه Telegram Mini App نیست.** قبلاً به‌صورت Mini App تلگرام بود
(از طریق `bot.py` و Flask)، ولی الان با **Capacitor** به یه اپ مستقل اندروید (APK)
تبدیل شده که مستقیم روی گوشی نصب می‌شه و نیازی به تلگرام یا سرور نداره.
کد بازی اصلی (`static/`) عوض نشده؛ فقط لایه‌ی اجراش عوض شده.

فایل‌های `bot.py`، `Procfile`، `requirements.txt` بازمونده‌ی نسخه‌ی قدیمی Telegram
Mini App هستن و دیگه استفاده نمی‌شن؛ اگه لازم نیست می‌شه حذفشون کرد.

## ساخت APK (از طریق GitHub Actions)
فایل ورک‌فلو `.github/workflows/build-apk.yml` با هر push به شاخه‌ی `main` یا
`apk-offline` به‌صورت خودکار یه APK دیباگ می‌سازه (با Capacitor + Gradle) و
به‌عنوان artifact قابل دانلوده (از تب Actions همون ران، پایین صفحه).

تنظیمات Capacitor تو `capacitor.config.json`:
- `webDir: "static"` → همون پوشه‌ی بازی که مستقیم بسته‌بندی می‌شه تو اپ
- `appId: "com.moshaktomoshak.donyayebagha"`

## ساختار فعلی ریپو
capacitor.config.json
package.json
.github/workflows/build-apk.yml
static/index.html
static/style.css
static/game.js
static/npc.js
static/corpses.js
static/dog.js
static/cow.js
static/png/ (اسپریت‌های مود زامبی)

(فایل‌های bot.py / requirements.txt / Procfile مربوط به نسخه‌ی قدیمی Telegram‌اند)

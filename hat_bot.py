from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, InputFile
from telegram.ext import (
    ApplicationBuilder, CommandHandler, CallbackQueryHandler,
    ContextTypes, MessageHandler, filters
)
from telegram.constants import ParseMode
from io import BytesIO

import random
import string
import time
import json
import os

BOT_TOKEN = "7741604061:AAHbTYwZCKEvDlRm71SEj2EY3khVExQFQ1g"

USD_PRICE = 83750
MAX_USD = 200
STONE_PRICE = 5000  # قیمت هر سنگ
bowling_cooldown_seconds = 1800
FOOTBALL_COOLDOWN = 420
DART_COOLDOWN = 1800
BASKETBALL_COOLDOWN = 420
CHARITY_COOLDOWN = 1800

users = {}
coin_cooldowns = {}
tas_cooldowns = {}
slot_cooldowns = {}
bowling_cooldowns = {}
football_cooldowns = {}
dart_cooldowns = {}
charity_cooldowns = {}
give_charity_cooldowns = {}
basketball_cooldowns = {}
pay_cooldowns = {}
afghani_pay_cooldowns = {}
break_cooldowns = {}
victim_protection = {}
tax_cooldowns = {}
stone_cooldowns = {}
wood_cooldowns = {}
hakbank_cooldowns = {}
MATERIAL_PRICES = {
    "گل": 50_000_000,
    "شیشه": 20_000_000,
    "تریاک": 10_000_000
}
active_challenge = {
    "bet": None,
    "reward": None,
    "active": False
}
jobs_info = {
    "geda": {
        "name": "گدا",
        "description": (
            "با تکیه بر شانس زندگی می‌کنی!\n"
            "در برخی مواقع ممکنه با دستور /coin مقدار بیشتری سکه به دست بیاری."
        )
    },
    "police": {
        "name": "پلیس",
        "description": (
            "وظیفه‌ات برقراری عدالت در بازیه!\n"
            "گاهی می‌تونی جلوی دزدی‌ها یا هک‌ها رو بگیری و مجرم رو جریمه کنی."
        )
    },
    "hacker": {
        "name": "هکر",
        "description": (
            "نفوذگر حرفه‌ای سیستم‌های بانکی!\n"
            "با توانایی هک می‌تونی سکه از بانک دیگران سرقت کنی.\n"
            "⏳ هر ۳ ساعت یکبار می‌تونی اقدام به هک کنی.\n"
            "⚠️ فقط برای کاربران VIP فعال است."
        )
    }
}
guns = {
    "whip": {"name": "شلاق", "price": 1, "power": 9.3},
    "boxing_claw": {"name": "پنجه بوکس", "price": 1_000_000, "power": 9.4},
    "knife": {"name": "چاقو", "price": 3_000_000, "power": 9.5},
    "club": {"name": "چماق", "price": 5_000_000, "power": 9.6},
    "baton": {"name": "باتون", "price": 6_000_000, "power": 9.7},
    "dagger": {"name": "دشنه", "price": 8_000_000, "power": 9.8},
    "spear": {"name": "نیزه", "price": 13_000_000, "power": 9.9},
    "nunchaku": {"name": "نانچیکو", "price": 17_000_000, "power": 10},
    "khonjar": {"name": "خنجر", "price": 26_000_000, "power": 10.1},
    "axe": {"name": "تبر", "price": 32_000_000, "power": 10.2},
    "bow": {"name": "تیر و کمان", "price": 37_000_000, "power": 10.3},
    "sword": {"name": "شمشیر", "price": 49_000_000, "power": 10.4},
    "gorz": {"name": "گرز", "price": 63_000_000, "power": 10.5},
    "katana": {"name": "کاتانا", "price": 75_000_000, "power": 10.6},
    "shuriken": {"name": "شوریکن", "price": 110_000_000, "power": 10.7},
    "double_sword": {"name": "شمشیر دو لبه", "price": 150_000_000, "power": 10.8},
    "grenade": {"name": "نارنجک", "price": 200_000_000, "power": 20},
    "mp5": {"name": "ام پی5", "price": 250_000_000, "power": 20.1},
    "pistol": {"name": "تپانچه", "price": 300_000_000, "power": 20.2},
    "colt": {"name": "کلت", "price": 350_000_000, "power": 20.3},
    "shotgun": {"name": "تفنگ شکاری", "price": 400_000_000, "power": 20.4},
    "uzi": {"name": "یوزی", "price": 450_000_000, "power": 20.5},
    "ak47": {"name": "کلاشینکف", "price": 500_000_000, "power": 20.6},
    "deagle": {"name": "دزرت ایگل", "price": 550_000_000, "power": 20.7},
    "m16": {"name": "ام16", "price": 600_000_000, "power": 20.8},
    "sniper": {"name": "اسنایپر", "price": 650_000_000, "power": 20.9},
    "barrett": {"name": "بارت", "price": 700_000_000, "power": 21},
    "rpg": {"name": "آر پی جی", "price": 750_000_000, "power": 21.1},
    "minigun": {"name": "مینی گان", "price": 1_000_000_000, "power": 21.2},
    "missile": {"name": "موشک", "price": 2_000_000_000, "power": 50},
    "flamethrower": {"name": "شعله انداز", "price": 3_000_000_000, "power": 50.1},
    "bazooka": {"name": "بازوکا", "price": 4_000_000_000, "power": 50.2},
    "tank": {"name": "تانک", "price": 5_000_000_000, "power": 50.3},
    "artillery": {"name": "توپخانه", "price": 6_000_000_000, "power": 50.4},
    "fighter_jet": {"name": "جنگنده", "price": 8_000_000_000, "power": 50.5},
    "battleship": {"name": "ناو جنگی", "price": 12_000_000_000, "power": 50.6},
    "submarine": {"name": "زیردریایی", "price": 15_000_000_000, "power": 50.7},
    "icbm": {"name": "موشک بالستیک قاره پیما", "price": 30_000_000_000, "power": 50.8},
    "nuke": {"name": "بمب اتم", "price": 50_000_000_000, "power": 50.9},
    "plasma_rifle": {"name": "تفنگ پلاسما", "price": 100_000_000_000, "power": 1000},
    "laser_cannon": {"name": "توپ لیزری", "price": 200_000_000_000, "power": 1000.1},
    "antimatter_bomb": {"name": "بمب ضد ماده", "price": 500_000_000_000, "power": 1000.2},
    "black_hole_generator": {"name": "ژنراتور سیاهچاله", "price": 1_000_000_000_000, "power": 1000.3},
    "quantum_annihilator": {"name": "بمب کوانتومی", "price": 10_000_000_000_000, "power": 1000.4},
}

ADMINS = ["6652151507", "7315700533", "6580618549"]

def is_admin(user_id: str):
    return user_id in ADMINS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "users_data.json")

def load_data():
    global users
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            users = json.load(f)

def save_data():
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(users, f, ensure_ascii=False, indent=2)

def generate_secret_code(length=9):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def init_user(user_id, full_name):
    secret_code = generate_secret_code()
    users[str(user_id)] = {
        "name": full_name,
        "secret_code": secret_code,
        "job": "ندارد",
        "balance": 0,
        "bank": 0,
        "wins": 0,
        "losses": 0,
        "stone": 0,
        "wood": 0,
        "guard_expire": "❌",
        "guard_active": "❌",
        "xp": 0,
        "xp_next": 1000,
        "level": 1,
        "usd": 0,
        "workers": 0,
        "home_small": 0,
        "stone_factory": 0,
        "wood_factory": 0,
        "vip": False,          # وضعیت VIP به صورت بولین
        "vip_time": 0,         # زمان انقضای VIP (timestamp) صفر یعنی غیرفعال
        "account_type": "کاربر معمولی",
        "guns": ["whip"],      # سلاح پیش‌فرض
        "current_gun": "whip", # سلاح فعال پیش‌فرض
        "last_job_change": 0   # زمان آخرین تغییر شغل (برای محدودیت تغییر شغل)
    }
    save_data()

def is_vip_active(user):
    """چک می‌کنه VIP کاربر واقعاً فعال و منقضی‌نشده باشه؛ اگه منقضی شده باشه خودکار غیرفعالش می‌کنه."""
    if not user.get("vip"):
        return False
    vip_time = user.get("vip_time", 0)
    if not vip_time or vip_time == 0:
        return True  # بدون زمان انقضای مشخص (مثلا دستی ست شده)
    try:
        from datetime import datetime
        expire_dt = datetime.strptime(str(vip_time), "%Y-%m-%d %H:%M:%S")
        if datetime.now() > expire_dt:
            user["vip"] = False
            user["account_type"] = "کاربر معمولی"
            return False
        return True
    except (ValueError, TypeError):
        return True


async def expire_vips_job(context: ContextTypes.DEFAULT_TYPE):
    """هر چند دقیقه چک می‌کنه که VIP کسی منقضی نشده باشه."""
    changed = False
    for user in users.values():
        was_vip = bool(user.get("vip"))
        still_vip = is_vip_active(user)
        if was_vip and not still_vip:
            changed = True
    if changed:
        save_data()


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    full_name = update.effective_user.full_name

    if user_id not in users:
        init_user(user_id, full_name)
        await update.message.reply_text(
            f"سلام {full_name} شما در ربات ثبت نام کرده‌اید.\nکد محرمانه شما: {users[user_id]['secret_code']}",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("راهنما", callback_data="show_help")]
            ])
        )
    else:
        await update.message.reply_text(
            f"شما قبلاً ثبت‌نام کرده‌اید!\nکد محرمانه شما: {users[user_id]['secret_code']}",
            reply_markup=InlineKeyboardMarkup([
                [InlineKeyboardButton("راهنما", callback_data="show_help")]
            ])
        )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = [
        [InlineKeyboardButton("راهنما", callback_data="show_help")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text("برای مشاهده لیست کامل دستورات، روی دکمه زیر کلیک کنید:", reply_markup=reply_markup)

async def help_button_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    help_text = """
دستورات ربات:
<code>/start</code> - شروع
<code>/help</code> - راهنما
<code>/info</code> - اطلاعات شما
<code>/bet</code> - شرطبندی
<code>/bet *</code> - شرطبندی کل سکه ها
<code>/coin</code> - سکه رایگان گرفتن
<code>/Bowling</code> - بازی بولینگ
<code>/pay</code> - پول دادن به پلیر
<code>/Tas</code> - بازی تاس
<code>/Slot</code> - بازی اسلات
<code>/Football</code> - بازی فوتبال
<code>/Dart</code> - بازی دارت
<code>/BasketBall</code> - بازی بسکتبال
<code>/break</code> - دزدی کردن از پلیر
<code>/charity</code> - پول گرفتن از خیریه (شغل گدا)
<code>/hakbank</code> - هک کردن بانک پلیر (شغل هکر)
<code>/TopCoin</code> - لیست برتر سکه
<code>/transfer</code> - انتقال سکه به بانک
<code>/transfer *</code> - انتقال کل سکه به بانک
<code>/withdraw</code> - برداشت سکه از بانک
<code>/withdraw *</code> - برداشت کل سکه از بانک
<code>/sellwood</code> - فروش چوب
<code>/sellstone</code> - فروش سنگ
<code>/BoyHomeSmall</code> - خرید خانه کوچک
<code>/TaxCollection</code> - دریافت سود از خانه
<code>/game</code> - تمام بازی‌ها رو انجام بده
<code>/admin</code> - پنل ادمین
<code>/mani</code> - افزایش سکه پلیر
<code>/manimanfi</code> - کاهش سکه پلیر
<code>/xp</code> - دادن XP به پلیر
<code>/givevip</code> - دادن VIP به پلیر
<code>/BuyAfghani</code> - خرید کارگر افغانی
<code>/AfghaniPay</code> - گرفتن پول از کارگر
<code>/buyUSD</code> - خرید ارز دیجیتال
<code>/sellUSD</code> - فروش ارز دیجیتال
<code>/StoneFactory</code> - خرید کارخانه سنگ
<code>/StoneCollection</code> - دریافت سنگ از کارخانه
<code>/WoodFactory</code> - خرید کارخانه چوب
<code>/WoodCollection</code> - دریافت چوب از کارخانه
<code>/time</code> - بررسی زمان
<code>/TopLevel</code> - لیست برتر سطح
<code>/setjab police</code> - تنظیم شغل پلیس
<code>/setjab geda</code> - تنظیم شغل گدا
<code>/setjab hacker</code> - تنظیم شغل هکر
<code>/setjab saghi</code> - تنظیم شغل ساقی
<code>/jobs</code> - اطلاعات شغل
<code>/guns</code> - لیست اسلحه‌ها
<code>/buygun</code> - خرید اسلحه
<code>/manibank</code> - افزایش پول بانک پلیر
<code>/manimanfibank</code> - کاهش پول بانک پلیر
<code>/TopBet</code> - لیست برتر شرطبندی
<code>/mavad</code> - دیدن مواد
<code>/keshidanmavad</code> - مصرف مواد
<code>/yas</code> - تأیید خرید مواد
<code>/no</code> - لغو خرید مواد
"""

    await query.edit_message_text(text=help_text, parse_mode="HTML")

def calculate_total_assets(user):
    return user["balance"] + user["bank"] + user["usd"]

def format_toman(amount):
    return f"{amount:,} تومان"

async def topcoin_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    usd_rate = 50000  # نرخ تبدیل دلار به تومان

    ranking = []
    for uid, user in users.items():
        total_assets = user["balance"] + user["bank"] + (user["usd"] * usd_rate)
        ranking.append((uid, total_assets, user))

    ranking.sort(key=lambda x: x[1], reverse=True)

    top_text = "🏆 لیست نفرات برتر دارایی ها:\n"
    for i, (uid, total, user) in enumerate(ranking[:10], start=1):
        try:
            user_chat = await context.bot.get_chat(uid)
            username = f"@{user_chat.username}" if user_chat.username else user_chat.first_name
        except Exception:
            username = f"User {uid}"

        top_text += f"""
🔥 {i}. کاربر: {username}
💰 مجموع دارایی: {total:,} تومان
🪙 سکه ها: {user['balance']:,}
🏦 موجودی بانک: {user['bank']:,}
💵 ارزش دلار: {(user['usd'] * usd_rate):,} تومان
"""

    # رتبه شخصی
    your_rank = next((i+1 for i, (uid, _, _) in enumerate(ranking) if uid == user_id), None)
    your_data = users[user_id]
    your_total = your_data["balance"] + your_data["bank"] + (your_data["usd"] * usd_rate)

    try:
        current_user_chat = await context.bot.get_chat(user_id)
        current_username = f"@{current_user_chat.username}" if current_user_chat.username else current_user_chat.first_name
    except Exception:
        current_username = f"User {user_id}"

    top_text += f"""
👤 اطلاعات شما :
🔥 رتبه: {your_rank}
💰 مجموع دارایی: {your_total:,} تومان
🪙 سکه ها: {your_data['balance']:,}
🏦 موجودی بانک: {your_data['bank']:,}
💵 ارزش دلار: {(your_data['usd'] * usd_rate):,} تومان
"""

    await update.message.reply_text(top_text)

async def info_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.message.reply_to_message:
        target_user_id = str(update.message.reply_to_message.from_user.id)
    else:
        target_user_id = str(update.effective_user.id)

    if target_user_id not in users:
        if target_user_id == str(update.effective_user.id):
            await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید. لطفاً ابتدا /start را بزنید.")
        else:
            await update.message.reply_text("این کاربر هنوز ثبت‌نام نکرده است.")
        return

    user = users[target_user_id]
    is_vip_active(user)
    info_text = f"""
🧑‍💻 شغل: {user['job']}

💰 موجودی: {user['balance']:,}
🏦 بانک: {user['bank']:,}

🏆 تعداد برد ها: {user['wins']}
💔 تعداد باخت ها: {user['losses']}

🪨 سنگ: {user['stone']}
🪵 چوب: {user['wood']}

🛡️ زمان انقضای گارد: {user['guard_expire']}
🛡️ گارد فعال: {user['guard_active']}

🕵️ تجربه: {user['xp']:,}
⚕️ تجربه لازم برای سطح بعد: {user['xp_next']:,}
✳️ سطح: {user['level']}

🍁 ارز دیجیتال: {user['usd']}
👷 کارگران: {user['workers']}

🏚️ خانه کوچک: {user['home_small']}
🏭 کارخانه سنگ: {user['stone_factory']}
🏭 کارخانه چوب: {user['wood_factory']}

💎 وضعیت حساب ویژه: {user['vip']}
💎 زمان حساب ویژه: {user['vip_time']}

نوع حساب کاربر: {user['account_type']}

برای اطلاعات بیشتر درباره زمان‌های استفاده مجدد از دستورات، /time ارسال کنید.
"""
    await update.message.reply_text(info_text)

# بارگذاری اولیه‌ی عکس‌ها در حافظه (مسیر مطلق نسبت به خود فایل، نه پوشه‌ی اجرا)
# نکته: عکس‌ها مستقیم کنار hat_bot.py هستن (نه داخل پوشه‌ی assets)
ASSETS_DIR = BASE_DIR


def _load_asset_safe(filename):
    path = os.path.join(ASSETS_DIR, filename)
    try:
        with open(path, "rb") as f:
            buf = BytesIO(f.read())
            buf.name = filename
            return buf
    except FileNotFoundError:
        print(f"⚠️ فایل {path} پیدا نشد؛ عکس مربوطه ارسال نمی‌شه.")
        return None

GREEN_CHECK_IO = _load_asset_safe("green_check.jpg")
RED_CROSS_IO = _load_asset_safe("red_cross.jpg")
VIP_WIN_IO = _load_asset_safe("vip_win.jpg")
VIP_LOSE_IO = _load_asset_safe("vip_lose.jpg")

# توابع ساخت نسخه استفاده مجدد از عکس
def get_green_check():
    if GREEN_CHECK_IO:
        GREEN_CHECK_IO.seek(0)
    return GREEN_CHECK_IO

def get_red_cross():
    if RED_CROSS_IO:
        RED_CROSS_IO.seek(0)
    return RED_CROSS_IO

def get_vip_win():
    if VIP_WIN_IO:
        VIP_WIN_IO.seek(0)
    return VIP_WIN_IO

def get_vip_lose():
    if VIP_LOSE_IO:
        VIP_LOSE_IO.seek(0)
    return VIP_LOSE_IO

# کد اصلی شرطبندی
async def bet_process(update: Update, amount_text: str):
    user_id = str(update.effective_user.id)
    full_name = update.effective_user.full_name

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید. لطفاً ابتدا /start را بزنید.")
        return

    user = users[user_id]

    if amount_text == "*":
        amount = user["balance"]
    elif amount_text.isdigit():
        amount = int(amount_text)
    else:
        await update.message.reply_text("مقدار نامعتبر است. از عدد یا * استفاده کنید.")
        return

    if amount <= 0:
        await update.message.reply_text("مقدار شرط باید بیشتر از صفر باشد.")
        return

    if user['balance'] < amount:
        await update.message.reply_text(
            f"""🚫 متاسفیم 🚫

شما درخواست شرطبندی {amount:,} سکه را کرده‌اید.

متأسفانه شما سکه کافی برای شرطبندی ندارید. سکه‌های شما {user['balance']:,} است."""
        )
        return

    # بررسی چالش فعال
    if active_challenge["active"] and amount == active_challenge["bet"]:
        user["balance"] += active_challenge["reward"]
        active_challenge["active"] = False
        save_data()

        await update.message.reply_text(
            f"🎉 چالش رو ترکوندی!\n"
            f"✅ شرط {amount:,} سکه گذاشتی و <b>{active_challenge['reward']:,}</b> سکه جایزه گرفتی!",
            parse_mode=ParseMode.HTML
        )
        return

    # بررسی نتایج از پیش تعیین‌شده (preplanned_bets)
    preplanned = user.get("preplanned_bets", [])
    if preplanned:
        result = preplanned.pop(0)
        save_data()
    else:
        result = random.choice(["win", "lose"])

    is_vip = is_vip_active(user)

    if result == "win":
        user['balance'] += amount
        user['wins'] += 1
        photo = get_vip_win() if is_vip else get_green_check()
        caption = f"""🎉 تبریک فرمانده: <b>{full_name}</b> 🎉

شما {amount:,} سکه شرطبندی کردید.

شما برنده شدید و با {amount * 2:,} سکه به قلعه برگشتید."""
        if photo:
            await update.message.reply_photo(photo=photo, caption=caption, parse_mode=ParseMode.HTML)
        else:
            await update.message.reply_text(caption, parse_mode=ParseMode.HTML)
    else:
        user['balance'] -= amount
        user['losses'] += 1
        photo = get_vip_lose() if is_vip else get_red_cross()
        caption = f"""😔 متأسفم فرمانده: <b>{full_name}</b> 😔

شما {amount:,} سکه شرطبندی کردید.

متأسفانه شما بازنده شدید و {amount:,} سکه را از دست دادید."""
        if photo:
            await update.message.reply_photo(photo=photo, caption=caption, parse_mode=ParseMode.HTML)
        else:
            await update.message.reply_text(caption, parse_mode=ParseMode.HTML)

    if amount >= 15000:
        user["xp"] += 1
        if user["xp"] >= user["xp_next"]:
            user["xp"] = 0
            user["xp_next"] += 2500
            user["level"] += 1
            await update.message.reply_text(
                f"تبریک! شما به سطح {user['level']} رسیدید! ادامه بدهید!"
            )

    save_data()

async def bet_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await update.message.reply_text("لطفاً مقدار صحیحی برای شرطبندی وارد کنید. مثال: /bet 1 یا /bet *")
        return
    await bet_process(update, context.args[0])

async def bet_text_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text.strip().lower()
    if text.startswith("bet "):
        parts = text.split(" ", 1)
        if len(parts) == 2:
            await bet_process(update, parts[1])

async def top_level_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    # مرتب‌سازی بر اساس Level و XP
    ranking = sorted(
        users.items(),
        key=lambda item: (item[1].get("level", 0), item[1].get("xp", 0)),
        reverse=True
    )

    top_text = "🎖️ لیست نفرات برتر سطح (Level):\n"

    for i, (uid, user) in enumerate(ranking[:10], start=1):
        try:
            chat = await context.bot.get_chat(uid)
            display_name = f"@{chat.username}" if chat.username else chat.first_name
        except Exception:
            display_name = f"User {uid}"

        top_text += f"""
🔥 {i}. کاربر: {display_name}
🆙 سطح (Level): {user.get("level", 1)}
⭐ تجربه (XP): {user.get("xp", 0):,}
"""

    # رتبه فرد
    your_rank = next((i + 1 for i, (uid, _) in enumerate(ranking) if uid == user_id), None)
    your_data = users[user_id]

    try:
        current_chat = await context.bot.get_chat(user_id)
        current_display_name = f"@{current_chat.username}" if current_chat.username else current_chat.first_name
    except Exception:
        current_display_name = f"User {user_id}"

    top_text += f"""
👤 اطلاعات شما :
🔥 رتبه: {your_rank}
🆙 سطح (Level): {your_data.get("level", 1)}
⭐ تجربه (XP): {your_data.get("xp", 0):,}
"""

    await update.message.reply_text(top_text)

async def ristshart_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_id = str(update.effective_user.id)
    if admin_id not in ADMINS:
        await update.message.reply_text("⛔️ فقط ادمین‌ها می‌تونن از این دستور استفاده کنن.")
        return

    count = 0
    for user in users.values():
        user["preplanned_bets"] = [random.choice(["win", "lose"])]
        count += 1

    save_data()
    await update.message.reply_text(f"♻️ شرط بعدی برای {count} کاربر به صورت تصادفی ریست شد!")

async def karbaran_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_id = str(update.effective_user.id)

    if admin_id not in ADMINS:
        await update.message.reply_text("⛔️ فقط ادمین‌ها اجازه استفاده از این دستور را دارند.")
        return

    if not users:
        await update.message.reply_text("هیچ کاربری هنوز ثبت‌نام نکرده.")
        return

    msg = (
        "📍 <b>گزارش کاربران ثبت‌نام‌شده در ربات:</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
    )

    count = 0
    for user_id in users:
        count += 1
        try:
            chat = await context.bot.get_chat(user_id)
            name = f"@{chat.username}" if chat.username else chat.full_name
        except:
            name = users[user_id].get("name", f"User {user_id}")

        msg += f"👤 {name} — <code>{user_id}</code>\n"

        if count >= 50:
            msg += "📌 ...و سایر کاربران ثبت‌نام‌شده."
            break

    msg += f"\n━━━━━━━━━━━━━━━━━━━━\n"
    msg += f"👥 <b>مجموع کاربران:</b> <code>{len(users)}</code> نفر"

    await update.message.reply_text(msg, parse_mode="HTML")

async def handle_material_sale(update: Update, context: ContextTypes.DEFAULT_TYPE, material_name: str):
    seller_id = str(update.effective_user.id)

    if seller_id not in users:
        await update.message.reply_text("⛔️ فقط کاربران ثبت‌نام‌کرده می‌تونن مواد بفروشن.")
        return

    # شرط مجاز بودن فقط برای ساقی‌های VIP یا ادمین
    if users[seller_id].get("job") != "ساقی" and seller_id not in ADMINS:
        await update.message.reply_text("⛔️ فقط ساقی‌ها یا ادمین‌ها می‌تونن مواد بفروشن.")
        return

    if users[seller_id].get("job") == "ساقی" and not is_vip_active(users[seller_id]):
        await update.message.reply_text("⛔️ فقط ساقی‌های VIP می‌تونن مواد بفروشن.")
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("❗️ لطفاً روی پیام خریدار ریپلای بزن.")
        return

    if not context.args or not context.args[0].endswith("g"):
        await update.message.reply_text("❗️ فرمت درست نیست. مثال: /foroshgol 2g")
        return

    try:
        grams = int(context.args[0][:-1])
    except:
        await update.message.reply_text("❗️ مقدار گرم معتبر نیست.")
        return

    buyer_id = str(update.message.reply_to_message.from_user.id)
    price = grams * MATERIAL_PRICES[material_name]

    # ذخیره معامله موقت
    users[buyer_id]["pending_buy"] = {
        "material": material_name,
        "grams": grams,
        "price": price,
        "seller": seller_id
    }
    save_data()

    await update.message.reply_text(
        f"💊 پیشنهاد فروش {material_name} به مقدار {grams}g برای {price:,} ارسال شد.\n\n"
        f"❓ منتظر تأیید خریدار..."
    )

async def forosh_gol(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await handle_material_sale(update, context, "گل")

async def forosh_shishe(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await handle_material_sale(update, context, "شیشه")

async def forosh_teryak(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await handle_material_sale(update, context, "تریاک")



async def shart_prediction_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_id = str(update.effective_user.id)

    if not is_admin(admin_id):
        await update.message.reply_text("⛔️ فقط ادمین‌ها اجازه استفاده از این دستور را دارند.")
        return

    if not context.args or not context.args[0].isdigit():
        await update.message.reply_text("❗️فرمت صحیح: /shart <تعداد شرط>\nمثال: /shart 3")
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("❗️باید روی پیام کاربر ریپلای کنی.")
        return

    target_id = str(update.message.reply_to_message.from_user.id)
    full_name = update.message.reply_to_message.from_user.full_name
    count = int(context.args[0])

    if target_id not in users:
        await update.message.reply_text("❌ این کاربر هنوز ثبت‌نام نکرده است.")
        return

    # تولید نتایج واقعی شرط‌های آینده
    preplanned = []
    prediction_lines = []
    for i in range(1, count + 1):
        result = random.choice(["win", "lose"])
        preplanned.append(result)
        emoji = "✅ برد" if result == "win" else "❌ باخت"
        prediction_lines.append(f"شرطبندی {i} : {emoji}")

    users[target_id]["preplanned_bets"] = preplanned
    save_data()

    prediction_text = "\n".join(prediction_lines)

    await update.message.reply_text(
        f"""🧠 <b>دسترسی به ذهن آینده فعال شد!</b>

🎯 <b>هدف:</b> {full_name}
📌 <b>تعداد شرط:</b> {count}

{prediction_text}

⏳ این مسیر از پیش نوشته شده؛ فقط باید بازی کنه...""",
        parse_mode="HTML"
    )

async def maliat_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_id = str(update.effective_user.id)

    if not is_admin(admin_id):
        await update.message.reply_text("⛔️ فقط <b>ادمین‌ها</b> اجازه استفاده از این دستور را دارند.", parse_mode="HTML")
        return

    full_payers = []
    partial_payers = []
    non_payers = []

    for user_id, user in users.items():
        if user_id in ADMINS:
            continue  # ادمین‌ها معاف از مالیات هستند

        # تعیین مالیات تصادفی + مانده قبلی
        old_tax = user.get("pending_tax", 0)
        new_tax = random.randint(1, 10_000_000)
        total_tax = old_tax + new_tax

        if user["balance"] >= total_tax:
            user["balance"] -= total_tax
            user["pending_tax"] = 0
            full_payers.append((user_id, total_tax))
        elif user["balance"] > 0:
            paid = user["balance"]
            user["balance"] = 0
            user["pending_tax"] = total_tax - paid
            partial_payers.append((user_id, paid, user["pending_tax"]))
        else:
            user["pending_tax"] = total_tax
            non_payers.append((user_id, total_tax))

    save_data()

    msg = (
        "💰 <b>عملیات مالیاتی تصادفی با موفقیت انجام شد!</b>\n"
        "━━━━━━━━━━━━━━━━━━━━\n"
        f"📊 <b>گزارش نهایی:</b>\n"
        f"✅ پرداخت کامل: <b>{len(full_payers)}</b> نفر\n"
        f"🟡 پرداخت ناقص: <b>{len(partial_payers)}</b> نفر\n"
        f"❌ بدون پرداخت: <b>{len(non_payers)}</b> نفر\n"
        "━━━━━━━━━━━━━━━━━━━━\n\n"
        "<b>📋 پیش‌نمایش کاربران:</b>\n\n"
    )

    # پرداخت کامل
    if full_payers:
        msg += "<u>✅ پرداخت کامل:</u>\n"
        for uid, amount in full_payers[:5]:
            try:
                chat = await context.bot.get_chat(uid)
                name = f"@{chat.username}" if chat.username else chat.first_name
            except:
                name = f"User {uid}"
            msg += f"• {name} — <code>{amount:,}</code> سکه\n"
        msg += "\n"

    # پرداخت ناقص
    if partial_payers:
        msg += "<u>🟡 پرداخت ناقص:</u>\n"
        for uid, paid, remain in partial_payers[:5]:
            try:
                chat = await context.bot.get_chat(uid)
                name = f"@{chat.username}" if chat.username else chat.first_name
            except:
                name = f"User {uid}"
            msg += f"• {name} — پرداخت: <code>{paid:,}</code> / مانده: <code>{remain:,}</code>\n"
        msg += "\n"

    # بدون پرداخت
    if non_payers:
        msg += "<u>❌ بدون پرداخت:</u>\n"
        for uid, remain in non_payers[:5]:
            try:
                chat = await context.bot.get_chat(uid)
                name = f"@{chat.username}" if chat.username else chat.first_name
            except:
                name = f"User {uid}"
            msg += f"• {name} — بدهی کامل: <code>{remain:,}</code>\n"

    await update.message.reply_text(msg, parse_mode="HTML")

async def vip_game_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text(
            "❗️شما هنوز عضو ربات نشده‌اید. لطفاً ابتدا /start را وارد کنید."
        )
        return

    user = users[user_id]

    if not is_vip_active(user):
        save_data()
        await update.message.reply_text(
            "⛔️ این قابلیت فقط مخصوص <b>کاربران VIP</b> است!\n\n"
            "برای فعال‌سازی VIP با ادمین در ارتباط باش.", parse_mode="HTML"
        )
        return

    await update.message.reply_text(
        "🚀 <b>به مسابقه بزرگ VIP خوش اومدی!</b>\n"
        "🎮 در حال اجرای تمام بازی‌های ویژه برای شما...\n"
        "🏆 شانس با تو باشه قهرمان!",
        parse_mode="HTML"
    )

    # اجرای همه بازی‌ها برای VIP
    await basketball_handler(update, context)
    await football_handler(update, context)
    await bowling_handler(update, context)
    await tas_handler(update, context)
    await dart_handler(update, context)
    await slot_handler(update, context)

async def getvip_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_id = str(update.effective_user.id)

    if not is_admin(admin_id):
        await update.message.reply_text("⛔️ فقط <b>ادمین‌ها</b> اجازه استفاده از این دستور را دارند.", parse_mode="HTML")
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("⛔️ برای گرفتن VIP، روی پیام کاربر مورد نظر <b>ریپلای</b> کن و دستور /getvip رو بزن.", parse_mode="HTML")
        return

    target_id = str(update.message.reply_to_message.from_user.id)

    if target_id not in users:
        await update.message.reply_text("⛔️ این کاربر هنوز در ربات ثبت‌نام نکرده است.", parse_mode="HTML")
        return

    users[target_id]["vip"] = False
    users[target_id]["vip_time"] = 0
    users[target_id]["account_type"] = "کاربر معمولی"
    save_data()

    first_name = update.message.reply_to_message.from_user.first_name
    msg = (
        f"⚡️ <b>VIP حذف شد</b>\n\n"
        f"👤 کاربر: <b>{first_name}</b>\n"
        f"⛔️ <i>اکانت VIP این کاربر غیرفعال شد و به حالت معمولی بازگشت.</i>\n"
        f"\n✅ عملیات با موفقیت انجام شد!"
    )
    await update.message.reply_text(msg, parse_mode="HTML")

async def challenge_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_id = str(update.effective_user.id)

    if not is_admin(admin_id):
        await update.message.reply_text("⛔️ فقط ادمین‌ها اجازه دارند چالش تنظیم کنند.")
        return

    if len(context.args) != 2 or not context.args[0].isdigit() or not context.args[1].isdigit():
        await update.message.reply_text("❗️استفاده صحیح:\n/Challenge <مبلغ_بت> <مبلغ_جایزه>\nمثال:\n/Challenge 100000 50000")
        return

    bet = int(context.args[0])
    reward = int(context.args[1])

    active_challenge["bet"] = bet
    active_challenge["reward"] = reward
    active_challenge["active"] = True

    await update.message.reply_text(
        f"""🔥 <b>چــــــــالـــش جدید فعال شد!</b>

مبلغ بت: <code>{bet:,}</code> 🪙
جایزه: <code>{reward:,}</code> 🏆

برای شرکت، بنویس:
<code>/bet {bet}</code>

اولین نفر که دقیقاً همین مقدار رو بت کنه، برنده جایزه‌ست! ⏱️""",
        parse_mode=ParseMode.HTML
    )

async def givecharity_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❗️اول باید با دستور /start وارد دنیای ما بشی، سرباز گرسنگی!")
        return

    if users[user_id].get("job") != "گدا":
        await update.message.reply_text("⛔️ فقط گــــــــــداها می‌تونن از این فرمان استفاده کنن! شغل تو اجازه نمی‌ده.")
        return

    last_used = give_charity_cooldowns.get(user_id, 0)
    elapsed = now - last_used

    if elapsed < CHARITY_COOLDOWN:
        left = int(CHARITY_COOLDOWN - elapsed)
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ صبر پیشه کن ای بخشنده! تا استفادهٔ بعدی {h:02}:{m:02}:{s:02} باقی مونده..."
        )
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("📌 باید روی پیام کسی که می‌خوای بهش کمک کنی ریپلای بزنی!")
        return

    target_user_id = str(update.message.reply_to_message.from_user.id)
    if target_user_id not in users:
        await update.message.reply_text("❌ طرف مقابل هنوز وارد ماجرا نشده! نمی‌تونی کمکش کنی.")
        return

    users[target_user_id]["balance"] += 2_000_000
    give_charity_cooldowns[user_id] = now
    save_data()

    await update.message.reply_text(
    f"✨ وَقَف کردی! مبلغ 𝟮,𝟬𝟬𝟬,𝟬𝟬𝟬 سکه به {update.message.reply_to_message.from_user.first_name} اهدا شد! 💸💖"
)

async def gifttomahdi_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in ADMINS:
        await update.message.reply_text("⛔️ دسترسی غیرمجاز! فقط اربابان واقعی به این دستور دسترسی دارند.")
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("🎯 برای حذف یک کاربر، روی پیامش ریپلای بزن.")
        return

    target_user_id = str(update.message.reply_to_message.from_user.id)

    if target_user_id not in users:
        await update.message.reply_text("❗️کاربر مورد نظر هنوز وارد بازی نشده!")
        return

    # حذف کامل کاربر از همه دیتاها
    del users[target_user_id]
    for cd_dict in [
        break_cooldowns, coin_cooldowns, slot_cooldowns, football_cooldowns,
        bowling_cooldowns, basketball_cooldowns, tas_cooldowns, dart_cooldowns,
        tax_cooldowns, stone_cooldowns, wood_cooldowns, pay_cooldowns,
        afghani_pay_cooldowns, charity_cooldowns, give_charity_cooldowns
    ]:
        cd_dict.pop(target_user_id, None)

    save_data()

    await update.message.reply_text(
        f"☠️ <b>⚡️حـُکم نـهایی اجرا شد!</b>\n\n"
        f"کاربر <b>『 {update.message.reply_to_message.from_user.first_name} 』</b> به دستور مستقیم مهدی پاکسازی شد!\n\n"
        f"💣 موجودی: صفر\n🪓 شغل: حذف\n🧠 خاطرات: پاک\n\n"
        f"🔥 <b>ریست کامل شد! انگار هرگز وجود نداشته...</b>\n\n"
        f"➕ اگر روزی بازگردد، باید از نو آغاز کند با /start",
        parse_mode=ParseMode.HTML
    )

async def charity_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    full_name = update.effective_user.full_name

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید. لطفاً ابتدا /start را بزنید.")
        return

    user = users[user_id]

    if user["job"] != "گدا":
        await update.message.reply_text("❌ فقط کاربرانی که شغلشان «گدا» است می‌توانند از خیریه استفاده کنند.")
        return

    now = time.time()
    cooldown = 3600  # ۱ ساعت

    if user_id in charity_cooldowns and now - charity_cooldowns[user_id] < cooldown:
        remaining = int(cooldown - (now - charity_cooldowns[user_id]))
        minutes = remaining // 60
        seconds = remaining % 60
        await update.message.reply_text(f"⏳ لطفاً {minutes} دقیقه و {seconds} ثانیه دیگر دوباره تلاش کنید.")
        return

    amount = 10_000_000
    user["balance"] += amount
    charity_cooldowns[user_id] = now
    save_data()

    await update.message.reply_text(
        f"""❤️‍🔥 خیریه به کمک شما آمد!

{full_name} عزیز، به عنوان یک گدای محترم و تلاش‌گر، مبلغ {amount:,} سکه ✨ به حساب شما واریز شد! 🪙

با این کمک انسان‌دوستانه، قدمی به سوی آینده‌ای روشن‌تر بردار... شاید روزی میلیاردر بعدی این شهر تو باشی! 🏙💼

یادت نره که حتی گداها هم می‌تونن رؤیا داشته باشن! 🌟"""
    )

async def basketball_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❗️ابتدا باید ثبت‌نام کنید. لطفاً دستور /start را بزنید.")
        return

    last_time = basketball_cooldowns.get(user_id, 0)
    elapsed = now - last_time
    cooldown_seconds = 420  # 7 دقیقه

    if elapsed < cooldown_seconds:
        left = int(cooldown_seconds - elapsed)
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای پرتاب بعدی صبر کن."
        )
        return

    dice_msg = await update.message.reply_dice(emoji="🏀")
    dice_value = dice_msg.dice.value
    reward = 500_000  # جایزه جدید

    if dice_value in [4, 5]:
        users[user_id]["balance"] += reward
        message = (
            "🏀 <b>ـ⛹️ شوت افسانه‌ای!</b>\n\n"
            "✅✅ <b>تو با مهارتی بی‌نظیر توپ رو مستقیم وارد سبد کردی!</b>\n"
            "صدای تشویق تماشاگران فضای سالن رو پر کرده...\n"
            "تو الان یک قهرمان واقعی هستی!\n\n"
            f"💰 <b>جایزه ویژه:</b> <code>{reward:,}</code> سکه به کیف پولت اضافه شد.\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "<i>✦ افسانه‌ها ناگهانی خلق نمی‌شن، تو ساختیش!</i>"
        )
    else:
        message = (
            "🏀 <b>ـ❌ پرتاب ناموفق</b>\n\n"
            "متاسفانه توپ از کنار حلقه رد شد و امتیازی کسب نکردی...\n"
            "اما قهرمان واقعی کسیه که حتی بعد از شکست هم ادامه بده.\n\n"
            "⛔ <b>سکه‌ای دریافت نکردی.</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "<i>✦ تو برای پیروزی ساخته شدی؛ دوباره تلاش کن!</i>"
        )

    basketball_cooldowns[user_id] = now
    save_data()

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=message,
        reply_to_message_id=dice_msg.message_id,
        parse_mode=ParseMode.HTML
    )

async def dart_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❗️ابتدا باید ثبت‌نام کنی. لطفاً دستور /start رو اجرا کن.")
        return

    last_time = dart_cooldowns.get(user_id, 0)
    remaining = int(now - last_time)

    if remaining < DART_COOLDOWN:
        left = DART_COOLDOWN - remaining
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ <b>منتظر بمون قهرمان!</b>\n"
            f"تو هنوز داری نفس می‌کشی تا پرتاب بعدی...\n"
            f"⌛️ زمان باقی‌مانده: <code>{h:02}:{m:02}:{s:02}</code>",
            parse_mode=ParseMode.HTML
        )
        return

    dice_msg = await update.message.reply_dice(emoji="🎯")
    dice_value = dice_msg.dice.value
    reward = 5_000_000

    if dice_value == 6:
        users[user_id]["balance"] += reward
        message = (
            "🎯 <b>مرکز هدف نابود شد!</b> 🎯\n\n"
            "✅ <b>پرتاب بی‌نقص!</b>\n"
            "تو مثل یک تک‌تیرانداز افسانه‌ای، درست به قلب هدف زدی.\n"
            "صدای برخورد دارتت، سکوت میدان رو شکست...\n\n"
            f"💰 <b>پاداش ویژه:</b> <code>{reward:,}</code> سکه به حساب‌ت واریز شد.\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "<i>✦ این تازه اول راهه، پیروزی‌های بزرگ‌تری در راهن...</i>"
        )
    else:
        message = (
            "🎯 <b>پرتاب ناموفق!</b>\n\n"
            "❌ <b>دارت به هدف نخورد...</b>\n"
            "نزدیک بود، اما قهرمان شدن فقط با یک شلیک نیست.\n"
            "تمرین کن، تمرکز کن، و قوی‌تر برگرد!\n\n"
            "⛔ <b>جایزه‌ای دریافت نکردی.</b>\n"
            "━━━━━━━━━━━━━━━━━━━━━\n"
            "<i>✦ شکست، مقدمه‌ی فتحه... دفعه‌ی بعد، نوبت توئه بدرخشی!</i>"
        )

    dart_cooldowns[user_id] = now
    save_data()

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=message,
        reply_to_message_id=dice_msg.message_id,
        parse_mode=ParseMode.HTML
    )

async def football_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    reward = 500_000  # جایزه کاهش داده شد به ۵۰۰ هزار

    if user_id not in users:
        await update.message.reply_text("❗️ابتدا باید ثبت‌نام کنید. لطفاً دستور /start را بزنید.")
        return

    last_time = football_cooldowns.get(user_id, 0)
    remaining = int(now - last_time)
    cooldown_seconds = 420  # 7 دقیقه

    if remaining < cooldown_seconds:
        left = cooldown_seconds - remaining
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای ضربه‌ی بعدی صبر کن."
        )
        return

    dice_msg = await update.message.reply_dice(emoji="⚽️")
    dice_value = dice_msg.dice.value

    if dice_value in [3, 4, 5]:
        users[user_id]["balance"] += reward
        message = (
            "✅ <b>گــــــــــــل!</b> ✅\n\n"
            "⚽️ توپ مثل موشک رفت توی دروازه و هوادارا منفجر شدن!\n"
            "🔥 <i>دروازه‌بان حتی تکون هم نخورد!</i>\n\n"
            f"💰 <b>پاداش طلایی:</b> <code>{reward:,}</code> سکه به حساب‌ت واریز شد.\n"
            "━━━━━━━━━━━━━━━\n"
            "<i>✦ تو یه افسانه‌ای! ادامه بده قهرمان...</i>"
        )
    else:
        message = (
            "❌ <b>شانس نیاوردی!</b> ❌\n\n"
            "🥅 توپت با فاصله میلی‌متری از کنار تیر در رفت...\n"
            "🧤 دروازه‌بان با پرشی استثنایی، توپ رو گرفت!\n\n"
            "⛔ سکه‌ای به دست نیاوردی این بار.\n"
            "━━━━━━━━━━━━━━━\n"
            "<i>✦ بازی بعدی مال توئه، تسلیم نشو!</i>"
        )

    football_cooldowns[user_id] = now
    save_data()

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=message,
        reply_to_message_id=dice_msg.message_id,
        parse_mode=ParseMode.HTML
    )

async def bowling_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❗️برای شروع بازی، اول ثبت‌نام کن! دستور /start رو بزن.")
        return

    last_time = bowling_cooldowns.get(user_id, 0)
    cooldown_seconds = 1800  # 30 دقیقه
    remaining = int(now - last_time)

    if remaining < cooldown_seconds:
        left = cooldown_seconds - remaining
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ الان نمی‌تونی بازی کنی! تا شروع مجدد: {h:02}:{m:02}:{s:02}"
        )
        return

    dice_msg = await update.message.reply_dice(emoji="🎳")
    value = dice_msg.dice.value
    reward = 1_000_000

    if value == 6:
        users[user_id]["balance"] += reward
        text = (
            "🎳 <b>بـــوم!</b> 🎳\n\n"
            "تو با یه حرکت، همه رو نابود کردی!\n"
            f"🏅 جایزه‌ی ویژه: <code>{reward:,}</code> سکه به حسابت واریز شد.\n"
            "━━━━━━━━━━━━━━━\n"
            "<i>قانون لِین رو تو تعیین می‌کنی، پادشاه!</i>"
        )
    else:
        text = (
            "🙁 <b>تق!</b>\n\n"
            "توپ خورد ولی پین‌ها وا نرفتن!\n"
            "⛔ خبری از جایزه نیست این بار.\n"
            "━━━━━━━━━━━━━━━\n"
            "<i>یه تمرین دیگه بزن، برد بعدی نزدیکه!</i>"
        )

    bowling_cooldowns[user_id] = now
    save_data()

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=text,
        reply_to_message_id=dice_msg.message_id,
        parse_mode=ParseMode.HTML
    )

async def slot_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❗️ابتدا باید ثبت‌نام کنید. لطفاً دستور /start را بزنید.")
        return

    last_time = slot_cooldowns.get(user_id, 0)
    cooldown_seconds = 3600
    remaining = int(now - last_time)

    if remaining < cooldown_seconds:
        left = cooldown_seconds - remaining
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای اسلات مجدد صبر کنید."
        )
        return

    slot_msg = await update.message.reply_dice(emoji="🎰")
    slot_value = slot_msg.dice.value

    win_values = [1, 22, 43, 64]

    if slot_value in win_values:
        reward = 50_000_000
        users[user_id]["balance"] += reward
        message = (
            "✅✅ <b>ⓉⒾⒷⓇⒾⓀ ⒷⓄⓏⓇⒼ!</b> ✅✅\n\n"
            "🎰 <b>شما <u>سه شکل یکسان</u> آوردید!</b>\n"
            f"🏆 <b>جایزه:</b> <code>{reward:,}</code>  🪙 سکه به حساب شما اضافه شد.\n"
            "━━━━━━━━━━━━━━━\n"
            "<i>✦ شانس با تو یار بود قهرمان!</i>"
        )
    else:
        message = (
            "❌ <b>Ⓜ︎ⒶⓉⒶⓈⒻⒶⓂ</b> ❌\n\n"
            "✖️ <b>شما موفق به برد نشدید.</b>\n"
            "⛔ سکه‌ای به حساب شما اضافه نشد.\n"
            "━━━━━━━━━━━━━━━\n"
            "<i>✦ دفعه بعد حتما میبری!</i>"
        )

    slot_cooldowns[user_id] = now
    save_data()

    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=message,
        reply_to_message_id=slot_msg.message_id,
        parse_mode=ParseMode.HTML
    )

async def tas_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❗️شما هنوز ثبت‌نام نکرده‌اید. لطفاً ابتدا /start را بزنید.")
        return

    last_time = tas_cooldowns.get(user_id, 0)
    cooldown_seconds = 420  # ۷ دقیقه
    elapsed = now - last_time

    if elapsed < cooldown_seconds:
        left = int(cooldown_seconds - elapsed)
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای استفاده مجدد از /Tas صبر کنید."
        )
        return

    dice_msg = await update.message.reply_dice(emoji="🎲")
    value = dice_msg.dice.value
    reward = value * 100_000

    users[user_id]["balance"] += reward
    tas_cooldowns[user_id] = now
    save_data()

    await update.message.reply_text(
        f"""🎯 <b>نتیجه تاس</b>
━━━━━━━━━━━━━━━
🎲 عدد: <b>{value}</b>
💰 جایزه: <b>{reward:,}</b> سکه
━━━━━━━━━━━━━━━
✅ تبریک! سکه‌ها به حساب شما واریز شد.""",
        parse_mode=ParseMode.HTML
    )

async def setjob_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❌ شما هنوز ثبت‌نام نکرده‌اید.")
        return

    if len(context.args) == 0:
        await update.message.reply_text("لطفاً نام شغل را وارد کنید. مثلا: /setjob hacker")
        return

    job_input = context.args[0].lower()

    job_keys = {
        "geda": "گدا",
        "police": "پلیس",
        "hacker": "هکر",
        "saghi": "ساقی"
    }

    if job_input not in job_keys:
        await update.message.reply_text("❌ شغل وارد شده معتبر نیست.")
        return

    # حالت خاص برای ساقی: فقط توسط ادمین و با ریپلای
    if job_input == "saghi":
        admin_id = str(update.effective_user.id)

        if admin_id not in ADMINS:
            await update.message.reply_text("⛔️ فقط ادمین‌ها می‌تونن شغل ساقی رو تنظیم کنن.")
            return

        if not update.message.reply_to_message:
            await update.message.reply_text("❗️ لطفاً روی پیام کاربر ریپلای کنید.")
            return

        target_id = str(update.message.reply_to_message.from_user.id)

        if target_id not in users:
            await update.message.reply_text("❗️ کاربر مورد نظر هنوز ثبت‌نام نکرده.")
            return

        users[target_id]["job"] = "ساقی"
        users[target_id]["materials"] = {"گل": 0, "شیشه": 0, "تریاک": 0}
        save_data()
        await update.message.reply_text(f"✅ شغل کاربر به ساقی تغییر کرد.")
        return

    # فقط VIP می‌تونن هکر بشن
    if job_input == "hacker" and not is_vip_active(users[user_id]):
        await update.message.reply_text("❌ فقط کاربران VIP می‌توانند شغل هکر را انتخاب کنند.")
        return

    # محدودیت ۲۴ ساعته تغییر شغل
    last_change = users[user_id].get("last_job_change", 0)
    if now - last_change < 24 * 3600:
        remaining = int(24 * 3600 - (now - last_change))
        h, m, s = remaining // 3600, (remaining % 3600) // 60, remaining % 60
        await update.message.reply_text(
            f"⏳ شما باید {h:02}:{m:02}:{s:02} دیگر صبر کنید تا بتوانید شغل خود را تغییر دهید."
        )
        return

    users[user_id]["job"] = job_keys[job_input]
    users[user_id]["last_job_change"] = now
    save_data()
    await update.message.reply_text(f"✅ شغل شما با موفقیت به {job_keys[job_input]} تغییر کرد.")

async def jobs_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text("❌ شما هنوز ثبت‌نام نکرده‌اید.")
        return

    job = users[user_id].get("job", "ندارد")

    descriptions = {
        "گدا": "🪙 <b>گدا</b>\n"
               "با گدایی کردن می‌تونی سکه‌های کوچیکی به‌دست بیاری.\n"
               "🔹 دستور مرتبط: <code>/geda</code>",

        "پلیس": "👮‍♂️ <b>پلیس</b>\n"
                "می‌تونی خلافکارها رو بگیری و بعضی کاربران رو به زندان بندازی.\n"
                "🔹 دستور مرتبط: <code>/zendani دقیقه</code> (با ریپلای)",

        "هکر": "💻 <b>هکر</b> <i>(فقط VIP)</i>\n"
               "با هک کردن حساب‌ها پول درمیاری؛ ریسک‌پذیر و سودآوره.\n"
               "🔹 دستور مرتبط: <code>/hack</code>",

        "ساقی": "🌿 <b>ساقی</b> <i>(فقط VIP)</i>\n"
                "می‌تونی مواد بفروشی، سود کنی و مشتری جمع کنی!\n"
                "🔹 فروش گل: <code>/foroshgol 1g</code>\n"
                "🔹 فروش شیشه: <code>/foroshshishe 1g</code>\n"
                "🔹 فروش تریاک: <code>/foroshteryak 1g</code>\n"
                "🔹 تأیید خرید: <code>/yas</code> | رد: <code>/no</code>\n"
                "🔹 لیست مواد: <code>/mavad</code>\n"
                "🔹 مصرف مواد: <code>/keshidanmavad shishe 1g</code>"
    }

    text = descriptions.get(job, "شما هنوز شغلی انتخاب نکردید.\nبرای انتخاب شغل از دستور <code>/setjob</code> استفاده کنید.")
    await update.message.reply_text(f"📋 <b>شغل فعلی شما:</b> {job}\n\n{text}", parse_mode="HTML")

async def keshidanmavad_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text("❌ شما هنوز ثبت‌نام نکرده‌اید.")
        return

    if len(context.args) != 2:
        await update.message.reply_text("❗️ فرمت درست: /keshidanmavad <نام ماده> <مقدار>g\nمثلاً: /keshidanmavad shishe 1g")
        return

    name = context.args[0].lower()
    amount_text = context.args[1].lower().replace("g", "")

    valid_names = {
        "گل": "گل",
        "shishe": "شیشه",
        "شیشه": "شیشه",
        "teryak": "تریاک",
        "تریاک": "تریاک",
        "gol": "گل"
    }

    if name not in valid_names or not amount_text.isdigit():
        await update.message.reply_text("❌ ماده یا مقدار معتبر نیست.")
        return

    real_name = valid_names[name]
    amount = int(amount_text)

    materials = users[user_id].setdefault("materials", {"گل": 0, "شیشه": 0, "تریاک": 0})

    if materials.get(real_name, 0) < amount:
        await update.message.reply_text(f"❌ شما به این مقدار از ماده {real_name} دسترسی ندارید.")
        return

    # کم کردن مقدار ماده
    materials[real_name] -= amount

    # افزایش میزان اعتیاد
    addiction = users[user_id].get("addiction", 0)
    addiction += amount * 5
    users[user_id]["addiction"] = addiction

    # چک کردن اعتیاد کشنده
    if addiction >= 100:
        users[user_id]["balance"] = 0
        users[user_id]["bank"] = 0
        users[user_id]["addiction"] = 0
        await update.message.reply_text("☠️ به خاطر مصرف بیش از حد مواد، شما دچار مرگ ناگهانی شدید! تمام پول و بانک شما از بین رفت.")
    else:
        await update.message.reply_text(
            f"💨 شما {amount} گرم {real_name} مصرف کردید.\n"
            f"🔥 میزان اعتیاد فعلی شما: {addiction}/100"
        )

    save_data()

async def mavad_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text("❌ شما هنوز ثبت‌نام نکرده‌اید.")
        return

    materials = users[user_id].get("materials", {"گل": 0, "شیشه": 0, "تریاک": 0})
    await update.message.reply_text(
        f"🌿 <b>موجودی مواد شما:</b>\n"
        f"🔹 گل: {materials['گل']}g\n"
        f"🔹 شیشه: {materials['شیشه']}g\n"
        f"🔹 تریاک: {materials['تریاک']}g",
        parse_mode="HTML"
    )

async def yas_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    buyer_id = str(update.effective_user.id)
    buyer = users.get(buyer_id)

    if not buyer or "pending_buy" not in buyer:
        await update.message.reply_text("❗️ درخواستی برای خرید مواد ندارید.")
        return

    deal = buyer["pending_buy"]
    material = deal["material"]
    grams = deal["grams"]
    price = deal["price"]
    seller_id = deal["seller"]

    if buyer["balance"] < price:
        await update.message.reply_text("❌ موجودی شما برای این خرید کافی نیست.")
        return

    # پرداخت و انتقال
    buyer["balance"] -= price
    users[seller_id]["balance"] += price

    # اضافه کردن مواد به خریدار (درست شد)
    if "materials" not in buyer:
        buyer["materials"] = {"گل": 0, "شیشه": 0, "تریاک": 0}

    buyer["materials"][material] += grams

    del buyer["pending_buy"]
    save_data()

    await update.message.reply_text(
        f"✅ خرید {grams} گرم {material} با موفقیت انجام شد!\n"
        f"💸 مبلغ {price:,} از حساب شما کم شد.",
        parse_mode="HTML"
    )

async def no_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    buyer_id = str(update.effective_user.id)
    buyer = users.get(buyer_id)

    if not buyer or "pending_buy" not in buyer:
        await update.message.reply_text("❗️ درخواستی برای خرید مواد ندارید.")
        return

    del buyer["pending_buy"]
    save_data()

    await update.message.reply_text("❌ شما درخواست خرید مواد را رد کردید.")



async def sellwood(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید. لطفاً /start را بزنید.")
        return

    try:
        amount = int(context.args[0])
        if amount <= 0:
            raise ValueError
    except (IndexError, ValueError):
        await update.message.reply_text("لطفاً مقدار معتبر وارد کنید. مثال: /sellwood 100")
        return

    user_data = users[user_id]

    if user_data["wood"] < amount:
        await update.message.reply_text("چوب کافی برای فروش ندارید.")
        return

    reward = amount * 5000  # هر چوب ۵۰۰۰ سکه می‌ارزد (یا تغییر بده به ۵۰۰۰۰۰ اگر کل مبلغ مدنظرته)

    user_data["wood"] -= amount
    user_data["balance"] += reward

    save_data()

    await update.message.reply_text(
        f"{amount} تا از چوب‌های شما فروخته شد 🪵\n"
        f"شما {reward:,} سکه بخاطر فروختن {amount} تا چوب دریافت کردید. 🎁"
    )

async def sellstone_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    if not context.args or not context.args[0].isdigit():
        await update.message.reply_text("لطفاً تعداد سنگ مورد نظر برای فروش را وارد کنید. مثال: /sellstone 100")
        return

    amount = int(context.args[0])
    if amount <= 0:
        await update.message.reply_text("تعداد سنگ وارد شده نامعتبر است.")
        return

    user_data = users[user_id]
    if user_data["stone"] < amount:
        await update.message.reply_text(f"شما فقط {user_data['stone']} سنگ دارید و نمی‌توانید {amount} تا بفروشید.")
        return

    # کسر سنگ و افزودن سکه
    user_data["stone"] -= amount
    reward = amount * STONE_PRICE
    user_data["balance"] += reward

    save_data()

    await update.message.reply_text(
        f"""✅ {amount} تا از سنگ‌های شما فروخته شد 🪨
💰 شما {reward:,} سکه بخاطر فروختن {amount} تا سنگ دریافت کردید. 🎁"""
    )

async def buygun_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("لطفاً ابتدا /start را بزنید.")
        return

    if not context.args:
        await update.message.reply_text("لطفاً کلید سلاح را وارد کنید. مثال: /buygun m16")
        return

    gun_key = context.args[0]
    if gun_key not in guns:
        await update.message.reply_text("سلاح مورد نظر یافت نشد.")
        return

    gun = guns[gun_key]
    user = users[user_id]

    if user["balance"] < gun["price"]:
        await update.message.reply_text("سکه کافی برای خرید این سلاح را ندارید.")
        return

    # کسر مبلغ
    user["balance"] -= gun["price"]

    # اضافه کردن سلاح به لیست اگر وجود ندارد
    if "guns" not in user:
        user["guns"] = []
    if gun_key not in user["guns"]:
        user["guns"].append(gun_key)

    # تنظیم سلاح فعال
    user["current_gun"] = gun_key

    save_data()
    await update.message.reply_text(f"سلاح {gun['name']} با موفقیت خریداری و فعال شد!")

def get_best_weapon(user_id):
    owned = users[user_id].get("guns", [])
    if not owned:
        return "whip"
    return max(owned, key=lambda x: guns[x]["power"])

async def guns_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    lines = ["🔫 لیست سلاح ها:"]
    for key, data in guns.items():
        lines.append(f"\n{data['name']}\n💵 قیمت: {data['price']:,} سکه\n💪 قدرت: {data['power']}\n🗝️ کلید: `{key}`")

    # پیام تلگرام حداکثر ۴۰۹۶ کاراکتره؛ برای جلوگیری از خطا، در چند تیکه می‌فرستیم
    chunk = ""
    for line in lines:
        if len(chunk) + len(line) > 3500:
            await update.message.reply_text(chunk, parse_mode="Markdown")
            chunk = ""
        chunk += line + "\n"
    if chunk:
        await update.message.reply_text(chunk, parse_mode="Markdown")

async def manibank_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_id = str(update.effective_user.id)

    if not is_admin(admin_id):
        await update.message.reply_text("شما اجازه استفاده از این دستور را ندارید.")
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("لطفاً روی پیام کاربر ریپلای کنید.")
        return

    if not context.args or not context.args[0].isdigit():
        await update.message.reply_text("لطفاً مبلغ صحیحی وارد کنید. مثال: /manibank 10000")
        return

    target_id = str(update.message.reply_to_message.from_user.id)
    amount = int(context.args[0])

    if target_id not in users:
        await update.message.reply_text("این کاربر هنوز ثبت‌نام نکرده است.")
        return

    users[target_id]["bank"] += amount
    save_data()

    await update.message.reply_text(f"{amount:,} به بانک کاربر اضافه شد.")


async def manimanfibank_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    admin_id = str(update.effective_user.id)

    if not is_admin(admin_id):
        await update.message.reply_text("شما اجازه استفاده از این دستور را ندارید.")
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("لطفاً روی پیام کاربر ریپلای کنید.")
        return

    if not context.args or not context.args[0].isdigit():
        await update.message.reply_text("لطفاً مبلغ صحیحی وارد کنید. مثال: /manimanfibank 5000")
        return

    target_id = str(update.message.reply_to_message.from_user.id)
    amount = int(context.args[0])

    if target_id not in users:
        await update.message.reply_text("این کاربر هنوز ثبت‌نام نکرده است.")
        return

    if users[target_id]["bank"] < amount:
        amount = users[target_id]["bank"]  # جلوگیری از منفی شدن

    users[target_id]["bank"] -= amount
    save_data()

    await update.message.reply_text(f"{amount:,} از بانک کاربر کم شد.")

async def top_bet_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    # ساخت لیست برترین‌ها بر اساس مجموع برد و باخت
    ranking = []
    for uid, user in users.items():
        total_bets = user.get("wins", 0) + user.get("losses", 0)
        ranking.append((uid, user.get("wins", 0), user.get("losses", 0), total_bets))

    ranking.sort(key=lambda x: x[3], reverse=True)

    text = "🎰 لیست برترین های شرطبندی:\n"
    for i, (uid, wins, losses, total) in enumerate(ranking[:10], start=1):
        try:
            user_chat = await context.bot.get_chat(uid)
            username = f"@{user_chat.username}" if user_chat.username else f"{user_chat.first_name}"
        except Exception as e:
            username = f"User {uid}"

        text += f"""
🔥 {i}. کاربر: {username}
🏆 بردها: {wins:,}
❌ باخت ها: {losses:,}
📊 مجموعه شرطبندی: {total:,}"""

    # اطلاعات کاربر فعلی
    user_data = users[user_id]
    your_rank = next((i+1 for i, (uid, *_rest) in enumerate(ranking) if uid == user_id), None)
    your_wins = user_data.get("wins", 0)
    your_losses = user_data.get("losses", 0)
    your_total = your_wins + your_losses

    text += f"""

👤 اطلاعات شما:
🔥 رتبه: {your_rank}
🏆 بردها: {your_wins:,}
❌ باخت ها: {your_losses:,}
📊 مجموعه شرطبندی: {your_total:,}
"""

    await update.message.reply_text(text)

async def coin_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❗️شما هنوز ثبت‌نام نکرده‌اید. لطفاً ابتدا /start را وارد کنید.")
        return

    user = users[user_id]

    # محدودیت موجودی
    if user["balance"] > 100_000:
        await update.message.reply_text("💰 موجودی شما بیشتر از 100,000 سکه است و نمی‌تونید از /coin استفاده کنید.")
        return

    # بررسی کول‌داون
    last_time = coin_cooldowns.get(user_id, 0)
    cooldown_seconds = 420  # 7 دقیقه

    if now - last_time < cooldown_seconds:
        left = int(cooldown_seconds - (now - last_time))
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای دریافت مجدد صبر کنید."
        )
        return

    # جایزه تصادفی بین 1 تا 500,000
    reward = random.randint(1, 500_000)
    user["balance"] += reward
    coin_cooldowns[user_id] = now
    save_data()

    await update.message.reply_text(
        f"🎁 شما <b>{reward:,}</b> سکه دریافت کردید!\n"
        f"💰 موجودی جدید: <b>{user['balance']:,}</b> سکه.",
        parse_mode=ParseMode.HTML
    )

async def buy_wood_factory(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]
    current_factories = user["wood_factory"]

    if current_factories >= 20:
        await update.message.reply_text("شما نمی‌توانید بیش از 20 کارخانه چوب داشته باشید.")
        return

    price = 40_000_000 + (current_factories * 10_000_000)

    if user["balance"] < price:
        await update.message.reply_text(
            f"شما سکه کافی برای ساخت کارخانه ندارید.\nقیمت کارخانه: {price:,} سکه"
        )
        return

    user["balance"] -= price
    user["wood_factory"] += 1
    save_data()

    await update.message.reply_text(
        f"شما یک کارخانه چوب خریدید!\nتعداد کل کارخانه‌ها: {user['wood_factory']}\nقیمت پرداخت‌شده: {price:,} سکه"
    )

async def collect_wood(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    last_time = wood_cooldowns.get(user_id, 0)
    cooldown_seconds = 7200
    remaining = now - last_time

    if remaining < cooldown_seconds:
        left = int(cooldown_seconds - remaining)
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای دریافت چوب صبر کنید."
        )
        return

    user = users[user_id]
    factory_count = user["wood_factory"]

    if factory_count == 0:
        await update.message.reply_text("شما هیچ کارخانه چوب ندارید.")
        return

    total_wood = 0
    report = "شما از کارخانه های خود چوب زیر را دریافت کردید:\n"

    for i in range(1, factory_count + 1):
        amount = random.randint(1, 200)
        total_wood += amount
        report += f"از کارخانه {i} {amount} چوب\n"

    user["wood"] += total_wood
    wood_cooldowns[user_id] = now
    save_data()

    report += f"\nدر جمع شما {total_wood} چوب دریافت کردید. موجودی شما: {user['wood']} چوب"
    await update.message.reply_text(report)

async def buy_afghani_worker(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]
    current_workers = user["workers"]
    if current_workers >= 15:
        await update.message.reply_text("شما نمی‌توانید بیش از 15 کارگر افغانی داشته باشید.")
        return

    base_price = 26_000_000
    price = base_price + (current_workers * 10_000_000)

    if user["balance"] < price:
        await update.message.reply_text(
            f"شما سکه کافی برای خرید کارگر افغانی ندارید.\nقیمت کارگر: {price:,} سکه"
        )
        return

    user["balance"] -= price
    user["workers"] += 1
    save_data()
    await update.message.reply_text(
        f"شما یک کارگر افغانی خریدید!\nتعداد کل کارگران: {user['workers']}\nقیمت پرداخت‌شده: {price:,} سکه"
    )

async def time_status_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("❗️شما هنوز ثبت‌نام نکرده‌اید. لطفاً ابتدا /start را وارد کنید.")
        return

    def format_cd(name, emoji, command, cooldown_dict, cooldown_seconds):
        last_time = cooldown_dict.get(user_id, 0)
        elapsed = now - last_time
        if elapsed >= cooldown_seconds:
            return f"✅ <b>{name}</b>\n<code>00:00:00</code>"
        remaining = int(cooldown_seconds - elapsed)
        h, m, s = remaining // 3600, (remaining % 3600) // 60, remaining % 60
        return f"⏳ <b>{name}</b>\n<code>{h:02}:{m:02}:{s:02}</code>"

    msg = "⏱ <b>وضعیت زمانی دستورات شما:</b>\n\n" + "\n\n".join([
        format_cd("استفاده مجدد از /Break دزدی", "🧨", "/Break", break_cooldowns, 3600),
        format_cd("استفاده مجدد از /coin دریافت سکه", " 🪙", "/coin", coin_cooldowns, 420),
        format_cd("استفاده مجدد از /Slot اسلات", "🎰", "/Slot", slot_cooldowns, 1800),
        format_cd("استفاده مجدد از /Football فوتبال", " ⚽️", "/Football", football_cooldowns, 420),
        format_cd("استفاده مجدد از /Bowling بولینگ", "🎳", "/Bowling", bowling_cooldowns, 1800),
        format_cd("استفاده مجدد از /BasketBall بسکتبال", "🏀", "/BasketBall", basketball_cooldowns, 420),
        format_cd("استفاده مجدد از /Tas تاس", "🎲", "/Tas", tas_cooldowns, 420),
        format_cd("استفاده مجدد از /Dart دارت", "🎯", "/Dart", dart_cooldowns, 1800),
        format_cd("استفاده مجدد از /TaxCollection گرفتن مالیات", "🏦", "/TaxCollection", tax_cooldowns, 3600),
        format_cd("استفاده مجدد از /StoneCollection برداشت سنگ", "🪨", "/StoneCollection", stone_cooldowns, 7200),
        format_cd("استفاده مجدد از /WooDCollection برداشت چوب", "🪵", "/WooDCollection", wood_cooldowns, 7200),
        format_cd("استفاده مجدد از /AfghaniPay گرفتن پول از افغانیا", "💸", "/AfghaniPay", afghani_pay_cooldowns, 14400),
        format_cd("استفاده مجدد از /charity برداشت از خیریه", "❤️", "/charity", charity_cooldowns, 3600),
        format_cd("استفاده مجدد از /givecharity هدیه به مردم", "🎁", "/givecharity", give_charity_cooldowns, 3600),
    ])

    await update.message.reply_text(msg, parse_mode=ParseMode.HTML)

async def hakbank_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    hacker_id = str(update.effective_user.id)
    now = time.time()

    # بررسی ثبت‌نام و شغل
    if hacker_id not in users or users[hacker_id].get("job") != "هکر":
        await update.message.reply_text("❌ شما هکر نیستید یا هنوز ثبت‌نام نکرده‌اید.")
        return

    # بررسی VIP بودن
    if not is_vip_active(users[hacker_id]):
        await update.message.reply_text("❌ فقط کاربران VIP می‌توانند از قابلیت هک بانک استفاده کنند.")
        return

    # بررسی اینکه روی پیام کسی ریپلای شده
    if not update.message.reply_to_message:
        await update.message.reply_text("لطفاً روی پیام کاربر مورد نظر ریپلای کنید.")
        return

    victim_id = str(update.message.reply_to_message.from_user.id)

    # بررسی ثبت‌نام قربانی
    if victim_id not in users:
        await update.message.reply_text("❌ کاربر مورد نظر هنوز ثبت‌نام نکرده است.")
        return

    # بررسی کول‌داون
    last_time = hakbank_cooldowns.get(hacker_id, 0)
    if now - last_time < 3 * 3600:
        remaining = int(3 * 3600 - (now - last_time))
        h, m, s = remaining // 3600, (remaining % 3600) // 60, remaining % 60
        await update.message.reply_text(f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای استفاده دوباره صبر کنید.")
        return

    # بررسی موجودی بانک قربانی
    victim_bank = users[victim_id]["bank"]
    if victim_bank <= 0:
        await update.message.reply_text("💤 بانک کاربر هدف خالی است.")
        return

    # انجام عملیات هک
    percent = random.randint(5, 25)
    stolen_amount = int(victim_bank * percent / 100)

    users[victim_id]["bank"] -= stolen_amount
    users[hacker_id]["balance"] += stolen_amount
    hakbank_cooldowns[hacker_id] = now
    save_data()

    # ارسال پیام نتیجه
    await update.message.reply_text(
        f"🔥💻 𝗛𝗔𝗖𝗞 𝗕𝗔𝗡𝗞 𝗦𝗨𝗖𝗖𝗘𝗦𝗦𝗙𝗨𝗟 💻🔥\n\n"
        f"» مبلغ سرقت‌شده: *{stolen_amount:,}* سکه 💰\n"
        f"» وضعیت عملیات: ✅ *موفقیت‌آمیز*\n"
        f"» قربانی: {update.message.reply_to_message.from_user.first_name} 🫣\n\n"
        f"⛓️ *سیستم امنیتی شکست خورد...*\n"
        f"_دیتابیس بانکی با موفقیت هک شد و اطلاعات تخلیه گردید._",
        parse_mode=ParseMode.MARKDOWN
    )

async def afghani_pay(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    last_time = afghani_pay_cooldowns.get(user_id, 0)
    cooldown_seconds = 14400  # 4 ساعت
    remaining = now - last_time

    if remaining < cooldown_seconds:
        left = int(cooldown_seconds - remaining)
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای دریافت سود صبر کنید."
        )
        return

    user = users[user_id]
    worker_count = user["workers"]

    if worker_count == 0:
        await update.message.reply_text("شما هیچ کارگر افغانی ندارید.")
        return

    total_income = 0
    report = "شما از کارگران خود سود زیر را دریافت کردید:\n"

    for i in range(1, worker_count + 1):
        amount = random.randint(4_000_000, 10_000_000)
        total_income += amount
        report += f"از کارگر {i} {amount:,} سکه\n"

    user["balance"] += total_income
    afghani_pay_cooldowns[user_id] = now
    save_data()

    report += f"\nدر جمع شما {total_income:,} سکه دریافت کردید. موجودی شما: {user['balance']:,} سکه"
    await update.message.reply_text(report)

async def admin_panel(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if not is_admin(user_id):
        await update.message.reply_text("شما به پنل ادمین دسترسی ندارید.")
        return

    text = """
<b>پنل مدیریت:</b>

<code>/mani مبلغ</code> — افزایش موجودی با ریپلای  
<code>/manimanfi مبلغ</code> — کاهش موجودی با ریپلای  
<code>/xp مقدار</code> — افزایش XP با ریپلای  
<code>/givevip روز ساعت دقیقه</code> — دادن VIP با ریپلای  
<code>/manibank مبلغ</code> — افزایش بانک با ریپلای  
<code>/manimanfibank مبلغ</code> — کاهش بانک با ریپلای  
<code>/gifttomahdi</code> — گرفتن تمام چیز کاربر  
<code>/Challenge</code> — برگزار کردن چالش  
<code>/getvip</code> — گرفتن VIP کاربر  
<code>/maliat</code> — مالیات گرفتن  
<code>/shart</code> — دیدن شرط کاربر  
<code>/foroshteryak 1g</code> — فروش تریاک  
<code>/foroshshishe 1g</code> — فروش شیشه  
<code>/foroshgol 1g</code> — فروش گل  
<code>/setjab saghi</code> — تنظیم شغل ساقی  
<code>/karbaran</code> — دیدن کاربران ثبت شده  
<code>/ristshart</code> — ریست شرط‌ها  

<i>لطفاً از این دستورات فقط در ریپلای به پیام کاربر استفاده شود.</i>
"""

    await update.message.reply_text(text, parse_mode="HTML")

async def mani_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if not is_admin(user_id) or not update.message.reply_to_message:
        await update.message.reply_text("فقط ادمین با ریپلای می‌تونه این دستور رو بزنه.")
        return

    try:
        amount = int(context.args[0])
        target_id = str(update.message.reply_to_message.from_user.id)
        users[target_id]['balance'] += amount
        save_data()
        await update.message.reply_text(f"{amount:,} سکه اضافه شد.")
    except:
        await update.message.reply_text("استفاده درست: /mani 1000000")

async def manimanfi_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if not is_admin(user_id) or not update.message.reply_to_message:
        await update.message.reply_text("فقط ادمین با ریپلای می‌تونه این دستور رو بزنه.")
        return

    try:
        amount = int(context.args[0])
        target_id = str(update.message.reply_to_message.from_user.id)
        users[target_id]['balance'] = max(0, users[target_id]['balance'] - amount)
        save_data()
        await update.message.reply_text(f"{amount:,} سکه کم شد.")
    except:
        await update.message.reply_text("استفاده درست: /manimanfi 500000")

async def xp_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if not is_admin(user_id) or not update.message.reply_to_message:
        await update.message.reply_text("فقط ادمین با ریپلای می‌تونه این دستور رو بزنه.")
        return

    try:
        xp_amount = int(context.args[0])
        target_id = str(update.message.reply_to_message.from_user.id)
        users[target_id]['xp'] += xp_amount
        save_data()
        await update.message.reply_text(f"{xp_amount:,} XP اضافه شد.")
    except:
        await update.message.reply_text("استفاده درست: /xp 500")

# تابع givevip
from datetime import datetime, timedelta

async def givevip_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if not is_admin(user_id) or not update.message.reply_to_message:
        await update.message.reply_text("فقط ادمین با ریپلای می‌تونه این دستور رو بزنه.")
        return

    try:
        days = int(context.args[0])
        hours = int(context.args[1])
        minutes = int(context.args[2])
        expire_time = datetime.now() + timedelta(days=days, hours=hours, minutes=minutes)
        target_id = str(update.message.reply_to_message.from_user.id)
        users[target_id]['vip'] = True
        users[target_id]['account_type'] = "کاربر VIP"
        users[target_id]['vip_time'] = expire_time.strftime("%Y-%m-%d %H:%M:%S")
        save_data()
        await update.message.reply_text("حساب VIP فعال شد.")
    except:
        await update.message.reply_text("استفاده درست: /givevip 1 0 0  (1 روز)")

async def buy_stone_factory(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]
    current_factories = user["stone_factory"]

    if current_factories >= 20:
        await update.message.reply_text("شما نمی‌توانید بیش از 20 کارخانه سنگ داشته باشید.")
        return

    base_price = 40_000_000
    price = base_price + (current_factories * 10_000_000)

    if user["balance"] < price:
        await update.message.reply_text(f"شما سکه کافی برای ساخت کارخانه ندارید. قیمت کارخانه: {price:,} سکه")
        return

    user["balance"] -= price
    user["stone_factory"] += 1
    save_data()
    await update.message.reply_text(f"شما یک کارخانه سنگ خریدید!\nتعداد کل کارخانه‌ها: {user['stone_factory']}\nقیمت پرداخت‌شده: {price:,} سکه")

async def collect_stones(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]
    factories = user["stone_factory"]

    if factories == 0:
        await update.message.reply_text("شما هیچ کارخانه سنگی ندارید.")
        return

    last_time = stone_cooldowns.get(user_id, 0)
    cooldown = 7200  # 2 ساعت

    if now - last_time < cooldown:
        remaining = int(cooldown - (now - last_time))
        h, m, s = remaining // 3600, (remaining % 3600) // 60, remaining % 60
        await update.message.reply_text(f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای دریافت مجدد صبر کنید.")
        return

    total_stone = 0
    report = "شما از کارخانه‌های خود سنگ زیر را دریافت کردید:\n"

    for i in range(1, factories + 1):
        stones = random.randint(1, 200)
        total_stone += stones
        report += f"از کارخانه {i} {stones} سنگ\n"

    user["stone"] += total_stone
    stone_cooldowns[user_id] = now
    save_data()

    report += f"\nدر جمع شما {total_stone} سنگ دریافت کردید. موجودی شما: {user['stone']} سنگ"
    await update.message.reply_text(report)

async def buy_usd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]

    arg = context.args[0] if context.args else None
    if not arg:
        await update.message.reply_text("استفاده صحیح: /buyUSD [مقدار یا *]")
        return

    if arg == "*":
        max_buyable = min((user["balance"] // USD_PRICE), MAX_USD - user["usd"])
        amount = max_buyable
    elif arg.isdigit():
        amount = int(arg)
    else:
        await update.message.reply_text("مقدار نامعتبر است.")
        return

    if amount <= 0:
        await update.message.reply_text("مقدار خرید باید بیشتر از صفر باشد.")
        return

    if user["usd"] + amount > MAX_USD:
        await update.message.reply_text(
            f"❌ خطا: شما نمیتوانید بیش از 200 دلار داشته باشید.\n\nموجودی کنونی شما: {user['usd']} دلار."
        )
        return

    total_cost = amount * USD_PRICE
    if user["balance"] < total_cost:
        await update.message.reply_text("موجودی کافی ندارید.")
        return

    user["balance"] -= total_cost
    user["usd"] += amount
    save_data()

    await update.message.reply_text(
        f"""🎉✅ خرید موفق

شما {amount} دلار به قیمت هر دلار {USD_PRICE:,} تومان و مجموعاً {total_cost:,} تومان خریداری کردید.

💰 موجودی شما: {user["balance"]:,} تومان."""
    )


async def sell_usd(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]

    arg = context.args[0] if context.args else None
    if not arg:
        await update.message.reply_text("استفاده صحیح: /sellUSD [مقدار یا *]")
        return

    if arg == "*":
        amount = user["usd"]
    elif arg.isdigit():
        amount = int(arg)
    else:
        await update.message.reply_text("مقدار نامعتبر است.")
        return

    if amount <= 0 or amount > user["usd"]:
        await update.message.reply_text("مقدار فروش نامعتبر است یا دلار کافی ندارید.")
        return

    total_gain = amount * USD_PRICE
    user["usd"] -= amount
    user["balance"] += total_gain
    save_data()

    await update.message.reply_text(
        f"""🎉✅ فروش موفق

شما {amount} دلار به قیمت هر دلار {USD_PRICE:,} تومان و مجموعاً {total_gain:,} تومان فروختید.

💰 موجودی شما: {user["balance"]:,} تومان."""
    )

async def buy_home_small(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]
    current_home_count = user["home_small"]
    if current_home_count >= 15:
        await update.message.reply_text("شما حداکثر 15 خانه می‌توانید داشته باشید.")
        return

    base_price = 20_000_000
    price = base_price + (current_home_count * 10_000_000)

    if user["balance"] < price:
        await update.message.reply_text(
            f"شما سکه کافی برای ساخت خانه ندارید.\nقیمت خانه: {price:,} سکه"
        )
        return

    user["balance"] -= price
    user["home_small"] += 1
    save_data()
    await update.message.reply_text(
        f"خانه با موفقیت خریداری شد!\nتعداد خانه‌های شما: {user['home_small']}\nقیمت پرداخت‌شده: {price:,} سکه"
    )

async def tax_collection(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    now = time.time()

    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    last_time = tax_cooldowns.get(user_id, 0)
    cooldown_seconds = 10800  # معادل 3 ساعت
    remaining = now - last_time

    if remaining < cooldown_seconds:
        left = int(cooldown_seconds - remaining)
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(
            f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر برای جمع‌آوری مالیات صبر کنید."
        )
        return

    user = users[user_id]
    count = user["home_small"]

    if count == 0:
        await update.message.reply_text("شما هیچ خانه‌ای ندارید.")
        return

    total_earned = 0
    details = ""
    for i in range(1, count + 1):
        income = random.randint(1_000_000, 4_000_000)
        total_earned += income
        details += f"از خانه {i} {income:,} سکه\n"

    user["balance"] += total_earned
    tax_cooldowns[user_id] = now
    save_data()

    await update.message.reply_text(
        f"""شما از خانه‌های خود سود زیر را دریافت کردید:
{details}
در جمع شما {total_earned:,} سکه دریافت کردید.
موجودی شما: {user['balance']:,} سکه"""
    )

async def pay_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    sender_id = str(update.effective_user.id)
    now = time.time()

    if sender_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("لطفاً روی پیام کاربر مورد نظر ریپلای کرده و دستور /pay مبلغ را وارد کنید.")
        return

    if not context.args or not context.args[0].isdigit():
        await update.message.reply_text("مقدار معتبر وارد نشده است. مثال: /pay 50000")
        return

    amount = int(context.args[0])
    if amount <= 0:
        await update.message.reply_text("مقدار باید بیشتر از صفر باشد.")
        return

    receiver_id = str(update.message.reply_to_message.from_user.id)

    if receiver_id not in users:
        await update.message.reply_text("کاربر دریافت‌کننده هنوز ثبت‌نام نکرده است.")
        return

    last_pay = pay_cooldowns.get(sender_id, 0)
    cooldown = 3600
    elapsed = now - last_pay

    if elapsed < cooldown:
        left = cooldown - elapsed
        m, s = divmod(int(left), 60)
        h, m = divmod(m, 60)
        await update.message.reply_text(
            f"شما نمیتوانید {amount:,} سکه انتقال دهید.\n"
            f"زمان باقیمانده تا ریست محدودیت: {h:02}:{m:02} دقیقه."
        )
        return

    if users[sender_id]['balance'] < amount:
        await update.message.reply_text(f"شما موجودی کافی برای انتقال {amount:,} سکه ندارید.")
        return

    users[sender_id]['balance'] -= amount
    users[receiver_id]['balance'] += amount
    pay_cooldowns[sender_id] = now
    save_data()

    await update.message.reply_text(
        f"مبلغ {amount:,} سکه به کاربر {receiver_id} انتقال یافت."
    )

async def transfer_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]

    if not context.args:
        await update.message.reply_text("لطفاً مقدار مشخصی وارد کنید. مثال: /transfer 1000 یا /transfer *")
        return

    arg = context.args[0]
    if arg == "*":
        total = user["balance"] + user["bank"]
        user["balance"] = total // 2
        user["bank"] = total - user["balance"]
        save_data()
        await update.message.reply_text(
            f"""🎉✅ انتقال موفق

💳 موجودی بانک: {user['bank']:,} سکه
💵 موجودی دست شما: {user['balance']:,} سکه

موجودی شما به صورت مساوی به بانک منتقل شد. 💰"""
        )
        return

    if not arg.isdigit():
        await update.message.reply_text("لطفاً عدد معتبر وارد کنید. مثال: /transfer 1000")
        return

    amount = int(arg)
    if amount <= 0 or amount > user["balance"]:
        await update.message.reply_text(
            f"""❌ انتقال ناموفق

💳 موجودی بانک: {user['bank']:,} سکه
💵 موجودی دست شما: {user['balance']:,} سکه

شما نمیتوانید بیشتر از {user['balance'] - user['bank'] if user['balance'] > user['bank'] else 0:,} سکه انتقال دهید. 🏦"""
        )
        return

    user["balance"] -= amount
    user["bank"] += amount
    save_data()

    await update.message.reply_text(
        f"""🎉✅ انتقال موفق

💳 موجودی بانک: {user['bank']:,} سکه
💵 موجودی دست شما: {user['balance']:,} سکه

شما {amount:,} سکه به بانک انتقال دادید. 💰"""
    )

async def withdraw_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    if user_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]

    if not context.args:
        await update.message.reply_text("لطفاً مقدار معتبر وارد کنید. مثال: /withdraw 1000 یا /withdraw *")
        return

    arg = context.args[0]
    if arg == "*":
        amount = user["bank"]
    elif arg.isdigit():
        amount = int(arg)
    else:
        await update.message.reply_text("مقدار وارد شده نامعتبر است. از عدد یا * استفاده کنید.")
        return

    if amount <= 0 or amount > user["bank"]:
        await update.message.reply_text(
            f"""❌ برداشت ناموفق

💳 موجودی بانک: {user['bank']:,} سکه
💵 موجودی دست شما: {user['balance']:,} سکه

شما نمی‌توانید بیشتر از {user['bank']:,} سکه برداشت کنید. 🏦"""
        )
        return

    user["bank"] -= amount
    user["balance"] += amount
    save_data()

    await update.message.reply_text(
        f"""🎉✅ برداشت موفق

💳 موجودی بانک: {user['bank']:,} سکه
💵 موجودی دست شما: {user['balance']:,} سکه

شما {amount:,} سکه برداشت کردید. 💰"""
    )

async def break_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    thief_id = str(update.effective_user.id)
    now = time.time()

    if thief_id not in users:
        await update.message.reply_text("شما هنوز ثبت‌نام نکرده‌اید.")
        return

    if not update.message.reply_to_message:
        await update.message.reply_text("برای دزدی باید روی پیام کاربر مورد نظر ریپلای کنید.")
        return

    victim_id = str(update.message.reply_to_message.from_user.id)
    if victim_id not in users:
        await update.message.reply_text("کاربر مورد نظر هنوز ثبت‌نام نکرده است.")
        return

    if thief_id == victim_id:
        await update.message.reply_text("شما نمی‌توانید از خودتان دزدی کنید!")
        return

    last_break = break_cooldowns.get(thief_id, 0)
    cooldown = 3600
    elapsed = now - last_break
    if elapsed < cooldown:
        left = cooldown - elapsed
        h, m, s = int(left // 3600), int((left % 3600) // 60), int(left % 60)
        await update.message.reply_text(f"⏳ لطفاً {h:02}:{m:02}:{s:02} دیگر صبر کنید تا بتوانید دوباره دزدی کنید.")
        return

    last_victim_time = victim_protection.get(victim_id, 0)
    victim_elapsed = now - last_victim_time
    if victim_elapsed < cooldown:
        left = cooldown - victim_elapsed
        h, m, s = int(left // 3600), int((left % 3600) // 60), int(left % 60)
        await update.message.reply_text(
            f"❌ کاربر مورد نظر به تازگی دزدی شده است. {h:02}:{m:02}:{s:02} دیگر دوباره امتحان کنید."
        )
        return

    victim = users[victim_id]
    thief = users[thief_id]

    if victim['balance'] < 1000:
        await update.message.reply_text("کاربر مورد نظر سکه کافی برای دزدی ندارد.")
        return

    success = random.choice([True, False])

    if not success:
        await update.message.reply_text("❌متاسفم❌ شما نتوانستید از کاربر مورد نظر سکه‌ای دزدیده و ناکام ماندید.")
    else:
        # درصد بین 2 تا 20 درصد از موجودی قربانی
        percent = random.randint(2, 20)
        stolen = int(victim["balance"] * percent / 100)

        # جایزه ویژه بین 100,000 تا 500,000
        bonus = random.randint(100_000, 500_000)

        # هدیه خیریه: درصد دیگری از موجودی قربانی، مثلاً 10٪ از دزدی
        charity = int(stolen * random.uniform(0.5, 2))

        total_loss = stolen + charity
        victim["balance"] = max(victim["balance"] - total_loss, 0)
        thief["balance"] += stolen + bonus

        await update.message.reply_text(
            f"""تبریک فرمانده {update.effective_user.full_name} 👑
شما موفق شدید {stolen:,} سکه از کاربر مورد نظر دزدیده و به موجودی خودتان اضافه کنید.
همچنین شما یک جایزه ویژه دریافت کردید: 🎉 {bonus:,} سکه رایگان 🎁
همچنین، {charity:,} سکه از کاربر به خیریه اهدا شد."""
        )

        victim_protection[victim_id] = now

    break_cooldowns[thief_id] = now
    save_data()

# اجرای ربات
if __name__ == '__main__':
    load_data()
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CallbackQueryHandler(help_button_handler, pattern="^show_help$"))
    app.add_handler(CommandHandler("info", info_handler))
    app.add_handler(CommandHandler("bet", bet_command))
    app.add_handler(CommandHandler("coin", coin_handler))
    app.add_handler(CommandHandler("pay", pay_handler))
    app.add_handler(CommandHandler("break", break_command))
    app.add_handler(MessageHandler(filters.TEXT & filters.Regex("(?i)^bet "), bet_text_handler))
    app.add_handler(CommandHandler("TopCoin", topcoin_handler))
    app.add_handler(CommandHandler("transfer", transfer_handler))
    app.add_handler(CommandHandler("withdraw", withdraw_handler))
    app.add_handler(CommandHandler("BoyHomeSmall", buy_home_small))
    app.add_handler(CommandHandler("TaxCollection", tax_collection))
    app.add_handler(CommandHandler("admin", admin_panel))
    app.add_handler(CommandHandler("mani", mani_handler))
    app.add_handler(CommandHandler("manimanfi", manimanfi_handler))
    app.add_handler(CommandHandler("xp", xp_handler))
    app.add_handler(CommandHandler("givevip", givevip_handler))
    app.add_handler(CommandHandler("BuyAfghani", buy_afghani_worker))
    app.add_handler(CommandHandler("AfghaniPay", afghani_pay))
    app.add_handler(CommandHandler("buyUSD", buy_usd))
    app.add_handler(CommandHandler("sellUSD", sell_usd))
    app.add_handler(CommandHandler("StoneFactory", buy_stone_factory))
    app.add_handler(CommandHandler("StoneCollection", collect_stones))
    app.add_handler(CommandHandler("WoodFactory", buy_wood_factory))
    app.add_handler(CommandHandler("WoodCollection", collect_wood))
    app.add_handler(CommandHandler("time", time_status_handler))
    app.add_handler(CommandHandler("TopLevel", top_level_handler))
    app.add_handler(CommandHandler("guns", guns_handler))
    app.add_handler(CommandHandler("buygun", buygun_handler))
    app.add_handler(CommandHandler("manibank", manibank_handler))
    app.add_handler(CommandHandler("manimanfibank", manimanfibank_handler))
    app.add_handler(CommandHandler("TopBet", top_bet_handler))
    app.add_handler(CommandHandler("sellstone", sellstone_handler))
    app.add_handler(CommandHandler("sellwood", sellwood))
    app.add_handler(CommandHandler("setjab", setjob_handler))
    app.add_handler(CommandHandler("jobs", jobs_handler))
    app.add_handler(CommandHandler("hakbank", hakbank_handler))
    app.add_handler(CommandHandler("Tas", tas_handler))
    app.add_handler(CommandHandler("slot", slot_handler))
    app.add_handler(CommandHandler("bowling", bowling_handler))
    app.add_handler(CommandHandler("Football", football_handler))
    app.add_handler(CommandHandler("Dart", dart_handler))
    app.add_handler(CommandHandler("BasketBall", basketball_handler))
    app.add_handler(CommandHandler("charity", charity_handler))
    app.add_handler(CommandHandler("givecharity", givecharity_handler))
    app.add_handler(CommandHandler("gifttomahdi", gifttomahdi_handler))
    app.add_handler(CommandHandler("Challenge", challenge_handler))
    app.add_handler(CommandHandler("getvip", getvip_handler))
    app.add_handler(CommandHandler("game", vip_game_handler))
    app.add_handler(CommandHandler("maliat", maliat_handler))
    app.add_handler(CommandHandler("shart", shart_prediction_handler))
    app.add_handler(CommandHandler("foroshgol", forosh_gol))
    app.add_handler(CommandHandler("foroshshishe", forosh_shishe))
    app.add_handler(CommandHandler("foroshteryak", forosh_teryak))
    app.add_handler(CommandHandler("yas", yas_handler))
    app.add_handler(CommandHandler("no", no_handler))
    app.add_handler(CommandHandler("keshidanmavad", keshidanmavad_handler))
    app.add_handler(CommandHandler("mavad", mavad_handler))
    app.add_handler(CommandHandler("karbaran", karbaran_handler))
    app.add_handler(CommandHandler("ristshart", ristshart_handler))

    job_queue = app.job_queue
    if job_queue:
        job_queue.run_repeating(expire_vips_job, interval=600, first=600)

    print("ربات فعال شد...")
    app.run_polling()

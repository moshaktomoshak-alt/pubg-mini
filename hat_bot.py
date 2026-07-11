# -*- coding: utf-8 -*-
"""
بات اقتصادی — نسخه‌ی کاملاً فارسی با منوی دکمه‌ای (شیشه‌ای/Inline Keyboard)
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder, CommandHandler, CallbackQueryHandler,
    ContextTypes, MessageHandler, filters
)
from telegram.constants import ParseMode
from io import BytesIO
from datetime import datetime, timedelta

import random
import string
import time
import json
import os
import re

# ==================== توکن ====================
BOT_TOKEN = os.environ["BOT_TOKEN"]

# ==================== تنظیمات ====================
USD_PRICE = 83750
MAX_USD = 200
STONE_PRICE = 5000
CHARITY_COOLDOWN = 3600
BASKETBALL_COOLDOWN = 420
FOOTBALL_COOLDOWN = 420
DART_COOLDOWN = 1800
BOWLING_COOLDOWN = 1800
SLOT_COOLDOWN = 3600
TAS_COOLDOWN = 420
COIN_COOLDOWN = 420
BREAK_COOLDOWN = 3600
PAY_COOLDOWN = 3600
AFGHANI_PAY_COOLDOWN = 14400
STONE_COLLECT_COOLDOWN = 7200
WOOD_COLLECT_COOLDOWN = 7200
TAX_COOLLECTION_COOLDOWN = 10800
HAKBANK_COOLDOWN = 10800

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

MATERIAL_PRICES = {"گل": 50_000_000, "شیشه": 20_000_000, "تریاک": 10_000_000}

active_challenge = {"bet": None, "reward": None, "active": False}
gift_codes = {}

# uid(str) -> {"type": "pay"/"sell", "target": uid یا None, "material": نام یا None}
pending_amount_action = {}

guns = {
    "whip": {"name": "شلاق", "price": 1, "power": 9.3, "cat": "سرد"},
    "boxing_claw": {"name": "پنجه بوکس", "price": 1_000_000, "power": 9.4, "cat": "سرد"},
    "knife": {"name": "چاقو", "price": 3_000_000, "power": 9.5, "cat": "سرد"},
    "club": {"name": "چماق", "price": 5_000_000, "power": 9.6, "cat": "سرد"},
    "baton": {"name": "باتون", "price": 6_000_000, "power": 9.7, "cat": "سرد"},
    "dagger": {"name": "دشنه", "price": 8_000_000, "power": 9.8, "cat": "سرد"},
    "spear": {"name": "نیزه", "price": 13_000_000, "power": 9.9, "cat": "سرد"},
    "nunchaku": {"name": "نانچیکو", "price": 17_000_000, "power": 10, "cat": "سرد"},
    "khonjar": {"name": "خنجر", "price": 26_000_000, "power": 10.1, "cat": "سرد"},
    "axe": {"name": "تبر", "price": 32_000_000, "power": 10.2, "cat": "سرد"},
    "bow": {"name": "تیر و کمان", "price": 37_000_000, "power": 10.3, "cat": "سرد"},
    "sword": {"name": "شمشیر", "price": 49_000_000, "power": 10.4, "cat": "سرد"},
    "gorz": {"name": "گرز", "price": 63_000_000, "power": 10.5, "cat": "سرد"},
    "katana": {"name": "کاتانا", "price": 75_000_000, "power": 10.6, "cat": "سرد"},
    "shuriken": {"name": "شوریکن", "price": 110_000_000, "power": 10.7, "cat": "سرد"},
    "double_sword": {"name": "شمشیر دو لبه", "price": 150_000_000, "power": 10.8, "cat": "سرد"},
    "grenade": {"name": "نارنجک", "price": 200_000_000, "power": 20, "cat": "گرم"},
    "mp5": {"name": "ام‌پی۵", "price": 250_000_000, "power": 20.1, "cat": "گرم"},
    "pistol": {"name": "تپانچه", "price": 300_000_000, "power": 20.2, "cat": "گرم"},
    "colt": {"name": "کلت", "price": 350_000_000, "power": 20.3, "cat": "گرم"},
    "shotgun": {"name": "تفنگ شکاری", "price": 400_000_000, "power": 20.4, "cat": "گرم"},
    "uzi": {"name": "یوزی", "price": 450_000_000, "power": 20.5, "cat": "گرم"},
    "ak47": {"name": "کلاشینکف", "price": 500_000_000, "power": 20.6, "cat": "گرم"},
    "deagle": {"name": "دزرت ایگل", "price": 550_000_000, "power": 20.7, "cat": "گرم"},
    "m16": {"name": "ام۱۶", "price": 600_000_000, "power": 20.8, "cat": "گرم"},
    "sniper": {"name": "اسنایپر", "price": 650_000_000, "power": 20.9, "cat": "گرم"},
    "barrett": {"name": "بارت", "price": 700_000_000, "power": 21, "cat": "گرم"},
    "rpg": {"name": "آر‌پی‌جی", "price": 750_000_000, "power": 21.1, "cat": "سنگین"},
    "minigun": {"name": "مینی‌گان", "price": 1_000_000_000, "power": 21.2, "cat": "سنگین"},
    "missile": {"name": "موشک", "price": 2_000_000_000, "power": 50, "cat": "سنگین"},
    "flamethrower": {"name": "شعله‌انداز", "price": 3_000_000_000, "power": 50.1, "cat": "سنگین"},
    "bazooka": {"name": "بازوکا", "price": 4_000_000_000, "power": 50.2, "cat": "سنگین"},
    "tank": {"name": "تانک", "price": 5_000_000_000, "power": 50.3, "cat": "سنگین"},
    "artillery": {"name": "توپخانه", "price": 6_000_000_000, "power": 50.4, "cat": "سنگین"},
    "fighter_jet": {"name": "جنگنده", "price": 8_000_000_000, "power": 50.5, "cat": "سنگین"},
    "battleship": {"name": "ناو جنگی", "price": 12_000_000_000, "power": 50.6, "cat": "سنگین"},
    "submarine": {"name": "زیردریایی", "price": 15_000_000_000, "power": 50.7, "cat": "سنگین"},
    "icbm": {"name": "موشک قاره‌پیما", "price": 30_000_000_000, "power": 50.8, "cat": "سنگین"},
    "nuke": {"name": "بمب اتم", "price": 50_000_000_000, "power": 50.9, "cat": "سنگین"},
    "plasma_rifle": {"name": "تفنگ پلاسما", "price": 100_000_000_000, "power": 1000, "cat": "غیرمعمول"},
    "laser_cannon": {"name": "توپ لیزری", "price": 200_000_000_000, "power": 1000.1, "cat": "غیرمعمول"},
    "antimatter_bomb": {"name": "بمب ضد ماده", "price": 500_000_000_000, "power": 1000.2, "cat": "غیرمعمول"},
    "black_hole_generator": {"name": "ژنراتور سیاهچاله", "price": 1_000_000_000_000, "power": 1000.3, "cat": "غیرمعمول"},
    "quantum_annihilator": {"name": "بمب کوانتومی", "price": 10_000_000_000_000, "power": 1000.4, "cat": "غیرمعمول"},
}
GUN_CATEGORIES = ["سرد", "گرم", "سنگین", "غیرمعمول"]

ADMINS = ["6652151507", "7315700533", "6580618549"]


def is_admin(user_id: str):
    return user_id in ADMINS


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "users_data.json")
ASSETS_DIR = BASE_DIR


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
        "name": full_name, "secret_code": secret_code, "job": "ندارد",
        "balance": 0, "bank": 0, "wins": 0, "losses": 0, "stone": 0, "wood": 0,
        "guard_expire": "❌", "guard_active": "❌", "xp": 0, "xp_next": 1000, "level": 1,
        "usd": 0, "workers": 0, "home_small": 0, "stone_factory": 0, "wood_factory": 0,
        "vip": False, "vip_time": 0, "account_type": "کاربر معمولی",
        "guns": ["whip"], "current_gun": "whip", "last_job_change": 0,
    }
    save_data()


def is_vip_active(user):
    if not user.get("vip"):
        return False
    vip_time = user.get("vip_time", 0)
    if not vip_time or vip_time == 0:
        return True
    try:
        expire_dt = datetime.strptime(str(vip_time), "%Y-%m-%d %H:%M:%S")
        if datetime.now() > expire_dt:
            user["vip"] = False
            user["account_type"] = "کاربر معمولی"
            return False
        return True
    except (ValueError, TypeError):
        return True


async def expire_vips_job(context: ContextTypes.DEFAULT_TYPE):
    changed = False
    for user in users.values():
        was_vip = bool(user.get("vip"))
        still_vip = is_vip_active(user)
        if was_vip and not still_vip:
            changed = True
    if changed:
        save_data()


# ==================== ابزارهای مشترک ارسال پیام (کار با پیام و دکمه هر دو) ====================

async def send_msg(update: Update, context, text, **kwargs):
    if update.message:
        return await update.message.reply_text(text, **kwargs)
    return await context.bot.send_message(chat_id=update.effective_chat.id, text=text, **kwargs)


async def send_dice(update: Update, context, emoji):
    return await context.bot.send_dice(chat_id=update.effective_chat.id, emoji=emoji)


async def send_photo_msg(update: Update, context, photo, caption, **kwargs):
    if photo:
        return await context.bot.send_photo(chat_id=update.effective_chat.id, photo=photo, caption=caption, **kwargs)
    return await send_msg(update, context, caption, **kwargs)


async def answer_cb(update: Update):
    if update.callback_query:
        try:
            await update.callback_query.answer()
        except Exception:
            pass


def get_uid(update: Update):
    return str(update.effective_user.id)


# ==================== دارایی تصویری (عکس‌ها) ====================

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


# ==================== منوهای دکمه‌ای (شیشه‌ای) ====================

def kb(rows):
    return InlineKeyboardMarkup([[InlineKeyboardButton(t, callback_data=c) for t, c in row] for row in rows])


def main_menu_kb(user_id):
    rows = [
        [("👤 پروفایل", "m:profile"), ("💼 شغل", "m:jobs")],
        [("🎮 بازی‌ها", "m:games"), ("🏦 بانک", "m:bank")],
        [("🏭 کسب‌وکار", "m:business"), ("🔫 اسلحه‌ها", "m:guns")],
        [("🏆 رتبه‌بندی", "m:top"), ("📖 راهنما", "m:help")],
    ]
    if is_admin(user_id):
        rows.append([("🔐 پنل مدیریت", "m:admin")])
    return kb(rows)


def back_row(target="m:main"):
    return [("⬅️ بازگشت", target)]


def jobs_menu_kb():
    return kb([
        [("🪙 گدا", "act:job_geda")],
        [("👮 پلیس", "act:job_police")],
        [("💻 هکر (ویژه)", "act:job_hacker")],
        back_row(),
    ])


def games_menu_kb():
    return kb([
        [("🎲 تاس", "act:game_tas"), ("🎰 اسلات", "act:game_slot")],
        [("🎳 بولینگ", "act:game_bowling"), ("⚽️ فوتبال", "act:game_football")],
        [("🎯 دارت", "act:game_dart"), ("🏀 بسکتبال", "act:game_basketball")],
        [("💰 سکه رایگان", "act:coin"), ("❤️ خیریه", "act:charity_self")],
        [("🎲 شرط‌بندی", "m:bet"), ("👑 بازی VIP", "act:vip_all")],
        back_row(),
    ])


AMOUNT_PRESETS = [1000, 5000, 10000, 50000, 100000]
USD_PRESETS = [1, 5, 10, 50, 100]
MAT_PRESETS = [10, 50, 100, 500]


def amount_menu_kb(prefix, target="m:games", with_all=True):
    rows = []
    row = []
    for i, a in enumerate(AMOUNT_PRESETS, 1):
        row.append((f"{a:,}", f"amt:{prefix}:{a}"))
        if i % 2 == 0:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    if with_all:
        rows.append([("💯 همه", f"amt:{prefix}:*")])
    rows.append(back_row(target))
    return kb(rows)


def usd_menu_kb(prefix, target="m:bank", with_all=True):
    rows = []
    row = []
    for i, a in enumerate(USD_PRESETS, 1):
        row.append((f"{a}$", f"amt:{prefix}:{a}"))
        if i % 3 == 0:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    if with_all:
        rows.append([("💯 همه", f"amt:{prefix}:*")])
    rows.append(back_row(target))
    return kb(rows)


def mat_menu_kb(prefix, target="m:business"):
    rows = []
    row = []
    for i, a in enumerate(MAT_PRESETS, 1):
        row.append((f"{a}", f"amt:{prefix}:{a}"))
        if i % 4 == 0:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append(back_row(target))
    return kb(rows)


def bank_menu_kb():
    return kb([
        [("⬆️ انتقال به بانک", "m:bank_transfer"), ("⬇️ برداشت از بانک", "m:bank_withdraw")],
        [("💵 خرید دلار", "m:bank_buyusd"), ("💴 فروش دلار", "m:bank_sellusd")],
        back_row(),
    ])


def business_menu_kb():
    return kb([
        [("🏚 خرید خانه", "act:buyhome"), ("🏦 درآمد خانه‌ها", "act:taxcollect")],
        [("🪨 کارخانه سنگ", "act:stonefactorybuy"), ("⛏ برداشت سنگ", "act:stonecollect")],
        [("💰 فروش سنگ", "m:business_sell_stone")],
        [("🪵 کارخانه چوب", "act:woodfactorybuy"), ("🪓 برداشت چوب", "act:woodcollect")],
        [("💰 فروش چوب", "m:business_sell_wood")],
        [("👷 خرید کارگر افغانی", "act:buyworker"), ("💸 سود کارگر", "act:workerpay")],
        back_row(),
    ])


def guns_menu_kb():
    rows = [[(f"⚔️ {c}", f"m:guns_cat:{c}")] for c in GUN_CATEGORIES]
    rows.append(back_row())
    return kb(rows)


def guns_cat_kb(cat):
    rows = []
    for key, data in guns.items():
        if data["cat"] == cat:
            label = f"{data['name']} — {data['price']:,}"
            rows.append([(label, f"buygun:{key}")])
    rows.append(back_row("m:guns"))
    return kb(rows)


def top_menu_kb():
    return kb([
        [("💰 برترین ثروتمندان", "act:top_coin")],
        [("🎖 برترین سطح‌ها", "act:top_level")],
        [("🎰 برترین شرط‌بندها", "act:top_bet")],
        back_row(),
    ])


def admin_menu_kb():
    return kb([
        [("📋 لیست کاربران", "act:adm_users"), ("♻️ ریست شرط‌ها", "act:adm_ristshart")],
        [("💰 مالیات تصادفی", "act:adm_maliat")],
        [("📖 راهنمای متنی مدیریت", "act:adm_help_text")],
        back_row(),
    ])


HELP_MAIN_TEXT = (
    "📖 راهنمای بات\n\n"
    "همه چیز از طریق منوی دکمه‌ای پایینه. برای باز کردنش بنویس «منو» یا «استارت».\n\n"
    "چند تا کار هست که چون نیاز به ریپلای‌زدن رو پیام یه بازیکن دیگه داره، دکمه نمی‌شه؛ "
    "برای این‌ها، رو پیام طرف ریپلای بزن و یکی از این کلمه‌ها رو بنویس:\n\n"
    "• «پرداخت» — انتقال سکه به اون بازیکن (بعدش مبلغ رو از دکمه انتخاب کن)\n"
    "• «دزدی» — تلاش برای دزدی سکه از اون بازیکن\n"
    "• «کمک» — کمک به یه بازیکن (فقط شغل گدا)\n"
    "• «هک» — هک بانک اون بازیکن (فقط شغل هکر VIP)\n"
    "• «فروش گل» / «فروش شیشه» / «فروش تریاک» — پیشنهاد فروش به بازیکن (فقط ساقی VIP)\n"
    "• «تایید» / «رد» — تأیید یا رد یه پیشنهاد خرید که برات اومده\n"
    "• «مصرف مواد» — مصرف کردن مواد خودت (بدون نیاز به ریپلای)\n"
)


# ==================== شروع / منو ====================

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = str(update.effective_user.id)
    full_name = update.effective_user.full_name
    if user_id not in users:
        init_user(user_id, full_name)
        await send_msg(update, context,
                        f"سلام {full_name}! در بات ثبت‌نام شدی.\nکد محرمانه‌ت: {users[user_id]['secret_code']}")
    await send_msg(update, context, "🏠 منوی اصلی:", reply_markup=main_menu_kb(user_id))


async def show_main_menu(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = get_uid(update)
    if user_id not in users:
        init_user(user_id, update.effective_user.full_name)
    if update.callback_query:
        await update.callback_query.edit_message_text("🏠 منوی اصلی:", reply_markup=main_menu_kb(user_id))
    else:
        await send_msg(update, context, "🏠 منوی اصلی:", reply_markup=main_menu_kb(user_id))


async def show_submenu(update: Update, context, title, keyboard):
    if update.callback_query:
        await update.callback_query.edit_message_text(title, reply_markup=keyboard)
    else:
        await send_msg(update, context, title, reply_markup=keyboard)


# ==================== پروفایل ====================

def build_profile_text(user):
    is_vip_active(user)
    return f"""
🧑‍💻 شغل: {user['job']}

💰 موجودی: {user['balance']:,}
🏦 بانک: {user['bank']:,}

🏆 برد: {user['wins']}  💔 باخت: {user['losses']}

🪨 سنگ: {user['stone']}    🪵 چوب: {user['wood']}

🕵️ تجربه: {user['xp']:,} / {user['xp_next']:,}
✳️ سطح: {user['level']}

🍁 دلار: {user['usd']}
👷 کارگران: {user['workers']}

🏚️ خانه: {user['home_small']}
🏭 کارخانه سنگ: {user['stone_factory']}    🏭 کارخانه چوب: {user['wood_factory']}

💎 وضعیت ویژه: {'✅ فعال' if user.get('vip') else '❌ غیرفعال'}
"""


async def handle_profile(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_id = get_uid(update)
    if user_id not in users:
        init_user(user_id, update.effective_user.full_name)
    text = build_profile_text(users[user_id])
    if update.callback_query:
        await update.callback_query.edit_message_text(text, reply_markup=kb([back_row()]))
    else:
        await send_msg(update, context, text)


# ==================== شغل ====================

async def do_set_job(update: Update, context: ContextTypes.DEFAULT_TYPE, job_key):
    user_id = get_uid(update)
    now = time.time()
    if user_id not in users:
        init_user(user_id, update.effective_user.full_name)
    job_keys = {"geda": "گدا", "police": "پلیس", "hacker": "هکر"}
    fa = job_keys[job_key]

    if job_key == "hacker" and not is_vip_active(users[user_id]):
        await answer_cb(update)
        await send_msg(update, context, "❌ فقط کاربران VIP می‌تونن شغل هکر رو انتخاب کنن.")
        return

    last_change = users[user_id].get("last_job_change", 0)
    if now - last_change < 24 * 3600:
        remaining = int(24 * 3600 - (now - last_change))
        h, m, s = remaining // 3600, (remaining % 3600) // 60, remaining % 60
        await answer_cb(update)
        await send_msg(update, context, f"⏳ باید {h:02}:{m:02}:{s:02} دیگه صبر کنی تا شغلت رو عوض کنی.")
        return

    users[user_id]["job"] = fa
    users[user_id]["last_job_change"] = now
    save_data()
    await answer_cb(update)
    await send_msg(update, context, f"✅ شغل شما با موفقیت به «{fa}» تغییر کرد.")


# ==================== شرط‌بندی ====================

async def bet_process(update: Update, context: ContextTypes.DEFAULT_TYPE, amount_text: str):
    user_id = get_uid(update)
    full_name = update.effective_user.full_name

    if user_id not in users:
        await send_msg(update, context, "شما هنوز ثبت‌نام نکرده‌اید.")
        return

    user = users[user_id]

    if amount_text == "*":
        amount = user["balance"]
    else:
        try:
            amount = int(amount_text)
        except ValueError:
            await send_msg(update, context, "مقدار نامعتبر است.")
            return

    if amount <= 0:
        await send_msg(update, context, "مقدار شرط باید بیشتر از صفر باشد.")
        return

    if user['balance'] < amount:
        await send_msg(update, context, f"🚫 سکه کافی ندارید. موجودی فعلی: {user['balance']:,}")
        return

    if active_challenge["active"] and amount == active_challenge["bet"]:
        user["balance"] += active_challenge["reward"]
        active_challenge["active"] = False
        save_data()
        await send_msg(update, context,
                        f"🎉 چالش رو ترکوندی! {active_challenge['reward']:,} سکه جایزه گرفتی!",
                        parse_mode=ParseMode.HTML)
        return

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
        caption = f"🎉 {full_name} بردی!\n{amount:,} سکه شرط بستی و {amount * 2:,} سکه گرفتی."
        await send_photo_msg(update, context, photo, caption)
    else:
        user['balance'] -= amount
        user['losses'] += 1
        photo = get_vip_lose() if is_vip else get_red_cross()
        caption = f"😔 {full_name} باختی!\n{amount:,} سکه شرط بستی و از دستش دادی."
        await send_photo_msg(update, context, photo, caption)

    if amount >= 15000:
        user["xp"] += 1
        if user["xp"] >= user["xp_next"]:
            user["xp"] = 0
            user["xp_next"] += 2500
            user["level"] += 1
            await send_msg(update, context, f"🆙 تبریک! به سطح {user['level']} رسیدی!")

    save_data()


# ==================== بازی‌های تاسی ====================

async def check_cooldown_reply(update, context, cooldowns, uid, seconds, label):
    last = cooldowns.get(uid, 0)
    remaining = seconds - (time.time() - last)
    if remaining > 0:
        left = int(remaining)
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await send_msg(update, context, f"⏳ برای «{label}» باید {h:02}:{m:02}:{s:02} دیگه صبر کنی.")
        return False
    return True


async def basketball_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    if not await check_cooldown_reply(update, context, basketball_cooldowns, uid, BASKETBALL_COOLDOWN, "بسکتبال"):
        return
    dice_msg = await send_dice(update, context, "🏀")
    reward = 500_000
    if dice_msg.dice.value in [4, 5]:
        users[uid]["balance"] += reward
        message = f"🏀 شوت افسانه‌ای! ✅\n💰 جایزه: {reward:,} سکه"
    else:
        message = "🏀 پرتاب ناموفق ❌\nسکه‌ای نگرفتی."
    basketball_cooldowns[uid] = time.time()
    save_data()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=message,
                                    reply_to_message_id=dice_msg.message_id)


async def dart_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    if not await check_cooldown_reply(update, context, dart_cooldowns, uid, DART_COOLDOWN, "دارت"):
        return
    dice_msg = await send_dice(update, context, "🎯")
    reward = 5_000_000
    if dice_msg.dice.value == 6:
        users[uid]["balance"] += reward
        message = f"🎯 مرکز هدف نابود شد! ✅\n💰 جایزه: {reward:,} سکه"
    else:
        message = "🎯 پرتاب ناموفق ❌"
    dart_cooldowns[uid] = time.time()
    save_data()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=message,
                                    reply_to_message_id=dice_msg.message_id)


async def football_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    reward = 500_000
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    if not await check_cooldown_reply(update, context, football_cooldowns, uid, FOOTBALL_COOLDOWN, "فوتبال"):
        return
    dice_msg = await send_dice(update, context, "⚽️")
    if dice_msg.dice.value in [3, 4, 5]:
        users[uid]["balance"] += reward
        message = f"✅ گل! ⚽️\n💰 جایزه: {reward:,} سکه"
    else:
        message = "❌ شانس نیاوردی!"
    football_cooldowns[uid] = time.time()
    save_data()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=message,
                                    reply_to_message_id=dice_msg.message_id)


async def bowling_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    if not await check_cooldown_reply(update, context, bowling_cooldowns, uid, BOWLING_COOLDOWN, "بولینگ"):
        return
    dice_msg = await send_dice(update, context, "🎳")
    reward = 1_000_000
    if dice_msg.dice.value == 6:
        users[uid]["balance"] += reward
        text = f"🎳 بـوم! ✅\n💰 جایزه: {reward:,} سکه"
    else:
        text = "🙁 این‌بار جایزه‌ای نگرفتی."
    bowling_cooldowns[uid] = time.time()
    save_data()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=text,
                                    reply_to_message_id=dice_msg.message_id)


async def slot_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    if not await check_cooldown_reply(update, context, slot_cooldowns, uid, SLOT_COOLDOWN, "اسلات"):
        return
    slot_msg = await send_dice(update, context, "🎰")
    win_values = [1, 22, 43, 64]
    if slot_msg.dice.value in win_values:
        reward = 50_000_000
        users[uid]["balance"] += reward
        message = f"✅ تبریک بزرگ! 🎰\n💰 جایزه: {reward:,} سکه"
    else:
        message = "❌ این‌بار نبردی."
    slot_cooldowns[uid] = time.time()
    save_data()
    await context.bot.send_message(chat_id=update.effective_chat.id, text=message,
                                    reply_to_message_id=slot_msg.message_id)


async def tas_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    if not await check_cooldown_reply(update, context, tas_cooldowns, uid, TAS_COOLDOWN, "تاس"):
        return
    dice_msg = await send_dice(update, context, "🎲")
    reward = dice_msg.dice.value * 100_000
    users[uid]["balance"] += reward
    tas_cooldowns[uid] = time.time()
    save_data()
    await context.bot.send_message(
        chat_id=update.effective_chat.id,
        text=f"🎲 عدد: {dice_msg.dice.value}\n💰 جایزه: {reward:,} سکه",
        reply_to_message_id=dice_msg.message_id,
    )


async def vip_game_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    if not is_vip_active(users[uid]):
        save_data()
        await send_msg(update, context, "⛔️ این فقط برای کاربران VIP است.")
        return
    await send_msg(update, context, "🚀 اجرای همه‌ی بازی‌های ویژه...")
    await basketball_handler(update, context)
    await football_handler(update, context)
    await bowling_handler(update, context)
    await tas_handler(update, context)
    await dart_handler(update, context)
    await slot_handler(update, context)


async def coin_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    user = users[uid]
    if user["balance"] > 100_000:
        await send_msg(update, context, "💰 موجودیت بیشتر از حد مجازه، نمی‌تونی سکه رایگان بگیری.")
        return
    if not await check_cooldown_reply(update, context, coin_cooldowns, uid, COIN_COOLDOWN, "سکه رایگان"):
        return
    reward = random.randint(1, 500_000)
    user["balance"] += reward
    coin_cooldowns[uid] = time.time()
    save_data()
    await send_msg(update, context, f"🎁 {reward:,} سکه گرفتی!\n💰 موجودی: {user['balance']:,}")


async def charity_self_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "❗️اول باید ثبت‌نام کنی.")
        return
    user = users[uid]
    if user["job"] != "گدا":
        await send_msg(update, context, "❌ فقط شغل «گدا» می‌تونه از خیریه استفاده کنه.")
        return
    if not await check_cooldown_reply(update, context, charity_cooldowns, uid, CHARITY_COOLDOWN, "خیریه"):
        return
    amount = 10_000_000
    user["balance"] += amount
    charity_cooldowns[uid] = time.time()
    save_data()
    await send_msg(update, context, f"❤️‍🔥 خیریه {amount:,} سکه بهت داد!")


# ==================== بانک / دلار ====================

async def do_transfer(update, context, amount_text):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    if amount_text == "*":
        total = user["balance"] + user["bank"]
        user["balance"] = total // 2
        user["bank"] = total - user["balance"]
    else:
        amount = int(amount_text)
        if amount <= 0 or amount > user["balance"]:
            await send_msg(update, context, "مقدار نامعتبر یا بیشتر از موجودیته.")
            return
        user["balance"] -= amount
        user["bank"] += amount
    save_data()
    await send_msg(update, context, f"✅ انتقال انجام شد.\n💳 بانک: {user['bank']:,}\n💵 دست شما: {user['balance']:,}")


async def do_withdraw(update, context, amount_text):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    amount = user["bank"] if amount_text == "*" else int(amount_text)
    if amount <= 0 or amount > user["bank"]:
        await send_msg(update, context, "مقدار نامعتبر یا بیشتر از موجودی بانکته.")
        return
    user["bank"] -= amount
    user["balance"] += amount
    save_data()
    await send_msg(update, context, f"✅ برداشت انجام شد.\n💳 بانک: {user['bank']:,}\n💵 دست شما: {user['balance']:,}")


async def do_buyusd(update, context, amount_text):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    if amount_text == "*":
        amount = min((user["balance"] // USD_PRICE), MAX_USD - user["usd"])
    else:
        amount = int(amount_text)
    if amount <= 0:
        await send_msg(update, context, "مقدار نامعتبر.")
        return
    if user["usd"] + amount > MAX_USD:
        await send_msg(update, context, f"❌ نمی‌تونی بیشتر از {MAX_USD} دلار داشته باشی.")
        return
    cost = amount * USD_PRICE
    if user["balance"] < cost:
        await send_msg(update, context, "موجودی کافی نداری.")
        return
    user["balance"] -= cost
    user["usd"] += amount
    save_data()
    await send_msg(update, context, f"✅ {amount}$ خریدی.\n💰 موجودی: {user['balance']:,}")


async def do_sellusd(update, context, amount_text):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    amount = user["usd"] if amount_text == "*" else int(amount_text)
    if amount <= 0 or amount > user["usd"]:
        await send_msg(update, context, "مقدار نامعتبر یا بیشتر از دلار موجودته.")
        return
    gain = amount * USD_PRICE
    user["usd"] -= amount
    user["balance"] += gain
    save_data()
    await send_msg(update, context, f"✅ {amount}$ فروختی و {gain:,} سکه گرفتی.")


async def do_sellstone(update, context, amount_text):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    amount = int(amount_text)
    if user["stone"] < amount:
        await send_msg(update, context, f"فقط {user['stone']} سنگ داری.")
        return
    user["stone"] -= amount
    reward = amount * STONE_PRICE
    user["balance"] += reward
    save_data()
    await send_msg(update, context, f"✅ {amount} سنگ فروختی و {reward:,} سکه گرفتی.")


async def do_sellwood(update, context, amount_text):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    amount = int(amount_text)
    if user["wood"] < amount:
        await send_msg(update, context, f"فقط {user['wood']} چوب داری.")
        return
    user["wood"] -= amount
    reward = amount * 5000
    user["balance"] += reward
    save_data()
    await send_msg(update, context, f"✅ {amount} چوب فروختی و {reward:,} سکه گرفتی.")


# ==================== کسب‌وکار ====================

async def buy_home_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    if user["home_small"] >= 15:
        await send_msg(update, context, "حداکثر ۱۵ خانه ممکنه.")
        return
    price = 20_000_000 + (user["home_small"] * 10_000_000)
    if user["balance"] < price:
        await send_msg(update, context, f"سکه کافی نداری. قیمت: {price:,}")
        return
    user["balance"] -= price
    user["home_small"] += 1
    save_data()
    await send_msg(update, context, f"🏚 خانه خریدی! تعداد: {user['home_small']}")


async def tax_collection_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    if not await check_cooldown_reply(update, context, tax_cooldowns, uid, TAX_COOLLECTION_COOLDOWN, "درآمد خانه"):
        return
    user = users[uid]
    count = user["home_small"]
    if count == 0:
        await send_msg(update, context, "هیچ خانه‌ای نداری.")
        return
    total = sum(random.randint(1_000_000, 4_000_000) for _ in range(count))
    user["balance"] += total
    tax_cooldowns[uid] = time.time()
    save_data()
    await send_msg(update, context, f"🏦 از خانه‌هات {total:,} سکه گرفتی.")


async def stone_factory_buy_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    if user["stone_factory"] >= 20:
        await send_msg(update, context, "حداکثر ۲۰ کارخانه ممکنه.")
        return
    price = 40_000_000 + (user["stone_factory"] * 10_000_000)
    if user["balance"] < price:
        await send_msg(update, context, f"سکه کافی نداری. قیمت: {price:,}")
        return
    user["balance"] -= price
    user["stone_factory"] += 1
    save_data()
    await send_msg(update, context, f"🏭 کارخانه سنگ خریدی! تعداد: {user['stone_factory']}")


async def stone_collect_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    if not await check_cooldown_reply(update, context, stone_cooldowns, uid, STONE_COLLECT_COOLDOWN, "برداشت سنگ"):
        return
    user = users[uid]
    if user["stone_factory"] == 0:
        await send_msg(update, context, "هیچ کارخانه سنگی نداری.")
        return
    total = sum(random.randint(1, 200) for _ in range(user["stone_factory"]))
    user["stone"] += total
    stone_cooldowns[uid] = time.time()
    save_data()
    await send_msg(update, context, f"🪨 {total} سنگ گرفتی. موجودی: {user['stone']}")


async def wood_factory_buy_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    if user["wood_factory"] >= 20:
        await send_msg(update, context, "حداکثر ۲۰ کارخانه ممکنه.")
        return
    price = 40_000_000 + (user["wood_factory"] * 10_000_000)
    if user["balance"] < price:
        await send_msg(update, context, f"سکه کافی نداری. قیمت: {price:,}")
        return
    user["balance"] -= price
    user["wood_factory"] += 1
    save_data()
    await send_msg(update, context, f"🏭 کارخانه چوب خریدی! تعداد: {user['wood_factory']}")


async def wood_collect_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    if not await check_cooldown_reply(update, context, wood_cooldowns, uid, WOOD_COLLECT_COOLDOWN, "برداشت چوب"):
        return
    user = users[uid]
    if user["wood_factory"] == 0:
        await send_msg(update, context, "هیچ کارخانه چوبی نداری.")
        return
    total = sum(random.randint(1, 200) for _ in range(user["wood_factory"]))
    user["wood"] += total
    wood_cooldowns[uid] = time.time()
    save_data()
    await send_msg(update, context, f"🪵 {total} چوب گرفتی. موجودی: {user['wood']}")


async def buy_worker_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    user = users[uid]
    if user["workers"] >= 15:
        await send_msg(update, context, "حداکثر ۱۵ کارگر ممکنه.")
        return
    price = 26_000_000 + (user["workers"] * 10_000_000)
    if user["balance"] < price:
        await send_msg(update, context, f"سکه کافی نداری. قیمت: {price:,}")
        return
    user["balance"] -= price
    user["workers"] += 1
    save_data()
    await send_msg(update, context, f"👷 کارگر افغانی خریدی! تعداد: {user['workers']}")


async def worker_pay_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    if not await check_cooldown_reply(update, context, afghani_pay_cooldowns, uid, AFGHANI_PAY_COOLDOWN, "سود کارگر"):
        return
    user = users[uid]
    count = user["workers"]
    if count == 0:
        await send_msg(update, context, "هیچ کارگری نداری.")
        return
    total = sum(random.randint(4_000_000, 10_000_000) for _ in range(count))
    user["balance"] += total
    afghani_pay_cooldowns[uid] = time.time()
    save_data()
    await send_msg(update, context, f"💸 از کارگرات {total:,} سکه گرفتی.")


# ==================== اسلحه ====================

async def buy_gun_handler(update, context, gun_key):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    if gun_key not in guns:
        await send_msg(update, context, "این سلاح پیدا نشد.")
        return
    gun = guns[gun_key]
    user = users[uid]
    if user["balance"] < gun["price"]:
        await send_msg(update, context, "سکه کافی برای این سلاح نداری.")
        return
    user["balance"] -= gun["price"]
    user.setdefault("guns", [])
    if gun_key not in user["guns"]:
        user["guns"].append(gun_key)
    user["current_gun"] = gun_key
    save_data()
    await send_msg(update, context, f"🔫 «{gun['name']}» خریداری و فعال شد!")


# ==================== رتبه‌بندی ====================

async def top_coin_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    usd_rate = 50000
    ranking = sorted(
        ((u, d["balance"] + d["bank"] + d["usd"] * usd_rate, d) for u, d in users.items()),
        key=lambda x: x[1], reverse=True
    )
    text = "🏆 برترین ثروتمندان:\n"
    for i, (u, total, d) in enumerate(ranking[:10], 1):
        text += f"{i}. {d['name']} — {total:,} تومان\n"
    your_rank = next((i + 1 for i, (u, *_rest) in enumerate(ranking) if u == uid), None)
    text += f"\n👤 رتبه‌ی تو: {your_rank}"
    await send_msg(update, context, text)


async def top_level_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    ranking = sorted(users.items(), key=lambda x: (x[1].get("level", 0), x[1].get("xp", 0)), reverse=True)
    text = "🎖 برترین سطح‌ها:\n"
    for i, (u, d) in enumerate(ranking[:10], 1):
        text += f"{i}. {d['name']} — سطح {d.get('level', 1)}\n"
    your_rank = next((i + 1 for i, (u, _) in enumerate(ranking) if u == uid), None)
    text += f"\n👤 رتبه‌ی تو: {your_rank}"
    await send_msg(update, context, text)


async def top_bet_handler(update, context):
    uid = get_uid(update)
    if uid not in users:
        await send_msg(update, context, "ثبت‌نام نکردی.")
        return
    ranking = sorted(users.items(), key=lambda x: x[1].get("wins", 0) + x[1].get("losses", 0), reverse=True)
    text = "🎰 برترین شرط‌بندها:\n"
    for i, (u, d) in enumerate(ranking[:10], 1):
        text += f"{i}. {d['name']} — برد {d.get('wins', 0)} | باخت {d.get('losses', 0)}\n"
    await send_msg(update, context, text)


# ==================== اکشن‌های ریپلای‌محور (پرداخت، دزدی، هک، خیریه، مواد) ====================

async def handle_pay_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE):
    sender_id = get_uid(update)
    if sender_id not in users:
        await update.message.reply_text("ثبت‌نام نکردی.")
        return
    if not update.message.reply_to_message:
        await update.message.reply_text("باید رو پیام طرف ریپلای بزنی.")
        return
    target = update.message.reply_to_message.from_user
    if target.is_bot or str(target.id) == sender_id:
        await update.message.reply_text("گیرنده نامعتبره.")
        return
    if str(target.id) not in users:
        await update.message.reply_text("این کاربر ثبت‌نام نکرده.")
        return
    pending_amount_action[sender_id] = {"type": "pay", "target": str(target.id)}
    await update.message.reply_text(
        f"💰 چقدر به {target.first_name} پرداخت کنی؟", reply_markup=amount_menu_kb("pay", with_all=False)
    )


async def do_pay(update, context, amount_text):
    sender_id = get_uid(update)
    pending = pending_amount_action.get(sender_id)
    if not pending or pending["type"] != "pay":
        await send_msg(update, context, "درخواستی برای پرداخت پیدا نشد، دوباره رو پیام طرف ریپلای بزن.")
        return
    target_id = pending["target"]
    now = time.time()
    last_pay = pay_cooldowns.get(sender_id, 0)
    if now - last_pay < PAY_COOLDOWN:
        left = int(PAY_COOLDOWN - (now - last_pay))
        h, m = left // 3600, (left % 3600) // 60
        await send_msg(update, context, f"⏳ {h:02}:{m:02} دیگه صبر کن.")
        return
    amount = int(amount_text)
    if users[sender_id]["balance"] < amount:
        await send_msg(update, context, "موجودی کافی نداری.")
        return
    users[sender_id]["balance"] -= amount
    users[target_id]["balance"] += amount
    pay_cooldowns[sender_id] = now
    del pending_amount_action[sender_id]
    save_data()
    await send_msg(update, context, f"✅ {amount:,} سکه به {users[target_id]['name']} پرداخت شد.")


async def handle_break_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE):
    thief_id = get_uid(update)
    now = time.time()
    if thief_id not in users:
        await update.message.reply_text("ثبت‌نام نکردی.")
        return
    if not update.message.reply_to_message:
        await update.message.reply_text("باید رو پیام طرف ریپلای بزنی.")
        return
    victim = update.message.reply_to_message.from_user
    victim_id = str(victim.id)
    if victim_id not in users or victim_id == thief_id:
        await update.message.reply_text("هدف نامعتبره.")
        return

    last_break = break_cooldowns.get(thief_id, 0)
    if now - last_break < BREAK_COOLDOWN:
        left = int(BREAK_COOLDOWN - (now - last_break))
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(f"⏳ {h:02}:{m:02}:{s:02} دیگه صبر کن.")
        return

    if now - victim_protection.get(victim_id, 0) < BREAK_COOLDOWN:
        await update.message.reply_text("این کاربر به‌تازگی دزدی شده، بعداً امتحان کن.")
        return

    victim_user = users[victim_id]
    thief_user = users[thief_id]
    if victim_user['balance'] < 1000:
        await update.message.reply_text("این کاربر سکه کافی نداره.")
        return

    if not random.choice([True, False]):
        await update.message.reply_text("❌ ناکام موندی، دزدی موفق نشد.")
    else:
        percent = random.randint(2, 20)
        stolen = int(victim_user["balance"] * percent / 100)
        bonus = random.randint(100_000, 500_000)
        charity = int(stolen * random.uniform(0.5, 2))
        victim_user["balance"] = max(victim_user["balance"] - stolen - charity, 0)
        thief_user["balance"] += stolen + bonus
        await update.message.reply_text(
            f"👑 {stolen:,} سکه دزدیدی + {bonus:,} جایزه‌ی ویژه!\n{charity:,} سکه هم به خیریه رفت."
        )
        victim_protection[victim_id] = now

    break_cooldowns[thief_id] = now
    save_data()


async def handle_givecharity_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    now = time.time()
    if uid not in users:
        await update.message.reply_text("ثبت‌نام نکردی.")
        return
    if users[uid].get("job") != "گدا":
        await update.message.reply_text("⛔️ فقط گداها می‌تونن کمک کنن.")
        return
    if not update.message.reply_to_message:
        await update.message.reply_text("باید رو پیام طرف ریپلای بزنی.")
        return
    target_id = str(update.message.reply_to_message.from_user.id)
    if target_id not in users:
        await update.message.reply_text("این کاربر ثبت‌نام نکرده.")
        return
    last_used = give_charity_cooldowns.get(uid, 0)
    if now - last_used < CHARITY_COOLDOWN:
        left = int(CHARITY_COOLDOWN - (now - last_used))
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(f"⏳ {h:02}:{m:02}:{s:02} دیگه صبر کن.")
        return
    users[target_id]["balance"] += 2_000_000
    give_charity_cooldowns[uid] = now
    save_data()
    await update.message.reply_text(f"✨ ۲,۰۰۰,۰۰۰ سکه به {update.message.reply_to_message.from_user.first_name} دادی!")


async def handle_hakbank_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE):
    hacker_id = get_uid(update)
    now = time.time()
    if hacker_id not in users or users[hacker_id].get("job") != "هکر":
        await update.message.reply_text("❌ شغل هکر نداری.")
        return
    if not is_vip_active(users[hacker_id]):
        await update.message.reply_text("❌ فقط VIP می‌تونه هک کنه.")
        return
    if not update.message.reply_to_message:
        await update.message.reply_text("باید رو پیام طرف ریپلای بزنی.")
        return
    victim_id = str(update.message.reply_to_message.from_user.id)
    if victim_id not in users:
        await update.message.reply_text("این کاربر ثبت‌نام نکرده.")
        return
    last_time = hakbank_cooldowns.get(hacker_id, 0)
    if now - last_time < HAKBANK_COOLDOWN:
        left = int(HAKBANK_COOLDOWN - (now - last_time))
        h, m, s = left // 3600, (left % 3600) // 60, left % 60
        await update.message.reply_text(f"⏳ {h:02}:{m:02}:{s:02} دیگه صبر کن.")
        return
    victim_bank = users[victim_id]["bank"]
    if victim_bank <= 0:
        await update.message.reply_text("💤 بانک این کاربر خالیه.")
        return
    percent = random.randint(5, 25)
    stolen = int(victim_bank * percent / 100)
    users[victim_id]["bank"] -= stolen
    users[hacker_id]["balance"] += stolen
    hakbank_cooldowns[hacker_id] = now
    save_data()
    await update.message.reply_text(f"💻 هک موفق! {stolen:,} سکه از بانک {update.message.reply_to_message.from_user.first_name} دزدیدی.")


async def handle_material_sale_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE, material_name):
    seller_id = get_uid(update)
    if seller_id not in users:
        await update.message.reply_text("ثبت‌نام نکردی.")
        return
    if users[seller_id].get("job") != "ساقی" and seller_id not in ADMINS:
        await update.message.reply_text("⛔️ فقط ساقی می‌تونه بفروشه.")
        return
    if users[seller_id].get("job") == "ساقی" and not is_vip_active(users[seller_id]):
        await update.message.reply_text("⛔️ فقط ساقی VIP می‌تونه بفروشه.")
        return
    if not update.message.reply_to_message:
        await update.message.reply_text("باید رو پیام خریدار ریپلای بزنی.")
        return
    buyer_id = str(update.message.reply_to_message.from_user.id)
    if buyer_id not in users:
        await update.message.reply_text("این کاربر ثبت‌نام نکرده.")
        return
    pending_amount_action[seller_id] = {"type": "sell", "target": buyer_id, "material": material_name}
    await update.message.reply_text(
        f"💊 چند گرم {material_name} پیشنهاد بدی؟", reply_markup=mat_menu_kb("sellmat", target="m:main")
    )


async def do_sell_material(update, context, grams_text):
    seller_id = get_uid(update)
    pending = pending_amount_action.get(seller_id)
    if not pending or pending["type"] != "sell":
        await send_msg(update, context, "درخواستی پیدا نشد، دوباره رو پیام خریدار ریپلای بزن.")
        return
    material = pending["material"]
    buyer_id = pending["target"]
    grams = int(grams_text)
    price = grams * MATERIAL_PRICES[material]
    users[buyer_id]["pending_buy"] = {"material": material, "grams": grams, "price": price, "seller": seller_id}
    del pending_amount_action[seller_id]
    save_data()
    await send_msg(update, context, f"💊 پیشنهاد فروش {material} به مقدار {grams}g برای {price:,} فرستاده شد.")


async def handle_yas_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE):
    buyer_id = get_uid(update)
    buyer = users.get(buyer_id)
    if not buyer or "pending_buy" not in buyer:
        await update.message.reply_text("درخواستی برای خرید نداری.")
        return
    deal = buyer["pending_buy"]
    if buyer["balance"] < deal["price"]:
        await update.message.reply_text("موجودی کافی نداری.")
        return
    buyer["balance"] -= deal["price"]
    users[deal["seller"]]["balance"] += deal["price"]
    buyer.setdefault("materials", {"گل": 0, "شیشه": 0, "تریاک": 0})
    buyer["materials"][deal["material"]] += deal["grams"]
    del buyer["pending_buy"]
    save_data()
    await update.message.reply_text(f"✅ خرید {deal['grams']}g {deal['material']} انجام شد!")


async def handle_no_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE):
    buyer_id = get_uid(update)
    buyer = users.get(buyer_id)
    if not buyer or "pending_buy" not in buyer:
        await update.message.reply_text("درخواستی برای خرید نداری.")
        return
    del buyer["pending_buy"]
    save_data()
    await update.message.reply_text("❌ خرید رد شد.")


async def handle_mavad_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if uid not in users:
        await update.message.reply_text("ثبت‌نام نکردی.")
        return
    m = users[uid].get("materials", {"گل": 0, "شیشه": 0, "تریاک": 0})
    await update.message.reply_text(f"🌿 گل: {m['گل']}g | شیشه: {m['شیشه']}g | تریاک: {m['تریاک']}g")


async def handle_keshidan_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE, text):
    uid = get_uid(update)
    if uid not in users:
        await update.message.reply_text("ثبت‌نام نکردی.")
        return
    m = re.match(r"^مصرف\s+مواد\s+(گل|شیشه|تریاک)\s+(\d+)$", text)
    if not m:
        await update.message.reply_text("فرمت درست: «مصرف مواد شیشه 1» (عدد = گرم)")
        return
    real_name, amount = m.group(1), int(m.group(2))
    materials = users[uid].setdefault("materials", {"گل": 0, "شیشه": 0, "تریاک": 0})
    if materials.get(real_name, 0) < amount:
        await update.message.reply_text("به این مقدار دسترسی نداری.")
        return
    materials[real_name] -= amount
    addiction = users[uid].get("addiction", 0) + amount * 5
    users[uid]["addiction"] = addiction
    if addiction >= 100:
        users[uid]["balance"] = 0
        users[uid]["bank"] = 0
        users[uid]["addiction"] = 0
        await update.message.reply_text("☠️ مصرف بیش‌ازحد باعث شد همه‌چیزت از بین بره!")
    else:
        await update.message.reply_text(f"💨 {amount}g {real_name} مصرف کردی.\n🔥 اعتیاد: {addiction}/100")
    save_data()


async def handle_redeem_code_keyword(update: Update, context: ContextTypes.DEFAULT_TYPE, text):
    uid = get_uid(update)
    if uid not in users:
        await update.message.reply_text("ثبت‌نام نکردی.")
        return
    m = re.match(r"^کد\s+(\S+)$", text)
    if not m:
        return
    code = m.group(1)
    if code not in gift_codes:
        await update.message.reply_text("این کد معتبر نیست یا قبلاً استفاده شده.")
        return
    amount = gift_codes.pop(code)
    users[uid]["balance"] += amount
    save_data()
    await update.message.reply_text(f"🎁 کد معتبر بود! {amount:,} سکه گرفتی.")


# ==================== مدیریت (ادمین) ====================

ADMIN_HELP_TEXT = (
    "🔐 دستورات مدیریت (رو پیام کاربر ریپلای بزن و تایپ کن):\n\n"
    "• افزایش سکه <عدد>\n"
    "• کاهش سکه <عدد>\n"
    "• افزایش تجربه <عدد>\n"
    "• افزایش بانک <عدد>\n"
    "• کاهش بانک <عدد>\n"
    "• دادن ویژه <روز> <ساعت> <دقیقه>\n"
    "• گرفتن ویژه\n"
    "• حذف کاربر\n"
    "• چالش <بت> <جایزه>\n"
    "• پیش‌بینی شرط <تعداد>\n"
    "• تنظیم ساقی\n"
    "• کد جایزه <کد> مبلغ <عدد>\n"
    "• کد جایزه <کد> سرباز <عدد>\n"
    "• پیام همگانی <متن>\n\n"
    "بدون ریپلای:\n"
    "• لیست کدها\n"
    "• باطل کد <کد>\n"
)


async def admin_text_dispatcher(update: Update, context: ContextTypes.DEFAULT_TYPE):
    uid = get_uid(update)
    if not is_admin(uid):
        return
    text = update.message.text.strip()
    normalized = _normalize_digits(text)

    m = re.match(r"^افزایش\s+سکه\s+(\d+)$", normalized)
    if m and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            users[target]["balance"] += int(m.group(1))
            save_data()
            await update.message.reply_text(f"✅ {int(m.group(1)):,} سکه اضافه شد.")
        return

    m = re.match(r"^کاهش\s+سکه\s+(\d+)$", normalized)
    if m and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            users[target]["balance"] = max(0, users[target]["balance"] - int(m.group(1)))
            save_data()
            await update.message.reply_text(f"✅ {int(m.group(1)):,} سکه کم شد.")
        return

    m = re.match(r"^افزایش\s+تجربه\s+(\d+)$", normalized)
    if m and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            users[target]["xp"] += int(m.group(1))
            save_data()
            await update.message.reply_text(f"✅ {int(m.group(1)):,} تجربه اضافه شد.")
        return

    m = re.match(r"^افزایش\s+بانک\s+(\d+)$", normalized)
    if m and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            users[target]["bank"] += int(m.group(1))
            save_data()
            await update.message.reply_text(f"✅ {int(m.group(1)):,} به بانک اضافه شد.")
        return

    m = re.match(r"^کاهش\s+بانک\s+(\d+)$", normalized)
    if m and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            users[target]["bank"] = max(0, users[target]["bank"] - int(m.group(1)))
            save_data()
            await update.message.reply_text(f"✅ {int(m.group(1)):,} از بانک کم شد.")
        return

    m = re.match(r"^دادن\s+ویژه\s+(\d+)\s+(\d+)\s+(\d+)$", normalized)
    if m and update.message.reply_to_message:
        days, hours, minutes = int(m.group(1)), int(m.group(2)), int(m.group(3))
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            expire_time = datetime.now() + timedelta(days=days, hours=hours, minutes=minutes)
            users[target]["vip"] = True
            users[target]["account_type"] = "کاربر VIP"
            users[target]["vip_time"] = expire_time.strftime("%Y-%m-%d %H:%M:%S")
            save_data()
            await update.message.reply_text("✅ VIP فعال شد.")
        return

    if normalized == "گرفتن ویژه" and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            users[target]["vip"] = False
            users[target]["vip_time"] = 0
            users[target]["account_type"] = "کاربر معمولی"
            save_data()
            await update.message.reply_text("✅ VIP گرفته شد.")
        return

    if normalized == "حذف کاربر" and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            del users[target]
            for d in [break_cooldowns, coin_cooldowns, slot_cooldowns, football_cooldowns,
                      bowling_cooldowns, basketball_cooldowns, tas_cooldowns, dart_cooldowns,
                      tax_cooldowns, stone_cooldowns, wood_cooldowns, pay_cooldowns,
                      afghani_pay_cooldowns, charity_cooldowns, give_charity_cooldowns]:
                d.pop(target, None)
            save_data()
            await update.message.reply_text("☠️ کاربر کامل حذف شد.")
        return

    m = re.match(r"^چالش\s+(\d+)\s+(\d+)$", normalized)
    if m:
        active_challenge["bet"] = int(m.group(1))
        active_challenge["reward"] = int(m.group(2))
        active_challenge["active"] = True
        await update.message.reply_text(f"🔥 چالش فعال شد: شرط {int(m.group(1)):,} / جایزه {int(m.group(2)):,}")
        return

    m = re.match(r"^پیش.بینی\s+شرط\s+(\d+)$", normalized)
    if m and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        count = int(m.group(1))
        if target in users:
            preplanned = [random.choice(["win", "lose"]) for _ in range(count)]
            users[target]["preplanned_bets"] = preplanned
            save_data()
            await update.message.reply_text("🧠 نتایج آینده‌ی شرط‌ها تعیین شد.")
        return

    if normalized == "تنظیم ساقی" and update.message.reply_to_message:
        target = str(update.message.reply_to_message.from_user.id)
        if target in users:
            users[target]["job"] = "ساقی"
            users[target]["materials"] = {"گل": 0, "شیشه": 0, "تریاک": 0}
            save_data()
            await update.message.reply_text("✅ شغل به ساقی تغییر کرد.")
        return

    m = re.match(r"^کد\s+جایزه\s+(\S+)\s+مبلغ\s+(\d+)$", normalized)
    if m:
        code, amount = m.group(1), int(m.group(2))
        if code in gift_codes:
            await update.message.reply_text("این کد از قبل فعاله.")
            return
        gift_codes[code] = amount
        await update.message.reply_text(f"🎟 کد «{code}» ساخته شد: {amount:,} سکه (یه‌بار مصرف)")
        return

    m = re.match(r"^باطل\s+کد\s+(\S+)$", normalized)
    if m:
        code = m.group(1)
        if code in gift_codes:
            del gift_codes[code]
            await update.message.reply_text(f"✅ کد «{code}» باطل شد.")
        else:
            await update.message.reply_text("همچین کدی وجود نداره.")
        return

    if normalized == "لیست کدها":
        if not gift_codes:
            await update.message.reply_text("هیچ کد فعالی نیست.")
        else:
            lines = ["🎟 کدهای فعال:"] + [f"• {c} — {a:,} سکه" for c, a in gift_codes.items()]
            await update.message.reply_text("\n".join(lines))
        return

    m = re.match(r"^پیام\s+همگانی\s+(.+)$", update.message.text.strip(), re.DOTALL)
    if m:
        message_text = m.group(1)
        ok, fail = 0, 0
        for pid in list(users.keys()):
            try:
                await context.bot.send_message(int(pid), f"📢 {message_text}")
                ok += 1
            except Exception:
                fail += 1
        await update.message.reply_text(f"✅ ارسال شد. موفق: {ok} | ناموفق: {fail}")
        return

    if normalized == "لیست کاربران" or normalized == "کاربران":
        msg = "📍 کاربران ثبت‌نامی:\n"
        count = 0
        for user_id, u in users.items():
            count += 1
            msg += f"👤 {u.get('name', user_id)} — {user_id}\n"
            if count >= 50:
                msg += "...\n"
                break
        msg += f"\n👥 مجموع: {len(users)} نفر"
        await update.message.reply_text(msg)
        return

    if normalized == "ریست شرط ها" or normalized == "ریست شرط‌ها":
        for u in users.values():
            u["preplanned_bets"] = [random.choice(["win", "lose"])]
        save_data()
        await update.message.reply_text("♻️ شرط‌ها ریست شدن.")
        return


def _normalize_digits(text: str) -> str:
    persian = "۰۱۲۳۴۵۶۷۸۹"
    arabic = "٠١٢٣٤٥٦٧٨٩"
    for i, ch in enumerate(persian):
        text = text.replace(ch, str(i))
    for i, ch in enumerate(arabic):
        text = text.replace(ch, str(i))
    return text


# ==================== دیسپچر دکمه‌های شیشه‌ای (Callback Query) ====================

async def callback_dispatcher(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data

    if data == "m:main":
        await answer_cb(update)
        await show_main_menu(update, context)
        return
    if data == "m:profile":
        await answer_cb(update)
        await handle_profile(update, context)
        return
    if data == "m:jobs":
        await answer_cb(update)
        await show_submenu(update, context, "💼 انتخاب شغل:", jobs_menu_kb())
        return
    if data == "m:games":
        await answer_cb(update)
        await show_submenu(update, context, "🎮 بازی‌ها:", games_menu_kb())
        return
    if data == "m:bank":
        await answer_cb(update)
        await show_submenu(update, context, "🏦 بانک:", bank_menu_kb())
        return
    if data == "m:business":
        await answer_cb(update)
        await show_submenu(update, context, "🏭 کسب‌وکار:", business_menu_kb())
        return
    if data == "m:guns":
        await answer_cb(update)
        await show_submenu(update, context, "🔫 دسته‌بندی اسلحه‌ها:", guns_menu_kb())
        return
    if data.startswith("m:guns_cat:"):
        cat = data.split(":", 2)[2]
        await answer_cb(update)
        await show_submenu(update, context, f"🔫 اسلحه‌های {cat}:", guns_cat_kb(cat))
        return
    if data == "m:top":
        await answer_cb(update)
        await show_submenu(update, context, "🏆 رتبه‌بندی:", top_menu_kb())
        return
    if data == "m:help":
        await answer_cb(update)
        await show_submenu(update, context, HELP_MAIN_TEXT, kb([back_row()]))
        return
    if data == "m:admin":
        await answer_cb(update)
        if not is_admin(get_uid(update)):
            return
        await show_submenu(update, context, "🔐 پنل مدیریت:", admin_menu_kb())
        return
    if data == "m:bet":
        await answer_cb(update)
        await show_submenu(update, context, "🎲 چقدر شرط ببندی؟", amount_menu_kb("bet"))
        return
    if data == "m:bank_transfer":
        await answer_cb(update)
        await show_submenu(update, context, "⬆️ چقدر به بانک منتقل کنی؟", amount_menu_kb("transfer", target="m:bank"))
        return
    if data == "m:bank_withdraw":
        await answer_cb(update)
        await show_submenu(update, context, "⬇️ چقدر برداشت کنی؟", amount_menu_kb("withdraw", target="m:bank"))
        return
    if data == "m:bank_buyusd":
        await answer_cb(update)
        await show_submenu(update, context, "💵 چند دلار بخری؟", usd_menu_kb("buyusd", target="m:bank"))
        return
    if data == "m:bank_sellusd":
        await answer_cb(update)
        await show_submenu(update, context, "💴 چند دلار بفروشی؟", usd_menu_kb("sellusd", target="m:bank"))
        return
    if data == "m:business_sell_stone":
        await answer_cb(update)
        await show_submenu(update, context, "💰 چند سنگ بفروشی؟", mat_menu_kb("sellstone", target="m:business"))
        return
    if data == "m:business_sell_wood":
        await answer_cb(update)
        await show_submenu(update, context, "💰 چند چوب بفروشی؟", mat_menu_kb("sellwood", target="m:business"))
        return

    if data.startswith("act:job_"):
        job_key = data.split("_", 1)[1]
        await do_set_job(update, context, job_key)
        return

    if data == "act:game_tas":
        await answer_cb(update); await tas_handler(update, context); return
    if data == "act:game_slot":
        await answer_cb(update); await slot_handler(update, context); return
    if data == "act:game_bowling":
        await answer_cb(update); await bowling_handler(update, context); return
    if data == "act:game_football":
        await answer_cb(update); await football_handler(update, context); return
    if data == "act:game_dart":
        await answer_cb(update); await dart_handler(update, context); return
    if data == "act:game_basketball":
        await answer_cb(update); await basketball_handler(update, context); return
    if data == "act:coin":
        await answer_cb(update); await coin_handler(update, context); return
    if data == "act:charity_self":
        await answer_cb(update); await charity_self_handler(update, context); return
    if data == "act:vip_all":
        await answer_cb(update); await vip_game_handler(update, context); return

    if data == "act:buyhome":
        await answer_cb(update); await buy_home_handler(update, context); return
    if data == "act:taxcollect":
        await answer_cb(update); await tax_collection_handler(update, context); return
    if data == "act:stonefactorybuy":
        await answer_cb(update); await stone_factory_buy_handler(update, context); return
    if data == "act:stonecollect":
        await answer_cb(update); await stone_collect_handler(update, context); return
    if data == "act:woodfactorybuy":
        await answer_cb(update); await wood_factory_buy_handler(update, context); return
    if data == "act:woodcollect":
        await answer_cb(update); await wood_collect_handler(update, context); return
    if data == "act:buyworker":
        await answer_cb(update); await buy_worker_handler(update, context); return
    if data == "act:workerpay":
        await answer_cb(update); await worker_pay_handler(update, context); return

    if data == "act:top_coin":
        await answer_cb(update); await top_coin_handler(update, context); return
    if data == "act:top_level":
        await answer_cb(update); await top_level_handler(update, context); return
    if data == "act:top_bet":
        await answer_cb(update); await top_bet_handler(update, context); return

    if data == "act:adm_users":
        await answer_cb(update)
        if is_admin(get_uid(update)):
            msg = "📍 کاربران:\n" + "\n".join(f"👤 {u.get('name')} — {uid}" for uid, u in list(users.items())[:50])
            await send_msg(update, context, msg)
        return
    if data == "act:adm_ristshart":
        await answer_cb(update)
        if is_admin(get_uid(update)):
            for u in users.values():
                u["preplanned_bets"] = [random.choice(["win", "lose"])]
            save_data()
            await send_msg(update, context, "♻️ شرط‌ها ریست شدن.")
        return
    if data == "act:adm_maliat":
        await answer_cb(update)
        if is_admin(get_uid(update)):
            count = 0
            for uid2, u in users.items():
                if uid2 in ADMINS:
                    continue
                tax = random.randint(1, 10_000_000)
                u["balance"] = max(0, u["balance"] - tax)
                count += 1
            save_data()
            await send_msg(update, context, f"💰 مالیات از {count} کاربر گرفته شد.")
        return
    if data == "act:adm_help_text":
        await answer_cb(update)
        if is_admin(get_uid(update)):
            await send_msg(update, context, ADMIN_HELP_TEXT)
        return

    if data.startswith("buygun:"):
        gun_key = data.split(":", 1)[1]
        await answer_cb(update)
        await buy_gun_handler(update, context, gun_key)
        return

    if data.startswith("amt:"):
        _, prefix, amount_text = data.split(":", 2)
        await answer_cb(update)
        if prefix == "bet":
            await bet_process(update, context, amount_text)
        elif prefix == "transfer":
            await do_transfer(update, context, amount_text)
        elif prefix == "withdraw":
            await do_withdraw(update, context, amount_text)
        elif prefix == "buyusd":
            await do_buyusd(update, context, amount_text)
        elif prefix == "sellusd":
            await do_sellusd(update, context, amount_text)
        elif prefix == "sellstone":
            await do_sellstone(update, context, amount_text)
        elif prefix == "sellwood":
            await do_sellwood(update, context, amount_text)
        elif prefix == "pay":
            await do_pay(update, context, amount_text)
        elif prefix == "sellmat":
            await do_sell_material(update, context, amount_text)
        return


# ==================== دیسپچر متن (کلیدواژه‌های فارسی بدون اسلش) ====================

TEXT_ROUTES = [
    (r"^(منو|استارت)$", "menu"),
    (r"^پرداخت$", "pay"),
    (r"^دزدی$", "break"),
    (r"^کمک$", "givecharity"),
    (r"^هک$", "hakbank"),
    (r"^فروش\s+گل$", "sell_gol"),
    (r"^فروش\s+شیشه$", "sell_shishe"),
    (r"^فروش\s+تریاک$", "sell_teryak"),
    (r"^تایید$", "yas"),
    (r"^رد$", "no"),
    (r"^موجودی\s+مواد$", "mavad"),
    (r"^مصرف\s+مواد\s+.+$", "keshidan"),
    (r"^کد\s+\S+$", "redeem_code"),
]


async def text_dispatcher(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return
    text = update.message.text.strip()
    normalized = _normalize_digits(text)

    uid = get_uid(update)
    if uid not in users and update.effective_user:
        pass  # ثبت‌نام فقط با «استارت» انجام می‌شه

    for pattern, action in TEXT_ROUTES:
        if re.match(pattern, normalized):
            if action == "menu":
                await start(update, context)
            elif action == "pay":
                await handle_pay_keyword(update, context)
            elif action == "break":
                await handle_break_keyword(update, context)
            elif action == "givecharity":
                await handle_givecharity_keyword(update, context)
            elif action == "hakbank":
                await handle_hakbank_keyword(update, context)
            elif action == "sell_gol":
                await handle_material_sale_keyword(update, context, "گل")
            elif action == "sell_shishe":
                await handle_material_sale_keyword(update, context, "شیشه")
            elif action == "sell_teryak":
                await handle_material_sale_keyword(update, context, "تریاک")
            elif action == "yas":
                await handle_yas_keyword(update, context)
            elif action == "no":
                await handle_no_keyword(update, context)
            elif action == "mavad":
                await handle_mavad_keyword(update, context)
            elif action == "keshidan":
                await handle_keshidan_keyword(update, context, normalized)
            elif action == "redeem_code":
                await handle_redeem_code_keyword(update, context, normalized)
            return

    # دستورات مدیریت (فقط ادمین می‌بینه، بقیه نادیده گرفته می‌شن)
    if is_admin(uid):
        await admin_text_dispatcher(update, context)


# ==================== اجرای ربات ====================

if __name__ == '__main__':
    load_data()
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CallbackQueryHandler(callback_dispatcher))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, text_dispatcher))

    job_queue = app.job_queue
    if job_queue:
        job_queue.run_repeating(expire_vips_job, interval=600, first=600)

    print("ربات فعال شد...")
    app.run_polling()

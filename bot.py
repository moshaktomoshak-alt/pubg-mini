# -*- coding: utf-8 -*-
"""
بات مستقل Mini App بازی بقا (Survival Top-Down)
- سرور Flask که هم صفحه بازی (Mini App) رو serve می‌کنه هم API ذخیره/بارگذاری وضعیت بازیکن رو داره
- بات تلگرام (polling) که با دستور /start دکمه‌ی باز کردن بازی رو می‌فرسته

نصب:
    pip install flask "python-telegram-bot==21.4" --break-system-packages

اجرا:
    python3 bot.py

متغیرهای محیطی لازم (تو Railway تحت Variables ست کن):
    BOT_TOKEN   -> توکن باتی که از BotFather گرفتی
    WEBAPP_URL  -> آدرس عمومی همین سرویس روی Railway (مثلا https://xxx.up.railway.app)
                   (بعد از اولین دیپلوی، آدرس رو از Railway کپی کن و اینجا ست کن)
"""

import os
import json
import hmac
import hashlib
import threading
import time
import urllib.parse

from flask import Flask, request, jsonify, send_from_directory

from telegram import InlineKeyboardButton, InlineKeyboardMarkup, WebAppInfo, Update
from telegram.ext import Application, CommandHandler, ContextTypes

# ==================== تنظیمات ====================

BOT_TOKEN = os.environ.get("BOT_TOKEN")
if not BOT_TOKEN:
    raise RuntimeError("BOT_TOKEN تنظیم نشده! تو Railway بخش Variables اضافه‌ش کن.")

WEBAPP_URL = os.environ.get("WEBAPP_URL", "")

DATA_DIR = os.environ.get("DATA_DIR", os.path.join(os.path.dirname(__file__), "data"))
os.makedirs(DATA_DIR, exist_ok=True)

_save_lock = threading.Lock()

app = Flask(__name__, static_folder="static", static_url_path="")


# ==================== اعتبارسنجی initData تلگرام ====================

def validate_init_data(init_data: str):
    """طبق مستندات رسمی تلگرام امضای Mini App رو چک می‌کنه و اطلاعات کاربر رو برمی‌گردونه."""
    if not init_data:
        return None
    try:
        parsed = dict(urllib.parse.parse_qsl(init_data, strict_parsing=True))
    except ValueError:
        return None

    received_hash = parsed.pop("hash", None)
    if not received_hash:
        return None

    data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed.items()))
    secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
    calc_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(calc_hash, received_hash):
        return None

    user_raw = parsed.get("user")
    if not user_raw:
        return None
    try:
        return json.loads(user_raw)
    except (ValueError, TypeError):
        return None


def user_file(user_id: int) -> str:
    return os.path.join(DATA_DIR, f"user_{user_id}.json")


def default_state(user_id: int) -> dict:
    return {
        "userId": user_id,
        "worldSeed": (user_id * 9301 + 49297) % 233280,
        "player": {
            "x": 0, "y": 0,
            "health": 100, "hunger": 100, "thirst": 100, "stamina": 100,
        },
        "inventory": {},
        "equipped": None,
        "car": {"repaired": False, "fuel": 0},
        "modifications": {},   # چانک‌های برداشت‌شده / سازه‌های ساخته‌شده
        "updatedAt": time.time(),
    }


# ==================== مسیرهای وب (Mini App) ====================

@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/load", methods=["POST"])
def api_load():
    body = request.get_json(force=True, silent=True) or {}
    user = validate_init_data(body.get("initData", ""))
    if not user:
        return jsonify({"ok": False, "error": "invalid_init_data"}), 401

    uid = user["id"]
    path = user_file(uid)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            state = json.load(f)
    else:
        state = default_state(uid)

    return jsonify({"ok": True, "state": state, "firstName": user.get("first_name", "")})


@app.route("/api/save", methods=["POST"])
def api_save():
    body = request.get_json(force=True, silent=True) or {}
    user = validate_init_data(body.get("initData", ""))
    if not user:
        return jsonify({"ok": False, "error": "invalid_init_data"}), 401

    uid = user["id"]
    state = body.get("state")
    if not isinstance(state, dict):
        return jsonify({"ok": False, "error": "bad_state"}), 400

    state["userId"] = uid
    state["updatedAt"] = time.time()

    with _save_lock:
        with open(user_file(uid), "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False)

    return jsonify({"ok": True})


# ==================== بات تلگرام ====================

async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not WEBAPP_URL:
        await update.message.reply_text(
            "⚠️ آدرس بازی هنوز تنظیم نشده. اول WEBAPP_URL رو تو تنظیمات سرویس ست کن."
        )
        return

    kb = InlineKeyboardMarkup(
        [[InlineKeyboardButton("🎮 ورود به دنیای بقا", web_app=WebAppInfo(url=WEBAPP_URL))]]
    )
    await update.message.reply_text(
        "به دنیای بی‌پایان بقا خوش اومدی! 🧟\n"
        "منابع جمع کن، بساز، ماشین رو تعمیر کن و زنده بمون.\n\n"
        "برای شروع دکمه‌ی پایین رو بزن:",
        reply_markup=kb,
    )


def run_bot():
    import asyncio
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)

    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", cmd_start))
    print("بات بازی بقا روشن شد ...")
    application.run_polling(stop_signals=None, close_loop=False)

# ==================== main ====================

if __name__ == "__main__":
    t = threading.Thread(target=run_bot, daemon=True)
    t.start()

    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

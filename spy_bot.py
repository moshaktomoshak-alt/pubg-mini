import os
import random
import re
import asyncio
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

BOT_TOKEN = os.environ.get("BOT_TOKEN")


# ---------- سرور سلامت (برای Railway) ----------
def start_health_server():
    port = int(os.environ.get("PORT", 3000))

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.end_headers()
            self.wfile.write(b"Spy game bot is running.")

        def log_message(self, format, *args):
            pass

    HTTPServer(("0.0.0.0", port), Handler).serve_forever()


threading.Thread(target=start_health_server, daemon=True).start()

# ---------- تنظیمات پیش‌فرض (قابل تغییر برای هر گروه با دستور) ----------
DEFAULT_SETTINGS = {
    "min_players": 3,
    "register_minutes": 2,     # مدت جمع شدن بازیکن‌ها
    "clue_seconds": 120,       # مدت کل فاز توضیح‌دادن (آزاد، بدون نوبت)
    "vote_seconds": 90,        # مدت رأی‌گیری
    "guess_seconds": 45,       # فرصت جاسوس برای حدس کلمه
}

chat_settings = {}  # chat_key(str) -> dict تنظیمات

WORDS = [
    "فوتبال", "سینما", "پیتزا", "دریا", "کوهنوردی", "کتابخانه", "قطار", "هواپیما",
    "دکتر", "معلم", "آشپز", "نانوایی", "باغ‌وحش", "کنسرت", "عروسی", "تولد",
    "کافه", "رستوران", "کوه", "جنگل", "بیابان", "رودخانه", "دریاچه", "جزیره",
    "کتاب", "روزنامه", "گوشی", "لپ‌تاپ", "دوچرخه", "ماشین", "موتور", "اتوبوس",
    "مدرسه", "دانشگاه", "بیمارستان", "داروخانه", "بانک", "فرودگاه", "ایستگاه مترو",
    "پارک", "استخر", "باشگاه", "تئاتر", "موزه", "کتابفروشی", "سوپرمارکت",
    "گیتار", "پیانو", "طبل", "ویولن", "نقاشی", "مجسمه‌سازی", "عکاسی", "رقص",
    "شطرنج", "فوتسال", "بسکتبال", "والیبال", "شنا", "دو میدانی", "کشتی", "بوکس",
    "چای", "قهوه", "بستنی", "کیک", "شکلات", "هندوانه", "سیب", "موز",
    "برف", "باران", "رعد و برق", "رنگین‌کمان", "غروب آفتاب", "طلوع آفتاب",
    "عینک آفتابی", "چتر", "کوله‌پشتی", "چمدان", "ساعت مچی", "کفش ورزشی",
    "تلفن همراه", "دوربین", "تلویزیون", "یخچال", "ماشین لباسشویی", "جارو برقی",
    "آتش‌نشانی", "پلیس", "خلبان", "کاپیتان کشتی", "راننده تاکسی", "پرستار",
]

games = {}       # chat_key(str) -> game dict
dm_context = {}  # user_id(int) -> chat_key(str)
bot_username = None

TRIGGER_PHRASES = {"جاسوس", "بازی جاسوس", "حدس بزن کی جاسوسه", "کی جاسوسه"}

PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹"


def normalize_digits(t):
    for i, ch in enumerate(PERSIAN_DIGITS):
        t = t.replace(ch, str(i))
    return t


def normalize_text(t):
    t = normalize_digits(t)
    t = re.sub(r"[\u200c\u200f\u200e\u00a0]", " ", t)
    t = t.replace("ي", "ی").replace("ك", "ک")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def get_settings(chat_key):
    if chat_key not in chat_settings:
        chat_settings[chat_key] = dict(DEFAULT_SETTINGS)
    return chat_settings[chat_key]


def mention_html(uid, name):
    safe_name = name.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return f'<a href="tg://user?id={uid}">{safe_name}</a>'


# ---------- شروع ثبت‌نام ----------
async def start_registration(context: ContextTypes.DEFAULT_TYPE, chat_id):
    key = str(chat_id)
    existing = games.get(key)
    if existing and existing["status"] not in ("ended",):
        await context.bot.send_message(chat_id, "یه بازی «حدس بزن کی جاسوسه» همین الان در جریانه یا در حال ثبت‌نامه!")
        return

    settings = get_settings(key)
    game = {
        "chat_id": key,
        "status": "registering",
        "players": {},   # uid -> {id, name}
        "spy_id": None,
        "word": None,
        "vote_tally": {},
        "voters": set(),
    }
    games[key] = game

    join_url = f"https://t.me/{bot_username}?start=join_{key}" if bot_username else None
    markup = None
    if join_url:
        markup = InlineKeyboardMarkup([[InlineKeyboardButton("🕵️ ورود به بازی", url=join_url)]])

    await context.bot.send_message(
        chat_id,
        "🕵️ بازی «حدس بزن کی جاسوسه» شروع شد!\n"
        "یه نفر جاسوس میشه و کلمه‌ی راز رو نمی‌دونه، بقیه کلمه رو تو پیوی می‌گیرن.\n\n"
        f"برای پیوستن دکمه زیر رو بزن.\nحداقل {settings['min_players']} نفر لازمه، "
        f"{settings['register_minutes']} دقیقه وقت داری.",
        reply_markup=markup,
    )

    context.job_queue.run_once(
        finish_registration_job, settings["register_minutes"] * 60, data=key, name=f"reg_{key}"
    )


async def finish_registration_job(context: ContextTypes.DEFAULT_TYPE):
    key = context.job.data
    game = games.get(key)
    if not game or game["status"] != "registering":
        return
    settings = get_settings(key)
    if len(game["players"]) < settings["min_players"]:
        await context.bot.send_message(
            int(key),
            f"❌ فقط {len(game['players'])} نفر ثبت‌نام کردن، حداقل {settings['min_players']} نفر لازمه. بازی لغو شد.",
        )
        del games[key]
        return
    context.application.create_task(run_round(context, key))


async def handle_join_request(context, chat_key, user):
    game = games.get(chat_key)
    if not game or game["status"] != "registering":
        await context.bot.send_message(user.id, "الان بازی‌ای برای پیوستن وجود نداره.")
        return
    if user.id in game["players"]:
        await context.bot.send_message(user.id, "قبلاً ثبت‌نام کردی، منتظر شروع بازی باش.")
        return
    game["players"][user.id] = {"id": user.id, "name": user.first_name or "بازیکن"}
    dm_context[user.id] = chat_key
    await context.bot.send_message(user.id, f"✅ آماده شدی! (بازیکن {len(game['players'])}) — بعد شروع بازی، اینجا بهت خبر می‌دم.")
    await context.bot.send_message(int(chat_key), f"🕵️ {user.first_name or 'یه نفر'} وارد بازی شد. ({len(game['players'])} نفر)")


# ---------- اجرای کامل یک دور بازی ----------
async def run_round(context, key):
    game = games.get(key)
    if not game:
        return
    game["status"] = "assigning"
    settings = get_settings(key)

    ids = list(game["players"].keys())
    random.shuffle(ids)
    spy_id = ids[0]
    word = random.choice(WORDS)
    game["spy_id"] = spy_id
    game["word"] = word

    for uid in ids:
        if uid == spy_id:
            await context.bot.send_message(
                uid,
                "🕵️ تو جاسوسی!\nکلمه‌ی راز رو نمی‌دونی. با دقت به توصیف‌های بقیه گوش بده و "
                "یه توصیف کلی و مبهم بفرست که لو نری. سعی کن حدس بزنی کلمه چیه.",
            )
        else:
            await context.bot.send_message(
                uid,
                f"🔑 کلمه‌ی راز: «{word}»\nهر وقت خواستی یه توصیف کوتاه درباره‌ی این کلمه بفرست "
                "(بدون اینکه مستقیم اسمش رو بگی). منتظر نوبت نباش، هر لحظه بخوای می‌تونی بفرستی!",
            )

    mentions = " ، ".join(mention_html(uid, game["players"][uid]["name"]) for uid in ids)
    await context.bot.send_message(
        int(key),
        f"🎬 نقش‌ها مشخص شد و کلمه‌ها تو پیوی همه فرستاده شد!\n\n{mentions}\n\n"
        f"📝 حالا هر وقت خواستید (بدون نوبت) توصیفتون رو تو پیوی بات بفرستید، همینجا نشون داده میشه.\n"
        f"⏳ {settings['clue_seconds']} ثانیه فرصت دارید.",
        parse_mode=ParseMode.HTML,
    )

    game["status"] = "clue_phase"
    game["clue_submitted"] = set()
    game["clue_all_event"] = asyncio.Event()

    try:
        await asyncio.wait_for(game["clue_all_event"].wait(), timeout=settings["clue_seconds"])
    except asyncio.TimeoutError:
        pass

    missing = [uid for uid in ids if uid not in game["clue_submitted"]]
    if missing:
        names = "، ".join(game["players"][uid]["name"] for uid in missing)
        await context.bot.send_message(int(key), f"⏰ زمان تموم شد! این‌ها چیزی نفرستادن: {names}")
    else:
        await context.bot.send_message(int(key), "✅ همه توصیفشون رو فرستادن!")

    await start_voting(context, key)


async def start_voting(context, key):
    game = games.get(key)
    if not game:
        return
    settings = get_settings(key)
    game["status"] = "voting"
    game["vote_tally"] = {}
    game["voters"] = set()

    buttons = [
        [InlineKeyboardButton(f"🗳️ {p['name']}", callback_data=f"spyvote_{key}_{uid}")]
        for uid, p in game["players"].items()
    ]
    await context.bot.send_message(
        int(key),
        f"🗳️ وقت رأی‌گیریه! کدوم‌تون فکر می‌کنید جاسوسه؟ ({settings['vote_seconds']} ثانیه وقت دارید)",
        reply_markup=InlineKeyboardMarkup(buttons),
    )
    context.job_queue.run_once(resolve_vote_job, settings["vote_seconds"], data=key, name=f"vote_{key}")


async def resolve_vote_job(context):
    await resolve_vote(context, context.job.data)


async def resolve_vote(context, key):
    game = games.get(key)
    if not game or game["status"] != "voting":
        return
    settings = get_settings(key)
    tally = game["vote_tally"]
    max_votes = 0
    winners = []
    for uid, count in tally.items():
        if count > max_votes:
            max_votes = count
            winners = [uid]
        elif count == max_votes:
            winners.append(uid)

    spy_id = game["spy_id"]
    spy_name = game["players"][spy_id]["name"]
    word = game["word"]

    if len(winners) == 1 and max_votes > 0 and winners[0] == spy_id:
        await context.bot.send_message(
            int(key),
            f"🎯 درست حدس زدید! {spy_name} جاسوس بود.\n"
            f"ولی جاسوس یه فرصت داره کلمه رو حدس بزنه تا برنده بشه...",
        )
        max_attempts = 2 if len(game["players"]) == 3 else 1
        won_by_guess = False
        for attempt in range(max_attempts):
            remaining = max_attempts - attempt
            game["status"] = "guessing"
            try:
                await context.bot.send_message(
                    spy_id,
                    f"🔮 کلمه‌ی راز رو حدس بزن! ({remaining} فرصت باقی مونده) فقط کلمه رو بفرست:",
                )
            except Exception:
                pass
            fut = asyncio.get_event_loop().create_future()
            game["pending_guess_future"] = fut
            try:
                guess = await asyncio.wait_for(fut, timeout=settings["guess_seconds"])
            except asyncio.TimeoutError:
                guess = ""
            game["pending_guess_future"] = None

            if normalize_text(guess) == normalize_text(word):
                won_by_guess = True
                break

        if won_by_guess:
            await context.bot.send_message(int(key), f"😈 {spy_name} کلمه رو درست حدس زد! جاسوس بردددد.\n🔑 کلمه: {word}")
        else:
            await context.bot.send_message(int(key), f"🎉 {spy_name} نتونست کلمه رو حدس بزنه. شهروندان بردن!\n🔑 کلمه: {word}")
    else:
        who = ", ".join(game["players"][w]["name"] for w in winners) if winners else "هیچ‌کس"
        await context.bot.send_message(
            int(key),
            f"❌ رأی‌گیری اشتباه بود (رأی بیشتر به: {who})! جاسوس واقعی {spy_name} بود.\n"
            f"😈 جاسوس بدون اینکه لو بره برد!\n🔑 کلمه: {word}",
        )

    games.pop(key, None)


# ---------- هندلر پیام گروه ----------
async def on_group_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return
    text = normalize_text(update.message.text)
    chat_key = str(update.effective_chat.id)

    if text in TRIGGER_PHRASES:
        await start_registration(context, update.effective_chat.id)
        return

    await handle_settings_command(update, context, chat_key, text)


async def handle_settings_command(update, context, chat_key, text):
    settings = get_settings(chat_key)

    m = re.match(r"^تنظیم\s+زمان\s+ثبت\s*نام\s+(\d+)$", text)
    if m:
        settings["register_minutes"] = int(m.group(1))
        await update.message.reply_text(f"✅ زمان ثبت‌نام روی {settings['register_minutes']} دقیقه تنظیم شد.")
        return

    m = re.match(r"^تنظیم\s+زمان\s+توضیح\s+(\d+)$", text)
    if m:
        settings["clue_seconds"] = int(m.group(1))
        await update.message.reply_text(f"✅ زمان فاز توضیح روی {settings['clue_seconds']} ثانیه تنظیم شد.")
        return

    m = re.match(r"^تنظیم\s+زمان\s+رای\s*گیری\s+(\d+)$", text)
    if m:
        settings["vote_seconds"] = int(m.group(1))
        await update.message.reply_text(f"✅ زمان رأی‌گیری روی {settings['vote_seconds']} ثانیه تنظیم شد.")
        return

    m = re.match(r"^تنظیم\s+زمان\s+حدس\s+(\d+)$", text)
    if m:
        settings["guess_seconds"] = int(m.group(1))
        await update.message.reply_text(f"✅ زمان حدس جاسوس روی {settings['guess_seconds']} ثانیه تنظیم شد.")
        return

    m = re.match(r"^تنظیم\s+حداقل\s+بازیکن\s+(\d+)$", text)
    if m:
        settings["min_players"] = max(3, int(m.group(1)))
        await update.message.reply_text(f"✅ حداقل بازیکن روی {settings['min_players']} نفر تنظیم شد.")
        return

    if text == "تنظیمات":
        await update.message.reply_text(
            "⚙️ تنظیمات فعلی این گروه:\n"
            f"• حداقل بازیکن: {settings['min_players']}\n"
            f"• زمان ثبت‌نام: {settings['register_minutes']} دقیقه\n"
            f"• زمان فاز توضیح: {settings['clue_seconds']} ثانیه\n"
            f"• زمان رأی‌گیری: {settings['vote_seconds']} ثانیه\n"
            f"• زمان حدس جاسوس: {settings['guess_seconds']} ثانیه\n\n"
            "برای تغییر:\n"
            "تنظیم زمان ثبت نام [دقیقه]\n"
            "تنظیم زمان توضیح [ثانیه]\n"
            "تنظیم زمان رای گیری [ثانیه]\n"
            "تنظیم زمان حدس [ثانیه]\n"
            "تنظیم حداقل بازیکن [عدد]"
        )
        return


# ---------- /start ----------
async def on_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.type != "private":
        return
    args = context.args
    if args and args[0].startswith("join_"):
        chat_key = args[0][len("join_"):]
        await handle_join_request(context, chat_key, update.effective_user)
    else:
        await update.message.reply_text("سلام! برای بازی «حدس بزن کی جاسوسه» تو گروه بنویس: جاسوس")


# ---------- پیام‌های پیوی (توصیف‌ها و حدس‌ها، بدون نوبت) ----------
async def on_private_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return
    user_id = update.effective_user.id
    chat_key = dm_context.get(user_id)
    if not chat_key:
        return
    game = games.get(chat_key)
    if not game:
        return

    text = update.message.text.strip()

    if game["status"] == "guessing" and user_id == game.get("spy_id"):
        fut = game.get("pending_guess_future")
        if fut and not fut.done():
            fut.set_result(text)
        return

    if game["status"] == "clue_phase" and user_id in game["players"]:
        if user_id in game["clue_submitted"]:
            await update.message.reply_text("قبلاً توصیفت رو فرستادی، صبر کن نتیجه بیاد.")
            return
        game["clue_submitted"].add(user_id)
        name = game["players"][user_id]["name"]
        await context.bot.send_message(int(chat_key), f"{name} : {text}")
        if len(game["clue_submitted"]) == len(game["players"]):
            game["clue_all_event"].set()


# ---------- دکمه‌های رأی‌گیری ----------
async def on_vote_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    rest = query.data[len("spyvote_"):]
    chat_key, target_id_str = rest.rsplit("_", 1)
    target_id = int(target_id_str)
    game = games.get(chat_key)
    if not game or game["status"] != "voting":
        await query.answer("الان وقت رأی‌گیری نیست.")
        return
    voter_id = query.from_user.id
    if voter_id not in game["players"]:
        await query.answer("شما تو این بازی نیستی.")
        return
    if voter_id in game["voters"]:
        await query.answer("قبلاً رأی دادی!")
        return
    game["voters"].add(voter_id)
    game["vote_tally"][target_id] = game["vote_tally"].get(target_id, 0) + 1
    voter_name = game["players"][voter_id]["name"]
    target_name = game["players"].get(target_id, {}).get("name", "؟")
    await query.answer(f"✅ رأیت برای {target_name} ثبت شد!")
    await context.bot.send_message(int(chat_key), f"🗳️ {voter_name} به {target_name} رأی داد.")


async def post_init(application):
    global bot_username
    me = await application.bot.get_me()
    bot_username = me.username
    print("Bot username:", bot_username)


def main():
    if not BOT_TOKEN:
        print("BOT_TOKEN not set — bot disabled.")
        import time
        while True:
            time.sleep(60)

    app = Application.builder().token(BOT_TOKEN).post_init(post_init).build()

    app.add_handler(CommandHandler("start", on_start))
    app.add_handler(MessageHandler(filters.TEXT & filters.ChatType.GROUPS & ~filters.COMMAND, on_group_message))
    app.add_handler(MessageHandler(filters.TEXT & filters.ChatType.PRIVATE & ~filters.COMMAND, on_private_message))
    app.add_handler(CallbackQueryHandler(on_vote_callback, pattern=r"^spyvote_"))

    print("Spy game bot polling started")
    app.run_polling()


if __name__ == "__main__":
    main()

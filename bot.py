import os
import random
import re
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
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
            self.wfile.write(b"Mafia bot is running.")

        def log_message(self, format, *args):
            pass

    HTTPServer(("0.0.0.0", port), Handler).serve_forever()


threading.Thread(target=start_health_server, daemon=True).start()

# ---------- تنظیمات بازی ----------
MIN_PLAYERS = 4
REGISTER_DURATION = 3 * 60
NIGHT_DURATION = 2 * 60
DAY_DURATION = 2 * 60

MAFIA_DEFS = [
    {"key": "godfather", "name": "پدرخوانده"},
    {"key": "mafia", "name": "مافیای ساده"},
    {"key": "silencer", "name": "خفه‌کننده مافیا"},
]
CITIZEN_SPECIAL_DEFS = [
    {"key": "doctor", "name": "دکتر"},
    {"key": "detective", "name": "کارآگاه"},
    {"key": "bodyguard", "name": "بادیگارد"},
    {"key": "sniper", "name": "تک‌تیرانداز"},
    {"key": "president", "name": "رییس جمهور"},
]
CITIZEN_PLAIN_NAMES = ["روزنامه‌نگار", "معلم", "کاسب", "راننده تاکسی", "آشپز", "نجار"]

games = {}       # chat_key(str) -> game dict
dm_context = {}  # user_id(int) -> chat_key(str)
bot_username = None


def normalize_text(t):
    t = re.sub(r"[\u200c\u200f\u200e\u00a0]", " ", t)
    t = t.replace("ي", "ی").replace("ك", "ک")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def is_mafia_key(key):
    return key in ("godfather", "mafia", "silencer")


def assign_role_defs(n):
    mafia_count = 1 if n <= 5 else (2 if n <= 8 else 3)
    mafia_roles = MAFIA_DEFS[:mafia_count]
    citizens_count = n - mafia_count
    special_count = min(citizens_count, len(CITIZEN_SPECIAL_DEFS))
    special_roles = CITIZEN_SPECIAL_DEFS[:special_count]
    plain_count = citizens_count - special_count
    plain_roles = []
    for i in range(plain_count):
        base = CITIZEN_PLAIN_NAMES[i % len(CITIZEN_PLAIN_NAMES)]
        suffix = f" {i // len(CITIZEN_PLAIN_NAMES) + 1}" if i >= len(CITIZEN_PLAIN_NAMES) else ""
        plain_roles.append({"key": "plain", "name": base + suffix})
    all_roles = mafia_roles + special_roles + plain_roles
    random.shuffle(all_roles)
    return all_roles


def role_instructions(key, name):
    base = f"🎭 نقش تو: {name}\n\nهر وقت خواستی تو گروه به‌عنوان این نقش صحبت کنی، تو همین پیوی بنویس:\nبگو <متن>\n\n"
    if key in ("godfather", "mafia"):
        return base + "شب‌ها می‌تونی رو دکمه‌ی اسم کسی بزنی که مافیا بکشتش.\nهیچ‌کدوم از اعضای مافیا لازم نیست تایید بگیرن، آخرین انتخابی که هر شب زده بشه اجرا میشه."
    if key == "silencer":
        return base + "شب‌ها می‌تونی رو دکمه‌ی اسم کسی بزنی تا ساکتش کنی.\nاون فرد فردا نمی‌تونه با «بگو» صحبت کنه."
    if key == "doctor":
        return base + "شب‌ها می‌تونی رو دکمه‌ی اسم کسی بزنی تا نجاتش بدی.\nاگه همون فرد هدف مافیا باشه، زنده می‌مونه."
    if key == "detective":
        return base + "شب‌ها می‌تونی رو دکمه‌ی اسم کسی بزنی تا استعلام بگیری.\nصبح نتیجه (مافیا هست یا نه) رو برات می‌فرستم."
    if key == "bodyguard":
        return base + "شب‌ها می‌تونی رو دکمه‌ی اسم کسی بزنی تا ازش محافظت کنی.\nاگه مافیا همون فرد رو هدف بگیره، مهاجم مافیا کشته میشه."
    if key == "sniper":
        return base + "فقط یه بار تو کل بازی می‌تونی رو دکمه‌ی اسم کسی بزنی و بهش شلیک کنی.\nاگه درست حدس بزنی (مافیا باشه) اون می‌میره، وگرنه خودت می‌میری."
    if key == "president":
        return base + "تو رأی‌گیری روز معمولاً ۱ رأی داری، ولی هر ۲ روز یک‌بار ۲ رأی می‌گیری (می‌تونی هر دو رو به یه نفر بدی یا بین دو نفر تقسیم کنی). رأی‌گیری با دکمه زیر پیام لیست بازیکن‌هاست."
    return base + "قدرت خاصی نداری، ولی رأیت تو اعدام روز مهمه. با هوش گوش کن و مافیا رو پیدا کن!"


ACTION_LABELS = {
    "kill": "🔪 کشتن",
    "silence": "🤐 ساکت کردن",
    "save": "💉 نجات دادن",
    "investigate": "🔍 استعلام گرفتن از",
    "protect": "🛡️ محافظت از",
    "snipe": "🎯 شلیک به",
}
ROLE_TO_ACTION = {
    "godfather": "kill",
    "mafia": "kill",
    "silencer": "silence",
    "doctor": "save",
    "detective": "investigate",
    "bodyguard": "protect",
    "sniper": "snipe",
}


def alive_players(game):
    return [p for p in game["players"].values() if p["alive"]]


# ---------- شروع ثبت‌نام ----------
async def start_registration(context: ContextTypes.DEFAULT_TYPE, chat_id):
    key = str(chat_id)
    existing = games.get(key)
    if existing and existing["status"] != "ended":
        await context.bot.send_message(chat_id, "یه بازی مافیا همین الان در جریانه یا در حال ثبت‌نامه!")
        return

    game = {
        "chat_id": key,
        "status": "registering",
        "players": {},
        "night_number": 0,
        "night_actions": {},
    }
    games[key] = game

    join_url = f"https://t.me/{bot_username}?start=join_{key}" if bot_username else None
    markup = None
    if join_url:
        markup = InlineKeyboardMarkup([[InlineKeyboardButton("🎭 ورود به بازی", url=join_url)]])

    await context.bot.send_message(
        chat_id,
        f"🕵️ بازی مافیا شروع شد!\nبرای پیوستن دکمه زیر رو بزن (میره تو پیوی بات).\n"
        f"حداقل {MIN_PLAYERS} نفر لازمه، {REGISTER_DURATION // 60} دقیقه وقت داری.",
        reply_markup=markup,
    )

    context.job_queue.run_once(finish_registration_job, REGISTER_DURATION, data=key, name=f"reg_{key}")


async def finish_registration_job(context: ContextTypes.DEFAULT_TYPE):
    key = context.job.data
    game = games.get(key)
    if not game or game["status"] != "registering":
        return
    if len(game["players"]) < MIN_PLAYERS:
        await context.bot.send_message(int(key), f"❌ فقط {len(game['players'])} نفر ثبت‌نام کردن، حداقل {MIN_PLAYERS} نفر لازمه. بازی لغو شد.")
        del games[key]
        return
    await assign_roles_and_start(context, key)


async def assign_roles_and_start(context, key):
    game = games[key]
    ids = list(game["players"].keys())
    random.shuffle(ids)
    roles = assign_role_defs(len(ids))

    for uid, r in zip(ids, roles):
        p = game["players"][uid]
        p["role"] = r["name"]
        p["role_key"] = r["key"]
        p["is_mafia"] = is_mafia_key(r["key"])
        p["alive"] = True
        p["silenced_today"] = False
        if r["key"] == "sniper":
            p["sniper_used"] = False
        if r["key"] == "president":
            p["president_cooldown"] = 0
        await context.bot.send_message(uid, role_instructions(r["key"], r["name"]))

    mafia_ids = [uid for uid in ids if game["players"][uid]["is_mafia"]]
    if len(mafia_ids) > 1:
        listing = "\n".join(f"{game['players'][uid]['name']} ({game['players'][uid]['role']})" for uid in mafia_ids)
        for uid in mafia_ids:
            await context.bot.send_message(uid, f"👥 اعضای تیم مافیا:\n{listing}")

    await context.bot.send_message(int(key), f"✅ بازی با {len(ids)} نفر شروع شد! نقش‌ها تو پیوی هرکس ارسال شد.")
    await start_night(context, key)


async def send_night_prompts(context, key):
    game = games[key]
    alive = alive_players(game)
    for p in alive:
        action = ROLE_TO_ACTION.get(p["role_key"])
        if not action:
            continue
        if p["role_key"] == "sniper" and p.get("sniper_used"):
            continue
        buttons = [[InlineKeyboardButton(t["name"], callback_data=f"night_{action}_{key}_{t['id']}")] for t in alive]
        await context.bot.send_message(
            p["id"], f"🌙 {ACTION_LABELS[action]} کی؟ رو اسمش بزن:",
            reply_markup=InlineKeyboardMarkup(buttons),
        )


async def start_night(context, key):
    game = games.get(key)
    if not game:
        return
    game["status"] = "night"
    game["night_number"] += 1
    game["night_actions"] = {}
    await context.bot.send_message(int(key), f"🌙 شب {game['night_number']} شد. همه‌چیز تو پیوی انجام میشه... ({NIGHT_DURATION // 60} دقیقه)")
    await send_night_prompts(context, key)
    context.job_queue.run_once(resolve_night_job, NIGHT_DURATION, data=key, name=f"night_{key}")


async def resolve_night_job(context):
    await resolve_night(context, context.job.data)


async def resolve_night(context, key):
    game = games.get(key)
    if not game:
        return
    na = game["night_actions"]
    lines = []
    deaths = set()

    kill_target = na.get("mafia_kill_target")
    if kill_target:
        bg_target = na.get("bodyguard_protect_target")
        doc_target = na.get("doctor_save_target")
        if bg_target and bg_target == kill_target:
            actor = na.get("mafia_actor_id")
            if actor:
                deaths.add(actor)
            lines.append(f"🛡️ بادیگارد جلوی حمله به {game['players'][kill_target]['name']} رو گرفت و مهاجم مافیا کشته شد!")
        elif doc_target and doc_target == kill_target:
            lines.append(f"💉 دکتر {game['players'][kill_target]['name']} رو نجات داد!")
        else:
            deaths.add(kill_target)

    sniper_target = na.get("sniper_target")
    sniper_user = na.get("sniper_user_id")
    if sniper_target and sniper_user:
        t = game["players"].get(sniper_target)
        if t and t["is_mafia"]:
            deaths.add(sniper_target)
            lines.append(f"🎯 تک‌تیرانداز درست حدس زد، {t['name']} (مافیا) کشته شد!")
        else:
            deaths.add(sniper_user)
            lines.append("🎯 تک‌تیرانداز اشتباه شلیک کرد و خودش کشته شد!")

    silence_target = na.get("silencer_target")
    if silence_target:
        sp = game["players"].get(silence_target)
        if sp:
            sp["silenced_today"] = True
            lines.append("🤐 یه نفر امشب توسط مافیا ساکت شد (فردا نمی‌تونه پیام بده).")

    if not deaths:
        lines.insert(0, "😌 دیشب کسی کشته نشد.")
    else:
        for uid in deaths:
            p = game["players"].get(uid)
            if p and p["alive"]:
                p["alive"] = False
                lines.append(f"💀 {p['name']} (نقش: {p['role']}) کشته شد.")

    await context.bot.send_message(int(key), "☀️ صبح شد!\n\n" + "\n".join(lines))

    det_target = na.get("detective_target")
    det_user = na.get("detective_user_id")
    if det_target and det_user:
        tp = game["players"].get(det_target)
        if tp:
            result = "مافیاست! 🔴" if tp["is_mafia"] else "مافیا نیست ✅"
            await context.bot.send_message(det_user, f"🔍 نتیجه استعلام {tp['name']}: {result}")

    if await check_win(context, key):
        return
    await start_day(context, key)


async def start_day(context, key):
    game = games.get(key)
    if not game:
        return
    game["status"] = "day"
    game["vote_tally"] = {}
    game["vote_tokens"] = {}

    alive = alive_players(game)
    for p in alive:
        tokens = 1
        if p["role_key"] == "president":
            if p.get("president_cooldown", 0) <= 0:
                tokens = 2
                p["president_cooldown"] = 2
            else:
                p["president_cooldown"] -= 1
        game["vote_tokens"][p["id"]] = tokens

    buttons = [[InlineKeyboardButton(f"🗳️ {p['name']}", callback_data=f"vote_{key}_{p['id']}")] for p in alive]
    await context.bot.send_message(
        int(key),
        f"☀️ روز {game['night_number']} شد! وقت رأی‌گیریه ({DAY_DURATION // 60} دقیقه). رو اسم کسی که می‌خواید اعدام بشه بزنید:",
        reply_markup=InlineKeyboardMarkup(buttons),
    )
    context.job_queue.run_once(resolve_day_job, DAY_DURATION, data=key, name=f"day_{key}")


async def resolve_day_job(context):
    await resolve_day(context, context.job.data)


async def resolve_day(context, key):
    game = games.get(key)
    if not game:
        return
    tally = game.get("vote_tally", {})
    max_votes = 0
    winners = []
    for uid, count in tally.items():
        if count > max_votes:
            max_votes = count
            winners = [uid]
        elif count == max_votes:
            winners.append(uid)

    if len(winners) == 1 and max_votes > 0:
        p = game["players"][winners[0]]
        p["alive"] = False
        await context.bot.send_message(int(key), f"⚖️ {p['name']} با {max_votes} رأی اعدام شد. نقشش: {p['role']}")
    else:
        await context.bot.send_message(int(key), "⚖️ رأی‌گیری بدون نتیجه تموم شد (مساوی یا بدون رأی)، امروز کسی اعدام نشد.")

    for p in game["players"].values():
        p["silenced_today"] = False

    if await check_win(context, key):
        return
    await start_night(context, key)


async def check_win(context, key):
    game = games.get(key)
    if not game:
        return True
    alive = alive_players(game)
    mafia_alive = sum(1 for p in alive if p["is_mafia"])
    citizens_alive = len(alive) - mafia_alive
    if mafia_alive == 0:
        await end_game(context, key, "🎉 شهروندان بردن! همه‌ی مافیاها حذف شدن.")
        return True
    if mafia_alive >= citizens_alive:
        await end_game(context, key, "🔪 مافیا برد! تعداد مافیاها به شهروندا رسید یا بیشتر شد.")
        return True
    return False


async def end_game(context, key, text):
    game = games.get(key)
    if not game:
        return
    role_list = "\n".join(
        f"{p['name']}: {p['role']}" + (" (زنده ماند)" if p["alive"] else " (حذف شد)")
        for p in game["players"].values()
    )
    await context.bot.send_message(int(key), f"{text}\n\n📋 نقش همه:\n{role_list}")
    for uid in game["players"].keys():
        dm_context.pop(uid, None)
    games.pop(key, None)


async def handle_join_request(context, chat_key, user):
    game = games.get(chat_key)
    if not game or game["status"] != "registering":
        await context.bot.send_message(user.id, "الان بازی‌ای برای پیوستن وجود نداره.")
        return
    if user.id in game["players"]:
        await context.bot.send_message(user.id, "قبلاً ثبت‌نام کردی، منتظر شروع بازی باش.")
        return
    game["players"][user.id] = {
        "id": user.id,
        "name": user.first_name or "بازیکن",
        "alive": True,
    }
    dm_context[user.id] = chat_key
    await context.bot.send_message(user.id, f"✅ آماده شدی! (بازیکن {len(game['players'])}) — بعد شروع بازی، نقشت همینجا برات میاد.")
    await context.bot.send_message(int(chat_key), f"🎭 {user.first_name or 'یه نفر'} وارد بازی مافیا شد. ({len(game['players'])} نفر)")


# ---------- هندلر پیام گروه ----------
async def on_group_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return
    text = normalize_text(update.message.text)
    if text in ("مافیا", "مافیا بازی", "بازی مافیا"):
        await start_registration(context, update.effective_chat.id)


# ---------- /start ----------
async def on_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if update.effective_chat.type != "private":
        return
    args = context.args
    if args and args[0].startswith("join_"):
        chat_key = args[0][len("join_"):]
        await handle_join_request(context, chat_key, update.effective_user)
    else:
        await update.message.reply_text("سلام! برای بازی مافیا تو گروه بنویس: مافیا")


# ---------- پیام‌های پیوی ----------
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
    player = game["players"].get(user_id)
    if not player or not player.get("alive") or not player.get("role"):
        return

    raw = update.message.text
    text = normalize_text(raw)

    if text.startswith("بگو "):
        if player.get("silenced_today"):
            await update.message.reply_text("🤐 الان ساکت شدی و نمی‌تونی صحبت کنی.")
            return
        say = raw.split(" ", 1)[1] if " " in raw else ""
        await context.bot.send_message(int(chat_key), f"{player['role']} : {say}")
        return


# ---------- دکمه‌های رأی‌گیری روز ----------
async def on_vote_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    rest = query.data[len("vote_"):]
    chat_key, target_id_str = rest.rsplit("_", 1)
    target_id = int(target_id_str)
    game = games.get(chat_key)
    if not game or game["status"] != "day":
        await query.answer("الان وقت رأی‌گیری نیست.")
        return
    voter = game["players"].get(query.from_user.id)
    if not voter or not voter.get("alive"):
        await query.answer("شما تو بازی نیستی یا حذف شدی.")
        return
    tokens = game["vote_tokens"].get(voter["id"], 0)
    if tokens <= 0:
        await query.answer("رأی‌هات تموم شده.")
        return
    game["vote_tokens"][voter["id"]] = tokens - 1
    game["vote_tally"][target_id] = game["vote_tally"].get(target_id, 0) + 1
    target_name = game["players"].get(target_id, {}).get("name", "؟")
    await query.answer(f"رأیت برای {target_name} ثبت شد! ({tokens - 1} رأی باقی مونده)")


# ---------- دکمه‌های اقدام شب ----------
async def on_night_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    parts = query.data.split("_")
    action, chat_key, target_id = parts[1], parts[2], int(parts[3])
    game = games.get(chat_key)
    if not game or game["status"] != "night":
        await query.answer("الان شب نیست.")
        return
    player = game["players"].get(query.from_user.id)
    if not player or not player.get("alive"):
        await query.answer("شما تو بازی نیستی یا حذف شدی.")
        return
    target = game["players"].get(target_id)
    if not target or not target.get("alive"):
        await query.answer("این بازیکن دیگه زنده نیست.")
        return

    na = game["night_actions"]

    if action == "kill":
        if player["role_key"] not in ("godfather", "mafia"):
            await query.answer("این کار برای نقش تو نیست.")
            return
        na["mafia_kill_target"] = target_id
        na["mafia_actor_id"] = player["id"]
        await query.answer(f"✅ {target['name']} رو برای کشتن انتخاب کردی.")
    elif action == "silence":
        if player["role_key"] != "silencer":
            await query.answer("این کار برای نقش تو نیست.")
            return
        na["silencer_target"] = target_id
        await query.answer(f"✅ {target['name']} رو امشب ساکت می‌کنی.")
    elif action == "save":
        if player["role_key"] != "doctor":
            await query.answer("این کار برای نقش تو نیست.")
            return
        na["doctor_save_target"] = target_id
        await query.answer(f"✅ امشب {target['name']} رو نجات می‌دی.")
    elif action == "investigate":
        if player["role_key"] != "detective":
            await query.answer("این کار برای نقش تو نیست.")
            return
        na["detective_target"] = target_id
        na["detective_user_id"] = player["id"]
        await query.answer(f"✅ فردا صبح نتیجه استعلام {target['name']} میاد.")
    elif action == "protect":
        if player["role_key"] != "bodyguard":
            await query.answer("این کار برای نقش تو نیست.")
            return
        na["bodyguard_protect_target"] = target_id
        await query.answer(f"✅ امشب از {target['name']} محافظت می‌کنی.")
    elif action == "snipe":
        if player["role_key"] != "sniper" or player.get("sniper_used"):
            await query.answer("این کار برای نقش تو نیست یا قبلاً استفاده کردی.")
            return
        player["sniper_used"] = True
        na["sniper_target"] = target_id
        na["sniper_user_id"] = player["id"]
        await query.answer(f"🎯 به {target['name']} شلیک کردی!")


async def on_callback_query(update, context):
    data = update.callback_query.data or ""
    if data.startswith("vote_"):
        await on_vote_callback(update, context)
    elif data.startswith("night_"):
        await on_night_callback(update, context)


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
    app.add_handler(CallbackQueryHandler(on_callback_query))

    print("Mafia bot polling started")
    app.run_polling()


if __name__ == "__main__":
    main()

const express = require("express");
const TelegramBot = require("node-telegram-bot-api");

const app = express();
app.get("/", (req, res) => res.send("Mafia bot is running."));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("HTTP server on port " + PORT));

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.log("BOT_TOKEN not set — bot disabled.");
} else {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });

  // ---------- تنظیمات بازی ----------
  const MIN_PLAYERS = 4;
  const REGISTER_DURATION_MS = 3 * 60 * 1000;
  const NIGHT_DURATION_MS = 2 * 60 * 1000;
  const DAY_DURATION_MS = 2 * 60 * 1000;

  const MAFIA_DEFS = [
    { key: "godfather", name: "پدرخوانده" },
    { key: "mafia", name: "مافیای ساده" },
    { key: "silencer", name: "خفه‌کننده مافیا" },
  ];
  const CITIZEN_SPECIAL_DEFS = [
    { key: "doctor", name: "دکتر" },
    { key: "detective", name: "کارآگاه" },
    { key: "bodyguard", name: "بادیگارد" },
    { key: "sniper", name: "تک‌تیرانداز" },
    { key: "president", name: "رییس جمهور" },
  ];
  const CITIZEN_PLAIN_NAMES = ["روزنامه‌نگار", "معلم", "کاسب", "راننده تاکسی", "آشپز", "نجار"];

  const games = new Map(); // chatId(string) -> game
  const dmContext = new Map(); // userId(number) -> chatId(string)
  let botUsername = null;
  bot.getMe().then((me) => { botUsername = me.username; });

  function normalizeText(t) {
    return t
      .replace(/[\u200c\u200f\u200e\u00a0]/g, " ")
      .replace(/ي/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/\s+/g, " ")
      .trim();
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function assignRoleDefs(n) {
    const mafiaCount = n <= 5 ? 1 : n <= 8 ? 2 : 3;
    const mafiaRoles = MAFIA_DEFS.slice(0, mafiaCount);
    const citizensCount = n - mafiaCount;
    const specialCount = Math.min(citizensCount, CITIZEN_SPECIAL_DEFS.length);
    const specialRoles = CITIZEN_SPECIAL_DEFS.slice(0, specialCount);
    const plainCount = citizensCount - specialCount;
    const plainRoles = [];
    for (let i = 0; i < plainCount; i++) {
      const base = CITIZEN_PLAIN_NAMES[i % CITIZEN_PLAIN_NAMES.length];
      const suffix = i >= CITIZEN_PLAIN_NAMES.length ? " " + (Math.floor(i / CITIZEN_PLAIN_NAMES.length) + 1) : "";
      plainRoles.push({ key: "plain", name: base + suffix });
    }
    return shuffle([...mafiaRoles, ...specialRoles, ...plainRoles]);
  }

  function isMafiaKey(key) {
    return key === "godfather" || key === "mafia" || key === "silencer";
  }

  function roleInstructions(key, name) {
    const base = `🎭 نقش تو: ${name}\n\nهر وقت خواستی تو گروه به‌عنوان این نقش صحبت کنی، تو همین پیوی بنویس:\nبگو <متن>\n\n`;
    switch (key) {
      case "godfather":
      case "mafia":
        return base + `شب‌ها می‌تونی بنویسی: بکش <اسم بازیکن>\nهیچ‌کدوم از اعضای مافیا لازم نیست تایید بگیرن، آخرین دستوری که هر شب زده بشه اجرا میشه.`;
      case "silencer":
        return base + `شب‌ها می‌تونی بنویسی: ساکت کن <اسم بازیکن>\nاون فرد فردا نمی‌تونه با «بگو» صحبت کنه.`;
      case "doctor":
        return base + `شب‌ها می‌تونی بنویسی: نجات بده <اسم بازیکن>\nاگه همون فرد هدف مافیا باشه، زنده می‌مونه.`;
      case "detective":
        return base + `شب‌ها می‌تونی بنویسی: استعلام <اسم بازیکن>\nصبح نتیجه (مافیا هست یا نه) رو برات می‌فرستم.`;
      case "bodyguard":
        return base + `شب‌ها می‌تونی بنویسی: محافظت کن <اسم بازیکن>\nاگه مافیا همون فرد رو هدف بگیره، مهاجم مافیا کشته میشه.`;
      case "sniper":
        return base + `فقط یه بار تو کل بازی می‌تونی بنویسی: شلیک کن <اسم بازیکن>\nاگه درست حدس بزنی (مافیا باشه) اون می‌میره، وگرنه خودت می‌میری.`;
      case "president":
        return base + `تو رأی‌گیری روز معمولاً ۱ رأی داری، ولی هر ۲ روز یک‌بار ۲ رأی می‌گیری (می‌تونی هر دو رو به یه نفر بدی یا بین دو نفر تقسیم کنی). رأی‌گیری با دکمه زیر پیام لیست بازیکن‌هاست.`;
      default:
        return base + `قدرت خاصی نداری، ولی رأیت تو اعدام روز مهمه. با هوش گوش کن و مافیا رو پیدا کن!`;
    }
  }

  // ---------- شروع بازی از گروه ----------
  function startRegistration(chatId) {
    const key = String(chatId);
    const existing = games.get(key);
    if (existing && existing.status !== "ended") {
      bot.sendMessage(chatId, "یه بازی مافیا همین الان در جریانه یا در حال ثبت‌نامه!");
      return;
    }
    const game = {
      chatId: key,
      status: "registering",
      players: new Map(), // userId(number) -> player
      nightNumber: 0,
      nightActions: {},
      registerTimer: null,
      phaseTimer: null,
    };
    games.set(key, game);

    const joinUrl = botUsername
      ? `https://t.me/${botUsername}?start=join_${key}`
      : null;

    bot.sendMessage(
      chatId,
      `🕵️ بازی مافیا شروع شد!\nبرای پیوستن دکمه زیر رو بزن (میره تو پیوی بات).\nحداقل ${MIN_PLAYERS} نفر لازمه، ${REGISTER_DURATION_MS / 60000} دقیقه وقت داری.`,
      joinUrl ? { reply_markup: { inline_keyboard: [[{ text: "🎭 ورود به بازی", url: joinUrl }]] } } : undefined
    );

    game.registerTimer = setTimeout(() => finishRegistration(key), REGISTER_DURATION_MS);
  }

  function finishRegistration(key) {
    const game = games.get(key);
    if (!game || game.status !== "registering") return;
    if (game.players.size < MIN_PLAYERS) {
      bot.sendMessage(key, `❌ فقط ${game.players.size} نفر ثبت‌نام کردن، حداقل ${MIN_PLAYERS} نفر لازمه. بازی لغو شد.`);
      games.delete(key);
      return;
    }
    assignRolesAndStart(key);
  }

  function assignRolesAndStart(key) {
    const game = games.get(key);
    const ids = shuffle([...game.players.keys()]);
    const roles = assignRoleDefs(ids.length);

    ids.forEach((id, i) => {
      const r = roles[i];
      const p = game.players.get(id);
      p.role = r.name;
      p.roleKey = r.key;
      p.isMafia = isMafiaKey(r.key);
      p.alive = true;
      p.silencedToday = false;
      if (r.key === "sniper") p.sniperUsed = false;
      if (r.key === "president") p.presidentCooldown = 0;
      bot.sendMessage(id, roleInstructions(r.key, r.name));
    });

    const mafiaIds = ids.filter((id) => game.players.get(id).isMafia);
    if (mafiaIds.length > 1) {
      const list = mafiaIds.map((id) => `${game.players.get(id).name} (${game.players.get(id).role})`).join("\n");
      mafiaIds.forEach((id) => bot.sendMessage(id, `👥 اعضای تیم مافیا:\n${list}`));
    }

    bot.sendMessage(key, `✅ بازی با ${ids.length} نفر شروع شد! نقش‌ها تو پیوی هرکس ارسال شد.`);
    startNight(key);
  }

  const ACTION_LABELS = {
    kill: "🔪 کشتن",
    silence: "🤐 ساکت کردن",
    save: "💉 نجات دادن",
    investigate: "🔍 استعلام گرفتن از",
    protect: "🛡️ محافظت از",
    snipe: "🎯 شلیک به",
  };
  const ROLE_TO_ACTION = {
    godfather: "kill",
    mafia: "kill",
    silencer: "silence",
    doctor: "save",
    detective: "investigate",
    bodyguard: "protect",
    sniper: "snipe",
  };

  function sendNightPrompts(key) {
    const game = games.get(key);
    if (!game) return;
    const alive = [...game.players.values()].filter((p) => p.alive);
    for (const p of alive) {
      const action = ROLE_TO_ACTION[p.roleKey];
      if (!action) continue;
      if (p.roleKey === "sniper" && p.sniperUsed) continue;
      const buttons = alive.map((t) => [{ text: t.name, callback_data: `night_${action}_${key}_${t.id}` }]);
      bot.sendMessage(p.id, `🌙 ${ACTION_LABELS[action]} کی؟ رو اسمش بزن:`, {
        reply_markup: { inline_keyboard: buttons },
      });
    }
  }

  // ---------- شب ----------
  function startNight(key) {
    const game = games.get(key);
    if (!game) return;
    game.status = "night";
    game.nightNumber++;
    game.nightActions = {};
    bot.sendMessage(key, `🌙 شب ${game.nightNumber} شد. همه‌چیز تو پیوی انجام میشه... (${NIGHT_DURATION_MS / 60000} دقیقه)`);
    sendNightPrompts(key);
    game.phaseTimer = setTimeout(() => resolveNight(key), NIGHT_DURATION_MS);
  }

  function resolveNight(key) {
    const game = games.get(key);
    if (!game) return;
    const na = game.nightActions;
    const lines = [];
    const deaths = new Set();

    if (na.mafiaKillTarget) {
      const targetId = na.mafiaKillTarget;
      if (na.bodyguardProtectTarget && na.bodyguardProtectTarget === targetId) {
        if (na.mafiaActorId) deaths.add(na.mafiaActorId);
        lines.push(`🛡️ بادیگارد جلوی حمله به ${game.players.get(targetId).name} رو گرفت و مهاجم مافیا کشته شد!`);
      } else if (na.doctorSaveTarget && na.doctorSaveTarget === targetId) {
        lines.push(`💉 دکتر ${game.players.get(targetId).name} رو نجات داد!`);
      } else {
        deaths.add(targetId);
      }
    }

    if (na.sniperTarget && na.sniperUserId) {
      const t = game.players.get(na.sniperTarget);
      if (t && t.isMafia) {
        deaths.add(na.sniperTarget);
        lines.push(`🎯 تک‌تیرانداز درست حدس زد، ${t.name} (مافیا) کشته شد!`);
      } else {
        deaths.add(na.sniperUserId);
        lines.push(`🎯 تک‌تیرانداز اشتباه شلیک کرد و خودش کشته شد!`);
      }
    }

    if (na.silencerTarget) {
      const sp = game.players.get(na.silencerTarget);
      if (sp) {
        sp.silencedToday = true;
        lines.push(`🤐 یه نفر امشب توسط مافیا ساکت شد (فردا نمی‌تونه پیام بده).`);
      }
    }

    if (deaths.size === 0) {
      lines.unshift("😌 دیشب کسی کشته نشد.");
    } else {
      for (const id of deaths) {
        const p = game.players.get(id);
        if (p && p.alive) {
          p.alive = false;
          lines.push(`💀 ${p.name} (نقش: ${p.role}) کشته شد.`);
        }
      }
    }

    bot.sendMessage(key, `☀️ صبح شد!\n\n${lines.join("\n")}`);

    if (na.detectiveTarget && na.detectiveUserId) {
      const tp = game.players.get(na.detectiveTarget);
      if (tp) {
        bot.sendMessage(
          na.detectiveUserId,
          `🔍 نتیجه استعلام ${tp.name}: ${tp.isMafia ? "مافیاست! 🔴" : "مافیا نیست ✅"}`
        );
      }
    }

    if (checkWin(key)) return;
    startDay(key);
  }

  // ---------- روز ----------
  function startDay(key) {
    const game = games.get(key);
    if (!game) return;
    game.status = "day";
    game.voteTally = new Map();
    game.voteTokens = new Map();

    const alive = [...game.players.values()].filter((p) => p.alive);
    alive.forEach((p) => {
      let tokens = 1;
      if (p.roleKey === "president") {
        if (p.presidentCooldown <= 0) {
          tokens = 2;
          p.presidentCooldown = 2;
        } else {
          p.presidentCooldown--;
        }
      }
      game.voteTokens.set(p.id, tokens);
    });

    const buttons = alive.map((p) => [{ text: `🗳️ ${p.name}`, callback_data: `vote_${key}_${p.id}` }]);
    bot.sendMessage(
      key,
      `☀️ روز ${game.nightNumber} شد! وقت رأی‌گیریه (${DAY_DURATION_MS / 60000} دقیقه). رو اسم کسی که می‌خواید اعدام بشه بزنید:`,
      { reply_markup: { inline_keyboard: buttons } }
    );

    game.phaseTimer = setTimeout(() => resolveDay(key), DAY_DURATION_MS);
  }

  function resolveDay(key) {
    const game = games.get(key);
    if (!game) return;
    const tally = game.voteTally || new Map();
    let maxVotes = 0;
    let winners = [];
    for (const [id, count] of tally) {
      if (count > maxVotes) {
        maxVotes = count;
        winners = [id];
      } else if (count === maxVotes) {
        winners.push(id);
      }
    }

    if (winners.length === 1 && maxVotes > 0) {
      const p = game.players.get(winners[0]);
      p.alive = false;
      bot.sendMessage(key, `⚖️ ${p.name} با ${maxVotes} رأی اعدام شد. نقشش: ${p.role}`);
    } else {
      bot.sendMessage(key, `⚖️ رأی‌گیری بدون نتیجه تموم شد (مساوی یا بدون رأی)، امروز کسی اعدام نشد.`);
    }

    for (const p of game.players.values()) p.silencedToday = false;

    if (checkWin(key)) return;
    startNight(key);
  }

  function checkWin(key) {
    const game = games.get(key);
    if (!game) return true;
    const alive = [...game.players.values()].filter((p) => p.alive);
    const mafiaAlive = alive.filter((p) => p.isMafia).length;
    const citizensAlive = alive.length - mafiaAlive;
    if (mafiaAlive === 0) {
      endGame(key, "🎉 شهروندان بردن! همه‌ی مافیاها حذف شدن.");
      return true;
    }
    if (mafiaAlive >= citizensAlive) {
      endGame(key, "🔪 مافیا برد! تعداد مافیاها به شهروندا رسید یا بیشتر شد.");
      return true;
    }
    return false;
  }

  function endGame(key, text) {
    const game = games.get(key);
    if (!game) return;
    clearTimeout(game.phaseTimer);
    clearTimeout(game.registerTimer);
    const roleList = [...game.players.values()]
      .map((p) => `${p.name}: ${p.role}${p.alive ? " (زنده ماند)" : " (حذف شد)"}`)
      .join("\n");
    bot.sendMessage(key, `${text}\n\n📋 نقش همه:\n${roleList}`);
    for (const id of game.players.keys()) dmContext.delete(id);
    games.delete(key);
  }

  // ---------- ورود بازیکن از دکمه ----------
  function handleJoinRequest(chatKey, from) {
    const game = games.get(chatKey);
    if (!game || game.status !== "registering") {
      bot.sendMessage(from.id, "الان بازی‌ای برای پیوستن وجود نداره.");
      return;
    }
    if (game.players.has(from.id)) {
      bot.sendMessage(from.id, "قبلاً ثبت‌نام کردی، منتظر شروع بازی باش.");
      return;
    }
    game.players.set(from.id, { id: from.id, name: from.first_name || "بازیکن" });
    dmContext.set(from.id, chatKey);
    bot.sendMessage(from.id, `✅ آماده شدی! (بازیکن ${game.players.size}) — بعد شروع بازی، نقشت همینجا برات میاد.`);
    bot.sendMessage(chatKey, `🎭 ${from.first_name || "یه نفر"} وارد بازی مافیا شد. (${game.players.size} نفر)`);
  }

  // ---------- پیام‌های گروه ----------
  bot.on("message", (msg) => {
    if (!msg.text) return;
    if (msg.chat.type !== "group" && msg.chat.type !== "supergroup") return;
    const text = normalizeText(msg.text);
    if (text === "مافیا" || text === "مافیا بازی" || text === "بازی مافیا") {
      startRegistration(msg.chat.id);
    }
  });

  // ---------- دستور /start (شامل دیپ‌لینک پیوستن) ----------
  bot.onText(/^\/start(?:\s+(.+))?$/, (msg, match) => {
    if (msg.chat.type !== "private") return;
    const payload = match && match[1];
    if (payload && payload.startsWith("join_")) {
      const chatKey = payload.slice(5);
      handleJoinRequest(chatKey, msg.from);
    } else {
      bot.sendMessage(msg.chat.id, "سلام! برای بازی مافیا تو گروه بنویس: مافیا بازی");
    }
  });

  // ---------- پیام‌های پیوی (بگو / دستورهای شب) ----------
  bot.on("message", (msg) => {
    if (!msg.text || msg.chat.type !== "private") return;
    if (msg.text.startsWith("/start")) return;
    const userId = msg.from.id;
    const chatKey = dmContext.get(userId);
    if (!chatKey) return;
    const game = games.get(chatKey);
    if (!game) return;
    const player = game.players.get(userId);
    if (!player || !player.alive || !player.role) return;

    const text = normalizeText(msg.text);

    if (text.startsWith("بگو ")) {
      if (player.silencedToday) {
        bot.sendMessage(userId, "🤐 الان ساکت شدی و نمی‌تونی صحبت کنی.");
        return;
      }
      const say = msg.text.slice(msg.text.indexOf(" ") + 1);
      bot.sendMessage(chatKey, `${player.role} : ${say}`);
      return;
    }

    if (game.status !== "night") return;

    function findTarget(nameQuery) {
      const q = normalizeText(nameQuery);
      const alive = [...game.players.values()].filter((p) => p.alive);
      return alive.find((p) => normalizeText(p.name) === q) || alive.find((p) => normalizeText(p.name).includes(q));
    }

    if ((player.roleKey === "godfather" || player.roleKey === "mafia") && text.startsWith("بکش ")) {
      const target = findTarget(text.slice(4));
      if (!target) return bot.sendMessage(userId, "❌ همچین بازیکنی پیدا نشد.");
      game.nightActions.mafiaKillTarget = target.id;
      game.nightActions.mafiaActorId = userId;
      bot.sendMessage(userId, `✅ امشب ${target.name} رو برای کشتن انتخاب کردی.`);
      return;
    }
    if (player.roleKey === "silencer" && text.startsWith("ساکت کن ")) {
      const target = findTarget(text.slice(8));
      if (!target) return bot.sendMessage(userId, "❌ همچین بازیکنی پیدا نشد.");
      game.nightActions.silencerTarget = target.id;
      bot.sendMessage(userId, `✅ ${target.name} رو امشب ساکت می‌کنی.`);
      return;
    }
    if (player.roleKey === "doctor" && text.startsWith("نجات بده ")) {
      const target = findTarget(text.slice(9));
      if (!target) return bot.sendMessage(userId, "❌ همچین بازیکنی پیدا نشد.");
      game.nightActions.doctorSaveTarget = target.id;
      bot.sendMessage(userId, `✅ امشب ${target.name} رو نجات می‌دی.`);
      return;
    }
    if (player.roleKey === "detective" && text.startsWith("استعلام ")) {
      const target = findTarget(text.slice(8));
      if (!target) return bot.sendMessage(userId, "❌ همچین بازیکنی پیدا نشد.");
      game.nightActions.detectiveTarget = target.id;
      game.nightActions.detectiveUserId = userId;
      bot.sendMessage(userId, `✅ فردا صبح نتیجه استعلام ${target.name} برات میاد.`);
      return;
    }
    if (player.roleKey === "bodyguard" && text.startsWith("محافظت کن ")) {
      const target = findTarget(text.slice(11));
      if (!target) return bot.sendMessage(userId, "❌ همچین بازیکنی پیدا نشد.");
      game.nightActions.bodyguardProtectTarget = target.id;
      bot.sendMessage(userId, `✅ امشب از ${target.name} محافظت می‌کنی.`);
      return;
    }
    if (player.roleKey === "sniper" && text.startsWith("شلیک کن ")) {
      if (player.sniperUsed) return bot.sendMessage(userId, "❌ قبلاً از قدرتت استفاده کردی، فقط یه بار داری.");
      const target = findTarget(text.slice(8));
      if (!target) return bot.sendMessage(userId, "❌ همچین بازیکنی پیدا نشد.");
      player.sniperUsed = true;
      game.nightActions.sniperTarget = target.id;
      game.nightActions.sniperUserId = userId;
      bot.sendMessage(userId, `🎯 امشب به ${target.name} شلیک کردی!`);
      return;
    }
  });

  // ---------- رأی‌گیری روز (دکمه‌ها) ----------
  bot.on("callback_query", (q) => {
    if (!q.data || !q.data.startsWith("vote_")) return;
    const rest = q.data.slice(5);
    const lastUnderscore = rest.lastIndexOf("_");
    const chatKey = rest.slice(0, lastUnderscore);
    const targetId = Number(rest.slice(lastUnderscore + 1));
    const game = games.get(chatKey);
    if (!game || game.status !== "day") {
      bot.answerCallbackQuery(q.id, { text: "الان وقت رأی‌گیری نیست." });
      return;
    }
    const voter = game.players.get(q.from.id);
    if (!voter || !voter.alive) {
      bot.answerCallbackQuery(q.id, { text: "شما تو بازی نیستی یا حذف شدی." });
      return;
    }
    const tokens = game.voteTokens.get(voter.id) || 0;
    if (tokens <= 0) {
      bot.answerCallbackQuery(q.id, { text: "رأی‌هات تموم شده." });
      return;
    }
    game.voteTokens.set(voter.id, tokens - 1);
    game.voteTally.set(targetId, (game.voteTally.get(targetId) || 0) + 1);
    const targetName = game.players.get(targetId) ? game.players.get(targetId).name : "؟";
    bot.answerCallbackQuery(q.id, { text: `رأیت برای ${targetName} ثبت شد! (${tokens - 1} رأی باقی مونده)` });
  });

  // ---------- دکمه‌های اقدام شب ----------
  bot.on("callback_query", (q) => {
    if (!q.data || !q.data.startsWith("night_")) return;
    const parts = q.data.split("_");
    const action = parts[1];
    const chatKey = parts[2];
    const targetId = Number(parts[3]);
    const game = games.get(chatKey);
    if (!game || game.status !== "night") {
      bot.answerCallbackQuery(q.id, { text: "الان شب نیست." });
      return;
    }
    const player = game.players.get(q.from.id);
    if (!player || !player.alive) {
      bot.answerCallbackQuery(q.id, { text: "شما تو بازی نیستی یا حذف شدی." });
      return;
    }
    const target = game.players.get(targetId);
    if (!target || !target.alive) {
      bot.answerCallbackQuery(q.id, { text: "این بازیکن دیگه زنده نیست." });
      return;
    }

    if (action === "kill") {
      if (player.roleKey !== "godfather" && player.roleKey !== "mafia") {
        return bot.answerCallbackQuery(q.id, { text: "این کار برای نقش تو نیست." });
      }
      game.nightActions.mafiaKillTarget = target.id;
      game.nightActions.mafiaActorId = player.id;
      bot.answerCallbackQuery(q.id, { text: `✅ ${target.name} رو برای کشتن انتخاب کردی.` });
    } else if (action === "silence") {
      if (player.roleKey !== "silencer") return bot.answerCallbackQuery(q.id, { text: "این کار برای نقش تو نیست." });
      game.nightActions.silencerTarget = target.id;
      bot.answerCallbackQuery(q.id, { text: `✅ ${target.name} رو امشب ساکت می‌کنی.` });
    } else if (action === "save") {
      if (player.roleKey !== "doctor") return bot.answerCallbackQuery(q.id, { text: "این کار برای نقش تو نیست." });
      game.nightActions.doctorSaveTarget = target.id;
      bot.answerCallbackQuery(q.id, { text: `✅ امشب ${target.name} رو نجات می‌دی.` });
    } else if (action === "investigate") {
      if (player.roleKey !== "detective") return bot.answerCallbackQuery(q.id, { text: "این کار برای نقش تو نیست." });
      game.nightActions.detectiveTarget = target.id;
      game.nightActions.detectiveUserId = player.id;
      bot.answerCallbackQuery(q.id, { text: `✅ فردا صبح نتیجه استعلام ${target.name} میاد.` });
    } else if (action === "protect") {
      if (player.roleKey !== "bodyguard") return bot.answerCallbackQuery(q.id, { text: "این کار برای نقش تو نیست." });
      game.nightActions.bodyguardProtectTarget = target.id;
      bot.answerCallbackQuery(q.id, { text: `✅ امشب از ${target.name} محافظت می‌کنی.` });
    } else if (action === "snipe") {
      if (player.roleKey !== "sniper" || player.sniperUsed) {
        return bot.answerCallbackQuery(q.id, { text: "این کار برای نقش تو نیست یا قبلاً استفاده کردی." });
      }
      player.sniperUsed = true;
      game.nightActions.sniperTarget = target.id;
      game.nightActions.sniperUserId = player.id;
      bot.answerCallbackQuery(q.id, { text: `🎯 به ${target.name} شلیک کردی!` });
    }
  });

  console.log("Mafia bot polling started");
}

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// ---------- تنظیمات بازی ----------
const WORLD_SIZE = 2000;
const TICK_RATE = 20; // فریم بر ثانیه شبیه‌سازی سرور
const PLAYER_SPEED = 220; // پیکسل بر ثانیه
const PLAYER_RADIUS = 18;
const BULLET_SPEED = 700;
const BULLET_RADIUS = 5;
const BULLET_DAMAGE = 12;
const FIRE_COOLDOWN_MS = 300;
const MAX_PLAYERS = 10;

// زون: دایره‌ای که با زمان کوچیک میشه، بیرونش دیمیج میده
const ZONE_SHRINK_START_MS = 15000; // 15 ثانیه بعد شروع شدن بازی شروع به کوچیک شدن میکنه
const ZONE_SHRINK_DURATION_MS = 90000; // طی 90 ثانیه به کمترین سایز میرسه
const ZONE_MIN_RADIUS = 150;
const ZONE_DAMAGE_PER_SEC = 8;

// ---------- وضعیت بازی (یک روم ساده برای MVP) ----------
function freshGameState() {
  return {
    players: {}, // id -> {x,y,hp,angle,name,alive,lastShot}
    bullets: [], // {id,x,y,vx,vy,ownerId}
    status: "waiting", // waiting | running | ended
    startedAt: null,
    winnerId: null,
    bulletSeq: 0,
  };
}

let game = freshGameState();

function randomSpawn() {
  const margin = 150;
  return {
    x: margin + Math.random() * (WORLD_SIZE - margin * 2),
    y: margin + Math.random() * (WORLD_SIZE - margin * 2),
  };
}

function currentZone() {
  if (!game.startedAt) {
    return { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, radius: WORLD_SIZE / 2 };
  }
  const elapsed = Date.now() - game.startedAt;
  const t = Math.min(
    Math.max((elapsed - ZONE_SHRINK_START_MS) / ZONE_SHRINK_DURATION_MS, 0),
    1
  );
  const maxRadius = WORLD_SIZE / 2;
  const radius = maxRadius - t * (maxRadius - ZONE_MIN_RADIUS);
  return { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, radius };
}

function alivePlayers() {
  return Object.values(game.players).filter((p) => p.alive);
}

function tryStartGame() {
  const count = Object.keys(game.players).length;
  if (game.status === "waiting" && count >= 2) {
    game.status = "running";
    game.startedAt = Date.now();
    io.emit("gameStarted");
  }
}

function endGameIfNeeded() {
  if (game.status !== "running") return;
  const alive = alivePlayers();
  if (alive.length <= 1) {
    game.status = "ended";
    game.winnerId = alive.length === 1 ? alive[0].id : null;
    io.emit("gameOver", {
      winnerId: game.winnerId,
      winnerName: alive.length === 1 ? alive[0].name : null,
    });
    // ریست بعد از چند ثانیه برای بازی بعدی
    setTimeout(() => {
      game = freshGameState();
      io.emit("gameReset");
    }, 8000);
  }
}

io.on("connection", (socket) => {
  socket.on("join", (payload) => {
    const name = (payload && payload.name ? String(payload.name) : "Player").slice(0, 20);

    if (Object.keys(game.players).length >= MAX_PLAYERS) {
      socket.emit("joinRejected", { reason: "room_full" });
      return;
    }
    if (game.status === "running") {
      socket.emit("joinRejected", { reason: "game_in_progress" });
      return;
    }

    const spawn = randomSpawn();
    game.players[socket.id] = {
      id: socket.id,
      name,
      x: spawn.x,
      y: spawn.y,
      angle: 0,
      hp: 100,
      alive: true,
      input: { dx: 0, dy: 0 },
      lastShot: 0,
    };

    socket.emit("joined", { id: socket.id, worldSize: WORLD_SIZE });
    tryStartGame();
  });

  socket.on("input", (data) => {
    const p = game.players[socket.id];
    if (!p || !p.alive) return;
    let dx = Number(data && data.dx) || 0;
    let dy = Number(data && data.dy) || 0;
    const len = Math.hypot(dx, dy);
    if (len > 1) {
      dx /= len;
      dy /= len;
    }
    p.input = { dx, dy };
    if (typeof data.angle === "number") p.angle = data.angle;
  });

  socket.on("shoot", () => {
    const p = game.players[socket.id];
    if (!p || !p.alive || game.status !== "running") return;
    const now = Date.now();
    if (now - p.lastShot < FIRE_COOLDOWN_MS) return;
    p.lastShot = now;

    const bullet = {
      id: game.bulletSeq++,
      x: p.x + Math.cos(p.angle) * (PLAYER_RADIUS + 4),
      y: p.y + Math.sin(p.angle) * (PLAYER_RADIUS + 4),
      vx: Math.cos(p.angle) * BULLET_SPEED,
      vy: Math.sin(p.angle) * BULLET_SPEED,
      ownerId: socket.id,
      bornAt: now,
    };
    game.bullets.push(bullet);
  });

  socket.on("disconnect", () => {
    delete game.players[socket.id];
    endGameIfNeeded();
  });
});

// ---------- حلقه اصلی شبیه‌سازی ----------
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;

  if (game.status === "running") {
    // حرکت بازیکن‌ها
    for (const p of Object.values(game.players)) {
      if (!p.alive) continue;
      p.x += p.input.dx * PLAYER_SPEED * dt;
      p.y += p.input.dy * PLAYER_SPEED * dt;
      p.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_SIZE - PLAYER_RADIUS, p.x));
      p.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_SIZE - PLAYER_RADIUS, p.y));
    }

    // حرکت گلوله‌ها + برخورد
    const zone = currentZone();
    const remainingBullets = [];
    for (const b of game.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      let hit = false;
      if (b.x < 0 || b.y < 0 || b.x > WORLD_SIZE || b.y > WORLD_SIZE) hit = true;
      if (now - b.bornAt > 3000) hit = true;

      if (!hit) {
        for (const p of Object.values(game.players)) {
          if (!p.alive || p.id === b.ownerId) continue;
          const dist = Math.hypot(p.x - b.x, p.y - b.y);
          if (dist < PLAYER_RADIUS + BULLET_RADIUS) {
            p.hp -= BULLET_DAMAGE;
            hit = true;
            if (p.hp <= 0) {
              p.hp = 0;
              p.alive = false;
              io.emit("playerDown", { id: p.id, name: p.name, by: b.ownerId });
            }
            break;
          }
        }
      }
      if (!hit) remainingBullets.push(b);
    }
    game.bullets = remainingBullets;

    // دیمیج زون
    for (const p of Object.values(game.players)) {
      if (!p.alive) continue;
      const dist = Math.hypot(p.x - zone.x, p.y - zone.y);
      if (dist > zone.radius) {
        p.hp -= ZONE_DAMAGE_PER_SEC * dt;
        if (p.hp <= 0) {
          p.hp = 0;
          p.alive = false;
          io.emit("playerDown", { id: p.id, name: p.name, by: null });
        }
      }
    }

    endGameIfNeeded();
  }

  // پخش وضعیت به همه
  io.emit("state", {
    status: game.status,
    zone: currentZone(),
    players: Object.values(game.players).map((p) => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      angle: p.angle,
      hp: p.hp,
      alive: p.alive,
    })),
    bullets: game.bullets.map((b) => ({ id: b.id, x: b.x, y: b.y })),
  });
}, 1000 / TICK_RATE);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// ---------- بات تلگرام (اختیاری، در همین سرویس) ----------
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL; // آدرس همین اپ روی Railway، مثلا https://xxx.up.railway.app

if (BOT_TOKEN) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "برای بازی رو دکمه زیر بزن 👇", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🎮 شروع بازی",
              web_app: { url: WEBAPP_URL },
            },
          ],
        ],
      },
    });
  });
  console.log("Telegram bot polling started");
} else {
  console.log("BOT_TOKEN not set — bot disabled, only game server is running");
}
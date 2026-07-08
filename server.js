const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname));

// ---------- تنظیمات بازی ----------
const WORLD_SIZE = 3000;
const TICK_RATE = 20;
const SPEED = 160; // پیکسل بر ثانیه
const TURN_RATE = 4.5; // رادیان بر ثانیه، محدودیت چرخش سر مار
const SEGMENT_SPACING = 12; // فاصله بین حلقه‌های بدن
const START_SEGMENTS = 8;
const HEAD_RADIUS = 10;
const BODY_RADIUS = 9;
const GROW_PER_FOOD = 4;
const FOOD_COUNT = 120;
const FOOD_RADIUS = 6;
const MAX_PLAYERS = 10;
const SELF_COLLISION_SKIP = 6; // چند حلقه‌ی اول نزدیک سر رو نادیده بگیر تا خودش رو نکشه فوری

function freshGameState() {
  return {
    players: {}, // id -> {id,name,alive,segments:[{x,y}],angle,targetAngle,length}
    food: [],
    status: "waiting",
    winnerId: null,
  };
}
let game = freshGameState();

function randomPoint(margin = 100) {
  return {
    x: margin + Math.random() * (WORLD_SIZE - margin * 2),
    y: margin + Math.random() * (WORLD_SIZE - margin * 2),
  };
}

function spawnFood() {
  const p = randomPoint(50);
  game.food.push({ x: p.x, y: p.y, id: Math.random().toString(36).slice(2) });
}
function ensureFood() {
  while (game.food.length < FOOD_COUNT) spawnFood();
}
ensureFood();

function alivePlayers() {
  return Object.values(game.players).filter((p) => p.alive);
}

function tryStartGame() {
  const count = Object.keys(game.players).length;
  if (game.status === "waiting" && count >= 2) {
    game.status = "running";
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
    setTimeout(() => {
      game = freshGameState();
      ensureFood();
      io.emit("gameReset");
    }, 8000);
  }
}

function makeSnake(id, name) {
  const start = randomPoint(300);
  const angle = Math.random() * Math.PI * 2;
  const segments = [];
  for (let i = 0; i < START_SEGMENTS; i++) {
    segments.push({
      x: start.x - Math.cos(angle) * i * SEGMENT_SPACING,
      y: start.y - Math.sin(angle) * i * SEGMENT_SPACING,
    });
  }
  return {
    id,
    name,
    alive: true,
    angle,
    targetAngle: angle,
    segments,
    growth: 0, // چند حلقه هنوز باید اضافه بشه
  };
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

    game.players[socket.id] = makeSnake(socket.id, name);
    socket.emit("joined", { id: socket.id, worldSize: WORLD_SIZE });
    tryStartGame();
  });

  socket.on("input", (data) => {
    const p = game.players[socket.id];
    if (!p || !p.alive) return;
    if (typeof data.angle === "number") p.targetAngle = data.angle;
  });

  socket.on("disconnect", () => {
    delete game.players[socket.id];
    endGameIfNeeded();
  });
});

function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

let lastTick = Date.now();
setInterval(() => {
  const now = Date.now();
  const dt = (now - lastTick) / 1000;
  lastTick = now;

  if (game.status === "running") {
    const snakes = Object.values(game.players).filter((p) => p.alive);

    // چرخش و حرکت سر
    for (const p of snakes) {
      const diff = angleDiff(p.angle, p.targetAngle);
      const maxTurn = TURN_RATE * dt;
      if (Math.abs(diff) <= maxTurn) p.angle = p.targetAngle;
      else p.angle += Math.sign(diff) * maxTurn;

      const head = p.segments[0];
      const newHead = {
        x: head.x + Math.cos(p.angle) * SPEED * dt,
        y: head.y + Math.sin(p.angle) * SPEED * dt,
      };

      // برخورد با دیوار
      if (
        newHead.x < 0 || newHead.y < 0 ||
        newHead.x > WORLD_SIZE || newHead.y > WORLD_SIZE
      ) {
        p.alive = false;
        io.emit("playerDown", { id: p.id, name: p.name });
        continue;
      }

      p.segments.unshift(newHead);

      // رشد یا کوتاه‌شدن دم بر اساس growth
      if (p.growth > 0) {
        p.growth -= 1;
      } else {
        p.segments.pop();
      }

      // خوردن غذا
      for (let i = game.food.length - 1; i >= 0; i--) {
        const f = game.food[i];
        const dist = Math.hypot(f.x - newHead.x, f.y - newHead.y);
        if (dist < HEAD_RADIUS + FOOD_RADIUS) {
          game.food.splice(i, 1);
          p.growth += GROW_PER_FOOD;
        }
      }
    }
    ensureFood();

    // برخورد سر با بدن (خودش یا دیگران)
    for (const p of snakes) {
      if (!p.alive) continue;
      const head = p.segments[0];
      for (const other of snakes) {
        const segs = other.segments;
        const startIdx = other.id === p.id ? SELF_COLLISION_SKIP : 0;
        for (let i = startIdx; i < segs.length; i++) {
          const s = segs[i];
          const dist = Math.hypot(s.x - head.x, s.y - head.y);
          if (dist < HEAD_RADIUS + BODY_RADIUS - 2) {
            p.alive = false;
            io.emit("playerDown", { id: p.id, name: p.name });
            break;
          }
        }
        if (!p.alive) break;
      }
    }

    endGameIfNeeded();
  }

  io.emit("state", {
    status: game.status,
    food: game.food,
    players: Object.values(game.players).map((p) => ({
      id: p.id,
      name: p.name,
      alive: p.alive,
      angle: p.angle,
      segments: p.segments,
    })),
  });
}, 1000 / TICK_RATE);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});

// ---------- بات تلگرام ----------
const TelegramBot = require("node-telegram-bot-api");
const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;

if (BOT_TOKEN) {
  const bot = new TelegramBot(BOT_TOKEN, { polling: true });
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "برای بازی رو دکمه زیر بزن 👇", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "🐍 شروع بازی", web_app: { url: WEBAPP_URL } }],
        ],
      },
    });
  });
  console.log("Telegram bot polling started");
} else {
  console.log("BOT_TOKEN not set — bot disabled, only game server is running");
}

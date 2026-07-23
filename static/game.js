// ==================== نمایش خطای واقعی به‌جای «در حال بارگذاری» بی‌پایان ====================
window.addEventListener("error", function (e) {
  const el = document.getElementById("loading");
  if (el) {
    el.style.display = "flex";
    el.style.fontSize = "13px";
    el.style.padding = "20px";
    el.textContent = "⚠️ خطا: " + (e.message || "نامشخص") + " (خط " + (e.lineno || "?") + ")";
  }
});

// ==================== محافظ نهایی: اگه هرچی شد بعد از ۸ ثانیه گیر نکنه ====================
setTimeout(function () {
  const el = document.getElementById("loading");
  if (el && el.style.display !== "none") {
    el.style.fontSize = "13px";
    el.style.padding = "20px";
    el.textContent = "⚠️ بازی بالا نیومد. اینترنت/فیلترشکن رو چک کن یا دوباره باز کن.";
  }
}, 8000);

// ==================== تنظیمات پایه ====================
const TILE = 40;
const RESOURCE_DENSITY = 0.065;

const RECIPES = {
  craft: [
    { id: "axe",     name: "تبر",        need: { wood: 5 },              give: { axe: 1 },     info: "دمیج 25 — برد 70" },
    { id: "pick",    name: "کلنگ",       need: { wood: 3, stone: 5 },    give: { pick: 1 },    info: "دمیج 20 — برد 65" },
    { id: "knife",   name: "چاقو",       need: { wood: 2, stone: 2 },    give: { knife: 1 },   info: "دمیج 35 — برد 60" },
    { id: "wrench",  name: "آچار",       need: { stone: 4, metal: 3 },   give: { wrench: 1 },  info: "دمیج 15 — برد 55 — همچنین برای تعمیر بدنه ماشین" },
    { id: "bandage", name: "باند زخم",   need: { cloth: 3 },             give: { bandage: 2 }, info: "هر باند +۲۵ سلامتی" },
    { id: "fuel_can",name: "قوطی بنزین", need: { corn: 4 },              give: { fuel_can: 1 },info: "با ذرت ساخته می‌شه، برای پر کردن باک ماشین" },
  ],
  build: [
    { id: "wall",   name: "دیوار چوبی", need: { wood: 6 },            give: { wall: 1 } },
    { id: "floor",  name: "کف چوبی",    need: { wood: 4 },            give: { floor: 1 } },
    { id: "door",   name: "در",         need: { wood: 5, metal: 2 },  give: { door: 1 } },
    { id: "window", name: "پنجره",      need: { wood: 3, metal: 1 },  give: { window: 1 } },
  ],
};

const CAR_ENGINE_NEED = { metal: 3, stone: 2 };
const CAR_COLORS = ["engine_blue", "engine_yellow", "engine_green", "engine_black", "engine_orange"];

const RESOURCE_NODES = {
  tree: { gives: "wood",  amount: [1, 3], images: ["tree1", "tree2", "tree_user", "wood_small"], drawH: 36, color: "#2e6b1f", radius: 10 },
  rock: { gives: "stone", amount: [1, 2], images: ["rock1", "rock2", "rock3"], drawH: 24, color: "#8a8a8a", radius: 9 },
  scrap:{ gives: "metal", amount: [1, 2], images: ["crate1_user", "crate2_user"], drawH: 26, color: "#b5652b", radius: 8 },
  bush: { gives: "cloth", amount: [1, 1], color: "#7a9e4a", radius: 7 },
  berry:{ gives: "food",  amount: [1, 2], color: "#c73f5c", radius: 6 },
  well: { gives: "water", amount: [1, 2], color: "#3f7fc7", radius: 7 },
  corn: { gives: "corn",  amount: [1, 2], color: "#e8c93a", radius: 7 },
};

const BUILDABLE = { wall: "#7a5230", floor: "#c9ab7a", door: "#4b3620", window: "#bcdff5" };
const SOLID_FOR_ZOMBIE = { wall: true, door: true, window: true };
const SOLID_FOR_PLAYER = { wall: true };

const ITEM_FA = {
  wood: "چوب", stone: "سنگ", metal: "فلز", cloth: "پارچه", food: "غذا", water: "آب", corn: "ذرت",
  axe: "تبر", pick: "کلنگ", knife: "چاقو", wrench: "آچار", bandage: "باند زخم",
  wall: "دیوار", floor: "کف", door: "در", window: "پنجره",
  engine_part: "قطعه موتور", fuel_can: "قوطی بنزین",
};

const WEAPON_RANGE = { fists: 45, knife: 60, axe: 70, pick: 65, wrench: 55 };
const WEAPON_DAMAGE = { fists: 12, knife: 35, axe: 25, pick: 20, wrench: 15 };
const WEAPON_COLOR = { fists: null, knife: "#d8d8d8", axe: "#8a5a2b", pick: "#777", wrench: "#5b7fbf" };
const ATTACK_CONE_DEG = 55;
const ATTACK_INTERVAL_MS = 550;

const INTERACT_RANGE = 55;
const ZOMBIE_SPEED = 1.1;
const ZOMBIE_SIGHT_RANGE = 230;
const ZOMBIE_LOSE_INTEREST = 420;
const PLAYER_SPEED = 2.6;
const ZOMBIE_DAMAGE = 6;
const ZOMBIE_MAX = 8;
const ZOMBIE_SPAWN_EVERY = 7000;

const CAR_WORLD_X = 0, CAR_WORLD_Y = -260;
const CAR_SECTOR_SIZE = 640;
const CAR_SECTOR_CHANCE = 0.35;

const HELP_TEXT_HTML = `
  <div class="help-item">🕹️ <b>آنالوگ چپ:</b> حرکت</div>
  <div class="help-item">🎯 <b>آنالوگ راست (قرمز):</b> نشونه‌گیری و حمله — نگه‌دار تا خودکار بزنه</div>
  <div class="help-item">✋ <b>دکمه دست:</b> برداشتن منبع نزدیک یا تعامل با ماشین</div>
  <div class="help-item">📍 <b>دکمه GPS:</b> یه نشون رو نقشه بذار تا گم نشی؛ دوباره بزن تا حذفش کنی</div>
  <div class="help-item">🌲 <b>منابع:</b> درخت=چوب، سنگ=سنگ، بشکه=فلز، بوته=پارچه، بوته قرمز=غذا، چشمه=آب، ذرت=ذرت (برای بنزین)</div>
  <div class="help-item">🛠️ <b>ساخت:</b> تو پنل ساخت، برد و دمیج هر سلاح نوشته شده؛ قوطی بنزین هم از ذرت ساخته می‌شه</div>
  <div class="help-item">🏠 <b>بنا:</b> دیوار جلوی همه رو می‌گیره؛ در و پنجره فقط جلوی زامبی رو می‌گیرن</div>
  <div class="help-item">🧟 <b>زامبی:</b> فقط وقتی نزدیکش بشی متوجه‌ات می‌شه و دنبالت می‌کنه</div>
  <div class="help-item">🚗 <b>ماشین:</b> چند تا ماشین خراب مختلف تو نقشه پخشن. هرکدوم اول موتور (۳فلز+۲سنگ) بعد بنزین لازم دارن. تو ماشین اگه زامبی بهت بزنه بدنه خراب می‌شه؛ هر آچار ۵۰٪ بدنه رو تعمیر می‌کنه</div>
  <div class="help-item">💀 اگه سلامتیت صفر بشه، دنیای تازه از اول شروع می‌شه</div>
`;

const IMG_SRC = {
  player: "player.png",
  zombie1: "zombie1_walk.png",
  zombie2: "zombie2_walk.png",
  tree1: "tree1.png",
  tree2: "tree2.png",
  rock1: "rock1.png",
  rock2: "rock2.png",
  rock3: "rock3.png",
  tree_user: "tree_user.png",
  wall_user: "wall_user.png",
  crate1_user: "crate1_user.png",
  crate2_user: "crate2_user.png",
  knife_user: "knife_user.png",
  wood_small: "wood_small.png",
  engine_blue: "engine_blue.png",
  engine_yellow: "engine_yellow.png",
  engine_green: "engine_green.png",
  engine_black: "engine_black.png",
  engine_orange: "engine_orange.png",
};

const IMG = {};
for (const [key, src] of Object.entries(IMG_SRC)) {
  const im = new Image();
  im.src = src;
  IMG[key] = im;
}

function imgReady(im) { return im && im.complete && im.naturalWidth > 0; }

function drawImageCentered(im, x, y, targetH) {
  if (!imgReady(im)) return false;
  const scale = targetH / im.naturalHeight;
  const w = im.naturalWidth * scale;
  const h = im.naturalHeight * scale;
  ctx.drawImage(im, x - w / 2, y - h / 2, w, h);
  return true;
}

function drawImageRotated(im, x, y, targetH, angle) {
  if (!imgReady(im)) return false;
  const scale = targetH / im.naturalHeight;
  const w = im.naturalWidth * scale;
  const h = im.naturalHeight * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(im, -w / 2, -h / 2, w, h);
  ctx.restore();
  return true;
}

// اسپرایت‌شیت زامبی: ۸ فریم واقعی از چرخه‌ی راه‌رفتن، کنار هم به‌صورت افقی
const ZOMBIE_SHEETS = {
  zombie1: { frames: 8, w: 66, h: 72 },
  zombie2: { frames: 8, w: 51, h: 72 },
};

function drawSpriteFrameRotated(im, sheet, frameIndex, x, y, targetH, angle) {
  if (!imgReady(im)) return false;
  const scale = targetH / sheet.h;
  const dw = sheet.w * scale, dh = sheet.h * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(im, frameIndex * sheet.w, 0, sheet.w, sheet.h, -dw / 2, -dh / 2, dw, dh);
  ctx.restore();
  return true;
}

function drawHitFlash(x, y, radius) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#ff3b3b";
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// دست و پای ساده‌ی رویه‌ای (چون اسپرایت‌ها لایه‌ی جدا برای عضو ندارن) + سلاح تو دست
// قرارداد محور: جهت جلو = +X (هم‌راستا با مخروط حمله)، پهلو = +Y
function drawLimbsAndWeapon(x, y, facing, walkPhase, weaponKey, attackPulse) {
  const stride = Math.sin(walkPhase) * 5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);
  // پاها: کمی عقب‌تر از مرکز، کنار هم (چپ/راست)، با قدم‌زدن جلو-عقب متناوب
  ctx.fillStyle = "#3b2a17";
  ctx.fillRect(-11 + stride * 0.5, -6, 7, 5);
  ctx.fillRect(-11 - stride * 0.5, 1, 7, 5);
  // دست‌ها: یکی عقب، یکی جلو (نوسان راه‌رفتن)
  ctx.fillStyle = "#e8c07a";
  const armSwing = Math.sin(walkPhase + Math.PI) * 4;
  ctx.beginPath(); ctx.arc(-9, armSwing, 4, 0, Math.PI * 2); ctx.fill();
  const handForwardX = attackPulse ? 20 : 9;
  ctx.beginPath(); ctx.arc(handForwardX, -armSwing, 4, 0, Math.PI * 2); ctx.fill();
  // سلاح تو دست جلویی
  if (weaponKey === "knife" && imgReady(IMG.knife_user)) {
    ctx.save();
    ctx.translate(handForwardX + 6, -armSwing);
    ctx.rotate(Math.PI / 4);
    drawImageCentered(IMG.knife_user, 0, 0, 18);
    ctx.restore();
  } else {
    const wColor = WEAPON_COLOR[weaponKey];
    if (wColor) {
      ctx.strokeStyle = wColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(handForwardX, -armSwing);
      ctx.lineTo(handForwardX + 14, -armSwing);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawZombieLimbs(x, y, facing, walkPhase) {
  const stride = Math.sin(walkPhase) * 4;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);
  ctx.fillStyle = "#2f5d33";
  ctx.fillRect(-10 + stride * 0.5, -6, 7, 5);
  ctx.fillRect(-10 - stride * 0.5, 1, 7, 5);
  // دست‌های دراز به جلو (حالت کلاسیک زامبی)
  ctx.fillStyle = "#4a7a4e";
  ctx.beginPath(); ctx.arc(11, -6, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, 6, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ==================== Telegram WebApp ====================
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) {
  tg.ready();
  tg.expand();
  try { if (tg.lockOrientation) tg.lockOrientation(); } catch (e) {}
}
try {
  if (screen.orientation && screen.orientation.lock) {
    screen.orientation.lock("landscape").catch(() => {});
  }
} catch (e) {}
const initData = tg ? tg.initData : "";

// ==================== وضعیت بازی ====================
let state = null;
let zombies = [];
let lastZombieSpawn = 0;
let placeMode = null;
let waypointArmed = false;
let inCar = false;
let currentCarKey = null;
let drivingCarKey = null;
let isDead = false;
let isPanelOpen = false;
let isHidden = false; // وقتی صفحه/تب دیده نمی‌شه (پس‌زمینه یا بسته)، بازی کاملاً متوقف می‌شه

let playerFacing = Math.PI / 2;
let lastAttackTime = 0;
let playerHitFlashUntil = 0;
let attackPulseUntil = 0;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const loadingEl = document.getElementById("loading");
const rotateWrap = document.getElementById("rotate-wrap");
function resize() { canvas.width = rotateWrap.clientWidth; canvas.height = rotateWrap.clientHeight; }
addEventListener("resize", resize);
addEventListener("orientationchange", resize);
resize();

// وقتی گوشی عمودیه، کل بازی با CSS ۹۰ درجه می‌چرخه تا افقی دیده بشه؛
// ولی رویدادهای لمسی هنوز تو مختصات واقعیِ (عمودیِ) صفحه میان، پس باید تبدیلشون کنیم
// به مختصات محلیِ داخل rotate-wrap (که همیشه افقیه).
function isForcedPortrait() { return window.innerWidth < window.innerHeight; }

function physicalDeltaToLocal(dpx, dpy) {
  if (!isForcedPortrait()) return { x: dpx, y: dpy };
  return { x: dpy, y: -dpx };
}

function physicalPointToLocal(px, py) {
  if (!isForcedPortrait()) return { x: px, y: py };
  const w = window.innerWidth;
  return { x: py, y: w - px };
}

// ==================== تصادفی قطعی ====================
function hash2(x, y, seed) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function tileResource(tx, ty, seed) {
  const h = hash2(tx, ty, seed);
  if (h > RESOURCE_DENSITY) return null;
  const keys = Object.keys(RESOURCE_NODES);
  const idx = Math.floor(hash2(tx + 0.37, ty + 0.71, seed) * keys.length);
  return keys[idx];
}

function pickVariant(list, tx, ty, seed) {
  const idx = Math.floor(hash2(tx + 5.13, ty + 9.77, seed) * list.length);
  return list[Math.min(idx, list.length - 1)];
}

function modKey(tx, ty) { return tx + "_" + ty; }

function buildAt(tx, ty) {
  const m = state.modifications[modKey(tx, ty)];
  return m && m.build ? m.build : null;
}

function isSolidForPlayer(tx, ty) {
  const b = buildAt(tx, ty);
  return !!(b && SOLID_FOR_PLAYER[b]);
}
function isSolidForZombie(tx, ty) {
  const b = buildAt(tx, ty);
  return !!(b && SOLID_FOR_ZOMBIE[b]);
}

function moveWithCollision(entity, dx, dy, solidFn) {
  if (dx !== 0) {
    const nx = entity.x + dx;
    const tx = Math.round(nx / TILE), ty = Math.round(entity.y / TILE);
    if (!solidFn(tx, ty)) entity.x = nx;
  }
  if (dy !== 0) {
    const ny = entity.y + dy;
    const tx = Math.round(entity.x / TILE), ty = Math.round(ny / TILE);
    if (!solidFn(tx, ty)) entity.y = ny;
  }
}

// ==================== ماشین‌های پخش‌شده تو نقشه ====================
function sectorCarInfo(sx, sy) {
  const h = hash2(sx * 3.1 + 0.5, sy * 2.7 + 0.5, state.worldSeed + 4242);
  if (h > CAR_SECTOR_CHANCE) return null;
  const ox = (hash2(sx + 0.11, sy + 0.22, state.worldSeed + 55) - 0.5) * (CAR_SECTOR_SIZE * 0.6);
  const oy = (hash2(sx + 0.33, sy + 0.44, state.worldSeed + 77) - 0.5) * (CAR_SECTOR_SIZE * 0.6);
  const colorIdx = Math.floor(hash2(sx + 0.77, sy + 0.88, state.worldSeed + 99) * CAR_COLORS.length);
  return {
    key: "s_" + sx + "_" + sy,
    x: sx * CAR_SECTOR_SIZE + CAR_SECTOR_SIZE / 2 + ox,
    y: sy * CAR_SECTOR_SIZE + CAR_SECTOR_SIZE / 2 + oy,
    color: CAR_COLORS[colorIdx],
  };
}

function carInfoFromKey(key) {
  if (key === "main") return { key: "main", x: CAR_WORLD_X, y: CAR_WORLD_Y, color: "engine_orange" };
  const m = key.match(/^s_(-?\d+)_(-?\d+)$/);
  if (!m) return null;
  return sectorCarInfo(parseInt(m[1], 10), parseInt(m[2], 10));
}

function getAllNearbyCars() {
  const map = new Map();
  const base = [{ key: "main", x: CAR_WORLD_X, y: CAR_WORLD_Y, color: "engine_orange" }];
  const psx = Math.floor(state.player.x / CAR_SECTOR_SIZE);
  const psy = Math.floor(state.player.y / CAR_SECTOR_SIZE);
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const info = sectorCarInfo(psx + dx, psy + dy);
      if (info) base.push(info);
    }
  }
  for (const c of base) map.set(c.key, c);

  // ماشینی که قبلاً روندیمش و جای دیگه پارک شده، حتی اگه از سکتورهای اطراف فعلی دور باشه،
  // همیشه باید پیدا بشه (وگرنه بعد از تموم شدن بنزین دور از خونه‌ی اصلیش، غیب می‌شد)
  for (const key of Object.keys(state.cars)) {
    const saved = state.cars[key];
    if (!saved || saved.posX === undefined) continue;
    let entry = map.get(key);
    if (!entry) {
      entry = carInfoFromKey(key);
      if (!entry) continue;
    }
    map.set(key, { key, x: saved.posX, y: saved.posY, color: entry.color });
  }
  return Array.from(map.values());
}

function getCarState(key) {
  if (!state.cars[key]) {
    state.cars[key] = { repaired: false, fuel: 0, health: 100 };
  }
  return state.cars[key];
}

function nearestCar() {
  const cars = getAllNearbyCars();
  let best = null, bestD = INTERACT_RANGE + 20;
  for (const c of cars) {
    const d = Math.hypot(c.x - state.player.x, c.y - state.player.y);
    if (d < bestD) { bestD = d; best = c; }
  }
  return best;
}

// ==================== بارگذاری / ذخیره / ریست ====================
async function loadState() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);
    const res = await fetch("/api/load", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await res.json();
    if (data.ok) { state = data.state; normalizeState(); return; }
  } catch (e) {
    toast("اتصال به سرور برقرار نشد — حالت آزمایشی (ذخیره نمی‌شه)");
  }
  state = freshLocalState();
}

function normalizeState() {
  if (!state.cars) state.cars = {};
  if (state.car && !state.cars.main) {
    state.cars.main = { repaired: !!state.car.repaired, fuel: state.car.fuel || 0, health: state.car.health ?? 100 };
  }
  if (!state.cars.main) state.cars.main = { repaired: false, fuel: 0, health: 100 };
  if (state.waypoint === undefined) state.waypoint = null;
}

function freshLocalState() {
  return {
    worldSeed: Math.floor(Math.random() * 100000),
    player: { x: 0, y: 0, health: 100, hunger: 100, thirst: 100, stamina: 100 },
    inventory: {}, equipped: null,
    cars: { main: { repaired: false, fuel: 0, health: 100 } },
    modifications: {}, guideSeen: false, waypoint: null,
  };
}

let saveTimer = 0;
function saveState() {
  if (!initData || isDead) return;
  fetch("/api/save", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData, state }),
  }).catch(() => {});
}

async function onDeath() {
  if (isDead) return;
  isDead = true;
  zombies = [];
  placeMode = null;
  waypointArmed = false;
  inCar = false;
  drivingCarKey = null;
  loadingEl.textContent = "💀 مُردی... دنیای جدیدی در حال ساخته شدنه";
  loadingEl.style.display = "flex";

  if (initData) {
    try {
      const res = await fetch("/api/reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      state = data.ok ? data.state : freshLocalState();
      normalizeState();
    } catch (e) {
      state = freshLocalState();
    }
  } else {
    state = freshLocalState();
  }

  setTimeout(() => {
    loadingEl.style.display = "none";
    isDead = false;
  }, 1600);
}

// ==================== جوی‌استیک ====================
function setupStick(zoneId, stickId, onMove, onRelease) {
  const zone = document.getElementById(zoneId);
  const stick = document.getElementById(stickId);
  let active = false, startX = 0, startY = 0, touchId = null;
  const MAX = 31;

  function move(clientX, clientY) {
    const raw = physicalDeltaToLocal(clientX - startX, clientY - startY);
    let dx = raw.x, dy = raw.y;
    const dist = Math.hypot(dx, dy);
    if (dist > MAX) { dx = dx / dist * MAX; dy = dy / dist * MAX; }
    stick.style.left = 31 + dx + "px";
    stick.style.top = 31 + dy + "px";
    onMove(dx / MAX, dy / MAX);
  }
  function reset() {
    active = false; touchId = null;
    stick.style.left = "31px"; stick.style.top = "31px";
    onRelease();
  }
  zone.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    active = true; touchId = t.identifier; startX = t.clientX; startY = t.clientY;
    e.preventDefault();
  }, { passive: false });
  zone.addEventListener("touchmove", (e) => {
    if (!active) return;
    for (const t of e.changedTouches) if (t.identifier === touchId) move(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });
  zone.addEventListener("touchend", reset);
  zone.addEventListener("touchcancel", reset);

  zone.addEventListener("mousedown", (e) => { active = true; startX = e.clientX; startY = e.clientY; });
  addEventListener("mousemove", (e) => { if (active) move(e.clientX, e.clientY); });
  addEventListener("mouseup", () => { if (active) reset(); });
}

let joyVec = { x: 0, y: 0 };
setupStick("joystick-zone", "joystick-stick",
  (x, y) => { joyVec.x = x; joyVec.y = y; },
  () => { joyVec.x = 0; joyVec.y = 0; }
);

let aimVec = { x: 0, y: 0 };
setupStick("aim-zone", "aim-stick",
  (x, y) => { aimVec.x = x; aimVec.y = y; },
  () => { aimVec.x = 0; aimVec.y = 0; }
);

// ==================== تپ روی صحنه ====================
canvas.addEventListener("click", (e) => {
  const p = physicalPointToLocal(e.clientX, e.clientY);
  onTapScreen(p.x, p.y);
});
canvas.addEventListener("touchstart", (e) => {
  if (e.target !== canvas) return;
  const t = e.touches[0];
  const p = physicalPointToLocal(t.clientX, t.clientY);
  onTapScreen(p.x, p.y);
}, { passive: true });

function screenToWorld(sx, sy) {
  const cam = getCamera();
  return { x: cam.x + (sx - canvas.width / 2), y: cam.y + (sy - canvas.height / 2) };
}

function onTapScreen(sx, sy) {
  if (!state || isDead || isPanelOpen) return;
  const w = screenToWorld(sx, sy);
  if (waypointArmed) {
    state.waypoint = { x: w.x, y: w.y };
    waypointArmed = false;
    document.getElementById("btn-gps").classList.remove("active");
    toast("نشون گذاشته شد 📍");
    return;
  }
  if (placeMode) { tryPlace(w.x, w.y); return; }
}

document.getElementById("btn-interact").addEventListener("click", doInteract);
document.getElementById("btn-help").addEventListener("click", () => openPanel("help"));
document.getElementById("btn-gps").addEventListener("click", () => {
  if (isPanelOpen) return;
  if (state.waypoint) {
    state.waypoint = null;
    waypointArmed = false;
    document.getElementById("btn-gps").classList.remove("active");
    toast("نشون حذف شد");
    return;
  }
  waypointArmed = !waypointArmed;
  document.getElementById("btn-gps").classList.toggle("active", waypointArmed);
  toast(waypointArmed ? "روی نقشه بزن تا نشون بذاری" : "لغو شد");
});

// ==================== منوها ====================
document.querySelectorAll("#bottom-menu button").forEach((btn) => {
  btn.addEventListener("click", () => openPanel(btn.dataset.panel));
});
document.getElementById("panel-close").addEventListener("click", closePanel);

function closePanel() {
  document.getElementById("panel-overlay").classList.add("hidden");
  isPanelOpen = false;
}

function panelFeedback(msg) {
  const el = document.getElementById("panel-feedback");
  if (el) el.textContent = msg;
}

function openPanel(kind, carKey) {
  if (isDead) return;
  const overlay = document.getElementById("panel-overlay");
  const title = document.getElementById("panel-title");
  const content = document.getElementById("panel-content");
  content.innerHTML = "";
  panelFeedback("");
  overlay.classList.remove("hidden");
  isPanelOpen = true;

  if (kind === "help") {
    title.textContent = "📖 راهنما";
    content.innerHTML = HELP_TEXT_HTML;
  } else if (kind === "car") {
    renderCarPanel(title, content, carKey);
  } else if (kind === "inventory") {
    title.textContent = "🎒 آیتم‌های من";
    const inv = state.inventory;
    const keys = Object.keys(inv).filter((k) => inv[k] > 0);
    if (keys.length === 0) content.innerHTML = "<div class='item-row'>چیزی نداری</div>";
    for (const k of keys) {
      const row = document.createElement("div");
      row.className = "item-row";
      const equippable = ["axe", "pick", "knife", "wrench"].includes(k);
      const rangeTxt = equippable ? ` (برد ${WEAPON_RANGE[k]})` : "";
      row.innerHTML = `<span class="name">${ITEM_FA[k] || k}${rangeTxt} ×${inv[k]}</span>`;
      if (equippable) {
        const b = document.createElement("button");
        b.textContent = state.equipped === k ? "مجهز شده" : "استفاده";
        b.disabled = state.equipped === k;
        b.onclick = () => { state.equipped = k; panelFeedback(ITEM_FA[k] + " رو دستت گرفتی 🖐️"); openPanel("inventory"); };
        row.appendChild(b);
      } else if (k === "wall" || k === "floor" || k === "door" || k === "window") {
        const b = document.createElement("button");
        b.textContent = "جاگذاری";
        b.onclick = () => { placeMode = k; closePanel(); toast("محل مورد نظر رو لمس کن تا " + ITEM_FA[k] + " ساخته بشه"); };
        row.appendChild(b);
      } else if (k === "bandage") {
        const b = document.createElement("button");
        b.textContent = "استفاده";
        b.onclick = () => { useBandage(); openPanel("inventory"); };
        row.appendChild(b);
      } else if (k === "food" || k === "water") {
        const b = document.createElement("button");
        b.textContent = "مصرف";
        b.onclick = () => { consumeItem(k); openPanel("inventory"); };
        row.appendChild(b);
      }
      content.appendChild(row);
    }
  } else {
    title.textContent = kind === "craft" ? "🛠️ ساخت وسیله" : "🏠 ساخت بنا";
    const list = RECIPES[kind];
    for (const r of list) {
      const row = document.createElement("div");
      row.className = "item-row";
      const costText = Object.entries(r.need).map(([k, v]) => {
        const have = state.inventory[k] || 0;
        const ok = have >= v;
        return `${ITEM_FA[k]} ${v} <span style="color:${ok ? '#7bd88f' : '#e07a7a'}">(داری ${have})</span>`;
      }).join("، ");
      const infoText = r.info ? `<div class="cost">ℹ️ ${r.info}</div>` : "";
      row.innerHTML = `<span class="name">${r.name}<div class="cost">نیاز: ${costText}</div>${infoText}</span>`;
      const can = Object.entries(r.need).every(([k, v]) => (state.inventory[k] || 0) >= v);
      const b = document.createElement("button");
      b.textContent = "ساخت";
      b.disabled = !can;
      b.onclick = () => { craft(r); openPanel(kind); };
      row.appendChild(b);
      content.appendChild(row);
    }
  }
}

// ==================== پنل اختصاصی ماشین ====================
function renderCarPanel(title, content, carKey) {
  currentCarKey = carKey || "main";
  const car = getCarState(currentCarKey);
  title.textContent = "🚗 ماشین";

  if (!car.repaired) {
    const row = document.createElement("div");
    row.className = "item-row";
    const costText = Object.entries(CAR_ENGINE_NEED).map(([k, v]) => {
      const have = state.inventory[k] || 0;
      const ok = have >= v;
      return `${ITEM_FA[k]} ${v} <span style="color:${ok ? '#7bd88f' : '#e07a7a'}">(داری ${have})</span>`;
    }).join("، ");
    const can = Object.entries(CAR_ENGINE_NEED).every(([k, v]) => (state.inventory[k] || 0) >= v);
    row.innerHTML = `<span class="name">تعمیر موتور<div class="cost">نیاز: ${costText}</div></span>`;
    const b = document.createElement("button");
    b.textContent = "بساز";
    b.disabled = !can;
    b.onclick = () => {
      for (const [k, v] of Object.entries(CAR_ENGINE_NEED)) state.inventory[k] -= v;
      car.repaired = true;
      panelFeedback("موتور تعمیر شد ✅");
      toast("موتور تعمیر شد! حالا بنزین بریز ⛽");
      openPanel("car", currentCarKey);
    };
    row.appendChild(b);
    content.appendChild(row);
    return;
  }

  const healthRow = document.createElement("div");
  healthRow.className = "item-row";
  healthRow.innerHTML = `<span class="name">🔧 سلامت بدنه: ${Math.round(car.health)}٪</span>`;
  if (car.health < 100) {
    const hasWrench = (state.inventory.wrench || 0) > 0;
    const b = document.createElement("button");
    b.textContent = "تعمیر با آچار (+۵۰٪)";
    b.disabled = !hasWrench;
    b.onclick = () => {
      state.inventory.wrench -= 1;
      car.health = Math.min(100, car.health + 50);
      panelFeedback("بدنه تعمیر شد ✅");
      toast("بدنه تعمیر شد 🔧");
      openPanel("car", currentCarKey);
    };
    healthRow.appendChild(b);
  }
  content.appendChild(healthRow);

  const fuelRow = document.createElement("div");
  fuelRow.className = "item-row";
  fuelRow.innerHTML = `<span class="name">⛽ بنزین: ${Math.round(car.fuel)}٪</span>`;
  if (car.fuel < 100) {
    const hasFuel = (state.inventory.fuel_can || 0) > 0;
    const b = document.createElement("button");
    b.textContent = "پر کردن با قوطی بنزین";
    b.disabled = !hasFuel;
    b.onclick = () => {
      state.inventory.fuel_can -= 1;
      car.fuel = Math.min(100, car.fuel + 34);
      panelFeedback("بنزین اضافه شد ✅");
      toast("بنزین اضافه شد ⛽");
      openPanel("car", currentCarKey);
    };
    fuelRow.appendChild(b);
  }
  content.appendChild(fuelRow);
  if ((state.inventory.corn || 0) > 0 || true) {
    const hintRow = document.createElement("div");
    hintRow.className = "item-row";
    hintRow.innerHTML = `<span class="name" style="font-size:11px;color:#aaa">قوطی بنزین نداری؟ تو منوی «ساخت» با ۴ ذرت یه قوطی بساز 🌽</span>`;
    content.appendChild(hintRow);
  }

  const rideRow = document.createElement("div");
  rideRow.className = "item-row";
  rideRow.innerHTML = `<span class="name">${inCar && currentCarKey === carKey ? "سوار ماشینی" : "کنار ماشینی"}</span>`;
  const rb = document.createElement("button");
  if (inCar) {
    rb.textContent = "پیاده شو";
    rb.onclick = () => { exitCar(); panelFeedback("پیاده شدی"); closePanel(); };
  } else {
    rb.textContent = "سوار شو";
    rb.disabled = car.fuel <= 0;
    rb.onclick = () => { inCar = true; drivingCarKey = currentCarKey; panelFeedback("سوار شدی 🚗"); closePanel(); };
  }
  rideRow.appendChild(rb);
  content.appendChild(rideRow);
}

// وقتی پیاده می‌شی (دستی، بی‌بنزینی، یا خراب شدن ماشین) دقیقاً همینجا پارک می‌مونه
function exitCar() {
  if (drivingCarKey) {
    const cs = getCarState(drivingCarKey);
    cs.posX = state.player.x;
    cs.posY = state.player.y;
  }
  inCar = false;
  drivingCarKey = null;
}

function craft(recipe) {
  for (const [k, v] of Object.entries(recipe.need)) state.inventory[k] -= v;
  for (const [k, v] of Object.entries(recipe.give)) state.inventory[k] = (state.inventory[k] || 0) + v;
  panelFeedback(recipe.name + " ساخته شد ✅");
  toast(recipe.name + " ساخته شد ✅");
}

function useBandage() {
  if ((state.inventory.bandage || 0) <= 0) return;
  state.inventory.bandage -= 1;
  state.player.health = Math.min(100, state.player.health + 25);
  panelFeedback("مصرف شد، +۲۵ سلامتی ✅");
  toast("زخم بسته شد، +۲۵ سلامتی");
}

function consumeItem(k) {
  if ((state.inventory[k] || 0) <= 0) return;
  state.inventory[k] -= 1;
  if (k === "food") state.player.hunger = Math.min(100, state.player.hunger + 30);
  if (k === "water") state.player.thirst = Math.min(100, state.player.thirst + 30);
  panelFeedback(ITEM_FA[k] + " مصرف شد ✅");
  toast((k === "food" ? "غذا خوردی" : "آب نوشیدی") + " 🙂");
}

// ==================== toast ====================
let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
}

// ==================== جاگذاری سازه ====================
function tryPlace(wx, wy) {
  const tx = Math.round(wx / TILE), ty = Math.round(wy / TILE);
  const dist = Math.hypot(wx - state.player.x, wy - state.player.y);
  if (dist > INTERACT_RANGE) { toast("خیلی دوره!"); return; }
  const key = modKey(tx, ty);
  if (state.modifications[key] && state.modifications[key].build) { toast("اینجا قبلاً چیزی ساخته شده"); return; }
  if ((state.inventory[placeMode] || 0) <= 0) { toast("دیگه " + ITEM_FA[placeMode] + " نداری"); placeMode = null; return; }
  state.inventory[placeMode] -= 1;
  state.modifications[key] = { ...(state.modifications[key] || {}), build: placeMode };
  toast(ITEM_FA[placeMode] + " ساخته شد 🏗️");
  placeMode = null;
}

// ==================== تعامل نزدیک ====================
function nearestResource() {
  const px = state.player.x, py = state.player.y;
  const ctx0 = Math.floor(px / TILE), cty0 = Math.floor(py / TILE);
  let best = null, bestDist = INTERACT_RANGE;
  for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
    const tx = ctx0 + dx, ty = cty0 + dy;
    const key = modKey(tx, ty);
    if (state.modifications[key] && state.modifications[key].harvested) continue;
    const res = tileResource(tx, ty, state.worldSeed);
    if (!res) continue;
    const wx = tx * TILE, wy = ty * TILE;
    const d = Math.hypot(wx - px, wy - py);
    if (d < bestDist) { bestDist = d; best = { tx, ty, res, wx, wy }; }
  }
  return best;
}

function doInteract() {
  if (!state || isDead || isPanelOpen) return;
  const car = nearestCar();
  if (car) { openPanel("car", car.key); return; }

  const res = nearestResource();
  if (res) {
    const def = RESOURCE_NODES[res.res];
    const amt = def.amount[0] + Math.floor(Math.random() * (def.amount[1] - def.amount[0] + 1));
    state.inventory[def.gives] = (state.inventory[def.gives] || 0) + amt;
    state.modifications[modKey(res.tx, res.ty)] = { harvested: true };
    toast(`+${amt} ${ITEM_FA[def.gives]}`);
    return;
  }
  toast("چیزی برای تعامل نزدیک نیست");
}

// ==================== حمله‌ی مبتنی بر جهت ====================
function currentWeaponKey() {
  return state.equipped && WEAPON_RANGE[state.equipped] ? state.equipped : "fists";
}

function angleDiffDeg(a, b) {
  let d = (a - b) * 180 / Math.PI;
  while (d > 180) d -= 360;
  while (d < -180) d += 360;
  return Math.abs(d);
}

function performAimedAttack() {
  const range = WEAPON_RANGE[currentWeaponKey()];
  const dmg = WEAPON_DAMAGE[currentWeaponKey()];
  attackPulseUntil = performance.now() + 180;
  let target = null, bestD = Infinity;
  for (const z of zombies) {
    const dx = z.x - state.player.x, dy = z.y - state.player.y;
    const d = Math.hypot(dx, dy);
    if (d > range) continue;
    const ang = Math.atan2(dy, dx);
    if (angleDiffDeg(ang, playerFacing) > ATTACK_CONE_DEG) continue;
    if (d < bestD) { bestD = d; target = z; }
  }
  if (!target) return;
  target.hp -= dmg;
  target.hitFlashUntil = performance.now() + 200;
  if (target.hp <= 0) {
    zombies = zombies.filter((z) => z !== target);
    toast("زامبی نابود شد 💀");
  }
}

// ==================== زامبی‌ها ====================
function spawnZombie() {
  if (zombies.length >= ZOMBIE_MAX) return;
  const ang = Math.random() * Math.PI * 2;
  const dist = 420 + Math.random() * 150;
  zombies.push({
    x: state.player.x + Math.cos(ang) * dist,
    y: state.player.y + Math.sin(ang) * dist,
    hp: 60,
    facing: 0,
    alerted: false,
    hitFlashUntil: 0,
    alertPulseUntil: 0,
    walkPhase: Math.random() * 10,
    type: Math.random() < 0.5 ? "zombie1" : "zombie2",
  });
}

function updateZombies(dt) {
  const now = performance.now();
  if (now - lastZombieSpawn > ZOMBIE_SPAWN_EVERY) { spawnZombie(); lastZombieSpawn = now; }
  for (const z of zombies) {
    const dx = state.player.x - z.x, dy = state.player.y - z.y;
    const d = Math.hypot(dx, dy) || 1;

    if (!z.alerted) {
      if (d <= ZOMBIE_SIGHT_RANGE) {
        z.alerted = true;
        z.alertPulseUntil = now + 700;
      }
    } else if (d > ZOMBIE_LOSE_INTEREST) {
      z.alerted = false;
    }

    if (z.alerted) {
      z.facing = Math.atan2(dy, dx);
      z.walkPhase += dt * 0.25;
      moveWithCollision(z, (dx / d) * ZOMBIE_SPEED * dt, (dy / d) * ZOMBIE_SPEED * dt, isSolidForZombie);
      if (d < 26) {
        if (inCar) {
          const car = getCarState(drivingCarKey || "main");
          car.health = Math.max(0, car.health - ZOMBIE_DAMAGE * dt * 0.06);
          if (car.health <= 0) {
            car.repaired = false;
            exitCar();
            toast("ماشین از کار افتاد! 💥");
          }
        } else {
          state.player.health -= ZOMBIE_DAMAGE * dt * 0.06;
          playerHitFlashUntil = now + 200;
        }
      }
    }
  }
}

// ==================== حرکت و جهت بازیکن ====================
let playerWalkPhase = 0;
function updatePlayer(dt) {
  const p = state.player;
  const moving = Math.hypot(joyVec.x, joyVec.y) > 0.15;
  const aiming = Math.hypot(aimVec.x, aimVec.y) > 0.2;

  const speed = (inCar ? PLAYER_SPEED * 3.4 : PLAYER_SPEED) * (state.player.stamina > 0 ? 1 : 0.55);
  if (moving) {
    const dx = joyVec.x * speed * dt, dy = joyVec.y * speed * dt;
    playerWalkPhase += dt * 0.28;
    if (inCar) {
      p.x += dx; p.y += dy;
      const car = getCarState(drivingCarKey || "main");
      car.fuel = Math.max(0, car.fuel - dt * 0.015);
      if (car.fuel <= 0) { exitCar(); toast("بنزین تموم شد، پیاده شدی"); }
    } else {
      moveWithCollision(p, dx, dy, isSolidForPlayer);
      state.player.stamina = Math.max(0, state.player.stamina - dt * 0.035);
    }
  } else if (!inCar) {
    state.player.stamina = Math.min(100, state.player.stamina + dt * 0.14);
  }

  if (aiming) {
    playerFacing = Math.atan2(aimVec.y, aimVec.x);
  } else if (moving) {
    playerFacing = Math.atan2(joyVec.y, joyVec.x);
  }

  if (aiming) {
    const now = performance.now();
    if (now - lastAttackTime > ATTACK_INTERVAL_MS) {
      lastAttackTime = now;
      performAimedAttack();
    }
  }

  p.hunger = Math.max(0, p.hunger - dt * 0.01);
  p.thirst = Math.max(0, p.thirst - dt * 0.015);
  if (p.hunger <= 0 || p.thirst <= 0) p.health = Math.max(0, p.health - dt * 0.03);
  p.health = Math.min(100, p.health);

  if (p.health <= 0 && !isDead) onDeath();
}

// ==================== دوربین و رندر ====================
function getCamera() { return { x: state.player.x, y: state.player.y }; }

function worldToScreen(wx, wy) {
  const cam = getCamera();
  return { x: canvas.width / 2 + (wx - cam.x), y: canvas.height / 2 + (wy - cam.y) };
}

function drawWorld() {
  ctx.fillStyle = "#4a8a3f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cam = getCamera();
  const tilesX = Math.ceil(canvas.width / TILE) + 2;
  const tilesY = Math.ceil(canvas.height / TILE) + 2;
  const centerTX = Math.round(cam.x / TILE), centerTY = Math.round(cam.y / TILE);

  for (let dx = -tilesX; dx <= tilesX; dx++) {
    for (let dy = -tilesY; dy <= tilesY; dy++) {
      const tx = centerTX + dx, ty = centerTY + dy;
      const wx = tx * TILE, wy = ty * TILE;
      const s = worldToScreen(wx, wy);
      if (s.x < -TILE || s.x > canvas.width + TILE || s.y < -TILE || s.y > canvas.height + TILE) continue;

      // زمین یکدست سبز با کمی تنوع رنگ ملایم (بدون نقشه‌ی خاکی به‌هم‌ریخته)
      const g = hash2(tx, ty, state.worldSeed + 999);
      ctx.fillStyle = g < 0.15 ? "#4f9345" : (g > 0.9 ? "#457c3c" : "#4a8a3f");
      ctx.fillRect(s.x - TILE / 2, s.y - TILE / 2, TILE, TILE);

      const key = modKey(tx, ty);
      const mod = state.modifications[key];

      if (mod && mod.build) {
        if (mod.build === "wall") {
          if (imgReady(IMG.wall_user)) {
            ctx.drawImage(IMG.wall_user, s.x - TILE / 2, s.y - TILE / 2, TILE, TILE);
          } else {
            ctx.fillStyle = "#8a6239";
            ctx.fillRect(s.x - TILE / 2 + 2, s.y - TILE / 2 + 2, TILE - 4, TILE - 4);
          }
        } else if (mod.build === "door") {
          ctx.fillStyle = BUILDABLE.door;
          ctx.fillRect(s.x - TILE / 2 + 6, s.y - TILE / 2, TILE - 12, TILE);
        } else if (mod.build === "window") {
          ctx.fillStyle = BUILDABLE.window;
          ctx.fillRect(s.x - TILE / 2 + 2, s.y - TILE / 2 + 10, TILE - 4, TILE - 20);
        } else {
          ctx.fillStyle = BUILDABLE[mod.build];
          ctx.fillRect(s.x - TILE / 2 + 2, s.y - TILE / 2 + 2, TILE - 4, TILE - 4);
        }
        continue;
      }

      if (mod && mod.harvested) continue;

      const res = tileResource(tx, ty, state.worldSeed);
      if (res) {
        const def = RESOURCE_NODES[res];
        if (def.images) {
          const variant = pickVariant(def.images, tx, ty, state.worldSeed);
          const drawn = drawImageCentered(IMG[variant], s.x, s.y, def.drawH);
          if (!drawn) {
            ctx.fillStyle = def.color;
            ctx.beginPath(); ctx.arc(s.x, s.y, def.radius, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.fillStyle = def.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, def.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawCars() {
  const cars = getAllNearbyCars();
  for (const c of cars) {
    if (inCar && c.key === drivingCarKey) continue; // این ماشین الان زیر پلیره، جدا رسمش نمی‌کنیم
    const s = worldToScreen(c.x, c.y);
    if (s.x < -60 || s.x > canvas.width + 60 || s.y < -60 || s.y > canvas.height + 60) continue;
    const cs = getCarState(c.key);
    const carImg = IMG[c.color] || IMG.engine_orange;
    if (imgReady(carImg)) {
      if (!cs.repaired) ctx.filter = "grayscale(1) brightness(0.7)";
      else if (cs.health < 50) ctx.filter = "sepia(0.35) hue-rotate(-25deg)";
      drawImageCentered(carImg, s.x, s.y, 50);
      ctx.filter = "none";
    } else {
      ctx.fillStyle = cs.repaired ? "#2f7d3a" : "#555";
      ctx.fillRect(s.x - 20, s.y - 13, 40, 26);
    }
    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
    let label = !cs.repaired ? "🔧 موتور خرابه" : `⛽${Math.round(cs.fuel)}% 🔧${Math.round(cs.health)}%`;
    ctx.fillText(label, s.x, s.y - 32);
  }
}

function drawZombies() {
  const now = performance.now();
  for (const z of zombies) {
    const s = worldToScreen(z.x, z.y);
    const by = s.y;

    const sheet = ZOMBIE_SHEETS[z.type] || ZOMBIE_SHEETS.zombie1;
    const frameIdx = z.alerted ? Math.floor(z.walkPhase * 2) % sheet.frames : 0;
    const drawn = drawSpriteFrameRotated(IMG[z.type || "zombie1"], sheet, frameIdx, s.x, by, 34, (z.facing || 0) + Math.PI / 2);
    if (!drawn) {
      ctx.fillStyle = z.alerted ? "#3f8f4a" : "#5c8f63";
      ctx.beginPath(); ctx.arc(s.x, by, 13, 0, Math.PI * 2); ctx.fill();
    }
    if (now < z.hitFlashUntil) drawHitFlash(s.x, by, 16);
    if (now < z.alertPulseUntil) {
      ctx.fillStyle = "#fff2a8";
      ctx.font = "16px Tahoma";
      ctx.textAlign = "center";
      ctx.fillText("❗", s.x, by - 26);
    }
    ctx.fillStyle = "#111"; ctx.fillRect(s.x - 14, s.y - 24, 28 * (z.hp / 60), 4);
  }
}

function drawWaypoint() {
  if (!state.waypoint) return;
  const wp = state.waypoint;
  const s = worldToScreen(wp.x, wp.y);
  const dist = Math.round(Math.hypot(wp.x - state.player.x, wp.y - state.player.y));
  const margin = 44;
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const onScreen = s.x > margin && s.x < canvas.width - margin && s.y > margin + 40 && s.y < canvas.height - 90;

  if (onScreen) {
    ctx.fillStyle = "#e05353";
    ctx.beginPath(); ctx.arc(s.x, s.y - 18, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s.x - 6, s.y - 12); ctx.lineTo(s.x + 6, s.y - 12); ctx.lineTo(s.x, s.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
    ctx.fillText(dist + "m", s.x, s.y - 30);
  } else {
    const ang = Math.atan2(s.y - cy, s.x - cx);
    const ex = cx + Math.cos(ang) * (canvas.width / 2 - margin);
    const ey = cy + Math.sin(ang) * (canvas.height / 2 - margin);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(ang);
    ctx.fillStyle = "#e05353";
    ctx.beginPath();
    ctx.moveTo(13, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
    ctx.fillText(dist + "m", ex, ey - 14);
  }
}

function drawPlayer() {
  const s = { x: canvas.width / 2, y: canvas.height / 2 };
  const now = performance.now();

  const aiming = Math.hypot(aimVec.x, aimVec.y) > 0.2;
  if (aiming) {
    const range = WEAPON_RANGE[currentWeaponKey()];
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(playerFacing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const coneRad = ATTACK_CONE_DEG * Math.PI / 180;
    ctx.arc(0, 0, range, -coneRad, coneRad);
    ctx.closePath();
    ctx.fillStyle = "rgba(224,83,83,0.22)";
    ctx.fill();
    ctx.strokeStyle = "rgba(224,83,83,0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    const label = document.getElementById("range-label");
    label.textContent = `${ITEM_FA[currentWeaponKey()] || "دست خالی"} — برد ${range}`;
    label.classList.add("show");
  } else {
    document.getElementById("range-label").classList.remove("show");
  }

  const moving = Math.hypot(joyVec.x, joyVec.y) > 0.15;
  let by = s.y;
  if (moving && !inCar) by += Math.sin(playerWalkPhase) * 3;

  if (inCar) {
    const drivingCar = getCarState(drivingCarKey || "main");
    const carColor = getAllNearbyCars().find((c) => c.key === (drivingCarKey || "main"));
    const carImg = IMG[(carColor && carColor.color) || "engine_orange"];
    // اسپرایت موتور پیش‌فرض رو به بالاست، پس ۹۰ درجه اضافه می‌کنیم تا با جهت واقعی حرکت یکی بشه
    const drawn = drawImageRotated(carImg, s.x, by, 46, playerFacing + Math.PI / 2);
    if (!drawn) {
      ctx.fillStyle = "#d9a441";
      ctx.beginPath(); ctx.arc(s.x, by, 16, 0, Math.PI * 2); ctx.fill();
    }
    // پلیر رو سوار بر موتور نشون بده (بدون پا و اسلحه، چون نشسته)
    drawImageRotated(IMG.player, s.x, by, 22, playerFacing);
    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
    ctx.fillText(`⛽${Math.round(drivingCar.fuel)}%`, s.x, by - 34);
    return;
  }

  drawLimbsAndWeapon(s.x, by, playerFacing, playerWalkPhase, currentWeaponKey(), now < attackPulseUntil);

  const drawn = drawImageRotated(IMG.player, s.x, by, 32, playerFacing);
  if (!drawn) {
    ctx.fillStyle = "#e8c07a";
    ctx.beginPath(); ctx.arc(s.x, by, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3b2a17"; ctx.lineWidth = 2; ctx.stroke();
  }
  if (now < playerHitFlashUntil) drawHitFlash(s.x, by, 18);
}

// ==================== حلقه اصلی ====================
let lastTime = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(2.2, (now - lastTime) / 16.67);
  lastTime = now;

  if (state && !isDead && !isPanelOpen && !isHidden) {
    updatePlayer(dt);
    updateZombies(dt);
  }

  if (state) {
    drawWorld();
    drawCars();
    drawZombies();
    drawWaypoint();
    drawPlayer();
    updateHUD();

    if (!isDead && !isPanelOpen) {
      saveTimer += dt;
      if (saveTimer > 300) { saveTimer = 0; saveState(); }
    }
  }
  requestAnimationFrame(loop);
}

function updateHUD() {
  const p = state.player;
  document.getElementById("bar-health").style.width = Math.max(0, p.health) + "%";
  document.getElementById("bar-hunger").style.width = p.hunger + "%";
  document.getElementById("bar-thirst").style.width = p.thirst + "%";
  document.getElementById("bar-stamina").style.width = p.stamina + "%";
}

// ==================== شروع ====================
(async function init() {
  try {
    await loadState();
    document.getElementById("loading").style.display = "none";
    lastZombieSpawn = performance.now();

    if (!state.guideSeen) {
      openPanel("help");
      state.guideSeen = true;
      saveState();
    }

    loop();
  } catch (e) {
    const el = document.getElementById("loading");
    el.style.display = "flex";
    el.style.fontSize = "13px";
    el.style.padding = "20px";
    el.textContent = "⚠️ خطا موقع شروع: " + (e && e.message ? e.message : e);
  }
})();

addEventListener("blur", saveState);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    isHidden = true;
    saveState();
  } else {
    isHidden = false;
    lastTime = performance.now(); // جلوگیری از یه dt غول‌پیکر که باعث پرش ناگهانی بشه
  }
});

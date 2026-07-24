// ==================== نمایش خطای واقعی ====================
window.addEventListener("error", function (e) {
  const el = document.getElementById("loading");
  if (el) {
    el.style.display = "flex";
    el.style.fontSize = "13px";
    el.style.padding = "20px";
    el.textContent = "⚠️ خطا: " + (e.message || "نامشخص") + " (خط " + (e.lineno || "?") + ")";
  }
});

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
    { id: "axe",      name: "تبر",        need: { wood: 5 },              give: { axe: 1 },      info: "دمیج 25 — برد 70" },
    { id: "pick",     name: "کلنگ",       need: { wood: 3, stone: 5 },    give: { pick: 1 },     info: "دمیج 20 — برد 65" },
    { id: "knife",    name: "چاقو",       need: { wood: 2, stone: 2 },    give: { knife: 1 },    info: "دمیج 35 — برد 60" },
    { id: "wrench",   name: "آچار",       need: { stone: 4, metal: 3 },   give: { wrench: 1 },   info: "دمیج 15 — برد 55 — همچنین برای تعمیر بدنه ماشین" },
    { id: "bandage",  name: "باند زخم",   need: { cloth: 3 },             give: { bandage: 2 },  info: "هر باند +۲۵ سلامتی" },
    { id: "fuel_can", name: "قوطی بنزین", need: { corn: 4 },              give: { fuel_can: 1 }, info: "با ذرت ساخته می‌شه، برای پر کردن باک ماشین" },
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
  tree:  { gives: "wood",  amount: [1, 3], images: ["tree1", "tree2", "tree_user", "wood_small"], drawH: 36, color: "#2e6b1f", radius: 10 },
  rock:  { gives: "stone", amount: [1, 2], images: ["rock1", "rock2", "rock3"], drawH: 24, color: "#8a8a8a", radius: 9 },
  scrap: { gives: "metal", amount: [1, 2], images: ["crate1_user", "crate2_user"], drawH: 26, color: "#b5652b", radius: 8 },
  bush:  { gives: "cloth", amount: [1, 1], color: "#7a9e4a", radius: 7 },
  berry: { gives: "food",  amount: [1, 2], color: "#c73f5c", radius: 6 },
  well:  { gives: "water", amount: [1, 2], color: "#3f7fc7", radius: 7 },
  corn:  { gives: "corn",  amount: [1, 2], color: "#e8c93a", radius: 7 },
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

// ==================== تنظیمات چرخه روز/شب ====================
const DAY_NIGHT_CYCLE_MS = 120000; // 2 دقیقه برای یک چرخه کامل
const NIGHT_START = 50;
const NIGHT_END = 100;

// ==================== تنظیمات آب‌وهوا ====================
const WEATHER_CYCLE_MIN = 180000; // 3 دقیقه
const WEATHER_CYCLE_MAX = 360000; // 6 دقیقه
const RAIN_DROPS = 80;

// ==================== تنظیمات حمله گروهی ====================
const HORDE_MIN_INTERVAL = 30000;
const HORDE_MAX_INTERVAL = 60000;
const HORDE_ZOMBIE_COUNT = 4;
const HORDE_SPAWN_DIST_MIN = 400;
const HORDE_SPAWN_DIST_MAX = 600;

// ==================== تنظیمات NPC ====================
const NPC_COUNT = 4;
const NPC_WANDER_RANGE = 100;
const NPC_INTERACT_DIST = 100;
const NPC_MESSAGES = ["سلام!", "به من غذا بده", "کمک!", "اینجا امن نیست", "مواظب باش!"];

// ==================== تنظیمات سگ ====================
const DOG_SPEED = 2.2;
const DOG_SIGHT_RANGE = 180;
const DOG_ATTACK_RANGE = 35;
const DOG_ATTACK_DAMAGE = 18;
const DOG_ATTACK_INTERVAL = 800;
const DOG_MAX_HP = 100;
const DOG_FOLLOW_DISTANCE = 60;
const DOG_LOOT_CHANCE = 0.3;
const DOG_ALERT_RANGE = 150;

const HELP_TEXT_HTML = `
<div class="help-item">🕹️ <b>آنالوگ چپ:</b> حرکت</div>
<div class="help-item">🎯 <b>آنالوگ راست (قرمز):</b> نشونه‌گیری و حمله — نگه‌دار تا خودکار بزنه</div>
<div class="help-item">✋ <b>دکمه دست:</b> برداشتن منبع نزدیک یا تعامل با ماشین</div>
<div class="help-item">📍 <b>دکمه GPS:</b> یه نشون رو نقشه بذار تا گم نشی؛ دوباره بزن تا حذفش کنی</div>
<div class="help-item">🌲 <b>منابع:</b> درخت=چوب، سنگ=سنگ، بشکه=فلز، بوته=پارچه، بوته قرمز=غذا، چشمه=آب، ذرت=ذرت</div>
<div class="help-item">🛠️ <b>ساخت:</b> تو پنل ساخت، برد و دمیج هر سلاح نوشته شده</div>
<div class="help-item">🏠 <b>بنا:</b> دیوار جلوی همه رو می‌گیره؛ در و پنجره فقط جلوی زامبی</div>
<div class="help-item">🧟 <b>زامبی:</b> فقط وقتی نزدیکش بشی متوجه‌ات می‌شه</div>
<div class="help-item">🚗 <b>ماشین:</b> اول موتور (۳فلز+۲سنگ) بعد بنزین</div>
<div class="help-item">🐕 <b>سگ:</b> همراهته! زامبی‌ها رو می‌بینه و بهشون حمله می‌کنه</div>
<div class="help-item">🌙 <b>شب:</b> زامبی‌ها سریع‌تر و قوی‌تر می‌شن</div>
<div class="help-item">🌧️ <b>باران:</b> سرعت حرکت کمتر</div>
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

// ==================== رسم سگ از نمای بالا ====================
function drawDogTopDown(x, y, facing, walkPhase, isDowned) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const bodyColor = isDowned ? "#8B7355" : "#C4A57B";
  const darkColor = isDowned ? "#6B5340" : "#8B6F47";
  const size = 14;

  if (!isDowned) {
    const legOffset = Math.sin(walkPhase) * 3;
    ctx.fillStyle = darkColor;
    ctx.fillRect(size * 0.6, -size * 0.55 + legOffset, size * 0.3, size * 0.35);
    ctx.fillRect(size * 0.6, size * 0.2 - legOffset, size * 0.3, size * 0.35);
    ctx.fillRect(-size * 0.6, -size * 0.55 - legOffset, size * 0.3, size * 0.35);
    ctx.fillRect(-size * 0.6, size * 0.2 + legOffset, size * 0.3, size * 0.35);
  } else {
    ctx.fillStyle = darkColor;
    ctx.fillRect(size * 0.4, -size * 0.45, size * 0.25, size * 0.25);
    ctx.fillRect(size * 0.4, size * 0.2, size * 0.25, size * 0.25);
    ctx.fillRect(-size * 0.5, -size * 0.45, size * 0.25, size * 0.25);
    ctx.fillRect(-size * 0.5, size * 0.2, size * 0.25, size * 0.25);
  }

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(size * 0.7, 0, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(size * 0.5, -size * 0.35, size * 0.2, size * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.35, size * 0.2, size * 0.3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  if (isDowned) {
    ctx.strokeStyle = "#4a3520";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.1);
    ctx.lineTo(-size * 0.3, size * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.1);
    ctx.lineTo(0, size * 0.1);
    ctx.stroke();
  }

  ctx.fillStyle = darkColor;
  ctx.beginPath();
  const tailWag = isDowned ? 0 : Math.sin(walkPhase * 2) * 0.3;
  ctx.ellipse(-size * 0.9, 0, size * 0.3, size * 0.15, tailWag, 0, Math.PI * 2);
  ctx.fill();

  if (!isDowned) {
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(size * 0.9, -size * 0.15, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.9, size * 0.15, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size * 0.85, -size * 0.2);
    ctx.lineTo(size * 0.95, -size * 0.1);
    ctx.moveTo(size * 0.95, -size * 0.2);
    ctx.lineTo(size * 0.85, -size * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.85, size * 0.1);
    ctx.lineTo(size * 0.95, size * 0.2);
    ctx.moveTo(size * 0.95, size * 0.1);
    ctx.lineTo(size * 0.85, size * 0.2);
    ctx.stroke();
  }

  ctx.restore();
}

// ==================== آپدیت سگ ====================
function updateDog(dt) {
  if (!dog || dog.isDowned) return;

  const now = performance.now();
  const dx = state.player.x - dog.x;
  const dy = state.player.y - dog.y;
  const distToPlayer = Math.hypot(dx, dy);

  let nearestZombie = null;
  let nearestZombieDist = DOG_SIGHT_RANGE;
  for (const z of zombies) {
    const zdx = z.x - dog.x;
    const zdy = z.y - dog.y;
    const zd = Math.hypot(zdx, zdy);
    if (zd < nearestZombieDist) {
      nearestZombieDist = zd;
      nearestZombie = z;
    }
  }

  if (nearestZombie && nearestZombieDist < DOG_SIGHT_RANGE) {
    dog.facing = Math.atan2(nearestZombie.y - dog.y, nearestZombie.x - dog.x);
    dog.walkPhase += dt * 0.3;

    if (nearestZombieDist > DOG_ATTACK_RANGE) {
      const moveDx = (nearestZombie.x - dog.x) / nearestZombieDist * DOG_SPEED * dt;
      const moveDy = (nearestZombie.y - dog.y) / nearestZombieDist * DOG_SPEED * dt;
      moveWithCollision(dog, moveDx, moveDy, () => false);
    } else {
      if (now - dog.lastAttackTime > DOG_ATTACK_INTERVAL) {
        dog.lastAttackTime = now;
        nearestZombie.hp -= DOG_ATTACK_DAMAGE;
        nearestZombie.hitFlashUntil = now + 200;
        if (nearestZombie.hp <= 0) {
          zombies = zombies.filter((z) => z !== nearestZombie);
          toast("سگت زامبی رو کشت! 🐕");
        }
      }
    }
  } else {
    if (distToPlayer > DOG_FOLLOW_DISTANCE) {
      dog.facing = Math.atan2(dy, dx);
      dog.walkPhase += dt * 0.25;
      const moveDx = dx / distToPlayer * DOG_SPEED * dt;
      const moveDy = dy / distToPlayer * DOG_SPEED * dt;
      moveWithCollision(dog, moveDx, moveDy, () => false);
    }
  }

  for (const z of zombies) {
    const zdx = z.x - dog.x;
    const zdy = z.y - dog.y;
    const zd = Math.hypot(zdx, zdy);
    if (zd < 25 && z.alerted) {
      dog.hp -= ZOMBIE_DAMAGE * dt * 0.08;
      if (dog.hp <= 0) {
        dog.hp = 0;
        dog.isDowned = true;
        toast("سگت زخمی شد! با غذا درمانش کن 🐕💔");
      }
    }
  }
}

// ==================== رسم سگ ====================
function drawDog() {
  if (!dog) return;
  const s = worldToScreen(dog.x, dog.y);
  drawDogTopDown(s.x, s.y, dog.facing, dog.walkPhase, dog.isDowned);

  const barWidth = 30;
  const barHeight = 4;
  const hpPercent = dog.hp / DOG_MAX_HP;

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(s.x - barWidth / 2, s.y - 25, barWidth, barHeight);

  ctx.fillStyle = hpPercent > 0.5 ? "#4CAF50" : (hpPercent > 0.25 ? "#FFC107" : "#F44336");
  ctx.fillRect(s.x - barWidth / 2, s.y - 25, barWidth * hpPercent, barHeight);

  ctx.fillStyle = "#fff";
  ctx.font = "10px Tahoma";
  ctx.textAlign = "center";
  ctx.fillText("🐕", s.x, s.y - 28);
}

// ==================== درمان سگ ====================
function healDog(foodType) {
  if (!dog || !dog.isDowned) return;
  if ((state.inventory[foodType] || 0) <= 0) return;

  state.inventory[foodType] -= 1;
  dog.hp = DOG_MAX_HP;
  dog.isDowned = false;
  dog.x = state.player.x + 30;
  dog.y = state.player.y;

  panelFeedback("سگ درمان شد! 🐕❤️");
  toast("سگت دوباره زنده شد! 🐕");
}

// ==================== ایجاد سگ ====================
function initDog() {
  if (!dog) {
    dog = {
      x: state.player.x + 30,
      y: state.player.y,
      hp: DOG_MAX_HP,
      facing: 0,
      walkPhase: 0,
      isDowned: false,
      lastAttackTime: 0,
    };
  }
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
    if (data.ok) { 
      state = data.state; 
      normalizeState(); 
      return; 
    }
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
  
  // ایجاد سگ
  initDog();
  
  // ایجاد متغیرهای جدید
  if (state.gameTime === undefined) state.gameTime = 0;
  if (state.dogLootEnabled === undefined) state.dogLootEnabled = true;
  if (state.dogAlertEnabled === undefined) state.dogAlertEnabled = true;
}

function freshLocalState() {
  return {
    worldSeed: Math.floor(Math.random() * 100000),
    player: { x: 0, y: 0, health: 100, hunger: 100, thirst: 100, stamina: 100 },
    inventory: {}, equipped: null,
    cars: { main: { repaired: false, fuel: 0, health: 100 } },
    modifications: {}, guideSeen: false, waypoint: null,
    gameTime: 0, // چرخه روز/شب
    dogLootEnabled: true,
    dogAlertEnabled: true,
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
      const rangeTxt = equippable ? `(برد ${WEAPON_RANGE[k]})` : "";
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
      } else if (k === "food" || k === "corn") {
        if (dog && dog.isDowned) {
          const b = document.createElement("button");
          b.textContent = "درمان سگ 🐕";
          b.onclick = () => { healDog(k); openPanel("inventory"); };
          row.appendChild(b);
        }
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

// ==================== پنل ماشین ====================
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

  const hintRow = document.createElement("div");
  hintRow.className = "item-row";
  hintRow.innerHTML = `<span class="name" style="font-size:11px;color:#aaa">قوطی بنزین نداری؟ تو منوی «ساخت» با ۴ ذرت یه قوطی بساز 🌽</span>`;
  content.appendChild(hintRow);

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

  if (inCar && drivingCarKey) {
    openPanel("car", drivingCarKey);
    return;
  }

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

// ==================== حمله ====================
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

// ==================== حرکت بازیکن ====================
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

// ==================== چرخه روز/شب ====================
function updateDayNight(dt) {
  // به‌روزرسانی زمان روز/شب
  state.gameTime = (state.gameTime + (dt / DAY_NIGHT_CYCLE_MS) * 100) % 100;
  
  // تغییر رنگ پس‌زمینه
  const dayPercent = (state.gameTime % 100) / 100;
  let bgR, bgG, bgB;
  
  if (state.gameTime < NIGHT_START) {
    // روز
    bgR = Math.floor(74 + 50 * dayPercent);
    bgG = Math.floor(125 + 55 * dayPercent);
    bgB = Math.floor(63 + 100 * dayPercent);
  } else {
    // شب
    bgR = Math.floor(4 + 10 * (1 - dayPercent));
    bgG = Math.floor(10 + 20 * (1 - dayPercent));
    bgB = Math.floor(24 + 40 * (1 - dayPercent));
  }
  document.body.style.background = `rgb(${bgR}, ${bgG}, ${bgB})`;
}

// ==================== آب‌وهوا ====================
function updateWeather(dt) {
  // تغییر تصادفی آب‌وهوا
  if (weatherTimer === undefined || weatherTimer > WEATHER_CYCLE_MAX) {
    weather = ['clear', 'rain', 'fog'][Math.floor(Math.random() * 3)];
    weatherTimer = 0;
  }
  weatherTimer += dt;
  
  // تغییر سرعت حرکت بازیکن در باران
  if (weather === 'rain') {
    playerSpeedMultiplier = 0.9;
  } else {
    playerSpeedMultiplier = 1;
  }
}

// ==================== حمله گروهی ====================
function updateHorde(dt) {
  if (hordeMode) {
    // بررسی پایان حمله
    if (zombies.filter(z => z.horde).length === 0) {
      hordeMode = false;
      toast("حمله دفع شد ✅");
    }
  } else {
    // شروع حمله گروهی
    if (hordeTimer === undefined || hordeTimer > HORDE_MAX_INTERVAL) {
      hordeMode = true;
      hordeTimer = 0;
      
      // ایجاد زامبی‌های گروهی
      for (let i = 0; i < HORDE_ZOMBIE_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = HORDE_SPAWN_DIST_MIN + Math.random() * (HORDE_SPAWN_DIST_MAX - HORDE_SPAWN_DIST_MIN);
        zombies.push({
          x: state.player.x + Math.cos(angle) * distance,
          y: state.player.y + Math.sin(angle) * distance,
          hp: 60,
          facing: 0,
          alerted: true,
          hitFlashUntil: 0,
          alertPulseUntil: 0,
          walkPhase: Math.random() * 10,
          type: Math.random() < 0.5 ? "zombie1" : "zombie2",
          horde: true
        });
      }
    }
  }
  hordeTimer += dt;
}

// ==================== NPCهای سرگردان ====================
function updateNPCs(dt) {
  // ایجاد NPCهای جدید
  if (!npcs || npcs.length === 0) {
    npcs = [];
    for (let i = 0; i < NPC_COUNT; i++) {
      npcs.push({
        x: state.player.x + (Math.random() - 0.5) * 1000,
        y: state.player.y + (Math.random() - 0.5) * 1000,
        facing: Math.random() * Math.PI * 2,
        walkPhase: Math.random() * 10,
        messageTimer: 0,
        lastMessage: null
      });
    }
  }
  
  // به‌روزرسانی NPCها
  for (const npc of npcs) {
    // پرسه زدن در محدوده
    const angle = Math.random() * Math.PI * 2;
    npc.x += Math.cos(angle) * 0.5;
    npc.y += Math.sin(angle) * 0.5;
    
    // نمایش پیام در فاصله
    const dist = Math.hypot(npc.x - state.player.x, npc.y - state.player.y);
    if (dist < NPC_INTERACT_DIST) {
      npc.messageTimer += dt;
      if (npc.messageTimer > 2000 && npc.lastMessage !== true) {
        npc.lastMessage = true;
        toast(NPC_MESSAGES[Math.floor(Math.random() * NPC_MESSAGES.length)]);
      }
    } else {
      npc.messageTimer = 0;
      npc.lastMessage = null;
    }
  }
}

// ==================== ساخت زنجیره‌ای دیوار ====================
function tryPlaceWall(wx, wy) {
  const tx = Math.round(wx / TILE), ty = Math.round(wy / TILE);
  const dist = Math.hypot(wx - state.player.x, wy - state.player.y);
  
  if (dist > INTERACT_RANGE) { 
    toast("خیلی دوره!"); 
    return; 
  }
  
  const key = modKey(tx, ty);
  if (state.modifications[key] && state.modifications[key].build) { 
    toast("اینجا قبلاً چیزی ساخته شده"); 
    return; 
  }
  
  if ((state.inventory[placeMode] || 0) <= 0) { 
    toast("دیگه " + ITEM_FA[placeMode] + " نداری"); 
    placeMode = null; 
    return; 
  }
  
  // اتصال خودکار با دیوار قبلی
  if (lastWallPos && Math.hypot(tx - lastWallPos.x, ty - lastWallPos.y) <= 1) {
    // اتصال با دیوار قبلی
    state.inventory[placeMode] -= 1;
    state.modifications[key] = { ...(state.modifications[key] || {}), build: placeMode };
    toast(ITEM_FA[placeMode] + " ساخته شد 🏗️");
    lastWallPos = {x: tx, y: ty};
    return;
  }
  
  // ساخت دیوار جدید
  state.inventory[placeMode] -= 1;
  state.modifications[key] = { ...(state.modifications[key] || {}), build: placeMode };
  toast(ITEM_FA[placeMode] + " ساخته شد 🏗️");
  lastWallPos = {x: tx, y: ty};
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
    if (inCar && c.key === drivingCarKey) continue;
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
    const drawn = drawImageRotated(carImg, s.x, by, 46, playerFacing + Math.PI / 2);
    if (!drawn) {
      ctx.fillStyle = "#d9a441";
      ctx.beginPath(); ctx.arc(s.x, by, 16, 0, Math.PI * 2); ctx.fill();
    }
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
    updateDog(dt);
  }

  if (state) {
    drawWorld();
    drawCars();
    drawZombies();
    drawDog();
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
    lastTime = performance.now();
  }
});
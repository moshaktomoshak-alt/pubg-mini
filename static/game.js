// ==================== تنظیمات پایه ====================
const TILE = 40;              // پیکسل هر خونه
const CHUNK = 8;               // تعداد خونه در هر چانک
const RESOURCE_DENSITY = 0.06; // احتمال وجود منبع در هر خونه

const RECIPES = {
  craft: [
    { id: "axe",    name: "تبر",        need: { wood: 5 },              give: { axe: 1 } },
    { id: "pick",   name: "کلنگ",       need: { wood: 3, stone: 5 },    give: { pick: 1 } },
    { id: "knife",  name: "چاقو",       need: { wood: 2, stone: 2 },    give: { knife: 1 } },
    { id: "wrench", name: "آچار",       need: { stone: 4, metal: 3 },   give: { wrench: 1 } },
    { id: "bandage",name: "باند زخم",   need: { cloth: 3 },             give: { bandage: 2 } },
  ],
  build: [
    { id: "wall",  name: "دیوار چوبی", need: { wood: 6 },            give: { wall: 1 } },
    { id: "floor", name: "کف چوبی",    need: { wood: 4 },            give: { floor: 1 } },
    { id: "door",  name: "در",         need: { wood: 5, metal: 2 },  give: { door: 1 } },
  ],
};

const RESOURCE_NODES = {
  tree: { gives: "wood", amount: [1, 3], color: "#2e6b1f", radius: 10 },
  rock: { gives: "stone", amount: [1, 2], color: "#8a8a8a", radius: 9 },
  scrap:{ gives: "metal", amount: [1, 2], color: "#b5652b", radius: 8 },
  bush: { gives: "cloth", amount: [1, 1], color: "#7a9e4a", radius: 7 },
  berry:{ gives: "food",  amount: [1, 2], color: "#c73f5c", radius: 6 },
  well: { gives: "water", amount: [1, 2], color: "#3f7fc7", radius: 7 },
};

const BUILDABLE = { wall: "#7a5230", floor: "#c9ab7a", door: "#4b3620" };

const ITEM_FA = {
  wood: "چوب", stone: "سنگ", metal: "فلز", cloth: "پارچه", food: "غذا", water: "آب",
  axe: "تبر", pick: "کلنگ", knife: "چاقو", wrench: "آچار", bandage: "باند زخم",
  wall: "دیوار", floor: "کف", door: "در", engine_part: "قطعه موتور", fuel_can: "قوطی بنزین",
};

const INTERACT_RANGE = 55;
const ZOMBIE_SPEED = 1.1;
const PLAYER_SPEED = 2.6;
const ZOMBIE_DAMAGE = 6;
const ZOMBIE_MAX = 8;
const ZOMBIE_SPAWN_EVERY = 7000;
const CAR_WORLD_X = 0, CAR_WORLD_Y = -260;

// ==================== Telegram WebApp ====================
const tg = window.Telegram ? window.Telegram.WebApp : null;
if (tg) { tg.ready(); tg.expand(); }
const initData = tg ? tg.initData : "";

// ==================== وضعیت بازی ====================
let state = null;      // از سرور لود میشه
let zombies = [];
let lastZombieSpawn = 0;
let interactTarget = null;
let placeMode = null;  // نوع سازه‌ای که در حال جاگذاریشیم
let inCar = false;
let isDead = false;    // موقع مرگ و ریست دنیا true می‌شه

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
addEventListener("resize", resize);
resize();

// ==================== تصادفی قطعی (Deterministic) ====================
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

function modKey(tx, ty) { return tx + "_" + ty; }

// ==================== بارگذاری / ذخیره / ریست ====================
async function loadState() {
  try {
    const res = await fetch("/api/load", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
    });
    const data = await res.json();
    if (data.ok) { state = data.state; return; }
  } catch (e) { /* fallback زیر */ }
  // حالت آزمایشی بدون تلگرام (برای تست در مرورگر معمولی)
  state = freshLocalState();
}

function freshLocalState() {
  return {
    worldSeed: Math.floor(Math.random() * 100000),
    player: { x: 0, y: 0, health: 100, hunger: 100, thirst: 100, stamina: 100 },
    inventory: {}, equipped: null, car: { repaired: false, fuel: 0 }, modifications: {},
  };
}

let saveTimer = 0;
function saveState() {
  if (!initData || isDead) return; // فقط داخل تلگرام و وقتی زنده‌ایم سیو می‌کنیم
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
  inCar = false;

  const loadingEl = document.getElementById("loading");
  loadingEl.textContent = "💀 مُردی... دنیای جدیدی در حال ساخته شدنه";
  loadingEl.style.display = "flex";

  if (initData) {
    try {
      const res = await fetch("/api/reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
      });
      const data = await res.json();
      if (data.ok) state = data.state;
      else state = freshLocalState();
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
let joyVec = { x: 0, y: 0 };
(function setupJoystick() {
  const zone = document.getElementById("joystick-zone");
  const stick = document.getElementById("joystick-stick");
  let active = false, startX = 0, startY = 0, touchId = null;
  const MAX = 45;

  function move(clientX, clientY) {
    let dx = clientX - startX, dy = clientY - startY;
    const dist = Math.hypot(dx, dy);
    if (dist > MAX) { dx = dx / dist * MAX; dy = dy / dist * MAX; }
    stick.style.left = 37 + dx + "px";
    stick.style.top = 37 + dy + "px";
    joyVec.x = dx / MAX; joyVec.y = dy / MAX;
  }
  function reset() {
    active = false; touchId = null;
    stick.style.left = "37px"; stick.style.top = "37px";
    joyVec.x = 0; joyVec.y = 0;
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

  // پشتیبانی موس برای تست دسکتاپ
  zone.addEventListener("mousedown", (e) => { active = true; startX = e.clientX; startY = e.clientY; });
  addEventListener("mousemove", (e) => { if (active) move(e.clientX, e.clientY); });
  addEventListener("mouseup", reset);
})();

// ==================== تعامل با تپ روی صحنه ====================
canvas.addEventListener("click", (e) => onTapScreen(e.clientX, e.clientY));
canvas.addEventListener("touchstart", (e) => {
  if (e.target !== canvas) return;
  const t = e.touches[0];
  onTapScreen(t.clientX, t.clientY);
}, { passive: true });

function screenToWorld(sx, sy) {
  const cam = getCamera();
  return { x: cam.x + (sx - canvas.width / 2), y: cam.y + (sy - canvas.height / 2) };
}

function onTapScreen(sx, sy) {
  if (!state || isDead) return;
  const w = screenToWorld(sx, sy);
  if (placeMode) { tryPlace(w.x, w.y); return; }
}

document.getElementById("btn-interact").addEventListener("click", doInteract);
document.getElementById("btn-attack").addEventListener("click", doAttack);

// ==================== منوها ====================
document.querySelectorAll("#bottom-menu button").forEach((btn) => {
  btn.addEventListener("click", () => openPanel(btn.dataset.panel));
});
document.getElementById("panel-close").addEventListener("click", closePanel);

function closePanel() { document.getElementById("panel-overlay").classList.add("hidden"); }

function openPanel(kind) {
  if (isDead) return;
  const overlay = document.getElementById("panel-overlay");
  const title = document.getElementById("panel-title");
  const content = document.getElementById("panel-content");
  content.innerHTML = "";
  overlay.classList.remove("hidden");

  if (kind === "inventory") {
    title.textContent = "🎒 آیتم‌های من";
    const inv = state.inventory;
    const keys = Object.keys(inv).filter((k) => inv[k] > 0);
    if (keys.length === 0) content.innerHTML = "<div class='item-row'>چیزی نداری</div>";
    for (const k of keys) {
      const row = document.createElement("div");
      row.className = "item-row";
      const equippable = ["axe", "pick", "knife", "wrench"].includes(k);
      row.innerHTML = `<span class="name">${ITEM_FA[k] || k} ×${inv[k]}</span>`;
      if (equippable) {
        const b = document.createElement("button");
        b.textContent = state.equipped === k ? "مجهز شده" : "استفاده";
        b.disabled = state.equipped === k;
        b.onclick = () => { state.equipped = k; openPanel("inventory"); };
        row.appendChild(b);
      } else if (k === "wall" || k === "floor" || k === "door") {
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
      const costText = Object.entries(r.need).map(([k, v]) => `${ITEM_FA[k]} ${v}`).join("، ");
      const can = Object.entries(r.need).every(([k, v]) => (state.inventory[k] || 0) >= v);
      row.innerHTML = `<span class="name">${r.name}<div class="cost">نیاز: ${costText}</div></span>`;
      const b = document.createElement("button");
      b.textContent = "ساخت";
      b.disabled = !can;
      b.onclick = () => { craft(r); openPanel(kind); };
      row.appendChild(b);
      content.appendChild(row);
    }
  }
}

function craft(recipe) {
  for (const [k, v] of Object.entries(recipe.need)) state.inventory[k] -= v;
  for (const [k, v] of Object.entries(recipe.give)) state.inventory[k] = (state.inventory[k] || 0) + v;
  toast(recipe.name + " ساخته شد ✅");
}

function useBandage() {
  if ((state.inventory.bandage || 0) <= 0) return;
  state.inventory.bandage -= 1;
  state.player.health = Math.min(100, state.player.health + 25);
  toast("زخم بسته شد، +۲۵ سلامتی");
}

function consumeItem(k) {
  if ((state.inventory[k] || 0) <= 0) return;
  state.inventory[k] -= 1;
  if (k === "food") state.player.hunger = Math.min(100, state.player.hunger + 30);
  if (k === "water") state.player.thirst = Math.min(100, state.player.thirst + 30);
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

// ==================== تعامل نزدیک (منابع/ماشین) ====================
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
  if (!state || isDead) return;
  const carDist = Math.hypot(CAR_WORLD_X - state.player.x, CAR_WORLD_Y - state.player.y);
  if (carDist < INTERACT_RANGE + 20) { interactCar(); return; }

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

function interactCar() {
  const car = state.car;
  if (!car.repaired) {
    const hasWrench = state.equipped === "wrench" || (state.inventory.wrench || 0) > 0;
    const parts = state.inventory.engine_part || 0;
    if (!hasWrench) { toast("برای تعمیر ماشین به آچار نیاز داری 🔧"); return; }
    if (parts < 3) { toast(`قطعه موتور کافی نداری (${parts}/3)`); return; }
    state.inventory.engine_part -= 3;
    car.repaired = true;
    toast("ماشین تعمیر شد! حالا بنزین بریز 🚗");
    return;
  }
  const fuelCans = state.inventory.fuel_can || 0;
  if (car.fuel < 100 && fuelCans > 0) {
    state.inventory.fuel_can -= 1;
    car.fuel = Math.min(100, car.fuel + 34);
    toast("بنزین اضافه شد ⛽ (" + Math.round(car.fuel) + "%)");
    return;
  }
  if (car.fuel <= 0) { toast("باک خالیه، بنزین لازم داری"); return; }
  inCar = !inCar;
  toast(inCar ? "سوار ماشین شدی 🚗" : "پیاده شدی");
}

function doAttack() {
  if (!state || isDead) return;
  let target = null, bestD = 60;
  for (const z of zombies) {
    const d = Math.hypot(z.x - state.player.x, z.y - state.player.y);
    if (d < bestD) { bestD = d; target = z; }
  }
  if (!target) { toast("چیزی نزدیک نیست"); return; }
  const dmg = { knife: 35, axe: 25, pick: 20 }[state.equipped] || 12;
  target.hp -= dmg;
  if (target.hp <= 0) {
    zombies = zombies.filter((z) => z !== target);
    toast("زامبی نابود شد 💀");
  } else {
    toast("ضربه زدی!");
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
  });
}

function updateZombies(dt) {
  const now = performance.now();
  if (now - lastZombieSpawn > ZOMBIE_SPAWN_EVERY) { spawnZombie(); lastZombieSpawn = now; }
  for (const z of zombies) {
    const dx = state.player.x - z.x, dy = state.player.y - z.y;
    const d = Math.hypot(dx, dy) || 1;
    z.x += (dx / d) * ZOMBIE_SPEED * dt;
    z.y += (dy / d) * ZOMBIE_SPEED * dt;
    if (d < 26) {
      state.player.health -= ZOMBIE_DAMAGE * dt * 0.06;
    }
  }
}

// ==================== حرکت بازیکن ====================
function updatePlayer(dt) {
  const p = state.player;
  const speed = (inCar ? PLAYER_SPEED * 3.4 : PLAYER_SPEED) * (state.player.stamina > 0 ? 1 : 0.5);
  if (Math.hypot(joyVec.x, joyVec.y) > 0.15) {
    p.x += joyVec.x * speed * dt;
    p.y += joyVec.y * speed * dt;
    if (inCar) {
      state.car.fuel = Math.max(0, state.car.fuel - dt * 0.9);
      if (state.car.fuel <= 0) inCar = false;
    } else {
      state.player.stamina = Math.max(0, state.player.stamina - dt * 0.08);
    }
  } else if (!inCar) {
    state.player.stamina = Math.min(100, state.player.stamina + dt * 0.05);
  }

  // زوال آمار زمان
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
  const cam = getCamera();
  ctx.fillStyle = "#4a7d3f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tilesX = Math.ceil(canvas.width / TILE) + 2;
  const tilesY = Math.ceil(canvas.height / TILE) + 2;
  const centerTX = Math.round(cam.x / TILE), centerTY = Math.round(cam.y / TILE);

  for (let dx = -tilesX; dx <= tilesX; dx++) {
    for (let dy = -tilesY; dy <= tilesY; dy++) {
      const tx = centerTX + dx, ty = centerTY + dy;
      const wx = tx * TILE, wy = ty * TILE;
      const s = worldToScreen(wx, wy);
      if (s.x < -TILE || s.x > canvas.width + TILE || s.y < -TILE || s.y > canvas.height + TILE) continue;

      // زمین کمی متنوع
      const g = hash2(tx, ty, state.worldSeed + 999);
      ctx.fillStyle = g < 0.04 ? "#3f6f36" : "#4a7d3f";
      ctx.fillRect(s.x - TILE / 2, s.y - TILE / 2, TILE, TILE);

      const key = modKey(tx, ty);
      const mod = state.modifications[key];

      if (mod && mod.build) {
        ctx.fillStyle = BUILDABLE[mod.build];
        if (mod.build === "door") ctx.fillRect(s.x - TILE / 2 + 6, s.y - TILE / 2, TILE - 12, TILE);
        else ctx.fillRect(s.x - TILE / 2 + 2, s.y - TILE / 2 + 2, TILE - 4, TILE - 4);
        continue;
      }

      if (mod && mod.harvested) continue;

      const res = tileResource(tx, ty, state.worldSeed);
      if (res) {
        const def = RESOURCE_NODES[res];
        ctx.fillStyle = def.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, def.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawCar() {
  const s = worldToScreen(CAR_WORLD_X, CAR_WORLD_Y);
  ctx.fillStyle = state.car.repaired ? "#2f7d3a" : "#555";
  ctx.fillRect(s.x - 22, s.y - 14, 44, 28);
  ctx.fillStyle = "#222";
  ctx.fillRect(s.x - 16, s.y - 10, 32, 10);
  ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
  ctx.fillText(state.car.repaired ? `⛽${Math.round(state.car.fuel)}%` : "🔧 خراب", s.x, s.y - 20);
}

function drawZombies() {
  for (const z of zombies) {
    const s = worldToScreen(z.x, z.y);
    ctx.fillStyle = "#3f8f4a";
    ctx.beginPath(); ctx.arc(s.x, s.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#111"; ctx.fillRect(s.x - 14, s.y - 22, 28 * (z.hp / 60), 4);
  }
}

function drawPlayer() {
  const s = { x: canvas.width / 2, y: canvas.height / 2 };
  ctx.fillStyle = inCar ? "#d9a441" : "#e8c07a";
  ctx.beginPath(); ctx.arc(s.x, s.y, 14, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#3b2a17"; ctx.lineWidth = 2; ctx.stroke();
  if (state.equipped) {
    ctx.fillStyle = "#fff"; ctx.font = "11px Tahoma"; ctx.textAlign = "center";
    ctx.fillText(ITEM_FA[state.equipped], s.x, s.y - 22);
  }
}

// ==================== حلقه اصلی ====================
let lastTime = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(2.2, (now - lastTime) / 16.67);
  lastTime = now;

  if (state && !isDead) {
    updatePlayer(dt);
    updateZombies(dt);
    drawWorld();
    drawCar();
    drawZombies();
    drawPlayer();
    updateHUD();

    saveTimer += dt;
    if (saveTimer > 300) { saveTimer = 0; saveState(); }
  } else if (state && isDead) {
    updateHUD();
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
  await loadState();
  document.getElementById("loading").style.display = "none";
  lastZombieSpawn = performance.now();
  loop();
})();

addEventListener("blur", saveState);
document.addEventListener("visibilitychange", () => { if (document.hidden) saveState(); });

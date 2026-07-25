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
let isHidden = false;
let playerFacing = Math.PI / 2;
let lastAttackTime = 0;
let playerHitFlashUntil = 0;
let attackPulseUntil = 0;
let zombieDeathZones = [];
let saveTimer = 0;

// ==================== توابع وضعیت ====================
function normalizeState() {
  if (!state.cars) state.cars = {};
  if (state.car && !state.cars.main) {
    state.cars.main = { repaired: !!state.car.repaired, fuel: state.car.fuel || 0, health: state.car.health ?? 100 };
  }
  if (!state.cars.main) state.cars.main = { repaired: false, fuel: 0, health: 100 };
  if (state.waypoint === undefined) state.waypoint = null;
  if (!state.craftingQueue) state.craftingQueue = [];
  initDog();
}

function freshLocalState() {
  return {
    worldSeed: Math.floor(Math.random() * 100000),
    player: { x: 0, y: 0, health: 100, hunger: 100, thirst: 100, stamina: 100 },
    inventory: {}, equipped: null,
    cars: { main: { repaired: false, fuel: 0, health: 100 } },
    modifications: {}, guideSeen: false, waypoint: null,
    craftingQueue: [],
  };
}

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

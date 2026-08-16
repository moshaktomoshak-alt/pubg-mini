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

    { id: "wrench", name: "آچار", need: { stone: 4, metal: 3 }, give: { wrench: 1 }, info: "فقط برای تعمیر بدنه ماشین — سلاح نیست" },

    { id: "bandage", name: "باند زخم", need: { cloth: 3 }, give: { bandage: 2 }, info: "هر باند +۲۵ سلامتی" },

    { id: "fuel_can", name: "قوطی بنزین", need: { corn: 4 }, give: { fuel_can: 1 }, info: "با ذرت ساخته می‌شه، برای پر کردن باک ماشین" },

    { id: "handgun", name: "تپانچه", need: { metal: 6, wood: 2 }, give: { handgun: 1 }, info: "دمیج 22 — برد 150 — اسلحه‌ی گرم" },

    { id: "shotgun", name: "شاتگان", need: { metal: 8, wood: 5 }, give: { shotgun: 1 }, info: "دمیج 45 — برد 95 — اسلحه‌ی گرم" },

    { id: "rifle", name: "تفنگ", need: { metal: 10, wood: 4, stone: 2 }, give: { rifle: 1 }, info: "دمیج 30 — برد 220 — اسلحه‌ی گرم" },

  ],

  build: [

    { id: "wall", name: "دیوار چوبی", need: { wood: 6 }, give: { wall: 1 } },

    { id: "floor", name: "کف چوبی", need: { wood: 4 }, give: { floor: 1 } },

    { id: "door", name: "در", need: { wood: 5, metal: 2 }, give: { door: 1 } },

    { id: "window", name: "پنجره", need: { wood: 3, metal: 1 }, give: { window: 1 } },

    { id: "trap", name: "تله", need: { metal: 5, wood: 3 }, give: { trap: 1 }, info: "وقتی زامبی/دشمن روش بره، ۶۰ دمیج می‌زنه و از بین می‌ره (یک‌بار مصرف)" },

    { id: "efence", name: "حصار برقی", need: { metal: 8, cloth: 2 }, give: { efence: 1 }, info: "مثل دیوار جلوشون رو می‌گیره و هر چند ثانیه بهشون شوک می‌زنه" },

    { id: "tower", name: "برج دیده‌بانی", need: { metal: 12, wood: 6 }, give: { tower: 1 }, info: "خودکار به زامبی/دشمن‌های نزدیک شلیک می‌کنه" },

    { id: "campfire", name: "کمپ‌فایر", need: { wood: 5, stone: 3 }, give: { campfire: 1 }, info: "بعد از ساختن، نزدیکش برو و «تعامل» بزن تا گوشت خام رو بپزی (گوشت پخته گرسنگی رو بیشتر پر می‌کنه)" },

  ],

};

const CAR_ENGINE_NEED = { metal: 3, stone: 2 };

const CAR_TYPES = ["car_police", "car_swat"];

const CAR_SHEETS = {

  car_police: { key: "car_police", frames: 12, w: 47, h: 119, label: "🚓 ماشین پلیس" },

  car_swat: { key: "car_swat", frames: 12, w: 57, h: 161, label: "🛡️ خودروی زرهی سوات" },

};

function carLightFrame() { return Math.floor(performance.now() / 80); }

const RESOURCE_NODES = {

  tree: { gives: "wood", amount: [1, 3], images: ["tree1", "tree2", "tree_user", "wood_small"], drawH: 36, color: "#2e6b1f", radius: 10 },

  rock: { gives: "stone", amount: [1, 2], images: ["rock1", "rock2", "rock3"], drawH: 24, color: "#8a8a8a", radius: 9 },

  scrap: { gives: "metal", amount: [1, 2], images: ["crate1_user", "crate2_user"], drawH: 26, color: "#b5652b", radius: 8 },

  bush: { gives: "cloth", amount: [1, 1], images: ["bush1", "bush2"], drawH: 20, color: "#7a9e4a", radius: 7 },

  berry: { gives: "food", amount: [1, 2], images: ["berrybush1", "berrybush2"], drawH: 20, color: "#c73f5c", radius: 6 },

  well: { gives: "water", amount: [1, 2], color: "#3f7fc7", radius: 7 },

  corn: { gives: "corn", amount: [1, 2], color: "#e8c93a", radius: 7 },

};

const BUILDABLE = { wall: "#7a5230", floor: "#c9ab7a", door: "#4b3620", window: "#bcdff5", trap: "#5a4a2a", efence: "#2a3a3f", tower: "#4a4a55", campfire: "#5a3a20" };

const SOLID_FOR_ZOMBIE = { wall: true, door: true, window: true, efence: true, tower: true };

const SOLID_FOR_PLAYER = { wall: true, efence: true };

const ITEM_FA = {

  wood: "چوب", stone: "سنگ", metal: "فلز", cloth: "پارچه", food: "غذا", water: "آب", corn: "ذرت", meat: "گوشت",

  cooked_meat: "گوشت پخته",

  knife: "چاقو", wrench: "آچار", bandage: "باند زخم",

  wall: "دیوار", floor: "کف", door: "در", window: "پنجره",
  trap: "تله", efence: "حصار برقی", tower: "برج دیده‌بانی", campfire: "کمپ‌فایر",

  engine_part: "قطعه موتور", fuel_can: "قوطی بنزین",

  handgun: "تپانچه", rifle: "تفنگ", shotgun: "شاتگان",

};

const WEAPON_RANGE = { fists: 45, knife: 60, handgun: 150, rifle: 220, shotgun: 95 };

const WEAPON_DAMAGE = { fists: 12, knife: 35, handgun: 22, rifle: 30, shotgun: 45 };

const ATTACK_CONE_DEG = 55;

const ATTACK_INTERVAL_MS = 550;

const INTERACT_RANGE = 55;

const ZOMBIE_SPEED = 1.1;

const ZOMBIE_SIGHT_RANGE = 230;

const ZOMBIE_LOSE_INTEREST = 420;

const PLAYER_SPEED = 2.6;

const ZOMBIE_DAMAGE = 6;

const ZOMBIE_MAX = 8;

const ZOMBIE_DESPAWN_DIST = 1400;

const ZOMBIE_SPAWN_EVERY = 7000;

const ZOMBIE_BASE_HP = 60;

// ==================== تنوع زامبی (آرت واقعی مود ABOVE THE DEATH — هر نوع اسپرایت واقعی خودشو داره) ====================

const ZOMBIE_TYPES = {

  normal:   { imgKey: "zombie_normal",  hpMult: 1,    speedMult: 1,    dmgMult: 1,    sizeMult: 1,    sightMult: 1,    visualH: 24 },

  clawler:  { imgKey: "zombie_clawler", hpMult: 0.6,  speedMult: 1.8,  dmgMult: 0.8,  sizeMult: 1,     sightMult: 1.2,  visualH: 30 },

  jumper:   { imgKey: "zombie_jumper",  hpMult: 0.75, speedMult: 1.6,  dmgMult: 0.9,  sizeMult: 1,     sightMult: 1.15, visualH: 34 },

  hazmat:   { imgKey: "zombie_hazmat",  hpMult: 2.2,  speedMult: 0.6,  dmgMult: 1.5,  sizeMult: 1.15,  sightMult: 0.85, visualH: 26 },

  spitter:  { imgKey: "zombie_spitter", hpMult: 0.8,  speedMult: 0.95, dmgMult: 1,    sizeMult: 1,     sightMult: 1.3,  visualH: 24 },

  raptor:   { imgKey: "zombie_raptor",  hpMult: 0.9,  speedMult: 1.5,  dmgMult: 1.1,  sizeMult: 1,     sightMult: 1.2,  visualH: 24 },

  bomber:   { imgKey: "zombie_bomber",  hpMult: 0.5,  speedMult: 1.1,  dmgMult: 2,    sizeMult: 1,     sightMult: 1,    visualH: 26 },

  tanker:   { imgKey: "zombie_tanker",  hpMult: 6,    speedMult: 0.45, dmgMult: 2.5,  sizeMult: 1.8,   sightMult: 0.9,  visualH: 34 },

};

const ZOMBIE_TYPE_WEIGHTS = [

  ["normal", 0.32], ["clawler", 0.14], ["jumper", 0.13], ["hazmat", 0.1],

  ["spitter", 0.1], ["raptor", 0.12], ["bomber", 0.07], ["tanker", 0.02],

];

const ZOMBIE_SCREAM_RADIUS = 260;

const CAR_WORLD_X = 0, CAR_WORLD_Y = -260;

const CAR_SECTOR_SIZE = 640;

const CAR_SECTOR_CHANCE = 0.35;

const HOUSE_SECTOR_SIZE = 750;

const HOUSE_SECTOR_CHANCE = 0.4;

const HOUSE_NPC_OFFSET_Y = 55;

const HOUSE_ROOM_HALF_W = 3;

const HOUSE_ROOM_HALF_H = 2;

const HELP_TEXT_HTML = `

<div class="help-item">🕹️ <b>آنالوگ چپ:</b> حرکت</div>

<div class="help-item">🎯 <b>آنالوگ راست (قرمز):</b> نشونه‌گیری و حمله — نگه‌دار تا خودکار بزنه</div>

<div class="help-item">✋ <b>دکمه دست:</b> برداشتن منبع نزدیک، تعامل با ماشین، یا غذا دادن به سگ</div>

<div class="help-item">🐶 <b>دکمه سگ:</b> تغییر حالت سگ بین حمله ⚔️ و جمع‌آوری منابع 📦</div>

<div class="help-item">📍 <b>دکمه GPS:</b> یه نشون رو نقشه بذار تا گم نشی؛ دوباره بزن تا حذفش کنی</div>

<div class="help-item">🌲 <b>منابع:</b> درخت=چوب، سنگ=سنگ، بشکه=فلز، بوته=پارچه، بوته قرمز=غذا، چشمه=آب، ذرت=ذرت (برای بنزین)</div>

<div class="help-item">🛠️ <b>ساخت:</b> تو پنل ساخت، برد و دمیج هر سلاح نوشته شده؛ قوطی بنزین هم از ذرت ساخته می‌شه</div>

<div class="help-item">🏠 <b>بنا:</b> دیوار جلوی همه رو می‌گیره؛ در و پنجره فقط جلوی زامبی رو می‌گیرن</div>
<div class="help-item">🔥 <b>کمپ‌فایر:</b> تو «ساخت بنا» بسازش و جاگذاری کن؛ بعد نزدیکش برو و «تعامل» بزن تا گوشت خام رو بپزی — گوشت پخته گرسنگی رو بیشتر از گوشت خام پر می‌کنه</div>

<div class="help-item">🧟 <b>زامبی:</b> فقط وقتی نزدیکش بشی متوجه‌ات می‌شه و دنبالت می‌کنه. ۸ نوع داره: عادی، کلاولر (سریع و ضعیف)، جامپر (سریع)، هازمت (کند ولی HP و دمیج بالا)، اسپیتر (وقتی می‌بینتت بقیه‌ی زامبی‌های اطراف رو خبر می‌کنه)، رپتور (سریع و تهاجمی)، بمبر (دمیج خیلی بالا)، و تنکر (باس کمیاب، HP و دمیج خیلی بالا)</div>
<div class="help-item">🐄 <b>گاو:</b> بی‌آزاره و از نزدیک شدنت فرار می‌کنه؛ بزنش تا بمیره و گوشت بده — گوشت هم مثل غذا گشنگی رو کم می‌کنه</div>
<div class="help-item">🔫 <b>بازمانده‌ی خصمانه:</b> از دور بهت شلیک می‌کنه، بزنش تا بمیره و لوت میده</div>
<div class="help-item">🛒 <b>معامله‌گر:</b> نزدیکش برو و «تعامل» بزن تا پنل معامله باز شه</div>
<div class="help-item">🤝 <b>همراه:</b> بازمانده‌های زرد رنگ دور نقشه‌ن، هرکدوم ۱۰ تا از یه منبع (آب/فلز/ذرت/غذا) می‌خوان تا دوستت بشن (حداکثر ۷ تا). با دکمه‌ی 🤝 حالتشون رو عوض کن: دفاع، جمع‌آوری منابع، یا دستور غذا خوردن. اگه جونشون صفر شه برای همیشه می‌میرن</div>

<div class="help-item">🚗 <b>ماشین:</b> چند تا ماشین خراب مختلف تو نقشه پخشن. هرکدوم اول موتور (۳فلز+۲سنگ) بعد بنزین لازم دارن. تو ماشین اگه زامبی بهت بزنه بدنه خراب می‌شه؛ هر آچار ۵۰٪ بدنه رو تعمیر می‌کنه</div>

<div class="help-item">🐶 <b>سگ همراه:</b> دنبالت می‌آد و خودکار به زامبی‌های نزدیک حمله می‌کنه. اگه زخمی شد، با غذا (✋ کنارش) درمان می‌شه</div>
<div class="help-item">🛡️ <b>دفاع پیشرفته:</b> تو بخش «ساخت بنا» تله (یک‌بار مصرف، ۶۰ دمیج)، حصار برقی (مثل دیوار جلوشون رو می‌گیره + شوک دوره‌ای) و برج (خودکار شلیک می‌کنه) بساز</div>
<div class="help-item">🏠 <b>خونه:</b> هر چند وقت یه‌بار موقع راه رفتن به یه خونه با یه فروشنده می‌رسی — نزدیکش برو و «تعامل» بزن</div>

<div class="help-item">💀 اگه سلامتیت صفر بشه، دنیای تازه از اول شروع می‌شه</div>

`;

const IMG_SRC = {

  zombie_normal: "zombie_normal.png", zombie_new: "zombie_new.png", zombie_clawler: "zombie_clawler.png",

  zombie_jumper: "zombie_jumper.png", zombie_hazmat: "zombie_hazmat.png", zombie_spitter: "zombie_spitter.png",

  zombie_raptor: "zombie_raptor.png", zombie_bomber: "zombie_bomber.png", zombie_tanker: "zombie_tanker.png",

  npc_walk: "npc_walk.png", npc_sniper: "npc_sniper.png",

  npc_pistol: "npc_pistol.png", npc_rifle: "npc_rifle.png", npc_shotgun: "npc_shotgun.png",

  p_unarmed_idle: "p_unarmed_idle.png", p_unarmed_walk: "p_unarmed_walk.png",

  p_knife_idle: "p_knife_idle.png", p_knife_walk: "p_knife_walk.png", p_knife_attack: "p_knife_attack.png",

  p_handgun_idle: "p_handgun_idle.png", p_handgun_walk: "p_handgun_walk.png", p_handgun_shoot: "p_handgun_shoot.png",

  p_rifle_idle: "p_rifle_idle.png", p_rifle_walk: "p_rifle_walk.png", p_rifle_shoot: "p_rifle_shoot.png",

  p_shotgun_idle: "p_shotgun_idle.png", p_shotgun_walk: "p_shotgun_walk.png", p_shotgun_shoot: "p_shotgun_shoot.png",

  tree1: "tree1.png", tree2: "tree2.png", rock1: "rock1.png", rock2: "rock2.png", rock3: "rock3.png",

  tree_user: "tree_user.png", wall_user: "wall_user.png", crate1_user: "crate1_user.png", crate2_user: "crate2_user.png",

  knife_user: "knife_user.png", wood_small: "wood_small.png",

  bush1: "bush1.png", bush2: "bush2.png", berrybush1: "berrybush1.png", berrybush2: "berrybush2.png", campfire: "campfire.png",

  car_police: "car_police.png", car_swat: "car_swat.png",};

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

  zombie_normal: { frames: 7, w: 88, h: 72 },

  zombie_new: { frames: 7, w: 88, h: 72 },

  zombie_clawler: { frames: 7, w: 174, h: 159 },

  zombie_jumper: { frames: 7, w: 88, h: 124 },

  zombie_hazmat: { frames: 7, w: 88, h: 72 },

  zombie_spitter: { frames: 7, w: 88, h: 72 },

  zombie_raptor: { frames: 7, w: 88, h: 96 },

  zombie_bomber: { frames: 7, w: 88, h: 128 },

  zombie_tanker: { frames: 4, w: 63, h: 97 },

};

const PLAYER_SHEETS = {

  unarmed: {

    idle: { key: "p_unarmed_idle", frames: 1, w: 34, h: 29 },

    walk: { key: "p_unarmed_walk", frames: 20, w: 34, h: 49 },

    attack: null,

  },

  knife: {

    idle: { key: "p_knife_idle", frames: 20, w: 34, h: 45 },

    walk: { key: "p_knife_walk", frames: 20, w: 34, h: 44 },

    attack: { key: "p_knife_attack", frames: 15, w: 34, h: 34 },

  },

  handgun: {

    idle: { key: "p_handgun_idle", frames: 20, w: 34, h: 45 },

    walk: { key: "p_handgun_walk", frames: 20, w: 34, h: 44 },

    attack: { key: "p_handgun_shoot", frames: 3, w: 34, h: 46 },

  },

  rifle: {

    idle: { key: "p_rifle_idle", frames: 20, w: 34, h: 56 },

    walk: { key: "p_rifle_walk", frames: 20, w: 34, h: 56 },

    attack: { key: "p_rifle_shoot", frames: 3, w: 34, h: 56 },

  },

  shotgun: {

    idle: { key: "p_shotgun_idle", frames: 20, w: 34, h: 56 },

    walk: { key: "p_shotgun_walk", frames: 20, w: 34, h: 56 },

    attack: { key: "p_shotgun_shoot", frames: 3, w: 34, h: 56 },

  },

};

const WEAPON_TO_SHEET_CATEGORY = { fists: "unarmed", knife: "knife", handgun: "handgun", rifle: "rifle", shotgun: "shotgun" };

const ATTACK_ANIM_MS = 260;

// ==================== رسم اسپرایت هوشمند (هر ابعادی رو درست می‌کشه) ====================

function drawSpriteFrameRotated(im, sheet, frameIndex, x, y, targetH, angle) {

  if (!imgReady(im)) return false;

  const iw = im.naturalWidth, ih = im.naturalHeight;

  const rawScale = ih / sheet.h;

  const scale = (rawScale > 1.4 || rawScale < 0.7) ? rawScale : 1;

  const fw = sheet.w * scale, fh = sheet.h * scale;

  const framesX = Math.max(1, Math.round(iw / fw));

  const isSheet = framesX > 1 && Math.abs(ih - fh) <= fh * 0.35;

  ctx.save();

  ctx.translate(x, y);

  ctx.rotate(angle);

  if (isSheet) {

    const fi = ((Math.floor(frameIndex) % framesX) + framesX) % framesX;

    const realFW = iw / framesX;

    const k = targetH / ih;

    const dw = realFW * k, dh = ih * k;

    ctx.drawImage(im, fi * realFW, 0, realFW, ih, -dw / 2, -dh / 2, dw, dh);

  } else {

    const k = targetH / ih;

    const dw = iw * k, dh = ih * k;

    ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh);

  }

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

const canvas = document.getElementById("game");

const loadingEl = document.getElementById("loading");

const ctx = canvas.getContext("2d");

const rotateWrap = document.getElementById("rotate-wrap");

function resize() { canvas.width = rotateWrap.clientWidth; canvas.height = rotateWrap.clientHeight; }

addEventListener("resize", resize);

addEventListener("orientationchange", resize);

resize();

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

function hash2(x, y, seed) {

  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;

  return n - Math.floor(n);

}

function tileResource(tx, ty, seed) {

  if (isHouseTile(tx, ty)) return null;

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

  if (b && SOLID_FOR_PLAYER[b]) return true;

  const h = houseTileType(tx, ty);

  return !!(h && h.kind === "wall");

}

function isSolidForZombie(tx, ty) {

  const b = buildAt(tx, ty);

  if (b && SOLID_FOR_ZOMBIE[b]) return true;

  const h = houseTileType(tx, ty);

  return !!(h && h.kind === "wall");

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

function houseDoorWorldPos(info) {

  const htx = Math.round(info.x / TILE), hty = Math.round(info.y / TILE);

  return { x: htx * TILE, y: (hty + HOUSE_ROOM_HALF_H) * TILE };

}

// حرکت هوشمند: اگه هدف پشت دیوار خونه‌ست، اول برو سمت در، بعد برو تو

function moveTowardSmart(entity, targetX, targetY, speed, dt, solidFn) {

  const myHouse = getHouseAtTile(Math.round(entity.x / TILE), Math.round(entity.y / TILE));

  const targetHouse = getHouseAtTile(Math.round(targetX / TILE), Math.round(targetY / TILE));

  let gx = targetX, gy = targetY;

  if (myHouse && (!targetHouse || targetHouse.info.key !== myHouse.info.key)) {

    const door = houseDoorWorldPos(myHouse.info);

    gx = door.x; gy = door.y;

  } else if (!myHouse && targetHouse) {

    const door = houseDoorWorldPos(targetHouse.info);

    gx = door.x; gy = door.y;

  }

  const gdx = gx - entity.x, gdy = gy - entity.y;

  const gd = Math.hypot(gdx, gdy) || 1;

  const realDist = Math.hypot(targetX - entity.x, targetY - entity.y);

  entity.facing = Math.atan2(targetY - entity.y, targetX - entity.x);

  moveWithCollision(entity, (gdx / gd) * speed * dt, (gdy / gd) * speed * dt, solidFn);

  return realDist;

}

// آیا بین دو نقطه دیوار فاصله انداخته؟ (برای جلوگیری از زدن از پشت دیوار)

function hasLineOfSight(x1, y1, x2, y2) {

  const dist = Math.hypot(x2 - x1, y2 - y1);

  const steps = Math.max(1, Math.ceil(dist / (TILE * 0.5)));

  for (let i = 1; i < steps; i++) {

    const t = i / steps;

    const px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t;

    if (isSolidForZombie(Math.round(px / TILE), Math.round(py / TILE))) return false;

  }

  return true;

}

// نزدیک‌ترین محافظ (پلیر/سگ/همراه) به یه نقطه — برای اینکه دشمن/زامبی به نزدیک‌ترین حمله کنه نه همیشه پلیر

function findNearestDefender(fromX, fromY) {

  let best = { x: state.player.x, y: state.player.y, kind: "player", ref: null };

  let bestD = Math.hypot(state.player.x - fromX, state.player.y - fromY);

  if (typeof dog !== "undefined" && dog && !dog.isDowned) {

    const d = Math.hypot(dog.x - fromX, dog.y - fromY);

    if (d < bestD) { bestD = d; best = { x: dog.x, y: dog.y, kind: "dog", ref: dog }; }

  }

  if (typeof companions !== "undefined") {

    for (const c of companions) {

      const d = Math.hypot(c.x - fromX, c.y - fromY);

      if (d < bestD) { bestD = d; best = { x: c.x, y: c.y, kind: "companion", ref: c }; }

    }

  }

  return best;

}

function sectorCarInfo(sx, sy) {

  const h = hash2(sx * 3.1 + 0.5, sy * 2.7 + 0.5, state.worldSeed + 4242);

  if (h > CAR_SECTOR_CHANCE) return null;

  const ox = (hash2(sx + 0.11, sy + 0.22, state.worldSeed + 55) - 0.5) * (CAR_SECTOR_SIZE * 0.6);

  const oy = (hash2(sx + 0.33, sy + 0.44, state.worldSeed + 77) - 0.5) * (CAR_SECTOR_SIZE * 0.6);

  const typeIdx = Math.floor(hash2(sx + 0.77, sy + 0.88, state.worldSeed + 99) * CAR_TYPES.length);

  return { key: "s_" + sx + "_" + sy, x: sx * CAR_SECTOR_SIZE + CAR_SECTOR_SIZE / 2 + ox, y: sy * CAR_SECTOR_SIZE + CAR_SECTOR_SIZE / 2 + oy, type: CAR_TYPES[typeIdx] };

}

function carInfoFromKey(key) {

  if (key === "main") return { key: "main", x: CAR_WORLD_X, y: CAR_WORLD_Y, type: "car_police" };

  const m = key.match(/^s_(-?\d+)_(-?\d+)$/);

  if (!m) return null;

  return sectorCarInfo(parseInt(m[1], 10), parseInt(m[2], 10));

}

function sectorHouseInfo(sx, sy) {

  const h = hash2(sx * 4.3 + 1.7, sy * 3.9 + 2.3, state.worldSeed + 6161);

  if (h > HOUSE_SECTOR_CHANCE) return null;

  const ox = (hash2(sx + 0.21, sy + 0.32, state.worldSeed + 155) - 0.5) * (HOUSE_SECTOR_SIZE * 0.5);

  const oy = (hash2(sx + 0.43, sy + 0.54, state.worldSeed + 177) - 0.5) * (HOUSE_SECTOR_SIZE * 0.5);

  const x = sx * HOUSE_SECTOR_SIZE + HOUSE_SECTOR_SIZE / 2 + ox;

  const y = sy * HOUSE_SECTOR_SIZE + HOUSE_SECTOR_SIZE / 2 + oy;

  return { key: "h_" + sx + "_" + sy, x, y, npcX: x, npcY: y + HOUSE_NPC_OFFSET_Y };

}

function getNearbyHouses() {

  const list = [];

  const psx = Math.floor(state.player.x / HOUSE_SECTOR_SIZE);

  const psy = Math.floor(state.player.y / HOUSE_SECTOR_SIZE);

  for (let dx = -2; dx <= 2; dx++) {

    for (let dy = -2; dy <= 2; dy++) {

      const info = sectorHouseInfo(psx + dx, psy + dy);

      if (info) list.push(info);

    }

  }

  return list;

}

// ==================== ساختار واقعیِ خونه (دیوار/در قابل برخورد) ====================

function getHouseAtTile(tx, ty) {

  const wx = tx * TILE, wy = ty * TILE;

  const sx = Math.floor(wx / HOUSE_SECTOR_SIZE), sy = Math.floor(wy / HOUSE_SECTOR_SIZE);

  for (let ddx = -1; ddx <= 1; ddx++) {

    for (let ddy = -1; ddy <= 1; ddy++) {

      const info = sectorHouseInfo(sx + ddx, sy + ddy);

      if (!info) continue;

      const htx = Math.round(info.x / TILE), hty = Math.round(info.y / TILE);

      if (Math.abs(tx - htx) <= HOUSE_ROOM_HALF_W && Math.abs(ty - hty) <= HOUSE_ROOM_HALF_H) {

        return { info, htx, hty };

      }

    }

  }

  return null;

}

function houseTileType(tx, ty) {

  const h = getHouseAtTile(tx, ty);

  if (!h) return null;

  const dx = tx - h.htx, dy = ty - h.hty;

  const onPerimeter = Math.abs(dx) === HOUSE_ROOM_HALF_W || Math.abs(dy) === HOUSE_ROOM_HALF_H;

  if (!onPerimeter) return { house: h.info, kind: "floor" };

  if (dy === HOUSE_ROOM_HALF_H && dx === 0) return { house: h.info, kind: "door" };

  return { house: h.info, kind: "wall" };

}

function isHouseTile(tx, ty) { return !!getHouseAtTile(tx, ty); }
function isInsideAnyHouse(x, y) { return isHouseTile(Math.round(x / TILE), Math.round(y / TILE)); }

// ==================== نوع NPC هر خونه (تریدر/همراهِ قابل‌جذب/دشمن) ====================

function houseNpcType(info) {

  const h = hash2(info.x * 0.013 + 3.1, info.y * 0.017 + 2.2, state.worldSeed + 8181);

  if (h < 0.35) return "trader";

  if (h < 0.70) return "recruit";

  return "hostile";

}

function getHouseNpcState(info) {

  if (!state.houseNpcs) state.houseNpcs = {};

  if (!state.houseNpcs[info.key]) {

    const type = houseNpcType(info);

    const st = { type };

    if (type === "hostile") { st.dead = false; }

    if (type === "recruit") {

      const idx = Math.floor(hash2(info.x * 0.021 + 1.3, info.y * 0.029 + 4.4, state.worldSeed + 9191) * RECRUIT_WANT_TYPES.length);

      st.wantType = RECRUIT_WANT_TYPES[idx];

      st.recruited = false;

    }

    state.houseNpcs[info.key] = st;

  }

  return state.houseNpcs[info.key];

}

function ensureHouseNpcs() {

  for (const info of getNearbyHouses()) {

    const st = getHouseNpcState(info);

    if (st.type === "hostile" && !st.dead) {

      if (!hostiles.some((h) => h.houseKey === info.key)) {

        hostiles.push({

          x: info.npcX, y: info.npcY, hp: HOSTILE_MAX_HP, maxHp: HOSTILE_MAX_HP,

          facing: 0, walkPhase: Math.random() * 10, alerted: false, alertPulseUntil: 0,

          hitFlashUntil: 0, shootFlashUntil: 0, lastShotAt: 0,

          isHouse: true, houseKey: info.key,

        });

      }

    } else if (st.type === "recruit" && !st.recruited) {

      if (!recruits.some((r) => r.houseKey === info.key)) {

        recruits.push({

          x: info.npcX, y: info.npcY, facing: 0, walkPhase: Math.random() * 10,

          wantType: st.wantType, nextWanderAt: 0, wanderDx: 0, wanderDy: 0, wandering: false,

          isHouse: true, houseKey: info.key,

        });

      }

    }

  }

}

function drawHouses() {

  for (const h of getNearbyHouses()) {

    const st = getHouseNpcState(h);

    if (st.type !== "trader") continue;

    const npcS = worldToScreen(h.npcX, h.npcY);

    if (npcS.x < -80 || npcS.x > canvas.width + 80 || npcS.y < -80 || npcS.y > canvas.height + 80) continue;

    if (typeof drawHumanTopDown === "function") {

      drawHumanTopDown(npcS.x, npcS.y, -Math.PI / 2, performance.now() * 0.002, "#2b5f8a", "#d9b38c", false);

      if (typeof drawCartIcon === "function") drawCartIcon(npcS.x, npcS.y - 22);

    }

  }

}

function getAllNearbyCars() {

  const map = new Map();

  const base = [{ key: "main", x: CAR_WORLD_X, y: CAR_WORLD_Y, type: "car_police" }];

  const psx = Math.floor(state.player.x / CAR_SECTOR_SIZE);

  const psy = Math.floor(state.player.y / CAR_SECTOR_SIZE);

  for (let dx = -2; dx <= 2; dx++) {

    for (let dy = -2; dy <= 2; dy++) {

      const info = sectorCarInfo(psx + dx, psy + dy);

      if (info) base.push(info);

    }

  }

  for (const c of base) map.set(c.key, c);

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

  if (!state.cars[key]) state.cars[key] = { repaired: false, fuel: 0, health: 100 };

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

  } catch (e) {}

  state = freshLocalState();

  normalizeState();

}

function normalizeState() {

  if (!state.cars) state.cars = {};

  if (state.car && !state.cars.main) {

    state.cars.main = { repaired: !!state.car.repaired, fuel: state.car.fuel || 0, health: state.car.health ?? 100 };

  }

  if (!state.cars.main) state.cars.main = { repaired: false, fuel: 0, health: 100 };

  if (state.waypoint === undefined) state.waypoint = null;

  if (!state.dog) state.dog = { health: 100, downed: false };

  if (!state.houseNpcs) state.houseNpcs = {};

}

// ==================== سگ: همه‌چیز از dog.js خونده می‌شه ====================

function ensureDog() {

  if (typeof initDog !== "function") return;

  if (!dog) {

    initDog();

    if (state.dog) {

      dog.hp = typeof state.dog.health === "number" ? state.dog.health : 100;

      dog.isDowned = !!state.dog.downed;

    }

  }

}

function freshLocalState() {

  return {

    worldSeed: Math.floor(Math.random() * 100000),

    player: { x: 0, y: 0, health: 100, hunger: 100, thirst: 100, stamina: 100 },

    inventory: { knife: 1 }, equipped: "knife",

    cars: { main: { repaired: false, fuel: 0, health: 100 } },

    modifications: {}, guideSeen: false, waypoint: null,

    dog: { health: 100, downed: false },

  };

}

let saveTimer = 0;

function saveState() {

  if (!initData || isDead) return;

  if (dog) state.dog = { health: dog.hp, downed: dog.isDowned };

  fetch("/api/save", {

    method: "POST", headers: { "Content-Type": "application/json" },

    body: JSON.stringify({ initData, state }),

  }).catch(() => {});

}

async function onDeath() {

  if (isDead) return;

  isDead = true;

  zombies = [];

  cows = [];

  hostiles = [];

  recruits = [];

  companions = [];

  trader = null;

  placeMode = null;

  waypointArmed = false;

  inCar = false;

  drivingCarKey = null;

  dog = null;

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

      normalizeState();

    }

  } else {

    state = freshLocalState();

    normalizeState();

  }

  setTimeout(() => {

    loadingEl.style.display = "none";

    isDead = false;

  }, 1600);

}

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

    stick.style.left = (31 + dx) + "px";

    stick.style.top = (31 + dy) + "px";

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

      const equippable = ["knife", "handgun", "rifle", "shotgun"].includes(k);

      const rangeTxt = equippable ? ` (برد ${WEAPON_RANGE[k]})` : "";

      row.innerHTML = `<span class="name">${ITEM_FA[k] || k}${rangeTxt} ×${inv[k]}</span>`;

      if (equippable) {

        const b = document.createElement("button");

        b.textContent = state.equipped === k ? "مجهز شده" : "استفاده";

        b.disabled = state.equipped === k;

        b.onclick = () => { state.equipped = k; panelFeedback(ITEM_FA[k] + " رو دستت گرفتی 🖐️"); openPanel("inventory"); };

        row.appendChild(b);

      } else if (k === "wall" || k === "floor" || k === "door" || k === "window" || k === "campfire") {

        const b = document.createElement("button");

        b.textContent = "جاگذاری";

        b.onclick = () => { placeMode = k; closePanel(); toast("محل مورد نظر رو لمس کن تا " + ITEM_FA[k] + " ساخته بشه"); };

        row.appendChild(b);

      } else if (k === "bandage") {

        const b = document.createElement("button");

        b.textContent = "استفاده";

        b.onclick = () => { useBandage(); openPanel("inventory"); };

        row.appendChild(b);

      } else if (k === "food" || k === "water" || k === "meat" || k === "cooked_meat") {

        const b = document.createElement("button");

        b.textContent = "مصرف";

        b.onclick = () => { consumeItem(k); openPanel("inventory"); };

        row.appendChild(b);

      }

      content.appendChild(row);

    }

  } else if (kind === "trader") {

    title.textContent = "🛒 معامله‌گر";

    for (const offer of TRADER_OFFERS) {

      const row = document.createElement("div");

      row.className = "item-row";

      const have = state.inventory[offer.give] || 0;

      const ok = have >= offer.giveAmt;

      row.innerHTML = `<span class="name">بده: ${offer.giveAmt} ${ITEM_FA[offer.give]} <span style="color:${ok ? '#7bd88f' : '#e07a7a'}">(داری ${have})</span> → بگیر: ${offer.getAmt} ${ITEM_FA[offer.get]}</span>`;

      const b = document.createElement("button");

      b.textContent = "معامله";

      b.disabled = !ok;

      b.onclick = () => {

        state.inventory[offer.give] -= offer.giveAmt;

        state.inventory[offer.get] = (state.inventory[offer.get] || 0) + offer.getAmt;

        panelFeedback("معامله شد ✅");

        openPanel("trader");

      };

      row.appendChild(b);

      content.appendChild(row);

    }

  } else if (kind === "companions") {

    title.textContent = `🤝 همراه‌ها (${companions.length}/${COMPANION_MAX})`;

    const modes = [

      { id: "defend", label: "⚔️ دفاع از من و حمله به زامبی/دشمن" },

      { id: "gather", label: "📦 جمع‌آوری منابع" },

      { id: "forage", label: "🍖 برو غذا بخور تا جونت پر شه" },

    ];

    for (const m of modes) {

      const row = document.createElement("div");

      row.className = "item-row";

      row.innerHTML = `<span class="name">${m.label}</span>`;

      const b = document.createElement("button");

      b.textContent = companionMode === m.id ? "فعاله" : "انتخاب";

      b.disabled = companionMode === m.id;

      b.onclick = () => { setCompanionMode(m.id); openPanel("companions"); };

      row.appendChild(b);

      content.appendChild(row);

    }

    if (companions.length === 0) {

      const row = document.createElement("div");

      row.className = "item-row";

      row.innerHTML = "<span class='name'>هنوز همراهی نداری — تو نقشه دنبال بازمانده‌های زرد بگرد و باهاشون تعامل کن</span>";

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

function renderCarPanel(title, content, carKey) {

  currentCarKey = carKey || "main";

  const car = getCarState(currentCarKey);

  const carInfo = carInfoFromKey(currentCarKey);

  const sheet = CAR_SHEETS[(carInfo && carInfo.type) || "car_police"];

  title.textContent = sheet.label || "🚗 ماشین";

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

  if (k === "food" || k === "meat") state.player.hunger = Math.min(100, state.player.hunger + 30);

  if (k === "cooked_meat") state.player.hunger = Math.min(100, state.player.hunger + 50);

  if (k === "water") state.player.thirst = Math.min(100, state.player.thirst + 30);

  panelFeedback(ITEM_FA[k] + " مصرف شد ✅");

  toast((k === "water" ? "آب نوشیدی" : k === "meat" ? "گوشت خوردی" : k === "cooked_meat" ? "گوشت پخته خوردی، سیر شدی" : "غذا خوردی") + " 🙂");

}

let toastTimer = null;

function toast(msg) {

  const el = document.getElementById("toast");

  el.textContent = msg; el.classList.add("show");

  clearTimeout(toastTimer);

  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);

}

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

function updateDefenses() {

  const now = performance.now();

  for (const key in state.modifications) {

    const mod = state.modifications[key];

    if (!mod || !mod.build) continue;

    if (mod.build !== "trap" && mod.build !== "efence" && mod.build !== "tower") continue;

    const parts = key.split("_");

    const tx = parseInt(parts[0], 10), ty = parseInt(parts[1], 10);

    const wx = tx * TILE, wy = ty * TILE;



    if (mod.build === "trap") {

      let triggered = false;

      for (const z of zombies) {

        if (Math.hypot(z.x - wx, z.y - wy) < 18) {

          z.hp -= 60; z.hitFlashUntil = now + 200;

          if (z.hp <= 0) { if (typeof spawnCorpse === "function") spawnCorpse(z, "zombie"); zombies = zombies.filter((zz) => zz !== z); toast("زامبی تو تله افتاد! 💀"); }

          triggered = true;

          break;

        }

      }

      if (!triggered && typeof hostiles !== "undefined") {

        for (const h of hostiles) {

          if (Math.hypot(h.x - wx, h.y - wy) < 18) {

            if (typeof damageHostile === "function") damageHostile(h, 60);

            triggered = true;

            break;

          }

        }

      }

      if (triggered) delete state.modifications[key];

    } else if (mod.build === "efence") {

      if (!mod.lastZapAt) mod.lastZapAt = 0;

      if (now - mod.lastZapAt > 900) {

        let zapped = false;

        for (const z of zombies) {

          if (Math.hypot(z.x - wx, z.y - wy) < 34) {

            z.hp -= 10; z.hitFlashUntil = now + 200; zapped = true;

            if (z.hp <= 0) { if (typeof spawnCorpse === "function") spawnCorpse(z, "zombie"); zombies = zombies.filter((zz) => zz !== z); toast("زامبی با حصار برقی سوخت! ⚡"); }

          }

        }

        if (typeof hostiles !== "undefined") {

          for (const h of hostiles) {

            if (Math.hypot(h.x - wx, h.y - wy) < 34) {

              if (typeof damageHostile === "function") damageHostile(h, 10);

              zapped = true;

            }

          }

        }

        if (zapped) mod.lastZapAt = now;

      }

    } else if (mod.build === "tower") {

      if (!mod.lastShotAt) mod.lastShotAt = 0;

      if (now - mod.lastShotAt > 700) {

        let target = null, targetKind = null, bestD = 150;

        for (const z of zombies) {

          const d = Math.hypot(z.x - wx, z.y - wy);

          if (d < bestD && hasLineOfSight(wx, wy, z.x, z.y)) { bestD = d; target = z; targetKind = "zombie"; }

        }

        if (typeof hostiles !== "undefined") {

          for (const h of hostiles) {

            const d = Math.hypot(h.x - wx, h.y - wy);

            if (d < bestD && hasLineOfSight(wx, wy, h.x, h.y)) { bestD = d; target = h; targetKind = "hostile"; }

          }

        }

        if (target) {

          mod.lastShotAt = now;

          mod.shootFlashUntil = now + 150;

          mod.shootTargetX = target.x; mod.shootTargetY = target.y;

          if (targetKind === "zombie") {

            target.hp -= 18; target.hitFlashUntil = now + 200;

            if (target.hp <= 0) { if (typeof spawnCorpse === "function") spawnCorpse(target, "zombie"); zombies = zombies.filter((zz) => zz !== target); toast("برج یه زامبی رو زد! 🗼"); }

          } else if (typeof damageHostile === "function") {

            damageHostile(target, 18);

          }

        }

      }

    }

  }

}

function nearestResource() {

  const px = state.player.x, py = state.player.y;

  const ctx0 = Math.floor(px / TILE), cty0 = Math.floor(py / TILE);

  let best = null, bestDist = INTERACT_RANGE;

  for (let dx = -3; dx <= 3; dx++) {

    for (let dy = -3; dy <= 3; dy++) {

      const tx = ctx0 + dx, ty = cty0 + dy;

      const key = modKey(tx, ty);

      if (state.modifications[key] && state.modifications[key].harvested) continue;

      const res = tileResource(tx, ty, state.worldSeed);

      if (!res) continue;

      const wx = tx * TILE, wy = ty * TILE;

      const d = Math.hypot(wx - px, wy - py);

      if (d < bestDist) { bestDist = d; best = { tx, ty, res, wx, wy }; }

    }

  }

  return best;

}

// ==================== تعامل با سگ (از تابع‌های خود dog.js استفاده می‌کنه) ====================

function tryFeedDog() {

  if (!dog) return false;

  const d = Math.hypot(dog.x - state.player.x, dog.y - state.player.y);

  if (d > INTERACT_RANGE) return false;

  if (dog.isDowned) {

    reviveDog();

  } else if (dog.hp < 100) {

    healDog("food");

  } else {

    toast("سگت حالش خوبه 🐶");

  }

  return true;

}

// ==================== کمپ‌فایر (آیتم قابل‌ساخت، پخت گوشت خام) ====================

function nearestCampfire() {

  const px = state.player.x, py = state.player.y;

  const ctx0 = Math.floor(px / TILE), cty0 = Math.floor(py / TILE);

  let best = null, bestDist = INTERACT_RANGE;

  for (let dx = -2; dx <= 2; dx++) {

    for (let dy = -2; dy <= 2; dy++) {

      const tx = ctx0 + dx, ty = cty0 + dy;

      const mod = state.modifications[modKey(tx, ty)];

      if (!mod || mod.build !== "campfire") continue;

      const wx = tx * TILE, wy = ty * TILE;

      const d = Math.hypot(wx - px, wy - py);

      if (d < bestDist) { bestDist = d; best = { tx, ty, wx, wy }; }

    }

  }

  return best;

}

function tryCookAtCampfire() {

  const fire = nearestCampfire();

  if (!fire) return false;

  if ((state.inventory.meat || 0) <= 0) {

    toast("گوشت خامی نداری که بپزی 🍖");

    return true;

  }

  state.inventory.meat -= 1;

  state.inventory.cooked_meat = (state.inventory.cooked_meat || 0) + 1;

  toast("گوشت رو پختی! 🔥 حالا گرسنگی رو بیشتر پر می‌کنه");

  return true;

}

function doInteract() {

  if (!state || isDead || isPanelOpen) return;

  if (inCar) { openPanel("car", drivingCarKey || "main"); return; }

  if (tryFeedDog()) return;

  if (typeof tryTalkToTrader === "function" && tryTalkToTrader()) return;

  if (typeof tryRecruit === "function" && tryRecruit()) return;

  if (tryCookAtCampfire()) return;

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

  attackPulseUntil = performance.now() + ATTACK_ANIM_MS;

  let target = null, targetType = null, bestD = Infinity;

  for (const z of zombies) {

    const dx = z.x - state.player.x, dy = z.y - state.player.y;

    const d = Math.hypot(dx, dy);

    if (d > range) continue;

    const ang = Math.atan2(dy, dx);

    if (angleDiffDeg(ang, playerFacing) > ATTACK_CONE_DEG) continue;

    if (!hasLineOfSight(state.player.x, state.player.y, z.x, z.y)) continue;

    if (d < bestD) { bestD = d; target = z; targetType = "zombie"; }

  }

  for (const c of cows) {

    const dx = c.x - state.player.x, dy = c.y - state.player.y;

    const d = Math.hypot(dx, dy);

    if (d > range) continue;

    const ang = Math.atan2(dy, dx);

    if (angleDiffDeg(ang, playerFacing) > ATTACK_CONE_DEG) continue;

    if (!hasLineOfSight(state.player.x, state.player.y, c.x, c.y)) continue;

    if (d < bestD) { bestD = d; target = c; targetType = "cow"; }

  }

  for (const h of hostiles) {

    const dx = h.x - state.player.x, dy = h.y - state.player.y;

    const d = Math.hypot(dx, dy);

    if (d > range) continue;

    const ang = Math.atan2(dy, dx);

    if (angleDiffDeg(ang, playerFacing) > ATTACK_CONE_DEG) continue;

    if (!hasLineOfSight(state.player.x, state.player.y, h.x, h.y)) continue;

    if (d < bestD) { bestD = d; target = h; targetType = "hostile"; }

  }

  if (!target) return;

  if (targetType === "cow") { damageCow(target, dmg); return; }

  if (targetType === "hostile") { damageHostile(target, dmg); return; }

  target.hp -= dmg;

  target.hitFlashUntil = performance.now() + 200;

  if (target.hp <= 0) {

    if (typeof spawnCorpse === "function") spawnCorpse(target, "zombie");

    zombies = zombies.filter((z) => z !== target);

    toast("زامبی نابود شد 💀");

  }

}

function pickZombieKind() {

  const r = Math.random();

  let acc = 0;

  for (const [k, w] of ZOMBIE_TYPE_WEIGHTS) { acc += w; if (r <= acc) return k; }

  return "normal";

}

function pickSpawnPosAvoidingHouses(cx, cy, minDist, maxExtra) {

  let x, y;

  for (let i = 0; i < 8; i++) {

    const ang = Math.random() * Math.PI * 2;

    const dist = minDist + Math.random() * maxExtra;

    x = cx + Math.cos(ang) * dist;

    y = cy + Math.sin(ang) * dist;

    if (!isInsideAnyHouse(x, y)) return { x, y };

  }

  return { x, y };

}

function spawnZombie() {

  if (zombies.length >= ZOMBIE_MAX) return;

  const pos = pickSpawnPosAvoidingHouses(state.player.x, state.player.y, 420, 150);

  const kind = pickZombieKind();

  const def = ZOMBIE_TYPES[kind];

  zombies.push({

    x: pos.x,

    y: pos.y,

    hp: ZOMBIE_BASE_HP * def.hpMult,

    maxHp: ZOMBIE_BASE_HP * def.hpMult,

    facing: 0,

    alerted: false,

    hitFlashUntil: 0,

    alertPulseUntil: 0,

    walkPhase: Math.random() * 10,

    kind,

  });

}

function screamAlertNearby(source, now) {

  for (const z2 of zombies) {

    if (z2 === source || z2.alerted) continue;

    const dd = Math.hypot(z2.x - source.x, z2.y - source.y);

    if (dd <= ZOMBIE_SCREAM_RADIUS) {

      z2.alerted = true;

      z2.alertPulseUntil = now + 700;

    }

  }

  toast("یه زامبی جیغ زد و بقیه رو خبر کرد! 📢");

}

function updateZombies(dt) {

  const now = performance.now();

  if (now - lastZombieSpawn > ZOMBIE_SPAWN_EVERY) { spawnZombie(); lastZombieSpawn = now; }

  zombies = zombies.filter((z) => Math.hypot(z.x - state.player.x, z.y - state.player.y) < ZOMBIE_DESPAWN_DIST);

  for (const z of zombies) {

    const def = ZOMBIE_TYPES[z.kind] || ZOMBIE_TYPES.normal;

    const nearest = findNearestDefender(z.x, z.y);

    const dx = nearest.x - z.x, dy = nearest.y - z.y;

    const d = Math.hypot(dx, dy) || 1;

    if (!z.alerted) {

      if (d <= ZOMBIE_SIGHT_RANGE * def.sightMult) {

        z.alerted = true;

        z.alertPulseUntil = now + 700;

        if (z.kind === "spitter") screamAlertNearby(z, now);

      }

    } else if (d > ZOMBIE_LOSE_INTEREST) {

      z.alerted = false;

    }

    if (z.alerted) {

      z.walkPhase += dt * 0.25;

      moveTowardSmart(z, nearest.x, nearest.y, ZOMBIE_SPEED * def.speedMult, dt, isSolidForZombie);

      if (d < 26 && hasLineOfSight(z.x, z.y, nearest.x, nearest.y)) {

        const dmg = ZOMBIE_DAMAGE * def.dmgMult;

        if (nearest.kind === "player") {

          if (inCar) {

            const car = getCarState(drivingCarKey || "main");

            car.health = Math.max(0, car.health - dmg * dt * 0.06);

            if (car.health <= 0) {

              car.repaired = false;

              exitCar();

              toast("ماشین از کار افتاد! 💥");

            }

          } else {

            state.player.health -= dmg * dt * 0.06;

            playerHitFlashUntil = now + 200;

          }

        } else if (nearest.kind === "dog") {

          nearest.ref.hp -= dmg * dt * 0.08;

          nearest.ref.hitFlashUntil = now + 200;

          if (nearest.ref.hp <= 0) {

            nearest.ref.hp = 0;

            nearest.ref.isDowned = true;

            toast("سگت زخمی شد! با غذا درمانش کن 🐶💔");

          }

        } else if (nearest.kind === "companion") {

          nearest.ref.hp -= dmg * dt * 0.08;

          nearest.ref.hitFlashUntil = now + 200;

        }

      }

    }

  }

}

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

      moveWithCollision(p, dx, dy, isSolidForPlayer);

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

        } else if (mod.build === "trap") {

          ctx.fillStyle = BUILDABLE.trap;

          ctx.fillRect(s.x - TILE / 2 + 6, s.y - TILE / 2 + 6, TILE - 12, TILE - 12);

          ctx.strokeStyle = "#2e2412";

          ctx.lineWidth = 1;

          ctx.beginPath();

          ctx.moveTo(s.x - TILE / 2 + 6, s.y - TILE / 2 + 6); ctx.lineTo(s.x + TILE / 2 - 6, s.y + TILE / 2 - 6);

          ctx.moveTo(s.x + TILE / 2 - 6, s.y - TILE / 2 + 6); ctx.lineTo(s.x - TILE / 2 + 6, s.y + TILE / 2 - 6);

          ctx.stroke();

        } else if (mod.build === "efence") {

          ctx.fillStyle = BUILDABLE.efence;

          ctx.fillRect(s.x - TILE / 2 + 3, s.y - TILE / 2 + 3, TILE - 6, TILE - 6);

          ctx.strokeStyle = "#3fe0e8";

          ctx.lineWidth = 2;

          ctx.beginPath();

          ctx.moveTo(s.x - TILE / 2 + 5, s.y); ctx.lineTo(s.x, s.y - TILE / 2 + 5);

          ctx.lineTo(s.x, s.y + TILE / 2 - 5); ctx.lineTo(s.x + TILE / 2 - 5, s.y);

          ctx.stroke();

        } else if (mod.build === "tower") {

          ctx.fillStyle = BUILDABLE.tower;

          ctx.beginPath(); ctx.arc(s.x, s.y, TILE * 0.42, 0, Math.PI * 2); ctx.fill();

          ctx.fillStyle = "#2f2f38";

          ctx.beginPath(); ctx.arc(s.x, s.y, TILE * 0.2, 0, Math.PI * 2); ctx.fill();

          if (mod.shootFlashUntil && performance.now() < mod.shootFlashUntil && mod.shootTargetX != null) {

            const ts = worldToScreen(mod.shootTargetX, mod.shootTargetY);

            ctx.strokeStyle = "rgba(255,80,80,0.85)";

            ctx.lineWidth = 2;

            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(ts.x, ts.y); ctx.stroke();

          }

        } else if (mod.build === "campfire") {

          if (imgReady(IMG.campfire)) {

            drawImageCentered(IMG.campfire, s.x, s.y, 26);

          } else {

            ctx.fillStyle = BUILDABLE.campfire;

            ctx.beginPath(); ctx.arc(s.x, s.y, TILE * 0.3, 0, Math.PI * 2); ctx.fill();

          }

        } else {

          ctx.fillStyle = BUILDABLE[mod.build];

          ctx.fillRect(s.x - TILE / 2 + 2, s.y - TILE / 2 + 2, TILE - 4, TILE - 4);

        }

        continue;

      }

      const houseTile = houseTileType(tx, ty);

      if (houseTile) {

        if (houseTile.kind === "wall") {

          ctx.fillStyle = "#6b5a4a";

          ctx.fillRect(s.x - TILE / 2, s.y - TILE / 2, TILE, TILE);

          ctx.strokeStyle = "#4a3d30";

          ctx.lineWidth = 1;

          ctx.strokeRect(s.x - TILE / 2 + 1, s.y - TILE / 2 + 1, TILE - 2, TILE - 2);

        } else if (houseTile.kind === "door") {

          ctx.fillStyle = "#cbb890";

          ctx.fillRect(s.x - TILE / 2, s.y - TILE / 2, TILE, TILE);

          ctx.fillStyle = "#3d2c1c";

          ctx.fillRect(s.x - TILE / 2 + 5, s.y - TILE / 2, TILE - 10, TILE);

        } else {

          ctx.fillStyle = "#cbb890";

          ctx.fillRect(s.x - TILE / 2, s.y - TILE / 2, TILE, TILE);

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

    const sheet = CAR_SHEETS[c.type] || CAR_SHEETS.car_police;

    const carImg = IMG[sheet.key] || IMG[CAR_SHEETS.car_police.key];

    if (imgReady(carImg)) {

      if (!cs.repaired) ctx.filter = "grayscale(1) brightness(0.7)";

      else if (cs.health < 50) ctx.filter = "sepia(0.35) hue-rotate(-25deg)";

      drawSpriteFrameRotated(carImg, sheet, carLightFrame(), s.x, s.y, 80, 0);

      ctx.filter = "none";

    } else {

      ctx.fillStyle = cs.repaired ? "#2f7d3a" : "#555";

      ctx.fillRect(s.x - 20, s.y - 13, 40, 26);

    }

    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";

    const label = !cs.repaired ? "🔧 موتور خرابه" : `⛽${Math.round(cs.fuel)}% 🔧${Math.round(cs.health)}%`;

    ctx.fillText(label, s.x, s.y - 32);

  }

}

function drawZombies() {

  const now = performance.now();

  for (const z of zombies) {

    const def = ZOMBIE_TYPES[z.kind] || ZOMBIE_TYPES.normal;

    const s = worldToScreen(z.x, z.y);

    const by = s.y;

    const sheet = ZOMBIE_SHEETS[def.imgKey];

    const frameIdx = Math.floor(z.walkPhase * (z.alerted ? 1.7 : 0.8)) % sheet.frames;

    const drawn = drawSpriteFrameRotated(IMG[def.imgKey], sheet, frameIdx, s.x, by, def.visualH * def.sizeMult, (z.facing || 0) + Math.PI / 2);

    if (!drawn) {

      ctx.fillStyle = z.alerted ? "#3f8f4a" : "#5c8f63";

      ctx.beginPath(); ctx.arc(s.x, by, 13 * def.sizeMult, 0, Math.PI * 2); ctx.fill();

    }

    if (now < z.hitFlashUntil) drawHitFlash(s.x, by, 16 * def.sizeMult);

    if (now < z.alertPulseUntil) {

      if (z.kind === "spitter" && typeof drawScreamIcon === "function") drawScreamIcon(s.x, by - 22 * def.sizeMult);

      else if (typeof drawAlertIcon === "function") drawAlertIcon(s.x, by - 20 * def.sizeMult);

    }

    ctx.fillStyle = "#000";

    ctx.fillRect(s.x - 14, s.y - 24 * def.sizeMult, 28, 4);

    ctx.fillStyle = "#e05353";

    ctx.fillRect(s.x - 14, s.y - 24 * def.sizeMult, 28 * (z.hp / (z.maxHp || ZOMBIE_BASE_HP)), 4);

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

function currentPlayerSheets() {

  const cat = WEAPON_TO_SHEET_CATEGORY[currentWeaponKey()] || "unarmed";

  return PLAYER_SHEETS[cat];

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

    const carInfo = getAllNearbyCars().find((c) => c.key === (drivingCarKey || "main")) || carInfoFromKey(drivingCarKey || "main");

    const sheet = CAR_SHEETS[(carInfo && carInfo.type) || "car_police"];

    const carImg = IMG[sheet.key] || IMG[CAR_SHEETS.car_police.key];

    const drawn = drawSpriteFrameRotated(carImg, sheet, carLightFrame(), s.x, by, 76, playerFacing + Math.PI / 2);

    if (!drawn) {

      ctx.fillStyle = "#d9a441";

      ctx.beginPath(); ctx.arc(s.x, by, 16, 0, Math.PI * 2); ctx.fill();

    }

    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";

    ctx.fillText(`${Math.round(drivingCar.fuel)}%`, s.x, by - 34);

    return;

  }

  const sheets = currentPlayerSheets();

  const attacking = now < attackPulseUntil && sheets.attack;

  let sheetDef, frameIdx;

  if (attacking) {

    sheetDef = sheets.attack;

    const progress = Math.min(0.999, Math.max(0, 1 - (attackPulseUntil - now) / ATTACK_ANIM_MS));

    frameIdx = Math.floor(progress * sheetDef.frames);

  } else if (moving) {

    sheetDef = sheets.walk;

    frameIdx = Math.floor(playerWalkPhase * 2) % sheetDef.frames;

  } else {

    sheetDef = sheets.idle;

    frameIdx = Math.floor(playerWalkPhase * 2) % sheetDef.frames;

  }

  const drawn = drawSpriteFrameRotated(IMG[sheetDef.key], sheetDef, frameIdx, s.x, by, 36, playerFacing + Math.PI / 2);

  if (!drawn) {

    ctx.fillStyle = "#e8c07a";

    ctx.beginPath(); ctx.arc(s.x, by, 14, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = "#3b2a17"; ctx.lineWidth = 2; ctx.stroke();

  }

  if (now < playerHitFlashUntil) drawHitFlash(s.x, by, 18);

}

let lastTime = performance.now();

function loop() {

  const now = performance.now();

  const dt = Math.min(2.2, (now - lastTime) / 16.67);

  lastTime = now;

  ensureDog();

  if (state && !isDead && !isPanelOpen && !isHidden) {

    updatePlayer(dt);

    updateZombies(dt);

    if (typeof updateCows === "function") updateCows(dt);

    if (typeof updateDog === "function") updateDog(dt);

    if (typeof ensureHouseNpcs === "function") ensureHouseNpcs();

    if (typeof updateHostiles === "function") updateHostiles(dt);

    if (typeof updateRecruits === "function") updateRecruits(dt);

    if (typeof updateCompanions === "function") updateCompanions(dt);

    if (typeof updateCorpses === "function") updateCorpses(dt);

    updateDefenses();

  }

  if (state) {

    drawWorld();

    drawHouses();

    drawCars();

    if (typeof drawCorpses === "function") drawCorpses();

    if (typeof drawDog === "function") drawDog();

    drawZombies();

    if (typeof drawCows === "function") drawCows();

    if (typeof drawTrader === "function") drawTrader();

    if (typeof drawRecruits === "function") drawRecruits();

    if (typeof drawHostiles === "function") drawHostiles();

    if (typeof drawCompanions === "function") drawCompanions();

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

(async function init() {

  try {

    await loadState();

    document.getElementById("loading").style.display = "none";

    lastZombieSpawn = performance.now();
    lastCowSpawn = performance.now();
    lastHostileSpawn = performance.now();
    lastRecruitSpawn = performance.now();
    if (typeof initTrader === "function") initTrader();

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
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

const ITEM_EMOJI = {
  wood: "🪵", stone: "🪨", metal: "🔩", cloth: "🧵", food: "🍗", water: "💧", corn: "🌽",
  axe: "🪓", pick: "⛏️", knife: "🔪", wrench: "🔧", bandage: "🩹",
  wall: "🧱", floor: "🟫", door: "🚪", window: "🪟",
  engine_part: "⚙️", fuel_can: "⛽",
};

const WEAPON_RANGE = { fists: 45, knife: 60, axe: 70, pick: 65, wrench: 55 };
const WEAPON_DAMAGE = { fists: 12, knife: 35, axe: 25, pick: 20, wrench: 15 };
const WEAPON_COLOR = { fists: null, knife: "#d8d8d8", axe: "#8a5a2b", pick: "#777", wrench: "#5b7fbf" };
const ATTACK_CONE_DEG = 55;
const ATTACK_INTERVAL_MS = 550;
const INTERACT_RANGE = 55;
const ZOMBIE_SPEED = 1.1;
const ZOMBIE_SIGHT_RANGE = 300;
const ZOMBIE_LOSE_INTEREST = 420;
const PLAYER_SPEED = 2.6;
const ZOMBIE_DAMAGE = 6;
const ZOMBIE_MAX = 20;
const ZOMBIE_SPAWN_EVERY = 10000;
const ZOMBIE_DEATH_COOLDOWN = 40000;
const ZOMBIE_DEATH_RADIUS = 250;
const CAR_WORLD_X = 0, CAR_WORLD_Y = -260;
const CAR_SECTOR_SIZE = 640;
const CAR_SECTOR_CHANCE = 0.35;

const HELP_TABS = [
  { id: "controls", label: "🎮 کنترل", content: "🕹️ حرکت با جوی‌استیک چپ\n🎯 هدف‌گیری با جوی‌استیک راست\n✋ دکمه تعامل برای برداشت/سوارشدن" },
  { id: "resources", label: "🌲 منابع", content: "🌳 درخت → چوب\n🪨 سنگ → سنگ\n📦 بشکه → فلز\n🌿 بوته → پارچه\n🍓 بوته قرمز → غذا\n💧 چشمه → آب\n🌽 ذرت → ذرت" },
  { id: "crafting", label: "🛠️ ساخت", content: "تبر (چوب ۵): برد ۷۰\nکلنگ (چوب۳+سنگ۵): برد ۶۵\nچاقو (چوب۲+سنگ۲): برد ۶۰\nآچار (سنگ۴+فلز۳): برد ۵۵\nباند (پارچه۳): +۲۵ سلامتی\nقوطی بنزین (ذرت۴): پر کردن باک" },
  { id: "building", label: "🏠 بنا", content: "دیوار (چوب۶): جلوی همه رو می‌گیره\nکف (چوب۴): فقط زیبایی\nدر (چوب۵+فلز۲): فقط جلوی زامبی\nپنجره (چوب۳+فلز۱): فقط جلوی زامبی" },
  { id: "zombie", label: "🧟 زامبی", content: "فقط وقتی نزدیک بشی متوجه می‌شن\nبا سلاح بکش\nاگه توی ماشین باشی به بدنه آسیب می‌زنن" },
  { id: "car", label: "🚗 ماشین", content: "۱. موتور رو با ۳ فلز + ۲ سنگ تعمیر کن\n۲. با قوطی بنزین پر کن (ذرت ۴)\n۳. سوار شو و حرکت کن\n۴. بدنه با آچار تعمیر میشه" },
];

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

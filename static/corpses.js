// ==================== سیستم جنازه (الهام‌گرفته از مود ABOVE THE DEATH) ====================
// جنازه‌ی زامبی/بازمانده‌ی خصمانه بعد از مرگ می‌مونه، لکه‌ی خون زیرش می‌مونه،
// و بعد از یه مدت طولانی محو می‌شه (نه اینکه فوری ناپدید بشه).

const CORPSE_MAX = 40;                 // سقف تعداد جنازه‌ی همزمان (برای پرفورمنس)
const CORPSE_DESPAWN_DIST = 1600;      // جنازه‌های خیلی دور حذف می‌شن
const CORPSE_FADE_START_MS = 45000;    // بعد از ۴۵ ثانیه شروع به محو شدن می‌کنه
const CORPSE_FADE_DURATION_MS = 15000; // طی ۱۵ ثانیه کامل محو می‌شه

let corpses = [];

function spawnCorpse(entity, kind) {
  if (!entity) return;
  const now = performance.now();

  const corpse = {
    x: entity.x,
    y: entity.y,
    kind, // "zombie" | "human"
    facing: entity.facing || 0,
    createdAt: now,
    bloodVariant: Math.floor(Math.random() * 3),
    bloodScale: 0.85 + Math.random() * 0.55,
    layAngleOffset: (Math.random() * 50 - 25) * Math.PI / 180,
  };

  if (kind === "zombie") {
    corpse.zType = entity.type || "zombie1";
    corpse.zKind = entity.kind || "normal";
  } else {
    corpse.bodyColor = "#5a4a4a";
    corpse.headColor = "#a68f7a";
  }

  corpses.push(corpse);
  if (corpses.length > CORPSE_MAX) corpses.shift();
}

function updateCorpses(dt) {
  if (!state || !state.player) return;
  const now = performance.now();
  corpses = corpses.filter((c) => {
    if (now - c.createdAt > CORPSE_FADE_START_MS + CORPSE_FADE_DURATION_MS) return false;
    const d = Math.hypot(c.x - state.player.x, c.y - state.player.y);
    if (d > CORPSE_DESPAWN_DIST) return false;
    return true;
  });
}

function corpseAlpha(c, now) {
  const age = now - c.createdAt;
  if (age <= CORPSE_FADE_START_MS) return 1;
  const fadeProgress = (age - CORPSE_FADE_START_MS) / CORPSE_FADE_DURATION_MS;
  return Math.max(0, 1 - fadeProgress);
}

function drawBloodPool(x, y, scale, variant, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.75;
  ctx.fillStyle = "#5c0f10";
  const rx = (14 + variant * 3) * scale;
  const ry = (9 + variant * 2) * scale;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = alpha * 0.4;
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.3, y - ry * 0.2, rx * 0.5, ry * 0.4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawZombieCorpse(c, s, alpha, now) {
  const def = ZOMBIE_TYPES[c.zKind] || ZOMBIE_TYPES.normal;
  const sheet = ZOMBIE_SHEETS[c.zType] || ZOMBIE_SHEETS.zombie1;
  drawBloodPool(s.x, s.y, c.bloodScale * def.sizeMult, c.bloodVariant, alpha);

  ctx.save();
  ctx.globalAlpha = alpha;
  if (def.tint) ctx.filter = def.tint;
  const layAngle = c.facing + Math.PI / 2 + Math.PI / 2 + c.layAngleOffset;
  const drawn = drawSpriteFrameRotated(IMG[c.zType || "zombie1"], sheet, 0, s.x, s.y, 30 * def.sizeMult, layAngle);
  ctx.filter = "none";
  if (!drawn) {
    ctx.fillStyle = "#3d5c40";
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, 13 * def.sizeMult, 8 * def.sizeMult, layAngle, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawHumanCorpse(c, s, alpha) {
  drawBloodPool(s.x, s.y, c.bloodScale, c.bloodVariant, alpha);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(s.x, s.y);
  ctx.rotate(c.facing + Math.PI / 2 + c.layAngleOffset);

  ctx.fillStyle = c.bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = c.headColor;
  ctx.beginPath();
  ctx.arc(9, 0, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawCorpses() {
  const now = performance.now();
  for (const c of corpses) {
    const alpha = corpseAlpha(c, now);
    if (alpha <= 0) continue;
    const s = worldToScreen(c.x, c.y);
    if (c.kind === "zombie") drawZombieCorpse(c, s, alpha, now);
    else drawHumanCorpse(c, s, alpha);
  }
}

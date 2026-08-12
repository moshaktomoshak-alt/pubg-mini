// ==================== سیستم جنازه (آرت واقعی مود ABOVE THE DEATH) ====================
// جنازه‌ی زامبی/بازمانده‌ی خصمانه بعد از مرگ می‌مونه، لکه‌ی خون زیرش می‌مونه،
// و بعد از یه مدت طولانی محو می‌شه (نه اینکه فوری ناپدید بشه).

const CORPSE_MAX = 40;                 // سقف تعداد جنازه‌ی همزمان (برای پرفورمنس)
const CORPSE_DESPAWN_DIST = 1600;      // جنازه‌های خیلی دور حذف می‌شن
const CORPSE_FADE_START_MS = 45000;    // بعد از ۴۵ ثانیه شروع به محو شدن می‌کنه
const CORPSE_FADE_DURATION_MS = 15000; // طی ۱۵ ثانیه کامل محو می‌شه

// آرت واقعی مود (اگه آپلود نشده باشه، خودکار به شکل ساده‌ی جایگزین برمی‌گرده)
const CORPSE_IMG_SRC = {
  zombiecorpse1: "png/corpses/zombiecorpse.png",
  zombiecorpse2: "png/corpses/zombiecorpse2.png",
  zombiecorpse3: "png/corpses/zombiecorpse3.png",
  zombiecorpsehazmat: "png/corpses/zombiecorpsehazmat.png",
  humancorpse1: "png/corpses/soldiercorpse.png",
  humancorpse2: "png/corpses/soldiercorpse2.png",
  humancorpse3: "png/corpses/soldiercorpse3.png",
  bloodpool: "png/corpses/blood.png",
};

const ZOMBIE_CORPSE_VARIANTS = ["zombiecorpse1", "zombiecorpse2", "zombiecorpse3"];
const HUMAN_CORPSE_VARIANTS = ["humancorpse1", "humancorpse2", "humancorpse3"];

const CORPSE_IMG = {};
for (const [key, src] of Object.entries(CORPSE_IMG_SRC)) {
  const im = new Image();
  im.src = src;
  CORPSE_IMG[key] = im;
}

function corpseImgReady(im) {
  return im && im.complete && im.naturalWidth > 0;
}

let corpses = [];

function spawnCorpse(entity, kind) {
  if (!entity) return;
  const now = performance.now();

  const variants = kind === "zombie" ? ZOMBIE_CORPSE_VARIANTS : HUMAN_CORPSE_VARIANTS;
  const variantKey = variants[Math.floor(Math.random() * variants.length)];

  const corpse = {
    x: entity.x,
    y: entity.y,
    kind, // "zombie" | "human"
    variantKey,
    facing: entity.facing || 0,
    createdAt: now,
    bloodScale: 0.85 + Math.random() * 0.55,
    layAngleOffset: (Math.random() * 50 - 25) * Math.PI / 180,
    flip: Math.random() < 0.5,
  };

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

function drawBloodPoolFallback(x, y, scale, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha * 0.75;
  ctx.fillStyle = "#5c0f10";
  const rx = 15 * scale;
  const ry = 10 * scale;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBloodPool(x, y, scale, alpha) {
  const im = CORPSE_IMG.bloodpool;
  if (corpseImgReady(im)) {
    ctx.save();
    ctx.globalAlpha = alpha * 0.85;
    const targetW = 34 * scale;
    const s = targetW / im.naturalWidth;
    const w = im.naturalWidth * s, h = im.naturalHeight * s;
    ctx.drawImage(im, x - w / 2, y - h / 2, w, h);
    ctx.restore();
  } else {
    drawBloodPoolFallback(x, y, scale, alpha);
  }
}

function drawCorpseFallback(c, s, alpha) {
  // اگه png های مود هنوز آپلود نشده باشن، یه شکل ساده به‌جاش کشیده می‌شه تا بازی خراب نشه
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = c.kind === "zombie" ? "#3d5c40" : "#5a4a4a";
  ctx.beginPath();
  ctx.ellipse(s.x, s.y, 13, 8, c.facing + c.layAngleOffset, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCorpses() {
  const now = performance.now();
  for (const c of corpses) {
    const alpha = corpseAlpha(c, now);
    if (alpha <= 0) continue;

    const s = worldToScreen(c.x, c.y);
    drawBloodPool(s.x, s.y, c.bloodScale, alpha);

    const im = CORPSE_IMG[c.variantKey];
    if (corpseImgReady(im)) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(c.facing + c.layAngleOffset);
      if (c.flip) ctx.scale(1, -1);
      const targetH = c.kind === "zombie" ? 26 : 24;
      const scale = targetH / im.naturalHeight;
      const w = im.naturalWidth * scale, h = im.naturalHeight * scale;
      ctx.drawImage(im, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      drawCorpseFallback(c, s, alpha);
    }
  }
}

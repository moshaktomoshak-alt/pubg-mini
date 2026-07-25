// ==================== تصاویر ====================
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

function drawLimbsAndWeapon(x, y, facing, walkPhase, weaponKey, attackPulse) {
  const stride = Math.sin(walkPhase) * 5;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);
  ctx.fillStyle = "#3b2a17";
  ctx.fillRect(-11 + stride * 0.5, -6, 7, 5);
  ctx.fillRect(-11 - stride * 0.5, 1, 7, 5);
  ctx.fillStyle = "#e8c07a";
  const armSwing = Math.sin(walkPhase + Math.PI) * 4;
  ctx.beginPath(); ctx.arc(-9, armSwing, 4, 0, Math.PI * 2); ctx.fill();
  const handForwardX = attackPulse ? 20 : 9;
  ctx.beginPath(); ctx.arc(handForwardX, -armSwing, 4, 0, Math.PI * 2); ctx.fill();
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
  ctx.fillStyle = "#4a7a4e";
  ctx.beginPath(); ctx.arc(11, -6, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, 6, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ==================== توابع کمکی ====================
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

function screenToWorld(sx, sy) {
  const cam = getCamera();
  return { x: cam.x + (sx - canvas.width / 2), y: cam.y + (sy - canvas.height / 2) };
}

function worldToScreen(wx, wy) {
  const cam = getCamera();
  return { x: canvas.width / 2 + (wx - cam.x), y: canvas.height / 2 + (wy - cam.y) };
}

function getCamera() { return { x: state.player.x, y: state.player.y }; }

function physicalDeltaToLocal(dpx, dpy) {
  if (!isForcedPortrait()) return { x: dpx, y: dpy };
  return { x: dpy, y: -dpx };
}

function physicalPointToLocal(px, py) {
  if (!isForcedPortrait()) return { x: px, y: py };
  const w = window.innerWidth;
  return { x: py, y: w - px };
}

function isForcedPortrait() { return window.innerWidth < window.innerHeight; }

let toastTimer = null;
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
}

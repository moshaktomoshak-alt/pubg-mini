// ==================== تنظیمات گاو ====================
const COW_SPEED = 0.6;
const COW_FLEE_SPEED_MULT = 2.2;
const COW_MAX_HP = 50;
const COW_MAX = 5;
const COW_SPAWN_EVERY = 9000;
const COW_DESPAWN_DIST = 1400;
const COW_WANDER_CHANGE_EVERY = 3000; // ms
const COW_FLEE_RANGE = 90;
const COW_MEAT_MIN = 2, COW_MEAT_MAX = 4;

let cows = [];
let lastCowSpawn = 0;

// ==================== رسم گاو از نمای بالا ====================
function drawCowTopDown(x, y, facing, walkPhase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const size = 15;
  const legOffset = Math.sin(walkPhase) * 3;

  // پاها
  ctx.fillStyle = "#2b2b2b";
  ctx.fillRect(size * 0.5, -size * 0.6 + legOffset, size * 0.28, size * 0.4);
  ctx.fillRect(size * 0.5, size * 0.2 - legOffset, size * 0.28, size * 0.4);
  ctx.fillRect(-size * 0.6, -size * 0.6 - legOffset, size * 0.28, size * 0.4);
  ctx.fillRect(-size * 0.6, size * 0.2 + legOffset, size * 0.28, size * 0.4);

  // بدن (سفید با لکه‌های مشکی)
  ctx.fillStyle = "#f2f0e9";
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2b2b2b";
  ctx.beginPath();
  ctx.ellipse(-size * 0.3, -size * 0.15, size * 0.35, size * 0.22, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.1, size * 0.25, size * 0.28, size * 0.2, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // سر
  ctx.fillStyle = "#f2f0e9";
  ctx.beginPath();
  ctx.arc(size * 0.85, 0, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // پوزه
  ctx.fillStyle = "#c9a58a";
  ctx.beginPath();
  ctx.ellipse(size * 1.15, 0, size * 0.18, size * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();

  // شاخ‌ها
  ctx.strokeStyle = "#d8d0c0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(size * 0.75, -size * 0.3); ctx.lineTo(size * 0.65, -size * 0.5);
  ctx.moveTo(size * 0.75, size * 0.3); ctx.lineTo(size * 0.65, size * 0.5);
  ctx.stroke();

  // گوش‌ها
  ctx.fillStyle = "#c9a58a";
  ctx.beginPath();
  ctx.ellipse(size * 0.65, -size * 0.35, size * 0.12, size * 0.2, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.65, size * 0.35, size * 0.12, size * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();

  // چشم‌ها
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(size * 1.0, -size * 0.15, size * 0.06, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 1.0, size * 0.15, size * 0.06, 0, Math.PI * 2); ctx.fill();

  // دم
  ctx.strokeStyle = "#2b2b2b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size * 1.0, 0);
  ctx.lineTo(-size * 1.2, Math.sin(walkPhase * 2) * 4);
  ctx.stroke();

  ctx.restore();
}

// ==================== اسپاون گاو ====================
function spawnCow() {
  if (cows.length >= COW_MAX) return;
  const pos = (typeof pickSpawnPosAvoidingHouses === "function")
    ? pickSpawnPosAvoidingHouses(state.player.x, state.player.y, 350, 250)
    : { x: state.player.x + Math.cos(Math.random() * Math.PI * 2) * 400, y: state.player.y + Math.sin(Math.random() * Math.PI * 2) * 400 };
  cows.push({
    x: pos.x,
    y: pos.y,
    hp: COW_MAX_HP,
    facing: Math.random() * Math.PI * 2,
    walkPhase: Math.random() * 10,
    hitFlashUntil: 0,
    nextWanderAt: 0,
    wandering: false,
    wanderDx: 0,
    wanderDy: 0,
  });
}

// ==================== آپدیت گاو ====================
function updateCows(dt) {
  const now = performance.now();
  if (now - lastCowSpawn > COW_SPAWN_EVERY) { spawnCow(); lastCowSpawn = now; }
  cows = cows.filter((c) => Math.hypot(c.x - state.player.x, c.y - state.player.y) < COW_DESPAWN_DIST);

  for (const c of cows) {
    const dx = c.x - state.player.x, dy = c.y - state.player.y;
    const d = Math.hypot(dx, dy) || 1;

    if (d < COW_FLEE_RANGE) {
      // فرار از پلیر
      c.facing = Math.atan2(dy, dx);
      c.walkPhase += dt * 0.3;
      moveWithCollision(c, (dx / d) * COW_SPEED * COW_FLEE_SPEED_MULT * dt, (dy / d) * COW_SPEED * COW_FLEE_SPEED_MULT * dt, isSolidForZombie);
    } else {
      if (now > c.nextWanderAt) {
        c.nextWanderAt = now + COW_WANDER_CHANGE_EVERY + Math.random() * 2000;
        const wAng = Math.random() * Math.PI * 2;
        c.wanderDx = Math.cos(wAng);
        c.wanderDy = Math.sin(wAng);
        c.wandering = Math.random() < 0.7;
      }
      if (c.wandering) {
        c.facing = Math.atan2(c.wanderDy, c.wanderDx);
        c.walkPhase += dt * 0.15;
        moveWithCollision(c, c.wanderDx * COW_SPEED * dt, c.wanderDy * COW_SPEED * dt, isSolidForZombie);
      }
    }
  }
}

// ==================== رسم همه‌ی گاوها ====================
function drawCows() {
  const now = performance.now();
  for (const c of cows) {
    const s = worldToScreen(c.x, c.y);
    if (s.x < -60 || s.x > canvas.width + 60 || s.y < -60 || s.y > canvas.height + 60) continue;
    drawCowTopDown(s.x, s.y, c.facing, c.walkPhase);
    if (now < c.hitFlashUntil) drawHitFlash(s.x, s.y, 18);
    ctx.fillStyle = "#000";
    ctx.fillRect(s.x - 15, s.y - 26, 30, 4);
    ctx.fillStyle = "#7bc94a";
    ctx.fillRect(s.x - 15, s.y - 26, 30 * (c.hp / COW_MAX_HP), 4);
  }
}

// ==================== زدن و کشتن گاو (از خود cow.js) ====================
function damageCow(cow, dmg) {
  cow.hp -= dmg;
  cow.hitFlashUntil = performance.now() + 200;
  if (cow.hp <= 0) {
    cows = cows.filter((c) => c !== cow);
    const amt = COW_MEAT_MIN + Math.floor(Math.random() * (COW_MEAT_MAX - COW_MEAT_MIN + 1));
    state.inventory.meat = (state.inventory.meat || 0) + amt;
    toast(`گاو کشته شد +${amt} گوشت 🥩`);
  }
}

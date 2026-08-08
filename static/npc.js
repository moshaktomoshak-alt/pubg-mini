// ==================== رسم مشترک آدمک از نمای بالا (بدون نیاز به PNG) ====================
function drawHumanTopDown(x, y, facing, walkPhase, bodyColor, headColor, hasGun) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const size = 13;
  const armSwing = Math.sin(walkPhase) * 3;

  // بازوها
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.25, -size * 0.5 - armSwing * 0.3);
  ctx.moveTo(0, size * 0.5);
  ctx.lineTo(size * 0.25, size * 0.5 + armSwing * 0.3);
  ctx.stroke();

  // بدن
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.85, size * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  // سر (سمت جهت نگاه)
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(size * 0.7, 0, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // اسلحه
  if (hasGun) {
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(size * 0.55, 0);
    ctx.lineTo(size * 1.25, 0);
    ctx.stroke();
  }

  ctx.restore();
}

// ==================== دشمن خصمانه ====================
const HOSTILE_MAX = 6;
const HOSTILE_SPAWN_EVERY = 11000;
const HOSTILE_DESPAWN_DIST = 1500;
const HOSTILE_MAX_HP = 55;
const HOSTILE_SPEED = 1.0;
const HOSTILE_SIGHT_RANGE = 260;
const HOSTILE_SHOOT_RANGE = 220;
const HOSTILE_LOSE_INTEREST = 480;
const HOSTILE_SHOOT_INTERVAL = 1400;
const HOSTILE_SHOOT_DAMAGE = 8;
const HOSTILE_LOOT_TABLE = [
  { item: "meat", min: 1, max: 3 },
  { item: "bandage", min: 0, max: 1 },
  { item: "metal", min: 1, max: 2 },
];

let hostiles = [];
let lastHostileSpawn = 0;

function spawnHostile() {
  if (hostiles.length >= HOSTILE_MAX) return;
  const ang = Math.random() * Math.PI * 2;
  const dist = 450 + Math.random() * 200;
  hostiles.push({
    x: state.player.x + Math.cos(ang) * dist,
    y: state.player.y + Math.sin(ang) * dist,
    hp: HOSTILE_MAX_HP,
    maxHp: HOSTILE_MAX_HP,
    facing: 0,
    walkPhase: Math.random() * 10,
    alerted: false,
    alertPulseUntil: 0,
    hitFlashUntil: 0,
    shootFlashUntil: 0,
    lastShotAt: 0,
  });
}

function updateHostiles(dt) {
  const now = performance.now();
  if (now - lastHostileSpawn > HOSTILE_SPAWN_EVERY) { spawnHostile(); lastHostileSpawn = now; }
  hostiles = hostiles.filter((h) => Math.hypot(h.x - state.player.x, h.y - state.player.y) < HOSTILE_DESPAWN_DIST);

  for (const h of hostiles) {
    const dx = state.player.x - h.x, dy = state.player.y - h.y;
    const d = Math.hypot(dx, dy) || 1;
    if (!h.alerted) {
      if (d <= HOSTILE_SIGHT_RANGE) { h.alerted = true; h.alertPulseUntil = now + 700; }
    } else if (d > HOSTILE_LOSE_INTEREST) {
      h.alerted = false;
    }
    if (h.alerted) {
      h.facing = Math.atan2(dy, dx);
      if (d > HOSTILE_SHOOT_RANGE) {
        h.walkPhase += dt * 0.25;
        moveWithCollision(h, (dx / d) * HOSTILE_SPEED * dt, (dy / d) * HOSTILE_SPEED * dt, isSolidForZombie);
      } else if (now - h.lastShotAt > HOSTILE_SHOOT_INTERVAL) {
        h.lastShotAt = now;
        h.shootFlashUntil = now + 150;
        if (inCar) {
          const car = getCarState(drivingCarKey || "main");
          car.health = Math.max(0, car.health - HOSTILE_SHOOT_DAMAGE);
          if (car.health <= 0) { car.repaired = false; exitCar(); toast("ماشین از کار افتاد! 💥"); }
        } else {
          state.player.health = Math.max(0, state.player.health - HOSTILE_SHOOT_DAMAGE);
          playerHitFlashUntil = now + 200;
          toast("یه بازمانده بهت شلیک کرد! 🔫");
        }
      }
    }
  }
}

function drawHostiles() {
  const now = performance.now();
  for (const h of hostiles) {
    const s = worldToScreen(h.x, h.y);
    drawHumanTopDown(s.x, s.y, h.facing, h.walkPhase, "#8a2b2b", "#d9b38c", true);
    if (now < h.hitFlashUntil) drawHitFlash(s.x, s.y, 16);
    if (now < h.shootFlashUntil) {
      const ps = worldToScreen(state.player.x, state.player.y);
      ctx.strokeStyle = "rgba(255,230,120,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(ps.x, ps.y);
      ctx.stroke();
    }
    if (now < h.alertPulseUntil) {
      ctx.fillStyle = "#fff2a8";
      ctx.font = "16px Tahoma";
      ctx.textAlign = "center";
      ctx.fillText("❗", s.x, s.y - 26);
    }
    ctx.fillStyle = "#000";
    ctx.fillRect(s.x - 14, s.y - 24, 28, 4);
    ctx.fillStyle = "#e05353";
    ctx.fillRect(s.x - 14, s.y - 24, 28 * (h.hp / h.maxHp), 4);
  }
}

function damageHostile(h, dmg) {
  h.hp -= dmg;
  h.hitFlashUntil = performance.now() + 200;
  if (h.hp <= 0) {
    hostiles = hostiles.filter((x) => x !== h);
    const got = [];
    for (const loot of HOSTILE_LOOT_TABLE) {
      const amt = loot.min + Math.floor(Math.random() * (loot.max - loot.min + 1));
      if (amt > 0) {
        state.inventory[loot.item] = (state.inventory[loot.item] || 0) + amt;
        got.push(`+${amt} ${ITEM_FA[loot.item]}`);
      }
    }
    toast("بازمانده کشته شد 💀" + (got.length ? " — " + got.join("، ") : ""));
  }
}

// ==================== تریدر (ثابت، بدون خطر) ====================
const TRADER_OFFERS = [
  { id: "t1", give: "meat", giveAmt: 5, get: "bandage", getAmt: 1 },
  { id: "t2", give: "wood", giveAmt: 6, get: "water", getAmt: 3 },
  { id: "t3", give: "stone", giveAmt: 6, get: "food", getAmt: 3 },
  { id: "t4", give: "metal", giveAmt: 6, get: "fuel_can", getAmt: 1 },
];
let trader = null;

function initTrader() {
  if (trader) return;
  trader = { x: CAR_WORLD_X + 130, y: CAR_WORLD_Y + 60, walkPhase: 0 };
}

function drawTrader() {
  if (!trader) return;
  trader.walkPhase += 0.02;
  const s = worldToScreen(trader.x, trader.y);
  drawHumanTopDown(s.x, s.y, Math.sin(trader.walkPhase) * 0.2, trader.walkPhase, "#2b5f8a", "#d9b38c", false);
  ctx.fillStyle = "#fff";
  ctx.font = "16px Tahoma";
  ctx.textAlign = "center";
  ctx.fillText("🛒", s.x, s.y - 26);
}

function tryTalkToTrader() {
  if (!trader) return false;
  const d = Math.hypot(trader.x - state.player.x, trader.y - state.player.y);
  if (d > INTERACT_RANGE) return false;
  openPanel("trader");
  return true;
}

// ==================== بازمانده‌ی قابل‌جذب ====================
const RECRUIT_MAX = 3;
const RECRUIT_SPAWN_EVERY = 14000;
const RECRUIT_DESPAWN_DIST = 1500;
const RECRUIT_WANT_TYPES = ["water", "metal", "corn", "food"];
const RECRUIT_WANT_AMOUNT = 10;
const RECRUIT_WANT_ICON = { water: "💧", metal: "🔩", corn: "🌽", food: "🍖" };

let recruits = [];
let lastRecruitSpawn = 0;

function spawnRecruit() {
  if (recruits.length >= RECRUIT_MAX) return;
  if (companions.length >= COMPANION_MAX) return;
  const ang = Math.random() * Math.PI * 2;
  const dist = 380 + Math.random() * 220;
  const wantType = RECRUIT_WANT_TYPES[Math.floor(Math.random() * RECRUIT_WANT_TYPES.length)];
  recruits.push({
    x: state.player.x + Math.cos(ang) * dist,
    y: state.player.y + Math.sin(ang) * dist,
    facing: Math.random() * Math.PI * 2,
    walkPhase: Math.random() * 10,
    wantType,
    nextWanderAt: 0,
    wanderDx: 0,
    wanderDy: 0,
    wandering: false,
  });
}

function updateRecruits(dt) {
  const now = performance.now();
  if (now - lastRecruitSpawn > RECRUIT_SPAWN_EVERY) { spawnRecruit(); lastRecruitSpawn = now; }
  recruits = recruits.filter((r) => Math.hypot(r.x - state.player.x, r.y - state.player.y) < RECRUIT_DESPAWN_DIST);

  for (const r of recruits) {
    if (now > r.nextWanderAt) {
      r.nextWanderAt = now + 3000 + Math.random() * 2500;
      const wAng = Math.random() * Math.PI * 2;
      r.wanderDx = Math.cos(wAng);
      r.wanderDy = Math.sin(wAng);
      r.wandering = Math.random() < 0.5;
    }
    if (r.wandering) {
      r.facing = Math.atan2(r.wanderDy, r.wanderDx);
      r.walkPhase += dt * 0.15;
      moveWithCollision(r, r.wanderDx * 0.5 * dt, r.wanderDy * 0.5 * dt, isSolidForZombie);
    }
  }
}

function drawRecruits() {
  for (const r of recruits) {
    const s = worldToScreen(r.x, r.y);
    drawHumanTopDown(s.x, s.y, r.facing, r.walkPhase, "#b89b2b", "#d9b38c", false);
    ctx.fillStyle = "#fff";
    ctx.font = "13px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText(RECRUIT_WANT_ICON[r.wantType] + " ×" + RECRUIT_WANT_AMOUNT, s.x, s.y - 24);
  }
}

function tryRecruit() {
  if (recruits.length === 0) return false;
  let best = null, bestD = INTERACT_RANGE;
  for (const r of recruits) {
    const d = Math.hypot(r.x - state.player.x, r.y - state.player.y);
    if (d < bestD) { bestD = d; best = r; }
  }
  if (!best) return false;
  if (companions.length >= COMPANION_MAX) {
    toast("جای بیشتری برای همراه نداری (حداکثر ۷ تا) 🚫");
    return true;
  }
  if ((state.inventory[best.wantType] || 0) < RECRUIT_WANT_AMOUNT) {
    toast(`برای دوست شدن باهاش ${RECRUIT_WANT_AMOUNT} ${ITEM_FA[best.wantType]} لازم داری`);
    return true;
  }
  state.inventory[best.wantType] -= RECRUIT_WANT_AMOUNT;
  recruits = recruits.filter((r) => r !== best);
  companions.push({
    x: best.x, y: best.y,
    hp: COMPANION_MAX_HP, maxHp: COMPANION_MAX_HP,
    facing: 0, walkPhase: 0,
    lastShotAt: 0, hitFlashUntil: 0,
    collectState: "idle", targetResource: null,
    forageState: "idle", targetFood: null,
  });
  toast("یه همراه‌ی جدید بهت پیوست! 🤝");
  return true;
}

// ==================== همراه (تا ۷ تا هم‌زمان) ====================
const COMPANION_MAX = 7;
const COMPANION_SPEED = 2.0;
const COMPANION_MAX_HP = 100;
const COMPANION_FOLLOW_RADIUS = 55;
const COMPANION_SIGHT_RANGE = 200;
const COMPANION_SHOOT_RANGE = 170;
const COMPANION_SHOOT_DAMAGE = 14;
const COMPANION_SHOOT_INTERVAL = 900;
const COMPANION_COLLECT_RANGE = 90;
const COMPANION_DELIVER_DISTANCE = 20;
const COMPANION_FOOD_SEARCH_RADIUS = 15;

let companions = [];
let companionMode = "defend"; // 'defend' | 'gather' | 'forage'

function setCompanionMode(mode) {
  companionMode = mode;
  for (const c of companions) {
    c.collectState = "idle"; c.targetResource = null;
    c.forageState = "idle"; c.targetFood = null;
  }
  const label = mode === "defend" ? "دفاع ⚔️" : mode === "gather" ? "جمع‌آوری منابع 📦" : "دستور غذا خوردن 🍖";
  toast("حالت همراه‌ها: " + label);
}

function findNearestFoodTile(x, y) {
  const ctx0 = Math.floor(x / TILE), cty0 = Math.floor(y / TILE);
  let best = null, bestDist = Infinity;
  const R = COMPANION_FOOD_SEARCH_RADIUS;
  for (let dxk = -R; dxk <= R; dxk++) {
    for (let dyk = -R; dyk <= R; dyk++) {
      const tx = ctx0 + dxk, ty = cty0 + dyk;
      const key = modKey(tx, ty);
      if (state.modifications[key] && state.modifications[key].harvested) continue;
      const res = tileResource(tx, ty, state.worldSeed);
      if (res !== "berry") continue;
      const wx = tx * TILE, wy = ty * TILE;
      const d = Math.hypot(wx - x, wy - y);
      if (d < bestDist) { bestDist = d; best = { tx, ty, res, wx, wy }; }
    }
  }
  return best;
}

function updateCompanions(dt) {
  if (companions.length === 0) return;
  const now = performance.now();

  companions.forEach((c, i) => {
    for (const z of zombies) {
      if (!z.alerted) continue;
      const zd = Math.hypot(z.x - c.x, z.y - c.y);
      if (zd < 24) {
        const zdef = (typeof ZOMBIE_TYPES !== "undefined" && ZOMBIE_TYPES[z.kind]) || { dmgMult: 1 };
        c.hp -= ZOMBIE_DAMAGE * zdef.dmgMult * dt * 0.08;
        c.hitFlashUntil = now + 200;
      }
    }
    if (c.hp <= 0) return;

    const followAngle = (i / companions.length) * Math.PI * 2;
    const followX = state.player.x + Math.cos(followAngle) * COMPANION_FOLLOW_RADIUS;
    const followY = state.player.y + Math.sin(followAngle) * COMPANION_FOLLOW_RADIUS;

    if (companionMode === "defend") {
      let target = null, targetDist = COMPANION_SIGHT_RANGE, targetKind = null;
      for (const z of zombies) {
        const d = Math.hypot(z.x - c.x, z.y - c.y);
        if (d < targetDist) { targetDist = d; target = z; targetKind = "zombie"; }
      }
      for (const h of hostiles) {
        const d = Math.hypot(h.x - c.x, h.y - c.y);
        if (d < targetDist) { targetDist = d; target = h; targetKind = "hostile"; }
      }
      if (target) {
        c.facing = Math.atan2(target.y - c.y, target.x - c.x);
        if (targetDist > COMPANION_SHOOT_RANGE) {
          c.walkPhase += dt * 0.3;
          moveWithCollision(c, (target.x - c.x) / targetDist * COMPANION_SPEED * dt, (target.y - c.y) / targetDist * COMPANION_SPEED * dt, isSolidForZombie);
        } else if (now - c.lastShotAt > COMPANION_SHOOT_INTERVAL) {
          c.lastShotAt = now;
          target.hp -= COMPANION_SHOOT_DAMAGE;
          target.hitFlashUntil = now + 200;
          if (target.hp <= 0) {
            if (targetKind === "zombie") { zombies = zombies.filter((z) => z !== target); toast("همراهت یه زامبی رو کشت! 🤝"); }
            else { hostiles = hostiles.filter((h) => h !== target); toast("همراهت یه دشمن رو کشت! 🤝"); }
          }
        }
      } else {
        const dx = followX - c.x, dy = followY - c.y;
        const d = Math.hypot(dx, dy);
        if (d > 10) {
          c.facing = Math.atan2(dy, dx);
          c.walkPhase += dt * 0.25;
          moveWithCollision(c, (dx / d) * COMPANION_SPEED * dt, (dy / d) * COMPANION_SPEED * dt, isSolidForZombie);
        }
      }
    }

    else if (companionMode === "gather") {
      if (c.collectState === "idle") {
        const ctx0 = Math.floor(c.x / TILE), cty0 = Math.floor(c.y / TILE);
        let best = null, bestDist = COMPANION_COLLECT_RANGE * 2;
        for (let dxk = -3; dxk <= 3; dxk++) for (let dyk = -3; dyk <= 3; dyk++) {
          const tx = ctx0 + dxk, ty = cty0 + dyk;
          const key = modKey(tx, ty);
          if (state.modifications[key] && state.modifications[key].harvested) continue;
          const res = tileResource(tx, ty, state.worldSeed);
          if (!res) continue;
          const wx = tx * TILE, wy = ty * TILE;
          const d = Math.hypot(wx - c.x, wy - c.y);
          if (d < bestDist) { bestDist = d; best = { tx, ty, res, wx, wy }; }
        }
        if (best) {
          c.collectState = "movingToResource";
          c.targetResource = best;
        } else {
          const dx = followX - c.x, dy = followY - c.y;
          const d = Math.hypot(dx, dy);
          if (d > 10) {
            c.facing = Math.atan2(dy, dx);
            c.walkPhase += dt * 0.2;
            moveWithCollision(c, (dx / d) * COMPANION_SPEED * dt, (dy / d) * COMPANION_SPEED * dt, isSolidForZombie);
          }
        }
      } else if (c.collectState === "movingToResource" && c.targetResource) {
        const dx = c.targetResource.wx - c.x, dy = c.targetResource.wy - c.y;
        const d = Math.hypot(dx, dy);
        if (d < 20) {
          const def = RESOURCE_NODES[c.targetResource.res];
          const amt = def.amount[0] + Math.floor(Math.random() * (def.amount[1] - def.amount[0] + 1));
          state.inventory[def.gives] = (state.inventory[def.gives] || 0) + amt;
          state.modifications[modKey(c.targetResource.tx, c.targetResource.ty)] = { harvested: true };
          toast(`همراهت +${amt} ${ITEM_FA[def.gives]} پیدا کرد! 🤝`);
          c.targetResource = null;
          c.collectState = "returningToPlayer";
        } else {
          c.facing = Math.atan2(dy, dx);
          c.walkPhase += dt * 0.3;
          moveWithCollision(c, (dx / d) * COMPANION_SPEED * dt, (dy / d) * COMPANION_SPEED * dt, isSolidForZombie);
        }
      } else if (c.collectState === "returningToPlayer") {
        const dx = state.player.x - c.x, dy = state.player.y - c.y;
        const d = Math.hypot(dx, dy);
        if (d < COMPANION_DELIVER_DISTANCE + 20) {
          c.collectState = "idle";
        } else {
          c.facing = Math.atan2(dy, dx);
          c.walkPhase += dt * 0.25;
          moveWithCollision(c, (dx / d) * COMPANION_SPEED * dt, (dy / d) * COMPANION_SPEED * dt, isSolidForZombie);
        }
      }
    }

    else if (companionMode === "forage") {
      if (c.hp < c.maxHp) {
        if (c.forageState === "idle") {
          const food = findNearestFoodTile(c.x, c.y);
          if (food) { c.forageState = "movingToFood"; c.targetFood = food; }
          else { c.forageState = "wandering"; }
        } else if (c.forageState === "wandering") {
          if (Math.random() < 0.02) c.forageState = "idle";
        } else if (c.forageState === "movingToFood" && c.targetFood) {
          const dx = c.targetFood.wx - c.x, dy = c.targetFood.wy - c.y;
          const d = Math.hypot(dx, dy);
          if (d < 20) {
            state.modifications[modKey(c.targetFood.tx, c.targetFood.ty)] = { harvested: true };
            c.hp = Math.min(c.maxHp, c.hp + 45);
            c.targetFood = null;
            if (c.hp >= c.maxHp) { c.forageState = "returning"; toast("یکی از همراه‌ها سیر شد و داره برمی‌گرده 🍖"); }
            else { c.forageState = "idle"; }
          } else {
            c.facing = Math.atan2(dy, dx);
            c.walkPhase += dt * 0.3;
            moveWithCollision(c, (dx / d) * COMPANION_SPEED * dt, (dy / d) * COMPANION_SPEED * dt, isSolidForZombie);
          }
        } else if (c.forageState === "returning") {
          const dx = followX - c.x, dy = followY - c.y;
          const d = Math.hypot(dx, dy);
          if (d < 15) { c.forageState = "idle"; }
          else {
            c.facing = Math.atan2(dy, dx);
            c.walkPhase += dt * 0.25;
            moveWithCollision(c, (dx / d) * COMPANION_SPEED * dt, (dy / d) * COMPANION_SPEED * dt, isSolidForZombie);
          }
        }
      } else {
        const dx = followX - c.x, dy = followY - c.y;
        const d = Math.hypot(dx, dy);
        if (d > 12) {
          c.facing = Math.atan2(dy, dx);
          c.walkPhase += dt * 0.2;
          moveWithCollision(c, (dx / d) * COMPANION_SPEED * dt, (dy / d) * COMPANION_SPEED * dt, isSolidForZombie);
        }
      }
    }
  });

  companions = companions.filter((c) => {
    if (c.hp <= 0) { toast("یکی از همراه‌هات مُرد 💀"); return false; }
    return true;
  });
}

function drawCompanions() {
  const now = performance.now();
  for (const c of companions) {
    const s = worldToScreen(c.x, c.y);
    drawHumanTopDown(s.x, s.y, c.facing, c.walkPhase, "#b89b2b", "#d9b38c", true);
    if (now < c.hitFlashUntil) drawHitFlash(s.x, s.y, 16);
    ctx.fillStyle = "#000";
    ctx.fillRect(s.x - 14, s.y - 24, 28, 4);
    ctx.fillStyle = c.hp / c.maxHp > 0.5 ? "#4CAF50" : (c.hp / c.maxHp > 0.25 ? "#FFC107" : "#F44336");
    ctx.fillRect(s.x - 14, s.y - 24, 28 * (c.hp / c.maxHp), 4);
  }
}

// ====================       (   PNG) ====================
function drawHumanTopDown(x, y, facing, walkPhase, bodyColor, headColor, hasGun) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const size = 13;
  const armSwing = Math.sin(walkPhase) * 3;

  // 
  ctx.strokeStyle = bodyColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.5);
  ctx.lineTo(size * 0.25, -size * 0.5 - armSwing * 0.3);
  ctx.moveTo(0, size * 0.5);
  ctx.lineTo(size * 0.25, size * 0.5 + armSwing * 0.3);
  ctx.stroke();

  // 
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.85, size * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();

  //  (  )
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.arc(size * 0.7, 0, size * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // 
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

// ====================    (     /   ) ====================
function drawAlertIcon(x, y, color) {
  ctx.fillStyle = color || "#fff2a8";
  ctx.beginPath();
  ctx.moveTo(x - 3, y - 10); ctx.lineTo(x + 3, y - 10); ctx.lineTo(x + 1.5, y + 2); ctx.lineTo(x - 1.5, y + 2);
  ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.arc(x, y + 6, 2, 0, Math.PI * 2); ctx.fill();
}
function drawScreamIcon(x, y) {
  ctx.strokeStyle = "#c9a8ff";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(x - 4, y, 4 + i * 3.5, -0.6, 0.6);
    ctx.stroke();
  }
}
function drawCartIcon(x, y) {
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x - 6, y - 5, 10, 6);
  ctx.beginPath(); ctx.moveTo(x - 6, y - 5); ctx.lineTo(x - 8, y - 8); ctx.stroke();
  ctx.beginPath(); ctx.arc(x - 4, y + 3, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(x + 2, y + 3, 1.5, 0, Math.PI * 2); ctx.fill();
}
function drawWantIcon(x, y, type) {
  if (type === "water") {
    ctx.fillStyle = "#4fb0e8";
    ctx.beginPath();
    ctx.moveTo(x, y - 6); ctx.quadraticCurveTo(x + 5, y + 2, x, y + 6); ctx.quadraticCurveTo(x - 5, y + 2, x, y - 6);
    ctx.fill();
  } else if (type === "metal") {
    ctx.fillStyle = "#a8adb5";
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#5a5f66";
    ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  } else if (type === "corn") {
    ctx.fillStyle = "#e8c93f";
    ctx.beginPath(); ctx.ellipse(x, y, 4, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#a88a1f";
    ctx.lineWidth = 1;
    for (let yy = -4; yy <= 4; yy += 3) { ctx.beginPath(); ctx.moveTo(x - 4, y + yy); ctx.lineTo(x + 4, y + yy); ctx.stroke(); }
  } else {
    ctx.fillStyle = "#b5651d";
    ctx.beginPath(); ctx.ellipse(x, y, 5, 4, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#e8dcc0";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x + 3, y - 3); ctx.lineTo(x + 7, y - 7); ctx.stroke();
  }
  ctx.fillStyle = "#fff";
  ctx.font = "10px Tahoma";
  ctx.textAlign = "center";
  ctx.fillText("�" + RECRUIT_WANT_AMOUNT, x, y + 15);
}

// ====================   ====================
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
  const pos = (typeof pickSpawnPosAvoidingHouses === "function")
    ? pickSpawnPosAvoidingHouses(state.player.x, state.player.y, 450, 200)
    : { x: state.player.x + Math.cos(Math.random() * Math.PI * 2) * 500, y: state.player.y + Math.sin(Math.random() * Math.PI * 2) * 500 };
  hostiles.push({
    x: pos.x,
    y: pos.y,
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
  hostiles = hostiles.filter((h) => h.isHouse || Math.hypot(h.x - state.player.x, h.y - state.player.y) < HOSTILE_DESPAWN_DIST);

  for (const h of hostiles) {
    const nearest = findNearestDefender(h.x, h.y);
    const dx = nearest.x - h.x, dy = nearest.y - h.y;
    const d = Math.hypot(dx, dy) || 1;
    if (!h.alerted) {
      if (d <= HOSTILE_SIGHT_RANGE) { h.alerted = true; h.alertPulseUntil = now + 700; }
    } else if (d > HOSTILE_LOSE_INTEREST) {
      h.alerted = false;
    }
    if (h.alerted) {
      const hasLos = hasLineOfSight(h.x, h.y, nearest.x, nearest.y);
      if (d > HOSTILE_SHOOT_RANGE || !hasLos) {
        h.walkPhase += dt * 0.25;
        moveTowardSmart(h, nearest.x, nearest.y, HOSTILE_SPEED, dt, isSolidForZombie);
      } else if (now - h.lastShotAt > HOSTILE_SHOOT_INTERVAL) {
        h.facing = Math.atan2(dy, dx);
        h.lastShotAt = now;
        h.shootFlashUntil = now + 150;
        h.shootTargetX = nearest.x; h.shootTargetY = nearest.y;
        if (nearest.kind === "player") {
          if (inCar) {
            const car = getCarState(drivingCarKey || "main");
            car.health = Math.max(0, car.health - HOSTILE_SHOOT_DAMAGE);
            if (car.health <= 0) { car.repaired = false; exitCar(); toast("   ! "); }
          } else {
            state.player.health = Math.max(0, state.player.health - HOSTILE_SHOOT_DAMAGE);
            playerHitFlashUntil = now + 200;
            toast("    ! ");
          }
        } else if (nearest.kind === "dog") {
          nearest.ref.hp -= HOSTILE_SHOOT_DAMAGE;
          nearest.ref.hitFlashUntil = now + 200;
          if (nearest.ref.hp <= 0) {
            nearest.ref.hp = 0;
            nearest.ref.isDowned = true;
            toast("  !     ");
          }
        } else if (nearest.kind === "companion") {
          nearest.ref.hp -= HOSTILE_SHOOT_DAMAGE;
          nearest.ref.hitFlashUntil = now + 200;
        }
      } else {
        h.facing = Math.atan2(dy, dx);
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
      const tx = h.shootTargetX != null ? h.shootTargetX : state.player.x;
      const ty = h.shootTargetY != null ? h.shootTargetY : state.player.y;
      const ps = worldToScreen(tx, ty);
      ctx.strokeStyle = "rgba(255,230,120,0.85)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(ps.x, ps.y);
      ctx.stroke();
    }
    if (now < h.alertPulseUntil) {
      drawAlertIcon(s.x, s.y - 20);
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
    if (typeof spawnCorpse === "function") spawnCorpse(h, "human");
    hostiles = hostiles.filter((x) => x !== h);
    if (h.isHouse && state.houseNpcs && state.houseNpcs[h.houseKey]) state.houseNpcs[h.houseKey].dead = true;
    const got = [];
    for (const loot of HOSTILE_LOOT_TABLE) {
      const amt = loot.min + Math.floor(Math.random() * (loot.max - loot.min + 1));
      if (amt > 0) {
        state.inventory[loot.item] = (state.inventory[loot.item] || 0) + amt;
        got.push(`+${amt} ${ITEM_FA[loot.item]}`);
      }
    }
    toast("   " + (got.length ? " � " + got.join(" ") : ""));
  }
}

// ====================  (  ) ====================
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
  drawCartIcon(s.x, s.y - 22);
}

function tryTalkToTrader() {
  if (trader) {
    const d = Math.hypot(trader.x - state.player.x, trader.y - state.player.y);
    if (d <= INTERACT_RANGE) { openPanel("trader"); return true; }
  }
  if (typeof getNearbyHouses === "function" && typeof getHouseNpcState === "function") {
    for (const h of getNearbyHouses()) {
      const st = getHouseNpcState(h);
      if (st.type !== "trader") continue;
      const d = Math.hypot(h.npcX - state.player.x, h.npcY - state.player.y);
      if (d <= INTERACT_RANGE) { openPanel("trader"); return true; }
    }
  }
  return false;
}

// ====================   ====================
const RECRUIT_MAX = 3;
const RECRUIT_SPAWN_EVERY = 14000;
const RECRUIT_DESPAWN_DIST = 1500;
const RECRUIT_WANT_TYPES = ["water", "metal", "corn", "food"];
const RECRUIT_WANT_AMOUNT = 10;
const RECRUIT_WANT_ICON = { water: "", metal: "", corn: "", food: "" };

let recruits = [];
let lastRecruitSpawn = 0;

function spawnRecruit() {
  if (recruits.length >= RECRUIT_MAX) return;
  if (companions.length >= COMPANION_MAX) return;
  const pos = (typeof pickSpawnPosAvoidingHouses === "function")
    ? pickSpawnPosAvoidingHouses(state.player.x, state.player.y, 380, 220)
    : { x: state.player.x + Math.cos(Math.random() * Math.PI * 2) * 450, y: state.player.y + Math.sin(Math.random() * Math.PI * 2) * 450 };
  const wantType = RECRUIT_WANT_TYPES[Math.floor(Math.random() * RECRUIT_WANT_TYPES.length)];
  recruits.push({
    x: pos.x,
    y: pos.y,
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
  recruits = recruits.filter((r) => r.isHouse || Math.hypot(r.x - state.player.x, r.y - state.player.y) < RECRUIT_DESPAWN_DIST);

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
    drawWantIcon(s.x, s.y - 18, r.wantType);
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
    toast("     (  ) ");
    return true;
  }
  if ((state.inventory[best.wantType] || 0) < RECRUIT_WANT_AMOUNT) {
    toast(`    ${RECRUIT_WANT_AMOUNT} ${ITEM_FA[best.wantType]}  `);
    return true;
  }
  state.inventory[best.wantType] -= RECRUIT_WANT_AMOUNT;
  recruits = recruits.filter((r) => r !== best);
  if (best.isHouse && state.houseNpcs && state.houseNpcs[best.houseKey]) state.houseNpcs[best.houseKey].recruited = true;
  companions.push({
    x: best.x, y: best.y,
    hp: COMPANION_MAX_HP, maxHp: COMPANION_MAX_HP,
    facing: 0, walkPhase: 0,
    lastShotAt: 0, hitFlashUntil: 0,
    collectState: "idle", targetResource: null,
    forageState: "idle", targetFood: null,
  });
  toast("    ! ");
  return true;
}

// ====================  (   ) ====================
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
  const label = mode === "defend" ? " " : mode === "gather" ? "  " : "   ";
  toast(" : " + label);
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
        const hasLos = hasLineOfSight(c.x, c.y, target.x, target.y);
        if (targetDist > COMPANION_SHOOT_RANGE || !hasLos) {
          c.walkPhase += dt * 0.3;
          moveTowardSmart(c, target.x, target.y, COMPANION_SPEED, dt, isSolidForZombie);
        } else {
          c.facing = Math.atan2(target.y - c.y, target.x - c.x);
          if (now - c.lastShotAt > COMPANION_SHOOT_INTERVAL) {
            c.lastShotAt = now;
            target.hp -= COMPANION_SHOOT_DAMAGE;
            target.hitFlashUntil = now + 200;
            if (target.hp <= 0) {
              if (targetKind === "zombie") { zombies = zombies.filter((z) => z !== target); toast("    ! "); }
              else { hostiles = hostiles.filter((h) => h !== target); toast("    ! "); }
            }
          }
        }
      } else {
        const d = Math.hypot(followX - c.x, followY - c.y);
        if (d > 10) {
          c.walkPhase += dt * 0.25;
          moveTowardSmart(c, followX, followY, COMPANION_SPEED, dt, isSolidForZombie);
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
          const d = Math.hypot(followX - c.x, followY - c.y);
          if (d > 10) {
            c.walkPhase += dt * 0.2;
            moveTowardSmart(c, followX, followY, COMPANION_SPEED, dt, isSolidForZombie);
          }
        }
      } else if (c.collectState === "movingToResource" && c.targetResource) {
        const d = moveTowardSmart(c, c.targetResource.wx, c.targetResource.wy, COMPANION_SPEED, dt, isSolidForZombie);
        c.walkPhase += dt * 0.3;
        if (d < 20) {
          const def = RESOURCE_NODES[c.targetResource.res];
          const amt = def.amount[0] + Math.floor(Math.random() * (def.amount[1] - def.amount[0] + 1));
          state.inventory[def.gives] = (state.inventory[def.gives] || 0) + amt;
          state.modifications[modKey(c.targetResource.tx, c.targetResource.ty)] = { harvested: true };
          toast(` +${amt} ${ITEM_FA[def.gives]}  ! `);
          c.targetResource = null;
          c.collectState = "returningToPlayer";
        }
      } else if (c.collectState === "returningToPlayer") {
        const d = moveTowardSmart(c, state.player.x, state.player.y, COMPANION_SPEED, dt, isSolidForZombie);
        c.walkPhase += dt * 0.25;
        if (d < COMPANION_DELIVER_DISTANCE + 20) {
          c.collectState = "idle";
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
          const d = moveTowardSmart(c, c.targetFood.wx, c.targetFood.wy, COMPANION_SPEED, dt, isSolidForZombie);
          c.walkPhase += dt * 0.3;
          if (d < 20) {
            state.modifications[modKey(c.targetFood.tx, c.targetFood.ty)] = { harvested: true };
            c.hp = Math.min(c.maxHp, c.hp + 45);
            c.targetFood = null;
            if (c.hp >= c.maxHp) { c.forageState = "returning"; toast("        "); }
            else { c.forageState = "idle"; }
          }
        } else if (c.forageState === "returning") {
          const d = moveTowardSmart(c, followX, followY, COMPANION_SPEED, dt, isSolidForZombie);
          c.walkPhase += dt * 0.25;
          if (d < 15) { c.forageState = "idle"; }
        }
      } else {
        const d = Math.hypot(followX - c.x, followY - c.y);
        if (d > 12) {
          c.walkPhase += dt * 0.2;
          moveTowardSmart(c, followX, followY, COMPANION_SPEED, dt, isSolidForZombie);
        }
      }
    }
  });

  companions = companions.filter((c) => {
    if (c.hp <= 0) { toast("    "); return false; }
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

// ==================== حمله ====================
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
  attackPulseUntil = performance.now() + 180;
  let target = null, bestD = Infinity;
  for (const z of zombies) {
    const dx = z.x - state.player.x, dy = z.y - state.player.y;
    const d = Math.hypot(dx, dy);
    if (d > range) continue;
    const ang = Math.atan2(dy, dx);
    if (angleDiffDeg(ang, playerFacing) > ATTACK_CONE_DEG) continue;
    if (d < bestD) { bestD = d; target = z; }
  }
  if (!target) return;
  target.hp -= dmg;
  target.hitFlashUntil = performance.now() + 200;
  if (target.hp <= 0) {
    zombieDeathZones.push({ x: target.x, y: target.y, time: performance.now() });
    zombies = zombies.filter((z) => z !== target);
    toast("زامبی نابود شد 💀");
  }
}

// ==================== حرکت بازیکن ====================
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
      p.x += dx; p.y += dy;
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

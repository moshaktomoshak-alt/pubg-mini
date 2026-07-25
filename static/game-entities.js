// ==================== زامبی‌ها ====================
function spawnZombie() {
  if (zombies.length >= ZOMBIE_MAX) return;
  
  const now = performance.now();
  let attempts = 0;
  let pos = null;
  let found = false;
  
  while (!found && attempts < 20) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 350 + Math.random() * 400;
    const testX = state.player.x + Math.cos(ang) * dist;
    const testY = state.player.y + Math.sin(ang) * dist;
    
    let blocked = false;
    for (const zone of zombieDeathZones) {
      if (now - zone.time > ZOMBIE_DEATH_COOLDOWN) continue;
      const d = Math.hypot(testX - zone.x, testY - zone.y);
      if (d < ZOMBIE_DEATH_RADIUS) {
        blocked = true;
        break;
      }
    }
    if (!blocked) {
      pos = { x: testX, y: testY };
      found = true;
    }
    attempts++;
  }
  
  if (!found) {
    const ang = Math.random() * Math.PI * 2;
    const dist = 350 + Math.random() * 400;
    pos = {
      x: state.player.x + Math.cos(ang) * dist,
      y: state.player.y + Math.sin(ang) * dist,
    };
  }
  
  zombies.push({
    x: pos.x,
    y: pos.y,
    hp: 60,
    facing: 0,
    alerted: false,
    hitFlashUntil: 0,
    alertPulseUntil: 0,
    walkPhase: Math.random() * 10,
    type: Math.random() < 0.5 ? "zombie1" : "zombie2",
  });
}

function updateZombies(dt) {
  const now = performance.now();
  
  zombieDeathZones = zombieDeathZones.filter(z => now - z.time < ZOMBIE_DEATH_COOLDOWN);
  
  if (zombies.length < ZOMBIE_MAX && now - lastZombieSpawn > ZOMBIE_SPAWN_EVERY) {
    spawnZombie();
    lastZombieSpawn = now;
  }
  
  for (const z of zombies) {
    const dx = state.player.x - z.x, dy = state.player.y - z.y;
    const d = Math.hypot(dx, dy) || 1;
    if (!z.alerted) {
      if (d <= ZOMBIE_SIGHT_RANGE) {
        z.alerted = true;
        z.alertPulseUntil = now + 700;
      }
    } else if (d > ZOMBIE_LOSE_INTEREST) {
      z.alerted = false;
    }
    if (z.alerted) {
      z.facing = Math.atan2(dy, dx);
      z.walkPhase += dt * 0.25;
      moveWithCollision(z, (dx / d) * ZOMBIE_SPEED * dt, (dy / d) * ZOMBIE_SPEED * dt, isSolidForZombie);
      if (d < 26) {
        if (inCar) {
          const car = getCarState(drivingCarKey || "main");
          car.health = Math.max(0, car.health - ZOMBIE_DAMAGE * dt * 0.06);
          if (car.health <= 0) {
            car.repaired = false;
            exitCar();
            toast("ماشین از کار افتاد! 💥");
          }
        } else {
          state.player.health -= ZOMBIE_DAMAGE * dt * 0.06;
          playerHitFlashUntil = now + 200;
        }
      }
    }
  }
}

// ==================== سگ (تعامل با dog.js) ====================
// توابع مربوط به سگ در فایل dog.js تعریف شده‌اند
// اما برای دسترسی به توابع، باید قبل از این فایل لود شود

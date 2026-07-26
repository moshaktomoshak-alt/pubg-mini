// ==================== تنظیمات سگ ====================
const DOG_SPEED = 2.2;
const DOG_SIGHT_RANGE = 180;
const DOG_ATTACK_RANGE = 35;
const DOG_ATTACK_DAMAGE = 18;
const DOG_ATTACK_INTERVAL = 800;
const DOG_MAX_HP = 100;
const DOG_FOLLOW_DISTANCE = 60;
const DOG_COLLECT_RANGE = 80;
const DOG_DELIVER_DISTANCE = 20; // فاصله‌ی تحویل منبع به پلیر

let dog = null;

// ==================== رسم سگ از نمای بالا ====================
function drawDogTopDown(x, y, facing, walkPhase, isDowned) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const bodyColor = isDowned ? "#8B7355" : "#C4A57B";
  const darkColor = isDowned ? "#6B5340" : "#8B6F47";
  const size = 14;

  if (!isDowned) {
    const legOffset = Math.sin(walkPhase) * 3;
    ctx.fillStyle = darkColor;
    ctx.fillRect(size * 0.6, -size * 0.55 + legOffset, size * 0.3, size * 0.35);
    ctx.fillRect(size * 0.6, size * 0.2 - legOffset, size * 0.3, size * 0.35);
    ctx.fillRect(-size * 0.6, -size * 0.55 - legOffset, size * 0.3, size * 0.35);
    ctx.fillRect(-size * 0.6, size * 0.2 + legOffset, size * 0.3, size * 0.35);
  } else {
    ctx.fillStyle = darkColor;
    ctx.fillRect(size * 0.4, -size * 0.45, size * 0.25, size * 0.25);
    ctx.fillRect(size * 0.4, size * 0.2, size * 0.25, size * 0.25);
    ctx.fillRect(-size * 0.5, -size * 0.45, size * 0.25, size * 0.25);
    ctx.fillRect(-size * 0.5, size * 0.2, size * 0.25, size * 0.25);
  }

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(size * 0.7, 0, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(size * 0.5, -size * 0.35, size * 0.2, size * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.35, size * 0.2, size * 0.3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  if (isDowned) {
    ctx.strokeStyle = "#4a3520";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-size * 0.3, -size * 0.1);
    ctx.lineTo(-size * 0.3, size * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.1);
    ctx.lineTo(0, size * 0.1);
    ctx.stroke();
  }

  ctx.fillStyle = darkColor;
  ctx.beginPath();
  const tailWag = isDowned ? 0 : Math.sin(walkPhase * 2) * 0.3;
  ctx.ellipse(-size * 0.9, 0, size * 0.3, size * 0.15, tailWag, 0, Math.PI * 2);
  ctx.fill();

  if (!isDowned) {
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(size * 0.9, -size * 0.15, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.9, size * 0.15, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(size * 0.85, -size * 0.2);
    ctx.lineTo(size * 0.95, -size * 0.1);
    ctx.moveTo(size * 0.95, -size * 0.2);
    ctx.lineTo(size * 0.85, -size * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(size * 0.85, size * 0.1);
    ctx.lineTo(size * 0.95, size * 0.2);
    ctx.moveTo(size * 0.95, size * 0.1);
    ctx.lineTo(size * 0.85, size * 0.2);
    ctx.stroke();
  }

  ctx.restore();
}

// ==================== آپدیت سگ ====================
function updateDog(dt) {
  if (!dog || dog.isDowned) return;

  const now = performance.now();
  const dx = state.player.x - dog.x;
  const dy = state.player.y - dog.y;
  const distToPlayer = Math.hypot(dx, dy);

  if (dog.mode === 'attack') {
    let nearestZombie = null;
    let nearestZombieDist = DOG_SIGHT_RANGE;
    for (const z of zombies) {
      const zdx = z.x - dog.x;
      const zdy = z.y - dog.y;
      const zd = Math.hypot(zdx, zdy);
      if (zd < nearestZombieDist) {
        nearestZombieDist = zd;
        nearestZombie = z;
      }
    }

    if (nearestZombie && nearestZombieDist < DOG_SIGHT_RANGE) {
      dog.facing = Math.atan2(nearestZombie.y - dog.y, nearestZombie.x - dog.x);
      dog.walkPhase += dt * 0.3;

      if (nearestZombieDist > DOG_ATTACK_RANGE) {
        const moveDx = (nearestZombie.x - dog.x) / nearestZombieDist * DOG_SPEED * dt;
        const moveDy = (nearestZombie.y - dog.y) / nearestZombieDist * DOG_SPEED * dt;
        moveWithCollision(dog, moveDx, moveDy, () => false);
      } else {
        if (now - dog.lastAttackTime > DOG_ATTACK_INTERVAL) {
          dog.lastAttackTime = now;
          nearestZombie.hp -= DOG_ATTACK_DAMAGE;
          nearestZombie.hitFlashUntil = now + 200;
          if (nearestZombie.hp <= 0) {
            zombies = zombies.filter((z) => z !== nearestZombie);
            toast("سگت زامبی رو کشت! 🐕");
          }
        }
      }
    } else {
      if (distToPlayer > DOG_FOLLOW_DISTANCE) {
        dog.facing = Math.atan2(dy, dx);
        dog.walkPhase += dt * 0.25;
        const moveDx = dx / distToPlayer * DOG_SPEED * dt;
        const moveDy = dy / distToPlayer * DOG_SPEED * dt;
        moveWithCollision(dog, moveDx, moveDy, () => false);
      }
    }
  }

  else if (dog.mode === 'collect') {
    if (dog.collectState === 'idle') {
      const px = dog.x, py = dog.y;
      const ctx0 = Math.floor(px / TILE), cty0 = Math.floor(py / TILE);
      let best = null, bestDist = DOG_COLLECT_RANGE * 2;
      for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) {
        const tx = ctx0 + dx, ty = cty0 + dy;
        const key = modKey(tx, ty);
        if (state.modifications[key] && state.modifications[key].harvested) continue;
        const res = tileResource(tx, ty, state.worldSeed);
        if (!res) continue;
        const wx = tx * TILE, wy = ty * TILE;
        const d = Math.hypot(wx - px, wy - py);
        if (d < bestDist) { bestDist = d; best = { tx, ty, res, wx, wy }; }
      }
      if (best) {
        dog.collectState = 'movingToResource';
        dog.targetResource = best;
        dog.facing = Math.atan2(best.wy - dog.y, best.wx - dog.x);
      } else {
        if (distToPlayer > DOG_FOLLOW_DISTANCE) {
          dog.facing = Math.atan2(dy, dx);
          const moveDx = dx / distToPlayer * DOG_SPEED * dt;
          const moveDy = dy / distToPlayer * DOG_SPEED * dt;
          moveWithCollision(dog, moveDx, moveDy, () => false);
        }
      }
    }
    else if (dog.collectState === 'movingToResource' && dog.targetResource) {
      const dx = dog.targetResource.wx - dog.x;
      const dy = dog.targetResource.wy - dog.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 20) {
        const def = RESOURCE_NODES[dog.targetResource.res];
        const amt = def.amount[0] + Math.floor(Math.random() * (def.amount[1] - def.amount[0] + 1));
        state.inventory[def.gives] = (state.inventory[def.gives] || 0) + amt;
        state.modifications[modKey(dog.targetResource.tx, dog.targetResource.ty)] = { harvested: true };
        dog.collectState = 'returningToPlayer';
        toast(`سگ +${amt} ${ITEM_FA[def.gives]} پیدا کرد! 🐕`);
        dog.targetResource = null;
      } else {
        dog.facing = Math.atan2(dy, dx);
        dog.walkPhase += dt * 0.3;
        const moveDx = dx / dist * DOG_SPEED * dt;
        const moveDy = dy / dist * DOG_SPEED * dt;
        moveWithCollision(dog, moveDx, moveDy, () => false);
      }
    }
    else if (dog.collectState === 'returningToPlayer') {
      const dx = state.player.x - dog.x;
      const dy = state.player.y - dog.y;
      const dist = Math.hypot(dx, dy);
      if (dist < DOG_DELIVER_DISTANCE) {
        dog.collectState = 'idle';
        dog.facing = Math.atan2(dy, dx);
      } else {
        dog.facing = Math.atan2(dy, dx);
        dog.walkPhase += dt * 0.25;
        const moveDx = dx / dist * DOG_SPEED * dt;
        const moveDy = dy / dist * DOG_SPEED * dt;
        moveWithCollision(dog, moveDx, moveDy, () => false);
      }
    }
  }

  for (const z of zombies) {
    const zdx = z.x - dog.x;
    const zdy = z.y - dog.y;
    const zd = Math.hypot(zdx, zdy);
    if (zd < 25 && z.alerted) {
      dog.hp -= ZOMBIE_DAMAGE * dt * 0.08;
      if (dog.hp <= 0) {
        dog.hp = 0;
        dog.isDowned = true;
        toast("سگت زخمی شد! با غذا درمانش کن 🐕💔");
      }
    }
  }
}

function drawDog() {
  if (!dog) return;
  const s = worldToScreen(dog.x, dog.y);
  drawDogTopDown(s.x, s.y, dog.facing, dog.walkPhase, dog.isDowned);

  const barWidth = 30;
  const barHeight = 4;
  const hpPercent = dog.hp / DOG_MAX_HP;

  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(s.x - barWidth / 2, s.y - 25, barWidth, barHeight);

  ctx.fillStyle = hpPercent > 0.5 ? "#4CAF50" : (hpPercent > 0.25 ? "#FFC107" : "#F44336");
  ctx.fillRect(s.x - barWidth / 2, s.y - 25, barWidth * hpPercent, barHeight);

  ctx.fillStyle = "#fff";
  ctx.font = "10px Tahoma";
  ctx.textAlign = "center";
  ctx.fillText(`🐕`, s.x, s.y - 28);
}

function healDog(foodType) {
  if (!dog || !dog.isDowned) return;
  if ((state.inventory[foodType] || 0) <= 0) return;

  state.inventory[foodType] -= 1;
  dog.hp = Math.min(DOG_MAX_HP, dog.hp + 25);
  if (dog.hp >= DOG_MAX_HP) {
    dog.hp = DOG_MAX_HP;
    dog.isDowned = false;
    dog.x = state.player.x + 30;
    dog.y = state.player.y;
    toast("سگت کاملاً درمان شد! 🐕❤️");
  } else {
    toast(`سگ +۲۵٪ جون گرفت (${Math.round(dog.hp)}%) 🐕`);
  }
}

function reviveDog() {
  if (!dog || !dog.isDowned) return;
  if ((state.inventory.food || 0) <= 0) {
    toast("برای احیا به ۱ گوشت نیاز داری! 🍗");
    return;
  }
  state.inventory.food -= 1;
  dog.hp = DOG_MAX_HP;
  dog.isDowned = false;
  dog.x = state.player.x + 30;
  dog.y = state.player.y;
  dog.collectState = 'idle';
  toast("سگ زنده شد! 🐕✨");
}

function setDogMode(mode) {
  if (!dog || dog.isDowned) return;
  dog.mode = mode;
  if (mode === 'collect') {
    dog.collectState = 'idle';
    dog.targetResource = null;
    toast("سگ به حالت جمع‌آوری منابع رفت 📦");
  } else {
    toast("سگ به حالت حمله برگشت ⚔️");
  }
}

function initDog() {
  if (!dog) {
    dog = {
      x: state.player.x + 30,
      y: state.player.y,
      hp: DOG_MAX_HP,
      facing: 0,
      walkPhase: 0,
      isDowned: false,
      lastAttackTime: 0,
      mode: 'attack',
      collectState: 'idle',
      targetResource: null,
    };
  }
}

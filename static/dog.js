// ==================== تنظیمات سگ ====================
const DOG_SPEED = 2.2;
const DOG_SIGHT_RANGE = 180;
const DOG_ATTACK_RANGE = 35;
const DOG_ATTACK_DAMAGE = 18;
const DOG_ATTACK_INTERVAL = 800;
const DOG_MAX_HP = 100;
const DOG_FOLLOW_DISTANCE = 60;

// وضعیت سگ
let dog = null;

// اضافه کردن به متن راهنما
const DOG_HELP_TEXT = `
<div class="help-item">🐕 <b>سگ:</b> از اول بازی همراهته! زامبی‌ها رو می‌بینه و بهشون حمله می‌کنه. اگه زخمی بشه با غذا (🍗) یا ذرت (🌽) درمانش کن</div>
`;

// ==================== رسم سگ از نمای بالا ====================
function drawDogTopDown(x, y, facing, walkPhase, isDowned) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const bodyColor = isDowned ? "#8B7355" : "#C4A57B";
  const darkColor = isDowned ? "#6B5340" : "#8B6F47";
  const size = 14;

  // بدن (بیضی)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // سر (دایره جلوتر)
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(size * 0.7, 0, size * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // گوش‌ها
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  ctx.ellipse(size * 0.5, -size * 0.35, size * 0.2, size * 0.3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(size * 0.5, size * 0.35, size * 0.2, size * 0.3, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // پاها (با انیمیشن راه‌رفتن)
  if (!isDowned) {
    const legOffset = Math.sin(walkPhase) * 3;
    ctx.fillStyle = darkColor;
    ctx.fillRect(size * 0.3, -size * 0.5 + legOffset, size * 0.25, size * 0.3);
    ctx.fillRect(size * 0.3, size * 0.2 - legOffset, size * 0.25, size * 0.3);
    ctx.fillRect(-size * 0.5, -size * 0.5 - legOffset, size * 0.25, size * 0.3);
    ctx.fillRect(-size * 0.5, size * 0.2 + legOffset, size * 0.25, size * 0.3);
  }

  // دم
  ctx.fillStyle = darkColor;
  ctx.beginPath();
  const tailWag = isDowned ? 0 : Math.sin(walkPhase * 2) * 0.3;
  ctx.ellipse(-size * 0.9, 0, size * 0.3, size * 0.15, tailWag, 0, Math.PI * 2);
  ctx.fill();

  // چشم‌ها
  if (!isDowned) {
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(size * 0.9, -size * 0.15, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(size * 0.9, size * 0.15, size * 0.08, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // چشم‌های بسته (X)
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

  // پیدا کردن نزدیک‌ترین زامبی
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
    // حمله به زامبی
    dog.facing = Math.atan2(nearestZombie.y - dog.y, nearestZombie.x - dog.x);
    dog.walkPhase += dt * 0.3;

    if (nearestZombieDist > DOG_ATTACK_RANGE) {
      // حرکت به سمت زامبی
      const moveDx = (nearestZombie.x - dog.x) / nearestZombieDist * DOG_SPEED * dt;
      const moveDy = (nearestZombie.y - dog.y) / nearestZombieDist * DOG_SPEED * dt;
      moveWithCollision(dog, moveDx, moveDy, () => false);
    } else {
      // حمله
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
    // دنبال بازیکن
    if (distToPlayer > DOG_FOLLOW_DISTANCE) {
      dog.facing = Math.atan2(dy, dx);
      dog.walkPhase += dt * 0.25;
      const moveDx = dx / distToPlayer * DOG_SPEED * dt;
      const moveDy = dy / distToPlayer * DOG_SPEED * dt;
      moveWithCollision(dog, moveDx, moveDy, () => false);
    }
  }

  // بررسی برخورد زامبی با سگ
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

// ==================== رسم سگ ====================
function drawDog() {
  if (!dog) return;
  const s = worldToScreen(dog.x, dog.y);
  
  // رسم سگ
  drawDogTopDown(s.x, s.y, dog.facing, dog.walkPhase, dog.isDowned);
  
  // نوار سلامت
  const barWidth = 30;
  const barHeight = 4;
  const hpPercent = dog.hp / DOG_MAX_HP;
  
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(s.x - barWidth / 2, s.y - 25, barWidth, barHeight);
  
  ctx.fillStyle = hpPercent > 0.5 ? "#4CAF50" : (hpPercent > 0.25 ? "#FFC107" : "#F44336");
  ctx.fillRect(s.x - barWidth / 2, s.y - 25, barWidth * hpPercent, barHeight);
  
  // آیکون سگ
  ctx.fillStyle = "#fff";
  ctx.font = "10px Tahoma";
  ctx.textAlign = "center";
  ctx.fillText("🐕", s.x, s.y - 28);
}

// ==================== درمان سگ ====================
function healDog(foodType) {
  if (!dog || !dog.isDowned) return;
  if ((state.inventory[foodType] || 0) <= 0) return;
  
  state.inventory[foodType] -= 1;
  dog.hp = DOG_MAX_HP;
  dog.isDowned = false;
  dog.x = state.player.x + 30;
  dog.y = state.player.y;
  
  panelFeedback("سگ درمان شد! 🐕❤️");
  toast("سگت دوباره زنده شد! 🐕");
}

// ==================== ایجاد سگ در شروع بازی ====================
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
      targetZombie: null,
    };
  }
}

// اضافه کردن به normalizeState
const originalNormalizeState = normalizeState;
normalizeState = function() {
  originalNormalizeState();
  initDog();
};

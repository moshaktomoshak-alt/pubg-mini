// ==================== رسم NPC از نمای بالا ====================
function drawNPC(x, y, facing, walkPhase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const bodyColor = "#4a6b8a";
  const darkColor = "#2a4b6a";
  const size = 12;

  // بدن
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // سر
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

  // پاها
  const legOffset = Math.sin(walkPhase) * 2;
  ctx.fillStyle = darkColor;
  ctx.fillRect(size * 0.5, -size * 0.5 + legOffset, size * 0.25, size * 0.3);
  ctx.fillRect(size * 0.5, size * 0.2 - legOffset, size * 0.25, size * 0.3);
  ctx.fillRect(-size * 0.5, -size * 0.5 - legOffset, size * 0.25, size * 0.3);
  ctx.fillRect(-size * 0.5, size * 0.2 + legOffset, size * 0.25, size * 0.3);

  // چشم‌ها
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.arc(size * 0.9, -size * 0.15, size * 0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(size * 0.9, size * 0.15, size * 0.06, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ==================== ایجاد NPCها ====================
function initNPCs() {
  npcs = [];
  for (let i = 0; i < NPC_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 500 + Math.random() * 500;
    npcs.push({
      x: state.player.x + Math.cos(angle) * dist,
      y: state.player.y + Math.sin(angle) * dist,
      homeX: state.player.x + Math.cos(angle) * dist,
      homeY: state.player.y + Math.sin(angle) * dist,
      facing: Math.random() * Math.PI * 2,
      walkPhase: Math.random() * 10,
      messageTimer: 0,
      message: null,
    });
  }
}

// ==================== به‌روزرسانی NPCها ====================
function updateNPCs(dt) {
  for (const npc of npcs) {
    const distToHome = Math.hypot(npc.x - npc.homeX, npc.y - npc.homeY);
    if (distToHome > NPC_WANDER_RANGE) {
      const angle = Math.atan2(npc.homeY - npc.y, npc.homeX - npc.x);
      npc.x += Math.cos(angle) * 0.5 * dt;
      npc.y += Math.sin(angle) * 0.5 * dt;
      npc.facing = angle;
    } else {
      npc.walkPhase += dt * 0.2;
      const wanderAngle = Math.random() * Math.PI * 2;
      npc.x += Math.cos(wanderAngle) * 0.3 * dt;
      npc.y += Math.sin(wanderAngle) * 0.3 * dt;
      npc.facing = wanderAngle;
    }

    const distToPlayer = Math.hypot(npc.x - state.player.x, npc.y - state.player.y);
    if (distToPlayer < NPC_INTERACT_DIST) {
      npc.messageTimer += dt * 16.67;
      if (npc.messageTimer > 3000 && !npc.message) {
        npc.message = NPC_MESSAGES[Math.floor(Math.random() * NPC_MESSAGES.length)];
        npc.messageTimer = 0;
      }
    } else {
      npc.message = null;
      npc.messageTimer = 0;
    }
  }
}

// ==================== رسم NPCها ====================
function drawNPCs() {
  for (const npc of npcs) {
    const s = worldToScreen(npc.x, npc.y);
    if (s.x < -30 || s.x > canvas.width + 30 || s.y < -30 || s.y > canvas.height + 30) continue;
    drawNPC(s.x, s.y, npc.facing, npc.walkPhase);

    if (npc.message) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(s.x - 40, s.y - 35, 80, 20);
      ctx.fillStyle = "#fff";
      ctx.font = "11px Tahoma";
      ctx.textAlign = "center";
      ctx.fillText(npc.message, s.x, s.y - 22);
    }
  }
}

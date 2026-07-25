// ==================== رندرینگ ====================
function drawWorld() {
  ctx.fillStyle = "#4a8a3f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cam = getCamera();
  const tilesX = Math.ceil(canvas.width / TILE) + 2;
  const tilesY = Math.ceil(canvas.height / TILE) + 2;
  const centerTX = Math.round(cam.x / TILE), centerTY = Math.round(cam.y / TILE);

  for (let dx = -tilesX; dx <= tilesX; dx++) {
    for (let dy = -tilesY; dy <= tilesY; dy++) {
      const tx = centerTX + dx, ty = centerTY + dy;
      const wx = tx * TILE, wy = ty * TILE;
      const s = worldToScreen(wx, wy);
      if (s.x < -TILE || s.x > canvas.width + TILE || s.y < -TILE || s.y > canvas.height + TILE) continue;

      const g = hash2(tx, ty, state.worldSeed + 999);
      ctx.fillStyle = g < 0.15 ? "#4f9345" : (g > 0.9 ? "#457c3c" : "#4a8a3f");
      ctx.fillRect(s.x - TILE / 2, s.y - TILE / 2, TILE, TILE);

      const key = modKey(tx, ty);
      const mod = state.modifications[key];
      if (mod && mod.build) {
        if (mod.build === "wall") {
          if (imgReady(IMG.wall_user)) {
            ctx.drawImage(IMG.wall_user, s.x - TILE / 2, s.y - TILE / 2, TILE, TILE);
          } else {
            ctx.fillStyle = "#8a6239";
            ctx.fillRect(s.x - TILE / 2 + 2, s.y - TILE / 2 + 2, TILE - 4, TILE - 4);
          }
        } else if (mod.build === "door") {
          ctx.fillStyle = BUILDABLE.door;
          ctx.fillRect(s.x - TILE / 2 + 6, s.y - TILE / 2, TILE - 12, TILE);
        } else if (mod.build === "window") {
          ctx.fillStyle = BUILDABLE.window;
          ctx.fillRect(s.x - TILE / 2 + 2, s.y - TILE / 2 + 10, TILE - 4, TILE - 20);
        } else {
          ctx.fillStyle = BUILDABLE[mod.build];
          ctx.fillRect(s.x - TILE / 2 + 2, s.y - TILE / 2 + 2, TILE - 4, TILE - 4);
        }
        continue;
      }
      if (mod && mod.harvested) continue;

      const res = tileResource(tx, ty, state.worldSeed);
      if (res) {
        const def = RESOURCE_NODES[res];
        if (def.images) {
          const variant = pickVariant(def.images, tx, ty, state.worldSeed);
          const drawn = drawImageCentered(IMG[variant], s.x, s.y, def.drawH);
          if (!drawn) {
            ctx.fillStyle = def.color;
            ctx.beginPath(); ctx.arc(s.x, s.y, def.radius, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.fillStyle = def.color;
          ctx.beginPath();
          ctx.arc(s.x, s.y, def.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}

function drawCars() {
  const cars = getAllNearbyCars();
  for (const c of cars) {
    if (inCar && c.key === drivingCarKey) continue;
    const s = worldToScreen(c.x, c.y);
    if (s.x < -60 || s.x > canvas.width + 60 || s.y < -60 || s.y > canvas.height + 60) continue;
    const cs = getCarState(c.key);
    const carImg = IMG[c.color] || IMG.engine_orange;
    if (imgReady(carImg)) {
      if (!cs.repaired) ctx.filter = "grayscale(1) brightness(0.7)";
      else if (cs.health < 50) ctx.filter = "sepia(0.35) hue-rotate(-25deg)";
      drawImageCentered(carImg, s.x, s.y, 50);
      ctx.filter = "none";
    } else {
      ctx.fillStyle = cs.repaired ? "#2f7d3a" : "#555";
      ctx.fillRect(s.x - 20, s.y - 13, 40, 26);
    }
    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
    let label = !cs.repaired ? "🔧 موتور خرابه" : `${Math.round(cs.fuel)}% 🔧${Math.round(cs.health)}%`;
    ctx.fillText(label, s.x, s.y - 32);
  }
}

function drawZombies() {
  const now = performance.now();
  for (const z of zombies) {
    const s = worldToScreen(z.x, z.y);
    const by = s.y;
    const sheet = ZOMBIE_SHEETS[z.type] || ZOMBIE_SHEETS.zombie1;
    const frameIdx = z.alerted ? Math.floor(z.walkPhase * 2) % sheet.frames : 0;
    const drawn = drawSpriteFrameRotated(IMG[z.type || "zombie1"], sheet, frameIdx, s.x, by, 34, (z.facing || 0) + Math.PI / 2);
    if (!drawn) {
      ctx.fillStyle = z.alerted ? "#3f8f4a" : "#5c8f63";
      ctx.beginPath(); ctx.arc(s.x, by, 13, 0, Math.PI * 2); ctx.fill();
    }
    if (now < z.hitFlashUntil) drawHitFlash(s.x, by, 16);
    if (now < z.alertPulseUntil) {
      ctx.fillStyle = "#fff2a8";
      ctx.font = "16px Tahoma";
      ctx.textAlign = "center";
      ctx.fillText("❗", s.x, by - 26);
    }
    ctx.fillStyle = "#111"; ctx.fillRect(s.x - 14, s.y - 24, 28 * (z.hp / 60), 4);
  }
}

function drawWaypoint() {
  if (!state.waypoint) return;
  const wp = state.waypoint;
  const s = worldToScreen(wp.x, wp.y);
  const dist = Math.round(Math.hypot(wp.x - state.player.x, wp.y - state.player.y));
  const margin = 44;
  const cx = canvas.width / 2, cy = canvas.height / 2;
  const onScreen = s.x > margin && s.x < canvas.width - margin && s.y > margin + 40 && s.y < canvas.height - 90;

  if (onScreen) {
    ctx.fillStyle = "#e05353";
    ctx.beginPath(); ctx.arc(s.x, s.y - 18, 8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(s.x - 6, s.y - 12); ctx.lineTo(s.x + 6, s.y - 12); ctx.lineTo(s.x, s.y);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
    ctx.fillText(dist + "m", s.x, s.y - 30);
  } else {
    const ang = Math.atan2(s.y - cy, s.x - cx);
    const ex = cx + Math.cos(ang) * (canvas.width / 2 - margin);
    const ey = cy + Math.sin(ang) * (canvas.height / 2 - margin);
    ctx.save();
    ctx.translate(ex, ey);
    ctx.rotate(ang);
    ctx.fillStyle = "#e05353";
    ctx.beginPath();
    ctx.moveTo(13, 0); ctx.lineTo(-8, -9); ctx.lineTo(-8, 9); ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
    ctx.fillText(dist + "m", ex, ey - 14);
  }
}

function drawPlayer() {
  const s = { x: canvas.width / 2, y: canvas.height / 2 };
  const now = performance.now();
  const aiming = Math.hypot(aimVec.x, aimVec.y) > 0.2;

  if (aiming) {
    const range = WEAPON_RANGE[currentWeaponKey()];
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(playerFacing);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const coneRad = ATTACK_CONE_DEG * Math.PI / 180;
    ctx.arc(0, 0, range, -coneRad, coneRad);
    ctx.closePath();
    ctx.fillStyle = "rgba(224,83,83,0.22)";
    ctx.fill();
    ctx.strokeStyle = "rgba(224,83,83,0.6)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
    const label = document.getElementById("range-label");
    label.textContent = `${ITEM_EMOJI[currentWeaponKey()]||''} ${ITEM_FA[currentWeaponKey()] || "دست خالی"} — برد ${range}`;
    label.classList.add("show");
  } else {
    document.getElementById("range-label").classList.remove("show");
  }

  const moving = Math.hypot(joyVec.x, joyVec.y) > 0.15;
  let by = s.y;
  if (moving && !inCar) by += Math.sin(playerWalkPhase) * 3;

  if (inCar) {
    const drivingCar = getCarState(drivingCarKey || "main");
    const carColor = getAllNearbyCars().find((c) => c.key === (drivingCarKey || "main"));
    const carImg = IMG[(carColor && carColor.color) || "engine_orange"];
    const drawn = drawImageRotated(carImg, s.x, by, 46, playerFacing + Math.PI / 2);
    if (!drawn) {
      ctx.fillStyle = "#d9a441";
      ctx.beginPath(); ctx.arc(s.x, by, 16, 0, Math.PI * 2); ctx.fill();
    }
    drawImageRotated(IMG.player, s.x, by, 22, playerFacing);
    ctx.fillStyle = "#fff"; ctx.font = "10px Tahoma"; ctx.textAlign = "center";
    ctx.fillText(`⛽${Math.round(drivingCar.fuel)}%`, s.x, by - 34);
    return;
  }

  drawLimbsAndWeapon(s.x, by, playerFacing, playerWalkPhase, currentWeaponKey(), now < attackPulseUntil);
  const drawn = drawImageRotated(IMG.player, s.x, by, 32, playerFacing);
  if (!drawn) {
    ctx.fillStyle = "#e8c07a";
    ctx.beginPath(); ctx.arc(s.x, by, 14, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3b2a17"; ctx.lineWidth = 2; ctx.stroke();
  }
  if (now < playerHitFlashUntil) drawHitFlash(s.x, by, 18);

  const p = state.player;
  let warningEmoji = "";
  if (p.health < 30) {
    warningEmoji = "❤️";
  } else if (p.hunger < 20) {
    warningEmoji = "🍗";
  } else if (p.thirst < 20) {
    warningEmoji = "💧";
  }
  if (warningEmoji) {
    ctx.save();
    ctx.font = "16px Tahoma";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(warningEmoji, s.x, s.y - 22);
    ctx.restore();
  }
}

function drawCraftingProgress() {
  const now = performance.now();
  const toRemove = [];
  for (let i = 0; i < state.craftingQueue.length; i++) {
    const item = state.craftingQueue[i];
    const elapsed = (now - item.startTime) / 1000;
    const progress = Math.min(1, elapsed / item.duration);
    const x = 10, y = 70 + i * 22;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(x, y, 120, 14);
    ctx.fillStyle = "#58c46b";
    ctx.fillRect(x + 2, y + 2, 116 * progress, 10);
    ctx.fillStyle = "#fff";
    ctx.font = "10px Tahoma";
    ctx.textAlign = "left";
    const emoji = ITEM_EMOJI[item.recipe.id] || "";
    ctx.fillText(`${emoji} ${item.recipe.name}`, x + 4, y + 11);
    if (progress >= 1) {
      const give = item.recipe.give;
      for (const [k, v] of Object.entries(give)) {
        state.inventory[k] = (state.inventory[k] || 0) + v;
      }
      toast(item.recipe.name + " ساخته شد ✅");
      toRemove.push(i);
    }
  }
  for (let i = toRemove.length - 1; i >= 0; i--) {
    state.craftingQueue.splice(toRemove[i], 1);
  }
}

function updateHUD() {
  const p = state.player;
  document.getElementById("bar-health").style.width = Math.max(0, p.health) + "%";
  document.getElementById("bar-hunger").style.width = p.hunger + "%";
  document.getElementById("bar-thirst").style.width = p.thirst + "%";
  document.getElementById("bar-stamina").style.width = p.stamina + "%";
}

// ==================== جوی‌استیک ====================
function setupStick(zoneId, stickId, onMove, onRelease) {
  const zone = document.getElementById(zoneId);
  const stick = document.getElementById(stickId);
  let active = false, startX = 0, startY = 0, touchId = null;
  const MAX = 31;

  function move(clientX, clientY) {
    const raw = physicalDeltaToLocal(clientX - startX, clientY - startY);
    let dx = raw.x, dy = raw.y;
    const dist = Math.hypot(dx, dy);
    if (dist > MAX) { dx = dx / dist * MAX; dy = dy / dist * MAX; }
    stick.style.left = 31 + dx + "px";
    stick.style.top = 31 + dy + "px";
    onMove(dx / MAX, dy / MAX);
  }

  function reset() {
    active = false; touchId = null;
    stick.style.left = "31px"; stick.style.top = "31px";
    onRelease();
  }

  zone.addEventListener("touchstart", (e) => {
    const t = e.changedTouches[0];
    active = true; touchId = t.identifier; startX = t.clientX; startY = t.clientY;
    e.preventDefault();
  }, { passive: false });

  zone.addEventListener("touchmove", (e) => {
    if (!active) return;
    for (const t of e.changedTouches) if (t.identifier === touchId) move(t.clientX, t.clientY);
    e.preventDefault();
  }, { passive: false });

  zone.addEventListener("touchend", reset);
  zone.addEventListener("touchcancel", reset);

  zone.addEventListener("mousedown", (e) => { active = true; startX = e.clientX; startY = e.clientY; });
  addEventListener("mousemove", (e) => { if (active) move(e.clientX, e.clientY); });
  addEventListener("mouseup", () => { if (active) reset(); });
}

let joyVec = { x: 0, y: 0 };
setupStick("joystick-zone", "joystick-stick",
  (x, y) => { joyVec.x = x; joyVec.y = y; },
  () => { joyVec.x = 0; joyVec.y = 0; }
);

let aimVec = { x: 0, y: 0 };
setupStick("aim-zone", "aim-stick",
  (x, y) => { aimVec.x = x; aimVec.y = y; },
  () => { aimVec.x = 0; aimVec.y = 0; }
);

// ==================== رویدادهای صفحه ====================
canvas.addEventListener("click", (e) => {
  const p = physicalPointToLocal(e.clientX, e.clientY);
  onTapScreen(p.x, p.y);
});

canvas.addEventListener("touchstart", (e) => {
  if (e.target !== canvas) return;
  const t = e.touches[0];
  const p = physicalPointToLocal(t.clientX, t.clientY);
  onTapScreen(p.x, p.y);
}, { passive: true });

function onTapScreen(sx, sy) {
  if (!state || isDead || isPanelOpen) return;
  const w = screenToWorld(sx, sy);
  if (waypointArmed) {
    state.waypoint = { x: w.x, y: w.y };
    waypointArmed = false;
    document.getElementById("btn-gps").classList.remove("active");
    toast("نشون گذاشته شد ");
    return;
  }
  if (placeMode) { tryPlace(w.x, w.y); return; }
}

// ==================== دکمه‌ها ====================
document.getElementById("btn-interact").addEventListener("click", doInteract);
document.getElementById("btn-help").addEventListener("click", () => openPanel("help"));
document.getElementById("btn-gps").addEventListener("click", () => {
  if (isPanelOpen) return;
  if (state.waypoint) {
    state.waypoint = null;
    waypointArmed = false;
    document.getElementById("btn-gps").classList.remove("active");
    toast("نشون حذف شد");
    return;
  }
  waypointArmed = !waypointArmed;
  document.getElementById("btn-gps").classList.toggle("active", waypointArmed);
  toast(waypointArmed ? "روی نقشه بزن تا نشون بذاری" : "لغو شد");
});

document.querySelectorAll("#bottom-menu button").forEach((btn) => {
  btn.addEventListener("click", () => openPanel(btn.dataset.panel));
});
document.getElementById("panel-close").addEventListener("click", closePanel);

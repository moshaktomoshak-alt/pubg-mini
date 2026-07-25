// ==================== متغیرهای سراسری ====================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const loadingEl = document.getElementById("loading");
const rotateWrap = document.getElementById("rotate-wrap");

function resize() { canvas.width = rotateWrap.clientWidth; canvas.height = rotateWrap.clientHeight; }
addEventListener("resize", resize);
addEventListener("orientationchange", resize);
resize();

// ==================== حلقه اصلی ====================
let lastTime = performance.now();
function loop() {
  const now = performance.now();
  const dt = Math.min(2.2, (now - lastTime) / 16.67);
  lastTime = now;

  if (state && !isDead && !isPanelOpen && !isHidden) {
    updatePlayer(dt);
    updateZombies(dt);
    updateDog(dt);
  }

  if (state) {
    drawWorld();
    drawCars();
    drawZombies();
    drawDog();
    drawWaypoint();
    drawCraftingProgress();
    drawPlayer();
    updateHUD();
    if (!isDead && !isPanelOpen) {
      saveTimer += dt;
      if (saveTimer > 300) { saveTimer = 0; saveState(); }
    }
  }
  requestAnimationFrame(loop);
}

// ==================== شروع ====================
(async function init() {
  try {
    await loadState();
    document.getElementById("loading").style.display = "none";
    lastZombieSpawn = performance.now();
    if (!state.guideSeen) {
      openPanel("help");
      state.guideSeen = true;
      saveState();
    }
    loop();
  } catch (e) {
    const el = document.getElementById("loading");
    el.style.display = "flex";
    el.style.fontSize = "13px";
    el.style.padding = "20px";
    el.textContent = "⚠️ خطا موقع شروع: " + (e && e.message ? e.message : e);
  }
})();

addEventListener("blur", saveState);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    isHidden = true;
    saveState();
  } else {
    isHidden = false;
    lastTime = performance.now();
  }
});

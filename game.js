const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let tg = window.Telegram && window.Telegram.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const socket = io();
let myId = null;
let worldSize = 2000;
let latestState = null;

// ---------- ورود با اسم ----------
const nameOverlay = document.getElementById("nameOverlay");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");

const tgName = tg && tg.initDataUnsafe && tg.initDataUnsafe.user
  ? (tg.initDataUnsafe.user.first_name || "Player") : "";
if (tgName) nameInput.value = tgName;

joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "Player";
  socket.emit("join", { name });
  nameOverlay.style.display = "none";
});

socket.on("joined", (data) => {
  myId = data.id;
  worldSize = data.worldSize;
});

socket.on("joinRejected", (data) => {
  alert(data.reason === "room_full" ? "روم پره، بعدا امتحان کن" : "بازی در حال اجراست، منتظر بمون");
  nameOverlay.style.display = "flex";
});

const statusEl = document.getElementById("status");
socket.on("gameStarted", () => {
  statusEl.style.display = "none";
});
socket.on("gameOver", (data) => {
  statusEl.style.display = "block";
  statusEl.innerText = data.winnerId
    ? (data.winnerId === myId ? "🏆 تو بردی!" : `🏆 برنده: ${data.winnerName}`)
    : "بازی مساوی شد";
});
socket.on("gameReset", () => {
  statusEl.style.display = "none";
  nameOverlay.style.display = "flex";
});

socket.on("state", (state) => {
  latestState = state;
  if (state.status === "waiting") {
    statusEl.style.display = "block";
    statusEl.innerText = `منتظر بازیکن‌ها... (${state.players.length}/10)\nحداقل ۲ نفر لازمه`;
  } else if (state.status === "running") {
    statusEl.style.display = "none";
  }
  const me = state.players.find((p) => p.id === myId);
  if (me) {
    document.getElementById("hpFill").style.width = Math.max(0, me.hp) + "%";
  }
  document.getElementById("aliveCount").innerText =
    "🟢 " + state.players.filter((p) => p.alive).length + " زنده";
});

// ---------- کنترل جوی‌استیک ----------
const joyBase = document.getElementById("joyBase");
const joyStick = document.getElementById("joyStick");
let joyActive = false;
let joyTouchId = null;
let joyCenter = { x: 0, y: 0 };
let currentDx = 0, currentDy = 0, currentAngle = 0;

function joyStart(x, y, id) {
  joyActive = true;
  joyTouchId = id;
  const rect = joyBase.getBoundingClientRect();
  joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}
function joyMove(x, y) {
  if (!joyActive) return;
  let dx = x - joyCenter.x;
  let dy = y - joyCenter.y;
  const maxDist = 40;
  const dist = Math.hypot(dx, dy);
  if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
  joyStick.style.transform = `translate(${dx}px, ${dy}px)`;
  currentDx = dx / maxDist;
  currentDy = dy / maxDist;
  if (Math.hypot(currentDx, currentDy) > 0.15) {
    currentAngle = Math.atan2(currentDy, currentDx);
  }
}
function joyEnd() {
  joyActive = false;
  joyTouchId = null;
  joyStick.style.transform = "translate(0,0)";
  currentDx = 0; currentDy = 0;
}

joyBase.addEventListener("touchstart", (e) => {
  const t = e.changedTouches[0];
  joyStart(t.clientX, t.clientY, t.identifier);
  joyMove(t.clientX, t.clientY);
});
window.addEventListener("touchmove", (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyTouchId) joyMove(t.clientX, t.clientY);
  }
});
window.addEventListener("touchend", (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyTouchId) joyEnd();
  }
});

// mouse fallback (برای تست دسکتاپ)
joyBase.addEventListener("mousedown", (e) => { joyStart(e.clientX, e.clientY, "mouse"); joyMove(e.clientX, e.clientY); });
window.addEventListener("mousemove", (e) => { if (joyTouchId === "mouse") joyMove(e.clientX, e.clientY); });
window.addEventListener("mouseup", () => { if (joyTouchId === "mouse") joyEnd(); });

setInterval(() => {
  if (myId) socket.emit("input", { dx: currentDx, dy: currentDy, angle: currentAngle });
}, 50);

// ---------- شلیک ----------
document.getElementById("shootBtn").addEventListener("touchstart", (e) => {
  e.preventDefault();
  socket.emit("shoot");
});
document.getElementById("shootBtn").addEventListener("click", () => {
  socket.emit("shoot");
});

// ---------- رندر ----------
function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!latestState) return;

  const me = latestState.players.find((p) => p.id === myId) || { x: worldSize / 2, y: worldSize / 2 };
  const camX = me.x - canvas.width / 2;
  const camY = me.y - canvas.height / 2;

  // پس‌زمینه گرید
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  const gridSize = 100;
  for (let x = -((camX) % gridSize); x < canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = -((camY) % gridSize); y < canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // مرزهای دنیا
  ctx.strokeStyle = "rgba(255,80,80,0.4)";
  ctx.lineWidth = 4;
  ctx.strokeRect(-camX, -camY, worldSize, worldSize);

  // زون امن
  const z = latestState.zone;
  ctx.strokeStyle = "rgba(80,180,255,0.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(z.x - camX, z.y - camY, z.radius, 0, Math.PI * 2);
  ctx.stroke();

  // گلوله‌ها
  ctx.fillStyle = "#ffe066";
  for (const b of latestState.bullets) {
    ctx.beginPath();
    ctx.arc(b.x - camX, b.y - camY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // بازیکن‌ها
  for (const p of latestState.players) {
    if (!p.alive) continue;
    const x = p.x - camX, y = p.y - camY;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.angle);
    ctx.fillStyle = p.id === myId ? "#4caf50" : "#e05656";
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillRect(14, -3, 14, 6); // اسلحه
    ctx.restore();

    ctx.fillStyle = "#fff";
    ctx.font = "12px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText(p.name, x, y - 28);

    ctx.fillStyle = "#333";
    ctx.fillRect(x - 20, y - 24, 40, 5);
    ctx.fillStyle = "#4caf50";
    ctx.fillRect(x - 20, y - 24, 40 * Math.max(0, p.hp) / 100, 5);
  }
}
draw();
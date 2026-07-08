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
let worldSize = 3000;
let latestState = null;

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
socket.on("gameStarted", () => { statusEl.style.display = "none"; });
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
  document.getElementById("lengthInfo").innerText = me ? "🐍 " + me.segments.length : "";
  document.getElementById("aliveCount").innerText =
    "🟢 " + state.players.filter((p) => p.alive).length + " زنده";
});

// ---------- جوی‌استیک ----------
const joyBase = document.getElementById("joyBase");
const joyStick = document.getElementById("joyStick");
let joyActive = false;
let joyTouchId = null;
let joyCenter = { x: 0, y: 0 };
let currentAngle = 0;
let hasAngle = false;

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
  if (Math.hypot(dx, dy) > 8) {
    currentAngle = Math.atan2(dy, dx);
    hasAngle = true;
  }
}
function joyEnd() {
  joyActive = false;
  joyTouchId = null;
  joyStick.style.transform = "translate(0,0)";
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
joyBase.addEventListener("mousedown", (e) => { joyStart(e.clientX, e.clientY, "mouse"); joyMove(e.clientX, e.clientY); });
window.addEventListener("mousemove", (e) => { if (joyTouchId === "mouse") joyMove(e.clientX, e.clientY); });
window.addEventListener("mouseup", () => { if (joyTouchId === "mouse") joyEnd(); });

setInterval(() => {
  if (myId && hasAngle) socket.emit("input", { angle: currentAngle });
}, 50);

// ---------- رندر ----------
function drawSnake(segs, color, isMe) {
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    ctx.beginPath();
    ctx.fillStyle = i === 0 ? (isMe ? "#8bffb0" : "#ffb0b0") : color;
    const r = i === 0 ? 11 : 9;
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function draw() {
  requestAnimationFrame(draw);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!latestState) return;

  const me = latestState.players.find((p) => p.id === myId);
  const headRef = me && me.segments.length ? me.segments[0] : { x: worldSize / 2, y: worldSize / 2 };
  const camX = headRef.x - canvas.width / 2;
  const camY = headRef.y - canvas.height / 2;

  ctx.save();
  ctx.translate(-camX, -camY);

  // گرید پس‌زمینه
  ctx.strokeStyle = "rgba(255,255,255,0.04)";
  const gridSize = 100;
  const startX = Math.floor(camX / gridSize) * gridSize;
  const startY = Math.floor(camY / gridSize) * gridSize;
  for (let x = startX; x < camX + canvas.width; x += gridSize) {
    ctx.beginPath(); ctx.moveTo(x, camY); ctx.lineTo(x, camY + canvas.height); ctx.stroke();
  }
  for (let y = startY; y < camY + canvas.height; y += gridSize) {
    ctx.beginPath(); ctx.moveTo(camX, y); ctx.lineTo(camX + canvas.width, y); ctx.stroke();
  }

  // دیوار دنیا
  ctx.strokeStyle = "rgba(255,80,80,0.5)";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, worldSize, worldSize);

  // غذا
  ctx.fillStyle = "#ffd93d";
  for (const f of latestState.food) {
    ctx.beginPath();
    ctx.arc(f.x, f.y, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // مارها
  for (const p of latestState.players) {
    if (!p.alive) continue;
    const isMe = p.id === myId;
    drawSnake(p.segments, isMe ? "#4caf50" : "#c0455c", isMe);
    const head = p.segments[0];
    ctx.fillStyle = "#fff";
    ctx.font = "12px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText(p.name, head.x, head.y - 22);
  }

  ctx.restore();
}
draw();

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

const socket = io({
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 500,
  reconnectionDelayMax: 3000,
  timeout: 10000,
});
let myId = null;
let worldSize = 4000;

// این مقادیر باید دقیقاً با سرور یکی باشن تا پیش‌بینی محلی درست کار کنه
const SPEED = 160;
const TURN_RATE = 4.5;

const nameOverlay = document.getElementById("nameOverlay");
const nameInput = document.getElementById("nameInput");
const joinBtn = document.getElementById("joinBtn");
const readyOverlay = document.getElementById("readyOverlay");
const readyBtn = document.getElementById("readyBtn");
const readyWaitingText = document.getElementById("readyWaitingText");
let imReady = false;

const tgName = tg && tg.initDataUnsafe && tg.initDataUnsafe.user
  ? (tg.initDataUnsafe.user.first_name || "Player") : "";
if (tgName) nameInput.value = tgName;

joinBtn.addEventListener("click", () => {
  const name = nameInput.value.trim() || "Player";
  socket.emit("join", { name });
  nameOverlay.style.display = "none";
  readyOverlay.style.display = "flex";
});

readyBtn.addEventListener("click", () => {
  socket.emit("ready");
  imReady = true;
  readyBtn.style.display = "none";
  readyWaitingText.innerText = "آماده شدی! منتظر بقیه‌ی بازیکن‌ها...";
});

socket.on("joined", (data) => {
  myId = data.id;
  worldSize = data.worldSize;
  predicted = null;
});

socket.on("joinRejected", (data) => {
  alert(data.reason === "room_full" ? "روم پره، بعدا امتحان کن" : "بازی در حال اجراست، منتظر بمون");
  nameOverlay.style.display = "flex";
});

const statusEl = document.getElementById("status");
socket.on("gameStarted", () => {
  statusEl.style.display = "none";
  readyOverlay.style.display = "none";
});
socket.on("gameOver", (data) => {
  statusEl.style.display = "block";
  statusEl.innerText = data.winnerId
    ? (data.winnerId === myId ? "🏆 تو بردی!" : `🏆 برنده: ${data.winnerName}`)
    : "بازی مساوی شد";
});
socket.on("gameReset", () => {
  statusEl.style.display = "none";
  readyOverlay.style.display = "none";
  imReady = false;
  predicted = null;
  nameOverlay.style.display = "flex";
});

let prevState = null;
let curState = null;
let curStateTime = 0;
const STATE_INTERVAL = 100; // باید با فاصله ارسال سرور (BROADCAST_RATE=10) یکی باشه

// ---------- پیش‌بینی سمت کلاینت برای مار خودم ----------
let predicted = null; // {x,y,angle}
let lastPredictTime = null;

function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

socket.on("state", (state) => {
  prevState = curState;
  curState = state;
  curStateTime = performance.now();

  if (state.status === "waiting") {
    const readyCount = state.players.filter((p) => p.ready).length;
    if (readyOverlay.style.display !== "none") {
      readyWaitingText.innerText = imReady
        ? `آماده شدی! منتظر بقیه (${readyCount}/${state.players.length})...`
        : `بازیکن‌ها: ${state.players.length} — آماده: ${readyCount}\nحداقل ۲ نفر لازمه`;
    }
  }
  const me = state.players.find((p) => p.id === myId);
  document.getElementById("lengthInfo").innerText = me ? "🐍 " + me.segments.length : "";
  document.getElementById("aliveCount").innerText =
    "🟢 " + state.players.filter((p) => p.alive).length + " زنده";

  if (me && me.alive && me.segments.length) {
    const serverHead = { x: me.segments[0][0], y: me.segments[0][1] };
    if (!predicted) {
      predicted = { x: serverHead.x, y: serverHead.y, angle: me.angle };
    } else {
      const CORRECTION = 0.25;
      predicted.x += (serverHead.x - predicted.x) * CORRECTION;
      predicted.y += (serverHead.y - predicted.y) * CORRECTION;
      predicted.angle += angleDiff(predicted.angle, me.angle) * CORRECTION;
    }
  } else if (!me || !me.alive) {
    predicted = null;
  }
});

function getInterpolatedPlayers() {
  if (!curState) return [];
  if (!prevState) return curState.players;
  const t = Math.min(1, (performance.now() - curStateTime) / STATE_INTERVAL + 1);
  const factor = Math.min(1, Math.max(0, t));
  return curState.players.map((p) => {
    const old = prevState.players.find((op) => op.id === p.id);
    if (!old || old.segments.length !== p.segments.length) return p;
    const segments = p.segments.map((seg, i) => {
      const os = old.segments[i];
      return [
        os[0] + (seg[0] - os[0]) * factor,
        os[1] + (seg[1] - os[1]) * factor,
      ];
    });
    return { ...p, segments };
  });
}

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
function drawSnake(segs, color, headColor) {
  if (segs.length >= 2) {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = color;
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(segs[0][0], segs[0][1]);
    for (let i = 1; i < segs.length; i++) ctx.lineTo(segs[i][0], segs[i][1]);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.fillStyle = headColor;
  ctx.arc(segs[0][0], segs[0][1], 11, 0, Math.PI * 2);
  ctx.fill();
}

function draw() {
  requestAnimationFrame(draw);
  const now = performance.now();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!curState) return;

  const players = getInterpolatedPlayers();
  const me = players.find((p) => p.id === myId);

  if (lastPredictTime === null) lastPredictTime = now;
  const dt = Math.min(0.1, (now - lastPredictTime) / 1000);
  lastPredictTime = now;
  if (predicted && curState.status === "running") {
    const target = hasAngle ? currentAngle : predicted.angle;
    const diff = angleDiff(predicted.angle, target);
    const maxTurn = TURN_RATE * dt;
    if (Math.abs(diff) <= maxTurn) predicted.angle = target;
    else predicted.angle += Math.sign(diff) * maxTurn;
    predicted.x += Math.cos(predicted.angle) * SPEED * dt;
    predicted.y += Math.sin(predicted.angle) * SPEED * dt;
  }

  let camX, camY, offsetX = 0, offsetY = 0;
  if (predicted && me && me.segments.length) {
    camX = predicted.x - canvas.width / 2;
    camY = predicted.y - canvas.height / 2;
    offsetX = predicted.x - me.segments[0][0];
    offsetY = predicted.y - me.segments[0][1];
  } else {
    const headRef = me && me.segments.length ? { x: me.segments[0][0], y: me.segments[0][1] } : { x: worldSize / 2, y: worldSize / 2 };
    camX = headRef.x - canvas.width / 2;
    camY = headRef.y - canvas.height / 2;
  }

  ctx.save();
  ctx.translate(-camX, -camY);

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

  ctx.strokeStyle = "rgba(255,80,80,0.5)";
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, worldSize, worldSize);

  ctx.fillStyle = "#ffd93d";
  for (const f of curState.food) {
    ctx.beginPath();
    ctx.arc(f[0], f[1], 6, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of players) {
    if (!p.alive) continue;
    const isMe = p.id === myId;
    const segs = isMe && (offsetX || offsetY)
      ? p.segments.map(([x, y]) => [x + offsetX, y + offsetY])
      : p.segments;
    drawSnake(segs, isMe ? "#4caf50" : "#c0455c", isMe ? "#8bffb0" : "#ffb0b0");
    const head = segs[0];
    ctx.fillStyle = "#fff";
    ctx.font = "12px Tahoma";
    ctx.textAlign = "center";
    ctx.fillText(p.name, head[0], head[1] - 22);
  }

  ctx.restore();
}
draw();

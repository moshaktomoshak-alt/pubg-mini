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
  ctx.ellipse(size * 0.5, size size

// ==================== رسم سگ از نمای بالا ====================
function drawDogTopDown(x, y, facing, walkPhase, isDowned) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(facing);

  const bodyColor = isDowned ? "#8B7355" : "#C4A57B";
  const darkColor = isDowned ? "#6B5340" : "#8B6F47";
  const size = 14;

  // ✅ اول: پاها (زیر بدن) - حالا پاهای جلو جلوتر قرار گرفتن
  if (!isDowned) {
    const legOffset = Math.sin(walkPhase) * 3;
    ctx.fillStyle = darkColor;
    // پای چپ جلو (جلوتر، نزدیک سر)
    ctx.fillRect(size * 0.6, -size * 0.55 + legOffset, size * 0.3, size * 0.35);
    // پای راست جلو
    ctx.fillRect(size * 0.6, size * 0.2 - legOffset, size * 0.3, size * 0.35);
    // پای چپ عقب
    ctx.fillRect(-size * 0.6, -size * 0.55 - legOffset, size * 0.3, size * 0.35);
    // پای راست عقب
    ctx.fillRect(-size * 0.6, size * 0.2 + legOffset, size * 0.3, size * 0.35);
  } else {
    // در حالت زخمی، پاها جمع می‌شن
    ctx.fillStyle = darkColor;
    // پاهای جلو جمع‌شده
    ctx.fillRect(size * 0.4, -size * 0.45, size * 0.25, size * 0.25);
    ctx.fillRect(size * 0.4, size * 0.2, size * 0.25, size * 0.25);
    // پاهای عقب جمع‌شده
    ctx.fillRect(-size * 0.5, -size * 0.45, size * 0.25, size * 0.25);
    ctx.fillRect(-size * 0.5, size * 0.2, size * 0.25, size * 0.25);
  }

  // ✅ دوم: بدن (روی پاها)
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

  // خط‌های کمر (فقط در حالت زخمی)
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

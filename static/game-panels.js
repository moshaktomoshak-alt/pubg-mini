// ==================== پنل‌ها ====================
function closePanel() {
  document.getElementById("panel-overlay").classList.add("hidden");
  isPanelOpen = false;
}

function panelFeedback(msg) {
  const el = document.getElementById("panel-feedback");
  if (el) el.textContent = msg;
}

function renderDogPanel(title, content) {
  title.textContent = "🐕 سگ همراه";
  
  if (!dog) {
    content.innerHTML = "<div class='item-row'>سگ هنوز ایجاد نشده!</div>";
    return;
  }

  const statusText = dog.isDowned ? "💔 زخمی (مرده)" : "❤️ سالم";
  const hpPercent = Math.round((dog.hp / DOG_MAX_HP) * 100);
  const modeText = dog.mode === 'attack' ? '⚔️ حمله' : '📦 جمع‌آوری';

  content.innerHTML = `
    <div class='item-row'>
      <span class='name'>وضعیت: ${statusText} (${hpPercent}%)</span>
    </div>
    <div class='item-row'>
      <span class='name'>حالت فعلی: ${modeText}</span>
    </div>
  `;

  if (dog.isDowned) {
    const reviveRow = document.createElement("div");
    reviveRow.className = "item-row";
    const foodCount = state.inventory.food || 0;
    reviveRow.innerHTML = `<span class="name">🍗 احیای سگ (نیاز به ۱ گوشت، داری ${foodCount})</span>`;
    const b = document.createElement("button");
    b.textContent = "احیاء";
    b.disabled = foodCount < 1;
    b.onclick = () => { reviveDog(); openPanel("dog"); };
    reviveRow.appendChild(b);
    content.appendChild(reviveRow);
  } else {
    const healRow = document.createElement("div");
    healRow.className = "item-row";
    const foodCount = state.inventory.food || 0;
    healRow.innerHTML = `<span class="name">🍗 درمان با گوشت (+۲۵٪ جون، داری ${foodCount})</span>`;
    const b = document.createElement("button");
    b.textContent = "درمان";
    b.disabled = foodCount < 1 || dog.hp >= DOG_MAX_HP;
    b.onclick = () => { healDog('food'); openPanel("dog"); };
    healRow.appendChild(b);
    content.appendChild(healRow);
  }

  if (!dog.isDowned) {
    const modeRow = document.createElement("div");
    modeRow.className = "item-row";
    modeRow.innerHTML = `<span class="name">🔄 تغییر حالت سگ</span>`;
    const btnAttack = document.createElement("button");
    btnAttack.textContent = "⚔️ حمله";
    btnAttack.disabled = dog.mode === 'attack';
    btnAttack.onclick = () => { setDogMode('attack'); openPanel("dog"); };
    modeRow.appendChild(btnAttack);
    
    const btnCollect = document.createElement("button");
    btnCollect.textContent = "📦 جمع‌آوری";
    btnCollect.disabled = dog.mode === 'collect';
    btnCollect.onclick = () => { setDogMode('collect'); openPanel("dog"); };
    modeRow.appendChild(btnCollect);
    content.appendChild(modeRow);
  }
}

function renderCarPanel(title, content, carKey) {
  currentCarKey = carKey || "main";
  const car = getCarState(currentCarKey);
  title.textContent = "🚗 ماشین";

  if (!car.repaired) {
    const row = document.createElement("div");
    row.className = "item-row";
    const costText = Object.entries(CAR_ENGINE_NEED).map(([k, v]) => {
      const have = state.inventory[k] || 0;
      const ok = have >= v;
      const emoji = ITEM_EMOJI[k] || "";
      return `${emoji} ${ITEM_FA[k]} ${v} <span style="color:${ok ? '#7bd88f' : '#e07a7a'}">(داری ${have})</span>`;
    }).join("، ");
    const can = Object.entries(CAR_ENGINE_NEED).every(([k, v]) => (state.inventory[k] || 0) >= v);
    row.innerHTML = `<span class="name">تعمیر موتور<div class="cost">نیاز: ${costText}</div></span>`;
    const b = document.createElement("button");
    b.textContent = "بساز";
    b.disabled = !can;
    b.onclick = () => {
      for (const [k, v] of Object.entries(CAR_ENGINE_NEED)) state.inventory[k] -= v;
      car.repaired = true;
      panelFeedback("موتور تعمیر شد ✅");
      toast("موتور تعمیر شد! حالا بنزین بریز ⛽");
      openPanel("car", currentCarKey);
    };
    row.appendChild(b);
    content.appendChild(row);
    return;
  }

  const healthRow = document.createElement("div");
  healthRow.className = "item-row";
  healthRow.innerHTML = `<span class="name">🔧 سلامت بدنه: ${Math.round(car.health)}٪</span>`;
  if (car.health < 100) {
    const hasWrench = (state.inventory.wrench || 0) > 0;
    const b = document.createElement("button");
    b.textContent = "تعمیر با آچار (+۵۰٪)";
    b.disabled = !hasWrench;
    b.onclick = () => {
      state.inventory.wrench -= 1;
      car.health = Math.min(100, car.health + 50);
      panelFeedback("بدنه تعمیر شد ✅");
      toast("بدنه تعمیر شد 🔧");
      openPanel("car", currentCarKey);
    };
    healthRow.appendChild(b);
  }
  content.appendChild(healthRow);

  const fuelRow = document.createElement("div");
  fuelRow.className = "item-row";
  fuelRow.innerHTML = `<span class="name">⛽ بنزین: ${Math.round(car.fuel)}٪</span>`;
  if (car.fuel < 100) {
    const hasFuel = (state.inventory.fuel_can || 0) > 0;
    const b = document.createElement("button");
    b.textContent = "پر کردن با قوطی بنزین";
    b.disabled = !hasFuel;
    b.onclick = () => {
      state.inventory.fuel_can -= 1;
      car.fuel = Math.min(100, car.fuel + 34);
      panelFeedback("بنزین اضافه شد ✅");
      toast("بنزین اضافه شد ⛽");
      openPanel("car", currentCarKey);
    };
    fuelRow.appendChild(b);
  }
  content.appendChild(fuelRow);

  const hintRow = document.createElement("div");
  hintRow.className = "item-row";
  hintRow.innerHTML = `<span class="name" style="font-size:11px;color:#aaa">قوطی بنزین نداری؟ تو منوی «ساخت» با  ذرت یه قوطی بساز </span>`;
  content.appendChild(hintRow);

  const rideRow = document.createElement("div");
  rideRow.className = "item-row";
  rideRow.innerHTML = `<span class="name">${inCar && currentCarKey === carKey ? "سوار ماشینی" : "کنار ماشینی"}</span>`;
  const rb = document.createElement("button");
  if (inCar) {
    rb.textContent = "پیاده شو";
    rb.onclick = () => { exitCar(); panelFeedback("پیاده شدی"); closePanel(); };
  } else {
    rb.textContent = "سوار شو";
    rb.disabled = car.fuel <= 0;
    rb.onclick = () => { inCar = true; drivingCarKey = currentCarKey; panelFeedback("سوار شدی 🚗"); closePanel(); };
  }
  rideRow.appendChild(rb);
  content.appendChild(rideRow);
}

function openPanel(kind, carKey) {
  if (isDead) return;
  const overlay = document.getElementById("panel-overlay");
  const title = document.getElementById("panel-title");
  const content = document.getElementById("panel-content");
  content.innerHTML = "";
  panelFeedback("");
  overlay.classList.remove("hidden");
  isPanelOpen = true;

  if (kind === "help") {
    title.textContent = "📖 راهنما";
    let activeTab = HELP_TABS[0].id;
    function renderHelpTab(tabId) {
      const tab = HELP_TABS.find(t => t.id === tabId);
      if (!tab) return;
      content.innerHTML = `
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:10px;">
          ${HELP_TABS.map(t => `<button class="tab-btn ${t.id===tabId?'active':''}" data-tab="${t.id}">${t.label}</button>`).join('')}
        </div>
        <div style="background:#2a2a2a; border-radius:10px; padding:12px; white-space:pre-wrap; font-size:13px; line-height:1.9;">${tab.content}</div>
      `;
      content.querySelectorAll('.tab-btn').forEach(btn => {
        btn.onclick = () => renderHelpTab(btn.dataset.tab);
      });
    }
    renderHelpTab(activeTab);

  } else if (kind === "dog") {
    renderDogPanel(title, content);

  } else if (kind === "car") {
    renderCarPanel(title, content, carKey);

  } else if (kind === "inventory") {
    title.textContent = "🎒 آیتم‌های من";
    const inv = state.inventory;
    const keys = Object.keys(inv).filter((k) => inv[k] > 0);
    if (keys.length === 0) content.innerHTML = "<div class='item-row'>چیزی نداری</div>";
    for (const k of keys) {
      const row = document.createElement("div");
      row.className = "item-row";
      const equippable = ["axe", "pick", "knife", "wrench"].includes(k);
      const rangeTxt = equippable ? `(برد ${WEAPON_RANGE[k]})` : "";
      const emoji = ITEM_EMOJI[k] || "";
      row.innerHTML = `<span class="name">${emoji} ${ITEM_FA[k] || k}${rangeTxt} ×${inv[k]}</span>`;
      if (equippable) {
        const b = document.createElement("button");
        b.textContent = state.equipped === k ? "مجهز شده" : "استفاده";
        b.disabled = state.equipped === k;
        b.onclick = () => { state.equipped = k; panelFeedback(ITEM_FA[k] + " رو دستت گرفتی ️"); openPanel("inventory"); };
        row.appendChild(b);
      } else if (k === "wall" || k === "floor" || k === "door" || k === "window") {
        const b = document.createElement("button");
        b.textContent = "جاگذاری";
        b.onclick = () => { placeMode = k; closePanel(); toast("محل مورد نظر رو لمس کن تا " + ITEM_FA[k] + " ساخته بشه"); };
        row.appendChild(b);
      } else if (k === "bandage") {
        const b = document.createElement("button");
        b.textContent = "استفاده";
        b.onclick = () => { useBandage(); openPanel("inventory"); };
        row.appendChild(b);
      } else if (k === "food" || k === "water") {
        const b = document.createElement("button");
        b.textContent = "مصرف";
        b.onclick = () => { consumeItem(k); openPanel("inventory"); };
        row.appendChild(b);
      } else if (k === "food" || k === "corn") {
        if (dog && dog.isDowned) {
          const b = document.createElement("button");
          b.textContent = "درمان سگ 🐕";
          b.onclick = () => { healDog(k); openPanel("inventory"); };
          row.appendChild(b);
        }
      }
      content.appendChild(row);
    }

  } else {
    title.textContent = kind === "craft" ? "🛠️ ساخت وسیله" : "🏠 ساخت بنا";
    const list = RECIPES[kind];
    for (const r of list) {
      const row = document.createElement("div");
      row.className = "item-row";
      const costText = Object.entries(r.need).map(([k, v]) => {
        const have = state.inventory[k] || 0;
        const ok = have >= v;
        const emoji = ITEM_EMOJI[k] || "";
        return `${emoji} ${ITEM_FA[k]} ${v} <span style="color:${ok ? '#7bd88f' : '#e07a7a'}">(داری ${have})</span>`;
      }).join("، ");
      const infoText = r.info ? `<div class="cost">️ ${r.info}</div>` : "";
      const emoji = ITEM_EMOJI[r.id] || "";
      row.innerHTML = `<span class="name">${emoji} ${r.name}<div class="cost">نیاز: ${costText}</div>${infoText}</span>`;
      const can = Object.entries(r.need).every(([k, v]) => (state.inventory[k] || 0) >= v);
      const b = document.createElement("button");
      b.textContent = "ساخت";
      b.disabled = !can;
      b.onclick = () => { startCraft(r); openPanel(kind); };
      row.appendChild(b);
      content.appendChild(row);
    }
  }
}

const overlayScreen = document.getElementById("overlayScreen");
const overlayTitle = document.getElementById("overlayTitle");
const overlayBody = document.getElementById("overlayBody");
const overlayBack = document.getElementById("overlayBack");

let currentOverlay = null;

function openOverlay(type) {
  currentOverlay = type;
  overlayScreen.classList.add("open");
  renderOverlay();
}
function closeOverlay() {
  overlayScreen.classList.remove("open");
  currentOverlay = null;
}
overlayBack.addEventListener("click", () => {
  if (currentOverlay !== "menu") {
    currentOverlay = "menu";
    renderOverlay();
  } else {
    closeOverlay();
  }
});

function renderOverlay() {
  if (!currentOverlay) return;

  // O jogo chama render() quando um peixe é pescado/foge. Antes, isso
  // reconstruía o menu e forçava o scroll para o topo. Agora preservamos
  // a posição somente quando o MESMO menu está sendo atualizado.
  const previousOverlay = overlayBody.dataset.renderedOverlay || "";
  const sameOverlay = previousOverlay === currentOverlay;
  const savedScrollTop = sameOverlay ? overlayBody.scrollTop : 0;

  switch (currentOverlay) {
    case "menu": renderOverlayMenu(); break;
    case "book": renderOverlayBook(); break;
    case "quests": renderOverlayQuests(); break;
    case "achievements": renderOverlayAchievements(); break;
    case "daily": renderOverlayDaily(); break;
    case "baits": renderOverlayBaits(); break;
    case "artifacts": renderOverlayArtifacts(); break;
    case "pearlShop": renderOverlayPearlShop(); break;
    case "boosts": renderOverlayBoosts(); break;
    case "map": renderOverlayMap(); break;
    case "fleet": renderOverlayFleet(); break;
    case "aquarium": renderOverlayAquarium(); break;
    case "island": renderOverlayIsland(); break;
    case "crew": renderOverlayCrew(); break;
    case "museum": renderOverlayMuseum(); break;
    case "talents": renderOverlayTalents(); break;
    case "prestige": renderOverlayPrestige(); break;
    case "season": renderOverlaySeason(); break;
    case "fame": renderOverlayFame(); break;
    case "save": renderOverlaySave(); break;
    default: return;
  }

  overlayBody.dataset.renderedOverlay = currentOverlay;
  requestAnimationFrame(() => {
    if (overlayBody.dataset.renderedOverlay === currentOverlay) {
      overlayBody.scrollTop = savedScrollTop;
    }
  });
}

/* ---------- OVERLAY: MENU PRINCIPAL ---------- */
function renderOverlayMenu() {
  overlayTitle.textContent = "☰ Menu";

  let html = `
    <div class="menu-hero">
      <div class="mh-level">
        <div class="mh-badge">${state.level}</div>
        <div class="mh-info">
          <div class="mh-title">🎣 Pescaria Idle</div>
          <div class="mh-sub">${fmt(Math.floor(state.xp))} / ${fmt(xpNeed())} XP</div>
          <div class="mh-xp"><div class="mh-xp-fill" style="width:${Math.min(100, (state.xp / xpNeed()) * 100)}%"></div></div>
        </div>
      </div>
    </div>

    <div class="menu-stats">
      <div class="menu-stat"><b>${fmt(state.coins)}</b><span>🪙 Moedas</span></div>
      <div class="menu-stat"><b>${fmt(state.caught)}</b><span>🐟 Pescados</span></div>
      <div class="menu-stat"><b>${fmt(state.pearls)}</b><span>🔮 Pérolas</span></div>
    </div>

    <div class="menu-objective">
      <span class="mo-tag">🎯 Objetivo Atual</span>
      <div class="mo-text">${getObjectiveText()}</div>
    </div>
  `;

  for (const sec of MENU_SECTIONS) {
    html += `<div class="menu-section-title">${sec.title}</div>`;
    html += `<div class="menu-grid">`;
    for (const item of sec.items) {
      const badge = item.badgeFn ? item.badgeFn() : null;
      const badgeClass = item.badgeType ? ` ${item.badgeType}` : "";
      const badgeHtml = badge ? `<span class="mc-badge${badgeClass}">${badge}</span>` : "";
      html += `
        <div class="menu-card" data-menu-item="${item.id}">
          <div class="mc-icon">${item.icon}</div>
          <div class="mc-name">${item.name}</div>
          <div class="mc-desc">${item.desc}</div>
          ${badgeHtml}
        </div>
      `;
    }
    html += `</div>`;
  }

  overlayBody.innerHTML = html;

  overlayBody.querySelectorAll("[data-menu-item]").forEach(card => {
    card.addEventListener("click", () => {
      currentOverlay = card.dataset.menuItem;
      renderOverlay();
    });
  });
}

/* ---------- OVERLAY: LIVRO ---------- */
function renderOverlayBook() {
  overlayTitle.textContent = "📖 Livro de Peixes";
  const cards = [];
  places.forEach((p, pi) => {
    p.fishes.forEach((f, fi) => {
      const gid = pi + ":" + fi;
      const found = state.discovered.includes(gid);
      const stats = state.fishStats[gid] || { count: 0 };
      const rc = RARITY[f.rarity].cls;
      const variantId = state.variantStats[gid] || "normal";
      const v = VARIANTS[variantId];
      cards.push(`<div class="fishcard ${found ? "" : "lock"} ${rc}" data-gid="${gid}">
        <div class="emoji">${found ? f.emoji : "❓"}${variantId !== "normal" ? `<span class="variant-badge">${v.emoji}</span>` : ""}</div>
        <small>${found ? f.name : "?????"}</small>
        <small style="opacity:.6">${found ? "x" + stats.count : "—"}</small>
      </div>`);
    });
  });
  overlayBody.innerHTML = `
    <div class="muted" style="text-align:center;margin-bottom:12px">
      ${state.discovered.length} / ${TOTAL_FISHES} espécies descobertas
    </div>
    <div class="collection">${cards.join("")}</div>
  `;
  overlayBody.querySelectorAll(".fishcard").forEach(el => {
    el.addEventListener("click", () => showFishDetail(el.dataset.gid));
  });
}

/* ---------- OVERLAY: MISSÕES ---------- */
function renderOverlayQuests() {
  overlayTitle.textContent = "🎯 Missões";
  let html = "";
  state.quests.forEach((q, i) => {
    const pct = Math.min(100, (q.progress / q.goal) * 100);
    const ready = q.progress >= q.goal;
    html += `<div class="quest">
      <div class="row"><b>${q.label}</b><span style="font-size:11px;font-weight:800">${fmt(Math.min(q.progress, q.goal))}/${fmt(q.goal)}</span></div>
      <div class="qbar"><div class="qfill" style="width:${pct}%"></div></div>
      <div class="row">
        <small class="muted">Recompensa: <b style="color:#ffd166">${fmt(q.reward)} 🪙</b></small>
        <button class="claim" data-quest="${i}" ${ready ? "" : "disabled"}>${ready ? "🎁 RESGATAR" : "Em progresso"}</button>
      </div>
    </div>`;
  });

  html += `<h3 style="margin-top:20px;font-size:14px">🎯 Missões de Longo Prazo</h3>`;
  LONG_QUESTS.forEach(lq => {
    const done = !!state.longQuestsCompleted[lq.id];
    html += `<div class="quest" style="${done ? "opacity:.6" : ""}">
      <div class="row"><b>${lq.name} ${done ? "✓" : ""}</b></div>
      <div class="muted" style="font-size:11px;margin:4px 0">${lq.desc}</div>
      <div class="row"><small class="muted">Recompensa: <b style="color:#ffd166">${lq.reward.coins ? fmt(lq.reward.coins) + " 🪙" : ""} ${lq.reward.pearls ? "+" + lq.reward.pearls + " 🔮" : ""}</b></small></div>
    </div>`;
  });

  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-quest]").forEach(btn => {
    btn.addEventListener("click", () => {
      claimQuest(Number(btn.dataset.quest), btn);
      renderOverlayQuests();
    });
  });
}

/* ---------- OVERLAY: CONQUISTAS ---------- */
function renderOverlayAchievements() {
  overlayTitle.textContent = "🏆 Conquistas";
  const done = Object.keys(state.achievements).length;
  let html = `<div class="muted" style="text-align:center;margin-bottom:12px">${done} / ${ACHIEVEMENTS.length} conquistadas</div>`;
  ACHIEVEMENTS.forEach(a => {
    const isDone = !!state.achievements[a.id];
    const rewardTxt = a.reward.bonus ? `+${Math.round(a.reward.bonus * 100)}%` : (a.reward.pearls ? `+${a.reward.pearls} 🔮` : "");
    html += `<div class="achievement ${isDone ? "done" : ""}">
      <div class="icon">${isDone ? a.icon : "🔒"}</div>
      <div class="info">
        <b>${a.name}</b>
        <small>${a.desc}${isDone ? " • ✓ " + rewardTxt : ""}</small>
      </div>
    </div>`;
  });
  overlayBody.innerHTML = html;
}

/* ---------- OVERLAY: DESAFIO DIÁRIO ---------- */
function renderOverlayDaily() {
  overlayTitle.textContent = "📅 Desafio Diário";
  const c = state.dailyChallenge;
  if (!c) { overlayBody.innerHTML = "<div class='muted'>Carregando...</div>"; return; }
  const pct = Math.min(100, (c.progress / c.goal) * 100);
  const statusText = c.completed ? "✓ COMPLETO" : `${fmt(c.progress)} / ${fmt(c.goal)}`;
  overlayBody.innerHTML = `
    <div class="quest" style="margin-bottom:20px">
      <div class="row"><b>📅 ${c.label}</b><span style="font-size:12px;font-weight:800">${statusText}</span></div>
      <div class="qbar"><div class="qfill" style="width:${pct}%"></div></div>
      <div class="row">
        <small class="muted">Recompensa: <b style="color:#ffd166">${c.reward.coins ? fmt(c.reward.coins) + " 🪙" : ""} ${c.reward.pearls ? "+" + c.reward.pearls + " 🔮" : ""}</b></small>
      </div>
      <div class="muted" style="font-size:10px;margin-top:8px;text-align:center">Renova automaticamente à meia-noite</div>
    </div>
  `;
}

/* ---------- OVERLAY: ISCAS ---------- */
function renderOverlayBaits() {
  overlayTitle.textContent = "🪱 Iscas";
  let html = `<div class="grid">`;
  BAITS.forEach(b => {
    const count = state.baits[b.id] || 0;
    const isActive = state.activeBait === b.id;
    const canBuy = !b.infinite && state.coins >= b.cost;
    const canEquip = b.infinite || count > 0;
    html += `<div class="card">
      <b>${b.emoji} ${b.name}</b>
      <small>${b.desc}</small>
      <small style="color:#ffd166;margin-top:4px">${b.infinite ? "∞ Ilimitada" : "Estoque: " + count}</small>
      <div style="display:flex;gap:5px;margin-top:8px">
        ${!b.infinite ? `<button class="action" data-buy-bait="${b.id}" ${canBuy ? "" : "disabled"}>+1 · ${fmt(b.cost)}🪙</button>` : `<button class="action" disabled>Grátis</button>`}
        <button class="action ${isActive ? "action-success" : "action-secondary"}" data-equip-bait="${b.id}" ${isActive || !canEquip ? "disabled" : ""}>${isActive ? "✓ Em uso" : "Equipar"}</button>
      </div>
    </div>`;
  });
  html += `</div>`;
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-buy-bait]").forEach(b => b.addEventListener("click", () => { buyBait(b.dataset.buyBait); renderOverlayBaits(); }));
  overlayBody.querySelectorAll("[data-equip-bait]").forEach(b => b.addEventListener("click", () => { equipBait(b.dataset.equipBait); renderOverlayBaits(); }));
}

/* ---------- OVERLAY: ARTEFATOS ---------- */
function renderOverlayArtifacts() {
  overlayTitle.textContent = "🔮 Artefatos Mágicos";
  const list = [
    { id: "doubleHook", name: "Anzol Duplo", emoji: "🔱", cost: 3, desc: "25% chance de 2 peixes" },
    { id: "midasCup",   name: "Cálice de Midas", emoji: "🏆", cost: 5, desc: "+50% valor" },
    { id: "timeHourglass", name: "Ampulheta", emoji: "⏳", cost: 4, desc: "-15% tempo" },
    { id: "baitMaster", name: "Mestre das Iscas", emoji: "🪱", cost: 4, desc: "+50% cargas" },
    { id: "steadyHand", name: "Mão Firme", emoji: "🧤", cost: 6, desc: "+8% precisão" }
  ];
  let html = `<div class="muted" style="margin-bottom:12px;text-align:center">Você tem <b style="color:#c77dff">${state.pearls} 🔮</b> pérolas</div><div class="grid">`;
  list.forEach(a => {
    const owned = state.artifacts[a.id];
    html += `<div class="card" style="${owned ? "outline:1px solid #7209b7;background:#150a21" : ""}">
      <b>${a.emoji} ${a.name}</b>
      <small>${a.desc}</small>
      <button class="action action-artifact" data-buy-art="${a.id}" ${owned || state.pearls < a.cost ? "disabled" : ""}>${owned ? "✓ COMPRADO" : `Comprar · ${a.cost} 🔮`}</button>
    </div>`;
  });
  html += `</div>`;
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-buy-art]").forEach(btn => btn.addEventListener("click", () => { buyArtifact(btn.dataset.buyArt); renderOverlayArtifacts(); }));
}

/* ---------- OVERLAY: LOJA DE PÉROLAS ---------- */
function renderOverlayPearlShop() {
  overlayTitle.textContent = "💎 Loja de Pérolas";
  let html = `<div class="muted" style="margin-bottom:12px;text-align:center">Você tem <b style="color:#c77dff">${state.pearls} 🔮</b> pérolas</div><div class="grid">`;
  PEARL_SHOP_UPGRADES.forEach(u => {
    const lvl = getPearlShopLevel(u.id);
    const cost = getPearlShopCost(u.id);
    const canBuy = state.pearls >= cost;
    html += `<div class="card">
      <b>${u.emoji} ${u.name} <span style="opacity:.7;font-size:11px">Nv.${lvl}</span></b>
      <small>${u.desc}</small>
      <button class="action action-artifact" data-pearl-upgrade="${u.id}" ${canBuy ? "" : "disabled"}>Comprar · ${cost} 🔮</button>
    </div>`;
  });
  html += `</div>`;
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-pearl-upgrade]").forEach(btn => {
    btn.addEventListener("click", () => { buyPearlUpgrade(btn.dataset.pearlUpgrade, btn); renderOverlayPearlShop(); });
  });
}

/* ---------- OVERLAY: BOOSTS ---------- */
function renderOverlayBoosts() {
  overlayTitle.textContent = "⚡ Boosts Temporários";
  let html = "";
  if (state.boost && state.boost.expiresAt > Date.now()) {
    const left = Math.ceil((state.boost.expiresAt - Date.now()) / 1000);
    html += `<div class="boost-card active">
      <div><b>⚡ ${state.boost.type.toUpperCase()} ${state.boost.mult}x ATIVO</b><br><small>Expira em ${left}s</small></div>
    </div>`;
  }
  html += `<div class="grid">
    <div class="card"><b>⚡ Velocidade 2x</b><small>5min · 10.000 🪙</small><button class="action" data-boost="speed" ${state.coins < 10000 ? "disabled" : ""}>Comprar</button></div>
    <div class="card"><b>💰 Moedas 2x</b><small>5min · 10.000 🪙</small><button class="action" data-boost="coins" ${state.coins < 10000 ? "disabled" : ""}>Comprar</button></div>
    <div class="card"><b>⭐ XP 2x</b><small>5min · 10.000 🪙</small><button class="action" data-boost="xp" ${state.coins < 10000 ? "disabled" : ""}>Comprar</button></div>
    <div class="card"><b>🍀 Sorte 2x</b><small>5min · 20.000 🪙</small><button class="action" data-boost="luck" ${state.coins < 20000 ? "disabled" : ""}>Comprar</button></div>
  </div>`;
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-boost]").forEach(btn => btn.addEventListener("click", () => { buyBoost(btn.dataset.boost); renderOverlayBoosts(); }));
}

/* ---------- OVERLAY: MAPA / VIAGEM ---------- */
function renderOverlayMap() {
  overlayTitle.textContent = "🗺️ Mapa";
  let html = `<div class="muted" style="text-align:center;margin-bottom:12px">Visite ${state.visitedPlaces.length}/5 locais</div>`;
  places.forEach(p => {
    const isCurrent = state.place === p.id;
    const isLocked = state.level < p.need;
    const isVisited = state.visitedPlaces.includes(p.id);
    const travelCost = isVisited ? 0 : (p.unlockCost || 0);
    const canPay = state.coins >= travelCost;

    let statusClass = "", statusText = "";
    if (isCurrent) { statusClass = "current"; statusText = "📍 VOCÊ ESTÁ AQUI"; }
    else if (isLocked) { statusClass = "locked"; statusText = `🔒 Nível ${p.need}`; }
    else if (travelCost === 0) { statusClass = "free"; statusText = isVisited ? "✓ Visitado" : "✓ Liberado"; }
    else { statusClass = canPay ? "free" : "locked"; statusText = `${fmt(travelCost)} 🪙`; }

    const fishesHtml = p.fishes.map((f, fi) => {
      const gid = p.id + ":" + fi;
      const found = state.discovered.includes(gid);
      return `<div class="lc-fish ${found ? "found" : ""}">${found ? f.emoji : "❓"}</div>`;
    }).join("");

    html += `<div class="loc-card ${isCurrent ? "active" : ""} ${isLocked ? "locked" : ""}">
      <div class="lc-head">
        <div style="flex:1;min-width:0">
          <div class="lc-name">${p.name}</div>
          <div class="lc-desc">${p.desc}</div>
        </div>
        <span class="lc-status ${statusClass}">${statusText}</span>
      </div>
      <div class="lc-fishes">${fishesHtml}</div>
      ${!isCurrent && !isLocked ? `<button class="action ${canPay ? "action-success" : ""}" data-travel="${p.id}" ${canPay ? "" : "disabled"}>
        ${travelCost > 0 ? `🚤 VIAJAR · ${fmt(travelCost)} 🪙` : "🚤 VIAJAR (grátis)"}
      </button>` : ""}
    </div>`;
  });
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-travel]").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.travel);
      closeOverlay();
      setTimeout(() => travelTo(idx), 200);
    });
  });
}

/* ---------- OVERLAY: FROTA ---------- */
function renderOverlayFleet() {
  overlayTitle.textContent = "🚤 Frota";
  const maxFleet = 5 + (state.crewHired.captain ? 1 : 0);
  let html = `<div class="muted" style="text-align:center;margin-bottom:12px">${state.fleet.length} / ${maxFleet} barcos</div>`;
  if (state.fleet.length === 0) {
    html += `<div class="card" style="margin-bottom:12px"><small>Sem barcos ainda. Compre barcos para pescar offline em locais diferentes.</small></div>`;
  } else {
    state.fleet.forEach((b, i) => {
      const p = places[b.placeIdx];
      html += `<div class="card" style="margin-bottom:8px">
        <b>🚤 Barco ${i+1} → ${p.name}</b>
        <small>Eficiência: ${Math.round(b.efficiency * 100)}% • Pescando offline</small>
      </div>`;
    });
  }
  html += `<h3 style="margin-top:16px;font-size:13px">Comprar novo barco:</h3>`;
  places.forEach((p, i) => {
    if (state.level < p.need) return;
    if (state.fleet.some(b => b.placeIdx === i)) return;
    const c = boatFleetCost();
    const canBuy = state.coins >= c && state.fleet.length < maxFleet;
    html += `<button class="action action-secondary" data-boat="${i}" ${canBuy ? "" : "disabled"} style="margin-bottom:6px">
      + Barco em ${p.name} · ${fmt(c)} 🪙
    </button>`;
  });
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-boat]").forEach(b => b.addEventListener("click", () => { buyBoat(Number(b.dataset.boat)); renderOverlayFleet(); }));
}

/* ---------- OVERLAY: AQUÁRIO ---------- */
function renderOverlayAquarium() {
  overlayTitle.textContent = "🐠 Aquário";
  const cap = aquariumCapacity();
  const upCost = state.aquariumLevel === 1 ? 50000 : state.aquariumLevel === 2 ? 500000 : null;
  let html = `<div class="muted" style="text-align:center;margin-bottom:12px">Nível ${state.aquariumLevel} · ${state.aquariumFish.length}/${cap} · Bônus: +${state.aquariumFish.length}% XP</div>`;
  if (state.aquariumFish.length > 0) {
    html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">`;
    state.aquariumFish.forEach((gid, idx) => {
      const [pi, fi] = gid.split(":").map(Number);
      const f = places[pi].fishes[fi];
      html += `<div class="card" data-aq="${idx}" style="cursor:pointer;padding:8px;text-align:center;min-width:60px">
        <div style="font-size:22px">${f.emoji}</div>
        <small style="font-size:9px">${f.name.split(" ")[0]}</small>
      </div>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="card" style="margin-bottom:14px"><small>Aquário vazio. Abra o Livro de Peixes e toque num peixe Raro+ para adicionar.</small></div>`;
  }
  if (upCost) {
    html += `<button class="action" data-upgrade-aq ${state.coins < upCost ? "disabled" : ""}>Melhorar · ${fmt(upCost)} 🪙</button>`;
  }
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-aq]").forEach(el => el.addEventListener("click", () => { removeFromAquarium(Number(el.dataset.aq)); renderOverlayAquarium(); }));
  const upBtn = overlayBody.querySelector("[data-upgrade-aq]");
  if (upBtn) upBtn.addEventListener("click", () => { upgradeAquarium(); renderOverlayAquarium(); });
}

/* ---------- OVERLAY: ILHA ---------- */
function renderOverlayIsland() {
  overlayTitle.textContent = "🏝️ Ilha";
  let html = "";
  BUILDINGS.forEach(b => {
    const built = !!state.buildingsBuilt[b.id];
    const canBuy = !built && state.coins >= b.cost;
    html += `<div class="island-building ${built ? "built" : ""}">
      <div class="icon">${b.name.split(" ")[0]}</div>
      <div class="info"><b>${b.name.replace(/^[^\s]+\s/, "")}</b><small>${b.desc}</small></div>
      <button class="action ${built ? "action-success" : ""}" data-build="${b.id}" ${built || !canBuy ? "disabled" : ""} style="width:auto;margin:0;padding:8px 12px">${built ? "✓" : fmt(b.cost) + " 🪙"}</button>
    </div>`;
  });
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-build]").forEach(btn => btn.addEventListener("click", () => { buildBuilding(btn.dataset.build); renderOverlayIsland(); }));
}

/* ---------- OVERLAY: TRIPULAÇÃO ---------- */
function renderOverlayCrew() {
  overlayTitle.textContent = "👥 Tripulação";
  let html = "";
  CREW.forEach(c => {
    const hired = !!state.crewHired[c.id];
    const canBuy = !hired && state.coins >= c.cost;
    html += `<div class="crew-member ${hired ? "hired" : ""}">
      <div class="avatar">${c.name.split(" ")[0]}</div>
      <div class="info"><b>${c.name.replace(/^[^\s]+\s/, "")}</b><small>${c.desc}</small></div>
      <button class="hire-btn" data-hire="${c.id}" ${hired || !canBuy ? "disabled" : ""}>${hired ? "✓" : fmt(c.cost)}</button>
    </div>`;
  });
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-hire]").forEach(btn => btn.addEventListener("click", () => { hireCrew(btn.dataset.hire); renderOverlayCrew(); }));
}

/* ---------- OVERLAY: MUSEU ---------- */
function renderOverlayMuseum() {
  overlayTitle.textContent = "🏛️ Museu";
  let html = "";
  MUSEUM_ROOMS.forEach(r => {
    const p = places[r.placeIdx];
    const have = p.fishes.filter((_,fi)=>state.discovered.includes(r.placeIdx + ":" + fi)).length;
    const done = !!state.museumCompleted[r.id];
    const canComplete = have >= r.need && !done;
    const pct = Math.min(100, (have / r.need) * 100);
    html += `<div class="museum-room ${done ? "room-complete" : ""}">
      <b>${r.name} ${done ? "✓" : ""}</b>
      <div class="rmeta">${have}/${r.need} espécies</div>
      <div class="mbar"><div class="mfill" style="width:${pct}%"></div></div>
      <button class="action ${done ? "action-success" : ""}" data-museum="${r.id}" ${!canComplete ? "disabled" : ""} style="margin-top:6px">${done ? "✓ Completa" : canComplete ? "Completar (+" + fmt(r.reward.coins) + " 🪙)" : "Em progresso"}</button>
    </div>`;
  });
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-museum]").forEach(btn => btn.addEventListener("click", () => { completeMuseumRoom(btn.dataset.museum); renderOverlayMuseum(); }));
}

/* ---------- OVERLAY: TALENTOS ---------- */
function renderOverlayTalents() {
  overlayTitle.textContent = "🌳 Talentos";
  let html = `<div style="background:#1f0f3d;border-radius:12px;padding:14px;text-align:center;margin-bottom:14px">
    <div style="font-size:11px;opacity:.75">Pontos disponíveis</div>
    <div style="font-size:30px;font-weight:900;color:#c77dff">${state.talentPoints}</div>
    <div style="font-size:10px;opacity:.7">${Object.values(state.talents).reduce((a,b)=>a+b,0)} ranks desbloqueados</div>
  </div>`;
  TALENTS.forEach(t => {
    const rank = getTalentRank(t.id);
    const maxed = rank >= t.maxRank;
    const canBuy = !maxed && state.talentPoints >= t.cost;
    const unlocked = rank > 0;
    html += `<div class="talent ${unlocked ? "unlocked" : ""}">
      <div class="t-icon">${t.name.split(" ")[0]}</div>
      <div class="t-info">
        <b>${t.name.replace(/^[^\s]+\s/, "")} <span class="t-cost">${rank}/${t.maxRank}</span></b>
        <small>${t.desc}</small>
      </div>
      <button data-talent="${t.id}" ${maxed || !canBuy ? "disabled" : ""}>${maxed ? "MAX" : `${t.cost}🌳`}</button>
    </div>`;
  });
  overlayBody.innerHTML = html;
  overlayBody.querySelectorAll("[data-talent]").forEach(btn => btn.addEventListener("click", () => { buyTalent(btn.dataset.talent); renderOverlayTalents(); }));
}

/* ---------- OVERLAY: PRESTÍGIO ---------- */
function renderOverlayPrestige() {
  overlayTitle.textContent = "✨ Prestígio";
  const pending = getPendingPearls();
  const canPrestige = state.level >= BALANCE.PRESTIGE_LEVEL_REQ && pending > 0;
  const newBonus = Math.round((1 + Math.sqrt(state.pearls + pending) * 0.15 - 1) * 100);
  overlayBody.innerHTML = `
    <div class="prestige-box">
      <div style="font-size:14px;line-height:1.5;margin-bottom:12px">
        Reinicie o progresso em troca de <b>Pérolas Mágicas</b> e <b>1 Ponto de Talento</b>.
      </div>
      <div style="font-size:12px;opacity:.8">Prestígios realizados: <b>${state.prestigeCount}</b></div>
      <div style="font-size:12px;opacity:.8;margin-top:4px">Bônus atual: <b style="color:#e0aaff">+${Math.round((pearlBonus() - 1) * 100)}%</b></div>
      <div style="font-size:13px;margin-top:8px">Pérolas a receber: <b style="color:#ffd166;font-size:18px">${fmt(pending)} 🔮</b></div>
      ${pending > 0 ? `<div style="font-size:12px;margin-top:6px;opacity:.9">Novo bônus total: <b style="color:#e0aaff">+${newBonus}%</b></div>` : ""}
      ${state.level < BALANCE.PRESTIGE_LEVEL_REQ ? `<div style="font-size:12px;margin-top:10px;color:#ff9f1c">🔒 Requer nível ${BALANCE.PRESTIGE_LEVEL_REQ} (atual: ${state.level})</div>` : ""}
      <button class="prestige-btn" id="prestigeActionBtn" ${canPrestige ? "" : "disabled"}>
        ${canPrestige ? `🔮 PRESTÍGIO · +${pending} PÉROLAS` : (state.level < BALANCE.PRESTIGE_LEVEL_REQ ? `🔒 NÍVEL ${BALANCE.PRESTIGE_LEVEL_REQ}` : "Sem pérolas para receber")}
      </button>
    </div>
    <div style="margin-top:20px;padding:12px;background:#0b3a4a;border-radius:12px">
      <div style="font-size:12px;font-weight:800;margin-bottom:8px">💡 O que é mantido no prestígio:</div>
      <div style="font-size:11px;line-height:1.7;opacity:.85">
        ✅ Coleção de peixes<br>
        ✅ Artefatos mágicos<br>
        ✅ Talentos desbloqueados<br>
        ✅ Loja de Pérolas<br>
        ✅ Conquistas<br>
        ❌ Nível, XP, moedas<br>
        ❌ Upgrades (vara, linha, etc)<br>
        ❌ Frota e Aquário
      </div>
    </div>
  `;
  const btn = document.getElementById("prestigeActionBtn");
  if (btn) btn.addEventListener("click", () => { if (canPrestige) { closeOverlay(); doPrestige(); } });
}

/* ---------- OVERLAY: TEMPORADA ---------- */
function renderOverlaySeason() {
  overlayTitle.textContent = "🌿 Estação do Ano";
  if (!state.season || state.season.expiresAt < Date.now()) {
    overlayBody.innerHTML = `
      <div class="card" style="text-align:center;padding:24px">
        <div style="font-size:48px;margin-bottom:12px">🌤️</div>
        <b>Sem estação ativa</b>
        <small>Cada estação dura 39 dias do jogo. Continue pescando para acompanhar o ciclo!</small>
      </div>`;
    return;
  }
  const s = SEASONS.find(x => x.id === state.season.id);
  const total = state.season.expiresAt - state.season.startedAt;
  const left = state.season.expiresAt - Date.now();
  const pct = Math.max(0, Math.min(100, (left / total) * 100));
  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  overlayBody.innerHTML = `
    <div class="season-card" style="background:linear-gradient(135deg,#0b7187,#4dd0a8);border-radius:14px;padding:16px;text-align:center;color:#fff;margin-bottom:16px">
      <div style="font-size:48px">${s.emoji}</div>
      <h4 style="margin:8px 0 6px;font-size:16px">${s.name}</h4>
      <div style="font-size:12px;margin:6px 0;opacity:.95">${s.desc}</div>
      <div style="height:8px;background:rgba(0,0,0,.25);border-radius:9px;overflow:hidden;margin:10px 0">
        <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#fff,#ffd166);border-radius:9px;transition:width .3s"></div>
      </div>
      <div style="font-size:11px;opacity:.9">Termina em ${mins}m ${secs}s</div>
    </div>
    <div style="padding:12px;background:#0b3a4a;border-radius:12px">
      <div style="font-size:12px;font-weight:800;margin-bottom:8px">📊 Estatísticas</div>
      <div style="font-size:11px;opacity:.8">Estações vistas: <b>${state.seasonsSeen || 0}</b></div>
    </div>
  `;
}

/* ---------- OVERLAY: FAMA ---------- */
function renderOverlayFame() {
  overlayTitle.textContent = "🏅 Salão da Fama";
  if (!state.hallOfFame || state.hallOfFame.length === 0) {
    overlayBody.innerHTML = `<div class="card" style="text-align:center;padding:24px"><small>Capture peixes valiosos para entrar no Salão da Fama!</small></div>`;
    return;
  }
  const medals = ["🥇","🥈","🥉","4️⃣","5️⃣"];
  let html = "";
  state.hallOfFame.forEach((e, i) => {
    const [pi, fi] = e.gid.split(":").map(Number);
    const f = places[pi]?.fishes[fi];
    const v = VARIANTS[e.variantId] || VARIANTS.normal;
    html += `<div class="fame-row">
      <span><span class="fame-medal">${medals[i]}</span>${f ? f.emoji + " " + f.name : "?"} ${e.variantId !== "normal" ? `<span class="variant-tag ${v.tag}">${v.emoji}</span>` : ""}</span>
      <span><b>${fmt(e.value)} 🪙</b> · ${fmtWeight(e.weight)}</span>
    </div>`;
  });
  overlayBody.innerHTML = html;
}

/* ---------- OVERLAY: SAVE ---------- */
function renderOverlaySave() {
  overlayTitle.textContent = "💾 Save & Config";
  overlayBody.innerHTML = `
    <div class="card" style="margin-bottom:12px">
      <b>📤 Exportar save</b>
      <small>Copie o código e guarde em segurança.</small>
      <button class="action action-secondary" data-action="export">Copiar código do save</button>
    </div>
    <div class="card" style="margin-bottom:12px">
      <b>📥 Importar save</b>
      <small>Cole o código para restaurar o progresso.</small>
      <button class="action action-secondary" data-action="import">Colar código</button>
    </div>
    <div class="card" style="margin-bottom:12px;border:1px solid #c0392b55">
      <b style="color:#ff6b6b">🗑️ Reset completo</b>
      <small>Apaga TODA a sua progressão. Não pode ser desfeito.</small>
      <button class="action action-danger" data-action="reset">Resetar tudo</button>
    </div>
    <div class="card">
      <b>📊 Estatísticas</b>
      <div style="font-size:11px;line-height:1.7;margin-top:6px;opacity:.85">
        Total pescado: <b>${fmt(state.caught)}</b><br>
        Tentativas: <b>${fmt(state.tries)}</b><br>
        Escaparam: <b>${fmt(state.escapes)}</b><br>
        Críticos: <b>${fmt(state.crits)}</b><br>
        Melhor sequência: <b>${fmt(state.bestStreak || 0)}</b><br>
        Locais visitados: <b>${state.visitedPlaces.length}/5</b>
      </div>
    </div>
  `;
  overlayBody.querySelectorAll("[data-action]").forEach(btn => {
    btn.addEventListener("click", () => {
      const act = btn.dataset.action;
      if (act === "export") exportSave();
      else if (act === "import") importSave();
      else if (act === "reset") resetSave();
    });
  });
}


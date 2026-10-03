/* ============================================================
   FISH DETAIL
   ============================================================ */
function showFishDetail(gid) {
  const [pi, fi] = gid.split(":").map(Number);
  const f = places[pi].fishes[fi];
  const found = state.discovered.includes(gid);
  const stats = state.fishStats[gid] || { count: 0, maxWeight: 0, maxValue: 0 };
  if (!found) {
    showModal(`<div class="fish-detail"><span class="fish-icon">❓</span><h2>?????</h2>
      <div class="stat-line"><span>Local:</span><b>${places[pi].name}</b></div>
      <div class="stat-line"><span>Status:</span><b>Não descoberto</b></div>
      <button onclick="hideModal()">Fechar</button></div>`);
    return;
  }
  const variantId = state.variantStats[gid] || "normal";
  const v = VARIANTS[variantId];
  const canAdd = f.rarity !== "Comum" && f.rarity !== "Incomum";
  showModal(`<div class="fish-detail">
    <span class="fish-icon">${f.emoji}</span>
    <h2>${f.name}${v.name ? `<span class="variant-tag ${v.tag}">${v.emoji} ${v.name}</span>` : ""}</h2>
    <div class="stat-line"><span>Raridade</span><b style="color:${RARITY[f.rarity].color}">${f.rarity}</b></div>
    <div class="stat-line"><span>Local</span><b>${places[pi].name}</b></div>
    <div class="stat-line"><span>Maior peso</span><b>${fmtWeight(stats.maxWeight)}</b></div>
    <div class="stat-line"><span>Capturados</span><b>${fmt(stats.count)}</b></div>
    <div class="stat-line"><span>Maior valor</span><b>${fmt(stats.maxValue)} 🪙</b></div>
    <div class="stat-line"><span>Valor base</span><b>${fmt(f.value)} 🪙</b></div>
    ${canAdd ? `<button class="action action-secondary" data-add-aq="${gid}" style="margin-top:12px">🐠 Colocar no Aquário</button>` : ""}
    <button onclick="hideModal()">Fechar</button>
  </div>`);
  const aqBtn = modalContent.querySelector("[data-add-aq]");
  if (aqBtn) aqBtn.addEventListener("click", () => { addToAquarium(gid); hideModal(); });
}

/* ============================================================
   OBJETIVO
   ============================================================ */
function getObjectiveText() {
  const upgrades = [
    { name: "vara", cost: rodCost() }, { name: "linha", cost: lineCost() },
    { name: "anzol", cost: hookCost() }, { name: "molinete", cost: reelCost() },
    { name: "barco", cost: boatCost() }, { name: "detector", cost: detectorCost() }
  ];
  const next = upgrades.filter(u => state.coins < u.cost).sort((a,b)=>a.cost-b.cost)[0];
  const nextPlace = places.find(p => p.need > state.level);
  const nextUnlock = places.find(p => state.level >= p.need && !state.visitedPlaces.includes(p.id) && p.id !== 0);
  const cur = places[state.place];
  const here = cur.fishes.filter((_,fi)=>state.discovered.includes(state.place + ":" + fi)).length;

  if (state.coins >= BALANCE.AUTO_PERM_COST && !state.autoPermanent) {
    return `Compre auto-pesca PERMANENTE por ${fmt(BALANCE.AUTO_PERM_COST)} 🪙`;
  }
  if (nextUnlock) {
    return `Viaje para ${nextUnlock.name} (${fmt(nextUnlock.unlockCost)} 🪙)`;
  }
  if (next && state.coins >= next.cost * 0.7) {
    return `Junte ${fmt(next.cost - state.coins)} 🪙 para melhorar ${next.name}`;
  }
  if (nextPlace && state.level >= nextPlace.need - 2) {
    return `Alcance nível ${nextPlace.need} para desbloquear ${nextPlace.name}`;
  }
  if (here < cur.fishes.length) {
    return `Descubra ${cur.fishes.length - here} espécies em ${cur.name}`;
  }
  if (state.level >= BALANCE.PRESTIGE_LEVEL_REQ) {
    const pending = getPendingPearls();
    if (pending > 0) return `Faça prestígio para ganhar ${pending} 🔮`;
  }
  if (next) {
    return `Próximo upgrade: ${next.name} por ${fmt(next.cost)} 🪙`;
  }
  return `Capture todas as ${TOTAL_FISHES} espécies!`;
}

/* ============================================================
   AUTO-PESCA RÁPIDA — renderização dos botões
   ============================================================ */
function renderAutoBar() {
  const autoBar = document.getElementById("autoBar");
  const tempBtn = document.getElementById("autoTempBtn");
  const permBtn = document.getElementById("autoPermBtn");
  if (!autoBar || !tempBtn || !permBtn) return;

  // Se já tem permanente, esconde a barra inteira.
  if (state.autoPermanent) {
    autoBar.classList.add("hidden");
    return;
  }
  autoBar.classList.remove("hidden");

  // ===== BOTÃO: PESCA AUTOMÁTICA 5 MINUTOS =====
  const autoActive = state.auto && state.autoExpiresAt > Date.now();
  const tempTitle = document.getElementById("autoTempTitle");
  const tempCost = document.getElementById("autoTempCost");

  tempBtn.classList.toggle("active", !!autoActive);
  tempTitle.textContent = "Pesca automática 5 minutos";

  if (autoActive) {
    const remaining = Math.max(0, state.autoExpiresAt - Date.now());
    const minsLeft = Math.floor(remaining / 60000);
    const secsLeft = Math.floor((remaining % 60000) / 1000);
    tempCost.textContent = `${minsLeft}m ${String(secsLeft).padStart(2,"0")}s restantes · ${fmt(BALANCE.AUTO_TEMP1_COST)} 🪙`;
  } else {
    tempCost.textContent = `${fmt(BALANCE.AUTO_TEMP1_COST)} 🪙`;
  }
  tempBtn.disabled = state.coins < BALANCE.AUTO_TEMP1_COST;

  // ===== BOTÃO: PESCA AUTOMÁTICA PERMANENTE =====
  // Sempre mostra o preço TOTAL, nunca "faltam X".
  const permCost = document.getElementById("autoPermCost");
  permCost.textContent = `${fmt(BALANCE.AUTO_PERM_COST)} 🪙`;
  permBtn.disabled = state.coins < BALANCE.AUTO_PERM_COST;
  permBtn.classList.toggle("active", state.coins >= BALANCE.AUTO_PERM_COST);
}

/* ============================================================
   RENDER PRINCIPAL
   ============================================================ */
function render() {
  const el = id => document.getElementById(id);
  const set = (id, txt) => { const x = el(id); if (x) x.textContent = txt; };

  set("topCoins", fmt(state.coins));
  set("locationName", places[state.place].name);
  set("luckDisplay", getLuck().toFixed(2) + "x");

  set("eqRod", `Nv.${state.rod}`);
  const bait = BAITS.find(b => b.id === state.activeBait) || BAITS[0];
  set("eqBait", bait.name);
  set("eqLine", `Nv.${state.line}`);
  set("eqDet", `Nv.${state.detector}`);

  renderAutoBar();
  renderWeatherAndTime();

  if (currentOverlay) renderOverlay();
}

function renderWeatherAndTime() {
  const w = WEATHERS[state.weather];
  const wc = document.getElementById("weatherChip");
  if (wc) wc.textContent = `${w.emoji} ${w.name}`;
  const period = getCurrentPeriod();
  const gh = getGameHour();
  const hh = Math.floor(gh);
  const mm = Math.floor((gh - hh) * 60);
  const timeStr = `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  const tc = document.getElementById("timeChip");
  if (tc) tc.textContent = `${TIME_PERIODS[period].emoji} ${timeStr}`;
  applyWeatherVisual();
}

/* ============================================================
   PRESTÍGIO
   ============================================================ */
function doPrestige() {
  if (state.level < BALANCE.PRESTIGE_LEVEL_REQ) {
    $("status").textContent = `🔒 Prestígio disponível no nível ${BALANCE.PRESTIGE_LEVEL_REQ}`;
    return;
  }
  const gained = getPendingPearls();
  if (gained <= 0) {
    $("status").textContent = `✨ Faça mais progresso para ganhar pérolas`;
    return;
  }
  const newBonus = Math.round((1 + Math.sqrt(state.pearls + gained) * 0.15 - 1) * 100);
  if (!confirm(`Prestígio?\n\n+${gained} Pérolas\n+1 Ponto de Talento\nBônus total: +${newBonus}%\n\nNível, XP, moedas e upgrades serão resetados.`)) return;
  fishing = false; clearTimeout(autoTimer); sceneIdle();
  state.pearls += gained;
  state.talentPoints += 1;
  state.coins = 100; state.totalEarned = 100; state.runEarned = BALANCE.BASE_RUN_EARNED;
  state.xp = 0; state.level = 1;
  state.rod = 1; state.line = 1; state.hook = 1; state.reel = 1; state.boat = 1; state.detector = 1;
  state.auto = 0; state.autoExpiresAt = 0; state.autoClaim = 0; state.autoBuy = 0;
  state.place = 0;
  state.visitedPlaces = [0];
  state.baits = { worm: 999, shrimp: 0, fishbait: 0, gold: 0, cosmic: 0 };
  state.activeBait = "worm";
  state.tries = 0; state.escapes = 0; state.crits = 0; state.streak = 0;
  state.quests = [createQuest("catch", 0), createQuest("earn", 0), createQuest("rare", 0)];
  state.prestigeCount++;
  state.fleet = [];
  state.aquariumFish = [];
  state.hallOfFame = [];
  $("fishBtn").disabled = false; $("fishBtn").textContent = "🎣 JOGAR A LINHA";
  $("fishBar").style.width = "0%";
  $("status").textContent = `✨ Prestígio! +${gained} Pérolas, +1 Talento`;
  popupOnElement(`🔮 +${gained} PÉROLAS`, document.getElementById("menuBtn"), "epic", 0);
  checkAchievements();
  render(); save();
}

/* ============================================================
   SAVE EXPORT / IMPORT / RESET
   ============================================================ */
function exportSave() {
  const data = JSON.stringify(state);
  const b64 = btoa(unescape(encodeURIComponent(data)));
  navigator.clipboard.writeText(b64).then(() => {
    alert("📤 Save copiado para a área de transferência!");
  }).catch(() => {
    const ta = document.createElement("textarea");
    ta.value = b64; document.body.appendChild(ta); ta.select();
    document.execCommand("copy"); ta.remove();
    alert("📤 Save copiado!");
  });
}
function importSave() {
  const str = prompt("Cole o save aqui:");
  if (!str) return;
  try {
    const json = decodeURIComponent(escape(atob(str.trim())));
    const raw = JSON.parse(json);
    state = migrateSave(raw);
    save(); render();
    alert("📥 Save importado com sucesso!");
  } catch (e) { alert("❌ Save inválido!"); }
}
async function resetSave() {
  if (!confirm("⚠️ Apagar TODO o progresso? Não pode ser desfeito.")) return;
  ["pescaria_idle_autosave","pescaria_idle_v14","pescaria_idle_v13","pescaria_idle_v12","pescaria_idle_v11","pescaria_idle_v10","pescaria_idle_v9","pescaria_idle_v2"].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
  try { history.replaceState(null, "", location.href.split("#")[0]); } catch (e) {}
  await clearIndexedSave();
  location.reload();
}

/* ============================================================
   TICK
   ============================================================ */
function tick() {
  const now = Date.now();
  if (now > state.weatherExpires) {
    state.weather = pickRandomWeather();
    state.weatherExpires = now + 3 * 60 * 1000;
    renderWeatherAndTime();
    save();
  }
  if (state.activeEvent && now > state.activeEvent.expiresAt) {
    state.activeEvent = null;
    if (!fishing) {
      sceneSetStatus("Pronto para pescar");
      $("fishBtn").textContent = "🎣 JOGAR A LINHA";
    }
  }
  if (now > state.nextEventAt) triggerRandomEvent();
  if (state.season && now >= state.season.expiresAt) triggerSeason();
  else if (!state.season) triggerSeason();
  if (currentOverlay === "season") renderOverlay();
  if (state.boost && now > state.boost.expiresAt) state.boost = null;
  state.playTime += 1;

  if (state.auto && !state.autoPermanent && state.autoExpiresAt && now > state.autoExpiresAt) {
    state.auto = 0;
    state.autoExpiresAt = 0;
    clearTimeout(autoTimer);
    $("status").textContent = "⚓ Auto-pesca expirou. Compre novamente!";
    popupOnElement(`⏰ AUTO EXPIROU`, document.getElementById("menuBtn"), "escape", 0);
    render();
  }

  if (state.autoClaim) {
    const ready = readyQuestIndexes();
    for (const idx of ready) {
      const q = state.quests[idx];
      if (!q || q.progress < q.goal) continue;
      q.reward = questRewardFor(q.type, q.tier);
      state.coins += q.reward;
      state.totalEarned += q.reward;
      state.runEarned += q.reward;
      state.questsCompleted++;
      state.quests[idx] = createQuest(q.type, q.tier + 1);
    }
  }

  if (state.autoBuy) {
    const upgrades = [
      { type: "rod", cost: rodCost() }, { type: "line", cost: lineCost() },
      { type: "hook", cost: hookCost() }, { type: "reel", cost: reelCost() },
      { type: "boat", cost: boatCost() }, { type: "detector", cost: detectorCost() }
    ];
    const cheapest = upgrades.filter(u => state.coins >= u.cost).sort((a,b)=>a.cost-b.cost)[0];
    if (cheapest) {
      state.coins -= cheapest.cost;
      if (cheapest.type === "rod") state.rod++;
      else if (cheapest.type === "line") state.line++;
      else if (cheapest.type === "hook") state.hook++;
      else if (cheapest.type === "reel") state.reel++;
      else if (cheapest.type === "boat") state.boat++;
      else if (cheapest.type === "detector") state.detector++;
    }
  }
  refreshDailyIfNeeded();

  const topCoins = document.getElementById("topCoins");
  if (topCoins) topCoins.textContent = fmt(state.coins);
  renderWeatherAndTime();
  renderAutoBar();

  if (currentOverlay === "season") renderOverlay();
}

/* ============================================================
   EVENTOS GLOBAIS
   ============================================================ */
document.getElementById("menuBtn").addEventListener("click", () => {
  currentOverlay = "menu";
  overlayScreen.classList.add("open");
  renderOverlay();
});

$("fishBtn").addEventListener("click", start);

// Auto-pesca rápida — botão temporário
const autoTempBtnEl = document.getElementById("autoTempBtn");
if (autoTempBtnEl) {
  autoTempBtnEl.addEventListener("click", () => {
    const before = state.autoExpiresAt;
    upgrade("auto");
    const after = state.autoExpiresAt;
    if (after > before) {
      const added = Math.round((after - before) / 60000);
      popupOnElement(`⚓ +${added}min`, autoTempBtnEl, "buy", 0);
    }
    render();
  });
}

// Auto-pesca rápida — botão permanente
const autoPermBtnEl = document.getElementById("autoPermBtn");
if (autoPermBtnEl) {
  autoPermBtnEl.addEventListener("click", () => {
    if (state.autoPermanent) return;
    if (state.coins < BALANCE.AUTO_PERM_COST) {
      $("status").textContent = `🔒 Precisa ${fmt(BALANCE.AUTO_PERM_COST)} 🪙 para auto permanente`;
      return;
    }
    if (!confirm(`Comprar Auto-pesca PERMANENTE por ${fmt(BALANCE.AUTO_PERM_COST)} 🪙?\n\nEla nunca expira e a barra de auto-pesca desaparecerá.`)) return;
    buyPermAuto();
    popupOnElement(`🔒 PERMANENTE!`, autoPermBtnEl, "ach", 0);
    render();
  });
}

document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") save(); });
window.addEventListener("pagehide", save);
window.addEventListener("beforeunload", save);
// Salvamento automático periódico: evita perder progresso mesmo se o navegador
// encerrar a página sem disparar os eventos de saída.
setInterval(save, 2000);
window.addEventListener("blur", save);
window.addEventListener("freeze", save);
// Salva também ao entrar em segundo plano no Android.
document.addEventListener("freeze", save);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (overlayScreen.classList.contains("open")) {
      if (currentOverlay !== "menu") {
        currentOverlay = "menu";
        renderOverlay();
      } else {
        closeOverlay();
      }
    } else if (modalOverlay.classList.contains("active")) {
      hideModal();
    }
  }
});

/* ============================================================
   INIT
   ============================================================ */
(async () => {
  // Carrega o save mais recente antes de iniciar os ciclos do jogo.
  // Isso evita que um estado inicial vazio sobrescreva um save existente.
  await hydratePersistentSave();
  offline();
  showOfflineReport();
  render();
  sceneIdle();
  if (state.auto && (state.autoPermanent || state.autoExpiresAt > Date.now())) schedule();
  save();
  setInterval(tick, 1000);

  console.log("🎣 Pescaria Idle V14.3 carregado.");
})();

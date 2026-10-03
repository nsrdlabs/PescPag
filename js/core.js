"use strict";

"use strict";

/* ============================================================
   FORMATAÇÃO
   ============================================================ */
const NUM_UNITS = ["", "K", "M", "B", "T", "Qa", "Qi"];
function fmt(n) {
  if (n === null || n === undefined || !isFinite(n)) return "0";
  const neg = n < 0; n = Math.abs(n);
  if (n < 1000) return (neg ? "-" : "") + Math.floor(n).toString();
  let u = 0;
  while (n >= 1000 && u < NUM_UNITS.length - 1) { n /= 1000; u++; }
  const d = n < 10 ? 2 : n < 100 ? 1 : 0;
  return (neg ? "-" : "") + n.toFixed(d) + NUM_UNITS[u];
}
function fmtWeight(kg) {
  if (kg < 1) return (kg * 1000).toFixed(0) + " g";
  return kg.toFixed(2) + " kg";
}

/* ============================================================
   POPUPS + MODAL
   ============================================================ */
const popupLayer = document.getElementById("popupLayer");
function spawnPopup(text, x, y, variant = "gold", delay = 0) {
  setTimeout(() => {
    const el = document.createElement("div");
    el.className = "popup " + variant;
    el.textContent = text;
    el.style.left = (x + (Math.random() - 0.5) * 40) + "px";
    el.style.top  = y + "px";
    popupLayer.appendChild(el);
    setTimeout(() => el.remove(), 1800);
  }, delay);
}
function popupOnElement(text, el, variant = "gold", delay = 0) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  spawnPopup(text, r.left + r.width / 2, r.top + r.height / 2, variant, delay);
}
const modalOverlay = document.getElementById("modalOverlay");
const modalContent = document.getElementById("modalContent");
function showModal(html) { modalContent.innerHTML = html; modalOverlay.classList.add("active"); }
function hideModal() { modalOverlay.classList.remove("active"); }
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) hideModal(); });

/* ============================================================
   RARIDADES
   ============================================================ */
const RARITY = {
  "Comum":     { cls: "common",    mult: 1.0,  color: "#ffffff",  luckWeight: 1 },
  "Incomum":   { cls: "uncommon",  mult: 1.5,  color: "#4dd0a8",  luckWeight: 0.6 },
  "Raro":      { cls: "rare",      mult: 2.5,  color: "#4da6ff",  luckWeight: 0.35 },
  "Épico":     { cls: "epic",      mult: 4.5,  color: "#c77dff",  luckWeight: 0.18 },
  "Lendário":  { cls: "legendary", mult: 9.0,  color: "#ff9f1c",  luckWeight: 0.08 },
  "Mítico":    { cls: "mythic",    mult: 20.0, color: "#ff4d6d",  luckWeight: 0.03 }
};

/* ============================================================
   VARIANTES
   ============================================================ */
const VARIANTS = {
  normal:    { name: "",              tag: "",                    mult: 1.0,   weight: 1,      emoji: "", xpMult: 1 },
  golden:    { name: "Dourado",       tag: "variant-golden",      mult: 3.0,   weight: 0.04,   emoji: "🌟", xpMult: 2 },
  shadow:    { name: "Sombrio",       tag: "variant-shadow",      mult: 5.0,   weight: 0.02,   emoji: "🌑", xpMult: 3 },
  frozen:    { name: "Congelado",     tag: "variant-frozen",      mult: 7.0,   weight: 0.012,  emoji: "❄️", xpMult: 3 },
  flaming:   { name: "Flamejante",    tag: "variant-flaming",     mult: 10.0,  weight: 0.008,  emoji: "🔥", xpMult: 4 },
  rainbow:   { name: "Arco-Íris",     tag: "variant-rainbow",     mult: 20.0,  weight: 0.003,  emoji: "🌈", xpMult: 6 },
  ethereal:  { name: "Etérea",        tag: "variant-ethereal",    mult: 35.0,  weight: 0.0012, emoji: "👻", xpMult: 8 },
  prismatic: { name: "Prismático",    tag: "variant-prismatic",   mult: 60.0,  weight: 0.0005, emoji: "💠", xpMult: 10 },
  cosmic:    { name: "Cósmica",       tag: "variant-cosmic",      mult: 100.0, weight: 0.0001, emoji: "🌌", xpMult: 15 }
};
function rollVariant(luck = 1) {
  const entries = Object.entries(VARIANTS).filter(([k]) => k !== "normal");
  let totalWeight = 0;
  const weights = entries.map(([k, v]) => {
    const w = v.weight * (1 + (luck - 1) * 0.5);
    totalWeight += w;
    return w;
  });
  if (Math.random() > totalWeight) return "normal";
  let r = Math.random() * totalWeight;
  for (let i = 0; i < entries.length; i++) {
    r -= weights[i];
    if (r <= 0) return entries[i][0];
  }
  return "normal";
}

/* ============================================================
   CICLO DIA/NOITE
   ============================================================ */
function getGameHour() {
  const now = new Date();
  const hourReal = now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
  return (hourReal % 4) * 6;
}
const TIME_PERIODS = {
  morning:  { name: "Manhã",    emoji: "🌅" },
  afternoon:{ name: "Tarde",    emoji: "☀️" },
  night:    { name: "Noite",    emoji: "🌙" },
  dawn:     { name: "Madrugada",emoji: "🌌" }
};
function getCurrentPeriod() {
  const h = getGameHour();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 23) return "night";
  return "dawn";
}
const WEATHERS = {
  sun:      { name: "Sol",        emoji: "☀️", sky: "sun" },
  rain:     { name: "Chuva",      emoji: "🌧️", sky: "rain" },
  storm:    { name: "Tempestade", emoji: "⛈️", sky: "storm" },
  fog:      { name: "Neblina",    emoji: "🌫️", sky: "fog" },
  snow:     { name: "Neve",       emoji: "❄️", sky: "snow" },
  night_w:  { name: "Noite",      emoji: "🌙", sky: "night" }
};
function pickRandomWeather() {
  const h = getGameHour();
  if (h >= 23 || h < 5) return "night_w";
  const pool = ["sun","sun","sun","rain","rain","fog","storm","snow"];
  return pool[Math.floor(Math.random() * pool.length)];
}

/* ============================================================
   PEIXES
   ============================================================ */
const places = [
  {
    id: 0, name: "🌿 Lago tranquilo", desc: "Águas calmas para começar.",
    need: 1, unlockCost: 0, mult: 1.0, rarityBoost: 0.0, bonus: 0, challenge: 0.00,
    fishes: [
      { name: "Sardinha", emoji: "🐟", value: 12, weight: 100, rarity: "Comum", difficulty: 0, horario: ["morning","afternoon"], clima: ["sun","rain","fog"], isca: "worm", xp: 5, pesoMin: 0.05, pesoMax: 0.30 },
      { name: "Lambari", emoji: "🐠", value: 22, weight: 60, rarity: "Comum", difficulty: 0, horario: ["morning","afternoon","night"], clima: ["sun","rain"], isca: "worm", xp: 8, pesoMin: 0.05, pesoMax: 0.25 },
      { name: "Tilápia", emoji: "🐟", value: 35, weight: 45, rarity: "Comum", difficulty: 1, horario: ["morning","afternoon"], clima: ["sun","rain","fog"], isca: "worm", xp: 12, pesoMin: 0.3, pesoMax: 2.0 },
      { name: "Carpa", emoji: "🐟", value: 55, weight: 30, rarity: "Incomum", difficulty: 1, horario: ["morning","afternoon","night"], clima: ["sun","fog"], isca: "worm", xp: 20, pesoMin: 0.5, pesoMax: 4.0 },
      { name: "Bagre", emoji: "🐡", value: 90, weight: 18, rarity: "Incomum", difficulty: 2, horario: ["night","dawn"], clima: ["rain","storm","fog"], isca: "fishbait", xp: 35, pesoMin: 1.0, pesoMax: 6.0 },
      { name: "Traíra", emoji: "🐊", value: 140, weight: 10, rarity: "Raro", difficulty: 2, horario: ["afternoon","night"], clima: ["rain","storm"], isca: "fishbait", xp: 55, pesoMin: 1.5, pesoMax: 5.0 },
      { name: "Pacu", emoji: "🐟", value: 220, weight: 5, rarity: "Raro", difficulty: 3, horario: ["morning","afternoon"], clima: ["sun"], isca: "worm", xp: 80, pesoMin: 2.0, pesoMax: 8.0 },
      { name: "Dourado do lago", emoji: "🐟", value: 400, weight: 2, rarity: "Épico", difficulty: 3, horario: ["morning","dawn"], clima: ["sun","fog"], isca: "gold", xp: 140, pesoMin: 3.0, pesoMax: 10.0 },
      { name: "Piraíba", emoji: "🐊", value: 900, weight: 0.7, rarity: "Lendário", difficulty: 4, horario: ["night","dawn"], clima: ["storm"], isca: "gold", xp: 320, pesoMin: 15.0, pesoMax: 60.0 },
      { name: "Peixe-Espírito", emoji: "✨", value: 2500, weight: 0.15, rarity: "Mítico", difficulty: 5, horario: ["dawn"], clima: ["fog","snow"], isca: "cosmic", xp: 800, pesoMin: 20.0, pesoMax: 80.0 }
    ]
  },
  {
    id: 1, name: "🏞️ Rio selvagem", desc: "Correnteza forte e peixes maiores.",
    need: 4, unlockCost: 500, mult: 1.6, rarityBoost: 0.15, bonus: 2, challenge: 0.03,
    fishes: [
      { name: "Truta", emoji: "🐟", value: 55, weight: 100, rarity: "Comum", difficulty: 0, horario: ["morning","afternoon"], clima: ["sun","fog","rain"], isca: "worm", xp: 15, pesoMin: 0.3, pesoMax: 2.0 },
      { name: "Pirapitinga", emoji: "🐟", value: 85, weight: 55, rarity: "Comum", difficulty: 1, horario: ["afternoon","night"], clima: ["sun","rain"], isca: "worm", xp: 22, pesoMin: 0.8, pesoMax: 3.5 },
      { name: "Piranha", emoji: "🐟", value: 130, weight: 40, rarity: "Incomum", difficulty: 1, horario: ["morning","night"], clima: ["rain","storm"], isca: "fishbait", xp: 35, pesoMin: 0.5, pesoMax: 3.0 },
      { name: "Pintado", emoji: "🐡", value: 210, weight: 25, rarity: "Raro", difficulty: 2, horario: ["night","dawn"], clima: ["rain","fog"], isca: "fishbait", xp: 55, pesoMin: 2.0, pesoMax: 15.0 },
      { name: "Matrinxã", emoji: "🐟", value: 320, weight: 15, rarity: "Raro", difficulty: 2, horario: ["morning","afternoon"], clima: ["sun"], isca: "worm", xp: 90, pesoMin: 1.5, pesoMax: 6.0 },
      { name: "Dourado", emoji: "🐠", value: 520, weight: 8, rarity: "Épico", difficulty: 3, horario: ["dawn","afternoon"], clima: ["sun","fog"], isca: "gold", xp: 160, pesoMin: 4.0, pesoMax: 20.0 },
      { name: "Surubim", emoji: "🐡", value: 780, weight: 4, rarity: "Épico", difficulty: 3, horario: ["night"], clima: ["rain","storm"], isca: "fishbait", xp: 220, pesoMin: 8.0, pesoMax: 40.0 },
      { name: "Pirarucu", emoji: "🐊", value: 1800, weight: 1.2, rarity: "Lendário", difficulty: 4, horario: ["dawn","night"], clima: ["fog","storm"], isca: "gold", xp: 480, pesoMin: 30.0, pesoMax: 150.0 },
      { name: "Jaú Gigante", emoji: "🐡", value: 4500, weight: 0.4, rarity: "Lendário", difficulty: 4, horario: ["night"], clima: ["storm"], isca: "gold", xp: 900, pesoMin: 50.0, pesoMax: 200.0 },
      { name: "Rio Encantado", emoji: "💎", value: 12000, weight: 0.08, rarity: "Mítico", difficulty: 5, horario: ["dawn"], clima: ["fog"], isca: "cosmic", xp: 1800, pesoMin: 80.0, pesoMax: 300.0 }
    ]
  },
  {
    id: 2, name: "🏖️ Praia tropical", desc: "Águas quentes e espécies coloridas.",
    need: 9, unlockCost: 5000, mult: 2.8, rarityBoost: 0.35, bonus: 4, challenge: 0.05,
    fishes: [
      { name: "Palhaço", emoji: "🐠", value: 180, weight: 100, rarity: "Comum", difficulty: 1, horario: ["morning","afternoon"], clima: ["sun"], isca: "shrimp", xp: 40, pesoMin: 0.05, pesoMax: 0.3 },
      { name: "Sargentinho", emoji: "🐟", value: 260, weight: 55, rarity: "Comum", difficulty: 1, horario: ["morning","afternoon"], clima: ["sun","fog"], isca: "shrimp", xp: 55, pesoMin: 0.1, pesoMax: 0.5 },
      { name: "Robalo", emoji: "🐟", value: 380, weight: 38, rarity: "Incomum", difficulty: 2, horario: ["dawn","night"], clima: ["sun","rain","fog"], isca: "shrimp", xp: 90, pesoMin: 0.5, pesoMax: 3.0 },
      { name: "Arraia", emoji: "🐡", value: 580, weight: 22, rarity: "Incomum", difficulty: 2, horario: ["afternoon","night"], clima: ["sun"], isca: "fishbait", xp: 130, pesoMin: 1.0, pesoMax: 8.0 },
      { name: "Peixe-espada", emoji: "🐟", value: 950, weight: 12, rarity: "Raro", difficulty: 3, horario: ["morning","dawn"], clima: ["sun","fog"], isca: "shrimp", xp: 200, pesoMin: 2.0, pesoMax: 8.0 },
      { name: "Garoupa", emoji: "🐡", value: 1500, weight: 6, rarity: "Raro", difficulty: 3, horario: ["night"], clima: ["rain","storm"], isca: "fishbait", xp: 320, pesoMin: 3.0, pesoMax: 15.0 },
      { name: "Mero gigante", emoji: "🐟", value: 2800, weight: 3, rarity: "Épico", difficulty: 4, horario: ["dawn"], clima: ["fog"], isca: "gold", xp: 600, pesoMin: 15.0, pesoMax: 100.0 },
      { name: "Peixe-serra", emoji: "🦈", value: 5500, weight: 1.2, rarity: "Épico", difficulty: 4, horario: ["dawn","night"], clima: ["sun","storm"], isca: "gold", xp: 1100, pesoMin: 10.0, pesoMax: 50.0 },
      { name: "Tartaruga Anciã", emoji: "🐢", value: 12000, weight: 0.5, rarity: "Lendário", difficulty: 5, horario: ["dawn"], clima: ["fog","sun"], isca: "gold", xp: 2200, pesoMin: 50.0, pesoMax: 200.0 },
      { name: "Sereia Coral", emoji: "🧜", value: 30000, weight: 0.05, rarity: "Mítico", difficulty: 5, horario: ["night","dawn"], clima: ["fog"], isca: "cosmic", xp: 5000, pesoMin: 30.0, pesoMax: 60.0 }
    ]
  },
  {
    id: 3, name: "🌊 Mar aberto", desc: "O verdadeiro desafio começa aqui.",
    need: 18, unlockCost: 50000, mult: 5.5, rarityBoost: 0.7, bonus: 7, challenge: 0.08,
    fishes: [
      { name: "Atum", emoji: "🐟", value: 800, weight: 100, rarity: "Comum", difficulty: 1, horario: ["morning","afternoon"], clima: ["sun","fog"], isca: "shrimp", xp: 120, pesoMin: 5.0, pesoMax: 30.0 },
      { name: "Cavala", emoji: "🐟", value: 1300, weight: 55, rarity: "Comum", difficulty: 2, horario: ["morning","afternoon"], clima: ["sun","rain"], isca: "shrimp", xp: 180, pesoMin: 1.0, pesoMax: 10.0 },
      { name: "Barracuda", emoji: "🐟", value: 1900, weight: 35, rarity: "Incomum", difficulty: 2, horario: ["afternoon","night"], clima: ["rain","storm"], isca: "fishbait", xp: 280, pesoMin: 2.0, pesoMax: 15.0 },
      { name: "Peixe-voador", emoji: "🐠", value: 2600, weight: 22, rarity: "Incomum", difficulty: 2, horario: ["dawn","afternoon"], clima: ["sun"], isca: "shrimp", xp: 380, pesoMin: 0.3, pesoMax: 1.5 },
      { name: "Espadarte", emoji: "🐟", value: 4200, weight: 12, rarity: "Raro", difficulty: 3, horario: ["dawn","night"], clima: ["fog","sun"], isca: "fishbait", xp: 620, pesoMin: 20.0, pesoMax: 100.0 },
      { name: "Albacora", emoji: "🐟", value: 6500, weight: 7, rarity: "Raro", difficulty: 3, horario: ["morning","afternoon"], clima: ["sun","storm"], isca: "shrimp", xp: 900, pesoMin: 10.0, pesoMax: 60.0 },
      { name: "Tubarão branco", emoji: "🦈", value: 12000, weight: 2.5, rarity: "Épico", difficulty: 4, horario: ["night","dawn"], clima: ["rain","storm"], isca: "gold", xp: 1600, pesoMin: 100.0, pesoMax: 600.0 },
      { name: "Marlim azul", emoji: "🐟", value: 22000, weight: 1.0, rarity: "Épico", difficulty: 4, horario: ["dawn"], clima: ["fog"], isca: "gold", xp: 2800, pesoMin: 80.0, pesoMax: 400.0 },
      { name: "Baleia Jubarte", emoji: "🐋", value: 55000, weight: 0.3, rarity: "Lendário", difficulty: 5, horario: ["dawn","night"], clima: ["fog","storm"], isca: "gold", xp: 6000, pesoMin: 1000, pesoMax: 30000 },
      { name: "Kraken", emoji: "🐙", value: 150000, weight: 0.03, rarity: "Mítico", difficulty: 5, horario: ["dawn"], clima: ["storm"], isca: "cosmic", xp: 15000, pesoMin: 100, pesoMax: 500 }
    ]
  },
  {
    id: 4, name: "🌑 Águas profundas", desc: "Onde vivem criaturas lendárias.",
    need: 30, unlockCost: 500000, mult: 12.0, rarityBoost: 1.3, bonus: 11, challenge: 0.12,
    fishes: [
      { name: "Peixe-lanterna", emoji: "🐟", value: 3000, weight: 100, rarity: "Comum", difficulty: 2, horario: ["night","dawn"], clima: ["fog","night_w"], isca: "shrimp", xp: 400, pesoMin: 0.05, pesoMax: 0.3 },
      { name: "Peixe-víbora", emoji: "🐟", value: 4500, weight: 55, rarity: "Comum", difficulty: 2, horario: ["night","dawn"], clima: ["fog","storm"], isca: "fishbait", xp: 550, pesoMin: 0.1, pesoMax: 0.5 },
      { name: "Enguia elétrica", emoji: "🐍", value: 7000, weight: 38, rarity: "Incomum", difficulty: 3, horario: ["night","dawn"], clima: ["storm","fog"], isca: "fishbait", xp: 850, pesoMin: 1.0, pesoMax: 8.0 },
      { name: "Peixe-martelo", emoji: "🦈", value: 11000, weight: 22, rarity: "Incomum", difficulty: 3, horario: ["dawn","night"], clima: ["night_w"], isca: "gold", xp: 1300, pesoMin: 50.0, pesoMax: 300.0 },
      { name: "Peixe-abissal", emoji: "🐟", value: 18000, weight: 12, rarity: "Raro", difficulty: 4, horario: ["dawn"], clima: ["fog"], isca: "gold", xp: 2200, pesoMin: 5.0, pesoMax: 30.0 },
      { name: "Tubarão-duende", emoji: "🦈", value: 30000, weight: 6, rarity: "Raro", difficulty: 4, horario: ["night"], clima: ["storm","night_w"], isca: "gold", xp: 3600, pesoMin: 80.0, pesoMax: 400.0 },
      { name: "Lula Colossal", emoji: "🦑", value: 55000, weight: 2.5, rarity: "Épico", difficulty: 5, horario: ["dawn","night"], clima: ["storm"], isca: "cosmic", xp: 6500, pesoMin: 100.0, pesoMax: 500.0 },
      { name: "Peixe-Dragão", emoji: "🐉", value: 95000, weight: 1.0, rarity: "Épico", difficulty: 5, horario: ["dawn"], clima: ["fog"], isca: "cosmic", xp: 11000, pesoMin: 50.0, pesoMax: 200.0 },
      { name: "Leviatã Ancião", emoji: "🐉", value: 250000, weight: 0.2, rarity: "Lendário", difficulty: 5, horario: ["dawn","night"], clima: ["storm"], isca: "cosmic", xp: 30000, pesoMin: 500.0, pesoMax: 5000 },
      { name: "Deus Abissal", emoji: "👁️", value: 800000, weight: 0.02, rarity: "Mítico", difficulty: 5, horario: ["dawn"], clima: ["storm","fog"], isca: "cosmic", xp: 90000, pesoMin: 1000, pesoMax: 8000 }
    ]
  }
];
const ALL_FISHES = [];
places.forEach((p, pi) => {
  p.fishes.forEach((f, fi) => {
    ALL_FISHES.push({ ...f, placeIdx: pi, fishIdx: fi, gid: pi + ":" + fi, placeName: p.name });
  });
});
const TOTAL_FISHES = ALL_FISHES.length;

/* ============================================================
   ISCAS
   ============================================================ */
const BAITS = [
  { id: "worm",    name: "Minhoca",       emoji: "🪱", cost: 0,    infinite: true,  desc: "Água doce. Grátis." },
  { id: "shrimp",  name: "Camarão",       emoji: "🦐", cost: 500,  infinite: false, desc: "+50% peixes marinhos." },
  { id: "fishbait",name: "Isca de Peixe", emoji: "🐟", cost: 1500, infinite: false, desc: "+60% predadores." },
  { id: "gold",    name: "Isca Dourada",  emoji: "✨", cost: 6000, infinite: false, desc: "+100% Raros+." },
  { id: "cosmic",  name: "Isca Cósmica",  emoji: "🔮", cost: 25000, infinite: false, desc: "+200% Míticos." }
];

/* ============================================================
   CONSTRUÇÕES
   ============================================================ */
const BUILDINGS = [
  { id: "house",      name: "🏠 Casa",             cost: 25000,     desc: "+5% XP permanente",                     effect: { xp: 0.05 } },
  { id: "fishcenter", name: "🎣 Centro de Pesca",  cost: 150000,    desc: "-5% tempo entre pescarias",            effect: { speed: 0.05 } },
  { id: "aquarium",   name: "🐠 Aquário Grande",   cost: 800000,    desc: "+10% bônus passivo",                   effect: { rare: 0.10 } },
  { id: "harbor",     name: "🚤 Porto",            cost: 5000000,   desc: "-15% custo de barcos",                 effect: { boatDiscount: 0.15 } },
  { id: "market",     name: "🏪 Mercado",          cost: 30000000,  desc: "+15% valor de venda",                  effect: { value: 0.15 } },
  { id: "lab",        name: "🔬 Laboratório",      cost: 200000000, desc: "+20% chance de variantes",             effect: { variant: 0.20 } },
  { id: "museum",     name: "🏛️ Museu",            cost: 1000000000,desc: "+25% XP e +10% moedas",                effect: { xp: 0.25, value: 0.10 } }
];

/* ============================================================
   TRIPULAÇÃO
   ============================================================ */
const CREW = [
  { id: "fisher",    name: "🧑‍🌾 Pescador Experiente", cost: 50000,     desc: "+10% velocidade",            effect: { speed: 0.10 } },
  { id: "biologist", name: "🧑‍🔬 Biólogo",            cost: 400000,    desc: "+15% descoberta",            effect: { discovery: 0.15 } },
  { id: "mechanic",  name: "🧑‍🔧 Mecânico",           cost: 2000000,   desc: "-10% custo de upgrades",     effect: { discount: 0.10 } },
  { id: "legend",    name: "🧙 Pescador Lendário",    cost: 20000000,  desc: "+20% chance de Míticos",     effect: { mythic: 0.20 } },
  { id: "chef",      name: "👨‍🍳 Chef Gourmet",        cost: 200000000, desc: "+25% valor de venda",        effect: { value: 0.25 } },
  { id: "captain",   name: "⚓ Capitão",              cost: 2000000000,desc: "+1 barco extra",             effect: { extraBoat: 1 } }
];

/* ============================================================
   MUSEU
   ============================================================ */
const MUSEUM_ROOMS = [
  { id: "lago",   name: "Sala do Lago",   placeIdx: 0, need: 10, reward: { coins: 500000,     effect: { value: 0.05 } } },
  { id: "rio",    name: "Sala do Rio",    placeIdx: 1, need: 10, reward: { coins: 5000000,    effect: { value: 0.08 } } },
  { id: "praia",  name: "Sala da Praia",  placeIdx: 2, need: 10, reward: { coins: 50000000,   effect: { value: 0.12 } } },
  { id: "mar",    name: "Sala do Mar",    placeIdx: 3, need: 10, reward: { coins: 500000000,  effect: { value: 0.15 } } },
  { id: "abyss",  name: "Sala Abissal",   placeIdx: 4, need: 10, reward: { coins: 5000000000, effect: { value: 0.25 } } }
];

/* ============================================================
   TALENTOS
   ============================================================ */
const TALENTS = [
  { id: "swift_hands",  name: "🙌 Mãos Rápidas",      cost: 1, maxRank: 5, desc: "-3% tempo por rank",        effect: { speed: 0.03 } },
  { id: "lucky_star",   name: "⭐ Estrela da Sorte",  cost: 1, maxRank: 5, desc: "+4% sorte por rank",        effect: { luck: 0.04 } },
  { id: "golden_pocket",name: "💰 Bolso Dourado",     cost: 1, maxRank: 5, desc: "+5% valor por rank",        effect: { value: 0.05 } },
  { id: "scholar",      name: "📚 Estudioso",         cost: 1, maxRank: 5, desc: "+6% XP por rank",           effect: { xp: 0.06 } },
  { id: "rare_hunter",  name: "🎯 Caçador de Raros",  cost: 2, maxRank: 3, desc: "+8% chance Raros+ por rank", effect: { rareChance: 0.08 } },
  { id: "variant_mage", name: "🎨 Mago das Variantes",cost: 2, maxRank: 3, desc: "+15% variantes por rank",   effect: { variant: 0.15 } },
  { id: "master_angler",name: "🎣 Mestre Pescador",   cost: 3, maxRank: 3, desc: "+10% precisão por rank",    effect: { precision: 0.10 } },
  { id: "auto_soul",    name: "⚙️ Alma Automática",   cost: 3, maxRank: 1, desc: "Pesca 2 linhas ao mesmo tempo", effect: { multiCast: 1 } },
  { id: "deep_pockets", name: "💎 Bolsos Profundos",  cost: 3, maxRank: 3, desc: "+15% moedas offline por rank", effect: { offline: 0.15 } },
  { id: "boss_slayer",  name: "🐉 Matador de Bosses", cost: 4, maxRank: 3, desc: "+50% dano em bosses por rank", effect: { bossDmg: 0.50 } },
  { id: "legendary_luck",name:"🍀 Sorte Lendária",    cost: 5, maxRank: 2, desc: "x2 chance de Lendário+ por rank", effect: { legendBonus: 1.0 } },
  { id: "eternal",      name: "♾️ Eterno",            cost: 8, maxRank: 1, desc: "Prestígio não zera talentos",   effect: { keepTalents: 1 } }
];

/* ============================================================
   LOJA DE PÉROLAS
   ============================================================ */
const PEARL_SHOP_UPGRADES = [
  { id: "coinInfusion",  name: "💰 Infusão Dourada",   emoji: "💰", desc: "+5% moedas por nível",         baseCost: 3, costScale: 1.6,  effect: { key: "pearlShopBonus", perLevel: 0.05 } },
  { id: "swiftCurrents", name: "🌊 Correntes Rápidas", emoji: "🌊", desc: "-3% tempo de pesca por nível", baseCost: 3, costScale: 1.6,  effect: { key: "pearlShopSpeed", perLevel: 0.03 } },
  { id: "fortunesFavor", name: "🍀 Favor da Fortuna",  emoji: "🍀", desc: "+4% sorte por nível",         baseCost: 4, costScale: 1.7,  effect: { key: "pearlShopLuck", perLevel: 0.04 } },
  { id: "xpSiphon",      name: "⭐ Sifão de XP",       emoji: "⭐", desc: "+8% XP por nível",             baseCost: 3, costScale: 1.6,  effect: { key: "pearlShopXP", perLevel: 0.08 } },
  { id: "variantMagnet", name: "🎨 Ímã de Variantes",  emoji: "🎨", desc: "+15% chance variantes/nível",  baseCost: 5, costScale: 1.8,  effect: { key: "pearlShopVariant", perLevel: 0.15 } }
];
function getPearlShopCost(upgradeId) {
  const u = PEARL_SHOP_UPGRADES.find(x => x.id === upgradeId);
  if (!u) return 0;
  const lvl = state.pearlShopLevels?.[upgradeId] || 0;
  return Math.ceil(u.baseCost * Math.pow(u.costScale, lvl));
}
function getPearlShopLevel(upgradeId) { return state.pearlShopLevels?.[upgradeId] || 0; }
function recalcPearlShopBonuses() {
  for (const u of PEARL_SHOP_UPGRADES) {
    const lvl = getPearlShopLevel(u.id);
    state[u.effect.key] = lvl * u.effect.perLevel;
  }
}
function buyPearlUpgrade(upgradeId, btnEl) {
  const u = PEARL_SHOP_UPGRADES.find(x => x.id === upgradeId);
  if (!u) return;
  const cost = getPearlShopCost(upgradeId);
  if (state.pearls < cost) { $("status").textContent = `🔮 Pérolas insuficientes (${cost})`; return; }
  state.pearls -= cost;
  if (!state.pearlShopLevels) state.pearlShopLevels = {};
  state.pearlShopLevels[upgradeId] = (state.pearlShopLevels[upgradeId] || 0) + 1;
  recalcPearlShopBonuses();
  popupOnElement(`${u.emoji} Nv.${state.pearlShopLevels[upgradeId]}!`, btnEl, "epic");
  render(); save();
}

/* ============================================================
   TEMPORADAS
   ============================================================ */
const GAME_DAY_MS = 4 * 60 * 60 * 1000; // 1 dia do jogo = 4 horas reais
const SEASON_GAME_DAYS = 39;
const SEASON_DURATION_MS = SEASON_GAME_DAYS * GAME_DAY_MS;
const SEASONS = [
  { id: "spring", name: "Primavera", emoji: "🌸", desc: "+50% chance de Incomum+", effect: { uncommon: 0.5 } },
  { id: "summer", name: "Verão", emoji: "☀️", desc: "+30% valor de venda", effect: { value: 0.30 } },
  { id: "autumn", name: "Outono", emoji: "🍂", desc: "+50% XP", effect: { xp: 0.50 } },
  { id: "winter", name: "Inverno", emoji: "❄️", desc: "+40% chance de Raro+", effect: { rareChance: 0.40 } }
];

/* ============================================================
   DESAFIO DIÁRIO
   ============================================================ */
function getDailyChallenge() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth()+1) * 100 + today.getDate();
  const level = (typeof state !== "undefined" && state && state.level) ? Math.max(1, Number(state.level) || 1) : 1;
  const difficulty = 1 + Math.min(2.5, (level - 1) * 0.12);
  // Recompensas diárias começam pequenas e crescem junto com o nível.
  // No início, nenhum desafio diário pode entregar centenas de milhares de moedas.
  const dailyCoins = Math.max(250, Math.floor(900 * Math.pow(level, 0.78)));
  const challenges = [
    { type: "catch",   goal: Math.max(20, Math.floor(80 * difficulty)),   label: (g) => `Pesque ${fmt(g)} peixes`, reward: { coins: dailyCoins, pearls: 0 } },
    { type: "rare",    goal: Math.max(3, Math.floor(6 * difficulty)),     label: (g) => `Pesque ${fmt(g)} Raros+`, reward: { coins: Math.floor(dailyCoins * 1.15), pearls: 1 } },
    { type: "crit",    goal: Math.max(3, Math.floor(10 * difficulty)),    label: (g) => `Faça ${fmt(g)} críticos`, reward: { coins: Math.floor(dailyCoins * 1.10), pearls: 0 } },
    { type: "earn",    goal: Math.max(2500, Math.floor(10000 * difficulty)), label: (g) => `Ganhe ${fmt(g)} moedas`, reward: { coins: Math.floor(dailyCoins * 1.20), pearls: 1 } },
    { type: "variant", goal: Math.max(1, Math.floor(1 + (level - 1) / 15)), label: (g) => `Capture ${fmt(g)} variante(s)`, reward: { coins: Math.floor(dailyCoins * 1.30), pearls: 1 } },
    { type: "species", goal: Math.max(1, Math.floor(1 + (level - 1) / 20)), label: (g) => `Descubra ${fmt(g)} espécie(s)`, reward: { coins: Math.floor(dailyCoins * 1.25), pearls: 1 } }
  ];
  const idx = seed % challenges.length;
  const c = challenges[idx];
  return { ...c, goal: typeof c.label === "function" ? c.goal : c.goal, label: c.label(c.goal), seed, progress: 0, completed: false };
}

/* ============================================================
   CONQUISTAS
   ============================================================ */
const ACHIEVEMENTS = [
  { id: "first_fish",   name: "Primeiro Peixe",   icon: "🐟", desc: "Pesque 1 peixe",        check: s => s.caught >= 1,     reward: { bonus: 0.02 } },
  { id: "fish_10",      name: "Pescador Novato",  icon: "🎣", desc: "Pesque 10 peixes",      check: s => s.caught >= 10,    reward: { bonus: 0.03 } },
  { id: "fish_100",     name: "Pescador Amador",  icon: "🎣", desc: "Pesque 100 peixes",     check: s => s.caught >= 100,   reward: { bonus: 0.05 } },
  { id: "fish_1000",    name: "Pescador Experiente",icon:"🎣",desc:"Pesque 1.000 peixes",    check: s => s.caught >= 1000,  reward: { bonus: 0.08 } },
  { id: "fish_10000",   name: "Mestre Pescador",  icon: "🏆", desc: "Pesque 10.000 peixes",  check: s => s.caught >= 10000, reward: { bonus: 0.12 } },
  { id: "lvl_5",        name: "Nível 5",          icon: "⭐", desc: "Alcance o nível 5",     check: s => s.level >= 5,      reward: { bonus: 0.02 } },
  { id: "lvl_15",       name: "Nível 15",         icon: "⭐", desc: "Alcance o nível 15",    check: s => s.level >= 15,     reward: { bonus: 0.04 } },
  { id: "lvl_30",       name: "Nível 30",         icon: "🌟", desc: "Alcance o nível 30",    check: s => s.level >= 30,     reward: { bonus: 0.08 } },
  { id: "first_rare",   name: "Primeiro Raro",    icon: "💎", desc: "Pesque um Raro",        check: s => s.discovered.some(g => (ALL_FISHES.find(f=>f.gid===g)||{}).rarity === "Raro"), reward: { bonus: 0.03 } },
  { id: "first_legend", name: "Primeiro Lendário",icon: "🌟", desc: "Pesque um Lendário",    check: s => s.discovered.some(g => (ALL_FISHES.find(f=>f.gid===g)||{}).rarity === "Lendário"), reward: { bonus: 0.05 } },
  { id: "first_mythic", name: "Primeiro Mítico",  icon: "🔮", desc: "Pesque um Mítico",      check: s => s.discovered.some(g => (ALL_FISHES.find(f=>f.gid===g)||{}).rarity === "Mítico"), reward: { bonus: 0.10 } },
  { id: "crit_10",      name: "Pescaria Perfeita",icon: "⚡", desc: "10 críticos",           check: s => s.crits >= 10,     reward: { bonus: 0.02 } },
  { id: "crit_100",     name: "Mão de Ouro",      icon: "⚡", desc: "100 críticos",          check: s => s.crits >= 100,    reward: { bonus: 0.04 } },
  { id: "coins_10k",    name: "Rico!",            icon: "💰", desc: "Junte 10.000",          check: s => s.coins >= 10000,  reward: { bonus: 0.02 } },
  { id: "coins_1m",     name: "Milionário",       icon: "💰", desc: "Junte 1.000.000",       check: s => s.coins >= 1000000,reward: { bonus: 0.05 } },
  { id: "prestige_1",   name: "Renascido",        icon: "✨", desc: "1 prestígio",           check: s => s.prestigeCount >= 1, reward: { bonus: 0.05 } },
  { id: "streak_20",    name: "Sequência Épica",  icon: "🔥", desc: "20 sucessos seguidos",  check: s => (s.bestStreak||0) >= 20, reward: { bonus: 0.03 } },
  { id: "variant_1",    name: "Variante!",        icon: "🎨", desc: "1ª variante",           check: s => Object.keys(s.variantsFound || {}).length >= 1, reward: { bonus: 0.03 } },
  { id: "variant_3",    name: "Colecionador",     icon: "🌈", desc: "3 variantes diferentes",check: s => Object.keys(s.variantsFound || {}).length >= 3, reward: { bonus: 0.06 } },
  { id: "variant_6",    name: "Mestre das Variantes",icon:"💠",desc:"6 variantes",           check: s => Object.keys(s.variantsFound || {}).length >= 6, reward: { bonus: 0.15, pearls: 5 } },
  { id: "boss_1",       name: "Matador de Leviatãs",icon:"🐉",desc:"Derrote o Leviatã",    check: s => s.bossDefeated, reward: { bonus: 0.10 } },
  { id: "crew_full",    name: "Capitão",          icon: "👥", desc: "Contrate 3 tripulantes",check: s => Object.keys(s.crewHired || {}).length >= 3, reward: { bonus: 0.04 } },
  { id: "museum_full",  name: "Curador",          icon: "🏛️", desc: "3 salas do museu",      check: s => Object.keys(s.museumCompleted || {}).length >= 3, reward: { bonus: 0.08 } },
  { id: "island_rich",  name: "Magnata",          icon: "🏝️", desc: "5 prédios construídos", check: s => Object.keys(s.buildingsBuilt || {}).length >= 5, reward: { bonus: 0.10 } },
  { id: "talent_5",     name: "Talentoso",        icon: "🌳", desc: "5 pontos gastos",       check: s => (s.talentsSpent||0) >= 5, reward: { bonus: 0.05 } },
  { id: "season_1",     name: "Sazonal",          icon: "🎉", desc: "1 temporada vista",     check: s => (s.seasonsSeen||0) >= 1, reward: { bonus: 0.03 } },
  { id: "daily_1",      name: "Diário",           icon: "📅", desc: "1 desafio diário",      check: s => (s.dailiesCompleted||0) >= 1, reward: { bonus: 0.03, pearls: 1 } },
  { id: "auto_perm",    name: "Automação Total",  icon: "⚓", desc: "Compre auto permanente", check: s => s.autoPermanent === 1, reward: { bonus: 0.05 } },
  { id: "travel_1",     name: "Viajante",         icon: "🚤", desc: "Visite 2 locais",       check: s => (s.visitedPlaces?.length || 0) >= 2, reward: { bonus: 0.03 } },
  { id: "travel_all",   name: "Explorador",       icon: "🗺️", desc: "Visite todos os 5 locais", check: s => (s.visitedPlaces?.length || 0) >= 5, reward: { bonus: 0.10, pearls: 3 } }
];
function getAchievementBonus() {
  let bonus = 0;
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id] && a.reward.bonus) bonus += a.reward.bonus;
  }
  return bonus;
}

/* ============================================================
   BAÚS
   ============================================================ */
const CHEST_TYPES = {
  wood:      { name: "Baú de Madeira",   emoji: "📦", coinMin: 200,   coinMax: 800,   xpMin: 30,   xpMax: 100,  baitChance: 0.3 },
  silver:    { name: "Baú de Prata",     emoji: "🥈", coinMin: 2000,  coinMax: 8000,  xpMin: 200,  xpMax: 800,  baitChance: 0.5 },
  gold:      { name: "Baú de Ouro",      emoji: "🥇", coinMin: 20000, coinMax: 80000, xpMin: 1500, xpMax: 6000, baitChance: 0.7 },
  legendary: { name: "Baú Lendário",     emoji: "💎", coinMin: 150000,coinMax: 700000,xpMin:10000, xpMax: 40000,baitChance: 1.0 }
};

/* ============================================================
   ESTADO PADRÃO
   ============================================================ */
const defaultState = {
  _v: 14,
  coins: 100, totalEarned: 100, runEarned: 100,
  pearls: 0, caught: 0, xp: 0, level: 1,
  rod: 1, line: 1, hook: 1, reel: 1, boat: 1, detector: 1,
  auto: 0, autoExpiresAt: 0, autoPermanent: 0, autoClaim: 0, autoBuy: 0,
  place: 0,
  visitedPlaces: [0],
  baits: { worm: 999, shrimp: 0, fishbait: 0, gold: 0, cosmic: 0 },
  activeBait: "worm",
  artifacts: { doubleHook: false, midasCup: false, timeHourglass: false, baitMaster: false, steadyHand: false },
  discovered: [], fishStats: {}, variantsFound: {}, variantStats: {},
  log: [], bestGid: null, bestValue: 0, bestWeight: 0,
  tries: 0, escapes: 0, crits: 0, streak: 0, bestStreak: 0,
  quests: null, questsCompleted: 0, longQuestsCompleted: {},
  achievements: {}, pendingChests: [], boost: null,
  aquariumLevel: 1, aquariumFish: [],
  fleet: [],
  weather: "sun", weatherExpires: 0,
  activeEvent: null, nextEventAt: 0,
  bossDefeated: false, prestigeCount: 0,
  buildingsBuilt: {}, crewHired: {}, museumCompleted: {},
  talentPoints: 0, talents: {}, talentsSpent: 0,
  season: null, seasonsSeen: 0, nextSeasonAt: 0,
  dailyChallenge: null, dailiesCompleted: 0,
  lastSave: 0, playTime: 0,
  hallOfFame: [],
  pearlShopLevels: {}, pearlShopBonus: 0, pearlShopSpeed: 0, pearlShopLuck: 0, pearlShopXP: 0, pearlShopVariant: 0
};

/* ============================================================
   BALANCE
   ============================================================ */
const BALANCE = {
  ROD_BASE_TIME: 5.2, ROD_DECAY: 0.93, ROD_MIN_TIME: 0.8,
  ROD_COST_BASE: 100, ROD_COST_SCALE: 1.75,
  LINE_COST_BASE: 250, LINE_COST_SCALE: 1.75,
  HOOK_COST_BASE: 200, HOOK_COST_SCALE: 1.75,
  REEL_COST_BASE: 400, REEL_COST_SCALE: 1.75,
  BOAT_COST_BASE: 800, BOAT_COST_SCALE: 1.75,
  DETECTOR_COST_BASE: 1200, DETECTOR_COST_SCALE: 1.80,
  XP_BASE: 150, XP_EXP: 1.55,
  PEARL_COEF: 0.15, PEARL_FORMULA_DIV: 80000,
  BASE_RUN_EARNED: 100,
  PRESTIGE_LEVEL_REQ: 25,
  AUTO_TEMP1_COST: 500,   AUTO_TEMP1_DURATION: 5 * 60 * 1000,
  AUTO_TEMP2_COST: 5000,  AUTO_TEMP2_DURATION: 30 * 60 * 1000,
  AUTO_PERM_COST: 250000,
  AUTO_CLAIM_COST: 500000, AUTO_BUY_COST: 5000000,
  OFFLINE_MAX_HOURS: 8,
  OFFLINE_TIER1_MIN: 30, OFFLINE_TIER2_MIN: 120,
  OFFLINE_TIER1_RATE: 1.0, OFFLINE_TIER2_RATE: 0.5, OFFLINE_TIER3_RATE: 0.2,
  BASE_SUCCESS: 0.90, DIFFICULTY_PENALTY: 0.05,
  ROD_BONUS_PER_LEVEL: 0.015, HOOK_BONUS_PER_LEVEL: 0.012,
  STEADY_HAND_BONUS: 0.05,
  MIN_SUCCESS: 0.45, MAX_SUCCESS: 0.95,
  ESCAPE_XP_FACTOR: 0.15,
  CRIT_CHANCE: 0.06, CRIT_MULT: 1.7,
  DETECTOR_LUCK_PER_LEVEL: 0.03,
  REEL_VALUE_PER_LEVEL: 0.04,
  LINE_WEIGHT_PER_LEVEL: 0.05,
  TRAVEL_DURATION: 1800
};

/* ============================================================
   CUSTOS
   ============================================================ */
function getUpgradeDiscount() {
  let d = 0;
  if (state.crewHired.mechanic) d += 0.10;
  return 1 - d;
}
function cost(base, lv, scale) { return Math.floor(base * Math.pow(scale, lv - 1) * getUpgradeDiscount()); }
function rodCost()  { return cost(BALANCE.ROD_COST_BASE, state.rod, BALANCE.ROD_COST_SCALE); }
function lineCost() { return cost(BALANCE.LINE_COST_BASE, state.line, BALANCE.LINE_COST_SCALE); }
function hookCost() { return cost(BALANCE.HOOK_COST_BASE, state.hook, BALANCE.HOOK_COST_SCALE); }
function reelCost() { return cost(BALANCE.REEL_COST_BASE, state.reel, BALANCE.REEL_COST_SCALE); }
function boatCost() { return cost(BALANCE.BOAT_COST_BASE, state.boat, BALANCE.BOAT_COST_SCALE); }
function detectorCost() { return cost(BALANCE.DETECTOR_COST_BASE, state.detector, BALANCE.DETECTOR_COST_SCALE); }
function boatFleetCost() {
  let c = 50000 * Math.pow(3, state.fleet.length);
  if (state.buildingsBuilt.harbor) c *= 0.85;
  return Math.floor(c);
}
function xpNeedFor(level) { return Math.floor(BALANCE.XP_BASE * Math.pow(level, BALANCE.XP_EXP)); }
function xpNeed() { return xpNeedFor(state.level); }

function getTalentRank(id) { return state.talents[id] || 0; }
function getTalentEffect(key) {
  let sum = 0;
  for (const t of TALENTS) {
    const rank = getTalentRank(t.id);
    if (rank > 0 && t.effect[key]) sum += t.effect[key] * rank;
  }
  return sum;
}
function sumBuildingEffect(key) {
  let sum = 0;
  for (const b of BUILDINGS) if (state.buildingsBuilt[b.id] && b.effect[key]) sum += b.effect[key];
  return sum;
}
function sumCrewEffect(key) {
  let sum = 0;
  for (const c of CREW) if (state.crewHired[c.id] && c.effect[key]) sum += c.effect[key];
  return sum;
}
function sumMuseumEffect(key) {
  let sum = 0;
  for (const r of MUSEUM_ROOMS) if (state.museumCompleted[r.id] && r.reward.effect[key]) sum += r.reward.effect[key];
  return sum;
}
function getSeasonEffect(key) {
  if (!state.season || state.season.expiresAt < Date.now()) return 0;
  const s = SEASONS.find(x => x.id === state.season.id);
  return s && s.effect[key] ? s.effect[key] : 0;
}

/* ============================================================
   MULTIPLICADORES
   ============================================================ */
function getLuck() {
  let luck = 1 + (state.detector - 1) * BALANCE.DETECTOR_LUCK_PER_LEVEL;
  if (state.boost && state.boost.type === "luck" && state.boost.expiresAt > Date.now()) luck *= state.boost.mult;
  if (state.activeBait === "cosmic") luck += 0.3;
  luck += getTalentEffect("luck");
  luck += (state.pearlShopLuck || 0);
  return luck;
}
function getTimeMult() {
  let m = 1;
  if (state.boost && state.boost.type === "speed" && state.boost.expiresAt > Date.now()) m *= state.boost.mult;
  m *= (1 + Math.sqrt(state.prestigeCount) * 0.03);
  m *= (1 + Math.sqrt(sumBuildingEffect("speed")));
  m *= (1 + Math.sqrt(sumCrewEffect("speed")));
  m *= (1 + getTalentEffect("speed"));
  m *= (1 + (state.pearlShopSpeed || 0));
  return m;
}
function getXpMult() {
  let m = 1;
  if (state.boost && state.boost.type === "xp" && state.boost.expiresAt > Date.now()) m *= state.boost.mult;
  m *= (1 + Math.sqrt(state.prestigeCount) * 0.03);
  m *= (1 + Math.sqrt(sumBuildingEffect("xp")));
  m *= (1 + state.aquariumFish.length * 0.01);
  m *= (1 + getTalentEffect("xp"));
  m *= (1 + getSeasonEffect("xp"));
  m *= (1 + (state.pearlShopXP || 0));
  return m;
}
function getCoinMult() {
  let m = 1;
  if (state.boost && state.boost.type === "coins" && state.boost.expiresAt > Date.now()) m *= state.boost.mult;
  m *= (1 + Math.sqrt(state.prestigeCount) * 0.05);
  m *= (1 + Math.sqrt(sumBuildingEffect("value")));
  m *= (1 + Math.sqrt(sumCrewEffect("value")));
  m *= (1 + Math.sqrt(sumMuseumEffect("value")));
  m *= (1 + getTalentEffect("value"));
  m *= (1 + getSeasonEffect("value"));
  m *= (1 + getAchievementBonus());
  m *= (1 + (state.pearlShopBonus || 0));
  return m;
}
function getVariantBonus() {
  return sumBuildingEffect("variant") + getTalentEffect("variant") + getSeasonEffect("variant") + (state.pearlShopVariant || 0);
}
function getRareChanceBonus() {
  return getTalentEffect("rareChance") + getSeasonEffect("rareChance");
}
function getLegendBonus() {
  return getTalentEffect("legendBonus") + getSeasonEffect("legendBonus");
}
function time() {
  const rodFactor = Math.pow(BALANCE.ROD_DECAY, state.rod - 1);
  const placeBonus = places[state.place].bonus * 0.04;
  let t = (BALANCE.ROD_BASE_TIME * rodFactor - placeBonus) / getTimeMult();
  if (state.artifacts.timeHourglass) t *= 0.85;
  return Math.max(BALANCE.ROD_MIN_TIME, t);
}
function pearlBonus() { return 1 + Math.sqrt(state.pearls || 0) * 0.15; }
function boatMult() {
  const n = state.boat - 1;
  return 1 + (n * 0.20) / (1 + n * 0.05);
}
function reelMult() { return 1 + (state.reel - 1) * BALANCE.REEL_VALUE_PER_LEVEL; }
function getPendingPearls() {
  const earnedInRun = Math.max(0, (state.runEarned || 0) - BALANCE.BASE_RUN_EARNED);
  return Math.floor(Math.sqrt(earnedInRun / BALANCE.PEARL_FORMULA_DIV));
}

/* ============================================================
   PESO DOS PEIXES
   ============================================================ */
function computeFishWeight(fish) {
  let w = fish.weight;
  if (state.activeBait === fish.isca) w *= 1.6;
  if (fish.clima.includes(state.weather)) w *= 1.25;
  const period = getCurrentPeriod();
  if (fish.horario.includes(period)) w *= 1.20;
  const rarityInfo = RARITY[fish.rarity];
  w *= 1 + (getLuck() - 1) * rarityInfo.luckWeight;
  if (state.crewHired.biologist && !state.discovered.includes(fish.gid)) w *= 1 + sumCrewEffect("discovery");
  if (state.crewHired.legend && (fish.rarity === "Lendário" || fish.rarity === "Mítico")) w *= 1 + sumCrewEffect("mythic");
  if (fish.rarity !== "Comum" && fish.rarity !== "Incomum") w *= 1 + getRareChanceBonus();
  if (fish.rarity === "Lendário" || fish.rarity === "Mítico") w *= 1 + getLegendBonus();
  return w;
}
function pickLocalFish() {
  const fishes = places[state.place].fishes;
  const weights = fishes.map(f => computeFishWeight(f));
  const total = weights.reduce((a,b)=>a+b,0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
}

/* ============================================================
   MISSÕES
   ============================================================ */
function createQuest(type, tier) {
  const tiers = {
    catch:   { baseGoal: 10,   baseReward: 80,  label: (g) => `Pesque ${fmt(g)} peixes` },
    earn:    { baseGoal: 1000, baseReward: 90,  label: (g) => `Ganhe ${fmt(g)} moedas` },
    rare:    { baseGoal: 2,    baseReward: 120, label: (g) => `Pesque ${fmt(g)} Raros+` },
    crit:    { baseGoal: 1,    baseReward: 140, label: (g) => `Faça ${fmt(g)} críticos` },
    xp:      { baseGoal: 500,  baseReward: 150, label: (g) => `Ganhe ${fmt(g)} XP` },
    species: { baseGoal: 3,    baseReward: 180, label: (g) => `Descubra ${fmt(g)} espécies` }
  };
  const t = tiers[type] || tiers.catch;
  const safeTier = Math.max(0, Math.floor(Number(tier) || 0));
  // A dificuldade sobe de forma gradual. O prêmio acompanha a dificuldade,
  // mas não explode no começo do jogo.
  const difficultyMult = Math.pow(1.22, safeTier);
  const currentLevel = (typeof state !== "undefined" && state && state.level) ? Math.max(1, Number(state.level) || 1) : 1;
  const levelMult = 1 + Math.min(1.5, Math.max(0, currentLevel - 1) * 0.08);
  const goal = Math.max(1, Math.floor(t.baseGoal * difficultyMult));
  const reward = Math.max(50, Math.floor(t.baseReward * difficultyMult * levelMult));
  let visualTier = 1;
  if (safeTier >= 2 && safeTier < 5) visualTier = 2;
  else if (safeTier >= 5) visualTier = 3;
  return { type, goal, reward, tier: safeTier, visualTier, progress: 0, label: t.label(goal) };
}
function questRewardFor(type, tier) {
  const bases = { catch: 80, earn: 90, rare: 120, crit: 140, xp: 150, species: 180 };
  const safeTier = Math.max(0, Math.floor(Number(tier) || 0));
  const currentLevel = (typeof state !== "undefined" && state && state.level) ? Math.max(1, Number(state.level) || 1) : 1;
  const levelMult = 1 + Math.min(1.5, Math.max(0, currentLevel - 1) * 0.08);
  return Math.max(50, Math.floor((bases[type] || 80) * Math.pow(1.22, safeTier) * levelMult));
}
function initQuestsIfNeeded(s) {
  if (!s.quests || !Array.isArray(s.quests) || s.quests.length !== 3) {
    s.quests = [createQuest("catch", 0), createQuest("earn", 0), createQuest("rare", 0)];
  }
  return s;
}
function progressQuests(type, amount) {
  for (const q of state.quests) if (q.type === type) q.progress = Math.min(q.goal, q.progress + amount);
}
function readyQuestIndexes() {
  const a = [];
  for (let i = 0; i < state.quests.length; i++) if (state.quests[i].progress >= state.quests[i].goal) a.push(i);
  return a;
}
function claimQuest(idx, btnEl) {
  const q = state.quests[idx];
  if (!q || q.progress < q.goal) return;
  state.coins += q.reward;
  state.totalEarned += q.reward;
  state.runEarned += q.reward;
  state.questsCompleted++;
  $("status").textContent = `🎁 Missão! +${fmt(q.reward)} 🪙`;
  popupOnElement(`🎁 +${fmt(q.reward)} 🪙`, btnEl, "quest");
  state.quests[idx] = createQuest(q.type, q.tier + 1);
  render(); save();
}

/* ============================================================
   MISSÕES DE LONGO PRAZO
   ============================================================ */
const LONG_QUESTS = [
  { id: "mq_lago",    name: "Mestre do Lago",        desc: "Descubra todos os peixes do Lago",  check: s => places[0].fishes.every((_,fi)=>s.discovered.includes("0:"+fi)), reward: { coins: 1000000, pearls: 1 } },
  { id: "mq_rio",     name: "Mestre do Rio",         desc: "Descubra todos os peixes do Rio",   check: s => places[1].fishes.every((_,fi)=>s.discovered.includes("1:"+fi)), reward: { coins: 5000000, pearls: 1 } },
  { id: "mq_praia",   name: "Mestre da Praia",       desc: "Descubra todos os peixes da Praia", check: s => places[2].fishes.every((_,fi)=>s.discovered.includes("2:"+fi)), reward: { coins: 50000000, pearls: 2 } },
  { id: "mq_mar",     name: "Mestre do Mar",         desc: "Descubra todos os peixes do Mar",   check: s => places[3].fishes.every((_,fi)=>s.discovered.includes("3:"+fi)), reward: { coins: 500000000, pearls: 3 } },
  { id: "mq_abyss",   name: "Mestre Abissal",        desc: "Descubra todos das Profundezas",    check: s => places[4].fishes.every((_,fi)=>s.discovered.includes("4:"+fi)), reward: { coins: 5000000000, pearls: 5 } },
  { id: "mq_all",     name: "Colecionador",          desc: "Descubra todas as 50 espécies",     check: s => s.discovered.length >= TOTAL_FISHES, reward: { coins: 50000000000, pearls: 20 } },
  { id: "mq_rich",    name: "Bilionário",            desc: "Junte 1 bilhão de moedas",          check: s => s.coins >= 1e9, reward: { pearls: 25 } },
  { id: "mq_variant", name: "Caçador de Variantes",  desc: "Capture 5 variantes diferentes",    check: s => Object.keys(s.variantsFound || {}).length >= 5, reward: { coins: 1000000000, pearls: 5 } }
];
function checkLongQuests() {
  for (const lq of LONG_QUESTS) {
    if (state.longQuestsCompleted[lq.id]) continue;
    if (lq.check(state)) {
      state.longQuestsCompleted[lq.id] = true;
      if (lq.reward.coins) { state.coins += lq.reward.coins; state.totalEarned += lq.reward.coins; }
      if (lq.reward.pearls) state.pearls += lq.reward.pearls;
      popupOnElement(`🎯 ${lq.name}!`, $("fishBtn"), "quest", 0);
    }
  }
}

/* ============================================================
   CONQUISTAS - VERIFICAÇÃO
   ============================================================ */
function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!state.achievements[a.id] && a.check(state)) {
      state.achievements[a.id] = true;
      if (a.reward.pearls) state.pearls += a.reward.pearls;
      $("status").textContent = `🏆 ${a.name}!`;
      popupOnElement(`🏆 ${a.name}`, $("fishBtn"), "ach", 0);
      if (a.reward.bonus) setTimeout(() => popupOnElement(`+${Math.round(a.reward.bonus * 100)}% bônus`, $("fishBtn"), "gold", 200), 200);
      if (a.reward.pearls) setTimeout(() => popupOnElement(`+${a.reward.pearls} 🔮`, $("fishBtn"), "epic", 400), 400);
    }
  }
}

/* ============================================================
   BAÚS
   ============================================================ */
function grantChest(type) {
  state.pendingChests.push({ type, at: Date.now() });
  popupOnElement(`📦 ${CHEST_TYPES[type].name}`, $("fishBtn"), "quest", 0);
}
function openChest(idx, btnEl) {
  const chest = state.pendingChests[idx];
  if (!chest) return;
  const t = CHEST_TYPES[chest.type];
  const coin = t.coinMin + Math.floor(Math.random() * (t.coinMax - t.coinMin + 1));
  const xp = t.xpMin + Math.floor(Math.random() * (t.xpMax - t.xpMin + 1));
  state.coins += coin; state.totalEarned += coin; state.runEarned += coin;
  state.xp += xp;
  let baitGain = null;
  if (Math.random() < t.baitChance) {
    const possible = BAITS.filter(b => !b.infinite && b.cost <= t.coinMax * 3);
    if (possible.length) {
      const bait = possible[Math.floor(Math.random() * possible.length)];
      const qty = 1 + Math.floor(Math.random() * 3);
      state.baits[bait.id] = (state.baits[bait.id] || 0) + qty;
      baitGain = `+${qty} ${bait.emoji} ${bait.name}`;
    }
  }
  let boostMsg = null;
  if (Math.random() < 0.15) {
    const types = ["coins", "xp", "speed", "luck"];
    const bt = types[Math.floor(Math.random() * types.length)];
    state.boost = { type: bt, mult: 2, expiresAt: Date.now() + 5 * 60 * 1000 };
    boostMsg = `⚡ Boost ${bt} 2x por 5min!`;
  }
  state.pendingChests.splice(idx, 1);
  let html = `<h2>${t.emoji} ${t.name}</h2>
    <div class="modal-stat"><span>💰 Moedas</span><b>+${fmt(coin)}</b></div>
    <div class="modal-stat"><span>⭐ XP</span><b>+${fmt(xp)}</b></div>`;
  if (baitGain) html += `<div class="modal-stat"><span>🪱 Isca</span><b>${baitGain}</b></div>`;
  if (boostMsg) html += `<div class="modal-stat"><span>⚡ Boost</span><b>${boostMsg}</b></div>`;
  html += `<button onclick="hideModal()">Coletar!</button>`;
  showModal(html);
  addXPRaw(xp);
  checkAchievements();
  render(); save();
}

/* ============================================================
   EVENTOS
   ============================================================ */
function triggerRandomEvent() {
  const events = ["school", "floatingChest", "leviathan"];
  const weights = [0.6, 0.3, 0.1];
  let r = Math.random(), chosen = "school";
  for (let i = 0; i < events.length; i++) {
    if (r < weights[i]) { chosen = events[i]; break; }
    r -= weights[i];
  }
  if (chosen === "school") {
    state.activeEvent = { type: "school", expiresAt: Date.now() + 20 * 1000 };
    sceneSetStatus("🐟 CARDUME! +300% raros!");
  } else if (chosen === "floatingChest") {
    grantChest("wood");
    state.activeEvent = { type: "floatingChest", expiresAt: Date.now() + 3 * 1000 };
    sceneSetStatus("🎁 BAÚ FLUTUANTE!");
  } else if (chosen === "leviathan") {
    if (state.rod >= 15 && !state.bossDefeated) {
      state.activeEvent = { type: "leviathan", expiresAt: Date.now() + 60 * 1000, bossHp: 100 };
      sceneSetStatus("🐉 LEVIATÃ! Toque para atacar");
      $("fishBtn").textContent = "⚔️ ATACAR LEVIATÃ";
    } else {
      state.activeEvent = { type: "school", expiresAt: Date.now() + 20 * 1000 };
      sceneSetStatus("🐟 CARDUME!");
    }
  }
  state.nextEventAt = Date.now() + 90 * 1000 + Math.random() * 120 * 1000;
}
function attackBoss() {
  if (!state.activeEvent || state.activeEvent.type !== "leviathan") return;
  const dmgMult = 1 + getTalentEffect("bossDmg");
  const dmg = Math.floor((state.rod * 1.5 + state.hook * 0.8 + state.level * 0.5) * dmgMult * (0.8 + Math.random() * 0.4));
  state.activeEvent.bossHp -= dmg;
  popupOnElement(`-${dmg} HP`, $("fishBtn"), "boss", 0);
  if (state.activeEvent.bossHp <= 0) {
    state.bossDefeated = true;
    state.activeEvent = null;
    state.coins += 5000000;
    state.totalEarned += 5000000;
    state.pearls += 10;
    state.baits.cosmic = (state.baits.cosmic || 0) + 5;
    $("fishBtn").textContent = "🎣 JOGAR A LINHA";
    showModal(`<h2>🐉 LEVIATÃ DERROTADO!</h2>
      <div class="modal-stat"><span>💰 Moedas</span><b>+5M</b></div>
      <div class="modal-stat"><span>🔮 Pérolas</span><b>+10</b></div>
      <div class="modal-stat"><span>🔮 Isca Cósmica</span><b>+5</b></div>
      <button onclick="hideModal()">Incrível!</button>`);
    sceneSetStatus("🏆 DERROTADO!");
    checkAchievements();
  }
  render(); save();
}

/* ============================================================
   TEMPORADAS
   ============================================================ */
function triggerSeason() {
  const currentIndex = state.season ? SEASONS.findIndex(x => x.id === state.season.id) : -1;
  const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % SEASONS.length : 0;
  const s = SEASONS[nextIndex];
  const now = Date.now();
  state.season = { id: s.id, expiresAt: now + SEASON_DURATION_MS, startedAt: now };
  state.seasonsSeen = (state.seasonsSeen || 0) + 1;
  state.nextSeasonAt = state.season.expiresAt;
  sceneSetStatus(`${s.emoji} ${s.name}!`);
  setTimeout(() => { if (!fishing) sceneSetStatus("Pronto para pescar"); }, 4000);
  checkAchievements();
  render(); save();
}

/* ============================================================
   DESAFIO DIÁRIO
   ============================================================ */
function refreshDailyIfNeeded() {
  const newChal = getDailyChallenge();
  if (!state.dailyChallenge || state.dailyChallenge.seed !== newChal.seed) {
    state.dailyChallenge = newChal;
  } else if (!state.dailyChallenge.completed) {
    // Corrige desafios antigos ainda não concluídos que possuíam recompensas
    // desproporcionais ao nível atual. Mantém o progresso já realizado.
    const progress = Math.min(newChal.goal, Math.max(0, Number(state.dailyChallenge.progress) || 0));
    state.dailyChallenge.goal = newChal.goal;
    state.dailyChallenge.label = newChal.label;
    state.dailyChallenge.reward = newChal.reward;
    state.dailyChallenge.progress = progress;
  }
}
function progressDaily(type, amount) {
  if (!state.dailyChallenge || state.dailyChallenge.completed) return;
  if (state.dailyChallenge.type === type) {
    state.dailyChallenge.progress += amount;
    if (state.dailyChallenge.progress >= state.dailyChallenge.goal) {
      state.dailyChallenge.completed = true;
      state.dailiesCompleted = (state.dailiesCompleted || 0) + 1;
      if (state.dailyChallenge.reward.coins) {
        state.coins += state.dailyChallenge.reward.coins;
        state.totalEarned += state.dailyChallenge.reward.coins;
      }
      if (state.dailyChallenge.reward.pearls) state.pearls += state.dailyChallenge.reward.pearls;
      showModal(`<h2>📅 DESAFIO DIÁRIO COMPLETO!</h2>
        <p>${state.dailyChallenge.label}</p>
        <button onclick="hideModal()">Excelente!</button>`);
      checkAchievements();
    }
  }
}

/* ============================================================
   XP
   ============================================================ */
function addXPRaw(n) {
  state.xp += Math.floor(n * getXpMult());
  let leveledUp = false, oldLevel = state.level;
  while (state.xp >= xpNeed()) { state.xp -= xpNeed(); state.level++; leveledUp = true; }
  if (leveledUp) {
    $("status").textContent = `⭐ Nível ${state.level}!`;
    popupOnElement(`⭐ NÍVEL ${state.level}`, $("fishBtn"), "level", 0);
    const newlyUnlocked = places.filter(p => p.need > oldLevel && p.need <= state.level);
    if (newlyUnlocked.length > 0) {
      setTimeout(() => { $("status").textContent = `🎉 Novo local: ${newlyUnlocked.map(p=>p.name).join(", ")}!`; }, 800);
    }
  }
}
function addXP(n) { addXPRaw(n); }

/* ============================================================
   SVG REFS
   ============================================================ */
const linePath    = document.getElementById("linePath");
const floatInner  = document.getElementById("floatInner");
const rippleGrp   = document.getElementById("ripple");
const splashGrp   = document.getElementById("splash");
const jumpingFish = document.getElementById("jumpingFish");
const rodGroup    = document.getElementById("rodGroup");
const anglerArm   = document.getElementById("anglerArm");
const anglerInner = document.getElementById("anglerInner");
const weatherLayer = document.getElementById("weatherLayer");

const LINE_REST = "M 272 48 Q 288 120 250 180";
const LINE_REEL = "M 272 48 Q 275 110 265 90";

function sceneSetStatus(text, variant) {
  const el = $("sceneStatus"); if (!el) return;
  el.textContent = text;
  el.classList.remove("escape", "crit");
  if (variant) el.classList.add(variant);
}
function sceneReset() {
  rodGroup.classList.remove("cast", "bite", "snap");
  anglerArm.classList.remove("pull", "crank", "happy");
  anglerInner.classList.remove("happy", "sad");
  floatInner.classList.remove("bite", "escape");
  jumpingFish.classList.remove("go", "escape");
  rippleGrp.setAttribute("opacity", "0");
  splashGrp.setAttribute("opacity", "0");
  linePath.setAttribute("d", LINE_REST);
}
function sceneCast() { sceneReset(); sceneSetStatus("🎣 Lançando..."); rodGroup.classList.add("cast"); }
function sceneWait() { sceneSetStatus("👀 Observando a bóia..."); }
function sceneBite() {
  sceneSetStatus("🐟 MORDIDA!");
  rodGroup.classList.add("bite"); anglerArm.classList.add("pull"); floatInner.classList.add("bite");
  rippleGrp.setAttribute("opacity", "1");
  rippleGrp.innerHTML = '<circle cx="0" cy="0" r="5" fill="none" stroke="#fff" stroke-width="1.5"/>';
  setTimeout(() => rippleGrp.setAttribute("opacity", "0"), 1000);
}
function sceneCatch(isCrit, isVariant) {
  let status = isCrit ? "⚡ PERFEITO!" : "✅ Fisgado!";
  if (isVariant) status = "🎨 VARIANTE!";
  sceneSetStatus(status, isCrit || isVariant ? "crit" : null);
  rodGroup.classList.remove("bite", "cast");
  anglerArm.classList.remove("pull"); anglerArm.classList.add("crank");
  anglerInner.classList.add("happy");
  splashGrp.setAttribute("opacity", "1");
  const splashCircle = splashGrp.querySelector("circle");
  splashCircle.setAttribute("r", "20");
  let r = 20;
  const anim = setInterval(() => {
    r += 6;
    splashCircle.setAttribute("r", r);
    splashCircle.setAttribute("opacity", (1 - (r-20)/80).toFixed(2));
    if (r >= 100) { clearInterval(anim); splashGrp.setAttribute("opacity", "0"); }
  }, 30);
  jumpingFish.classList.remove("go", "escape");
  const fishBodyPath = jumpingFish.querySelector("ellipse");
  const fishTail = jumpingFish.querySelector("polygon");
  if (isCrit || isVariant) {
    fishBodyPath.setAttribute("fill", "url(#fishBodyCrit)");
    fishTail.setAttribute("fill", "url(#fishBodyCrit)");
  } else {
    fishBodyPath.setAttribute("fill", "url(#fishBody)");
    fishTail.setAttribute("fill", "url(#fishBody)");
  }
  void jumpingFish.offsetWidth;
  jumpingFish.classList.add("go");
  linePath.setAttribute("d", LINE_REEL);
  setTimeout(() => { anglerArm.classList.remove("crank"); anglerInner.classList.remove("happy"); }, 1100);
}
function sceneEscape() {
  sceneSetStatus("💨 ESCAPOU!", "escape");
  rodGroup.classList.remove("cast", "bite"); rodGroup.classList.add("snap");
  anglerArm.classList.remove("pull"); anglerInner.classList.add("sad");
  floatInner.classList.add("escape");
  jumpingFish.classList.remove("go"); void jumpingFish.offsetWidth; jumpingFish.classList.add("escape");
  splashGrp.setAttribute("opacity", "1");
  const sc = splashGrp.querySelector("circle"); sc.setAttribute("r", "10"); sc.setAttribute("opacity", "0.7");
  setTimeout(() => splashGrp.setAttribute("opacity", "0"), 500);
  rippleGrp.setAttribute("opacity", "1");
  rippleGrp.innerHTML = '<circle cx="0" cy="0" r="5" fill="none" stroke="#ff6b6b" stroke-width="1.5"/>';
  setTimeout(() => rippleGrp.setAttribute("opacity", "0"), 800);
  setTimeout(() => { rodGroup.classList.remove("snap"); anglerInner.classList.remove("sad"); floatInner.classList.remove("escape"); }, 1000);
}
function sceneIdle() { sceneReset(); sceneSetStatus("Pronto para pescar"); }

/* ============================================================
   CLIMA DINÂMICO
   ============================================================ */
function getSunPosition() {
  const hourFloat = getGameHour();
  let x, y;
  if (hourFloat < 6) { x = 60; y = 100; }
  else if (hourFloat < 12) { const p = (hourFloat - 6) / 6; x = 100 + p * 150; y = 90 - p * 40; }
  else if (hourFloat < 18) { const p = (hourFloat - 12) / 6; x = 250 + p * 100; y = 50 + p * 40; }
  else { x = 350; y = 90; }
  return { x, y };
}
function applyWeatherVisual() {
  const scene = $("scene"); if (!scene) return;
  scene.className = "scene sky-" + WEATHERS[state.weather].sky;
  weatherLayer.innerHTML = "";
  const w = state.weather;
  const sunGroup = document.getElementById("sunGroup");
  const moonGroup = document.getElementById("moonGroup");
  const cloud1 = document.getElementById("cloud1");
  const cloud2 = document.getElementById("cloud2");
  const darkClouds = document.getElementById("darkClouds");
  if (!sunGroup) return;

  sunGroup.style.opacity = "0";
  moonGroup.setAttribute("opacity", "0");
  cloud1.setAttribute("opacity", "0");
  cloud2.setAttribute("opacity", "0");
  darkClouds.setAttribute("opacity", "0");

  const sunPos = getSunPosition();
  const sunCircle = sunGroup.querySelector("circle");
  const sunCore = sunGroup.querySelectorAll("circle")[1];
  sunCircle.setAttribute("cx", sunPos.x); sunCircle.setAttribute("cy", sunPos.y);
  sunCore.setAttribute("cx", sunPos.x); sunCore.setAttribute("cy", sunPos.y);

  if (w === "sun") {
    sunGroup.style.opacity = "1";
    cloud1.setAttribute("opacity", "0.85"); cloud2.setAttribute("opacity", "0.55");
  } else if (w === "rain") {
    darkClouds.setAttribute("opacity", "0.95");
  } else if (w === "storm") {
    darkClouds.setAttribute("opacity", "1");
  } else if (w === "fog") {
    sunGroup.style.opacity = "0.25";
    cloud1.setAttribute("opacity", "0.15"); cloud2.setAttribute("opacity", "0.1");
  } else if (w === "snow") {
    sunGroup.style.opacity = "0.4";
    cloud1.setAttribute("opacity", "0.5"); cloud2.setAttribute("opacity", "0.3");
  } else if (w === "night_w") {
    moonGroup.setAttribute("opacity", "1");
    cloud1.setAttribute("opacity", "0.15"); cloud2.setAttribute("opacity", "0.1");
  }

  if (w === "rain") {
    for (let i = 0; i < 45; i++) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "rain-drop");
      const sx = Math.random() * 420 - 10;
      const sy = -30 - Math.random() * 60;
      const len = 8 + Math.random() * 10;
      const tilt = 3 + Math.random() * 2;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", sx); line.setAttribute("y1", sy);
      line.setAttribute("x2", sx + tilt); line.setAttribute("y2", sy + len);
      line.setAttribute("stroke", "rgba(200, 230, 255, 0.75)");
      line.setAttribute("stroke-width", "1.1"); line.setAttribute("stroke-linecap", "round");
      g.appendChild(line);
      g.style.animationDuration = (0.45 + Math.random() * 0.35) + "s";
      g.style.animationDelay = (-Math.random() * 1) + "s";
      weatherLayer.appendChild(g);
    }
  } else if (w === "storm") {
    for (let i = 0; i < 75; i++) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "rain-drop");
      const sx = Math.random() * 420 - 10;
      const sy = -30 - Math.random() * 60;
      const len = 10 + Math.random() * 12;
      const tilt = 4 + Math.random() * 3;
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", sx); line.setAttribute("y1", sy);
      line.setAttribute("x2", sx + tilt); line.setAttribute("y2", sy + len);
      line.setAttribute("stroke", "rgba(180, 210, 240, 0.85)");
      line.setAttribute("stroke-width", "1.3"); line.setAttribute("stroke-linecap", "round");
      g.appendChild(line);
      g.style.animationDuration = (0.3 + Math.random() * 0.25) + "s";
      g.style.animationDelay = (-Math.random() * 0.6) + "s";
      weatherLayer.appendChild(g);
    }
    const bolt = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
    bolt.setAttribute("points", "160,-10 155,20 165,22 158,55 170,58 160,90");
    bolt.setAttribute("fill", "none"); bolt.setAttribute("stroke", "#fffde0");
    bolt.setAttribute("stroke-width", "3"); bolt.setAttribute("stroke-linecap", "round");
    bolt.setAttribute("stroke-linejoin", "round"); bolt.setAttribute("class", "lightning-bolt");
    weatherLayer.appendChild(bolt);
    const flash = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    flash.setAttribute("x", "0"); flash.setAttribute("y", "0");
    flash.setAttribute("width", "400"); flash.setAttribute("height", "260");
    flash.setAttribute("fill", "#ffffff"); flash.setAttribute("opacity", "0");
    flash.setAttribute("class", "lightning-flash");
    weatherLayer.appendChild(flash);
  } else if (w === "snow") {
    for (let i = 0; i < 30; i++) {
      const f = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      f.setAttribute("cx", Math.random() * 400);
      f.setAttribute("cy", -10 - Math.random() * 20);
      f.setAttribute("r", 1.2 + Math.random() * 2);
      f.setAttribute("fill", "#ffffff"); f.setAttribute("opacity", 0.5 + Math.random() * 0.5);
      f.setAttribute("class", "snow-flake");
      f.style.animationDuration = (3 + Math.random() * 3) + "s";
      f.style.animationDelay = (-Math.random() * 5) + "s";
      weatherLayer.appendChild(f);
    }
  } else if (w === "night_w") {
    for (let i = 0; i < 40; i++) {
      const s = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      s.setAttribute("cx", Math.random() * 400); s.setAttribute("cy", Math.random() * 110);
      s.setAttribute("r", Math.random() * 1.3); s.setAttribute("fill", "#ffffff");
      s.setAttribute("opacity", 0.3 + Math.random() * 0.7);
      s.setAttribute("class", "star-twinkle");
      s.style.animationDelay = (-Math.random() * 2) + "s";
      weatherLayer.appendChild(s);
    }
  } else if (w === "fog") {
    for (let i = 0; i < 8; i++) {
      const f = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
      f.setAttribute("cx", Math.random() * 400); f.setAttribute("cy", 30 + Math.random() * 120);
      f.setAttribute("rx", 90 + Math.random() * 60); f.setAttribute("ry", 14 + Math.random() * 12);
      f.setAttribute("fill", "#ffffff"); f.setAttribute("opacity", 0.12 + Math.random() * 0.1);
      f.setAttribute("class", "fog-drift");
      f.style.animationDelay = (-Math.random() * 8) + "s";
      weatherLayer.appendChild(f);
    }
  }
}

/* ============================================================
   PESCA
   ============================================================ */
let fishing = false, frame = 0, autoTimer = null;
let sessionOfflineGains = 0;
let sessionOfflineReport = null;

function successChance(fishDifficulty) {
  let c = BALANCE.BASE_SUCCESS;
  c -= fishDifficulty * BALANCE.DIFFICULTY_PENALTY;
  c += (state.rod - 1) * BALANCE.ROD_BONUS_PER_LEVEL;
  c += (state.hook - 1) * BALANCE.HOOK_BONUS_PER_LEVEL;
  c -= places[state.place].challenge;
  if (state.artifacts.steadyHand) c += BALANCE.STEADY_HAND_BONUS;
  c += getTalentEffect("precision");
  return Math.max(BALANCE.MIN_SUCCESS, Math.min(BALANCE.MAX_SUCCESS, c));
}
function averageSuccessChance() {
  const fishes = places[state.place].fishes;
  const weights = fishes.map(f => computeFishWeight(f));
  const total = weights.reduce((a,b)=>a+b,0);
  let wd = 0;
  for (let i = 0; i < fishes.length; i++) wd += (weights[i] / total) * fishes[i].difficulty;
  return successChance(wd);
}
function consumeActiveBait() {
  const bait = BAITS.find(b => b.id === state.activeBait);
  if (!bait || bait.infinite) return;
  state.baits[state.activeBait] = (state.baits[state.activeBait] || 0) - 1;
  if (state.baits[state.activeBait] <= 0) { state.baits[state.activeBait] = 0; state.activeBait = "worm"; }
}
function rollWeight(fish) {
  const span = fish.pesoMax - fish.pesoMin;
  return fish.pesoMin + span * Math.pow(Math.random(), 1.6);
}
function resolveCatch() {
  const fishIdx = pickLocalFish();
  const f = places[state.place].fishes[fishIdx];
  const gid = state.place + ":" + fishIdx;
  const fishBtn = $("fishBtn");

  state.tries++;
  const chance = successChance(f.difficulty);
  const roll = Math.random();

  if (roll > chance) {
    state.escapes++;
    state.streak = 0;
    const fakeValue = Math.floor(f.value * places[state.place].mult * boatMult() * reelMult() * pearlBonus() * getCoinMult());
    addXP(Math.max(2, Math.floor(fakeValue * 0.25 * BALANCE.ESCAPE_XP_FACTOR)));
    state.log.unshift(`💨 ${f.emoji} ${f.name} escapou...`);
    state.log = state.log.slice(0, 8);
    sceneEscape();
    popupOnElement(`💨 ESCAPOU!`, fishBtn, "escape", 0);
    $("status").textContent = `💨 ${f.name} escapou!`;
    render(); save();
    return;
  }

  const isCrit = Math.random() < BALANCE.CRIT_CHANCE;
  const isDouble = state.artifacts.doubleHook && Math.random() < 0.25;
  const fishCount = isDouble ? 2 : 1;
  const weight = rollWeight(f);
  const midas = state.artifacts.midasCup ? 1.5 : 1.0;
  const variantId = rollVariant(getLuck() * (1 + getVariantBonus()));
  const isVariant = variantId !== "normal";
  const variant = VARIANTS[variantId];

  let eventMult = 1;
  if (state.activeEvent && state.activeEvent.type === "school" && state.activeEvent.expiresAt > Date.now()) {
    if (f.rarity !== "Comum" && f.rarity !== "Incomum") eventMult *= 4;
  }

  let value = Math.floor(
    f.value * places[state.place].mult * boatMult() * reelMult() *
    pearlBonus() * midas * getCoinMult() * eventMult * variant.mult
  ) * fishCount;
  if (isCrit) value = Math.floor(value * BALANCE.CRIT_MULT);

  if (!state.fishStats[gid]) state.fishStats[gid] = { count: 0, maxWeight: 0, maxValue: 0, totalValue: 0 };
  const fs = state.fishStats[gid];
  fs.count += fishCount;
  fs.maxWeight = Math.max(fs.maxWeight, weight);
  fs.maxValue = Math.max(fs.maxValue, Math.floor(value / fishCount));
  fs.totalValue += value;

  state.coins += value;
  state.totalEarned += value;
  state.runEarned += value;
  state.caught += fishCount;
  state.streak += fishCount;
  state.bestStreak = Math.max(state.bestStreak, state.streak);
  if (isCrit) state.crits++;

  progressQuests("catch", fishCount);
  progressQuests("earn", value);
  if (isCrit) progressQuests("crit", 1);
  const isRare = (f.rarity !== "Comum" && f.rarity !== "Incomum");
  if (isRare) progressQuests("rare", fishCount);

  progressDaily("catch", fishCount);
  progressDaily("earn", value);
  if (isCrit) progressDaily("crit", 1);
  if (isRare) progressDaily("rare", 1);
  if (isVariant) progressDaily("variant", 1);

  consumeActiveBait();

  const isNew = !state.discovered.includes(gid);
  if (isNew) {
    state.discovered.push(gid);
    state.log.unshift(`✨ NOVA ESPÉCIE: ${f.emoji} ${f.name}!`);
    state.log = state.log.slice(0, 8);
    progressQuests("species", 1);
    progressDaily("species", 1);
  }

  if (isVariant) {
    if (!state.variantsFound[variantId]) {
      state.variantsFound[variantId] = true;
      state.log.unshift(`🎨 VARIANTE: ${variant.emoji} ${variant.name} ${f.name}!`);
      state.log = state.log.slice(0, 8);
    }
    const order = ["normal","golden","shadow","frozen","flaming","rainbow","ethereal","prismatic","cosmic"];
    const prev = state.variantStats[gid];
    if (!prev || order.indexOf(variantId) > order.indexOf(prev)) {
      state.variantStats[gid] = variantId;
    }
  }

  if (value / fishCount > state.bestValue) {
    state.bestValue = Math.floor(value / fishCount);
    state.bestGid = gid;
  }
  if (weight > state.bestWeight) state.bestWeight = weight;

  const fameEntry = { gid, value: Math.floor(value / fishCount), weight, variantId, at: Date.now() };
  state.hallOfFame.push(fameEntry);
  state.hallOfFame.sort((a,b) => b.value - a.value);
  state.hallOfFame = state.hallOfFame.slice(0, 5);

  const xpGain = Math.floor(f.xp * places[state.place].mult * variant.xpMult);
  addXP(Math.max(5, xpGain));
  progressQuests("xp", xpGain);

  if (Math.random() < 0.005 + (isRare ? 0.02 : 0)) {
    grantChest(isRare ? "silver" : "wood");
  }

  sceneCatch(isCrit, isVariant);

  let variantClass = "gold";
  if (isVariant) {
    variantClass = "variant";
    popupOnElement(`${variant.emoji} ${variant.name.toUpperCase()}!`, fishBtn, "variant", 0);
    setTimeout(() => popupOnElement(`+${fmt(value)} 🪙`, fishBtn, "gold", 0), 300);
  } else if (isCrit) {
    popupOnElement(`⚡ PERFEITO! +${fmt(value)} 🪙`, fishBtn, "crit", 0);
  } else if (isDouble) {
    popupOnElement(`+${fmt(Math.floor(value/2))} 🪙`, fishBtn, variantClass, 0);
    popupOnElement(`🔱 +${fmt(Math.floor(value/2))} 🪙`, fishBtn, "double", 90);
  } else {
    popupOnElement(`+${fmt(value)} 🪙`, fishBtn, variantClass, 0);
  }

  let msg = `${f.emoji} ${f.name}`;
  if (isVariant) msg = `${variant.emoji} ${variant.name} ${f.name}`;
  else if (isCrit) msg = `⚡ PERFEITO! ${f.emoji} ${f.name}`;
  else if (isDouble) msg = `🔱 2x ${f.emoji} ${f.name}`;
  state.log.unshift(`${msg} • ${fmtWeight(weight)} • +${fmt(value)} 🪙`);
  state.log = state.log.slice(0, 8);

  $("status").textContent = `${f.emoji} ${f.name}! ${fmtWeight(weight)} • +${fmt(value)} 🪙`;

  checkAchievements();
  checkLongQuests();
  render(); save();
}

function start() {
  if (fishing) return;
  if (state.activeEvent && state.activeEvent.type === "leviathan") {
    attackBoss();
    return;
  }
  fishing = true;
  $("fishBtn").disabled = true;
  $("fishBtn").textContent = "🌊 PESCANDO...";

  const totalTime = time() * 1000;
  sceneCast();
  setTimeout(() => { if (fishing) sceneWait(); }, 900);

  const biteLead = Math.min(400, totalTime * 0.25);
  const biteAt = Math.max(900, totalTime - biteLead);
  const biteTimer = setTimeout(() => { if (fishing) sceneBite(); }, biteAt);

  const startTime = performance.now();
  function tick(now) {
    if (!fishing) return;
    const p = Math.min(1, (now - startTime) / totalTime);
    $("fishBar").style.width = p * 100 + "%";
    if (p >= 1) {
      clearTimeout(biteTimer);
      setTimeout(() => {
        if (!fishing) return;
        fishing = false;
        $("fishBtn").disabled = false;
        $("fishBtn").textContent = "🎣 JOGAR A LINHA";
        resolveCatch();
        setTimeout(() => { if (!fishing && !state.auto) sceneIdle(); }, 1300);
        if (state.auto && (state.autoPermanent || state.autoExpiresAt > Date.now())) schedule();
      }, 160);
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
}
function schedule() {
  clearTimeout(autoTimer);
  const active = state.auto && (state.autoPermanent || state.autoExpiresAt > Date.now());
  if (active) {
    autoTimer = setTimeout(() => {
      const stillActive = state.auto && (state.autoPermanent || state.autoExpiresAt > Date.now());
      if (stillActive && !fishing) start();
    }, 650);
  }
}

/* ============================================================
   COMPRAS
   ============================================================ */
function upgrade(type) {
  let c = 0, ok = false;
  if (type === "rod") { c = rodCost(); if (state.coins >= c) { state.coins -= c; state.rod++; ok = true; } }
  else if (type === "line") { c = lineCost(); if (state.coins >= c) { state.coins -= c; state.line++; ok = true; } }
  else if (type === "hook") { c = hookCost(); if (state.coins >= c) { state.coins -= c; state.hook++; ok = true; } }
  else if (type === "reel") { c = reelCost(); if (state.coins >= c) { state.coins -= c; state.reel++; ok = true; } }
  else if (type === "boat") { c = boatCost(); if (state.coins >= c) { state.coins -= c; state.boat++; ok = true; } }
  else if (type === "detector") { c = detectorCost(); if (state.coins >= c) { state.coins -= c; state.detector++; ok = true; } }
  else if (type === "auto") {
    const now = Date.now();
    if (state.autoPermanent) return;

    // Cada compra adiciona exatamente 5 minutos.
    if (state.coins >= BALANCE.AUTO_TEMP1_COST) {
      state.coins -= BALANCE.AUTO_TEMP1_COST;
      if (state.autoExpiresAt > now) {
        state.autoExpiresAt += BALANCE.AUTO_TEMP1_DURATION;
      } else {
        state.autoExpiresAt = now + BALANCE.AUTO_TEMP1_DURATION;
      }
      state.auto = 1;
      ok = true;
    }

    if (ok && (state.auto || state.autoPermanent)) schedule();
  }
  else if (type === "autoClaim") { if (!state.autoClaim && state.coins >= BALANCE.AUTO_CLAIM_COST) { state.coins -= BALANCE.AUTO_CLAIM_COST; state.autoClaim = 1; ok = true; } }
  else if (type === "autoBuy") { if (!state.autoBuy && state.coins >= BALANCE.AUTO_BUY_COST) { state.coins -= BALANCE.AUTO_BUY_COST; state.autoBuy = 1; ok = true; } }
  render(); save();
}
function buyPermAuto() {
  if (state.autoPermanent) return;
  if (state.coins < BALANCE.AUTO_PERM_COST) {
    $("status").textContent = `🔒 Precisa ${fmt(BALANCE.AUTO_PERM_COST)} 🪙`;
    return;
  }
  state.coins -= BALANCE.AUTO_PERM_COST;
  state.autoPermanent = 1;
  state.auto = 1;
  $("status").textContent = "🎉 Auto-pesca PERMANENTE desbloqueada!";
  popupOnElement(`🔒: PERMANENTE!`, $("menuBtn"), "ach", 0);
  checkAchievements();
  schedule();
  render(); save();
}
function buyBait(id) {
  const bait = BAITS.find(b => b.id === id);
  if (!bait || bait.infinite || state.coins < bait.cost) return;
  state.coins -= bait.cost;
  state.baits[id] = (state.baits[id] || 0) + 1;
  render(); save();
}
function equipBait(id) {
  const bait = BAITS.find(b => b.id === id);
  if (!bait) return;
  if (!bait.infinite && (state.baits[id] || 0) <= 0) return;
  state.activeBait = id;
  render(); save();
}
function buyArtifact(id) {
  const list = [
    { id: "doubleHook", name: "Anzol Duplo", cost: 3 },
    { id: "midasCup",   name: "Cálice de Midas", cost: 5 },
    { id: "timeHourglass", name: "Ampulheta", cost: 4 },
    { id: "baitMaster", name: "Mestre das Iscas", cost: 4 },
    { id: "steadyHand", name: "Mão Firme", cost: 6 }
  ];
  const art = list.find(a => a.id === id);
  if (!art || state.artifacts[id] || state.pearls < art.cost) return;
  state.pearls -= art.cost;
  state.artifacts[id] = true;
  render(); save();
}
function buyBoost(type) {
  const costs = { speed: 10000, coins: 10000, xp: 10000, luck: 20000 };
  const mults = { speed: 2, coins: 2, xp: 2, luck: 2 };
  if (state.coins < costs[type]) return;
  state.coins -= costs[type];
  state.boost = { type, mult: mults[type], expiresAt: Date.now() + 5 * 60 * 1000 };
  render(); save();
}
function buyTalent(id) {
  const t = TALENTS.find(x => x.id === id);
  if (!t) return;
  const rank = getTalentRank(id);
  if (rank >= t.maxRank) return;
  if (state.talentPoints < t.cost) return;
  state.talentPoints -= t.cost;
  state.talents[id] = rank + 1;
  state.talentsSpent = (state.talentsSpent || 0) + t.cost;
  checkAchievements();
  render(); save();
}
function aquariumCapacity() { return [0, 5, 15, 30][state.aquariumLevel] || 5; }
function addToAquarium(gid) {
  if (state.aquariumFish.length >= aquariumCapacity()) return;
  const [pi, fi] = gid.split(":").map(Number);
  const f = places[pi].fishes[fi];
  if (f.rarity === "Comum" || f.rarity === "Incomum") return;
  state.aquariumFish.push(gid);
  render(); save();
}
function removeFromAquarium(idx) { state.aquariumFish.splice(idx, 1); render(); save(); }
function upgradeAquarium() {
  const costs = { 1: 50000, 2: 500000 };
  const c = costs[state.aquariumLevel];
  if (!c || state.coins < c) return;
  state.coins -= c;
  state.aquariumLevel++;
  render(); save();
}
function buyBoat(placeIdx) {
  const maxFleet = 5 + (state.crewHired.captain ? 1 : 0);
  if (state.fleet.length >= maxFleet) return;
  if (state.fleet.some(b => b.placeIdx === placeIdx)) return;
  if (state.level < places[placeIdx].need) return;
  const cost = boatFleetCost();
  if (state.coins < cost) return;
  state.coins -= cost;
  state.fleet.push({ placeIdx, efficiency: 0.5 + state.fleet.length * 0.1 });
  render(); save();
}
function buildBuilding(id) {
  const b = BUILDINGS.find(x => x.id === id);
  if (!b || state.buildingsBuilt[id] || state.coins < b.cost) return;
  state.coins -= b.cost;
  state.buildingsBuilt[id] = true;
  checkAchievements();
  render(); save();
}
function hireCrew(id) {
  const c = CREW.find(x => x.id === id);
  if (!c || state.crewHired[id] || state.coins < c.cost) return;
  state.coins -= c.cost;
  state.crewHired[id] = true;
  checkAchievements();
  render(); save();
}
function completeMuseumRoom(id) {
  const r = MUSEUM_ROOMS.find(x => x.id === id);
  if (!r || state.museumCompleted[id]) return;
  const p = places[r.placeIdx];
  const have = p.fishes.filter((_,fi)=>state.discovered.includes(r.placeIdx + ":" + fi)).length;
  if (have < r.need) return;
  state.museumCompleted[id] = true;
  if (r.reward.coins) { state.coins += r.reward.coins; state.totalEarned += r.reward.coins; }
  checkAchievements();
  render(); save();
}

/* ============================================================
   VIAGEM
   ============================================================ */
let travelInProgress = false;
function travelTo(placeIdx) {
  if (travelInProgress) return;
  if (placeIdx === state.place) return;
  if (state.level < places[placeIdx].need) return;
  const p = places[placeIdx];
  const cost = p.unlockCost || 0;
  const alreadyVisited = state.visitedPlaces.includes(placeIdx);
  const pay = alreadyVisited ? 0 : cost;
  if (pay > 0 && state.coins < pay) {
    $("status").textContent = `🔒 Precisa ${fmt(pay)} 🪙 para viajar`;
    return;
  }
  if (pay > 0) state.coins -= pay;

  fishing = false;
  clearTimeout(autoTimer);
  $("fishBtn").disabled = true;
  $("fishBtn").textContent = "🚤 VIAJANDO...";

  travelInProgress = true;
  const travelScreen = $("travelScreen");
  $("travelDest").textContent = p.name;
  $("travelBarFill").style.width = "0%";
  travelScreen.classList.add("active");

  const startTime = Date.now();
  const duration = BALANCE.TRAVEL_DURATION;
  function travelTick() {
    const p2 = Math.min(1, (Date.now() - startTime) / duration);
    $("travelBarFill").style.width = p2 * 100 + "%";
    if (p2 >= 1) {
      state.place = placeIdx;
      if (!state.visitedPlaces.includes(placeIdx)) state.visitedPlaces.push(placeIdx);
      travelScreen.classList.remove("active");
      travelInProgress = false;
      $("fishBtn").disabled = false;
      $("fishBtn").textContent = "🎣 JOGAR A LINHA";
      sceneIdle();
      checkAchievements();
      render(); save();
      if (state.auto && (state.autoPermanent || state.autoExpiresAt > Date.now())) {
        setTimeout(() => schedule(), 300);
      }
    } else {
      requestAnimationFrame(travelTick);
    }
  }
  requestAnimationFrame(travelTick);
}

/* ============================================================
   OFFLINE
   ============================================================ */
function offline() {
  if (!state.lastSave || state.lastSave === 0) { state.lastSave = Date.now(); return; }
  const now = Date.now();
  const maxMs = BALANCE.OFFLINE_MAX_HOURS * 60 * 60 * 1000;
  const elapsedMs = Math.max(0, Math.min(maxMs, now - (state.lastSave || now)));
  if (elapsedMs <= 60000) return;
  const isAuto = state.autoPermanent === 1 || (state.auto === 1 && (state.autoExpiresAt || 0) > now - elapsedMs);
  const elapsedMin = elapsedMs / 60000;
  const cycleTime = time() * 1000 + 650;
  const cycles = Math.floor(elapsedMs / cycleTime);
  if (cycles <= 0) return;
  const cyclesPerMin = 60000 / cycleTime;
  const offlineBonus = 1 + getTalentEffect("offline");
  const t1 = Math.floor(Math.min(elapsedMin, BALANCE.OFFLINE_TIER1_MIN) * cyclesPerMin * offlineBonus);
  const t2 = Math.floor(Math.max(0, Math.min(elapsedMin, BALANCE.OFFLINE_TIER2_MIN) - BALANCE.OFFLINE_TIER1_MIN) * cyclesPerMin * offlineBonus);
  const t3 = Math.floor(Math.max(0, elapsedMin - BALANCE.OFFLINE_TIER2_MIN) * cyclesPerMin * offlineBonus);
  const midas = state.artifacts.midasCup ? 1.5 : 1.0;
  const mult = places[state.place].mult * boatMult() * reelMult() * pearlBonus() * midas * getCoinMult();

  let gain = 0, caughtCount = 0, escapesCount = 0, critsCount = 0, rareCount = 0;
  let bonusGain = 0, bonusCaught = 0;
  function runCycle(rate) {
    const idx = pickLocalFish();
    const f = places[state.place].fishes[idx];
    const chance = successChance(f.difficulty);
    if (Math.random() > chance) { escapesCount += rate; return; }
    const isCrit = Math.random() < BALANCE.CRIT_CHANCE;
    const isDouble = state.artifacts.doubleHook && Math.random() < 0.25;
    const count = isDouble ? 2 : 1;
    let value = Math.floor(f.value * mult) * count;
    if (isCrit) { value = Math.floor(value * BALANCE.CRIT_MULT); critsCount += rate; }
    const isRare = (f.rarity !== "Comum" && f.rarity !== "Incomum");
    if (isRare) rareCount += rate;
    gain += value * rate;
    caughtCount += count * rate;
  }
  const baseRate = isAuto ? 1 : 0.20;
  for (let i = 0; i < Math.min(t1, 3000); i++) runCycle(1 * baseRate);
  for (let i = 0; i < Math.min(t2, 2000); i++) runCycle(0.5 * baseRate);
  for (let i = 0; i < Math.min(t3, 1000); i++) runCycle(0.2 * baseRate);

  for (const boat of state.fleet) {
    const bp = places[boat.placeIdx];
    if (!bp) continue;
    const bc = Math.min(Math.floor(cycles * 0.3), 500);
    const bm = bp.mult * (boat.efficiency || 0.5);
    for (let i = 0; i < bc; i++) {
      const idx = Math.floor(Math.random() * bp.fishes.length);
      const f = bp.fishes[idx];
      bonusGain += Math.floor(f.value * bm * getCoinMult());
      bonusCaught += 1;
    }
  }

  gain = Math.floor(gain) + bonusGain;
  caughtCount = Math.floor(caughtCount) + bonusCaught;
  escapesCount = Math.floor(escapesCount);
  critsCount = Math.floor(critsCount);
  rareCount = Math.floor(rareCount);
  if (gain <= 0 && caughtCount <= 0) return;

  state.coins += gain;
  state.totalEarned += gain;
  state.runEarned += gain;
  state.caught += caughtCount;
  state.escapes += escapesCount;
  state.crits += critsCount;
  state.tries += caughtCount + escapesCount;

  progressQuests("catch", caughtCount);
  progressQuests("earn", gain);
  progressQuests("crit", critsCount);
  progressQuests("rare", rareCount);
  progressDaily("catch", caughtCount);
  progressDaily("earn", gain);
  progressDaily("crit", critsCount);
  progressDaily("rare", rareCount);

  let chestCount = 0;
  const chestRoll = Math.floor(caughtCount / 100);
  for (let i = 0; i < Math.min(chestRoll, 3); i++) {
    if (Math.random() < 0.4) {
      grantChest(caughtCount > 1000 ? "gold" : caughtCount > 200 ? "silver" : "wood");
      chestCount++;
    }
  }

  sessionOfflineGains = gain;
  sessionOfflineReport = {
    timeMs: elapsedMs, fish: caughtCount, coins: gain,
    xp: Math.floor(gain * 0.15), chests: chestCount, rare: rareCount
  };
  checkAchievements();
}
function showOfflineReport() {
  if (!sessionOfflineReport) return;
  const r = sessionOfflineReport;
  const h = Math.floor(r.timeMs / 3600000);
  const m = Math.floor((r.timeMs % 3600000) / 60000);
  const timeText = h > 0 ? `${h}h ${m}min` : `${m}min`;
  let html = `<h2>💰 Você ficou fora por ${timeText}</h2>
    <div class="modal-stat"><span>🐟 Peixes</span><b>${fmt(r.fish)}</b></div>
    <div class="modal-stat"><span>💰 Dinheiro</span><b>+${fmt(r.coins)} 🪙</b></div>
    <div class="modal-stat"><span>⭐ XP</span><b>+${fmt(r.xp)}</b></div>`;
  if (r.chests > 0) html += `<div class="modal-stat"><span>📦 Baús</span><b>${r.chests}</b></div>`;
  if (r.rare > 0) html += `<div class="modal-stat"><span>💎 Raros+</span><b>${r.rare}</b></div>`;
  html += `<button onclick="hideModal()">COLETAR TUDO</button>`;
  showModal(html);
  addXPRaw(r.xp);
  sessionOfflineReport = null;
}

/* ============================================================
   MIGRAÇÃO SAVE
   ============================================================ */
function migrateSave(raw) {
  if (!raw || typeof raw !== "object") {
    const fresh = JSON.parse(JSON.stringify(defaultState));
    return initQuestsIfNeeded(fresh);
  }
  const s = { ...JSON.parse(JSON.stringify(defaultState)), ...raw };
  const numFields = ["coins","totalEarned","runEarned","pearls","caught","xp","level","rod","line","hook","reel","boat","detector","place","bestValue","bestWeight","tries","escapes","crits","streak","bestStreak","questsCompleted","aquariumLevel","prestigeCount","playTime","talentPoints","talentsSpent","seasonsSeen","dailiesCompleted","pearlShopBonus","pearlShopSpeed","pearlShopLuck","pearlShopXP","pearlShopVariant","autoExpiresAt"];
  for (const k of numFields) {
    if (typeof s[k] !== "number" || !isFinite(s[k])) s[k] = defaultState[k];
  }
  s.coins = Math.max(0, s.coins);
  s.totalEarned = Math.max(0, s.totalEarned);
  s.runEarned = Math.max(BALANCE.BASE_RUN_EARNED, s.runEarned);
  s.caught = Math.max(0, Math.floor(s.caught));
  s.xp = Math.max(0, s.xp);
  s.level = Math.max(1, Math.floor(s.level));
  s.rod = Math.max(1, Math.floor(s.rod));
  s.line = Math.max(1, Math.floor(s.line));
  s.hook = Math.max(1, Math.floor(s.hook));
  s.reel = Math.max(1, Math.floor(s.reel));
  s.boat = Math.max(1, Math.floor(s.boat));
  s.detector = Math.max(1, Math.floor(s.detector));
  s.tries = Math.max(0, Math.floor(s.tries));
  s.escapes = Math.max(0, Math.floor(s.escapes));
  s.crits = Math.max(0, Math.floor(s.crits));
  s.streak = Math.max(0, Math.floor(s.streak || 0));
  s.bestStreak = Math.max(s.streak, Math.floor(s.bestStreak || 0));
  s.aquariumLevel = Math.max(1, Math.min(3, Math.floor(s.aquariumLevel || 1)));
  s.place = Number.isInteger(s.place) ? s.place : 0;
  if (s.place < 0 || s.place >= places.length) s.place = 0;
  if (s.level < places[s.place].need) s.place = 0;

  s.auto = s.auto ? 1 : 0;
  s.autoClaim = s.autoClaim ? 1 : 0;
  s.autoBuy = s.autoBuy ? 1 : 0;
  s.autoPermanent = s.autoPermanent ? 1 : 0;
  if (s.auto && !s.autoPermanent && (s._v || 0) < 11) {
    s.autoPermanent = 1;
    s.autoExpiresAt = 0;
  } else if (s.auto && !s.autoPermanent && (!s.autoExpiresAt || s.autoExpiresAt < Date.now())) {
    s.autoExpiresAt = Date.now() + BALANCE.AUTO_TEMP1_DURATION;
  }
  if (typeof s.autoExpiresAt !== "number") s.autoExpiresAt = 0;

  s.visitedPlaces = Array.isArray(raw.visitedPlaces) ? raw.visitedPlaces : [s.place];
  if (!s.visitedPlaces.includes(s.place)) s.visitedPlaces.push(s.place);

  s.baits = { ...defaultState.baits, ...(raw.baits || {}) };
  for (const k in s.baits) s.baits[k] = Math.max(0, Math.floor(Number(s.baits[k]) || 0));
  if (typeof s.activeBait !== "string" || !BAITS.find(b => b.id === s.activeBait)) s.activeBait = "worm";
  s.artifacts = { ...defaultState.artifacts, ...(raw.artifacts || {}) };
  for (const k in s.artifacts) s.artifacts[k] = !!s.artifacts[k];
  s.achievements = { ...(raw.achievements || {}) };
  s.fishStats = { ...(raw.fishStats || {}) };
  s.variantsFound = { ...(raw.variantsFound || {}) };
  s.variantStats = { ...(raw.variantStats || {}) };
  s.pendingChests = Array.isArray(raw.pendingChests) ? raw.pendingChests.slice(0, 20) : [];
  s.aquariumFish = Array.isArray(raw.aquariumFish) ? raw.aquariumFish.slice(0, 30) : [];
  s.fleet = Array.isArray(raw.fleet) ? raw.fleet.slice(0, 6) : [];
  s.buildingsBuilt = { ...(raw.buildingsBuilt || {}) };
  s.crewHired = { ...(raw.crewHired || {}) };
  s.museumCompleted = { ...(raw.museumCompleted || {}) };
  s.longQuestsCompleted = { ...(raw.longQuestsCompleted || {}) };
  s.talents = { ...(raw.talents || {}) };
  s.pearlShopLevels = { ...(raw.pearlShopLevels || {}) };
  s.bossDefeated = !!s.bossDefeated;

  // Mantém o ciclo das estações mesmo quando o jogador fecha o jogo durante
  // uma estação. Se uma ou mais estações terminaram enquanto o jogo estava
  // fechado, calcula diretamente qual estação deveria estar ativa agora.
  const nowForSeason = Date.now();
  const rawSeason = raw.season;
  if (rawSeason && typeof rawSeason === "object") {
    const baseIndex = Math.max(0, SEASONS.findIndex(x => x.id === rawSeason.id));
    const originalStartedAt = Number(rawSeason.startedAt) || nowForSeason;
    const elapsedSeasons = Math.max(0, Math.floor((nowForSeason - originalStartedAt) / SEASON_DURATION_MS));
    const currentIndex = (baseIndex + elapsedSeasons) % SEASONS.length;
    const currentStartedAt = originalStartedAt + elapsedSeasons * SEASON_DURATION_MS;
    const currentDef = SEASONS[currentIndex] || SEASONS[0];
    s.season = {
      id: currentDef.id,
      startedAt: currentStartedAt,
      expiresAt: currentStartedAt + SEASON_DURATION_MS
    };
    s.seasonsSeen = Math.max(Number(s.seasonsSeen) || 0, 1 + elapsedSeasons);
    s.nextSeasonAt = s.season.expiresAt;
  } else {
    s.season = { id: "spring", startedAt: nowForSeason, expiresAt: nowForSeason + SEASON_DURATION_MS };
    s.seasonsSeen = Math.max(1, Number(s.seasonsSeen) || 0);
    s.nextSeasonAt = s.season.expiresAt;
  }
  s.dailyChallenge = raw.dailyChallenge || null;
  s.hallOfFame = Array.isArray(raw.hallOfFame) ? raw.hallOfFame.slice(0, 5) : [];
  s.discovered = Array.isArray(raw.discovered)
    ? raw.discovered.filter(x => typeof x === "string" && /^\d+:\d+$/.test(x))
    : [];
  s.log = Array.isArray(raw.log) ? raw.log.slice(0, 8) : [];

  if (!raw._v || raw._v < 7) {
    if (s.pearls > 50) s.pearls = Math.floor(Math.sqrt(s.pearls) * 6);
    const need = xpNeedFor(s.level);
    if (s.xp > need * 2) s.xp = need * 0.5;
  }
  s._v = 14;

  initQuestsIfNeeded(s);
  s.quests.forEach(q => {
    if (typeof q.progress !== "number") q.progress = 0;
    if (typeof q.tier !== "number") q.tier = 0;
    if (typeof q.type !== "string" || !["catch","earn","rare","crit","xp","species"].includes(q.type)) q.type = "catch";
    // Rebalanceia também saves antigos para impedir que recompensas antigas
    // mantenham a economia inflada após atualizar o jogo.
    q.reward = questRewardFor(q.type, q.tier);
    if (typeof q.goal !== "number") q.goal = 10;
    if (typeof q.label !== "string") q.label = "Missão";
    if (typeof q.visualTier !== "number") q.visualTier = 1;
  });

  // O clima faz parte do save. Nunca sorteie outro clima só porque a página
  // foi atualizada/fechada. Se o ciclo expirou enquanto estava fechada,
  // mantém o mesmo clima e inicia um novo ciclo a partir do carregamento.
  if (!WEATHERS[s.weather]) s.weather = defaultState.weather;
  if (!s.weatherExpires || typeof s.weatherExpires !== "number") {
    s.weatherExpires = Date.now() + 3 * 60 * 1000;
  }
  // Se o save foi aberto depois do fim do ciclo, mantém o mesmo clima
  // por mais um ciclo em vez de sortear outro durante o carregamento.
  if (s.weatherExpires < Date.now()) s.weatherExpires = Date.now() + 3 * 60 * 1000;
  if (!s.nextEventAt) s.nextEventAt = Date.now() + 90 * 1000;
  if (!s.season) {
    s.season = { id: "spring", startedAt: Date.now(), expiresAt: Date.now() + SEASON_DURATION_MS };
    s.seasonsSeen = Math.max(1, Number(s.seasonsSeen) || 0);
  }
  s.nextSeasonAt = s.season.expiresAt;
  recalcPearlShopBonuses();
  return s;
}

let state;
let initialSaveFound = false;
let indexedDbReady = false;
const SAVE_KEYS = ["pescaria_idle_autosave", "pescaria_idle_v14", "pescaria_idle_v13", "pescaria_idle_v12", "pescaria_idle_v11", "pescaria_idle_v10", "pescaria_idle_v2"];
const SAVE_HASH_PREFIX = "pescariaSave=";
const IDB_NAME = "PescariaIdleDB";
const IDB_VERSION = 1;
const IDB_STORE = "saves";
const IDB_SAVE_KEY = "current";

function encodeSave(raw) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(raw))));
}
function decodeSave(encoded) {
  return JSON.parse(decodeURIComponent(escape(atob(encoded))));
}

// Alguns celulares/navegadores abrem HTML baixado como content:// e podem
// bloquear localStorage. O hash da própria página funciona como segunda
// camada de persistência e sobrevive ao F5/atualização da mesma página.
function readHashSave() {
  try {
    const hash = String(location.hash || "");
    if (!hash.includes(SAVE_HASH_PREFIX)) return null;
    const encoded = hash.slice(hash.indexOf(SAVE_HASH_PREFIX) + SAVE_HASH_PREFIX.length);
    if (!encoded) return null;
    const obj = decodeSave(decodeURIComponent(encoded));
    return obj && typeof obj === "object" ? obj : null;
  } catch (e) { return null; }
}

function writeHashSave(payload) {
  try {
    const encoded = encodeURIComponent(encodeSave(payload));
    const newHash = "#" + SAVE_HASH_PREFIX + encoded;
    if (location.hash !== newHash) {
      history.replaceState(null, "", location.href.split("#")[0] + newHash);
    }
    return true;
  } catch (e) {
    try { location.hash = SAVE_HASH_PREFIX + encodeURIComponent(encodeSave(payload)); return true; } catch (_) { return false; }
  }
}

function readBestLocalSave() {
  const candidates = [];
  const hashSave = readHashSave();
  if (hashSave) candidates.push(hashSave);
  for (const key of SAVE_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") candidates.push(obj);
    } catch (e) {}
  }
  if (!candidates.length) return null;
  candidates.sort((a,b) => (Number(b.lastSave)||0) - (Number(a.lastSave)||0));
  return candidates[0];
}
try {
  const raw = readBestLocalSave();
  initialSaveFound = !!raw;
  state = migrateSave(raw);
} catch (e) {
  initialSaveFound = false;
  state = initQuestsIfNeeded(JSON.parse(JSON.stringify(defaultState)));
}
refreshDailyIfNeeded();
recalcPearlShopBonuses();

const $ = id => document.getElementById(id);

function openSaveDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) return reject(new Error("IndexedDB indisponível"));
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("Falha ao abrir IndexedDB"));
  });
}

async function readIndexedSave() {
  try {
    const db = await openSaveDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readonly");
      const req = tx.objectStore(IDB_STORE).get(IDB_SAVE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) { return null; }
}

async function writeIndexedSave(payload) {
  try {
    const db = await openSaveDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).put(payload, IDB_SAVE_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return true;
  } catch (e) { return false; }
}

async function clearIndexedSave() {
  try {
    const db = await openSaveDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, "readwrite");
      tx.objectStore(IDB_STORE).delete(IDB_SAVE_KEY);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
    return true;
  } catch (e) { return false; }
}

async function hydratePersistentSave() {
  const indexed = await readIndexedSave();
  if (indexed && typeof indexed === "object") {
    const indexedTime = Number(indexed.lastSave) || 0;
    const currentTime = Number(state.lastSave) || 0;
    // Se não havia save local, o IndexedDB sempre ganha. Caso já exista um
    // save local, só substitui quando o IndexedDB for mais recente.
    if (!initialSaveFound || indexedTime > currentTime) {
      state = migrateSave(indexed);
      refreshDailyIfNeeded();
      recalcPearlShopBonuses();
    }
  }
  indexedDbReady = true;
}

function save() {
  if (!state) return false;
  state.lastSave = Date.now();
  state._v = 14;
  try {
    const payload = JSON.stringify(state);
    let stored = false;
    for (const key of ["pescaria_idle_autosave", "pescaria_idle_v14", "pescaria_idle_v13", "pescaria_idle_v12"]) {
      try { localStorage.setItem(key, payload); stored = true; } catch (e) {}
    }
    // Hash continua como último recurso para arquivos locais, mas o GitHub
    // usa localStorage + IndexedDB, evitando depender de uma URL gigante.
    let hashStored = false;
    if (!stored) hashStored = writeHashSave(state);
    if (indexedDbReady) writeIndexedSave(state);
    if (!stored && !hashStored && !indexedDbReady) console.warn("Nenhum método de save persistente está disponível neste navegador.");
    return stored || hashStored || indexedDbReady;
  } catch (e) {
    try {
      const hashStored = writeHashSave(state);
      if (indexedDbReady) writeIndexedSave(state);
      return hashStored || indexedDbReady;
    } catch (_) { return indexedDbReady; }
  }
}

/* ============================================================
   MENU — SEÇÕES E ITENS (grid de cards)
   ============================================================ */
const MENU_SECTIONS = [
  {
    title: "Progresso",
    items: [
      { id: "book",         icon: "📖", name: "Livro de Peixes", desc: "Sua coleção completa",  badgeFn: () => `${state.discovered.length}/${TOTAL_FISHES}`, badgeType: "green" },
      { id: "quests",       icon: "🎯", name: "Missões",         desc: "3 missões ativas",      badgeFn: () => { const r = readyQuestIndexes().length; return r > 0 ? `${r} prontas` : null; }, badgeType: "green" },
      { id: "achievements", icon: "🏆", name: "Conquistas",      desc: "Marcos e bônus",        badgeFn: () => `${Object.keys(state.achievements).length}/${ACHIEVEMENTS.length}`, badgeType: "green" },
      { id: "daily",        icon: "📅", name: "Desafio Diário",  desc: "Recompensa única",      badgeFn: () => state.dailyChallenge?.completed ? "✓" : null, badgeType: "green" }
    ]
  },
  {
    title: "Recursos",
    items: [
      { id: "baits",        icon: "🪱", name: "Iscas",           desc: "Compre e equipe iscas",   badgeFn: () => state.activeBait === "worm" ? null : BAITS.find(b=>b.id===state.activeBait)?.name, badgeType: "green" },
      { id: "artifacts",    icon: "🔮", name: "Artefatos",       desc: "Itens permanentes",       badgeFn: () => { const t = Object.values(state.artifacts).filter(Boolean).length; return t > 0 ? `${t}/5` : null; }, badgeType: "purple" },
      { id: "pearlShop",    icon: "💎", name: "Loja de Pérolas", desc: "Upgrades infinitos",      badgeFn: () => state.pearls > 0 ? `${fmt(state.pearls)} 🔮` : null, badgeType: "purple" },
      { id: "boosts",       icon: "⚡", name: "Boosts",          desc: "Temporários poderosos",   badgeFn: () => state.boost && state.boost.expiresAt > Date.now() ? "ATIVO" : null, badgeType: "red" }
    ]
  },
  {
    title: "Mundo",
    items: [
      { id: "map",          icon: "🗺️", name: "Mapa / Viajar",  desc: "Escolha seu destino",     badgeFn: () => `${state.visitedPlaces.length}/5`, badgeType: "green" },
      { id: "fleet",        icon: "🚤", name: "Frota",           desc: "Barcos pescam offline",   badgeFn: () => state.fleet.length > 0 ? `${state.fleet.length} barcos` : null, badgeType: "green" },
      { id: "aquarium",     icon: "🐠", name: "Aquário",         desc: "XP passivo com Raros+",   badgeFn: () => state.aquariumFish.length > 0 ? `${state.aquariumFish.length}` : null, badgeType: "green" },
      { id: "island",       icon: "🏝️", name: "Ilha",            desc: "Construções permanentes", badgeFn: () => `${Object.keys(state.buildingsBuilt).length}/${BUILDINGS.length}`, badgeType: "green" },
      { id: "crew",         icon: "👥", name: "Tripulação",      desc: "Especialistas",           badgeFn: () => Object.keys(state.crewHired).length > 0 ? `${Object.keys(state.crewHired).length}` : null, badgeType: "green" },
      { id: "museum",       icon: "🏛️", name: "Museu",           desc: "Coleções por local",      badgeFn: () => `${Object.keys(state.museumCompleted).length}/5`, badgeType: "green" }
    ]
  },
  {
    title: "Meta",
    items: [
      { id: "talents",      icon: "🌳", name: "Talentos",        desc: "Pontos permanentes",      badgeFn: () => state.talentPoints > 0 ? `${state.talentPoints} pts` : null, badgeType: "purple" },
      { id: "prestige",     icon: "✨", name: "Prestígio",       desc: "Reset com bônus eterno",  badgeFn: () => state.level >= BALANCE.PRESTIGE_LEVEL_REQ ? "PRONTO" : `Nv.${BALANCE.PRESTIGE_LEVEL_REQ}`, badgeType: state.level >= BALANCE.PRESTIGE_LEVEL_REQ ? "red" : null },
      { id: "season",       icon: "🌿", name: "Estação do Ano", desc: "Bônus por 39 dias",        badgeFn: () => state.season && state.season.expiresAt > Date.now() ? "ATIVA" : null, badgeType: "red" },
      { id: "fame",         icon: "🏅", name: "Salão da Fama",   desc: "Top 5 mais valiosos",     badgeFn: () => state.hallOfFame.length > 0 ? `${state.hallOfFame.length}` : null, badgeType: "green" },
      { id: "save",         icon: "💾", name: "Save & Config",   desc: "Export/Import/Reset",     badgeFn: null, badgeType: null }
    ]
  }
];

/* ============================================================
   OVERLAY SYSTEM
   ============================================================ */

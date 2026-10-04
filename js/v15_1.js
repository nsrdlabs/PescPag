/* =========================================================
   PESC PAG V15.1
   MODO HORIZONTAL + FULLSCREEN + APRIMORAMENTOS
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     SALVAMENTO
     ========================================================= */

  function saveGame() {
    try {
      if (typeof save === "function") {
        save();
      }
    } catch (e) {
      console.warn("PescPag V15.1 - erro ao salvar:", e);
    }
  }

  /* =========================================================
     ORIENTAÇÃO
     ========================================================= */

  function isLandscape() {
    return window.innerWidth > window.innerHeight;
  }

  function requestGameFullscreen() {
    const element = document.documentElement;

    const fullscreenFunction =
      element.requestFullscreen ||
      element.webkitRequestFullscreen;

    if (!fullscreenFunction) return;

    try {
      const result = fullscreenFunction.call(element);

      if (result && typeof result.catch === "function") {
        result.catch(function () {});
      }
    } catch (e) {
      console.warn("Fullscreen não permitido pelo navegador.");
    }
  }

  function updateOrientation() {
    const landscape = isLandscape();

    document.documentElement.classList.toggle(
      "pp-landscape",
      landscape
    );

    document.body.classList.toggle(
      "pp-portrait",
      !landscape
    );

    const gate = document.getElementById("ppOrientationGate");

    if (gate) {
      gate.classList.toggle("show", !landscape);
    }

    /*
      Quando o aparelho estiver horizontal,
      tentamos entrar em tela cheia.
    */
    if (landscape) {
      requestGameFullscreen();
    }
  }

  /* =========================================================
     TELA "GIRE O CELULAR"
     ========================================================= */

  function createOrientationGate() {

    if (document.getElementById("ppOrientationGate")) {
      return;
    }

    const gate = document.createElement("div");

    gate.id = "ppOrientationGate";

    gate.innerHTML = `
      <div class="pp-orientation-card">

        <div class="pp-phone">
          📱
        </div>

        <div class="pp-rotate">
          ↻
        </div>

        <h2>
          Gire o celular
        </h2>

        <p>
          O PescPag foi desenvolvido para jogar
          somente na horizontal.
        </p>

        <button
          id="ppFullscreenBtn"
          type="button">
          🎮 Tentar tela cheia
        </button>

      </div>
    `;

    document.body.appendChild(gate);

    const button =
      document.getElementById("ppFullscreenBtn");

    if (button) {

      button.addEventListener(
        "click",
        function () {

          requestGameFullscreen();

          setTimeout(
            updateOrientation,
            100
          );

        }
      );

    }
  }

  /* =========================================================
     DADOS DOS APRIMORAMENTOS
     ========================================================= */

  function getUpgradeData() {

    return [

      [
        "rod",
        "🎣 Vara",
        "Aumenta a velocidade das pescarias."
      ],

      [
        "line",
        "🧵 Linha",
        "Permite lidar melhor com peixes pesados."
      ],

      [
        "hook",
        "🪝 Anzol",
        "Aumenta a chance de sucesso."
      ],

      [
        "reel",
        "⚙️ Molinete",
        "Aumenta o valor dos peixes."
      ],

      [
        "boat",
        "🚤 Barco",
        "Melhora sua capacidade de exploração."
      ],

      [
        "detector",
        "📡 Detector",
        "Aumenta suas chances de encontrar peixes especiais."
      ]

    ];

  }

  /* =========================================================
     CUSTO DO APRIMORAMENTO
     ========================================================= */

  function getUpgradeCost(id) {

    if (
      typeof state === "undefined" ||
      !state
    ) {
      return 0;
    }

    const level =
      Math.max(
        1,
        Number(state[id]) || 1
      );

    let base = 100;
    let scale = 1.75;

    if (
      typeof BALANCE !== "undefined"
    ) {

      switch (id) {

        case "rod":
          base =
            BALANCE.ROD_COST_BASE || 100;

          scale =
            BALANCE.ROD_COST_SCALE || 1.75;
          break;

        case "line":
          base =
            BALANCE.LINE_COST_BASE || 250;

          scale =
            BALANCE.LINE_COST_SCALE || 1.75;
          break;

        case "hook":
          base =
            BALANCE.HOOK_COST_BASE || 200;

          scale =
            BALANCE.HOOK_COST_SCALE || 1.75;
          break;

        case "reel":
          base =
            BALANCE.REEL_COST_BASE || 400;

          scale =
            BALANCE.REEL_COST_SCALE || 1.75;
          break;

        case "boat":
          base =
            BALANCE.BOAT_COST_BASE || 800;

          scale =
            BALANCE.BOAT_COST_SCALE || 1.75;
          break;

        case "detector":
          base =
            BALANCE.DETECTOR_COST_BASE || 1200;

          scale =
            BALANCE.DETECTOR_COST_SCALE || 1.80;
          break;

      }

    }

    let discount = 1;

    /*
      Mecânico já existente no jogo.
    */

    try {

      if (
        state.crewHired &&
        state.crewHired.mechanic
      ) {

        discount = 0.90;

      }

    } catch (e) {}

    return Math.max(
      1,
      Math.floor(
        base *
        Math.pow(
          scale,
          level - 1
        ) *
        discount
      )
    );

  }

  /* =========================================================
     COMPRAR APRIMORAMENTO
     ========================================================= */

  function buyUpgrade(id) {

    if (
      typeof state === "undefined" ||
      !state
    ) {
      return;
    }

    const cost =
      getUpgradeCost(id);

    const coins =
      Number(state.coins) || 0;

    if (coins < cost) {

      if (
        typeof showPopup === "function"
      ) {

        showPopup(
          "🪙 Moedas insuficientes!"
        );

      } else {

        alert(
          "Você não possui moedas suficientes."
        );

      }

      return;

    }

    /*
      Compra.
    */

    state.coins =
      coins - cost;

    state[id] =
      Math.max(
        1,
        Number(state[id]) || 1
      ) + 1;

    saveGame();

    /*
      Atualiza o jogo principal.
    */

    if (
      typeof render === "function"
    ) {

      try {
        render();
      } catch (e) {}

    }

    renderUpgrades();

  }

  /* =========================================================
     RENDERIZA APRIMORAMENTOS
     ========================================================= */

  function renderUpgrades() {

    const body =
      document.getElementById(
        "ppUpgradesBody"
      );

    if (
      !body ||
      typeof state === "undefined" ||
      !state
    ) {
      return;
    }

    const upgrades =
      getUpgradeData();

    const coins =
      Number(state.coins) || 0;

    body.innerHTML = `

      <div class="pp-upgrades-coins">

        🪙

        <strong>
          ${Math.floor(coins).toLocaleString("pt-BR")}
        </strong>

      </div>

      <div class="pp-upgrade-grid">

        ${upgrades.map(function (item) {

          const id = item[0];
          const name = item[1];
          const description = item[2];

          const level =
            Math.max(
              1,
              Number(state[id]) || 1
            );

          const cost =
            getUpgradeCost(id);

          const enough =
            coins >= cost;

          return `

            <div class="pp-upgrade-card">

              <div class="pp-upgrade-name">
                ${name}
              </div>

              <div class="pp-upgrade-desc">
                ${description}
              </div>

              <div class="pp-upgrade-level">
                Nível
                <strong>
                  ${level}
                </strong>
              </div>

              <button
                type="button"
                class="pp-buy-upgrade"
                data-upgrade="${id}"
                ${enough ? "" : "disabled"}>

                COMPRAR

                · 🪙

                ${cost.toLocaleString("pt-BR")}

              </button>

            </div>

          `;

        }).join("")}

      </div>
    `;

    body
      .querySelectorAll(
        ".pp-buy-upgrade"
      )
      .forEach(function (button) {

        button.addEventListener(
          "click",
          function () {

            buyUpgrade(
              button.dataset.upgrade
            );

          }
        );

      });

  }

  /* =========================================================
     ABRIR / FECHAR APRIMORAMENTOS
     ========================================================= */

  function openUpgrades() {

    const overlay =
      document.getElementById(
        "ppUpgrades"
      );

    if (!overlay) return;

    renderUpgrades();

    overlay.classList.add(
      "show"
    );

  }

  function closeUpgrades() {

    const overlay =
      document.getElementById(
        "ppUpgrades"
      );

    if (overlay) {

      overlay.classList.remove(
        "show"
      );

    }

  }

  /* =========================================================
     CRIA PAINEL
     ========================================================= */

  function createUpgradePanel() {

    if (
      document.getElementById(
        "ppUpgrades"
      )
    ) {
      return;
    }

    const overlay =
      document.createElement(
        "div"
      );

    overlay.id =
      "ppUpgrades";

    overlay.innerHTML = `

      <div class="pp-upgrades-panel">

        <button
          type="button"
          id="ppUpgradesClose"
          class="pp-close">

          ✕

        </button>

        <h2>
          ⚙️ APRIMORAMENTOS
        </h2>

        <p class="pp-subtitle">
          Melhore seus equipamentos
          e aumente sua eficiência.
        </p>

        <div id="ppUpgradesBody"></div>

      </div>

    `;

    document.body.appendChild(
      overlay
    );

    document
      .getElementById(
        "ppUpgradesClose"
      )
      .addEventListener(
        "click",
        closeUpgrades
      );

    overlay.addEventListener(
      "click",
      function (event) {

        if (
          event.target === overlay
        ) {

          closeUpgrades();

        }

      }
    );

  }

  /* =========================================================
     BOTÃO APRIMORAMENTOS
     ========================================================= */

  function createUpgradeButton() {

    if (
      document.getElementById(
        "ppUpgradeOpen"
      )
    ) {
      return;
    }

    const button =
      document.createElement(
        "button"
      );

    button.id =
      "ppUpgradeOpen";

    button.type =
      "button";

    button.textContent =
      "⚙️ APRIMORAMENTOS";

    button.addEventListener(
      "click",
      openUpgrades
    );

    const topbar =
      document.querySelector(
        ".topbar"
      );

    const menu =
      document.getElementById(
        "menuBtn"
      );

    if (
      topbar &&
      menu
    ) {

      topbar.insertBefore(
        button,
        menu
      );

    } else {

      document.body.appendChild(
        button
      );

    }

  }

  /* =========================================================
     CSS
     ========================================================= */

  function injectStyles() {

    if (
      document.getElementById(
        "ppV151Styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "ppV151Styles";

    style.textContent = `

      html,
      body {

        margin: 0;
        padding: 0;

        background: #06111d;

        overflow: hidden;

      }

      /*
        ================================================
        TELA VERTICAL
        ================================================
      */

      #ppOrientationGate {

        position: fixed;

        inset: 0;

        z-index: 99999;

        display: none;

        align-items: center;
        justify-content: center;

        background:
          linear-gradient(
            135deg,
            #06111d,
            #0a2740
          );

        color: #fff;

        font-family:
          Arial,
          sans-serif;

        text-align: center;

      }

      #ppOrientationGate.show {

        display: flex;

      }

      .pp-orientation-card {

        width:
          min(
            90vw,
            420px
          );

        padding:
          28px 22px;

      }

      .pp-phone {

        font-size: 54px;

      }

      .pp-rotate {

        font-size: 40px;

        margin:
          4px 0;

      }

      .pp-orientation-card h2 {

        margin:
          8px 0;

        font-size:
          28px;

      }

      .pp-orientation-card p {

        opacity: .85;

        line-height:
          1.5;

      }

      #ppFullscreenBtn {

        border: 0;

        border-radius:
          12px;

        padding:
          13px 18px;

        font-weight:
          800;

        cursor:
          pointer;

        background:
          #fff;

        color:
          #092238;

        margin-top:
          10px;

      }

      /*
        ================================================
        BOTÃO APRIMORAMENTOS
        ================================================
      */

      #ppUpgradeOpen {

        border: 0;

        border-radius:
          10px;

        padding:
          9px 12px;

        font-weight:
          800;

        cursor:
          pointer;

        background:
          #163b57;

        color:
          #fff;

        margin-left:
          auto;

        margin-right:
          6px;

      }

      /*
        ================================================
        PAINEL
        ================================================
      */

      #ppUpgrades {

        position:
          fixed;

        inset:
          0;

        z-index:
          99990;

        display:
          none;

        align-items:
          center;

        justify-content:
          center;

        background:
          rgba(
            0,
            0,
            0,
            .72
          );

        color:
          #fff;

        font-family:
          Arial,
          sans-serif;

        padding:
          12px;

        box-sizing:
          border-box;

      }

      #ppUpgrades.show {

        display:
          flex;

      }

      .pp-upgrades-panel {

        width:
          min(
            100%,
            900px
          );

        max-height:
          94vh;

        overflow:
          auto;

        background:
          #092033;

        border:
          1px solid #2a5b7d;

        border-radius:
          18px;

        padding:
          18px;

        box-sizing:
          border-box;

        position:
          relative;

      }

      .pp-upgrades-panel h2 {

        margin:
          0 45px 4px 0;

      }

      .pp-subtitle {

        margin:
          0 0 12px;

        color:
          #a9c6d9;

      }

      .pp-close {

        position:
          absolute;

        right:
          12px;

        top:
          12px;

        width:
          42px;

        height:
          42px;

        border:
          0;

        border-radius:
          50%;

        background:
          #183b52;

        color:
          #fff;

        font-size:
          20px;

      }

      .pp-upgrades-coins {

        background:
          #0d2d43;

        border-radius:
          12px;

        padding:
          10px;

        margin-bottom:
          12px;

      }

      /*
        ================================================
        CARDS DOS UPGRADES
        ================================================
      */

      .pp-upgrade-grid {

        display:
          grid;

        grid-template-columns:
          repeat(
            3,
            minmax(
              0,
              1fr
            )
          );

        gap:
          10px;

      }

      .pp-upgrade-card {

        background:
          #0d2a3e;

        border:
          1px solid #1d4965;

        border-radius:
          14px;

        padding:
          12px;

      }

      .pp-upgrade-name {

        font-size:
          17px;

        font-weight:
          800;

      }

      .pp-upgrade-desc {

        font-size:
          12px;

        color:
          #9db8c9;

        min-height:
          34px;

        margin:
          6px 0;

      }

      .pp-upgrade-level {

        margin:
          6px 0 10px;

      }

      .pp-buy-upgrade {

        width:
          100%;

        border:
          0;

        border-radius:
          10px;

        padding:
          11px;

        background:
          #20a46b;

        color:
          #fff;

        font-weight:
          800;

      }

      .pp-buy-upgrade:disabled {

        opacity:
          .4;

        cursor:
          not-allowed;

      }

      /*
        ================================================
        CELULAR HORIZONTAL
        ================================================
      */

      @media
        (max-width: 760px)
        and
        (orientation: landscape) {

        .pp-upgrade-grid {

          grid-template-columns:
            repeat(
              2,
              minmax(
                0,
                1fr
              )
            );

        }

        .pp-upgrades-panel {

          max-height:
            90vh;

        }

      }

      /*
        ================================================
        NA VERTICAL O JOGO NÃO FICA JOGÁVEL
        ================================================
      */

      @media
        (orientation: portrait) {

        #game {

          visibility:
            hidden;

        }

      }

    `;

    document.head.appendChild(
      style
    );

  }

  /* =========================================================
     INICIALIZAÇÃO
     ========================================================= */

  function init() {

    injectStyles();

    createOrientationGate();

    createUpgradePanel();

    createUpgradeButton();

    updateOrientation();

    window.addEventListener(
      "resize",
      updateOrientation,
      { passive: true }
    );

    window.addEventListener(
      "orientationchange",
      function () {

        setTimeout(
          updateOrientation,
          150
        );

      },
      { passive: true }
    );

    document.addEventListener(
      "visibilitychange",
      function () {

        if (
          document.visibilityState ===
          "visible"
        ) {

          updateOrientation();

        }

        saveGame();

      }
    );

    window.addEventListener(
      "pagehide",
      saveGame
    );

  }

  if (
    document.readyState ===
    "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );

  } else {

    init();

  }

})();

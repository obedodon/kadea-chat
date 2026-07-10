(function () {
  const THEME_STORAGE_KEY = "theme";

  /* =========================================================
     CRÉATION AUTOMATIQUE DU BOUTON DE THÈME
  ========================================================= */

  function createThemeButton() {
    const existingButton = document.getElementById("themeToggle");

    if (existingButton) {
      return existingButton;
    }

    const button = document.createElement("button");

    button.id = "themeToggle";
    button.type = "button";
    button.setAttribute("aria-label", "Changer le thème");
    button.setAttribute("title", "Mode sombre / clair");

    button.className = `
      fixed top-4 right-4 z-[100]
      w-11 h-11 rounded-full
      bg-white border border-slate-200 shadow-lg
      flex items-center justify-center
      text-slate-600
      hover:text-blue-600 hover:scale-110
      transition-all duration-300
    `;

    button.innerHTML = `
      <i id="themeIcon" class="fa-solid fa-moon"></i>
    `;

    document.body.appendChild(button);

    return button;
  }

  /* =========================================================
     STYLES SOMBRES GLOBAUX
  ========================================================= */

  const darkModeStyles = document.createElement("style");

  darkModeStyles.textContent = `
    html,
    body {
      transition:
        background-color 0.25s ease,
        color 0.25s ease;
    }

    body.dark-mode {
      background-color: #0f172a !important;
      color: #f8fafc !important;
    }

    /* Structures principales */

    body.dark-mode main,
    body.dark-mode aside,
    body.dark-mode section,
    body.dark-mode header,
    body.dark-mode footer,
    body.dark-mode form,
    body.dark-mode article,
    body.dark-mode .bg-white {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border-color: #334155 !important;
    }

    body.dark-mode .bg-slate-50,
    body.dark-mode .bg-slate-100 {
      background-color: #0f172a !important;
    }

    body.dark-mode .bg-slate-200 {
      background-color: #334155 !important;
    }

    /* Textes */

    body.dark-mode .text-slate-900,
    body.dark-mode .text-slate-800,
    body.dark-mode .text-slate-700,
    body.dark-mode .text-slate-600,
    body.dark-mode .text-slate-500,
    body.dark-mode .text-slate-400 {
      color: #e2e8f0 !important;
    }

    body.dark-mode label,
    body.dark-mode h1,
    body.dark-mode h2,
    body.dark-mode h3,
    body.dark-mode p {
      border-color: #334155;
    }

    /* Champs */

    body.dark-mode input,
    body.dark-mode textarea,
    body.dark-mode select {
      background-color: #0f172a !important;
      color: #f8fafc !important;
      border-color: #475569 !important;
    }

    body.dark-mode input::placeholder,
    body.dark-mode textarea::placeholder {
      color: #94a3b8 !important;
    }

    body.dark-mode input:focus,
    body.dark-mode textarea:focus,
    body.dark-mode select:focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35) !important;
    }

    /* Bouton du thème */

    body.dark-mode #themeToggle {
      background-color: #334155 !important;
      color: #facc15 !important;
      border-color: #475569 !important;
    }

    body.dark-mode #themeToggle:hover {
      background-color: #475569 !important;
    }

    /* Liste des conversations */

    body.dark-mode #conversationsList {
      background-color: #1e293b !important;
    }

    body.dark-mode .conversation-item {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border-color: #334155 !important;
    }

    body.dark-mode .conversation-item:hover {
      background-color: #334155 !important;
    }

    body.dark-mode .conversation-item.active {
      background-color: #28486f !important;
    }

    body.dark-mode .conversation-name {
      color: #f8fafc !important;
    }

    body.dark-mode .conversation-preview {
      color: #cbd5e1 !important;
    }

    body.dark-mode .conversation-time {
      color: #93c5fd !important;
    }

    /* Zone des messages */

    body.dark-mode #messagesContainer {
      background-color: #0f172a !important;
    }

    /*
      Message envoyé :
      vert sombre et doux, moins éclatant.
    */

    body.dark-mode .message-sent {
      background-color: #315f52 !important;
      color: #f8fafc !important;
      border-color: #3f7566 !important;
    }

    body.dark-mode .message-sent p {
      color: #f8fafc !important;
    }

    body.dark-mode .message-sent span {
      color: #d1fae5 !important;
    }

    /*
      Message reçu :
      gris sombre avec texte clair.
    */

    body.dark-mode .message-received {
      background-color: #253247 !important;
      color: #f8fafc !important;
      border-color: #334155 !important;
    }

    body.dark-mode .message-received p {
      color: #f8fafc !important;
    }

    body.dark-mode .message-received span {
      color: #cbd5e1 !important;
    }

    /* Séparateurs Aujourd’hui / Hier */

    body.dark-mode #messagesContainer span.bg-white\\/90,
    body.dark-mode #messagesContainer .message-date {
      background-color: #334155 !important;
      color: #e2e8f0 !important;
    }

    /* Barre d’écriture */

    body.dark-mode #messageForm {
      background-color: #1e293b !important;
    }

    body.dark-mode #messageInput {
      background-color: #0f172a !important;
      color: #f8fafc !important;
    }

    /* Menus et fenêtres modales */

    body.dark-mode #chatMenu,
    body.dark-mode #newConversationModal > div,
    body.dark-mode #uiModal > div,
    body.dark-mode #avatarModal > div,
    body.dark-mode #conversationAvatarModal > div {
      background-color: #1e293b !important;
      color: #f8fafc !important;
      border-color: #334155 !important;
    }

    body.dark-mode #chatMenu a,
    body.dark-mode #chatMenu button {
      color: #e2e8f0 !important;
    }

    body.dark-mode #chatMenu a:hover,
    body.dark-mode #chatMenu button:hover,
    body.dark-mode .user-choice:hover {
      background-color: #334155 !important;
    }

    body.dark-mode .user-choice {
      color: #f8fafc !important;
    }

    body.dark-mode .user-choice-email {
      color: #cbd5e1 !important;
    }

    /* Cartes login, inscription et profil */

    body.dark-mode .shadow,
    body.dark-mode .shadow-sm,
    body.dark-mode .shadow-lg {
      box-shadow:
        0 10px 25px rgba(0, 0, 0, 0.35) !important;
    }

    body.dark-mode a:not(.text-blue-600):not(.text-red-500) {
      color: #cbd5e1;
    }
  `;

  document.head.appendChild(darkModeStyles);

  /* =========================================================
     IDENTIFICATION AUTOMATIQUE DES BULLES
  ========================================================= */

  function identifyMessageBubbles() {
    const messagesContainer =
      document.getElementById("messagesContainer");

    if (!messagesContainer) return;

    const wrappers =
      messagesContainer.querySelectorAll(":scope > div.flex");

    wrappers.forEach((wrapper) => {
      const bubble = wrapper.firstElementChild;

      if (!bubble) return;

      bubble.classList.remove(
        "message-sent",
        "message-received"
      );

      if (wrapper.classList.contains("justify-end")) {
        bubble.classList.add("message-sent");
      }

      if (wrapper.classList.contains("justify-start")) {
        bubble.classList.add("message-received");
      }
    });
  }

  function watchMessages() {
    const messagesContainer =
      document.getElementById("messagesContainer");

    if (!messagesContainer) return;

    identifyMessageBubbles();

    const observer = new MutationObserver(() => {
      identifyMessageBubbles();
    });

    observer.observe(messagesContainer, {
      childList: true,
      subtree: true,
    });
  }

  /* =========================================================
     APPLICATION DU THÈME
  ========================================================= */

  function applyTheme(theme) {
    const isDark = theme === "dark";

    document.body.classList.toggle(
      "dark-mode",
      isDark
    );

    const themeIcon =
      document.getElementById("themeIcon");

    if (themeIcon) {
      themeIcon.className = isDark
        ? "fa-solid fa-sun"
        : "fa-solid fa-moon";
    }

    identifyMessageBubbles();
  }

  function toggleTheme() {
    const isDark =
      document.body.classList.contains("dark-mode");

    const nextTheme = isDark
      ? "light"
      : "dark";

    localStorage.setItem(
      THEME_STORAGE_KEY,
      nextTheme
    );

    applyTheme(nextTheme);
  }

  /* =========================================================
     DÉMARRAGE
  ========================================================= */

  function initializeTheme() {
    const themeButton = createThemeButton();

    const savedTheme =
      localStorage.getItem(THEME_STORAGE_KEY) ||
      "light";

    applyTheme(savedTheme);

    themeButton.addEventListener(
      "click",
      toggleTheme
    );

    watchMessages();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeTheme
    );
  } else {
    initializeTheme();
  }
})();
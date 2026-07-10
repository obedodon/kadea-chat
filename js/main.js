function protectPage() {
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

protectPage();

// UTILISATEUR CONNECTÉ
async function showConnectedUserName() {
  const connectedUserName = document.getElementById("connectedUserName");

  if (!connectedUserName) return;

  try {
    connectedUserName.textContent = "";

    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const result = await response.json();
    console.log("Utilisateur connecté :", result);

    if (!response.ok || !result.success) {
      localStorage.removeItem("user");
      connectedUserName.textContent = "Utilisateur";
      return;
    }

    const user = result.data?.user || result.data;

    localStorage.removeItem("user");
    localStorage.setItem("user", JSON.stringify(user));

    connectedUserName.textContent =
      user.fullName || user.name || "Utilisateur";
  } catch (error) {
    console.error(error);
    connectedUserName.textContent = "Utilisateur";
  }
}

showConnectedUserName();

// MENU ⋮
const chatMenuBtn = document.getElementById("chatMenuBtn");
const chatMenu = document.getElementById("chatMenu");

chatMenuBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  chatMenu?.classList.toggle("hidden");
});

document.addEventListener("click", () => {
  chatMenu?.classList.add("hidden");
});

// MODALE UI
const uiModal = document.getElementById("uiModal");
const uiModalIcon = document.getElementById("uiModalIcon");
const uiModalTitle = document.getElementById("uiModalTitle");
const uiModalText = document.getElementById("uiModalText");
const closeUiModal = document.getElementById("closeUiModal");

function openUiModal(icon, title, text) {
  if (!uiModal) return;

  uiModalIcon.textContent = icon;
  uiModalTitle.textContent = title;
  uiModalText.textContent = text;

  uiModal.classList.remove("hidden");
  uiModal.classList.add("flex");
}

function closeModal() {
  uiModal?.classList.add("hidden");
  uiModal?.classList.remove("flex");
}

closeUiModal?.addEventListener("click", closeModal);

uiModal?.addEventListener("click", (event) => {
  if (event.target === uiModal) closeModal();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeModal();
});

// APPEL VIDÉO
document.getElementById("videoCallBtn")?.addEventListener("click", () => {
  openUiModal(
    "📹",
    "Appel vidéo",
    "Cette fonctionnalité sera disponible prochainement."
  );
});

// APPEL AUDIO
document.getElementById("audioCallBtn")?.addEventListener("click", () => {
  openUiModal(
    "📞",
    "Appel audio",
    "Cette fonctionnalité sera disponible prochainement."
  );
});

// EFFACER CONVERSATION
document.getElementById("clearConversationBtn")?.addEventListener("click", () => {
  chatMenu?.classList.add("hidden");
  openUiModal(
    "🧹",
    "Effacer la conversation",
    "Cette fonctionnalité sera connectée plus tard."
  );
});

// MODE SOMBRE
const darkStyle = document.createElement("style");
darkStyle.textContent = `
  body.dark-mode,
  body.dark-mode .bg-slate-50,
  body.dark-mode .bg-slate-100 {
    background: #0f172a !important;
    color: white !important;
  }

  body.dark-mode aside,
  body.dark-mode section,
  body.dark-mode header,
  body.dark-mode footer,
  body.dark-mode .bg-white {
    background: #1e293b !important;
    color: white !important;
    border-color: #334155 !important;
  }

  body.dark-mode input {
    background: #334155 !important;
    color: white !important;
  }

  body.dark-mode input::placeholder {
    color: #cbd5e1 !important;
  }

  body.dark-mode .text-slate-900,
  body.dark-mode .text-slate-700,
  body.dark-mode .text-slate-500,
  body.dark-mode .text-slate-400 {
    color: white !important;
  }
`;
document.head.appendChild(darkStyle);

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

function applyTheme() {
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    if (themeIcon) themeIcon.className = "fa-solid fa-sun";
  } else {
    document.body.classList.remove("dark-mode");
    if (themeIcon) themeIcon.className = "fa-solid fa-moon";
  }
}

themeToggle?.addEventListener("click", () => {
  const isDark = localStorage.getItem("theme") === "dark";
  localStorage.setItem("theme", isDark ? "light" : "dark");
  applyTheme();
});

applyTheme();
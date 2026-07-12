/* ==================================================
   PROTECTION DE LA PAGE
================================================== */

function protectPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

protectPage();

/* ==================================================
   UTILISATEUR CONNECTÉ
================================================== */

function getConnectedUser() {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser || storedUser === "undefined") {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Erreur utilisateur :", error);
    return null;
  }
}

function displayConnectedUser() {
  const connectedUserNameElement =
    document.getElementById("connectedUserName");

  const user = getConnectedUser();

  if (!connectedUserNameElement) {
    return;
  }

  connectedUserNameElement.textContent =
    user?.fullName ||
    user?.name ||
    user?.username ||
    "Utilisateur";
}

displayConnectedUser();

/* ==================================================
   ÉLÉMENTS DE L’INTERFACE
================================================== */

const videoCallButton =
  document.getElementById("videoCallBtn");

const audioCallButton =
  document.getElementById("audioCallBtn");

const chatMenuButton =
  document.getElementById("chatMenuBtn");

const chatMenuElement =
  document.getElementById("chatMenu");

const clearConversationButton =
  document.getElementById("clearConversationBtn");

const interfaceModal =
  document.getElementById("uiModal");

const interfaceModalIcon =
  document.getElementById("uiModalIcon");

const interfaceModalTitle =
  document.getElementById("uiModalTitle");

const interfaceModalText =
  document.getElementById("uiModalText");

const closeInterfaceModalButton =
  document.getElementById("closeUiModal");

/* ==================================================
   MODALE SIMPLE
================================================== */

function openUiModal(icon, title, text) {
  if (!interfaceModal) {
    return;
  }

  if (interfaceModalIcon) {
    interfaceModalIcon.textContent = icon;
  }

  if (interfaceModalTitle) {
    interfaceModalTitle.textContent = title;
  }

  if (interfaceModalText) {
    interfaceModalText.textContent = text;
  }

  interfaceModal.classList.remove("hidden");
  interfaceModal.classList.add("flex");
}

function closeUiModalBox() {
  if (!interfaceModal) {
    return;
  }

  interfaceModal.classList.add("hidden");
  interfaceModal.classList.remove("flex");
}

closeInterfaceModalButton?.addEventListener(
  "click",
  closeUiModalBox
);

interfaceModal?.addEventListener("click", (event) => {
  if (event.target === interfaceModal) {
    closeUiModalBox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeUiModalBox();
    chatMenuElement?.classList.add("hidden");
  }
});

/* ==================================================
   APPELS
================================================== */

videoCallButton?.addEventListener("click", () => {
  openUiModal(
    "📹",
    "Appel vidéo",
    "Cette fonctionnalité sera disponible prochainement."
  );
});

audioCallButton?.addEventListener("click", () => {
  openUiModal(
    "📞",
    "Appel audio",
    "Cette fonctionnalité sera disponible prochainement."
  );
});

/* ==================================================
   MENU TROIS POINTS
================================================== */

chatMenuButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  chatMenuElement?.classList.toggle("hidden");
});

chatMenuElement?.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  chatMenuElement?.classList.add("hidden");
});

/* ==================================================
   REMISE À ZÉRO APRÈS SUPPRESSION
================================================== */

function resetChatInterface() {
  const chatNameElement =
    document.getElementById("chatName");

  const chatAvatarElement =
    document.getElementById("chatAvatar");

  const messagesAreaElement =
    document.getElementById("messagesContainer");

  const messageFieldElement =
    document.getElementById("messageInput");

  if (chatNameElement) {
    chatNameElement.textContent =
      "Sélectionne une conversation";
  }

  if (chatAvatarElement) {
    chatAvatarElement.innerHTML = "";
    chatAvatarElement.textContent = "KC";
  }

  if (messagesAreaElement) {
    messagesAreaElement.innerHTML = `
      <div class="h-full flex items-center justify-center text-slate-400">
        Clique sur une conversation pour afficher les messages.
      </div>
    `;
  }

  if (messageFieldElement) {
    messageFieldElement.value = "";
  }

  window.activeConversationId = null;

  if (
    typeof window.clearSelectedConversation === "function"
  ) {
    window.clearSelectedConversation();
  }
}

/* ==================================================
   SUPPRESSION D’UNE CONVERSATION
================================================== */

async function deleteSelectedConversation() {
  const conversationId =
    window.activeConversationId;

  if (!conversationId) {
    openUiModal(
      "⚠️",
      "Aucune conversation sélectionnée",
      "Sélectionne d’abord une conversation."
    );

    return;
  }

  const confirmation = window.confirm(
    "Veux-tu vraiment supprimer cette conversation ?"
  );

  if (!confirmation) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    const responseText = await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(responseText);
      } catch {
        result = null;
      }
    }

    if (!response.ok) {
      openUiModal(
        "❌",
        "Suppression impossible",
        result?.message ||
          "Impossible de supprimer cette conversation."
      );

      return;
    }

    resetChatInterface();

    if (
      typeof window.loadConversations === "function"
    ) {
      await window.loadConversations();
    }

    openUiModal(
      "✅",
      "Conversation supprimée",
      "La conversation a été supprimée."
    );
  } catch (error) {
    console.error("Erreur suppression :", error);

    openUiModal(
      "❌",
      "Erreur réseau",
      "Impossible de supprimer la conversation."
    );
  }
}

clearConversationButton?.addEventListener(
  "click",
  async () => {
    chatMenuElement?.classList.add("hidden");
    await deleteSelectedConversation();
  }
);
/* ==================================================
   PARAMÈTRES
================================================== */

const settingsButton =
  document.getElementById("settingsBtn");

const settingsModal =
  document.getElementById("settingsModal");

const closeSettingsModalButton =
  document.getElementById("closeSettingsModal");

const settingsThemeButton =
  document.getElementById("settingsThemeBtn");

const settingsThemeIcon =
  document.getElementById("settingsThemeIcon");

const settingsThemeText =
  document.getElementById("settingsThemeText");

const settingsNotificationsButton =
  document.getElementById("settingsNotificationsBtn");

const settingsNotificationsText =
  document.getElementById("settingsNotificationsText");

const settingsNotificationsSwitch =
  document.getElementById("settingsNotificationsSwitch");

const settingsNotificationsCircle =
  document.getElementById("settingsNotificationsCircle");

function openSettingsModal() {
  settingsModal?.classList.remove("hidden");
  settingsModal?.classList.add("flex");

  updateSettingsThemeDisplay();
  updateNotificationsDisplay();
}

function closeSettingsModalBox() {
  settingsModal?.classList.add("hidden");
  settingsModal?.classList.remove("flex");
}

function updateSettingsThemeDisplay() {
  const isDark =
    document.body.classList.contains("dark-mode");

  if (settingsThemeIcon) {
    settingsThemeIcon.className = isDark
      ? "fa-solid fa-sun"
      : "fa-solid fa-moon";
  }

  if (settingsThemeText) {
    settingsThemeText.textContent = isDark
      ? "Passer en mode clair"
      : "Passer en mode sombre";
  }
}

function toggleSettingsTheme() {
  const mainThemeButton =
    document.getElementById("themeToggle");

  mainThemeButton?.click();

  setTimeout(() => {
    updateSettingsThemeDisplay();
  }, 50);
}

function getNotificationsEnabled() {
  const savedValue =
    localStorage.getItem("notificationsEnabled");

  return savedValue !== "false";
}

function updateNotificationsDisplay() {
  const enabled =
    getNotificationsEnabled();

  if (settingsNotificationsText) {
    settingsNotificationsText.textContent = enabled
      ? "Activées"
      : "Désactivées";
  }

  if (settingsNotificationsSwitch) {
    settingsNotificationsSwitch.className = enabled
      ? "relative h-6 w-11 rounded-full bg-blue-600 transition"
      : "relative h-6 w-11 rounded-full bg-slate-400 transition";
  }

  if (settingsNotificationsCircle) {
    settingsNotificationsCircle.className = enabled
      ? "absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition"
      : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition";
  }
}

function toggleNotifications() {
  const nextValue =
    !getNotificationsEnabled();

  localStorage.setItem(
    "notificationsEnabled",
    String(nextValue)
  );

  updateNotificationsDisplay();
}

settingsButton?.addEventListener(
  "click",
  openSettingsModal
);

closeSettingsModalButton?.addEventListener(
  "click",
  closeSettingsModalBox
);

settingsThemeButton?.addEventListener(
  "click",
  toggleSettingsTheme
);

settingsNotificationsButton?.addEventListener(
  "click",
  toggleNotifications
);

settingsModal?.addEventListener(
  "click",
  (event) => {
    if (event.target === settingsModal) {
      closeSettingsModalBox();
    }
  }
);

document.addEventListener(
  "keydown",
  (event) => {
    if (event.key === "Escape") {
      closeSettingsModalBox();
    }
  }
);

updateNotificationsDisplay();
/* ==================================================
   NAVIGATION RESPONSIVE
================================================== */

const responsiveBackButton =
  document.getElementById("backToConversations");

const responsiveChatPanel =
  document.getElementById("chatPanel");

const responsiveConversationPanel =
  document.getElementById("conversationPanel");

function isResponsiveSinglePanel() {
  return window.innerWidth < 1024;
}

function openResponsiveChatView() {
  if (!isResponsiveSinglePanel()) {
    return;
  }

  document.body.classList.add(
    "mobile-chat-open"
  );

  responsiveChatPanel?.setAttribute(
    "aria-hidden",
    "false"
  );

  responsiveConversationPanel?.setAttribute(
    "aria-hidden",
    "true"
  );
}

function closeResponsiveChatView() {
  document.body.classList.remove(
    "mobile-chat-open"
  );

  responsiveChatPanel?.setAttribute(
    "aria-hidden",
    "true"
  );

  responsiveConversationPanel?.setAttribute(
    "aria-hidden",
    "false"
  );

  if (
    typeof chatMenuElement !== "undefined"
  ) {
    chatMenuElement?.classList.add(
      "hidden"
    );
  }
}

responsiveBackButton?.addEventListener(
  "click",
  closeResponsiveChatView
);

window.openResponsiveChat =
  openResponsiveChatView;

window.closeResponsiveChat =
  closeResponsiveChatView;

window.addEventListener(
  "resize",
  () => {
    if (!isResponsiveSinglePanel()) {
      document.body.classList.remove(
        "mobile-chat-open"
      );

      responsiveChatPanel?.setAttribute(
        "aria-hidden",
        "false"
      );

      responsiveConversationPanel?.setAttribute(
        "aria-hidden",
        "false"
      );
    }
  }
);

if (isResponsiveSinglePanel()) {
  responsiveChatPanel?.setAttribute(
    "aria-hidden",
    "true"
  );

  responsiveConversationPanel?.setAttribute(
    "aria-hidden",
    "false"
  );
}
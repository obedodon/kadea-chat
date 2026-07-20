(() => {
  "use strict";

  /* ==================================================
     OUTILS
  ================================================== */

  const $ = (id) => document.getElementById(id);

  const STORAGE_KEYS = Object.freeze({
    TOKEN: "token",
    USER: "user",
    NOTIFICATIONS: "notificationsEnabled",
  });

  const elements = {
    connectedUserName: $("connectedUserName"),

    videoCallBtn: $("videoCallBtn"),
    audioCallBtn: $("audioCallBtn"),

    chatMenuBtn: $("chatMenuBtn"),
    chatMenu: $("chatMenu"),
    clearConversationBtn: $("clearConversationBtn"),

    uiModal: $("uiModal"),
    uiModalIcon: $("uiModalIcon"),
    uiModalTitle: $("uiModalTitle"),
    uiModalText: $("uiModalText"),
    closeUiModal: $("closeUiModal"),

    settingsBtn: $("settingsBtn"),
    settingsModal: $("settingsModal"),
    closeSettingsModal: $("closeSettingsModal"),

    settingsThemeBtn: $("settingsThemeBtn"),
    settingsThemeIcon: $("settingsThemeIcon"),
    settingsThemeText: $("settingsThemeText"),

    settingsNotificationsBtn: $("settingsNotificationsBtn"),
    settingsNotificationsText: $("settingsNotificationsText"),
    settingsNotificationsSwitch: $("settingsNotificationsSwitch"),
    settingsNotificationsCircle: $("settingsNotificationsCircle"),

    backToConversations: $("backToConversations"),
    chatPanel: $("chatPanel"),
    conversationPanel: $("conversationPanel"),

    chatName: $("chatName"),
    chatAvatar: $("chatAvatar"),
    messagesContainer: $("messagesContainer"),
    messageInput: $("messageInput"),
  };

  function showElement(element, displayClass = "flex") {
    if (!element) return;

    element.classList.remove("hidden");
    element.classList.add(displayClass);
  }

  function hideElement(element, displayClass = "flex") {
    if (!element) return;

    element.classList.add("hidden");
    element.classList.remove(displayClass);
  }

  function getStoredUser() {
    try {
      const value = localStorage.getItem(STORAGE_KEYS.USER);

      if (!value || value === "undefined") {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      console.error(
        "Impossible de lire l’utilisateur enregistré :",
        error
      );

      return null;
    }
  }

  function getConnectedUserName() {
    const user = getStoredUser();

    return (
      user?.fullName ||
      user?.name ||
      user?.username ||
      "Utilisateur"
    );
  }

  /* ==================================================
     SESSION
  ================================================== */

  function protectPage() {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (!token) {
      window.location.replace("login.html");
      return false;
    }

    return true;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    window.location.replace("login.html");
  }

  function displayConnectedUser() {
    if (!elements.connectedUserName) return;

    elements.connectedUserName.textContent =
      getConnectedUserName();
  }

  /* ==================================================
     MODALE D’INFORMATION
  ================================================== */

  function openUiModal(icon, title, text) {
    if (!elements.uiModal) return;

    if (elements.uiModalIcon) {
      elements.uiModalIcon.textContent = icon;
    }

    if (elements.uiModalTitle) {
      elements.uiModalTitle.textContent = title;
    }

    if (elements.uiModalText) {
      elements.uiModalText.textContent = text;
    }

    showElement(elements.uiModal);
  }

  function closeUiModal() {
    hideElement(elements.uiModal);
  }

  /* ==================================================
     APPELS SIMULÉS
  ================================================== */

  function simulateCall(type) {
    const isVideo = type === "video";

    openUiModal(
      isVideo ? "📹" : "📞",
      isVideo ? "Appel vidéo" : "Appel audio",
      "Cette fonctionnalité sera disponible prochainement."
    );
  }

  /* ==================================================
     MENU DE CONVERSATION
  ================================================== */

  function toggleChatMenu(event) {
    event?.stopPropagation();

    elements.chatMenu?.classList.toggle("hidden");
  }

  function closeChatMenu() {
    elements.chatMenu?.classList.add("hidden");
  }

  /* ==================================================
     RÉINITIALISATION DU CHAT
  ================================================== */

  function resetChatInterface() {
    if (elements.chatName) {
      elements.chatName.textContent =
        "Sélectionne une conversation";
    }

    if (elements.chatAvatar) {
      elements.chatAvatar.innerHTML = "";
      elements.chatAvatar.textContent = "KC";
    }

    if (elements.messagesContainer) {
      elements.messagesContainer.innerHTML = `
        <div
          class="flex h-full items-center justify-center px-4 text-center text-slate-400"
        >
          Clique sur une conversation pour afficher les messages.
        </div>
      `;
    }

    if (elements.messageInput) {
      elements.messageInput.value = "";
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

  async function deleteConversationRequest(conversationId) {
    if (
      typeof window.KadeaAPI?.delete === "function"
    ) {
      return window.KadeaAPI.delete(
        `/conversations/${conversationId}`
      );
    }

    const response = await fetch(
      `${API_URL}/conversations/${conversationId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    const result = await response
      .json()
      .catch(() => null);

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      logout();
      throw new Error("Ta session a expiré.");
    }

    if (!response.ok || result?.success === false) {
      throw new Error(
        result?.message ||
        "Impossible de supprimer cette conversation."
      );
    }

    return result;
  }

  async function deleteSelectedConversation() {
    const conversationId =
      window.activeConversationId;

    closeChatMenu();

    if (!conversationId) {
      openUiModal(
        "⚠️",
        "Aucune conversation sélectionnée",
        "Sélectionne d’abord une conversation."
      );

      return;
    }

    const confirmed = window.confirm(
      "Veux-tu vraiment supprimer cette conversation ?"
    );

    if (!confirmed) return;

    if (elements.clearConversationBtn) {
      elements.clearConversationBtn.disabled = true;
    }

    try {
      await deleteConversationRequest(conversationId);

      resetChatInterface();

      if (
        typeof window.loadConversations === "function"
      ) {
        await window.loadConversations();
      }

      openUiModal(
        "✅",
        "Conversation supprimée",
        "La conversation a été supprimée avec succès."
      );
    } catch (error) {
      console.error(
        "Erreur lors de la suppression :",
        error
      );

      openUiModal(
        "❌",
        "Suppression impossible",
        error.message ||
          "Une erreur est survenue pendant la suppression."
      );
    } finally {
      if (elements.clearConversationBtn) {
        elements.clearConversationBtn.disabled = false;
      }
    }
  }

  /* ==================================================
     PARAMÈTRES
  ================================================== */

  function getCurrentTheme() {
    if (
      typeof window.KadeaTheme?.current === "function"
    ) {
      return window.KadeaTheme.current();
    }

    return document.documentElement.classList.contains(
      "dark"
    )
      ? "dark"
      : "light";
  }

  function updateSettingsThemeDisplay() {
    const isDark = getCurrentTheme() === "dark";

    if (elements.settingsThemeIcon) {
      elements.settingsThemeIcon.className = isDark
        ? "fa-solid fa-sun"
        : "fa-solid fa-moon";
    }

    if (elements.settingsThemeText) {
      elements.settingsThemeText.textContent = isDark
        ? "Passer en mode clair"
        : "Passer en mode sombre";
    }
  }

  function toggleSettingsTheme() {
    if (
      typeof window.KadeaTheme?.toggle === "function"
    ) {
      window.KadeaTheme.toggle();
    } else {
      document.documentElement.classList.toggle(
        "dark"
      );
    }

    updateSettingsThemeDisplay();
  }

  function getNotificationsEnabled() {
    return (
      localStorage.getItem(
        STORAGE_KEYS.NOTIFICATIONS
      ) !== "false"
    );
  }

  function updateNotificationsDisplay() {
    const enabled = getNotificationsEnabled();

    if (elements.settingsNotificationsText) {
      elements.settingsNotificationsText.textContent =
        enabled ? "Activées" : "Désactivées";
    }

    if (elements.settingsNotificationsSwitch) {
      elements.settingsNotificationsSwitch.className =
        enabled
          ? "relative h-6 w-11 rounded-full bg-blue-600 transition"
          : "relative h-6 w-11 rounded-full bg-slate-400 transition";
    }

    if (elements.settingsNotificationsCircle) {
      elements.settingsNotificationsCircle.className =
        enabled
          ? "absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition"
          : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition";
    }

    elements.settingsNotificationsBtn?.setAttribute(
      "aria-pressed",
      String(enabled)
    );
  }

  function toggleNotifications() {
    const nextValue = !getNotificationsEnabled();

    localStorage.setItem(
      STORAGE_KEYS.NOTIFICATIONS,
      String(nextValue)
    );

    updateNotificationsDisplay();
  }

  function openSettingsModal() {
    showElement(elements.settingsModal);

    updateSettingsThemeDisplay();
    updateNotificationsDisplay();
  }

  function closeSettingsModal() {
    hideElement(elements.settingsModal);
  }

  /* ==================================================
     RESPONSIVE
  ================================================== */

  function isSinglePanelMode() {
    return window.innerWidth < 1024;
  }

  function openResponsiveChatView() {
    if (!isSinglePanelMode()) return;

    document.body.classList.add(
      "mobile-chat-open"
    );

    elements.chatPanel?.setAttribute(
      "aria-hidden",
      "false"
    );

    elements.conversationPanel?.setAttribute(
      "aria-hidden",
      "true"
    );
  }

  function closeResponsiveChatView() {
    document.body.classList.remove(
      "mobile-chat-open"
    );

    elements.chatPanel?.setAttribute(
      "aria-hidden",
      "true"
    );

    elements.conversationPanel?.setAttribute(
      "aria-hidden",
      "false"
    );

    closeChatMenu();
  }

  function updateResponsiveLayout() {
    const isMobile = isSinglePanelMode();
    const chatIsOpen =
      document.body.classList.contains(
        "mobile-chat-open"
      );

    if (!isMobile) {
      document.body.classList.remove(
        "mobile-chat-open"
      );

      elements.chatPanel?.setAttribute(
        "aria-hidden",
        "false"
      );

      elements.conversationPanel?.setAttribute(
        "aria-hidden",
        "false"
      );

      return;
    }

    elements.chatPanel?.setAttribute(
      "aria-hidden",
      chatIsOpen ? "false" : "true"
    );

    elements.conversationPanel?.setAttribute(
      "aria-hidden",
      chatIsOpen ? "true" : "false"
    );
  }

  /* ==================================================
     GESTION GLOBALE DES FERMETURES
  ================================================== */

  function handleDocumentClick(event) {
    if (
      elements.chatMenu &&
      !elements.chatMenu.contains(event.target) &&
      !elements.chatMenuBtn?.contains(event.target)
    ) {
      closeChatMenu();
    }
  }

  function handleOverlayClick(event) {
    if (event.target === elements.uiModal) {
      closeUiModal();
    }

    if (event.target === elements.settingsModal) {
      closeSettingsModal();
    }
  }

  function handleEscapeKey(event) {
    if (event.key !== "Escape") return;

    closeUiModal();
    closeSettingsModal();
    closeChatMenu();
  }

  /* ==================================================
     ÉVÉNEMENTS
  ================================================== */

  function bindEvents() {
    elements.closeUiModal?.addEventListener(
      "click",
      closeUiModal
    );

    elements.uiModal?.addEventListener(
      "click",
      handleOverlayClick
    );

    elements.videoCallBtn?.addEventListener(
      "click",
      () => simulateCall("video")
    );

    elements.audioCallBtn?.addEventListener(
      "click",
      () => simulateCall("audio")
    );

    elements.chatMenuBtn?.addEventListener(
      "click",
      toggleChatMenu
    );

    elements.chatMenu?.addEventListener(
      "click",
      (event) => event.stopPropagation()
    );

    elements.clearConversationBtn?.addEventListener(
      "click",
      deleteSelectedConversation
    );

    elements.settingsBtn?.addEventListener(
      "click",
      openSettingsModal
    );

    elements.closeSettingsModal?.addEventListener(
      "click",
      closeSettingsModal
    );

    elements.settingsModal?.addEventListener(
      "click",
      handleOverlayClick
    );

    elements.settingsThemeBtn?.addEventListener(
      "click",
      toggleSettingsTheme
    );

    elements.settingsNotificationsBtn?.addEventListener(
      "click",
      toggleNotifications
    );

    elements.backToConversations?.addEventListener(
      "click",
      closeResponsiveChatView
    );

    document.addEventListener(
      "click",
      handleDocumentClick
    );

    document.addEventListener(
      "keydown",
      handleEscapeKey
    );

    window.addEventListener(
      "resize",
      updateResponsiveLayout
    );

    window.addEventListener(
      "kadea:themechange",
      updateSettingsThemeDisplay
    );
  }

  /* ==================================================
     INITIALISATION
  ================================================== */

  function initialize() {
    if (!protectPage()) return;

    displayConnectedUser();
    updateNotificationsDisplay();
    updateSettingsThemeDisplay();
    updateResponsiveLayout();
    bindEvents();
  }

  window.MainApp = Object.freeze({
    logout,
    openUiModal,
    closeUiModal,
    resetChatInterface,
    deleteSelectedConversation,
    openSettingsModal,
    closeSettingsModal,
    openResponsiveChatView,
    closeResponsiveChatView,
  });

  window.logout = logout;
  window.openResponsiveChat =
    openResponsiveChatView;
  window.closeResponsiveChat =
    closeResponsiveChatView;

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initialize,
      {
        once: true,
      }
    );
  } else {
    initialize();
  }
})();
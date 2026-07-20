(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const el = {
    conversationsList: $("conversationsList"),
    searchConversation: $("searchConversation"),

    newConversationModal: $("newConversationModal"),
    openNewConversationModal: $("openNewConversationModal"),
    closeNewConversationModal: $("closeNewConversationModal"),

    privateConversationTab: $("privateConversationTab"),
    groupConversationTab: $("groupConversationTab"),
    privateConversationSection: $("privateConversationSection"),
    groupConversationSection: $("groupConversationSection"),

    usersList: $("usersList"),
    groupUsersList: $("groupUsersList"),
    searchPrivateUser: $("searchPrivateUser"),
    searchGroupUser: $("searchGroupUser"),

    groupName: $("groupName"),
    groupAvatarUrl: $("groupAvatarUrl"),
    selectedGroupCount: $("selectedGroupCount"),
    groupCreationMessage: $("groupCreationMessage"),
    createGroupConversationBtn: $("createGroupConversationBtn"),

    conversationAvatarModal: $("conversationAvatarModal"),
    conversationBigAvatar: $("conversationBigAvatar"),
    conversationAvatarName: $("conversationAvatarName"),
    closeConversationAvatarModal: $("closeConversationAvatarModal"),

    chatName: $("chatName"),
    chatAvatar: $("chatAvatar"),
    chatStatus: $("chatStatus"),
  };

  const state = {
    conversations: [],
    users: [],
    activeId: null,
    selectedGroupUserIds: new Set(),
    loadingConversations: false,
  };

  window.activeConversationId = null;

  /* =========================================================
     OUTILS
  ========================================================= */

  const escapeHtml = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const normalize = (value) =>
    String(value ?? "").trim().toLowerCase();

  const setModalVisibility = (modal, visible) => {
    if (!modal) return;
    modal.classList.toggle("hidden", !visible);
    modal.classList.toggle("flex", visible);
  };

  const showListMessage = (container, message, type = "muted") => {
    if (!container) return;

    const color =
      type === "error"
        ? "text-red-500"
        : type === "success"
          ? "text-green-600"
          : "text-slate-500";

    container.innerHTML = `
      <p class="p-4 text-sm ${color}">
        ${escapeHtml(message)}
      </p>
    `;
  };

  const parseStoredUser = () => {
    try {
      const value = localStorage.getItem("user");
      return value && value !== "undefined" ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  };

  const getInitials = (name) =>
    normalize(name)
      ? String(name)
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((word) => word[0])
          .join("")
          .toUpperCase()
      : "KC";

  const extractCollection = (result, key) => {
    const candidates = [
      result?.data?.[key],
      result?.data,
      result?.[key],
    ];

    return candidates.find(Array.isArray) || [];
  };

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (response.status === 401 || response.status === 403) {
      window.logout?.();
      throw new Error("Ta session a expiré.");
    }

    if (!response.ok || result.success === false) {
      throw new Error(result.message || "Une erreur est survenue.");
    }

    return result;
  }

  /* =========================================================
     INFORMATIONS D’UNE CONVERSATION
  ========================================================= */

  function getOtherParticipant(conversation) {
    const currentUserId = parseStoredUser()?.id;
    const participants = Array.isArray(conversation?.participants)
      ? conversation.participants
      : [];

    return (
      participants.find((participant) => {
        const userId = participant?.user?.id || participant?.id;
        return userId && userId !== currentUserId;
      }) ||
      participants[0] ||
      null
    );
  }

  function getParticipantUser(participant) {
    return participant?.user || participant || {};
  }

  function getConversationName(conversation) {
    if (conversation?.type === "private") {
      const user = getParticipantUser(getOtherParticipant(conversation));

      return (
        user.fullName ||
        user.name ||
        conversation.name ||
        "Utilisateur"
      );
    }

    return conversation?.name || conversation?.title || "Groupe";
  }

  function getConversationAvatar(conversation) {
    if (conversation?.type === "private") {
      const user = getParticipantUser(getOtherParticipant(conversation));
      return user.avatarUrl || user.avatar || null;
    }

    return conversation?.avatarUrl || conversation?.imageUrl || null;
  }

  function getLastMessage(conversation) {
    if (conversation?.lastMessage) return conversation.lastMessage;

    const messages = Array.isArray(conversation?.messages)
      ? conversation.messages
      : [];

    return messages.at(-1) || null;
  }

  function getLastMessagePreview(conversation) {
    const message = getLastMessage(conversation);
    const content = message?.content || message?.text;

    if (!content) return "Aucun message pour le moment";

    if (conversation?.type !== "group") return content;

    const sender =
      message?.sender?.fullName ||
      message?.sender?.name ||
      message?.user?.fullName ||
      message?.user?.name ||
      message?.senderName;

    return sender ? `${sender} : ${content}` : content;
  }

  function getActivityTimestamp(conversation) {
    const message = getLastMessage(conversation);
    const value =
      message?.createdAt ||
      conversation?.updatedAt ||
      conversation?.createdAt;

    const timestamp = new Date(value || 0).getTime();
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  function formatConversationTime(conversation) {
    const timestamp = getActivityTimestamp(conversation);
    if (!timestamp) return "";

    const date = new Date(timestamp);
    const today = new Date();

    return date.toDateString() === today.toDateString()
      ? date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : date.toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "2-digit",
        });
  }

  /* =========================================================
     PHOTO DE CONVERSATION
  ========================================================= */

  function openConversationAvatar(avatarUrl, initials, name) {
    if (!el.conversationAvatarModal || !el.conversationBigAvatar) return;

    if (el.conversationAvatarName) {
      el.conversationAvatarName.textContent = name;
    }

    el.conversationBigAvatar.innerHTML = avatarUrl
      ? `
        <img
          src="${escapeHtml(avatarUrl)}"
          alt="${escapeHtml(name)}"
          class="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
        >
      `
      : `
        <div class="flex h-72 w-72 items-center justify-center rounded-full bg-blue-100 text-7xl font-bold text-blue-600">
          ${escapeHtml(initials)}
        </div>
      `;

    setModalVisibility(el.conversationAvatarModal, true);
  }

  function closeConversationAvatar() {
    setModalVisibility(el.conversationAvatarModal, false);
  }

  /* =========================================================
     AFFICHAGE DES CONVERSATIONS
  ========================================================= */

  function updateChatHeader(conversation) {
    const name = getConversationName(conversation);
    const avatarUrl = getConversationAvatar(conversation);
    const initials = getInitials(name);
    const isGroup = conversation.type === "group";

    if (el.chatName) el.chatName.textContent = name;

    if (el.chatStatus) {
      el.chatStatus.textContent = isGroup
        ? `${conversation.participants?.length || 0} participant(s)`
        : "● En ligne";

      el.chatStatus.className = isGroup
        ? "text-xs text-slate-500 dark:text-slate-300"
        : "text-xs text-green-600";
    }

    if (el.chatAvatar) {
      el.chatAvatar.innerHTML = avatarUrl
        ? `
          <img
            src="${escapeHtml(avatarUrl)}"
            alt="${escapeHtml(name)}"
            class="h-full w-full object-cover"
          >
        `
        : escapeHtml(initials);
    }
  }

  function selectConversation(conversation) {
    state.activeId = conversation.id;
    window.activeConversationId = conversation.id;

    updateChatHeader(conversation);
    renderConversations(getFilteredConversations());

    window.openResponsiveChat?.();
    window.loadMessages?.(conversation.id);
  }

  function createConversationCard(conversation) {
    const name = getConversationName(conversation);
    const avatarUrl = getConversationAvatar(conversation);
    const initials = getInitials(name);
    const isGroup = conversation.type === "group";
    const isActive = state.activeId === conversation.id;

    const article = document.createElement("article");
    article.className = `
      conversation-item cursor-pointer border-b border-slate-200 p-3
      transition hover:bg-slate-100 sm:p-4 dark:border-slate-700
      dark:hover:bg-slate-700
      ${isActive
        ? "bg-blue-50 dark:bg-slate-700"
        : "bg-white dark:bg-slate-800"}
    `;

    article.dataset.conversationId = conversation.id;
    article.setAttribute("role", "button");
    article.setAttribute("tabindex", "0");
    article.setAttribute("aria-label", `Ouvrir la conversation avec ${name}`);

    article.innerHTML = `
      <div class="flex items-center gap-3">
        <button
          type="button"
          class="conversation-avatar relative flex h-11 w-11 shrink-0
                 items-center justify-center overflow-hidden rounded-full
                 bg-blue-100 font-bold text-blue-700 transition
                 hover:scale-105 hover:ring-4 hover:ring-blue-200 sm:h-12 sm:w-12"
          aria-label="Voir la photo de ${escapeHtml(name)}"
        >
          ${
            avatarUrl
              ? `
                <img
                  src="${escapeHtml(avatarUrl)}"
                  alt="${escapeHtml(name)}"
                  class="h-full w-full object-cover"
                >
              `
              : escapeHtml(initials)
          }
          ${
            isGroup
              ? `
                <span class="absolute bottom-0 right-0 flex h-4 w-4 items-center
                             justify-center rounded-full bg-blue-600 text-[8px] text-white">
                  <i class="fa-solid fa-user-group"></i>
                </span>
              `
              : ""
          }
        </button>

        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <h3 class="truncate text-sm font-semibold text-slate-900
                       sm:text-base dark:text-white">
              ${escapeHtml(name)}
            </h3>
            <span class="shrink-0 text-[10px] text-blue-500
                         sm:text-xs dark:text-blue-300">
              ${escapeHtml(formatConversationTime(conversation))}
            </span>
          </div>

          <p class="mt-0.5 truncate text-xs text-slate-500
                    sm:text-sm dark:text-slate-300">
            ${escapeHtml(getLastMessagePreview(conversation))}
          </p>
        </div>
      </div>
    `;

    article
      .querySelector(".conversation-avatar")
      ?.addEventListener("click", (event) => {
        event.stopPropagation();
        openConversationAvatar(avatarUrl, initials, name);
      });

    article.addEventListener("click", () => selectConversation(conversation));
    article.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectConversation(conversation);
      }
    });

    return article;
  }

  function renderConversations(list = state.conversations) {
    if (!el.conversationsList) return;

    const sorted = [...list].sort(
      (a, b) => getActivityTimestamp(b) - getActivityTimestamp(a)
    );

    if (!sorted.length) {
      showListMessage(el.conversationsList, "Aucune conversation trouvée.");
      return;
    }

    const fragment = document.createDocumentFragment();
    sorted.forEach((conversation) =>
      fragment.appendChild(createConversationCard(conversation))
    );

    el.conversationsList.replaceChildren(fragment);
  }

  function getFilteredConversations() {
    const search = normalize(el.searchConversation?.value);

    if (!search) return state.conversations;

    return state.conversations.filter((conversation) =>
      normalize(getConversationName(conversation)).includes(search)
    );
  }

  async function loadConversations({ silent = false } = {}) {
    if (!el.conversationsList || state.loadingConversations) return;

    state.loadingConversations = true;

    if (!silent) {
      showListMessage(
        el.conversationsList,
        "Chargement des conversations..."
      );
    }

    try {
      const result = await request("/conversations");
      state.conversations = extractCollection(result, "conversations");

      const activeStillExists = state.conversations.some(
        (conversation) => conversation.id === state.activeId
      );

      if (!activeStillExists) {
        state.activeId = null;
        window.activeConversationId = null;
      }

      renderConversations(getFilteredConversations());
    } catch (error) {
      console.error("Erreur conversations :", error);

      if (!silent) {
        showListMessage(
          el.conversationsList,
          error.message || "Impossible de charger les conversations.",
          "error"
        );
      }
    } finally {
      state.loadingConversations = false;
    }
  }

  function clearSelectedConversation() {
    state.activeId = null;
    window.activeConversationId = null;
    renderConversations(getFilteredConversations());
  }

  /* =========================================================
     UTILISATEURS
  ========================================================= */

  function getFilteredUsers(searchInput) {
    const search = normalize(searchInput?.value);

    return state.users.filter((user) => {
      const name = normalize(user.fullName || user.name);
      const email = normalize(user.email);
      return name.includes(search) || email.includes(search);
    });
  }

  function userAvatarMarkup(user, name) {
    return user.avatarUrl
      ? `
        <img
          src="${escapeHtml(user.avatarUrl)}"
          alt="${escapeHtml(name)}"
          class="h-full w-full object-cover"
        >
      `
      : escapeHtml(getInitials(name));
  }

  async function loadUsers() {
    showListMessage(el.usersList, "Chargement des utilisateurs...");
    showListMessage(el.groupUsersList, "Chargement des utilisateurs...");

    try {
      const result = await request("/users");
      const currentUserId = parseStoredUser()?.id;

      state.users = extractCollection(result, "users").filter(
        (user) => user.id !== currentUserId
      );

      renderPrivateUsers(getFilteredUsers(el.searchPrivateUser));
      renderGroupUsers(getFilteredUsers(el.searchGroupUser));
    } catch (error) {
      console.error("Erreur utilisateurs :", error);
      const message =
        error.message || "Impossible de charger les utilisateurs.";

      showListMessage(el.usersList, message, "error");
      showListMessage(el.groupUsersList, message, "error");
    }
  }

  function renderPrivateUsers(users) {
    if (!el.usersList) return;

    if (!users.length) {
      showListMessage(el.usersList, "Aucun utilisateur trouvé.");
      return;
    }

    const fragment = document.createDocumentFragment();

    users.forEach((user) => {
      const name = user.fullName || user.name || "Utilisateur";
      const button = document.createElement("button");

      button.type = "button";
      button.className = `
        flex w-full items-center gap-3 rounded-lg p-3 text-left
        transition hover:bg-blue-50 dark:hover:bg-slate-700
      `;

      button.innerHTML = `
        <div class="flex h-10 w-10 shrink-0 items-center justify-center
                    overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">
          ${userAvatarMarkup(user, name)}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-slate-900 dark:text-white">
            ${escapeHtml(name)}
          </p>
          <p class="truncate text-sm text-slate-500 dark:text-slate-300">
            ${escapeHtml(user.email || "")}
          </p>
        </div>
      `;

      button.addEventListener("click", () =>
        createPrivateConversation(user.id, name)
      );

      fragment.appendChild(button);
    });

    el.usersList.replaceChildren(fragment);
  }

  async function createPrivateConversation(userId, userName) {
    showListMessage(
      el.usersList,
      "Création de la conversation...",
      "success"
    );

    try {
      await request("/conversations", {
        method: "POST",
        body: JSON.stringify({
          type: "private",
          name: userName,
          participantIds: [userId],
        }),
      });

      closeNewConversationModal();
      await loadConversations();
    } catch (error) {
      console.error("Erreur création conversation privée :", error);
      showListMessage(
        el.usersList,
        error.message || "Impossible de créer la conversation.",
        "error"
      );
    }
  }

  /* =========================================================
     GROUPES
  ========================================================= */

  function updateSelectedGroupCount() {
    const count = state.selectedGroupUserIds.size;

    if (el.selectedGroupCount) {
      el.selectedGroupCount.textContent =
        `${count} sélectionné${count > 1 ? "s" : ""}`;
    }

    if (el.createGroupConversationBtn) {
      el.createGroupConversationBtn.disabled = count < 2;
    }
  }

  function renderGroupUsers(users) {
    if (!el.groupUsersList) return;

    if (!users.length) {
      showListMessage(el.groupUsersList, "Aucun utilisateur trouvé.");
      return;
    }

    const fragment = document.createDocumentFragment();

    users.forEach((user) => {
      const name = user.fullName || user.name || "Utilisateur";
      const isSelected = state.selectedGroupUserIds.has(user.id);
      const label = document.createElement("label");

      label.className = `
        flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition
        ${
          isSelected
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-700"
        }
      `;

      label.innerHTML = `
        <input
          type="checkbox"
          class="group-user-checkbox h-4 w-4 accent-blue-600"
          ${isSelected ? "checked" : ""}
        >
        <div class="flex h-10 w-10 shrink-0 items-center justify-center
                    overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700">
          ${userAvatarMarkup(user, name)}
        </div>
        <div class="min-w-0 flex-1">
          <p class="truncate font-semibold text-slate-900 dark:text-white">
            ${escapeHtml(name)}
          </p>
          <p class="truncate text-sm text-slate-500 dark:text-slate-300">
            ${escapeHtml(user.email || "")}
          </p>
        </div>
      `;

      label
        .querySelector(".group-user-checkbox")
        ?.addEventListener("change", (event) => {
          if (event.target.checked) {
            state.selectedGroupUserIds.add(user.id);
          } else {
            state.selectedGroupUserIds.delete(user.id);
          }

          updateSelectedGroupCount();
          renderGroupUsers(getFilteredUsers(el.searchGroupUser));
        });

      fragment.appendChild(label);
    });

    el.groupUsersList.replaceChildren(fragment);
  }

  function showGroupMessage(message = "", type = "error") {
    if (!el.groupCreationMessage) return;

    el.groupCreationMessage.textContent = message;
    el.groupCreationMessage.className =
      type === "success"
        ? "mt-4 text-center text-sm font-medium text-green-600"
        : "mt-4 text-center text-sm font-medium text-red-600";
  }

  function setGroupButtonLoading(loading) {
    if (!el.createGroupConversationBtn) return;

    el.createGroupConversationBtn.disabled =
      loading || state.selectedGroupUserIds.size < 2;

    el.createGroupConversationBtn.innerHTML = loading
      ? `
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>
        Création du groupe...
      `
      : `
        <i class="fa-solid fa-user-group mr-2"></i>
        Créer le groupe
      `;
  }

  async function createGroupConversation() {
    const name = el.groupName?.value.trim() || "";
    const avatarUrl = el.groupAvatarUrl?.value.trim() || "";
    const participantIds = [...state.selectedGroupUserIds];

    if (!name) {
      showGroupMessage("Le nom du groupe est obligatoire.");
      el.groupName?.focus();
      return;
    }

    if (participantIds.length < 2) {
      showGroupMessage("Sélectionne au moins deux participants.");
      return;
    }

    setGroupButtonLoading(true);
    showGroupMessage("Création du groupe...", "success");

    try {
      await request("/conversations", {
        method: "POST",
        body: JSON.stringify({
          type: "group",
          name,
          participantIds,
          ...(avatarUrl ? { avatarUrl } : {}),
        }),
      });

      closeNewConversationModal();
      await loadConversations();
    } catch (error) {
      console.error("Erreur création du groupe :", error);
      showGroupMessage(
        error.message || "Impossible de créer le groupe."
      );
    } finally {
      setGroupButtonLoading(false);
    }
  }

  /* =========================================================
     MODALE ET ONGLETS
  ========================================================= */

  function activateConversationTab(type) {
    const isPrivate = type === "private";

    el.privateConversationSection?.classList.toggle("hidden", !isPrivate);
    el.groupConversationSection?.classList.toggle("hidden", isPrivate);

    const activeClasses = ["bg-blue-600", "text-white"];
    const inactiveClasses = [
      "bg-slate-100",
      "text-slate-700",
      "dark:bg-slate-700",
      "dark:text-white",
    ];

    [
      [el.privateConversationTab, isPrivate],
      [el.groupConversationTab, !isPrivate],
    ].forEach(([tab, active]) => {
      if (!tab) return;
      tab.classList.remove(...(active ? inactiveClasses : activeClasses));
      tab.classList.add(...(active ? activeClasses : inactiveClasses));
      tab.setAttribute("aria-selected", String(active));
    });

    if (!isPrivate) {
      renderGroupUsers(getFilteredUsers(el.searchGroupUser));
    }
  }

  function resetNewConversationModal() {
    if (el.searchPrivateUser) el.searchPrivateUser.value = "";
    if (el.searchGroupUser) el.searchGroupUser.value = "";
    if (el.groupName) el.groupName.value = "";
    if (el.groupAvatarUrl) el.groupAvatarUrl.value = "";

    state.selectedGroupUserIds.clear();
    updateSelectedGroupCount();
    showGroupMessage("");
    activateConversationTab("private");
  }

  function openNewConversationModal() {
    resetNewConversationModal();
    setModalVisibility(el.newConversationModal, true);
    loadUsers();
  }

  function closeNewConversationModal() {
    setModalVisibility(el.newConversationModal, false);
  }

  /* =========================================================
     ÉVÉNEMENTS ET DÉMARRAGE
  ========================================================= */

  function handleEscape(event) {
    if (event.key !== "Escape") return;
    closeNewConversationModal();
    closeConversationAvatar();
  }

  function bindEvents() {
    el.openNewConversationModal?.addEventListener(
      "click",
      openNewConversationModal
    );
    el.closeNewConversationModal?.addEventListener(
      "click",
      closeNewConversationModal
    );
    el.closeConversationAvatarModal?.addEventListener(
      "click",
      closeConversationAvatar
    );

    el.newConversationModal?.addEventListener("click", (event) => {
      if (event.target === el.newConversationModal) {
        closeNewConversationModal();
      }
    });

    el.conversationAvatarModal?.addEventListener("click", (event) => {
      if (event.target === el.conversationAvatarModal) {
        closeConversationAvatar();
      }
    });

    el.privateConversationTab?.addEventListener("click", () =>
      activateConversationTab("private")
    );
    el.groupConversationTab?.addEventListener("click", () =>
      activateConversationTab("group")
    );

    el.searchConversation?.addEventListener("input", () =>
      renderConversations(getFilteredConversations())
    );
    el.searchPrivateUser?.addEventListener("input", () =>
      renderPrivateUsers(getFilteredUsers(el.searchPrivateUser))
    );
    el.searchGroupUser?.addEventListener("input", () =>
      renderGroupUsers(getFilteredUsers(el.searchGroupUser))
    );

    el.createGroupConversationBtn?.addEventListener(
      "click",
      createGroupConversation
    );

    document.addEventListener("keydown", handleEscape);
  }

  function initialize() {
    bindEvents();
    updateSelectedGroupCount();
    loadConversations();
  }

  window.loadConversations = loadConversations;
  window.clearSelectedConversation = clearSelectedConversation;

  window.ConversationsApp = Object.freeze({
    load: loadConversations,
    render: () => renderConversations(getFilteredConversations()),
    clearSelection: clearSelectedConversation,
    openNewConversationModal,
    closeNewConversationModal,
    getActiveConversationId: () => state.activeId,
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
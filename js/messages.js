(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);

  const el = {
    container: $("messagesContainer"),
    form: $("messageForm"),
    input: $("messageInput"),
  };

  const state = {
    conversationId: null,
    user: null,
    messages: [],
    replyingTo: null,
    refreshTimer: null,
    isRefreshing: false,
    isSending: false,
    refreshDelay: 3000,
  };

  const STORAGE_KEYS = {
    hidden: "hiddenMessages",
    pinned: "pinnedMessages",
    user: "user",
  };

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

  const readJson = (key, fallback) => {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  };

  const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
  };

  const getStoredUser = () => readJson(STORAGE_KEYS.user, null);

  const extractMessages = (result) => {
    const candidates = [
      result?.data?.messages,
      result?.data,
      result?.messages,
    ];

    return candidates.find(Array.isArray) || [];
  };

  const getMessageId = (message) =>
    message?.id || message?.messageId || null;

  const getSenderId = (message) =>
    message?.senderId ||
    message?.userId ||
    message?.sender?.id ||
    message?.user?.id ||
    null;

  const getSenderName = (message) =>
    message?.sender?.fullName ||
    message?.sender?.name ||
    message?.user?.fullName ||
    message?.user?.name ||
    message?.senderName ||
    "Utilisateur";

  const getMessageContent = (message) =>
    message?.content || message?.text || "";

  const formatTime = (dateValue) => {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime())
      ? ""
      : date.toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const formatDate = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "";

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Aujourd’hui";
    if (date.toDateString() === yesterday.toDateString()) return "Hier";

    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const isNearBottom = () => {
    if (!el.container) return true;

    return (
      el.container.scrollHeight -
        el.container.scrollTop -
        el.container.clientHeight <
      120
    );
  };

  const scrollToBottom = (behavior = "auto") => {
    if (!el.container) return;
    el.container.scrollTo({
      top: el.container.scrollHeight,
      behavior,
    });
  };

  const showContainerMessage = (message, type = "muted") => {
    if (!el.container) return;

    const color =
      type === "error" ? "text-red-500" : "text-slate-400";

    el.container.innerHTML = `
      <div class="flex h-full items-center justify-center ${color}">
        ${escapeHtml(message)}
      </div>
    `;
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

    const text = await response.text();
    let result = {};

    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        result = {};
      }
    }

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
     UTILISATEUR CONNECTÉ
  ========================================================= */

  async function loadConnectedUser() {
    try {
      const result = await request("/auth/me");
      state.user = result?.data?.user || result?.data || null;

      if (state.user) {
        writeJson(STORAGE_KEYS.user, state.user);
      }
    } catch (error) {
      console.warn("Profil distant indisponible :", error.message);
      state.user = getStoredUser();
    }

    return state.user;
  }

  /* =========================================================
     RÉPONSE
  ========================================================= */

  function createReplyPreview() {
    let preview = $("replyPreview");
    if (preview) return preview;

    const footer = el.form?.closest("footer");
    if (!footer || !el.form) return null;

    preview = document.createElement("div");
    preview.id = "replyPreview";
    preview.className = `
      hidden mb-2 rounded-md border-l-4 border-blue-500
      bg-slate-100 px-3 py-2 dark:bg-slate-800
    `;

    preview.innerHTML = `
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-xs font-semibold text-blue-600">
            Réponse au message
          </p>
          <p
            id="replyPreviewText"
            class="truncate text-xs text-slate-600 dark:text-slate-300"
          ></p>
        </div>

        <button
          id="cancelReplyButton"
          type="button"
          class="text-slate-500 transition hover:text-red-500"
          aria-label="Annuler la réponse"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;

    footer.insertBefore(preview, el.form);
    $("cancelReplyButton")?.addEventListener("click", cancelReply);

    return preview;
  }

  function startReply(message) {
    state.replyingTo = message;

    const preview = createReplyPreview();
    const text = $("replyPreviewText");

    if (text) text.textContent = getMessageContent(message);
    preview?.classList.remove("hidden");
    el.input?.focus();
  }

  function cancelReply() {
    state.replyingTo = null;
    $("replyPreview")?.classList.add("hidden");
  }

  /* =========================================================
     ÉPINGLAGE ET MASQUAGE LOCAL
  ========================================================= */

  const getHiddenIds = () => readJson(STORAGE_KEYS.hidden, []);
  const getPinnedIds = () => readJson(STORAGE_KEYS.pinned, []);

  function hideMessage(message) {
    const id = getMessageId(message);
    if (!id) return alert("Identifiant du message introuvable.");

    const ids = new Set(getHiddenIds());
    ids.add(id);
    writeJson(STORAGE_KEYS.hidden, [...ids]);

    renderMessages(state.messages, {
      preservePosition: true,
      forceBottom: false,
    });
  }

  function togglePinnedMessage(message) {
    const id = getMessageId(message);
    if (!id) return alert("Impossible d’épingler ce message.");

    const ids = new Set(getPinnedIds());

    if (ids.has(id)) ids.delete(id);
    else ids.add(id);

    writeJson(STORAGE_KEYS.pinned, [...ids]);

    renderMessages(state.messages, {
      preservePosition: true,
      forceBottom: false,
    });
  }

  /* =========================================================
     SUPPRESSION
  ========================================================= */

  async function deleteMessagePermanently(message) {
    const id = getMessageId(message);
    if (!id) return alert("Identifiant du message introuvable.");

    const confirmed = window.confirm(
      "Veux-tu vraiment supprimer définitivement ce message ?"
    );

    if (!confirmed) return;

    try {
      await request(`/messages/${id}`, { method: "DELETE" });

      await loadMessages(state.conversationId, {
        showLoader: false,
        forceBottom: false,
      });

      await window.loadConversations?.({ silent: true });
    } catch (error) {
      console.error("Erreur suppression message :", error);
      alert(error.message || "Impossible de supprimer ce message.");
    }
  }

  /* =========================================================
     MENUS
  ========================================================= */

  function closeAllMessageMenus() {
    document
      .querySelectorAll(".message-options-menu")
      .forEach((menu) => menu.classList.add("hidden"));
  }

  function createOptionsButton(position) {
    return `
      <div class="relative message-options-container">
        <button
          type="button"
          class="message-options-button flex h-6 w-6 items-center
                 justify-center rounded-full text-slate-500 opacity-0
                 transition hover:bg-slate-200 group-hover:opacity-100
                 focus:opacity-100 dark:hover:bg-slate-700"
          aria-label="Options du message"
        >
          <i class="fa-solid fa-chevron-down text-[9px]"></i>
        </button>

        <div
          class="message-options-menu absolute ${position} top-7 z-50 hidden
                 w-48 overflow-hidden rounded-lg border border-slate-200
                 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800"
        ></div>
      </div>
    `;
  }

  function configureMessageMenu(wrapper, message, isMine, isPinned) {
    const button = wrapper.querySelector(".message-options-button");
    const menu = wrapper.querySelector(".message-options-menu");

    if (!menu) return;

    menu.innerHTML = `
      <button type="button"
        class="reply-message-button w-full px-4 py-2 text-left text-sm
               hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700">
        <i class="fa-solid fa-reply mr-2"></i>
        Répondre
      </button>

      <button type="button"
        class="pin-message-button w-full px-4 py-2 text-left text-sm
               hover:bg-slate-100 dark:text-white dark:hover:bg-slate-700">
        <i class="fa-solid fa-thumbtack mr-2"></i>
        ${isPinned ? "Désépingler" : "Épingler"}
      </button>

      <button type="button"
        class="hide-message-button w-full px-4 py-2 text-left text-sm
               text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-700">
        <i class="fa-solid fa-eye-slash mr-2"></i>
        Supprimer pour moi
      </button>

      ${
        isMine
          ? `
            <button type="button"
              class="delete-message-button w-full px-4 py-2 text-left text-sm
                     text-red-600 hover:bg-red-50 dark:hover:bg-slate-700">
              <i class="fa-solid fa-trash mr-2"></i>
              Supprimer définitivement
            </button>
          `
          : ""
      }
    `;

    button?.addEventListener("click", (event) => {
      event.stopPropagation();

      const shouldOpen = menu.classList.contains("hidden");
      closeAllMessageMenus();
      menu.classList.toggle("hidden", !shouldOpen);
    });

    menu
      .querySelector(".reply-message-button")
      ?.addEventListener("click", () => {
        closeAllMessageMenus();
        startReply(message);
      });

    menu
      .querySelector(".pin-message-button")
      ?.addEventListener("click", () => {
        closeAllMessageMenus();
        togglePinnedMessage(message);
      });

    menu
      .querySelector(".hide-message-button")
      ?.addEventListener("click", () => {
        closeAllMessageMenus();

        if (
          window.confirm(
            "Supprimer ce message uniquement de ton affichage ?"
          )
        ) {
          hideMessage(message);
        }
      });

    menu
      .querySelector(".delete-message-button")
      ?.addEventListener("click", () => {
        closeAllMessageMenus();
        deleteMessagePermanently(message);
      });
  }

  /* =========================================================
     AFFICHAGE
  ========================================================= */

  function createDateSeparator(label) {
    const separator = document.createElement("div");
    separator.className = "my-3 flex justify-center";
    separator.innerHTML = `
      <span class="rounded-md bg-white/90 px-3 py-1 text-[11px]
                   font-medium text-slate-600 shadow-sm
                   dark:bg-slate-700 dark:text-slate-200">
        ${escapeHtml(label)}
      </span>
    `;
    return separator;
  }

  function createMessageElement(message, pinnedIds) {
    const currentUserId = state.user?.id;
    const senderId = getSenderId(message);
    const senderName = getSenderName(message);
    const messageId = getMessageId(message);
    const isMine = Boolean(currentUserId && senderId === currentUserId);
    const isPinned = Boolean(messageId && pinnedIds.has(messageId));
    const position = isMine ? "right-0" : "left-0";

    const wrapper = document.createElement("div");
    wrapper.className = isMine
      ? "group mb-1.5 flex items-center justify-end gap-1"
      : "group mb-1.5 flex items-center justify-start gap-1";

    wrapper.dataset.messageId = messageId || "";

    wrapper.innerHTML = `
      ${isMine ? createOptionsButton(position) : ""}

      <div
        class="${isMine ? "message-sent" : "message-received"}
               relative inline-block w-fit max-w-[85%] px-3 py-2 shadow-sm
               sm:max-w-[75%] lg:max-w-[65%]
               ${
                 isMine
                   ? "rounded-md rounded-tr-none bg-[#d9fdd3] text-slate-900"
                   : "rounded-md rounded-tl-none bg-white text-slate-900 dark:bg-slate-700 dark:text-white"
               }"
      >
        ${
          message.replyTo?.content
            ? `
              <div class="mb-1 rounded-sm border-l-4 border-blue-500
                          bg-black/5 px-2 py-1">
                <p class="truncate text-[11px] text-slate-600 dark:text-slate-300">
                  ${escapeHtml(message.replyTo.content)}
                </p>
              </div>
            `
            : ""
        }

        <div class="flex flex-wrap items-end gap-1">
          ${
            isPinned
              ? `
                <i
                  class="fa-solid fa-thumbtack text-[8px] text-orange-500"
                  title="Message épinglé"
                ></i>
              `
              : ""
          }

          ${
            !isMine
              ? `
                <span class="shrink-0 text-[12px] font-bold text-blue-600">
                  ${escapeHtml(senderName)} :
                </span>
              `
              : ""
          }

          <p class="m-0 whitespace-pre-wrap break-words text-[13px] leading-5">
            ${escapeHtml(getMessageContent(message))}
          </p>
        </div>

        <div class="mt-1 flex items-center justify-end gap-1">
          <span class="text-[9px] text-slate-500 dark:text-slate-300">
            ${escapeHtml(formatTime(message.createdAt))}
          </span>

          ${
            isMine
              ? `
                <i
                  class="fa-solid fa-check-double text-[9px] text-blue-500"
                  title="Message envoyé"
                ></i>
              `
              : ""
          }
        </div>
      </div>

      ${!isMine ? createOptionsButton(position) : ""}
    `;

    configureMessageMenu(wrapper, message, isMine, isPinned);
    return wrapper;
  }

  function renderMessages(
    messages,
    { preservePosition = false, forceBottom = false } = {}
  ) {
    if (!el.container) return;

    const previousScrollHeight = el.container.scrollHeight;
    const previousScrollTop = el.container.scrollTop;
    const wasNearBottom = isNearBottom();

    state.messages = Array.isArray(messages) ? messages : [];
    window.currentConversationMessages = state.messages;

    const hiddenIds = new Set(getHiddenIds());
    const pinnedIds = new Set(getPinnedIds());

    const visibleMessages = state.messages.filter(
      (message) => !hiddenIds.has(getMessageId(message))
    );

    if (!visibleMessages.length) {
      showContainerMessage("Aucun message dans cette conversation.");
      return;
    }

    const fragment = document.createDocumentFragment();
    let previousDate = "";

    visibleMessages.forEach((message) => {
      const currentDate = formatDate(message.createdAt);

      if (currentDate && currentDate !== previousDate) {
        fragment.appendChild(createDateSeparator(currentDate));
        previousDate = currentDate;
      }

      fragment.appendChild(createMessageElement(message, pinnedIds));
    });

    el.container.replaceChildren(fragment);

    requestAnimationFrame(() => {
      if (forceBottom || wasNearBottom) {
        scrollToBottom(forceBottom ? "smooth" : "auto");
        return;
      }

      if (preservePosition) {
        const heightDifference =
          el.container.scrollHeight - previousScrollHeight;

        el.container.scrollTop = previousScrollTop + heightDifference;
      }
    });
  }

  /* =========================================================
     CHARGEMENT ET ACTUALISATION
  ========================================================= */

  async function loadMessages(
    conversationId,
    { showLoader = true, forceBottom = true } = {}
  ) {
    if (!conversationId || !el.container) return;

    const conversationChanged =
      state.conversationId !== conversationId;

    state.conversationId = conversationId;

    if (conversationChanged) {
      cancelReply();
    }

    if (showLoader) {
      showContainerMessage("Chargement des messages...");
    }

    try {
      if (!state.user) await loadConnectedUser();

      const result = await request(
        `/conversations/${conversationId}/messages`
      );

      const messages = extractMessages(result);

      renderMessages(messages, {
        preservePosition: !conversationChanged && !forceBottom,
        forceBottom: conversationChanged || forceBottom,
      });

      startAutoRefresh();
    } catch (error) {
      console.error("Erreur chargement messages :", error);

      if (showLoader) {
        showContainerMessage(
          error.message || "Impossible de charger les messages.",
          "error"
        );
      }
    }
  }

  async function refreshMessages() {
    if (
      !state.conversationId ||
      state.isRefreshing ||
      state.isSending ||
      document.hidden
    ) {
      return;
    }

    state.isRefreshing = true;

    try {
      await loadMessages(state.conversationId, {
        showLoader: false,
        forceBottom: false,
      });

      await window.loadConversations?.({ silent: true });
    } catch (error) {
      console.error("Erreur actualisation automatique :", error);
    } finally {
      state.isRefreshing = false;
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();

    state.refreshTimer = window.setInterval(
      refreshMessages,
      state.refreshDelay
    );
  }

  function stopAutoRefresh() {
    if (!state.refreshTimer) return;

    clearInterval(state.refreshTimer);
    state.refreshTimer = null;
  }

  /* =========================================================
     ENVOI
  ========================================================= */

  function setSendButtonLoading(loading) {
    const button = el.form?.querySelector('button[type="submit"]');
    if (!button) return;

    button.disabled = loading;
    button.classList.toggle("opacity-60", loading);
    button.classList.toggle("cursor-not-allowed", loading);
  }

  async function sendMessage(event) {
    event.preventDefault();

    if (state.isSending) return;

    const content = el.input?.value.trim() || "";

    if (!state.conversationId) {
      alert("Sélectionne d’abord une conversation.");
      return;
    }

    if (!content) return;

    state.isSending = true;
    setSendButtonLoading(true);

    const requestBody = {
      content,
      ...(state.replyingTo
        ? { replyToId: getMessageId(state.replyingTo) }
        : {}),
    };

    try {
      await request(
        `/conversations/${state.conversationId}/messages`,
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );

      el.input.value = "";
      cancelReply();

      await loadMessages(state.conversationId, {
        showLoader: false,
        forceBottom: true,
      });

      await window.loadConversations?.({ silent: true });
    } catch (error) {
      console.error("Erreur envoi message :", error);
      alert(error.message || "Impossible d’envoyer le message.");
    } finally {
      state.isSending = false;
      setSendButtonLoading(false);
      el.input?.focus();
    }
  }

  /* =========================================================
     ÉVÉNEMENTS
  ========================================================= */

  function bindEvents() {
    el.form?.addEventListener("submit", sendMessage);

    document.addEventListener("click", closeAllMessageMenus);

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeAllMessageMenus();
        cancelReply();
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAutoRefresh();
      else if (state.conversationId) {
        refreshMessages();
        startAutoRefresh();
      }
    });

    window.addEventListener("beforeunload", stopAutoRefresh);
  }

  function initialize() {
    createReplyPreview();
    bindEvents();
    loadConnectedUser();
  }

  window.loadMessages = loadMessages;
  window.MessagesApp = Object.freeze({
    load: loadMessages,
    refresh: refreshMessages,
    stopAutoRefresh,
    getConversationId: () => state.conversationId,
    getMessages: () => [...state.messages],
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  } else {
    initialize();
  }
})();
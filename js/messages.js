const messagesContainer =
  document.getElementById("messagesContainer");

const messageForm =
  document.getElementById("messageForm");

const messageInput =
  document.getElementById("messageInput");

let selectedConversationId = null;
let connectedUser = null;
let replyingToMessage = null;

/* =========================================================
   OUTILS
========================================================= */

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStoredUser() {
  try {
    const storedUser =
      localStorage.getItem("user");

    if (
      !storedUser ||
      storedUser === "undefined"
    ) {
      return null;
    }

    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

async function loadConnectedUser() {
  try {
    const response = await fetch(
      `${API_URL}/auth/me`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      connectedUser = getStoredUser();
      return connectedUser;
    }

    connectedUser =
      result.data?.user ||
      result.data ||
      null;

    if (connectedUser) {
      localStorage.setItem(
        "user",
        JSON.stringify(connectedUser)
      );
    }

    return connectedUser;
  } catch (error) {
    console.error(
      "Erreur utilisateur connecté :",
      error
    );

    connectedUser = getStoredUser();
    return connectedUser;
  }
}

function formatMessageTime(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString(
    "fr-FR",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  );
}

function formatMessageDate(date) {
  if (!date) return "";

  const messageDate = new Date(date);

  if (Number.isNaN(messageDate.getTime())) {
    return "";
  }

  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (
    messageDate.toDateString() ===
    today.toDateString()
  ) {
    return "Aujourd’hui";
  }

  if (
    messageDate.toDateString() ===
    yesterday.toDateString()
  ) {
    return "Hier";
  }

  return messageDate.toLocaleDateString(
    "fr-FR",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}

function extractMessages(result) {
  if (Array.isArray(result.data?.messages)) {
    return result.data.messages;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.messages)) {
    return result.messages;
  }

  return [];
}

function getMessageId(message) {
  return (
    message.id ||
    message.messageId ||
    null
  );
}

function getMessageSenderId(message) {
  return (
    message.senderId ||
    message.userId ||
    message.sender?.id ||
    message.user?.id ||
    null
  );
}

/* =========================================================
   MESSAGES MASQUÉS LOCALEMENT
========================================================= */

function getHiddenMessages() {
  try {
    return JSON.parse(
      localStorage.getItem(
        "hiddenMessages"
      ) || "[]"
    );
  } catch {
    return [];
  }
}

function hideMessageForCurrentUser(message) {
  const messageId = getMessageId(message);

  if (!messageId) {
    alert(
      "Identifiant du message introuvable."
    );
    return;
  }

  const hiddenMessages =
    getHiddenMessages();

  if (!hiddenMessages.includes(messageId)) {
    hiddenMessages.push(messageId);
  }

  localStorage.setItem(
    "hiddenMessages",
    JSON.stringify(hiddenMessages)
  );

  renderMessages(
    window.currentConversationMessages || []
  );
}

/* =========================================================
   RÉPONSE À UN MESSAGE
========================================================= */

function createReplyPreview() {
  let replyPreview =
    document.getElementById(
      "replyPreview"
    );

  if (replyPreview) {
    return replyPreview;
  }

  const footer =
    messageForm?.closest("footer");

  if (!footer || !messageForm) {
    return null;
  }

  replyPreview =
    document.createElement("div");

  replyPreview.id =
    "replyPreview";

  replyPreview.className = `
    hidden
    mb-2
    bg-slate-100
    border-l-4
    border-blue-500
    rounded-md
    px-3
    py-2
  `;

  replyPreview.innerHTML = `
    <div class="flex items-center justify-between gap-3">

      <div class="min-w-0">

        <p class="text-xs font-semibold text-blue-600">
          Réponse au message
        </p>

        <p
          id="replyPreviewText"
          class="text-xs text-slate-600 truncate"
        ></p>

      </div>

      <button
        id="cancelReplyButton"
        type="button"
        class="text-slate-500 hover:text-red-500 transition"
        aria-label="Annuler la réponse"
      >
        <i class="fa-solid fa-xmark"></i>
      </button>

    </div>
  `;

  footer.insertBefore(
    replyPreview,
    messageForm
  );

  document
    .getElementById(
      "cancelReplyButton"
    )
    ?.addEventListener(
      "click",
      cancelReply
    );

  return replyPreview;
}

function startReply(message) {
  replyingToMessage = message;

  const replyPreview =
    createReplyPreview();

  const replyPreviewText =
    document.getElementById(
      "replyPreviewText"
    );

  if (replyPreviewText) {
    replyPreviewText.textContent =
      message.content || "";
  }

  replyPreview?.classList.remove(
    "hidden"
  );

  messageInput?.focus();
}

function cancelReply() {
  replyingToMessage = null;

  document
    .getElementById(
      "replyPreview"
    )
    ?.classList.add("hidden");
}

/* =========================================================
   ÉPINGLAGE LOCAL
========================================================= */

function getPinnedMessages() {
  try {
    return JSON.parse(
      localStorage.getItem(
        "pinnedMessages"
      ) || "[]"
    );
  } catch {
    return [];
  }
}

function togglePinnedMessage(message) {
  const messageId =
    getMessageId(message);

  if (!messageId) {
    alert(
      "Impossible d’épingler ce message."
    );
    return;
  }

  const pinnedMessages =
    getPinnedMessages();

  const alreadyPinned =
    pinnedMessages.includes(messageId);

  const updatedPinnedMessages =
    alreadyPinned
      ? pinnedMessages.filter(
          (id) => id !== messageId
        )
      : [
          ...pinnedMessages,
          messageId,
        ];

  localStorage.setItem(
    "pinnedMessages",
    JSON.stringify(
      updatedPinnedMessages
    )
  );

  renderMessages(
    window.currentConversationMessages || []
  );
}

/* =========================================================
   SUPPRESSION DÉFINITIVE
========================================================= */

async function deleteMessagePermanently(
  message
) {
  const messageId =
    getMessageId(message);

  if (!messageId) {
    alert(
      "Identifiant du message introuvable."
    );
    return;
  }

  const confirmed =
    window.confirm(
      "Veux-tu vraiment supprimer définitivement ce message ?"
    );

  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/messages/${messageId}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    const responseText =
      await response.text();

    let result = null;

    if (responseText) {
      try {
        result = JSON.parse(
          responseText
        );
      } catch {
        result = null;
      }
    }

    if (!response.ok) {
      alert(
        result?.message ||
          "L’API refuse la suppression définitive de ce message."
      );
      return;
    }

    await loadMessages(
      selectedConversationId
    );

    if (
      typeof window.loadConversations ===
      "function"
    ) {
      await window.loadConversations();
    }
  } catch (error) {
    console.error(
      "Erreur suppression message :",
      error
    );

    alert(
      "Erreur réseau lors de la suppression."
    );
  }
}

/* =========================================================
   MENUS DES MESSAGES
========================================================= */

function closeAllMessageMenus() {
  document
    .querySelectorAll(
      ".message-options-menu"
    )
    .forEach((menu) => {
      menu.classList.add("hidden");
    });
}

/* =========================================================
   AFFICHAGE DES MESSAGES
========================================================= */

function renderMessages(messages) {
  if (!messagesContainer) {
    return;
  }

  messagesContainer.innerHTML = "";

  window.currentConversationMessages =
    messages;

  const hiddenMessages =
    getHiddenMessages();

  const visibleMessages =
    Array.isArray(messages)
      ? messages.filter(
          (message) =>
            !hiddenMessages.includes(
              getMessageId(message)
            )
        )
      : [];

  if (visibleMessages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="h-full flex items-center justify-center text-slate-400">
        Aucun message dans cette conversation.
      </div>
    `;
    return;
  }

  const currentUserId =
    connectedUser?.id || null;

  const pinnedMessages =
    getPinnedMessages();

  let lastDisplayedDate = "";

  visibleMessages.forEach(
    (message) => {
      const displayedDate =
        formatMessageDate(
          message.createdAt
        );

      if (
        displayedDate &&
        displayedDate !==
          lastDisplayedDate
      ) {
        const separator =
          document.createElement(
            "div"
          );

        separator.className =
          "flex justify-center my-3";

        separator.innerHTML = `
          <span
            class="
              message-date
              bg-white/90
              text-slate-600
              text-[11px]
              font-medium
              px-3
              py-1
              rounded-md
              shadow-sm
            "
          >
            ${escapeHtml(
              displayedDate
            )}
          </span>
        `;

        messagesContainer.appendChild(
          separator
        );

        lastDisplayedDate =
          displayedDate;
      }

      const senderId =
        getMessageSenderId(
          message
        );

      const messageId =
        getMessageId(message);

      const isMine =
        Boolean(
          currentUserId &&
          senderId ===
            currentUserId
        );

      const isPinned =
        Boolean(
          messageId &&
          pinnedMessages.includes(
            messageId
          )
        );

      const wrapper =
        document.createElement(
          "div"
        );

      wrapper.className = isMine
        ? "group flex justify-end items-center gap-1 mb-1.5"
        : "group flex justify-start items-center gap-1 mb-1.5";

      const menuPosition =
        isMine
          ? "right-0"
          : "left-0";

      wrapper.innerHTML = `
        ${
          isMine
            ? createOptionsButton(
                menuPosition
              )
            : ""
        }

        <div
          class="
            ${
              isMine
                ? "message-sent"
                : "message-received"
            }

            relative
            inline-flex
            items-end
            gap-1.5
            w-fit
            max-w-[72%]
            px-2.5
            py-1.5
            shadow-sm

            ${
              isMine
                ? "bg-[#d9fdd3] text-slate-900 rounded-md rounded-tr-none"
                : "bg-white text-slate-900 rounded-md rounded-tl-none"
            }
          "
        >

          <div class="min-w-0">

            ${
              message.replyTo?.content
                ? `
                  <div
                    class="
                      mb-1
                      border-l-4
                      border-blue-500
                      bg-black/5
                      rounded-sm
                      px-2
                      py-1
                    "
                  >
                    <p class="text-[11px] text-slate-600 truncate">
                      ${escapeHtml(
                        message.replyTo
                          .content
                      )}
                    </p>
                  </div>
                `
                : ""
            }

            <div class="flex items-center gap-1">

              ${
                isPinned
                  ? `
                    <i
                      class="
                        fa-solid
                        fa-thumbtack
                        text-[8px]
                        text-orange-500
                      "
                      title="Message épinglé"
                    ></i>
                  `
                  : ""
              }

              <p
                class="
                  text-[13px]
                  leading-[1.25rem]
                  whitespace-pre-wrap
                  break-words
                "
              >
                ${escapeHtml(
                  message.content
                )}
              </p>

            </div>

          </div>

          <div
            class="
              flex
              items-center
              gap-1
              shrink-0
              translate-y-[2px]
            "
          >

            <span
              class="text-[9px] text-slate-500"
            >
              ${escapeHtml(
                formatMessageTime(
                  message.createdAt
                )
              )}
            </span>

            ${
              isMine
                ? `
                  <i
                    class="
                      fa-solid
                      fa-check-double
                      text-[9px]
                      text-blue-500
                    "
                    title="Message envoyé"
                  ></i>
                `
                : ""
            }

          </div>

        </div>

        ${
          !isMine
            ? createOptionsButton(
                menuPosition
              )
            : ""
        }
      `;

      configureMessageMenu(
        wrapper,
        message,
        isMine,
        isPinned
      );

      messagesContainer.appendChild(
        wrapper
      );
    }
  );

  messagesContainer.scrollTop =
    messagesContainer.scrollHeight;
}

function createOptionsButton(
  menuPosition
) {
  return `
    <div class="relative message-options-container">

      <button
        type="button"
        class="
          message-options-button
          opacity-0
          group-hover:opacity-100
          w-6
          h-6
          rounded-full
          flex
          items-center
          justify-center
          text-slate-500
          hover:bg-slate-200
          transition
        "
        aria-label="Options du message"
      >
        <i class="fa-solid fa-chevron-down text-[9px]"></i>
      </button>

      <div
        class="
          message-options-menu
          hidden
          absolute
          ${menuPosition}
          top-7
          w-48
          bg-white
          border
          border-slate-200
          rounded-lg
          shadow-lg
          z-50
          overflow-hidden
        "
      ></div>

    </div>
  `;
}

function configureMessageMenu(
  wrapper,
  message,
  isMine,
  isPinned
) {
  const optionsButton =
    wrapper.querySelector(
      ".message-options-button"
    );

  const optionsMenu =
    wrapper.querySelector(
      ".message-options-menu"
    );

  if (!optionsMenu) {
    return;
  }

  optionsMenu.innerHTML = `
    <button
      type="button"
      class="
        reply-message-button
        w-full
        px-4
        py-2
        text-left
        text-sm
        hover:bg-slate-100
      "
    >
      <i class="fa-solid fa-reply mr-2"></i>
      Répondre
    </button>

    <button
      type="button"
      class="
        pin-message-button
        w-full
        px-4
        py-2
        text-left
        text-sm
        hover:bg-slate-100
      "
    >
      <i class="fa-solid fa-thumbtack mr-2"></i>

      ${
        isPinned
          ? "Désépingler"
          : "Épingler"
      }
    </button>

    <button
      type="button"
      class="
        hide-message-button
        w-full
        px-4
        py-2
        text-left
        text-sm
        text-orange-600
        hover:bg-orange-50
      "
    >
      <i class="fa-solid fa-eye-slash mr-2"></i>
      Supprimer pour moi
    </button>

    ${
      isMine
        ? `
          <button
            type="button"
            class="
              delete-message-button
              w-full
              px-4
              py-2
              text-left
              text-sm
              text-red-600
              hover:bg-red-50
            "
          >
            <i class="fa-solid fa-trash mr-2"></i>
            Supprimer définitivement
          </button>
        `
        : ""
    }
  `;

  optionsButton?.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();

      const wasHidden =
        optionsMenu.classList.contains(
          "hidden"
        );

      closeAllMessageMenus();

      if (wasHidden) {
        optionsMenu.classList.remove(
          "hidden"
        );
      }
    }
  );

  optionsMenu
    .querySelector(
      ".reply-message-button"
    )
    ?.addEventListener(
      "click",
      () => {
        closeAllMessageMenus();
        startReply(message);
      }
    );

  optionsMenu
    .querySelector(
      ".pin-message-button"
    )
    ?.addEventListener(
      "click",
      () => {
        closeAllMessageMenus();
        togglePinnedMessage(
          message
        );
      }
    );

  optionsMenu
    .querySelector(
      ".hide-message-button"
    )
    ?.addEventListener(
      "click",
      () => {
        closeAllMessageMenus();

        const confirmed =
          window.confirm(
            "Supprimer ce message uniquement de ton affichage ?"
          );

        if (confirmed) {
          hideMessageForCurrentUser(
            message
          );
        }
      }
    );

  optionsMenu
    .querySelector(
      ".delete-message-button"
    )
    ?.addEventListener(
      "click",
      () => {
        closeAllMessageMenus();

        deleteMessagePermanently(
          message
        );
      }
    );
}

/* =========================================================
   CHARGEMENT DES MESSAGES
========================================================= */

async function loadMessages(
  conversationId
) {
  selectedConversationId =
    conversationId;

  if (!messagesContainer) {
    return;
  }

  messagesContainer.innerHTML = `
    <div class="h-full flex items-center justify-center text-slate-400">
      Chargement des messages...
    </div>
  `;

  try {
    await loadConnectedUser();

    const response = await fetch(
      `${API_URL}/conversations/${conversationId}/messages`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    const result =
      await response.json();

    if (!response.ok || !result.success) {
      messagesContainer.innerHTML = `
        <div class="h-full flex items-center justify-center text-red-500">
          ${escapeHtml(
            result.message ||
              "Impossible de charger les messages."
          )}
        </div>
      `;
      return;
    }

    renderMessages(
      extractMessages(result)
    );
  } catch (error) {
    console.error(
      "Erreur chargement messages :",
      error
    );

    messagesContainer.innerHTML = `
      <div class="h-full flex items-center justify-center text-red-500">
        Erreur réseau. Impossible de charger les messages.
      </div>
    `;
  }
}

window.loadMessages =
  loadMessages;

/* =========================================================
   ENVOI D’UN MESSAGE
========================================================= */

messageForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const content =
      messageInput.value.trim();

    if (!selectedConversationId) {
      alert(
        "Sélectionne d’abord une conversation."
      );
      return;
    }

    if (!content) {
      return;
    }

    const requestBody = {
      content,
    };

    if (replyingToMessage) {
      requestBody.replyToId =
        getMessageId(
          replyingToMessage
        );
    }

    const submitButton =
      messageForm.querySelector(
        'button[type="submit"]'
      );

    submitButton?.setAttribute(
      "disabled",
      "true"
    );

    submitButton?.classList.add(
      "opacity-60",
      "cursor-not-allowed"
    );

    try {
      const response = await fetch(
        `${API_URL}/conversations/${selectedConversationId}/messages`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          cache: "no-store",
          body: JSON.stringify(
            requestBody
          ),
        }
      );

      const result =
        await response.json();

      if (!response.ok || !result.success) {
        alert(
          result.message ||
            "Impossible d’envoyer le message."
        );
        return;
      }

      messageInput.value = "";
      cancelReply();

      await loadMessages(
        selectedConversationId
      );

      if (
        typeof window.loadConversations ===
        "function"
      ) {
        await window.loadConversations();
      }
    } catch (error) {
      console.error(
        "Erreur envoi message :",
        error
      );

      alert(
        "Erreur réseau lors de l’envoi du message."
      );
    } finally {
      submitButton?.removeAttribute(
        "disabled"
      );

      submitButton?.classList.remove(
        "opacity-60",
        "cursor-not-allowed"
      );

      messageInput?.focus();
    }
  }
);

/* =========================================================
   FERMETURE DES MENUS
========================================================= */

document.addEventListener(
  "click",
  () => {
    closeAllMessageMenus();
  }
);

/* =========================================================
   DÉMARRAGE
========================================================= */

createReplyPreview();
loadConnectedUser();
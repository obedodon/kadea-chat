const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

let selectedConversationId = null;
let connectedUser = null;

/**
 * Convertit une valeur en texte sécurisé avant de l'afficher dans le HTML.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Récupère l'utilisateur éventuellement enregistré localement.
 */
function getStoredUser() {
  try {
    const storedUser = localStorage.getItem("user");

    if (!storedUser || storedUser === "undefined") {
      return null;
    }

    return JSON.parse(storedUser);
  } catch (error) {
    console.error("Utilisateur local invalide :", error);
    return null;
  }
}

/**
 * Récupère le véritable utilisateur connecté depuis le token actuel.
 */
async function loadConnectedUser() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      connectedUser = getStoredUser();
      return connectedUser;
    }

    connectedUser = result.data?.user || result.data || null;

    if (connectedUser) {
      localStorage.setItem("user", JSON.stringify(connectedUser));
    }

    return connectedUser;
  } catch (error) {
    console.error(
      "Impossible de récupérer l'utilisateur connecté :",
      error
    );

    connectedUser = getStoredUser();
    return connectedUser;
  }
}

/**
 * Formate seulement l'heure d'un message.
 */
function formatMessageTime(date) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "";

  return parsedDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formate la date utilisée comme séparateur entre les journées.
 */
function formatMessageDate(date) {
  if (!date) return "";

  const messageDate = new Date(date);

  if (Number.isNaN(messageDate.getTime())) {
    return "";
  }

  const today = new Date();

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return "Aujourd’hui";
  }

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Hier";
  }

  return messageDate.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Extrait le tableau de messages, quelle que soit la structure de l'API.
 */
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

/**
 * Récupère l'identifiant de l'expéditeur.
 */
function getMessageSenderId(message) {
  return (
    message.senderId ||
    message.userId ||
    message.sender?.id ||
    message.user?.id ||
    null
  );
}

/**
 * Récupère le nom de l'expéditeur.
 */
function getMessageSenderName(message) {
  return (
    message.sender?.fullName ||
    message.sender?.name ||
    message.user?.fullName ||
    message.user?.name ||
    message.senderName ||
    "Utilisateur"
  );
}

/**
 * Affiche les messages comme dans WhatsApp Web.
 */
function renderMessages(messages) {
  messagesContainer.innerHTML = "";

  if (!Array.isArray(messages) || messages.length === 0) {
    messagesContainer.innerHTML = `
      <div class="h-full flex items-center justify-center text-slate-400">
        Aucun message dans cette conversation.
      </div>
    `;
    return;
  }

  const currentUserId = connectedUser?.id || null;
  let lastDisplayedDate = "";

  messages.forEach((message) => {
    const displayedDate = formatMessageDate(message.createdAt);

    if (displayedDate && displayedDate !== lastDisplayedDate) {
      const dateSeparator = document.createElement("div");

      dateSeparator.className =
        "flex justify-center items-center my-4";

      dateSeparator.innerHTML = `
        <span
          class="bg-white/90 dark:bg-slate-700 text-slate-600 dark:text-slate-200
                 text-xs font-medium px-4 py-1.5 rounded-lg shadow-sm"
        >
          ${escapeHtml(displayedDate)}
        </span>
      `;

      messagesContainer.appendChild(dateSeparator);
      lastDisplayedDate = displayedDate;
    }

    const senderId = getMessageSenderId(message);
    const isMine = Boolean(currentUserId && senderId === currentUserId);

    const wrapper = document.createElement("div");

    wrapper.className = isMine
      ? "flex justify-end"
      : "flex justify-start";

    const senderName = getMessageSenderName(message);
    const safeContent = escapeHtml(message.content);
    const safeTime = escapeHtml(formatMessageTime(message.createdAt));

    wrapper.innerHTML = `
      <div
        class="
          relative max-w-[75%] md:max-w-[65%]
          px-3 py-2 shadow-sm
          ${
            isMine
              ? "bg-[#d9fdd3] text-slate-900 rounded-lg rounded-tr-none"
              : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg rounded-tl-none"
          }
        "
      >
        ${
          !isMine
            ? `
              <p class="text-xs font-semibold text-blue-600 dark:text-blue-300 mb-1">
                ${escapeHtml(senderName)}
              </p>
            `
            : ""
        }

        <p class="text-sm leading-relaxed whitespace-pre-wrap break-words pr-12">
          ${safeContent}
        </p>

        <div class="absolute bottom-1.5 right-2 flex items-center gap-1">
          <span class="text-[10px] text-slate-500">
            ${safeTime}
          </span>

          ${
            isMine
              ? `
                <i
                  class="fa-solid fa-check-double text-[10px] text-blue-500"
                  title="Message envoyé"
                ></i>
              `
              : ""
          }
        </div>
      </div>
    `;

    messagesContainer.appendChild(wrapper);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Charge les messages d'une conversation.
 */
async function loadMessages(conversationId) {
  selectedConversationId = conversationId;

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

    const result = await response.json();

    console.log("Réponse messages :", result);

    if (!response.ok || !result.success) {
      messagesContainer.innerHTML = `
        <div class="h-full flex items-center justify-center text-red-500">
          ${escapeHtml(
            result.message || "Impossible de charger les messages."
          )}
        </div>
      `;
      return;
    }

    renderMessages(extractMessages(result));
  } catch (error) {
    console.error("Erreur de chargement des messages :", error);

    messagesContainer.innerHTML = `
      <div class="h-full flex items-center justify-center text-red-500">
        Erreur réseau. Impossible de charger les messages.
      </div>
    `;
  }
}

window.loadMessages = loadMessages;

/**
 * Envoie un nouveau message.
 */
messageForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const content = messageInput.value.trim();

  if (!selectedConversationId) {
    alert("Sélectionne d’abord une conversation.");
    return;
  }

  if (!content) {
    return;
  }

  const submitButton = messageForm.querySelector(
    'button[type="submit"]'
  );

  if (submitButton) {
    submitButton.disabled = true;
    submitButton.classList.add("opacity-60", "cursor-not-allowed");
  }

  try {
    const response = await fetch(
      `${API_URL}/conversations/${selectedConversationId}/messages`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        cache: "no-store",
        body: JSON.stringify({ content }),
      }
    );

    const result = await response.json();

    console.log("Message envoyé :", result);

    if (!response.ok || !result.success) {
      alert(
        result.message ||
          "Impossible d’envoyer le message."
      );
      return;
    }

    messageInput.value = "";

    await loadMessages(selectedConversationId);

    if (typeof window.loadConversations === "function") {
      await window.loadConversations();
    }
  } catch (error) {
    console.error("Erreur d'envoi du message :", error);
    alert("Erreur réseau lors de l’envoi du message.");
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove(
        "opacity-60",
        "cursor-not-allowed"
      );
    }

    messageInput.focus();
  }
});

/**
 * Charge l'utilisateur dès l'ouverture de la page.
 */
loadConnectedUser();

const messagesContainer = document.getElementById("messagesContainer");
const messageForm = document.getElementById("messageForm");
const messageInput = document.getElementById("messageInput");

let selectedConversationId = null;

function getCurrentUser() {
  try {
    const user = localStorage.getItem("user");
    if (!user || user === "undefined") return null;
    return JSON.parse(user);
  } catch {
    return null;
  }
}

function formatMessageTime(date) {
  if (!date) return "";

  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMessageDate(date) {
  const messageDate = new Date(date);
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (messageDate.toDateString() === today.toDateString()) {
    return "Aujourd'hui";
  }

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Hier";
  }

  return messageDate.toLocaleDateString("fr-FR");
}

function extractMessages(result) {
  if (Array.isArray(result.data?.messages)) return result.data.messages;
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.messages)) return result.messages;
  return [];
}

function getMessageSenderId(message) {
  return message.senderId || message.userId || message.sender?.id || message.user?.id;
}

function renderMessages(messages) {
  const currentUser = getCurrentUser();
  messagesContainer.innerHTML = "";

  if (!messages.length) {
    messagesContainer.innerHTML = `
      <div class="h-full flex items-center justify-center text-slate-400">
        Aucun message dans cette conversation.
      </div>
    `;
    return;
  }

  let lastDate = "";

  messages.forEach((message) => {
    const messageDate = formatMessageDate(message.createdAt);

    if (messageDate !== lastDate) {
      const dateSeparator = document.createElement("div");
      dateSeparator.className = "flex justify-center my-4";
      dateSeparator.innerHTML = `
        <span class="bg-slate-200 text-slate-600 text-xs px-4 py-1 rounded-full shadow-sm">
          ${messageDate}
        </span>
      `;
      messagesContainer.appendChild(dateSeparator);
      lastDate = messageDate;
    }

    const senderId = getMessageSenderId(message);
    const isMine = currentUser && senderId === currentUser.id;

    const wrapper = document.createElement("div");
    wrapper.className = isMine ? "flex justify-end" : "flex justify-start";

    wrapper.innerHTML = `
      <div class="${
        isMine
          ? "bg-green-200 text-slate-900 rounded-lg rounded-tr-none"
          : "bg-white text-slate-900 rounded-lg rounded-tl-none"
      } max-w-[70%] px-4 py-2 shadow-sm">

        <p class="text-sm leading-relaxed break-words">
          ${message.content}
        </p>

        <div class="flex justify-end items-center gap-1 mt-1">
          <span class="text-[11px] text-slate-500">
            ${formatMessageTime(message.createdAt)}
          </span>

          ${
            isMine
              ? `<i class="fa-solid fa-check-double text-[11px] text-blue-500"></i>`
              : ""
          }
        </div>
      </div>
    `;

    messagesContainer.appendChild(wrapper);
  });

  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function loadMessages(conversationId) {
  selectedConversationId = conversationId;

  messagesContainer.innerHTML = `
    <div class="h-full flex items-center justify-center text-slate-400">
      Chargement des messages...
    </div>
  `;

  try {
    const response = await fetch(`${API_URL}/conversations/${conversationId}/messages`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      messagesContainer.innerHTML = `
        <div class="h-full flex items-center justify-center text-red-500">
          ${result.message || "Impossible de charger les messages."}
        </div>
      `;
      return;
    }

    renderMessages(extractMessages(result));
  } catch (error) {
    messagesContainer.innerHTML = `
      <div class="h-full flex items-center justify-center text-red-500">
        Erreur : ${error.message}
      </div>
    `;
  }
}

window.loadMessages = loadMessages;

messageForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const content = messageInput.value.trim();

  if (!selectedConversationId) {
    alert("Sélectionne d'abord une conversation.");
    return;
  }

  if (!content) return;

  try {
    const response = await fetch(`${API_URL}/conversations/${selectedConversationId}/messages`, {
      method: "POST",
      headers: getAuthHeaders(),
      cache: "no-store",
      body: JSON.stringify({ content }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || "Impossible d'envoyer le message.");
      return;
    }

    messageInput.value = "";

    await loadMessages(selectedConversationId);

    if (typeof window.loadConversations === "function") {
      window.loadConversations();
    }
  } catch (error) {
    alert("Erreur réseau lors de l'envoi du message.");
    console.error(error);
  }
});
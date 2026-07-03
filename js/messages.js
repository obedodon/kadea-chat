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

function formatTime(date) {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractMessages(result) {
  return result.data?.messages || result.data || result.messages || [];
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

  messages.forEach((message) => {
    const senderId = getMessageSenderId(message);
    const isMine = currentUser && senderId === currentUser.id;

    const div = document.createElement("div");

    div.className = isMine
      ? "max-w-md ml-auto bg-blue-600 text-white rounded-xl rounded-tr-none p-4"
      : "max-w-md bg-white border border-slate-200 text-slate-700 rounded-xl rounded-tl-none p-4";

    div.innerHTML = `
      <p>${message.content}</p>
      <span class="block text-xs mt-2 ${isMine ? "text-blue-100" : "text-slate-400"}">
        ${formatTime(message.createdAt)}
      </span>
    `;

    messagesContainer.appendChild(div);
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
    console.log("Réponse messages :", result);

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
      body: JSON.stringify({ content }),
    });

    const result = await response.json();
    console.log("Message envoyé :", result);

    if (!response.ok || !result.success) {
      alert(result.message || "Impossible d'envoyer le message.");
      return;
    }
messageInput.value = "";

await loadMessages(selectedConversationId);

if (typeof window.loadConversations === "function") {
  window.loadConversations();
};
  } catch {
    alert("Erreur réseau lors de l'envoi du message.");
  }
});
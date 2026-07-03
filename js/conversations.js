const conversationsList = document.getElementById("conversationsList");
const searchConversation = document.getElementById("searchConversation");

let conversations = [];

function getInitials(name) {
  if (!name) return "KC";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function getConversationName(conversation) {
  return conversation.name || conversation.title || "Conversation";
}

function getLastMessage(conversation) {
  return conversation.lastMessage?.content || "Aucun message pour le moment";
}

function getLastMessageTime(conversation) {
  if (!conversation.lastMessage?.createdAt) return "";

  return new Date(conversation.lastMessage.createdAt).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function extractConversations(result) {
  if (Array.isArray(result.data)) return result.data;
  if (Array.isArray(result.data?.conversations)) return result.data.conversations;
  if (Array.isArray(result.conversations)) return result.conversations;
  return [];
}

function renderConversations(list) {
  conversationsList.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    conversationsList.innerHTML = `
      <p class="p-4 text-sm text-slate-500">
        Aucune conversation trouvée.
      </p>
    `;
    return;
  }

  list.forEach((conversation) => {
    const name = getConversationName(conversation);
    const initials = getInitials(name);
    const lastMessage = getLastMessage(conversation);
    const time = getLastMessageTime(conversation);

    const article = document.createElement("article");
    article.className =
      "p-4 border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition";

    article.innerHTML = `
      <div class="flex gap-3">
        <div class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
          ${initials}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex justify-between gap-2">
            <h3 class="font-semibold text-slate-900 truncate">${name}</h3>
            <span class="text-xs text-slate-400">${time}</span>
          </div>
          <p class="text-sm text-slate-500 truncate">${lastMessage}</p>
        </div>
      </div>
    `;

    article.addEventListener("click", () => {
      document.getElementById("chatName").textContent = name;
      document.getElementById("chatAvatar").textContent = initials;
    });

    conversationsList.appendChild(article);
  });
}

async function loadConversations() {
  try {
    conversationsList.innerHTML = `
      <p class="p-4 text-sm text-slate-500">
        Chargement des conversations...
      </p>
    `;

    const response = await fetch(`${API_URL}/conversations`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    const result = await response.json();
    console.log("Réponse conversations :", result);

    if (!response.ok || !result.success) {
      conversationsList.innerHTML = `
        <p class="p-4 text-sm text-red-500">
          ${result.message || "Impossible de charger les conversations."}
        </p>
      `;
      return;
    }

    conversations = extractConversations(result);
    renderConversations(conversations);
  } catch (error) {
    conversationsList.innerHTML = `
      <p class="p-4 text-sm text-red-500">
        Erreur réseau. Impossible de contacter l'API.
      </p>
    `;
    console.error(error);
  }
}

if (searchConversation) {
  searchConversation.addEventListener("input", function () {
    const value = searchConversation.value.toLowerCase();

    const filteredConversations = conversations.filter((conversation) => {
      const name = getConversationName(conversation).toLowerCase();
      return name.includes(value);
    });

    renderConversations(filteredConversations);
  });
}

loadConversations();
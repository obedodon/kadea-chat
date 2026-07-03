const conversationsList = document.getElementById("conversationsList");
const searchConversation = document.getElementById("searchConversation");
const modal = document.getElementById("newConversationModal");
const openModalBtn = document.getElementById("openNewConversationModal");
const closeModalBtn = document.getElementById("closeNewConversationModal");
const usersList = document.getElementById("usersList");

let conversations = [];
let activeConversationId = null;

function safeJsonParse(value) {
  try {
    if (!value || value === "undefined") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getInitials(name) {
  if (!name) return "KC";

  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function extractConversations(result) {
  return result.data?.conversations || [];
}

function extractUsers(result) {
  return result.data?.users || [];
}

function getConversationName(conversation) {
  return conversation.name || conversation.title || "Conversation";
}

function getLastMessage(conversation) {
  if (conversation.lastMessage?.content) {
    return conversation.lastMessage.content;
  }

  if (conversation.messages && conversation.messages.length > 0) {
    return conversation.messages[conversation.messages.length - 1].content;
  }

  return "Aucun message pour le moment";
}

function getLastMessageTime(conversation) {
  const lastMessage = conversation.lastMessage;

  if (lastMessage?.createdAt) {
    return new Date(lastMessage.createdAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (conversation.messages && conversation.messages.length > 0) {
    const message = conversation.messages[conversation.messages.length - 1];

    return new Date(message.createdAt).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return "";
}

function sortConversationsByActivity(list) {
  return [...list].sort((a, b) => {
    const dateA =
      a.lastMessage?.createdAt ||
      a.messages?.[a.messages.length - 1]?.createdAt ||
      a.updatedAt ||
      a.createdAt;

    const dateB =
      b.lastMessage?.createdAt ||
      b.messages?.[b.messages.length - 1]?.createdAt ||
      b.updatedAt ||
      b.createdAt;

    return new Date(dateB) - new Date(dateA);
  });
}

function renderConversations(list) {
  conversationsList.innerHTML = "";

  if (!list.length) {
    conversationsList.innerHTML = `
      <p class="p-4 text-sm text-slate-500">
        Aucune conversation trouvée.
      </p>
    `;
    return;
  }

  const sortedList = sortConversationsByActivity(list);

  sortedList.forEach((conversation) => {
    const name = getConversationName(conversation);
    const lastMessage = getLastMessage(conversation);
    const lastMessageTime = getLastMessageTime(conversation);
    const initials = getInitials(name);
    const isActive = activeConversationId === conversation.id;

    const article = document.createElement("article");

    article.className = isActive
      ? "p-4 border-b border-slate-100 bg-blue-50 cursor-pointer transition"
      : "p-4 border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition";

    article.innerHTML = `
      <div class="flex gap-3">
        <div class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
          ${initials}
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2">
            <h3 class="font-semibold text-slate-900 truncate">${name}</h3>
            <span class="text-xs ${isActive ? "text-blue-600" : "text-slate-400"}">
              ${lastMessageTime}
            </span>
          </div>

          <p class="text-sm ${isActive ? "text-slate-700" : "text-slate-500"} truncate">
            ${lastMessage}
          </p>
        </div>
      </div>
    `;

    article.addEventListener("click", () => {
      activeConversationId = conversation.id;

      document.getElementById("chatName").textContent = name;
      document.getElementById("chatAvatar").textContent = initials;

      renderConversations(conversations);

      if (typeof window.loadMessages === "function") {
        window.loadMessages(conversation.id);
      }
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
      cache: "no-store",
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
        Erreur : ${error.message}
      </p>
    `;
  }
}

window.loadConversations = loadConversations;

async function loadUsers() {
  try {
    usersList.innerHTML = `
      <p class="text-sm text-slate-500">
        Chargement des utilisateurs...
      </p>
    `;

    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const result = await response.json();
    console.log("Réponse utilisateurs :", result);

    if (!response.ok || !result.success) {
      usersList.innerHTML = `
        <p class="text-sm text-red-500">
          ${result.message || "Impossible de charger les utilisateurs."}
        </p>
      `;
      return;
    }

    const users = extractUsers(result);
    renderUsers(users);
  } catch (error) {
    usersList.innerHTML = `
      <p class="text-sm text-red-500">
        Erreur : ${error.message}
      </p>
    `;
  }
}

function renderUsers(users) {
  usersList.innerHTML = "";

  if (!users.length) {
    usersList.innerHTML = `
      <p class="text-sm text-slate-500">
        Aucun utilisateur trouvé.
      </p>
    `;
    return;
  }

  const connectedUser = safeJsonParse(localStorage.getItem("user"));

  users.forEach((user) => {
    if (connectedUser && user.id === connectedUser.id) return;

    const name = user.fullName || "Utilisateur";
    const email = user.email || "";
    const initials = getInitials(name);

    const button = document.createElement("button");
    button.className =
      "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition text-left";

    button.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
        ${initials}
      </div>

      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-900 truncate">${name}</p>
        <p class="text-sm text-slate-500 truncate">${email}</p>
      </div>
    `;

    button.addEventListener("click", () => {
      createPrivateConversation(user.id, name);
    });

    usersList.appendChild(button);
  });
}

async function createPrivateConversation(userId, userName) {
  try {
    usersList.innerHTML = `
      <p class="text-sm text-green-600">
        Création de la conversation...
      </p>
    `;

    const response = await fetch(`${API_URL}/conversations`, {
      method: "POST",
      headers: getAuthHeaders(),
      cache: "no-store",
      body: JSON.stringify({
        type: "private",
        name: userName,
        participantIds: [userId],
      }),
    });

    const result = await response.json();
    console.log("Création conversation :", result);

    if (!response.ok || !result.success) {
      usersList.innerHTML = `
        <p class="text-sm text-red-500">
          ${result.message || "Impossible de créer la conversation."}
        </p>
      `;
      return;
    }

    closeModal();
    loadConversations();
  } catch (error) {
    usersList.innerHTML = `
      <p class="text-sm text-red-500">
        Erreur : ${error.message}
      </p>
    `;
  }
}

function openModal() {
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  loadUsers();
}

function closeModal() {
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

openModalBtn?.addEventListener("click", openModal);
closeModalBtn?.addEventListener("click", closeModal);

searchConversation?.addEventListener("input", () => {
  const value = searchConversation.value.toLowerCase();

  const filtered = conversations.filter((conversation) =>
    getConversationName(conversation).toLowerCase().includes(value)
  );

  renderConversations(filtered);
});

loadConversations();
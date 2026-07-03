const conversationsList = document.getElementById("conversationsList");
const searchConversation = document.getElementById("searchConversation");
const modal = document.getElementById("newConversationModal");
const openModalBtn = document.getElementById("openNewConversationModal");
const closeModalBtn = document.getElementById("closeNewConversationModal");
const usersList = document.getElementById("usersList");

let conversations = [];

function safeJsonParse(value) {
  try {
    if (!value || value === "undefined") return null;
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getCurrentUser() {
  return safeJsonParse(localStorage.getItem("user"));
}

function getInitials(name) {
  if (!name) return "KC";
  return name.split(" ").map(word => word[0]).join("").substring(0, 2).toUpperCase();
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

function renderConversations(list) {
  conversationsList.innerHTML = "";

  if (!list.length) {
    conversationsList.innerHTML = `<p class="p-4 text-sm text-slate-500">Aucune conversation trouvée.</p>`;
    return;
  }

  list.forEach(conversation => {
    const name = getConversationName(conversation);
    const lastMessage = getLastMessage(conversation);
    const article = document.createElement("article");

    article.className = "p-4 border-b border-slate-100 hover:bg-blue-50 cursor-pointer transition";

    article.innerHTML = `
      <div class="flex gap-3">
        <div class="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
          ${getInitials(name)}
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-semibold text-slate-900 truncate">${name}</h3>
          <p class="text-sm text-slate-500 truncate">${lastMessage}</p>
        </div>
      </div>
    `;

    article.addEventListener("click", () => {
      document.getElementById("chatName").textContent = name;
      document.getElementById("chatAvatar").textContent = getInitials(name);

      if (typeof window.loadMessages === "function") {
        window.loadMessages(conversation.id);
      }
    });

    conversationsList.appendChild(article);
  });
}

async function loadConversations() {
  try {
    const response = await fetch(`${API_URL}/conversations`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const result = await response.json();
    console.log("Réponse conversations :", result);

    conversations = extractConversations(result);
    renderConversations(conversations);
  } catch (error) {
    conversationsList.innerHTML = `<p class="p-4 text-sm text-red-500">Erreur : ${error.message}</p>`;
  }
}

window.loadConversations = loadConversations;

async function loadUsers() {
  try {
    usersList.innerHTML = `<p class="text-sm text-slate-500">Chargement des utilisateurs...</p>`;

    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const result = await response.json();
    const users = extractUsers(result);
    renderUsers(users);
  } catch (error) {
    usersList.innerHTML = `<p class="text-sm text-red-500">Erreur : ${error.message}</p>`;
  }
}

function renderUsers(users) {
  usersList.innerHTML = "";

  if (!users.length) {
    usersList.innerHTML = `<p class="text-sm text-slate-500">Aucun utilisateur trouvé.</p>`;
    return;
  }

  const connectedUser = getCurrentUser();

  users.forEach(user => {
    if (connectedUser && user.id === connectedUser.id) return;

    const name = user.fullName || "Utilisateur";
    const email = user.email || "";

    const button = document.createElement("button");
    button.className = "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition text-left";

    button.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700">
        ${getInitials(name)}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-900 truncate">${name}</p>
        <p class="text-sm text-slate-500 truncate">${email}</p>
      </div>
    `;

    button.addEventListener("click", () => createPrivateConversation(user.id, name));
    usersList.appendChild(button);
  });
}

async function createPrivateConversation(userId, userName) {
  try {
    usersList.innerHTML = `<p class="text-sm text-green-600">Création de la conversation...</p>`;

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

    if (!response.ok || !result.success) {
      usersList.innerHTML = `<p class="text-sm text-red-500">${result.message || "Impossible de créer la conversation."}</p>`;
      return;
    }

    closeModal();
    loadConversations();
  } catch (error) {
    usersList.innerHTML = `<p class="text-sm text-red-500">Erreur : ${error.message}</p>`;
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
  const filtered = conversations.filter(conversation =>
    getConversationName(conversation).toLowerCase().includes(value)
  );
  renderConversations(filtered);
});

loadConversations();
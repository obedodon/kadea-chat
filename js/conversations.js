const conversationsList = document.getElementById("conversationsList");
const searchConversation = document.getElementById("searchConversation");

const modal = document.getElementById("newConversationModal");
const openModalBtn = document.getElementById("openNewConversationModal");
const closeModalBtn = document.getElementById("closeNewConversationModal");
const usersList = document.getElementById("usersList");

const conversationAvatarModal = document.getElementById("conversationAvatarModal");
const conversationBigAvatar = document.getElementById("conversationBigAvatar");
const conversationAvatarName = document.getElementById("conversationAvatarName");
const closeConversationAvatarModal = document.getElementById("closeConversationAvatarModal");

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

function getCurrentUser() {
  return safeJsonParse(localStorage.getItem("user"));
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

function getConversationName(conversation) {
  return conversation.name || "Conversation";
}

function getConversationAvatar(conversation) {
  const currentUser = getCurrentUser();

  const participant = conversation.participants?.find(
    (item) => item.user?.id !== currentUser?.id
  );

  return participant?.user?.avatarUrl || null;
}

function getLastMessage(conversation) {
  if (conversation.lastMessage?.content) return conversation.lastMessage.content;

  if (conversation.messages?.length) {
    return conversation.messages[conversation.messages.length - 1].content;
  }

  return "Aucun message pour le moment";
}

function getLastMessageTime(conversation) {
  const date =
    conversation.lastMessage?.createdAt ||
    conversation.messages?.[conversation.messages.length - 1]?.createdAt;

  if (!date) return "";

  return new Date(date).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function openConversationAvatar(avatarUrl, initials, name) {
  conversationAvatarName.textContent = name;

  if (avatarUrl) {
    conversationBigAvatar.innerHTML = `
      <img 
        src="${avatarUrl}"
        alt="${name}"
        class="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
      >
    `;
  } else {
    conversationBigAvatar.innerHTML = `
      <div class="w-80 h-80 rounded-full bg-white flex items-center justify-center text-7xl font-bold text-blue-600">
        ${initials}
      </div>
    `;
  }

  conversationAvatarModal.classList.remove("hidden");
  conversationAvatarModal.classList.add("flex");
}

function closeConversationAvatar() {
  conversationAvatarModal.classList.add("hidden");
  conversationAvatarModal.classList.remove("flex");
}

closeConversationAvatarModal?.addEventListener("click", closeConversationAvatar);

conversationAvatarModal?.addEventListener("click", (event) => {
  if (event.target === conversationAvatarModal) {
    closeConversationAvatar();
  }
});

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

  list.forEach((conversation) => {
    const name = getConversationName(conversation);
    const avatarUrl = getConversationAvatar(conversation);
    const initials = getInitials(name);
    const lastMessage = getLastMessage(conversation);
    const time = getLastMessageTime(conversation);
    const isActive = activeConversationId === conversation.id;

    const article = document.createElement("article");

    article.className = isActive
      ? "p-4 border-b bg-blue-50 cursor-pointer"
      : "p-4 border-b hover:bg-blue-50 cursor-pointer";

    article.innerHTML = `
      <div class="flex gap-3 items-center">
        <div 
          onclick="event.stopPropagation(); openConversationAvatar('${avatarUrl || ""}', '${initials}', '${name}')"
          class="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center font-bold text-blue-700 cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-lg hover:ring-4 hover:ring-blue-200"
        >
          ${
            avatarUrl
              ? `<img src="${avatarUrl}" alt="${name}" class="w-full h-full object-cover">`
              : initials
          }
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex justify-between">
            <h3 class="font-semibold truncate">${name}</h3>
            <span class="text-xs text-blue-500">${time}</span>
          </div>

          <p class="text-sm text-slate-500 truncate">${lastMessage}</p>
        </div>
      </div>
    `;

    article.addEventListener("click", () => {
      activeConversationId = conversation.id;

      document.getElementById("chatName").textContent = name;

      const chatAvatar = document.getElementById("chatAvatar");

      if (avatarUrl) {
        chatAvatar.innerHTML = `
          <img src="${avatarUrl}" alt="${name}" class="w-full h-full object-cover">
        `;
      } else {
        chatAvatar.innerHTML = initials;
      }

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

    if (!response.ok || !result.success) {
      conversationsList.innerHTML = `
        <p class="p-4 text-sm text-red-500">
          ${result.message || "Impossible de charger les conversations."}
        </p>
      `;
      return;
    }

    conversations = result.data?.conversations || [];
    renderConversations(conversations);
  } catch (error) {
    conversationsList.innerHTML = `
      <p class="p-4 text-sm text-red-500">
        Erreur chargement conversations.
      </p>
    `;
  }
}

window.loadConversations = loadConversations;

async function loadUsers() {
  try {
    usersList.innerHTML = `
      <p class="text-sm text-slate-500">Chargement des utilisateurs...</p>
    `;

    const response = await fetch(`${API_URL}/users`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      usersList.innerHTML = `
        <p class="text-sm text-red-500">
          ${result.message || "Impossible de charger les utilisateurs."}
        </p>
      `;
      return;
    }

    const users = result.data?.users || [];
    renderUsers(users);
  } catch (error) {
    usersList.innerHTML = `
      <p class="text-sm text-red-500">
        Erreur réseau. Impossible de charger les utilisateurs.
      </p>
    `;
  }
}

function renderUsers(users) {
  usersList.innerHTML = "";

  if (!users.length) {
    usersList.innerHTML = `
      <p class="text-sm text-slate-500">Aucun utilisateur trouvé.</p>
    `;
    return;
  }

  const currentUser = getCurrentUser();

  users.forEach((user) => {
    if (currentUser && user.id === currentUser.id) return;

    const name = user.fullName || "Utilisateur";
    const email = user.email || "";
    const initials = getInitials(name);

    const button = document.createElement("button");
    button.className =
      "w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition text-left";

    button.innerHTML = `
      <div class="w-10 h-10 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center font-bold text-blue-700">
        ${
          user.avatarUrl
            ? `<img src="${user.avatarUrl}" alt="${name}" class="w-full h-full object-cover">`
            : initials
        }
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

    if (!response.ok || !result.success) {
      usersList.innerHTML = `
        <p class="text-sm text-red-500">
          ${result.message || "Impossible de créer la conversation."}
        </p>
      `;
      return;
    }

    closeModal();
    await loadConversations();
  } catch (error) {
    usersList.innerHTML = `
      <p class="text-sm text-red-500">
        Erreur réseau. Impossible de créer la conversation.
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

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

searchConversation?.addEventListener("input", () => {
  const value = searchConversation.value.toLowerCase();

  const result = conversations.filter((item) =>
    getConversationName(item).toLowerCase().includes(value)
  );

  renderConversations(result);
});

loadConversations();
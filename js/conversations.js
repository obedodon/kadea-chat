const conversationsList = document.getElementById("conversationsList");
const searchConversation = document.getElementById("searchConversation");

const modal = document.getElementById("newConversationModal");
const openModalBtn = document.getElementById("openNewConversationModal");
const closeModalBtn = document.getElementById("closeNewConversationModal");
const usersList = document.getElementById("usersList");

const conversationAvatarModal = document.getElementById(
  "conversationAvatarModal"
);
const conversationBigAvatar = document.getElementById(
  "conversationBigAvatar"
);
const conversationAvatarName = document.getElementById(
  "conversationAvatarName"
);
const closeConversationAvatarModal = document.getElementById(
  "closeConversationAvatarModal"
);

let conversations = [];
let activeConversationId = null;

/*
  Cette variable globale permet à main.js de connaître
  la conversation actuellement sélectionnée.
*/
window.activeConversationId = null;

/* =========================================================
   STYLES DES CONVERSATIONS ET MODE SOMBRE
========================================================= */

const conversationStyles = document.createElement("style");

conversationStyles.textContent = `
  .conversation-item {
    border-bottom: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    transition:
      background-color 0.2s,
      color 0.2s;
  }

  .conversation-item:hover {
    background: #f1f5f9;
  }

  .conversation-item.active {
    background: #dbeafe;
  }

  .conversation-name {
    color: #0f172a;
  }

  .conversation-preview {
    color: #64748b;
  }

  .conversation-time {
    color: #3b82f6;
  }

  body.dark-mode .conversation-item {
    background: #1e293b !important;
    border-color: #334155 !important;
    color: #ffffff !important;
  }

  body.dark-mode .conversation-item:hover {
    background: #334155 !important;
  }

  body.dark-mode .conversation-item.active {
    background: #1e3a5f !important;
  }

  body.dark-mode .conversation-name {
    color: #ffffff !important;
  }

  body.dark-mode .conversation-preview {
    color: #cbd5e1 !important;
  }

  body.dark-mode .conversation-time {
    color: #93c5fd !important;
  }

  body.dark-mode #conversationsList {
    background: #1e293b !important;
  }

  body.dark-mode #newConversationModal > div {
    background: #1e293b !important;
    color: #ffffff !important;
  }

  body.dark-mode .user-choice {
    color: #ffffff !important;
  }

  body.dark-mode .user-choice:hover {
    background: #334155 !important;
  }

  body.dark-mode .user-choice-email {
    color: #cbd5e1 !important;
  }
`;

document.head.appendChild(conversationStyles);

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

function safeJsonParse(value) {
  try {
    if (!value || value === "undefined") {
      return null;
    }

    return JSON.parse(value);
  } catch {
    return null;
  }
}

function getCurrentUser() {
  return safeJsonParse(localStorage.getItem("user"));
}

function getInitials(name) {
  if (!name) {
    return "KC";
  }

  return name
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/* =========================================================
   INFORMATIONS D’UNE CONVERSATION
========================================================= */

function getOtherParticipant(conversation) {
  const currentUser = getCurrentUser();

  if (!Array.isArray(conversation.participants)) {
    return null;
  }

  return (
    conversation.participants.find(
      (participant) =>
        participant.user?.id &&
        participant.user.id !== currentUser?.id
    ) || conversation.participants[0]
  );
}

function getConversationName(conversation) {
  if (conversation.type === "private") {
    const otherParticipant = getOtherParticipant(conversation);

    return (
      otherParticipant?.user?.fullName ||
      otherParticipant?.user?.name ||
      conversation.name ||
      "Utilisateur"
    );
  }

  return conversation.name || "Groupe";
}

function getConversationAvatar(conversation) {
  if (conversation.type === "private") {
    const otherParticipant = getOtherParticipant(conversation);

    return otherParticipant?.user?.avatarUrl || null;
  }

  return conversation.avatarUrl || null;
}

function getLastMessageObject(conversation) {
  if (conversation.lastMessage) {
    return conversation.lastMessage;
  }

  if (
    Array.isArray(conversation.messages) &&
    conversation.messages.length > 0
  ) {
    return conversation.messages[
      conversation.messages.length - 1
    ];
  }

  return null;
}

function getMessageSenderName(message) {
  return (
    message?.sender?.fullName ||
    message?.sender?.name ||
    message?.user?.fullName ||
    message?.user?.name ||
    message?.senderName ||
    ""
  );
}

function getLastMessagePreview(conversation) {
  const lastMessage = getLastMessageObject(conversation);

  if (!lastMessage?.content) {
    return "Aucun message pour le moment";
  }

  if (conversation.type === "group") {
    const senderName = getMessageSenderName(lastMessage);

    return senderName
      ? `${senderName} : ${lastMessage.content}`
      : lastMessage.content;
  }

  return lastMessage.content;
}

function getLastMessageTime(conversation) {
  const lastMessage = getLastMessageObject(conversation);

  if (!lastMessage?.createdAt) {
    return "";
  }

  const date = new Date(lastMessage.createdAt);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function getConversationActivityDate(conversation) {
  const lastMessage = getLastMessageObject(conversation);

  return new Date(
    lastMessage?.createdAt ||
      conversation.updatedAt ||
      conversation.createdAt ||
      0
  ).getTime();
}

function sortConversationsByActivity(list) {
  return [...list].sort(
    (conversationA, conversationB) =>
      getConversationActivityDate(conversationB) -
      getConversationActivityDate(conversationA)
  );
}

/* =========================================================
   PHOTO EN GRAND
========================================================= */

function openConversationAvatar(
  avatarUrl,
  initials,
  name
) {
  if (
    !conversationAvatarModal ||
    !conversationBigAvatar
  ) {
    return;
  }

  if (conversationAvatarName) {
    conversationAvatarName.textContent = name;
  }

  if (avatarUrl) {
    conversationBigAvatar.innerHTML = `
      <img
        src="${escapeHtml(avatarUrl)}"
        alt="${escapeHtml(name)}"
        class="max-w-[90vw] max-h-[80vh] object-contain rounded-xl shadow-2xl"
      >
    `;
  } else {
    conversationBigAvatar.innerHTML = `
      <div
        class="w-72 h-72 rounded-full bg-blue-100
               flex items-center justify-center
               text-7xl font-bold text-blue-600"
      >
        ${escapeHtml(initials)}
      </div>
    `;
  }

  conversationAvatarModal.classList.remove("hidden");
  conversationAvatarModal.classList.add("flex");
}

function closeConversationAvatar() {
  conversationAvatarModal?.classList.add("hidden");
  conversationAvatarModal?.classList.remove("flex");
}

closeConversationAvatarModal?.addEventListener(
  "click",
  closeConversationAvatar
);

conversationAvatarModal?.addEventListener(
  "click",
  (event) => {
    if (event.target === conversationAvatarModal) {
      closeConversationAvatar();
    }
  }
);

/* =========================================================
   AFFICHAGE DES CONVERSATIONS
========================================================= */

function renderConversations(list) {
  if (!conversationsList) {
    return;
  }

  conversationsList.innerHTML = "";

  if (!Array.isArray(list) || list.length === 0) {
    conversationsList.innerHTML = `
      <p class="p-4 text-sm text-slate-500">
        Aucune conversation trouvée.
      </p>
    `;

    return;
  }

  const sortedConversations =
    sortConversationsByActivity(list);

  sortedConversations.forEach((conversation) => {
    const name = getConversationName(conversation);
    const avatarUrl =
      getConversationAvatar(conversation);
    const initials = getInitials(name);
    const lastMessagePreview =
      getLastMessagePreview(conversation);
    const time = getLastMessageTime(conversation);
    const isActive =
      activeConversationId === conversation.id;

    const article =
      document.createElement("article");

    article.className = `
      conversation-item
      p-4
      cursor-pointer
      ${isActive ? "active" : ""}
    `;

    article.innerHTML = `
      <div class="flex items-center gap-3">

        <button
          type="button"
          class="
            conversation-avatar
            w-12 h-12 shrink-0 rounded-full
            bg-blue-100 overflow-hidden
            flex items-center justify-center
            font-bold text-blue-700
            transition-all duration-300
            hover:scale-110
            hover:shadow-lg
            hover:ring-4
            hover:ring-blue-200
          "
          aria-label="Voir la photo de ${escapeHtml(name)}"
        >
          ${
            avatarUrl
              ? `
                <img
                  src="${escapeHtml(avatarUrl)}"
                  alt="${escapeHtml(name)}"
                  class="w-full h-full object-cover"
                >
              `
              : escapeHtml(initials)
          }
        </button>

        <div class="flex-1 min-w-0">

          <div class="flex items-center justify-between gap-3">

            <h3 class="conversation-name font-semibold truncate">
              ${escapeHtml(name)}
            </h3>

            <span class="conversation-time text-xs shrink-0">
              ${escapeHtml(time)}
            </span>

          </div>

          <p class="conversation-preview text-sm truncate mt-0.5">
            ${escapeHtml(lastMessagePreview)}
          </p>

        </div>

      </div>
    `;

    const avatarButton =
      article.querySelector(".conversation-avatar");

    avatarButton?.addEventListener(
      "click",
      (event) => {
        event.stopPropagation();

        openConversationAvatar(
          avatarUrl,
          initials,
          name
        );
      }
    );

    article.addEventListener("click", () => {
      activeConversationId = conversation.id;

      /*
        On expose aussi l'identifiant dans window
        pour que main.js puisse supprimer la conversation.
      */
      window.activeConversationId =
        conversation.id;

      const chatName =
        document.getElementById("chatName");

      const chatAvatar =
        document.getElementById("chatAvatar");

      if (chatName) {
        chatName.textContent = name;
      }

      if (chatAvatar) {
        if (avatarUrl) {
          chatAvatar.innerHTML = `
            <img
              src="${escapeHtml(avatarUrl)}"
              alt="${escapeHtml(name)}"
              class="w-full h-full object-cover"
            >
          `;
        } else {
          chatAvatar.textContent = initials;
        }
      }

      renderConversations(conversations);

      if (
        typeof window.loadMessages === "function"
      ) {
        window.loadMessages(conversation.id);
      }
    });

    conversationsList.appendChild(article);
  });
}

/* =========================================================
   CHARGEMENT DES CONVERSATIONS
========================================================= */

async function loadConversations() {
  if (!conversationsList) {
    return;
  }

  conversationsList.innerHTML = `
    <p class="p-4 text-sm text-slate-500">
      Chargement des conversations...
    </p>
  `;

  try {
    const response = await fetch(
      `${API_URL}/conversations`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      conversationsList.innerHTML = `
        <p class="p-4 text-sm text-red-500">
          ${escapeHtml(
            result.message ||
              "Impossible de charger les conversations."
          )}
        </p>
      `;

      return;
    }

    conversations =
      result.data?.conversations || [];

    /*
      Si la conversation sélectionnée a été supprimée,
      on oublie sa sélection.
    */
    const stillExists = conversations.some(
      (conversation) =>
        conversation.id === activeConversationId
    );

    if (!stillExists) {
      activeConversationId = null;
      window.activeConversationId = null;
    }

    renderConversations(conversations);
  } catch (error) {
    console.error(
      "Erreur conversations :",
      error
    );

    conversationsList.innerHTML = `
      <p class="p-4 text-sm text-red-500">
        Erreur réseau. Impossible de charger les conversations.
      </p>
    `;
  }
}

window.loadConversations =
  loadConversations;

/* =========================================================
   EFFACER LA SÉLECTION ACTIVE
========================================================= */

window.clearSelectedConversation = function () {
  activeConversationId = null;
  window.activeConversationId = null;

  renderConversations(conversations);
};

/* =========================================================
   NOUVELLE CONVERSATION
========================================================= */

async function loadUsers() {
  if (!usersList) {
    return;
  }

  usersList.innerHTML = `
    <p class="text-sm text-slate-500">
      Chargement des utilisateurs...
    </p>
  `;

  try {
    const response = await fetch(
      `${API_URL}/users`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      usersList.innerHTML = `
        <p class="text-sm text-red-500">
          ${escapeHtml(
            result.message ||
              "Impossible de charger les utilisateurs."
          )}
        </p>
      `;

      return;
    }

    renderUsers(result.data?.users || []);
  } catch (error) {
    console.error(
      "Erreur utilisateurs :",
      error
    );

    usersList.innerHTML = `
      <p class="text-sm text-red-500">
        Erreur réseau. Impossible de charger les utilisateurs.
      </p>
    `;
  }
}

function renderUsers(users) {
  if (!usersList) {
    return;
  }

  usersList.innerHTML = "";

  const currentUser = getCurrentUser();

  const availableUsers = users.filter(
    (user) => user.id !== currentUser?.id
  );

  if (availableUsers.length === 0) {
    usersList.innerHTML = `
      <p class="text-sm text-slate-500">
        Aucun autre utilisateur trouvé.
      </p>
    `;

    return;
  }

  availableUsers.forEach((user) => {
    const name =
      user.fullName ||
      user.name ||
      "Utilisateur";

    const email = user.email || "";
    const initials = getInitials(name);

    const button =
      document.createElement("button");

    button.type = "button";

    button.className = `
      user-choice
      w-full
      flex items-center gap-3
      p-3
      rounded-lg
      hover:bg-blue-50
      transition
      text-left
    `;

    button.innerHTML = `
      <div
        class="
          w-10 h-10 shrink-0 rounded-full
          bg-blue-100 overflow-hidden
          flex items-center justify-center
          font-bold text-blue-700
        "
      >
        ${
          user.avatarUrl
            ? `
              <img
                src="${escapeHtml(user.avatarUrl)}"
                alt="${escapeHtml(name)}"
                class="w-full h-full object-cover"
              >
            `
            : escapeHtml(initials)
        }
      </div>

      <div class="flex-1 min-w-0">

        <p class="font-semibold truncate">
          ${escapeHtml(name)}
        </p>

        <p class="user-choice-email text-sm text-slate-500 truncate">
          ${escapeHtml(email)}
        </p>

      </div>
    `;

    button.addEventListener("click", () => {
      createPrivateConversation(
        user.id,
        name
      );
    });

    usersList.appendChild(button);
  });
}

async function createPrivateConversation(
  userId,
  userName
) {
  if (!usersList) {
    return;
  }

  usersList.innerHTML = `
    <p class="text-sm text-green-600">
      Création de la conversation...
    </p>
  `;

  try {
    const response = await fetch(
      `${API_URL}/conversations`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        cache: "no-store",
        body: JSON.stringify({
          type: "private",
          name: userName,
          participantIds: [userId],
        }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      usersList.innerHTML = `
        <p class="text-sm text-red-500">
          ${escapeHtml(
            result.message ||
              "Impossible de créer la conversation."
          )}
        </p>
      `;

      return;
    }

    closeModal();
    await loadConversations();
  } catch (error) {
    console.error(
      "Erreur création conversation :",
      error
    );

    usersList.innerHTML = `
      <p class="text-sm text-red-500">
        Erreur réseau. Impossible de créer la conversation.
      </p>
    `;
  }
}

function openModal() {
  modal?.classList.remove("hidden");
  modal?.classList.add("flex");

  loadUsers();
}

function closeModal() {
  modal?.classList.add("hidden");
  modal?.classList.remove("flex");
}

openModalBtn?.addEventListener(
  "click",
  openModal
);

closeModalBtn?.addEventListener(
  "click",
  closeModal
);

modal?.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

/* =========================================================
   RECHERCHE
========================================================= */

searchConversation?.addEventListener(
  "input",
  () => {
    const searchedValue =
      searchConversation.value
        .trim()
        .toLowerCase();

    const filteredConversations =
      conversations.filter(
        (conversation) =>
          getConversationName(conversation)
            .toLowerCase()
            .includes(searchedValue)
      );

    renderConversations(
      filteredConversations
    );
  }
);

/* =========================================================
   DÉMARRAGE
========================================================= */

loadConversations();
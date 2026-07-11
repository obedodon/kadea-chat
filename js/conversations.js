const conversationsList =
  document.getElementById("conversationsList");

const searchConversation =
  document.getElementById("searchConversation");

const newConversationModal =
  document.getElementById("newConversationModal");

const openNewConversationModalButton =
  document.getElementById("openNewConversationModal");

const closeNewConversationModalButton =
  document.getElementById("closeNewConversationModal");

const privateConversationTab =
  document.getElementById("privateConversationTab");

const groupConversationTab =
  document.getElementById("groupConversationTab");

const privateConversationSection =
  document.getElementById("privateConversationSection");

const groupConversationSection =
  document.getElementById("groupConversationSection");

const usersList =
  document.getElementById("usersList");

const groupUsersList =
  document.getElementById("groupUsersList");

const searchPrivateUser =
  document.getElementById("searchPrivateUser");

const searchGroupUser =
  document.getElementById("searchGroupUser");

const groupNameInput =
  document.getElementById("groupName");

const groupAvatarUrlInput =
  document.getElementById("groupAvatarUrl");

const selectedGroupCount =
  document.getElementById("selectedGroupCount");

const groupCreationMessage =
  document.getElementById("groupCreationMessage");

const createGroupConversationButton =
  document.getElementById("createGroupConversationBtn");

const conversationAvatarModal =
  document.getElementById("conversationAvatarModal");

const conversationBigAvatar =
  document.getElementById("conversationBigAvatar");

const conversationAvatarName =
  document.getElementById("conversationAvatarName");

const closeConversationAvatarModalButton =
  document.getElementById("closeConversationAvatarModal");

let conversations = [];
let availableUsers = [];
let activeConversationId = null;

const selectedGroupUserIds = new Set();

window.activeConversationId = null;

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
  return safeJsonParse(
    localStorage.getItem("user")
  );
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

function extractUsers(result) {
  if (Array.isArray(result.data?.users)) {
    return result.data.users;
  }

  if (Array.isArray(result.data)) {
    return result.data;
  }

  if (Array.isArray(result.users)) {
    return result.users;
  }

  return [];
}

/* =========================================================
   INFORMATIONS DES CONVERSATIONS
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
    ) ||
    conversation.participants[0] ||
    null
  );
}

function getConversationName(conversation) {
  if (conversation.type === "private") {
    const otherParticipant =
      getOtherParticipant(conversation);

    return (
      otherParticipant?.user?.fullName ||
      otherParticipant?.user?.name ||
      conversation.name ||
      "Utilisateur"
    );
  }

  return (
    conversation.name ||
    conversation.title ||
    "Groupe"
  );
}

function getConversationAvatar(conversation) {
  if (conversation.type === "private") {
    const otherParticipant =
      getOtherParticipant(conversation);

    return (
      otherParticipant?.user?.avatarUrl ||
      null
    );
  }

  return (
    conversation.avatarUrl ||
    conversation.imageUrl ||
    null
  );
}

function getLastMessage(conversation) {
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
  const lastMessage =
    getLastMessage(conversation);

  if (!lastMessage?.content) {
    return "Aucun message pour le moment";
  }

  if (conversation.type === "group") {
    const senderName =
      getMessageSenderName(lastMessage);

    return senderName
      ? `${senderName} : ${lastMessage.content}`
      : lastMessage.content;
  }

  return lastMessage.content;
}

function getLastMessageTime(conversation) {
  const lastMessage =
    getLastMessage(conversation);

  const dateValue =
    lastMessage?.createdAt ||
    conversation.updatedAt ||
    conversation.createdAt;

  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const today = new Date();

  if (
    date.toDateString() ===
    today.toDateString()
  ) {
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
  const lastMessage =
    getLastMessage(conversation);

  const dateValue =
    lastMessage?.createdAt ||
    conversation.updatedAt ||
    conversation.createdAt ||
    0;

  return new Date(dateValue).getTime();
}

function sortConversationsByActivity(list) {
  return [...list].sort(
    (conversationA, conversationB) =>
      getConversationActivityDate(
        conversationB
      ) -
      getConversationActivityDate(
        conversationA
      )
  );
}

/* =========================================================
   PHOTO DE CONVERSATION
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
    conversationAvatarName.textContent =
      name;
  }

  if (avatarUrl) {
    conversationBigAvatar.innerHTML = `
      <img
        src="${escapeHtml(avatarUrl)}"
        alt="${escapeHtml(name)}"
        class="max-h-[80vh] max-w-[90vw] rounded-xl object-contain shadow-2xl"
      >
    `;
  } else {
    conversationBigAvatar.innerHTML = `
      <div
        class="flex h-72 w-72 items-center justify-center rounded-full bg-blue-100 text-7xl font-bold text-blue-600"
      >
        ${escapeHtml(initials)}
      </div>
    `;
  }

  conversationAvatarModal.classList.remove(
    "hidden"
  );

  conversationAvatarModal.classList.add(
    "flex"
  );
}

function closeConversationAvatar() {
  conversationAvatarModal?.classList.add(
    "hidden"
  );

  conversationAvatarModal?.classList.remove(
    "flex"
  );
}

closeConversationAvatarModalButton
  ?.addEventListener(
    "click",
    closeConversationAvatar
  );

conversationAvatarModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      conversationAvatarModal
    ) {
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

  if (
    !Array.isArray(list) ||
    list.length === 0
  ) {
    conversationsList.innerHTML = `
      <p class="p-4 text-sm text-slate-500">
        Aucune conversation trouvée.
      </p>
    `;

    return;
  }

  const sortedConversations =
    sortConversationsByActivity(list);

  sortedConversations.forEach(
    (conversation) => {
      const name =
        getConversationName(conversation);

      const avatarUrl =
        getConversationAvatar(conversation);

      const initials =
        getInitials(name);

      const lastMessage =
        getLastMessagePreview(conversation);

      const time =
        getLastMessageTime(conversation);

      const isActive =
        activeConversationId ===
        conversation.id;

      const isGroup =
        conversation.type === "group";

      const article =
        document.createElement("article");

      article.className = `
        conversation-item
        cursor-pointer
        border-b
        border-slate-200
        p-4
        transition
        hover:bg-slate-100
        dark:border-slate-700
        dark:hover:bg-slate-700
        ${
          isActive
            ? "bg-blue-50 dark:bg-slate-700"
            : "bg-white dark:bg-slate-800"
        }
      `;

      article.innerHTML = `
        <div class="flex items-center gap-3">

          <button
            type="button"
            class="conversation-avatar relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700 transition hover:scale-110 hover:ring-4 hover:ring-blue-200"
            aria-label="Voir la photo de ${escapeHtml(name)}"
          >
            ${
              avatarUrl
                ? `
                  <img
                    src="${escapeHtml(avatarUrl)}"
                    alt="${escapeHtml(name)}"
                    class="h-full w-full object-cover"
                  >
                `
                : escapeHtml(initials)
            }

            ${
              isGroup
                ? `
                  <span
                    class="absolute bottom-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[8px] text-white"
                  >
                    <i class="fa-solid fa-user-group"></i>
                  </span>
                `
                : ""
            }
          </button>

          <div class="min-w-0 flex-1">

            <div class="flex items-center justify-between gap-3">

              <h3
                class="truncate font-semibold text-slate-900 dark:text-white"
              >
                ${escapeHtml(name)}
              </h3>

              <span
                class="shrink-0 text-xs text-blue-500 dark:text-blue-300"
              >
                ${escapeHtml(time)}
              </span>

            </div>

            <p
              class="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-300"
            >
              ${escapeHtml(lastMessage)}
            </p>

          </div>

        </div>
      `;

      const avatarButton =
        article.querySelector(
          ".conversation-avatar"
        );

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

      article.addEventListener(
        "click",
        () => {
          activeConversationId =
            conversation.id;

          window.activeConversationId =
            conversation.id;

          const chatName =
            document.getElementById(
              "chatName"
            );

          const chatAvatar =
            document.getElementById(
              "chatAvatar"
            );

          const chatStatus =
            document.getElementById(
              "chatStatus"
            );

          if (chatName) {
            chatName.textContent = name;
          }

          if (chatStatus) {
            chatStatus.textContent = isGroup
              ? `${
                  conversation.participants
                    ?.length || 0
                } participant(s)`
              : "● En ligne";
          }

          if (chatAvatar) {
            if (avatarUrl) {
              chatAvatar.innerHTML = `
                <img
                  src="${escapeHtml(avatarUrl)}"
                  alt="${escapeHtml(name)}"
                  class="h-full w-full object-cover"
                >
              `;
            } else {
              chatAvatar.textContent =
                initials;
            }
          }

          renderConversations(
            conversations
          );

          if (
            typeof window.loadMessages ===
            "function"
          ) {
            window.loadMessages(
              conversation.id
            );
          }
        }
      );

      conversationsList.appendChild(
        article
      );
    }
  );
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

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
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
      result.data?.conversations ||
      result.data ||
      [];

    if (!Array.isArray(conversations)) {
      conversations = [];
    }

    const activeConversationExists =
      conversations.some(
        (conversation) =>
          conversation.id ===
          activeConversationId
      );

    if (!activeConversationExists) {
      activeConversationId = null;
      window.activeConversationId =
        null;
    }

    renderConversations(
      conversations
    );
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

window.clearSelectedConversation =
  function () {
    activeConversationId = null;

    window.activeConversationId =
      null;

    renderConversations(
      conversations
    );
  };

/* =========================================================
   CHARGEMENT DES UTILISATEURS
========================================================= */

async function loadUsers() {
  if (usersList) {
    usersList.innerHTML = `
      <p class="text-sm text-slate-500">
        Chargement des utilisateurs...
      </p>
    `;
  }

  if (groupUsersList) {
    groupUsersList.innerHTML = `
      <p class="text-sm text-slate-500">
        Chargement des utilisateurs...
      </p>
    `;
  }

  try {
    const response = await fetch(
      `${API_URL}/users`,
      {
        method: "GET",
        headers: getAuthHeaders(),
        cache: "no-store",
      }
    );

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
      const errorMessage =
        result.message ||
        "Impossible de charger les utilisateurs.";

      if (usersList) {
        usersList.innerHTML = `
          <p class="text-sm text-red-500">
            ${escapeHtml(errorMessage)}
          </p>
        `;
      }

      if (groupUsersList) {
        groupUsersList.innerHTML = `
          <p class="text-sm text-red-500">
            ${escapeHtml(errorMessage)}
          </p>
        `;
      }

      return;
    }

    const currentUser =
      getCurrentUser();

    availableUsers =
      extractUsers(result).filter(
        (user) =>
          user.id !==
          currentUser?.id
      );

    renderPrivateUsers(
      availableUsers
    );

    renderGroupUsers(
      availableUsers
    );
  } catch (error) {
    console.error(
      "Erreur utilisateurs :",
      error
    );

    if (usersList) {
      usersList.innerHTML = `
        <p class="text-sm text-red-500">
          Erreur réseau. Impossible de charger les utilisateurs.
        </p>
      `;
    }

    if (groupUsersList) {
      groupUsersList.innerHTML = `
        <p class="text-sm text-red-500">
          Erreur réseau. Impossible de charger les utilisateurs.
        </p>
      `;
    }
  }
}

/* =========================================================
   DISCUSSION PRIVÉE
========================================================= */

function renderPrivateUsers(users) {
  if (!usersList) {
    return;
  }

  usersList.innerHTML = "";

  if (users.length === 0) {
    usersList.innerHTML = `
      <p class="text-sm text-slate-500">
        Aucun utilisateur trouvé.
      </p>
    `;

    return;
  }

  users.forEach((user) => {
    const name =
      user.fullName ||
      user.name ||
      "Utilisateur";

    const email =
      user.email || "";

    const initials =
      getInitials(name);

    const button =
      document.createElement("button");

    button.type = "button";

    button.className = `
      user-choice
      flex
      w-full
      items-center
      gap-3
      rounded-lg
      p-3
      text-left
      transition
      hover:bg-blue-50
      dark:hover:bg-slate-700
    `;

    button.innerHTML = `
      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700"
      >
        ${
          user.avatarUrl
            ? `
              <img
                src="${escapeHtml(user.avatarUrl)}"
                alt="${escapeHtml(name)}"
                class="h-full w-full object-cover"
              >
            `
            : escapeHtml(initials)
        }
      </div>

      <div class="min-w-0 flex-1">

        <p
          class="truncate font-semibold text-slate-900 dark:text-white"
        >
          ${escapeHtml(name)}
        </p>

        <p
          class="truncate text-sm text-slate-500 dark:text-slate-300"
        >
          ${escapeHtml(email)}
        </p>

      </div>
    `;

    button.addEventListener(
      "click",
      () => {
        createPrivateConversation(
          user.id,
          name
        );
      }
    );

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

    const result =
      await response.json();

    if (
      !response.ok ||
      !result.success
    ) {
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

    closeNewConversationModal();

    await loadConversations();
  } catch (error) {
    console.error(
      "Erreur création conversation privée :",
      error
    );

    usersList.innerHTML = `
      <p class="text-sm text-red-500">
        Erreur réseau. Impossible de créer la conversation.
      </p>
    `;
  }
}

/* =========================================================
   CRÉATION D’UN GROUPE
========================================================= */

function updateSelectedGroupCount() {
  if (!selectedGroupCount) {
    return;
  }

  const count =
    selectedGroupUserIds.size;

  selectedGroupCount.textContent =
    `${count} sélectionné${
      count > 1 ? "s" : ""
    }`;

  if (createGroupConversationButton) {
    createGroupConversationButton.disabled =
      count < 2;
  }
}

function renderGroupUsers(users) {
  if (!groupUsersList) {
    return;
  }

  groupUsersList.innerHTML = "";

  if (users.length === 0) {
    groupUsersList.innerHTML = `
      <p class="text-sm text-slate-500">
        Aucun utilisateur trouvé.
      </p>
    `;

    return;
  }

  users.forEach((user) => {
    const name =
      user.fullName ||
      user.name ||
      "Utilisateur";

    const email =
      user.email || "";

    const initials =
      getInitials(name);

    const isSelected =
      selectedGroupUserIds.has(
        user.id
      );

    const label =
      document.createElement("label");

    label.className = `
      group-user-choice
      flex
      cursor-pointer
      items-center
      gap-3
      rounded-lg
      border
      p-3
      transition
      ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
          : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-700"
      }
    `;

    label.innerHTML = `
      <input
        type="checkbox"
        value="${escapeHtml(user.id)}"
        class="group-user-checkbox h-4 w-4 accent-blue-600"
        ${isSelected ? "checked" : ""}
      >

      <div
        class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-bold text-blue-700"
      >
        ${
          user.avatarUrl
            ? `
              <img
                src="${escapeHtml(user.avatarUrl)}"
                alt="${escapeHtml(name)}"
                class="h-full w-full object-cover"
              >
            `
            : escapeHtml(initials)
        }
      </div>

      <div class="min-w-0 flex-1">

        <p
          class="truncate font-semibold text-slate-900 dark:text-white"
        >
          ${escapeHtml(name)}
        </p>

        <p
          class="truncate text-sm text-slate-500 dark:text-slate-300"
        >
          ${escapeHtml(email)}
        </p>

      </div>
    `;

    const checkbox =
      label.querySelector(
        ".group-user-checkbox"
      );

    checkbox?.addEventListener(
      "change",
      () => {
        if (checkbox.checked) {
          selectedGroupUserIds.add(
            user.id
          );
        } else {
          selectedGroupUserIds.delete(
            user.id
          );
        }

        updateSelectedGroupCount();

        renderGroupUsers(
          filterGroupUsers()
        );
      }
    );

    groupUsersList.appendChild(label);
  });
}

function filterGroupUsers() {
  const searchValue =
    searchGroupUser?.value
      .trim()
      .toLowerCase() || "";

  return availableUsers.filter(
    (user) => {
      const fullName =
        (
          user.fullName ||
          user.name ||
          ""
        ).toLowerCase();

      const email =
        (
          user.email || ""
        ).toLowerCase();

      return (
        fullName.includes(
          searchValue
        ) ||
        email.includes(
          searchValue
        )
      );
    }
  );
}

function showGroupCreationMessage(
  message,
  type = "error"
) {
  if (!groupCreationMessage) {
    return;
  }

  groupCreationMessage.textContent =
    message;

  groupCreationMessage.className =
    type === "success"
      ? "mt-4 text-center text-sm font-medium text-green-600"
      : "mt-4 text-center text-sm font-medium text-red-600";
}

async function createGroupConversation() {
  const groupName =
    groupNameInput?.value
      .trim() || "";

  const avatarUrl =
    groupAvatarUrlInput?.value
      .trim() || "";

  const participantIds = [
    ...selectedGroupUserIds,
  ];

  if (!groupName) {
    showGroupCreationMessage(
      "Le nom du groupe est obligatoire."
    );

    groupNameInput?.focus();

    return;
  }

  if (participantIds.length < 2) {
    showGroupCreationMessage(
      "Sélectionne au moins deux participants."
    );

    return;
  }

  createGroupConversationButton.disabled =
    true;

  createGroupConversationButton.innerHTML = `
    <i class="fa-solid fa-spinner fa-spin mr-2"></i>
    Création du groupe...
  `;

  showGroupCreationMessage(
    "Création du groupe...",
    "success"
  );

  try {
    const requestBody = {
      type: "group",
      name: groupName,
      participantIds,
    };

    if (avatarUrl) {
      requestBody.avatarUrl =
        avatarUrl;
    }

    const response = await fetch(
      `${API_URL}/conversations`,
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

    if (
      !response.ok ||
      !result.success
    ) {
      showGroupCreationMessage(
        result.message ||
          "Impossible de créer le groupe."
      );

      return;
    }

    showGroupCreationMessage(
      "Groupe créé avec succès.",
      "success"
    );

    closeNewConversationModal();

    await loadConversations();
  } catch (error) {
    console.error(
      "Erreur création du groupe :",
      error
    );

    showGroupCreationMessage(
      "Erreur réseau. Impossible de créer le groupe."
    );
  } finally {
    createGroupConversationButton.disabled =
      selectedGroupUserIds.size < 2;

    createGroupConversationButton.innerHTML = `
      <i class="fa-solid fa-user-group mr-2"></i>
      Créer le groupe
    `;
  }
}

/* =========================================================
   ONGLETS PRIVÉ / GROUPE
========================================================= */

function activatePrivateConversationTab() {
  privateConversationSection?.classList.remove(
    "hidden"
  );

  groupConversationSection?.classList.add(
    "hidden"
  );

  privateConversationTab?.classList.remove(
    "bg-slate-100",
    "text-slate-700",
    "dark:bg-slate-700"
  );

  privateConversationTab?.classList.add(
    "bg-blue-600",
    "text-white"
  );

  groupConversationTab?.classList.remove(
    "bg-blue-600",
    "text-white"
  );

  groupConversationTab?.classList.add(
    "bg-slate-100",
    "text-slate-700",
    "dark:bg-slate-700",
    "dark:text-white"
  );
}

function activateGroupConversationTab() {
  privateConversationSection?.classList.add(
    "hidden"
  );

  groupConversationSection?.classList.remove(
    "hidden"
  );

  groupConversationTab?.classList.remove(
    "bg-slate-100",
    "text-slate-700",
    "dark:bg-slate-700"
  );

  groupConversationTab?.classList.add(
    "bg-blue-600",
    "text-white"
  );

  privateConversationTab?.classList.remove(
    "bg-blue-600",
    "text-white"
  );

  privateConversationTab?.classList.add(
    "bg-slate-100",
    "text-slate-700",
    "dark:bg-slate-700",
    "dark:text-white"
  );

  renderGroupUsers(
    filterGroupUsers()
  );
}

privateConversationTab
  ?.addEventListener(
    "click",
    activatePrivateConversationTab
  );

groupConversationTab
  ?.addEventListener(
    "click",
    activateGroupConversationTab
  );

/* =========================================================
   MODALE
========================================================= */

function resetNewConversationModal() {
  searchPrivateUser.value = "";
  searchGroupUser.value = "";
  groupNameInput.value = "";
  groupAvatarUrlInput.value = "";

  selectedGroupUserIds.clear();

  updateSelectedGroupCount();

  showGroupCreationMessage("");

  activatePrivateConversationTab();
}

function openNewConversationModal() {
  resetNewConversationModal();

  newConversationModal?.classList.remove(
    "hidden"
  );

  newConversationModal?.classList.add(
    "flex"
  );

  loadUsers();
}

function closeNewConversationModal() {
  newConversationModal?.classList.add(
    "hidden"
  );

  newConversationModal?.classList.remove(
    "flex"
  );
}

openNewConversationModalButton
  ?.addEventListener(
    "click",
    openNewConversationModal
  );

closeNewConversationModalButton
  ?.addEventListener(
    "click",
    closeNewConversationModal
  );

newConversationModal?.addEventListener(
  "click",
  (event) => {
    if (
      event.target ===
      newConversationModal
    ) {
      closeNewConversationModal();
    }
  }
);

/* =========================================================
   RECHERCHES
========================================================= */

searchConversation?.addEventListener(
  "input",
  () => {
    const searchValue =
      searchConversation.value
        .trim()
        .toLowerCase();

    const filteredConversations =
      conversations.filter(
        (conversation) =>
          getConversationName(
            conversation
          )
            .toLowerCase()
            .includes(searchValue)
      );

    renderConversations(
      filteredConversations
    );
  }
);

searchPrivateUser?.addEventListener(
  "input",
  () => {
    const searchValue =
      searchPrivateUser.value
        .trim()
        .toLowerCase();

    const filteredUsers =
      availableUsers.filter(
        (user) => {
          const fullName =
            (
              user.fullName ||
              user.name ||
              ""
            ).toLowerCase();

          const email =
            (
              user.email || ""
            ).toLowerCase();

          return (
            fullName.includes(
              searchValue
            ) ||
            email.includes(
              searchValue
            )
          );
        }
      );

    renderPrivateUsers(
      filteredUsers
    );
  }
);

searchGroupUser?.addEventListener(
  "input",
  () => {
    renderGroupUsers(
      filterGroupUsers()
    );
  }
);

createGroupConversationButton
  ?.addEventListener(
    "click",
    createGroupConversation
  );

/* =========================================================
   DÉMARRAGE
========================================================= */

updateSelectedGroupCount();
loadConversations();
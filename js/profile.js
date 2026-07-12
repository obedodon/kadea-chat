const profileAvatar = document.getElementById("profileAvatar");
const avatarButton = document.getElementById("avatarButton");
const profileName = document.getElementById("profileName");
const profileEmail = document.getElementById("profileEmail");
const profileForm = document.getElementById("profileForm");
const fullNameInput = document.getElementById("fullName");
const avatarUrlInput = document.getElementById("avatarUrl");
const profileMessage = document.getElementById("profileMessage");
const logoutBtn = document.getElementById("logoutBtn");

const avatarModal = document.getElementById("avatarModal");
const bigAvatar = document.getElementById("bigAvatar");
const closeAvatarModal = document.getElementById("closeAvatarModal");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");

function protectPage() {
  if (!localStorage.getItem("token")) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
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

function showMessage(text, type = "error") {
  profileMessage.textContent = text;
  profileMessage.className =
    type === "success"
      ? "text-center text-sm font-medium text-green-600"
      : "text-center text-sm font-medium text-red-600";
}

function updateAvatarPreview(fullName, avatarUrl) {
  if (avatarUrl) {
    profileAvatar.innerHTML = `
      <img src="${avatarUrl}" alt="Avatar" class="w-full h-full object-cover">
    `;
  } else {
    profileAvatar.innerHTML = "";
    profileAvatar.textContent = getInitials(fullName);
  }
}

function renderProfile(user) {
  const fullName = user.fullName || "Utilisateur";
  const email = user.email || "";
  const avatarUrl = user.avatarUrl || "";

  profileName.textContent = fullName;
  profileEmail.textContent = email;

  fullNameInput.value = fullName;
  avatarUrlInput.value = avatarUrl;

  updateAvatarPreview(fullName, avatarUrl);

  localStorage.setItem("user", JSON.stringify(user));
}

async function loadProfile() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
      cache: "no-store",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showMessage(result.message || "Impossible de charger le profil.");
      return;
    }

    const user = result.data?.user || result.data;
    renderProfile(user);
  } catch (error) {
    showMessage("Erreur réseau. Impossible de charger le profil.");
    console.error(error);
  }
}

function openAvatarModal() {
  bigAvatar.innerHTML = profileAvatar.innerHTML;

  avatarModal.classList.remove("hidden");
  avatarModal.classList.add("flex");
}

function closeAvatarModalBox() {
  avatarModal.classList.add("hidden");
  avatarModal.classList.remove("flex");
}

avatarButton?.addEventListener("click", openAvatarModal);

closeAvatarModal?.addEventListener("click", closeAvatarModalBox);

avatarModal?.addEventListener("click", (event) => {
  if (event.target === avatarModal) {
    closeAvatarModalBox();
  }
});

changeAvatarBtn?.addEventListener("click", () => {
  const newAvatarUrl = prompt("Colle la nouvelle URL de ta photo :");

  if (newAvatarUrl !== null) {
    avatarUrlInput.value = newAvatarUrl.trim();
    updateAvatarPreview(fullNameInput.value.trim(), newAvatarUrl.trim());
    bigAvatar.innerHTML = profileAvatar.innerHTML;
  }
});

avatarUrlInput?.addEventListener("input", () => {
  updateAvatarPreview(fullNameInput.value.trim(), avatarUrlInput.value.trim());
});

profileForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const fullName = fullNameInput.value.trim();
  const avatarUrl = avatarUrlInput.value.trim();

  if (!fullName) {
    showMessage("Le nom complet est obligatoire.");
    return;
  }

  try {
    showMessage("Mise à jour du profil...", "success");

    const response = await fetch(`${API_URL}/users/me`, {
      method: "PATCH",
      headers: getAuthHeaders(),
      cache: "no-store",
      body: JSON.stringify({ fullName, avatarUrl }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      showMessage(result.message || "Impossible de modifier le profil.");
      return;
    }

    const user = result.data?.user || result.data;
    renderProfile(user);

    showMessage("Profil modifié avec succès.", "success");
  } catch (error) {
    showMessage("Erreur réseau. Impossible de modifier le profil.");
    console.error(error);
  }
});

logoutBtn?.addEventListener("click", logout);

protectPage();
loadProfile();
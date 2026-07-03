function protectPage() {
  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

protectPage();

const videoCallBtn = document.getElementById("videoCallBtn");
const audioCallBtn = document.getElementById("audioCallBtn");
const chatMenuBtn = document.getElementById("chatMenuBtn");
const chatMenu = document.getElementById("chatMenu");
const clearConversationBtn = document.getElementById("clearConversationBtn");

const uiModal = document.getElementById("uiModal");
const uiModalIcon = document.getElementById("uiModalIcon");
const uiModalTitle = document.getElementById("uiModalTitle");
const uiModalText = document.getElementById("uiModalText");
const closeUiModal = document.getElementById("closeUiModal");

function openUiModal(icon, title, text) {
  uiModalIcon.textContent = icon;
  uiModalTitle.textContent = title;
  uiModalText.textContent = text;

  uiModal.classList.remove("hidden");
  uiModal.classList.add("flex");
}

function closeUiModalBox() {
  uiModal.classList.add("hidden");
  uiModal.classList.remove("flex");
}

videoCallBtn?.addEventListener("click", () => {
  openUiModal("📹", "Appel vidéo", "Cette fonctionnalité sera disponible prochainement.");
});

audioCallBtn?.addEventListener("click", () => {
  openUiModal("📞", "Appel audio", "Cette fonctionnalité sera disponible prochainement.");
});

closeUiModal?.addEventListener("click", closeUiModalBox);

uiModal?.addEventListener("click", (event) => {
  if (event.target === uiModal) {
    closeUiModalBox();
  }
});

chatMenuBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  chatMenu.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  if (
    chatMenu &&
    !chatMenu.classList.contains("hidden") &&
    !chatMenu.contains(event.target) &&
    event.target !== chatMenuBtn
  ) {
    chatMenu.classList.add("hidden");
  }
});

clearConversationBtn?.addEventListener("click", () => {
  chatMenu.classList.add("hidden");
  openUiModal("🧹", "Effacer la conversation", "Cette fonctionnalité sera connectée à l'API plus tard.");
});
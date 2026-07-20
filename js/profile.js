(() => {
  "use strict";

  const STORAGE_KEYS = Object.freeze({
    TOKEN: "token",
    USER: "user",
    AVATAR: "profileAvatar",
    BIO: "profileBio",
  });

  const state = {
    initialUser: null,
    currentAvatar: "",
  };

  const elements = {
    form: document.getElementById("profileForm"),
    fullName: document.getElementById("profileFullName"),
    email: document.getElementById("profileEmail"),
    bio: document.getElementById("profileBio"),
    bioCounter: document.getElementById("bioCounter"),
    message: document.getElementById("profileMessage"),

    displayName: document.getElementById("profileDisplayName"),
    displayEmail: document.getElementById("profileDisplayEmail"),

    avatar: document.getElementById("profileAvatar"),
    initials: document.getElementById("profileInitials"),
    avatarInput: document.getElementById("avatarInput"),
    removeAvatarBtn: document.getElementById("removeAvatarBtn"),

    avatarModal: document.getElementById("avatarModal"),
    openAvatarModal: document.getElementById("openAvatarModal"),
    closeAvatarModal: document.getElementById("closeAvatarModal"),
    bigAvatar: document.getElementById("bigAvatar"),
    bigAvatarInitials: document.getElementById("bigAvatarInitials"),
    changeAvatarBtn: document.getElementById("changeAvatarBtn"),

    resetBtn: document.getElementById("resetProfileBtn"),
    logoutBtn: document.getElementById("logoutBtn"),
  };

  function getToken() {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  function getStoredUser() {
    try {
      return JSON.parse(
        localStorage.getItem(STORAGE_KEYS.USER)
      );
    } catch {
      return null;
    }
  }

  function saveStoredUser(user) {
    localStorage.setItem(
      STORAGE_KEYS.USER,
      JSON.stringify(user)
    );
  }

  function protectPage() {
    if (!getToken()) {
      window.location.replace("login.html");
      return false;
    }

    return true;
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);

    window.location.replace("login.html");
  }

  function getUserName(user) {
    return (
      user?.fullName ||
      user?.name ||
      user?.username ||
      "Utilisateur"
    );
  }

  function getUserEmail(user) {
    return user?.email || "";
  }

  function getInitials(name = "") {
    const initials = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");

    return initials || "KC";
  }

  function showMessage(message, type = "error") {
    if (!elements.message) {
      return;
    }

    elements.message.textContent = message;

    elements.message.className =
      type === "success"
        ? "min-h-5 text-center text-sm font-medium text-green-600"
        : "min-h-5 text-center text-sm font-medium text-red-600";
  }

  function clearMessage() {
    if (!elements.message) {
      return;
    }

    elements.message.textContent = "";
  }

  function setSubmitting(isSubmitting) {
    const submitButton =
      elements.form?.querySelector(
        'button[type="submit"]'
      );

    if (!submitButton) {
      return;
    }

    if (!submitButton.dataset.originalContent) {
      submitButton.dataset.originalContent =
        submitButton.innerHTML;
    }

    submitButton.disabled = isSubmitting;

    submitButton.innerHTML = isSubmitting
      ? `
        <i class="fa-solid fa-spinner fa-spin mr-2"></i>
        Enregistrement...
      `
      : submitButton.dataset.originalContent;
  }

  function updateBioCounter() {
    if (!elements.bio || !elements.bioCounter) {
      return;
    }

    elements.bioCounter.textContent =
      `${elements.bio.value.length} / 160`;
  }

  function updateAvatarDisplay(avatar, fullName) {
    const hasAvatar =
      typeof avatar === "string" &&
      avatar.trim() !== "";

    const initials = getInitials(fullName);

    state.currentAvatar = hasAvatar ? avatar : "";

    if (elements.initials) {
      elements.initials.textContent = initials;
      elements.initials.classList.toggle(
        "hidden",
        hasAvatar
      );
    }

    if (elements.bigAvatarInitials) {
      elements.bigAvatarInitials.textContent =
        initials;

      elements.bigAvatarInitials.classList.toggle(
        "hidden",
        hasAvatar
      );
    }

    if (elements.avatar) {
      elements.avatar.classList.toggle(
        "hidden",
        !hasAvatar
      );

      elements.avatar.src = hasAvatar ? avatar : "";
    }

    if (elements.bigAvatar) {
      elements.bigAvatar.classList.toggle(
        "hidden",
        !hasAvatar
      );

      elements.bigAvatar.src =
        hasAvatar ? avatar : "";
    }

    elements.removeAvatarBtn?.classList.toggle(
      "hidden",
      !hasAvatar
    );
  }

  function renderUser(user) {
    const fullName = getUserName(user);
    const email = getUserEmail(user);

    const storedBio =
      localStorage.getItem(STORAGE_KEYS.BIO) || "";

    const storedAvatar =
      localStorage.getItem(STORAGE_KEYS.AVATAR) ||
      user?.avatar ||
      user?.avatarUrl ||
      user?.profilePicture ||
      "";

    if (elements.fullName) {
      elements.fullName.value = fullName;
    }

    if (elements.email) {
      elements.email.value = email;
    }

    if (elements.bio) {
      elements.bio.value =
        user?.bio || storedBio;
    }

    if (elements.displayName) {
      elements.displayName.textContent = fullName;
    }

    if (elements.displayEmail) {
      elements.displayEmail.textContent =
        email || "Adresse e-mail indisponible";
    }

    updateAvatarDisplay(storedAvatar, fullName);
    updateBioCounter();
  }

  function normalizeUserResponse(result) {
    return (
      result?.data?.user ||
      result?.data ||
      result?.user ||
      result
    );
  }

  async function authenticatedRequest(
    endpoint,
    options = {}
  ) {
    if (window.KadeaAPI?.request) {
      return window.KadeaAPI.request(
        endpoint,
        options
      );
    }

    if (
      options.method === "GET" &&
      window.KadeaAPI?.get
    ) {
      return window.KadeaAPI.get(endpoint);
    }

    if (
      options.method === "PATCH" &&
      window.KadeaAPI?.patch
    ) {
      return window.KadeaAPI.patch(
        endpoint,
        options.body
      );
    }

    const token = getToken();

    const response = await fetch(
      `${API_URL}${endpoint}`,
      {
        method: options.method || "GET",

        headers: {
          ...getAuthHeaders(),
          ...(options.headers || {}),
        },

        body: options.body
          ? JSON.stringify(options.body)
          : undefined,

        cache: "no-store",
      }
    );

    const result = await response
      .json()
      .catch(() => null);

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      logout();
      throw new Error("Session expirée.");
    }

    if (!response.ok || result?.success === false) {
      throw new Error(
        result?.message ||
        "La requête a échoué."
      );
    }

    return result;
  }

  async function loadProfile() {
    const storedUser = getStoredUser();

    if (storedUser) {
      state.initialUser = structuredCloneSafe(
        storedUser
      );

      renderUser(storedUser);
    }

    try {
      const result =
        await authenticatedRequest(
          "/auth/me",
          {
            method: "GET",
          }
        );

      const user =
        normalizeUserResponse(result);

      if (!user) {
        return;
      }

      const mergedUser = {
        ...storedUser,
        ...user,
      };

      state.initialUser =
        structuredCloneSafe(mergedUser);

      saveStoredUser(mergedUser);
      renderUser(mergedUser);
    } catch (error) {
      if (!storedUser) {
        showMessage(
          error.message ||
          "Impossible de charger le profil."
        );
      }
    }
  }

  function structuredCloneSafe(value) {
    if (typeof structuredClone === "function") {
      return structuredClone(value);
    }

    return JSON.parse(JSON.stringify(value));
  }

  function openAvatarModal() {
    if (!elements.avatarModal) {
      return;
    }

    elements.avatarModal.classList.remove("hidden");
    elements.avatarModal.classList.add("flex");

    document.body.classList.add("overflow-hidden");

    elements.closeAvatarModal?.focus();
  }

  function closeAvatarModal() {
    if (!elements.avatarModal) {
      return;
    }

    elements.avatarModal.classList.add("hidden");
    elements.avatarModal.classList.remove("flex");

    document.body.classList.remove("overflow-hidden");
  }

  function readImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.addEventListener("load", () => {
        resolve(reader.result);
      });

      reader.addEventListener("error", () => {
        reject(
          new Error(
            "Impossible de lire cette image."
          )
        );
      });

      reader.readAsDataURL(file);
    });
  }

  async function handleAvatarChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      showMessage(
        "Choisis une image JPG, PNG ou WebP."
      );

      event.target.value = "";
      return;
    }

    const maxFileSize = 2 * 1024 * 1024;

    if (file.size > maxFileSize) {
      showMessage(
        "L’image ne doit pas dépasser 2 Mo."
      );

      event.target.value = "";
      return;
    }

    try {
      const avatar = await readImageFile(file);

      localStorage.setItem(
        STORAGE_KEYS.AVATAR,
        avatar
      );

      updateAvatarDisplay(
        avatar,
        elements.fullName?.value
      );

      showMessage(
        "Photo de profil mise à jour.",
        "success"
      );
    } catch (error) {
      showMessage(error.message);
    }
  }

  function removeAvatar() {
    localStorage.removeItem(STORAGE_KEYS.AVATAR);

    if (elements.avatarInput) {
      elements.avatarInput.value = "";
    }

    updateAvatarDisplay(
      "",
      elements.fullName?.value
    );

    showMessage(
      "Photo de profil supprimée.",
      "success"
    );
  }

  function resetProfileForm() {
    const user =
      state.initialUser ||
      getStoredUser();

    if (!user) {
      return;
    }

    renderUser(user);
    clearMessage();
  }

  async function updateProfile(event) {
    event.preventDefault();

    const fullName =
      elements.fullName?.value.trim() || "";

    const bio =
      elements.bio?.value.trim() || "";

    if (fullName.length < 2) {
      showMessage(
        "Le nom doit contenir au moins 2 caractères."
      );

      elements.fullName?.focus();
      return;
    }

    setSubmitting(true);
    clearMessage();

    const currentUser =
      getStoredUser() || {};

    const updatedUser = {
      ...currentUser,
      fullName,
      name: fullName,
      bio,
    };

    try {
      let serverUser = null;

      try {
        const result =
          await authenticatedRequest(
            "/auth/me",
            {
              method: "PATCH",
              body: {
                fullName,
                bio,
              },
            }
          );

        serverUser =
          normalizeUserResponse(result);
      } catch (error) {
        console.warn(
          "La mise à jour distante du profil n’est pas disponible :",
          error.message
        );
      }

      const finalUser = {
        ...updatedUser,
        ...(serverUser || {}),
        fullName:
          serverUser?.fullName ||
          serverUser?.name ||
          fullName,
        bio:
          serverUser?.bio ??
          bio,
      };

      saveStoredUser(finalUser);

      localStorage.setItem(
        STORAGE_KEYS.BIO,
        finalUser.bio || ""
      );

      state.initialUser =
        structuredCloneSafe(finalUser);

      renderUser(finalUser);

      showMessage(
        "Profil enregistré avec succès.",
        "success"
      );
    } catch (error) {
      showMessage(
        error.message ||
        "Impossible d’enregistrer le profil."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleFullNameInput() {
    const name =
      elements.fullName?.value.trim() ||
      "Utilisateur";

    if (elements.displayName) {
      elements.displayName.textContent = name;
    }

    updateAvatarDisplay(
      state.currentAvatar,
      name
    );
  }

  function bindEvents() {
    elements.form?.addEventListener(
      "submit",
      updateProfile
    );

    elements.fullName?.addEventListener(
      "input",
      handleFullNameInput
    );

    elements.bio?.addEventListener(
      "input",
      updateBioCounter
    );

    elements.avatarInput?.addEventListener(
      "change",
      handleAvatarChange
    );

    elements.removeAvatarBtn?.addEventListener(
      "click",
      removeAvatar
    );

    elements.openAvatarModal?.addEventListener(
      "click",
      openAvatarModal
    );

    elements.closeAvatarModal?.addEventListener(
      "click",
      closeAvatarModal
    );

    elements.changeAvatarBtn?.addEventListener(
      "click",
      () => {
        closeAvatarModal();
        elements.avatarInput?.click();
      }
    );

    elements.resetBtn?.addEventListener(
      "click",
      resetProfileForm
    );

    elements.logoutBtn?.addEventListener(
      "click",
      logout
    );

    elements.avatarModal?.addEventListener(
      "click",
      (event) => {
        if (
          event.target ===
          elements.avatarModal
        ) {
          closeAvatarModal();
        }
      }
    );

    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === "Escape" &&
          !elements.avatarModal?.classList.contains(
            "hidden"
          )
        ) {
          closeAvatarModal();
        }
      }
    );
  }

  async function initializeProfilePage() {
    if (!protectPage()) {
      return;
    }

    bindEvents();
    await loadProfile();
  }

  window.ProfilePage = Object.freeze({
    reload: loadProfile,
    logout,
  });

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeProfilePage,
      {
        once: true,
      }
    );
  } else {
    initializeProfilePage();
  }
})();
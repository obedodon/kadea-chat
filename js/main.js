/* ==================================================
   PROTECTION DES PAGES
================================================== */

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



/* ==================================================
   UTILISATEUR CONNECTÉ
================================================== */

function getConnectedUser() {
  try {
    const user = localStorage.getItem("user");

    if (!user || user === "undefined") {
      return null;
    }

    return JSON.parse(user);

  } catch (error) {

    console.error("Erreur utilisateur :", error);
    return null;
  }
}


function displayConnectedUser() {

  const connectedUserName =
    document.getElementById("connectedUserName");


  const user = getConnectedUser();


  if (!connectedUserName || !user) {
    return;
  }


  connectedUserName.textContent =
    user.fullName ||
    user.name ||
    user.username ||
    "Utilisateur";

}


displayConnectedUser();




/* ==================================================
   BOUTONS APPEL + MENU
================================================== */

const videoCallBtn =
  document.getElementById("videoCallBtn");

const audioCallBtn =
  document.getElementById("audioCallBtn");

const chatMenuBtn =
  document.getElementById("chatMenuBtn");

const chatMenu =
  document.getElementById("chatMenu");

const clearConversationBtn =
  document.getElementById("clearConversationBtn");



/* ==================================================
   MODAL SIMPLE
================================================== */

const uiModal =
  document.getElementById("uiModal");

const uiModalIcon =
  document.getElementById("uiModalIcon");

const uiModalTitle =
  document.getElementById("uiModalTitle");

const uiModalText =
  document.getElementById("uiModalText");

const closeUiModal =
  document.getElementById("closeUiModal");



function openUiModal(icon, title, text) {

  if (!uiModal) return;


  uiModalIcon.textContent = icon;

  uiModalTitle.textContent = title;

  uiModalText.textContent = text;


  uiModal.classList.remove("hidden");

  uiModal.classList.add("flex");
}



function closeUiModalBox() {

  if (!uiModal) return;


  uiModal.classList.add("hidden");

  uiModal.classList.remove("flex");

}



/* ==================================================
   APPEL VIDÉO
================================================== */

videoCallBtn?.addEventListener(
  "click",
  () => {

    openUiModal(
      "📹",
      "Appel vidéo",
      "Cette fonctionnalité sera disponible prochainement."
    );

  }
);



/* ==================================================
   APPEL AUDIO
================================================== */

audioCallBtn?.addEventListener(
  "click",
  () => {

    openUiModal(
      "📞",
      "Appel audio",
      "Cette fonctionnalité sera disponible prochainement."
    );

  }
);




/* ==================================================
   FERMETURE MODAL
================================================== */

closeUiModal?.addEventListener(
  "click",
  closeUiModalBox
);



uiModal?.addEventListener(
  "click",
  (event) => {

    if (event.target === uiModal) {

      closeUiModalBox();

    }

  }
);



/* ==================================================
   MENU 3 POINTS
================================================== */


chatMenuBtn?.addEventListener(
  "click",
  (event) => {

    event.stopPropagation();

    chatMenu?.classList.toggle("hidden");

  }
);




document.addEventListener(
  "click",
  (event) => {

    if (
      chatMenu &&
      !chatMenu.classList.contains("hidden") &&
      !chatMenu.contains(event.target)
    ) {

      chatMenu.classList.add("hidden");

    }

  }
);




/* ==================================================
   EFFACER CONVERSATION
================================================== */


clearConversationBtn?.addEventListener(
  "click",
  () => {

    chatMenu?.classList.add("hidden");


    openUiModal(
      "🧹",
      "Effacer la conversation",
      "Cette fonctionnalité sera connectée à l'API plus tard."
    );

  }
);
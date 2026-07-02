const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

function showMessage(text, type = "error") {
  if (!message) return;

  message.textContent = text;

  message.className =
    type === "success"
      ? "text-sm text-center font-medium text-green-600"
      : "text-sm text-center font-medium text-red-600";
}

function isValidEmail(email) {
  return email.includes("@") && email.includes(".");
}

// ===============================
// Affichage temporaire du mot de passe
// ===============================
function holdToShowPassword(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (!input || !button) return;

  const showPassword = () => {
    input.type = "text";
  };

  const hidePassword = () => {
    input.type = "password";
  };

  button.addEventListener("mousedown", showPassword);
  button.addEventListener("mouseup", hidePassword);
  button.addEventListener("mouseleave", hidePassword);

  // Support mobile
  button.addEventListener("touchstart", showPassword);
  button.addEventListener("touchend", hidePassword);
}

holdToShowPassword("password", "togglePassword");
holdToShowPassword("confirmPassword", "toggleConfirmPassword");

// ===============================
// Inscription
// ===============================
if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    showMessage("");

    if (!fullName || !email || !password || !confirmPassword) {
      showMessage("Veuillez remplir tous les champs.");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("Adresse email invalide.");
      return;
    }

    if (password.length < 6) {
      showMessage("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      showMessage("Création du compte en cours...", "success");

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: getPublicHeaders(),
        body: JSON.stringify({
          fullName,
          email,
          password,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showMessage(result.message || "Erreur lors de l'inscription.");
        return;
      }

      showMessage("Compte créé avec succès ! Redirection...", "success");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (error) {
      showMessage("Erreur réseau. Vérifie ta connexion internet.");
      console.error(error);
    }
  });
}
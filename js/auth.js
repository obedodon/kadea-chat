const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

function showMessage(elementId, text, type = "error") {
  const message = document.getElementById(elementId);
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
  button.addEventListener("touchstart", showPassword);
  button.addEventListener("touchend", hidePassword);
}

holdToShowPassword("password", "togglePassword");
holdToShowPassword("confirmPassword", "toggleConfirmPassword");
holdToShowPassword("loginPassword", "toggleLoginPassword");

if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    showMessage("message", "");

    if (!fullName || !email || !password || !confirmPassword) {
      showMessage("message", "Veuillez remplir tous les champs.");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("message", "Adresse email invalide.");
      return;
    }

    if (password.length < 6) {
      showMessage("message", "Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("message", "Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      showMessage("message", "Création du compte en cours...", "success");

      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: getPublicHeaders(),
        body: JSON.stringify({ fullName, email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showMessage("message", result.message || "Erreur lors de l'inscription.");
        return;
      }

      showMessage("message", "Compte créé avec succès ! Redirection...", "success");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);
    } catch (error) {
      showMessage("message", "Erreur réseau. Vérifie ta connexion internet.");
      console.error(error);
    }
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    showMessage("loginMessage", "");

    if (!email || !password) {
      showMessage("loginMessage", "Veuillez remplir tous les champs.");
      return;
    }

    if (!isValidEmail(email)) {
      showMessage("loginMessage", "Adresse email invalide.");
      return;
    }

    try {
      showMessage("loginMessage", "Connexion en cours...", "success");

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: getPublicHeaders(),
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        showMessage("loginMessage", result.message || "Email ou mot de passe incorrect.");
        return;
      }

      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));

      showMessage("loginMessage", "Connexion réussie ! Redirection...", "success");

      setTimeout(() => {
        window.location.href = "index.html";
      }, 1000);
    } catch (error) {
      showMessage("loginMessage", "Erreur réseau. Vérifie ta connexion internet.");
      console.error(error);
    }
  });
}
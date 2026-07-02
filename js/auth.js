const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

if (registerForm) {
  registerForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    message.textContent = "";
    message.style.color = "red";

    if (!fullName || !email || !password || !confirmPassword) {
      message.textContent = "Veuillez remplir tous les champs.";
      return;
    }

    if (!email.includes("@")) {
      message.textContent = "Adresse email invalide.";
      return;
    }

    if (password !== confirmPassword) {
      message.textContent = "Les mots de passe ne correspondent pas.";
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: fullName,
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        message.textContent = data.message || "Erreur lors de l'inscription.";
        return;
      }

      message.style.color = "green";
      message.textContent = "Compte créé avec succès. Redirection...";

      setTimeout(function () {
        window.location.href = "login.html";
      }, 1500);

    } catch (error) {
      message.textContent = "Erreur réseau. Vérifie que l'API est lancée.";
    }
  });
}
"use strict";

(() => {
  const $ = (selector) =>
    document.querySelector(selector);

  function showMessage(
    element,
    message,
    type = "error"
  ) {
    if (!element) {
      return;
    }

    element.textContent = message;

    element.className =
      type === "success"
        ? "text-sm text-center font-medium text-green-600"
        : "text-sm text-center font-medium text-red-600";
  }

  function setSubmitting(
    form,
    isSubmitting,
    loadingText
  ) {
    const submitButton =
      form?.querySelector(
        'button[type="submit"]'
      );

    if (!submitButton) {
      return;
    }

    if (
      !submitButton.dataset.originalText
    ) {
      submitButton.dataset.originalText =
        submitButton.innerHTML;
    }

    submitButton.disabled =
      isSubmitting;

    submitButton.classList.toggle(
      "cursor-not-allowed",
      isSubmitting
    );

    submitButton.classList.toggle(
      "opacity-70",
      isSubmitting
    );

    submitButton.innerHTML =
      isSubmitting
        ? `
          <i class="fa-solid fa-spinner fa-spin mr-2"></i>
          ${loadingText}
        `
        : submitButton.dataset.originalText;
  }

  function bindPasswordVisibility(
    buttonId,
    inputId
  ) {
    const button =
      document.getElementById(buttonId);

    const input =
      document.getElementById(inputId);

    if (!button || !input) {
      return;
    }

    const showPassword = (
      event
    ) => {
      event.preventDefault();

      input.type = "text";

      button.setAttribute(
        "aria-label",
        "Masquer le mot de passe"
      );

      const icon =
        button.querySelector("i");

      if (icon) {
        icon.className =
          "fa-solid fa-eye-slash";
      }
    };

    const hidePassword = (
      event
    ) => {
      event?.preventDefault();

      input.type = "password";

      button.setAttribute(
        "aria-label",
        "Afficher le mot de passe"
      );

      const icon =
        button.querySelector("i");

      if (icon) {
        icon.className =
          "fa-solid fa-eye";
      }
    };

    button.addEventListener(
      "pointerdown",
      showPassword
    );

    button.addEventListener(
      "pointerup",
      hidePassword
    );

    button.addEventListener(
      "pointerleave",
      hidePassword
    );

    button.addEventListener(
      "pointercancel",
      hidePassword
    );

    button.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key === " " ||
          event.key === "Enter"
        ) {
          showPassword(event);
        }
      }
    );

    button.addEventListener(
      "keyup",
      hidePassword
    );
  }

  function normalizeAuthResponse(
    result
  ) {
    const data =
      result?.data || {};

    return {
      token:
        data.token ||
        data.accessToken ||
        result?.token ||
        null,

      user:
        data.user ||
        data.profile ||
        null,
    };
  }

  function saveSession(result) {
    const {
      token,
      user,
    } = normalizeAuthResponse(
      result
    );

    if (!token) {
      throw new Error(
        "Le serveur n’a renvoyé aucun jeton de connexion."
      );
    }

    localStorage.setItem(
      "token",
      token
    );

    if (user) {
      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );
    }
  }

  async function publicRequest(
    endpoint,
    payload
  ) {
    if (
      window.KadeaAPI?.post
    ) {
      return window.KadeaAPI.post(
        endpoint,
        payload,
        {
          auth: false,
        }
      );
    }

    const response =
      await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",

          headers:
            getPublicHeaders(),

          body:
            JSON.stringify(
              payload
            ),

          cache: "no-store",
        }
      );

    const result =
      await response
        .json()
        .catch(() => null);

    if (
      !response.ok ||
      !result?.success
    ) {
      throw new Error(
        result?.message ||
        "La requête a échoué."
      );
    }

    return result;
  }

  const loginForm =
    $("#loginForm");

  loginForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const email =
        $("#loginEmail")
          ?.value
          .trim() || "";

      const password =
        $("#loginPassword")
          ?.value || "";

      const message =
        $("#loginMessage");

      if (
        !email ||
        !password
      ) {
        showMessage(
          message,
          "Renseigne ton adresse e-mail et ton mot de passe."
        );

        return;
      }

      setSubmitting(
        loginForm,
        true,
        "Connexion..."
      );

      showMessage(
        message,
        "Connexion en cours...",
        "success"
      );

      try {
        const result =
          await publicRequest(
            "/auth/login",
            {
              email,
              password,
            }
          );

        saveSession(result);

        window.location.href =
          "index.html";
      } catch (error) {
        showMessage(
          message,
          error.message ||
          "Connexion impossible."
        );
      } finally {
        setSubmitting(
          loginForm,
          false,
          "Connexion..."
        );
      }
    }
  );

  const registerForm =
    $("#registerForm");

  registerForm?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const fullName =
        $("#fullName")
          ?.value
          .trim() || "";

      const email =
        $("#email")
          ?.value
          .trim() || "";

      const password =
        $("#password")
          ?.value || "";

      const confirmPassword =
        $("#confirmPassword")
          ?.value || "";

      const message =
        $("#message");

      if (
        !fullName ||
        !email ||
        !password ||
        !confirmPassword
      ) {
        showMessage(
          message,
          "Tous les champs sont obligatoires."
        );

        return;
      }

      if (
        password.length < 8
      ) {
        showMessage(
          message,
          "Le mot de passe doit contenir au moins 8 caractères."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        showMessage(
          message,
          "Les mots de passe ne correspondent pas."
        );

        return;
      }

      setSubmitting(
        registerForm,
        true,
        "Création..."
      );

      showMessage(
        message,
        "Création du compte...",
        "success"
      );

      try {
        await publicRequest(
          "/auth/register",
          {
            fullName,
            email,
            password,
          }
        );

        showMessage(
          message,
          "Compte créé. Redirection vers la connexion...",
          "success"
        );

        setTimeout(() => {
          window.location.href =
            "login.html";
        }, 900);
      } catch (error) {
        showMessage(
          message,
          error.message ||
          "Création du compte impossible."
        );
      } finally {
        setSubmitting(
          registerForm,
          false,
          "Création..."
        );
      }
    }
  );

  bindPasswordVisibility(
    "toggleLoginPassword",
    "loginPassword"
  );

  bindPasswordVisibility(
    "togglePassword",
    "password"
  );

  bindPasswordVisibility(
    "toggleConfirmPassword",
    "confirmPassword"
  );
})();
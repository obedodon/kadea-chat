(() => {
  "use strict";

  const THEME_STORAGE_KEY = "theme";
  const root = document.documentElement;

  function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);

    if (savedTheme === "dark" || savedTheme === "light") {
      return savedTheme;
    }

    const prefersDark =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    return prefersDark ? "dark" : "light";
  }

  function updateThemeButtons(theme) {
    const isDark = theme === "dark";

    document
      .querySelectorAll("#themeToggle")
      .forEach((button) => {
        button.setAttribute(
          "aria-label",
          isDark
            ? "Activer le mode clair"
            : "Activer le mode sombre"
        );

        button.setAttribute(
          "title",
          isDark
            ? "Passer en mode clair"
            : "Passer en mode sombre"
        );

        const icon = button.querySelector(
          "#themeIcon, i"
        );

        if (icon) {
          icon.className = isDark
            ? "fa-solid fa-sun"
            : "fa-solid fa-moon";
        }
      });
  }

  function applyTheme(theme, saveTheme = true) {
    const normalizedTheme =
      theme === "dark" ? "dark" : "light";

    const isDark =
      normalizedTheme === "dark";

    root.classList.toggle("dark", isDark);

    root.style.colorScheme =
      normalizedTheme;

    if (saveTheme) {
      localStorage.setItem(
        THEME_STORAGE_KEY,
        normalizedTheme
      );
    }

    updateThemeButtons(normalizedTheme);

    window.dispatchEvent(
      new CustomEvent("kadea:themechange", {
        detail: {
          theme: normalizedTheme,
          isDark,
        },
      })
    );
  }

  function toggleTheme() {
    const currentTheme =
      root.classList.contains("dark")
        ? "dark"
        : "light";

    const nextTheme =
      currentTheme === "dark"
        ? "light"
        : "dark";

    applyTheme(nextTheme);
  }

  function createThemeButton() {
    const existingButton =
      document.getElementById("themeToggle");

    if (existingButton) {
      return existingButton;
    }

    const button =
      document.createElement("button");

    button.id = "themeToggle";
    button.type = "button";

    button.className = `
      fixed
      right-4
      top-4
      z-[100]
      flex
      h-11
      w-11
      items-center
      justify-center
      rounded-full
      border
      border-slate-200
      bg-white
      text-slate-600
      shadow-lg
      transition
      duration-300
      hover:scale-105
      hover:text-blue-600
      focus:outline-none
      focus:ring-2
      focus:ring-blue-500
      dark:border-slate-700
      dark:bg-slate-800
      dark:text-yellow-300
    `;

    button.innerHTML = `
      <i
        id="themeIcon"
        class="fa-solid fa-moon"
      ></i>
    `;

    document.body.appendChild(button);

    return button;
  }

  function handleThemeClick(event) {
    const themeButton =
      event.target.closest("#themeToggle");

    if (!themeButton) {
      return;
    }

    toggleTheme();
  }

  function initializeTheme() {
    createThemeButton();

    const theme =
      getPreferredTheme();

    applyTheme(theme, false);

    document.addEventListener(
      "click",
      handleThemeClick
    );
  }

  window.KadeaTheme = Object.freeze({
    apply: applyTheme,
    toggle: toggleTheme,

    current() {
      return root.classList.contains("dark")
        ? "dark"
        : "light";
    },
  });

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initializeTheme,
      {
        once: true,
      }
    );
  } else {
    initializeTheme();
  }
})();
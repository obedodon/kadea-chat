(() => {
  "use strict";

  const CONFIG = Object.freeze({
    baseUrl: "https://kadea-chat-api.onrender.com",
    apiKey: "wksp_f5c1b59bb0373730aa978d4a44a264d5",
    tokenKey: "token",
    userKey: "user",
  });

  class ApiError extends Error {
    constructor(message, status = 0, data = null) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.data = data;
    }
  }

  function getToken() {
    return localStorage.getItem(CONFIG.tokenKey);
  }

  function setToken(token) {
    if (token) {
      localStorage.setItem(CONFIG.tokenKey, token);
    } else {
      localStorage.removeItem(CONFIG.tokenKey);
    }
  }

  function clearSession() {
    localStorage.removeItem(CONFIG.tokenKey);
    localStorage.removeItem(CONFIG.userKey);
  }

  function getPublicHeaders(extraHeaders = {}) {
    return {
      "Content-Type": "application/json",
      "x-api-key": CONFIG.apiKey,
      ...extraHeaders,
    };
  }

  function getAuthHeaders(extraHeaders = {}) {
    const token = getToken();

    return {
      ...getPublicHeaders(),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    };
  }

  async function parseResponse(response) {
    const text = await response.text();

    if (!text) return null;

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }

  function handleExpiredSession(status) {
    if (status !== 401 && status !== 403) return;

    clearSession();

    const currentPage = location.pathname.split("/").pop();

    if (!["login.html", "register.html"].includes(currentPage)) {
      location.href = "login.html";
    }
  }

  async function request(path, options = {}) {
    const {
      method = "GET",
      body,
      auth = true,
      headers = {},
      signal,
    } = options;

    const url = path.startsWith("http")
      ? path
      : `${CONFIG.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

    const requestHeaders = auth
      ? getAuthHeaders(headers)
      : getPublicHeaders(headers);

    const fetchOptions = {
      method,
      headers: requestHeaders,
      cache: "no-store",
      signal,
    };

    if (body !== undefined && body !== null) {
      fetchOptions.body =
        body instanceof FormData || typeof body === "string"
          ? body
          : JSON.stringify(body);

      if (body instanceof FormData) {
        delete fetchOptions.headers["Content-Type"];
      }
    }

    let response;

    try {
      response = await fetch(url, fetchOptions);
    } catch (error) {
      if (error.name === "AbortError") throw error;

      throw new ApiError(
        "Impossible de contacter le serveur. Vérifie ta connexion.",
        0,
        error
      );
    }

    const result = await parseResponse(response);

    if (!response.ok || result?.success === false) {
      handleExpiredSession(response.status);

      throw new ApiError(
        result?.message || `Erreur HTTP ${response.status}`,
        response.status,
        result
      );
    }

    return result;
  }

  const KadeaAPI = Object.freeze({
    request,
    get: (path, options = {}) =>
      request(path, { ...options, method: "GET" }),

    post: (path, body, options = {}) =>
      request(path, { ...options, method: "POST", body }),

    put: (path, body, options = {}) =>
      request(path, { ...options, method: "PUT", body }),

    patch: (path, body, options = {}) =>
      request(path, { ...options, method: "PATCH", body }),

    delete: (path, options = {}) =>
      request(path, { ...options, method: "DELETE" }),

    getToken,
    setToken,
    clearSession,
    getPublicHeaders,
    getAuthHeaders,
    ApiError,
  });

  // Compatibilité avec les anciens fichiers du projet.
  window.API_URL = CONFIG.baseUrl;
  window.API_KEY = CONFIG.apiKey;
  window.getToken = getToken;
  window.getPublicHeaders = getPublicHeaders;
  window.getAuthHeaders = getAuthHeaders;
  window.KadeaAPI = KadeaAPI;
})();
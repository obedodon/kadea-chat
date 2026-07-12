// Configuration de l'API Kadea Chat


const API_URL = "https://kadea-chat-api.onrender.com";

const API_KEY = "wksp_f5c1b59bb0373730aa978d4a44a264d5";

// Récupère le token JWT de l'utilisateur connecté
function getToken() {
  return localStorage.getItem("token");
}

// Headers pour les routes publiques
function getPublicHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
  };
}

// Headers pour les routes protégées
function getAuthHeaders() {
  return {
    "Content-Type": "application/json",
    "x-api-key": API_KEY,
    Authorization: `Bearer ${getToken()}`,
  };
}
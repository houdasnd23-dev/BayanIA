// lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.18:8000";
const TOKEN_KEY = "bayanIA_access_token";

export async function getToken(): Promise<string | null> {
  return await AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// Fonction utilitaire pour extraire les messages d'erreur de FastAPI
function extractErrorMessage(errorData: any): string {
  if (errorData?.detail) {
    return typeof errorData.detail === "string" 
      ? errorData.detail 
      : JSON.stringify(errorData.detail);
  }
  return "Une erreur inconnue est survenue.";
}

// Wrapper principal pour toutes les requêtes
export async function request(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();

  const headers: HeadersInit = {
    ...options.headers,
  };

  // On n'ajoute 'Content-Type': 'application/json' que si ce n'est pas un FormData (pour les uploads)
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Gestion de l'expiration du token ou de la non-autorisation
  if (res.status === 401) {
    await clearToken();
    // Redirection vers l'écran de connexion via Expo Router
    router.replace("/connexion");
    throw new Error("Session expirée, veuillez vous reconnecter.");
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(extractErrorMessage(errorData));
  }

  // Pour les réponses vides (ex: suppression)
  if (res.status === 204) return null;
  
  return res.json();
}
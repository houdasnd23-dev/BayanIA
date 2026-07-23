const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const TOKEN_KEY = "bayanIA_access_token";

// --- Gestion du token JWT ---
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

export function clearToken() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// --- Extraction propre des erreurs FastAPI (string OU tableau de validation) ---
function extractErrorMessage(errorData: any): string {
  if (!errorData?.detail) return "Une erreur est survenue";
  if (typeof errorData.detail === "string") return errorData.detail;
  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((d: any) => d.msg || JSON.stringify(d))
      .join(" | ");
  }
  return "Une erreur est survenue";
}

// --- Requête générique, avec injection automatique du Bearer token ---
async function request(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(extractErrorMessage(errorData));
  }

  return res.json();
}

// --- Types ---
interface RegisterPayload {
  nom_user: string;
  email: string;
  mot_de_passe: string;
  type_profil: string;
}

interface LoginPayload {
  email: string;
  mot_de_passe: string;
}

interface AuthResponse {
  access_token: string;
  token_type?: string;
  [key: string]: any;
}

// --- API Auth ---
export const authApi = {
  register: async (data: RegisterPayload): Promise<AuthResponse> => {
    const result = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (result?.access_token) setToken(result.access_token);
    return result;
  },

  login: async (email: string, motDePasse: string): Promise<AuthResponse> => {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, mot_de_passe: motDePasse }),
    });
    if (result?.access_token) setToken(result.access_token);
    return result;
},
  logout: () => {
    clearToken();
  },
};
// --- Types alignés sur les schémas Pydantic réels ---

export interface DonneeSensible {
  id_donnee: number;
  type_donnee: string;
  valeur_detectee: string;
  valeur_anonymisee: string;
  id_question: number;
}

export interface PieceJointe {
  id_piece: number;
  nom_fichier: string;
  date_ajout: string;
  taille_fichier: number;
  chemin_fichier: string;
  id_question: number;
}

export interface QuestionResponse {
  id_question: number;
  texte_question_brute: string;
  texte_question_anonymise: string;
  date_heure_envoi: string;
  mode_reponse: string;
  id_user: number;
  donnees_sensibles: DonneeSensible[];
  pieces_jointes: PieceJointe[];
}

export interface SourceJuridiqueResponse {
  type_source: string;
  titre_document: string;
  contenu_texte: string;
  numero_article: string | null;
  statut_validite: boolean;
  id_source: number;
  id_importation: number;
}

export interface ReponseIAResponse {
  id_reponse: number;
  texte_reponse: string;
  score_confiance: number;
  date_heure_generation: string;
  id_question: number;
  sources: SourceJuridiqueResponse[];
}


// --- API Questions ---
export const questionsApi = {
  // Étape 1 : crée la question, déclenche le RAG côté backend
  create: (
    texte_question_brute: string,
    mode_reponse: "simple" | "pro" = "simple"
  ): Promise<QuestionResponse> =>
    request("/questions", {
      method: "POST",
      body: JSON.stringify({ texte_question_brute, mode_reponse }),
    }),

  // Étape 2 : récupère la réponse générée + sources
  getReponse: (id_question: number): Promise<ReponseIAResponse> =>
    request(`/questions/${id_question}/reponse`, {
      method: "GET",
    }),

  // Upload d'une pièce jointe PDF sur une question existante
  uploadPieceJointe: (id_question: number, file: File): Promise<PieceJointe> => {
    const formData = new FormData();
    formData.append("file", file);
    return requestFormData(`/questions/${id_question}/pieces-jointes`, formData);
  },

  // Pratique : enchaîne create + getReponse d'un coup
  askAndGetAnswer: async (
    texte_question_brute: string,
    mode_reponse: "simple" | "pro" = "simple"
  ): Promise<{ question: QuestionResponse; reponse: ReponseIAResponse }> => {
    const question = await questionsApi.create(texte_question_brute, mode_reponse);
    const reponse = await questionsApi.getReponse(question.id_question);
    return { question, reponse };
  },
   list: (): Promise<QuestionResponse[]> =>
    request("/questions", { method: "GET" }),
};

// --- Requête avec FormData (pour upload de fichiers), sans Content-Type forcé ---
async function requestFormData(endpoint: string, formData: FormData) {
  const token = getToken();

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // ⚠️ pas de "Content-Type" ici — le navigateur le fixe automatiquement 
      // avec le bon "boundary" pour multipart/form-data
    },
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(extractErrorMessage(errorData));
  }

  return res.json();
}
// --- Type pour la mise à jour du profil ---
interface UserUpdatePayload {
  nom_user?: string;
  email?: string;
}

interface UserProfile {
  nom_user: string;
  email: string;
  id_user: number;
  date_creation_compte: string;
  id_profil: number;
  profil?: {
    type_profil: string;
    id_profil: number;
  };
}

// --- API Users ---
export const usersApi = {
  getMe: (): Promise<UserProfile> =>
    request("/users/me", { method: "GET" }),

  updateMe: (data: UserUpdatePayload): Promise<UserProfile> =>
    request("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};
export interface ImportationDocumentResponse {
  id_importation: number;
  date_importation: string;
  statut_indexation: string;
}

export interface AdminUser {
  nom_user: string;
  email: string;
  id_user: number;
  date_creation_compte: string;
  id_profil: number;
  profil?: { type_profil: string; id_profil: number };
}

export const adminApi = {
  uploadDocument: (
    titreDocument: string,
    typeSource: string,
    file: File
  ): Promise<ImportationDocumentResponse> => {
    const formData = new FormData();
    formData.append("titre_document", titreDocument);
    formData.append("type_source", typeSource);
    formData.append("file", file);
    return requestFormData("/admin/documents/upload", formData);
  },

  listUsers: (): Promise<AdminUser[]> =>
    request("/admin/utilisateurs", { method: "GET" }),

  listDocuments: (): Promise<ImportationDocumentDetail[]> =>
    request("/admin/documents", { method: "GET" }),
};
export interface ImportationDocumentDetail {
  id_importation: number;
  date_importation: string;
  statut_indexation: string;
  titre_document: string;
  type_source: string;
  nb_chunks: number;
}
export interface SourceSearchResult {
  id_source: number | null;
  titre_document: string | null;
  numero_article: string | null;
  contenu_texte: string | null;
  type_source: string | null;
  score: number;
}

export const sourcesApi = {
  search: (query: string): Promise<SourceSearchResult[]> =>
    request(`/sources/search?query=${encodeURIComponent(query)}`, {
      method: "GET",
    }),
};
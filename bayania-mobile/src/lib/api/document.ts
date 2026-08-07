import { getToken } from "../api";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "https://bayania-production.up.railway.app"

export interface ClauseRisque {
  clause: string;
  niveau_risque: string;
  explication: string;
}

export interface AnalyseDocumentResponse {
  resume: string;
  clauses_risque: ClauseRisque[];
  conformite: string;
  recommandations: string[];
}

// Type minimal représentant un fichier sélectionné via expo-document-picker
export interface PickedFile {
  uri: string;
  name: string;
  mimeType?: string | null;
  size?: number | null;
}

export const documentsApi = {
  // Upload multipart — équivalent RN du documentsApi.analysePdf(file, instructions) desktop
  analysePdf: async (
    file: PickedFile,
    instructions: string
  ): Promise<AnalyseDocumentResponse> => {
    const token = await getToken();

    const formData = new FormData();
    // React Native accepte cet objet spécial { uri, name, type } pour FormData
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/pdf",
    } as any);
    formData.append("instructions", instructions);

    const res = await fetch(`${API_URL}/documents/analyse-pdf`, {
      method: "POST",
      headers: {
        // Ne PAS fixer Content-Type manuellement : fetch doit générer
        // la boundary multipart lui-même en RN
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const message =
        typeof errorData?.detail === "string"
          ? errorData.detail
          : "Une erreur est survenue pendant l'analyse.";
      throw new Error(message);
    }

    return res.json();
  },
};
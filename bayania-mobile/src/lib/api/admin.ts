import { getToken, request } from "../api";

export interface ImportationDocumentDetail {
  id_importation: number;
  titre_document: string;
  type_source: string;
  statut_indexation: "COMPLETED" | "PENDING" | "FAILED" | string;
  nb_chunks: number;
  date_importation: string;
}

export interface AdminUser {
  id_user: number;
  nom_user: string;
  email: string;
  profil?: {
    type_profil?: string;
  };
}

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.18:8000";

export const adminApi = {
  listDocuments: (): Promise<ImportationDocumentDetail[]> =>
    request("/admin/documents"),

  listUsers: (): Promise<AdminUser[]> => request("/admin/users"),

  deleteDocument: (id: number): Promise<void> =>
    request(`/admin/documents/${id}`, { method: "DELETE" }),

  // Upload multipart — équivalent RN du <input type="file"> desktop
  uploadDocument: async (
    titre_document: string,
    type_source: string,
    file: { uri: string; name: string; mimeType?: string | null }
  ): Promise<ImportationDocumentDetail> => {
    const token = await getToken();

    const formData = new FormData();
    formData.append("titre_document", titre_document);
    formData.append("type_source", type_source);
    formData.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/pdf",
    } as any);

    const res = await fetch(`${API_URL}/admin/documents/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Content-Type volontairement omis : fetch RN génère la boundary lui-même
      },
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const message =
        typeof errorData?.detail === "string"
          ? errorData.detail
          : "Échec de l'importation du document.";
      throw new Error(message);
    }

    return res.json();
  },
};
import { request } from "../api";

export interface SourceSearchResult {
  id_source: number;
  titre_document: string;
  numero_article: string;
  contenu_texte: string;
  type_source: string;
  score: number;
}

export const sourcesApi = {
  search: (q: string, top_k: number = 10): Promise<SourceSearchResult[]> =>
    request(`/sources/search?q=${encodeURIComponent(q)}&top_k=${top_k}`),
};
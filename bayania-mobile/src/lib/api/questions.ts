import { request } from "../api";

export interface Source {
  id_source: string;
  titre_document: string;
  numero_article?: string;
  statut_validite: boolean;
}

export interface ReponseIAResponse {
  id_reponse: string;
  texte_reponse: string;
  score_confiance: number;
  sources: Source[];
}

export interface QuestionResponse {
  id_question: number;
  texte_question_brute: string;
  texte_question_anonymise: string;
  mode_reponse: string;
  date_heure_envoi: string;
}

export const questionsApi = {
  askQuestion: (
    texte_question_brute: string,
    mode_reponse: "pro" | "simple" = "pro"
  ): Promise<QuestionResponse> =>
    request("/questions", {
      method: "POST",
      body: JSON.stringify({ texte_question_brute, mode_reponse }),
    }),

  getReponse: (id_question: number): Promise<ReponseIAResponse> =>
    request(`/questions/${id_question}/reponse`),

  askAndGetAnswer: async (
    texte_question_brute: string,
    mode: "pro" | "simple" = "pro"
  ): Promise<{ question: QuestionResponse; reponse: ReponseIAResponse }> => {
    const question = await questionsApi.askQuestion(texte_question_brute, mode);
    const reponse = await questionsApi.getReponse(question.id_question);
    return { question, reponse };
  },

  // GET /questions — utilisé par l'écran Historique
  getHistory: (): Promise<QuestionResponse[]> => request("/questions"),
};
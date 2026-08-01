import { useLocalSearchParams } from "expo-router";
import {
  FileText,
  Sparkles
} from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View
} from "react-native";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { questionsApi } from "../../src/lib/api/questions"; // <-- IMPORT API

const tabs = ["Analyse détaillée", "Textes de loi", "Jurisprudence"];

// Couleurs (tu peux les garder de ton code)
const navy600 = "#1E3A8A"; const navy500 = "#334155"; const navy400 = "#5A677C"; 
const navy300 = "#7C93D6"; const navy50 = "#EEF2FC"; const surfaceMuted = "#F3F7FE"; 
const surfaceBorder = "#E3E8F3"; const successText = "#059669"; const successBg = "#ECFDF5"; 
const warningText = "#D97706"; const warningBg = "#FFFBEB";

export default function AnalysePage() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  
  // Lecture des paramètres depuis l'URL (Expo Router)
  const { q, item } = useLocalSearchParams<{ q: string; item: string }>();
  
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Appel API RAG au chargement de la page
  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        let query = "";
        if (q) {
          query = q;
        } else if (item) {
          const parsedItem = JSON.parse(decodeURIComponent(item));
          query = parsedItem.title;
        }

        if (query) {
          // Étape 1 : créer la question → le backend déclenche le RAG
          const questionData = await questionsApi.askQuestion(query);
          
          // Étape 2 : récupérer la réponse générée avec les sources
          const reponseData = await questionsApi.getReponse(questionData.id_question);
          
          // On combine les deux objets pour l'affichage
          setAnalysisData({ 
            question: questionData, 
            reponse: reponseData 
          });
        }
      } catch (error) {
        console.error("Erreur lors de l'analyse:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [q, item]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: surfaceMuted }}>
        <ActivityIndicator size="large" color={navy600} />
        <Text style={{ marginTop: 12, color: navy600 }}>Génération de l'analyse juridique...</Text>
      </View>
    );
  }

  // Mapping des champs selon les schémas Pydantic du backend:
  // - analysisData.question → QuestionResponse (texte_question_brute, mode_reponse...)
  // - analysisData.reponse  → ReponseIAResponse (texte_reponse, score_confiance, sources...)
  const queryText = q || (analysisData?.question?.texte_question_brute ?? "Analyse non trouvée");
  const answerText = analysisData?.reponse?.texte_reponse ?? "Le résumé analytique sera affiché ici...";
  const sources = analysisData?.reponse?.sources ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView style={{ flex: 1, backgroundColor: surfaceMuted }}>
        <Navbar />

        <View style={{ paddingHorizontal: 20, paddingVertical: 24 }}>
          {/* Header */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 11, color: navy300, marginBottom: 8 }}>
              Requête du jour
            </Text>
            <Text style={{ fontSize: 20, fontWeight: "700", color: navy600, marginBottom: 12, lineHeight: 28 }}>
              {queryText}
            </Text>
          </View>

          {/* Résumé Analytique de l'IA */}
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: surfaceBorder, backgroundColor: "#fff", padding: 20, marginBottom: 20 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Sparkles size={15} color={navy600} />
                <Text style={{ fontSize: 13, fontWeight: "600", color: navy600 }}>Résumé Analytique de BayanIA</Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: navy400, lineHeight: 20, marginBottom: 16 }}>
              {answerText}
            </Text>
          </View>

          {/* Sources (Mappées dynamiquement) */}
          <View style={{ borderRadius: 16, borderWidth: 1, borderColor: surfaceBorder, backgroundColor: "#fff", padding: 18, marginBottom: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: navy300, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 12 }}>
              Sources consultées ({sources.length})
            </Text>

            <View style={{ gap: 12 }}>
              {sources.length === 0 ? (
                <Text style={{ fontSize: 12, color: navy400 }}>Aucune source juridique spécifique retournée.</Text>
              ) : (
                sources.map((s: any, idx: number) => (
                  <View key={idx} style={{ flexDirection: "row", gap: 10 }}>
                    <FileText size={14} color={navy300} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontWeight: "500", color: navy600, lineHeight: 17, marginBottom: 2 }}>
                        {s.titre_document || "Document"}
                      </Text>
                      {s.score != null && (
                        <Text style={{ fontSize: 11, color: successText }}>
                          {Math.round(s.score * 100)}% pertinence
                        </Text>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        </View>
        <Footer />
      </ScrollView>
    </View>
  );
}
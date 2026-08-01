import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { questionsApi } from "../../src/lib/api/questions"; // IMPORT API

type Analysis = {
  id: string;
  title: string;
  date: string;
  type: string;
  summary: string;
};

export default function HistoryScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [filteredAnalyses, setFilteredAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'historique depuis le backend
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await questionsApi.getHistory();
        const mappedData = (data || []).map((q: any) => ({
          id: q.id_question.toString(),
          title: q.texte_question_brute,
          date: new Date(q.date_heure_envoi).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          type: q.mode_reponse === "pro" ? "Mode Pro" : "Mode Simple",
          summary: q.texte_question_brute,
        }));
        setAnalyses(mappedData);
        setFilteredAnalyses(mappedData);
      } catch (error) {
        console.error("Erreur historique:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredAnalyses(analyses);
    } else {
      setFilteredAnalyses(
        analyses.filter((item) =>
          item.title.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    // Optionnel: ajouter un appel API pour supprimer l'historique côté serveur
    // await questionsApi.deleteHistoryItem(id);
    const updated = analyses.filter((item) => item.id !== id);
    setAnalyses(updated);
    setFilteredAnalyses(updated);
  };

  const AnalysisItem = ({ item }: { item: Analysis }) => (
    <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 20, marginBottom: 16, elevation: 2 }}>
      <View>
        <Text style={{ fontSize: 10, fontWeight: "700", letterSpacing: 0.2, color: "#C9971D", marginBottom: 4 }}>
          {item.type?.toUpperCase() || "ANALYSE"}
        </Text>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1E3A8A", marginBottom: 8 }}>
          {item.title}
        </Text>
        <Text style={{ fontSize: 13, color: "#5A677C", lineHeight: 20, marginBottom: 12 }} numberOfLines={2}>
          {item.summary}
        </Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#E3E8F3", marginTop: 12, paddingTop: 12 }}>
        <Text style={{ fontSize: 12, color: "#7C93D6" }}>{item.date}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <TouchableOpacity
            onPress={() => router.push({ pathname: "../analyse", params: { item: encodeURIComponent(JSON.stringify(item)) } })}
            style={{ width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" }}
          >
            <MaterialCommunityIcons name="open-in-new" size={16} color="#5A677C" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id)}
            style={{ width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" }}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#5A677C" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F7FE" }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }} showsVerticalScrollIndicator={false}>
        {/* Header... (inchangé) */}
        <View style={{ marginBottom: 32 }}>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#7C93D6", marginBottom: 8 }}>HISTORIQUE</Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1E3A8A", marginBottom: 8 }}>Vos analyses juridiques</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#1E3A8A" style={{ marginTop: 50 }} />
        ) : filteredAnalyses.length > 0 ? (
          <FlatList
            data={filteredAnalyses}
            renderItem={({ item }) => <AnalysisItem item={item} />}
            keyExtractor={(item, idx) => item.id || idx.toString()}
            scrollEnabled={false}
          />
        ) : (
          <Text style={{ textAlign: "center", color: "#5A677C", marginTop: 20 }}>Aucune analyse trouvée.</Text>
        )}
      </ScrollView>
    </View>
  );
}
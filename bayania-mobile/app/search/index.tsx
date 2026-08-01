import { Bookmark, ChevronRight, FileText, Filter } from "lucide-react-native";
import { useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Navbar from "../../components/layout/Navbar";
import { colors } from "../../components/layout/theme";

type Result = {
  category: string;
  date: string;
  relevance: string;
  title: string;
  excerpt: string;
};

const sourceFilters = ["Jurisprudence", "Législation", "Doctrine", "Bulletin Officiel"];
const domainFilters = ["Droit Civil", "Droit Pénal", "Droit des Affaires", "Droit Social"];

const results: Result[] = [
  {
    category: "Jurisprudence",
    date: "14 Octobre 2023",
    relevance: "PERTINENCE 98%",
    title: "Arrêt de la Cour de Cassation n° 452/2023",
    excerpt:
      "Sur le licenciement pour faute grave : l'employeur doit respecter la procédure contradictoire prévue par l'article 62 du Code du Travail marocain, sous peine de nullité de la rupture du contrat de travail...",
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"pertinence" | "date">("pertinence");

  return (
    <View style={{ flex: 1, backgroundColor: colors.surfaceMuted }}>
      <ScrollView style={{ flex: 1 }}>
        <Navbar />

        {/* Header / Search bar */}
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: colors.surfaceBorder,
            backgroundColor: "#fff",
            paddingHorizontal: 24,
            paddingVertical: 32,
            alignItems: "center",
          }}
        >
          <View
            style={{
              backgroundColor: "#EFF6FF",
              borderRadius: 6,
              paddingHorizontal: 8,
              paddingVertical: 4,
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: colors.navy600, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Recherche Avancée
            </Text>
          </View>

          <Text style={{ fontSize: 26, fontWeight: "800", color: "#1e293b", marginBottom: 8, textAlign: "center" }}>
            Recherche Juridique Intelligente
          </Text>

          <Text style={{ fontSize: 13, color: "#64748b", textAlign: "center", maxWidth: 320, marginBottom: 20 }}>
            Accédez à l'intégralité du droit marocain : Bulletin Officiel, codes, jurisprudence et doctrine, analysés par notre IA.
          </Text>

          <View style={{ width: "100%", position: "relative", justifyContent: "center" }}>
            <TextInput
              placeholder="Ex: Licenciement abusif, Article 62 Code du Travail..."
              value={query}
              onChangeText={setQuery}
              style={{
                width: "100%",
                borderWidth: 1,
                borderColor: colors.surfaceBorder,
                borderRadius: 12,
                paddingVertical: 14,
                paddingLeft: 20,
                paddingRight: 110,
                fontSize: 14,
                backgroundColor: "#fff",
              }}
              placeholderTextColor="#94a3b8"
            />
            <TouchableOpacity
              style={{
                position: "absolute",
                right: 8,
                backgroundColor: colors.navy600,
                borderRadius: 8,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Rechercher</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Filtres */}
        <View style={{ paddingHorizontal: 16, marginTop: 20, gap: 16 }}>
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.surfaceBorder,
              backgroundColor: "#fff",
              padding: 16,
              gap: 16,
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Filter size={14} color="#1e293b" />
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#1e293b" }}>FILTRES</Text>
              </View>
              <TouchableOpacity>
                <Text style={{ fontSize: 10, fontWeight: "500", color: "#94a3b8" }}>Réinitialiser</Text>
              </TouchableOpacity>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
                Source du Document
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {sourceFilters.map((source) => (
                  <TouchableOpacity
                    key={source}
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: colors.surfaceBorder,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: "#475569" }}>{source}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 8 }}>
                Domaine du Droit
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {domainFilters.map((domaine) => (
                  <TouchableOpacity
                    key={domaine}
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: colors.surfaceBorder,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                    }}
                  >
                    <Text style={{ fontSize: 12, color: "#475569" }}>{domaine}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Résultats */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b" }}>Résultats de recherche</Text>
                <Text style={{ fontSize: 11, color: "#94a3b8" }}>{results.length} résultats trouvés</Text>
              </View>
              <View style={{ flexDirection: "row", borderRadius: 8, borderWidth: 1, borderColor: colors.surfaceBorder, backgroundColor: "#f1f5f9", padding: 2 }}>
                <TouchableOpacity
                  onPress={() => setSortBy("pertinence")}
                  style={{
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    backgroundColor: sortBy === "pertinence" ? "#fff" : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "500", color: "#1e293b" }}>Pertinence</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSortBy("date")}
                  style={{
                    borderRadius: 6,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    backgroundColor: sortBy === "date" ? "#fff" : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 11, color: "#64748b" }}>Date</Text>
                </TouchableOpacity>
              </View>
            </View>

            {results.map((item, idx) => (
              <View
                key={idx}
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.surfaceBorder,
                  backgroundColor: "#fff",
                  padding: 20,
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ backgroundColor: "#EFF6FF", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 10, fontWeight: "600", color: colors.navy600 }}>{item.category}</Text>
                    </View>
                    <Text style={{ fontSize: 10, color: "#94a3b8" }}>{item.date}</Text>
                  </View>
                  <View style={{ backgroundColor: "#ECFDF5", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669" }}>{item.relevance}</Text>
                  </View>
                </View>

                <Text style={{ fontWeight: "700", color: "#1e293b", fontSize: 14, marginBottom: 8 }}>
                  {item.title}
                </Text>
                <Text style={{ fontSize: 12, lineHeight: 18, color: "#64748b" }} numberOfLines={2}>
                  {item.excerpt}
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTopWidth: 1,
                    borderTopColor: "#f1f5f9",
                    marginTop: 16,
                    paddingTop: 12,
                  }}
                >
                  <View style={{ flexDirection: "row", gap: 16 }}>
                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Bookmark size={14} color="#64748b" />
                      <Text style={{ fontSize: 11, color: "#64748b" }}>Enregistrer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <FileText size={14} color="#64748b" />
                      <Text style={{ fontSize: 11, color: "#64748b" }}>Voir le document</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                    <Text style={{ fontSize: 11, fontWeight: "700", color: colors.navy600 }}>Analyse IA</Text>
                    <ChevronRight size={14} color={colors.navy600} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        
      </ScrollView>
    </View>
  );
}

import { Bookmark, ChevronRight, FileText, Filter } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Navbar from "../../components/layout/Navbar";
import { colors } from "../../components/layout/theme";
import { sourcesApi, SourceSearchResult } from "../../src/lib/api/sources";

const sourceFilters = ["Jurisprudence", "Législation", "Doctrine", "Bulletin Officiel"];
const domainFilters = ["Droit Civil", "Droit Pénal", "Droit des Affaires", "Droit Social"];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"pertinence" | "date">("pertinence");
  const [results, setResults] = useState<SourceSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (query.trim().length < 2) {
      setError("Entrez au moins 2 caractères pour lancer une recherche.");
      return;
    }

    setError(null);
    setLoading(true);
    setHasSearched(true);

    try {
      const data = await sourcesApi.search(query.trim());
      setResults(data);
    } catch (err: any) {
      console.error("Erreur de recherche de sources :", err);
      setError(err.message || "Échec de la recherche. Réessayez.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

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
              onSubmitEditing={handleSearch}
              returnKeyType="search"
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
              onPress={handleSearch}
              disabled={loading}
              style={{
                position: "absolute",
                right: 8,
                backgroundColor: loading ? "#9AA3C2" : colors.navy600,
                borderRadius: 8,
                paddingHorizontal: 18,
                paddingVertical: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>Rechercher</Text>
              )}
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

            {/* ⚠️ Ces filtres (source/domaine) ne sont pas encore envoyés au backend.
                L'endpoint /sources/search n'accepte actuellement que 'q' et 'top_k'.
                À connecter plus tard si le backend expose des paramètres de filtrage. */}
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

          {/* Erreur */}
          {error && (
            <View style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, padding: 12 }}>
              <Text style={{ fontSize: 12, color: "#DC2626" }}>{error}</Text>
            </View>
          )}

          {/* Résultats */}
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b" }}>Résultats de recherche</Text>
                <Text style={{ fontSize: 11, color: "#94a3b8" }}>
                  {hasSearched ? `${results.length} résultat(s) trouvé(s)` : "Lancez une recherche pour voir des résultats"}
                </Text>
              </View>
              {results.length > 0 && (
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
                </View>
              )}
            </View>

            {loading && <ActivityIndicator color={colors.navy600} style={{ marginVertical: 24 }} />}

            {!loading && hasSearched && results.length === 0 && !error && (
              <Text style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", paddingVertical: 24 }}>
                Aucun résultat pour cette recherche.
              </Text>
            )}

            {!loading &&
              results.map((item) => (
                <View
                  key={item.id_source}
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
                        <Text style={{ fontSize: 10, fontWeight: "600", color: colors.navy600 }}>{item.type_source}</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: "#94a3b8" }}>{item.numero_article}</Text>
                    </View>
                    <View style={{ backgroundColor: "#ECFDF5", borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: "#059669" }}>
                        PERTINENCE {Math.round(item.score * 100)}%
                      </Text>
                    </View>
                  </View>

                  <Text style={{ fontWeight: "700", color: "#1e293b", fontSize: 14, marginBottom: 8 }}>
                    {item.titre_document}
                  </Text>
                  <Text style={{ fontSize: 12, lineHeight: 18, color: "#64748b" }} numberOfLines={2}>
                    {item.contenu_texte}
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
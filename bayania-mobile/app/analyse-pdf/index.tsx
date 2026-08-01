import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getToken } from "../../src/lib/api";
import {
  AnalyseDocumentResponse,
  documentsApi,
  PickedFile,
} from "../../src/lib/api/document";

const DEFAULT_INSTRUCTIONS =
  "Analyse ce document juridique : résume les points clés, identifie les clauses à risque et vérifie sa conformité au droit marocain.";

type Step = "idle" | "analyzing" | "done" | "error";

function riskColors(niveau: string) {
  const n = niveau.toLowerCase();
  if (n.includes("élevé") || n.includes("eleve") || n.includes("high")) {
    return { text: "#DC2626", bg: "#FEF2F2", border: "#FECACA" };
  }
  if (n.includes("moyen") || n.includes("medium")) {
    return { text: "#D97706", bg: "#FFFBEB", border: "#FDE68A" };
  }
  return { text: "#059669", bg: "#ECFDF5", border: "#A7F3D0" };
}

export default function AnalysePdfScreen() {
  const [file, setFile] = useState<PickedFile | null>(null);
  const [instructions, setInstructions] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [analyse, setAnalyse] = useState<AnalyseDocumentResponse | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) router.replace("/connexion");
    })();
  }, []);

  const handlePickFile = async () => {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const asset = result.assets[0];

    if (asset.size && asset.size > 20 * 1024 * 1024) {
      setError("Le fichier dépasse la taille maximale de 20 Mo.");
      return;
    }

    setFile({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType,
      size: asset.size,
    });
  };

  const reset = () => {
    setFile(null);
    setInstructions("");
    setStep("idle");
    setError(null);
    setAnalyse(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setError(null);
    setStep("analyzing");
    try {
      const result = await documentsApi.analysePdf(
        file,
        instructions.trim() || DEFAULT_INSTRUCTIONS
      );
      setAnalyse(result);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue pendant l'analyse.");
      setStep("error");
    }
  };

  const isProcessing = step === "analyzing";

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F3F7FE" }} contentContainerStyle={{ padding: 24 }}>
      <TouchableOpacity
        onPress={() => router.back()}
        style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 }}
      >
        <Ionicons name="arrow-back" size={14} color="#5A677C" />
        <Text style={{ fontSize: 13, color: "#5A677C", fontWeight: "500" }}>Retour au tableau de bord</Text>
      </TouchableOpacity>

      <View style={{ alignItems: "center", marginBottom: 24 }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#EEF2FC", justifyContent: "center", alignItems: "center", marginBottom: 12 }}>
          <MaterialCommunityIcons name="file-document" size={20} color="#1E3A8A" />
        </View>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#1E3A8A", marginBottom: 4 }}>Analyse de PDF</Text>
        <Text style={{ fontSize: 12, color: "#5A677C", textAlign: "center" }}>
          Déposez un contrat ou un jugement pour un résumé structuré et une détection des risques.
        </Text>
      </View>

      {step !== "done" && (
        <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 20, gap: 16 }}>
          {!file ? (
            <TouchableOpacity
              onPress={handlePickFile}
              style={{ borderWidth: 2, borderStyle: "dashed", borderColor: "#E3E8F3", borderRadius: 12, paddingVertical: 40, alignItems: "center" }}
            >
              <MaterialCommunityIcons name="cloud-upload-outline" size={26} color="#9AA3C2" style={{ marginBottom: 10 }} />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E3A8A", marginBottom: 4 }}>
                Toucher pour sélectionner un fichier PDF
              </Text>
              <Text style={{ fontSize: 11, color: "#9AA3C2" }}>PDF uniquement, 20 Mo maximum</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#E3E8F3", backgroundColor: "#F3F7FE", borderRadius: 12, padding: 12 }}>
              <MaterialCommunityIcons name="file-document" size={20} color="#1E3A8A" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E3A8A" }} numberOfLines={1}>{file.name}</Text>
                {!!file.size && (
                  <Text style={{ fontSize: 11, color: "#9AA3C2" }}>{(file.size / 1024 / 1024).toFixed(2)} Mo</Text>
                )}
              </View>
              {!isProcessing && (
                <TouchableOpacity onPress={() => setFile(null)}>
                  <Ionicons name="close" size={18} color="#9AA3C2" />
                </TouchableOpacity>
              )}
            </View>
          )}

          <View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", marginBottom: 8, letterSpacing: 0.5 }}>
              INSTRUCTIONS (FACULTATIF)
            </Text>
            <TextInput
              value={instructions}
              onChangeText={setInstructions}
              editable={!isProcessing}
              placeholder={DEFAULT_INSTRUCTIONS}
              placeholderTextColor="#9AA3C2"
              multiline
              numberOfLines={3}
              style={{ borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: "#1E3A8A", minHeight: 70, textAlignVertical: "top" }}
            />
          </View>

          {error && (
            <View style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, padding: 10 }}>
              <Text style={{ fontSize: 12, color: "#DC2626" }}>{error}</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={handleAnalyze}
            disabled={!file || isProcessing}
            style={{ backgroundColor: (!file || isProcessing) ? "#9AA3C2" : "#1E3A8A", borderRadius: 8, paddingVertical: 13, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <MaterialCommunityIcons name="creation" size={16} color="#fff" />
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Lancer l'analyse</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {step === "done" && analyse && (
        <View style={{ gap: 16 }}>
          {/* Résumé */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <MaterialCommunityIcons name="creation" size={15} color="#1E3A8A" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E3A8A" }}>Résumé du document</Text>
            </View>
            <Text style={{ fontSize: 13, color: "#5A677C", lineHeight: 20 }}>{analyse.resume}</Text>
          </View>

          {/* Clauses à risque */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <MaterialCommunityIcons name="shield-alert" size={15} color="#1E3A8A" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E3A8A" }}>
                Clauses à risque ({analyse.clauses_risque.length})
              </Text>
            </View>

            {analyse.clauses_risque.length === 0 ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 8, padding: 10 }}>
                <MaterialCommunityIcons name="check-circle" size={15} color="#059669" />
                <Text style={{ fontSize: 12, color: "#059669", flex: 1 }}>Aucune clause à risque identifiée.</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {analyse.clauses_risque.map((c, idx) => {
                  const colors = riskColors(c.niveau_risque);
                  return (
                    <View key={idx} style={{ borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 10, padding: 12 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                        <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E3A8A", flex: 1 }}>{c.clause}</Text>
                        <View style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" }}>
                          <Text style={{ fontSize: 9, fontWeight: "700", color: colors.text, textTransform: "uppercase" }}>{c.niveau_risque}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 12, color: "#5A677C", lineHeight: 18 }}>{c.explication}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Conformité */}
          <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 18 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <MaterialCommunityIcons name="check-circle" size={15} color="#1E3A8A" />
              <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E3A8A" }}>Conformité au droit marocain</Text>
            </View>
            <Text style={{ fontSize: 13, color: "#5A677C", lineHeight: 20 }}>{analyse.conformite}</Text>
          </View>

          {/* Recommandations */}
          {analyse.recommandations.length > 0 && (
            <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 18 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 }}>
                <MaterialCommunityIcons name="format-list-checks" size={15} color="#1E3A8A" />
                <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E3A8A" }}>Recommandations</Text>
              </View>
              <View style={{ gap: 8 }}>
                {analyse.recommandations.map((rec, idx) => (
                  <View key={idx} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                    <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#9AA3C2", marginTop: 6 }} />
                    <Text style={{ fontSize: 13, color: "#5A677C", flex: 1, lineHeight: 19 }}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity
            onPress={reset}
            style={{ borderWidth: 1, borderColor: "#E3E8F3", backgroundColor: "#fff", borderRadius: 8, paddingVertical: 13 }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: "#1E3A8A", textAlign: "center" }}>
              Analyser un autre document
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
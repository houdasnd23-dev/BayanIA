import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getToken } from "../../src/lib/api";
import { questionsApi, ReponseIAResponse } from "../../src/lib/api/questions";
import { usersApi, UserProfile } from "../../src/lib/api/users";

type ChatMessage =
  | { role: "assistant"; text: string; reponse?: ReponseIAResponse }
  | { role: "user"; text: string }
  | { role: "error"; text: string };

const WELCOME_MESSAGE: ChatMessage = {
  role: "assistant",
  text: "Bonjour. Je suis votre assistant BayanIA spécialisé dans le droit marocain. Comment puis-je vous assister dans vos recherches juridiques aujourd'hui ?",
};

const SUGGESTIONS = ["Bail commercial", "Droit des sociétés", "CNSS"];

const WORKSPACE_NAV = [
  { icon: "magnify", label: "Recherche", href: "/search" },
  { icon: "history", label: "Historique", href: "/history" },
  { icon: "file-document-multiple", label: "Documents", href: "/documents" },
  { icon: "cog-outline", label: "Paramètres", href: "/compte" },
] as const;

function normalizeScore(score: number) {
  return score <= 1 ? score * 100 : score;
}

export default function DashboardScreen() {
  const [question, setQuestion] = useState("");
  const [modePro, setModePro] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [lastReponse, setLastReponse] = useState<ReponseIAResponse | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const scrollRef = useRef<ScrollView>(null);

  // Auth guard — même logique que le desktop
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/connexion");
      }
    })();
  }, []);

  useEffect(() => {
    usersApi
      .getMe()
      .then(setProfile)
      .catch(() => {
        // silencieux, l'auth guard gère déjà la redirection si nécessaire
      });
  }, []);

  const handleSend = async (overrideText?: string) => {
    const texte = (overrideText ?? question).trim();
    if (!texte || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: texte }]);
    setQuestion("");
    setIsLoading(true);

    try {
      const { reponse } = await questionsApi.askAndGetAnswer(
        texte,
        modePro ? "pro" : "simple"
      );
      setLastReponse(reponse);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: reponse.texte_reponse, reponse },
      ]);
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        { role: "error", text: error.message || "Erreur lors de la génération de la réponse." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewRequest = () => {
    setMessages([WELCOME_MESSAGE]);
    setLastReponse(null);
  };

  const initials = profile?.nom_user
    ? profile.nom_user.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <View style={{ flex: 1, backgroundColor: "#F3F7FE" }}>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => setModePro((v) => !v)}
            style={{ backgroundColor: "#EEF2FC", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start" }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#1E3A8A", letterSpacing: 0.5 }}>
              {modePro ? "MODE PROFESSIONNEL" : "MODE SIMPLE"}
            </Text>
          </TouchableOpacity>

          {profile && (
            <TouchableOpacity
              onPress={() => router.push("/compte")}
              style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#1E3A8A", justifyContent: "center", alignItems: "center" }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{initials}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Navigation rapide — équivalent de la sidebar "Workspace" du desktop */}
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {WORKSPACE_NAV.map((item) => (
            <TouchableOpacity
              key={item.href}
              onPress={() => router.push(item.href as any)}
              style={{ flex: 1, alignItems: "center", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E3E8F3", paddingVertical: 10 }}
            >
              <MaterialCommunityIcons name={item.icon as any} size={16} color="#1E3A8A" style={{ marginBottom: 4 }} />
              <Text style={{ fontSize: 9, fontWeight: "600", color: "#5A677C", textAlign: "center" }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bouton Nouvelle Requête — équivalent du desktop */}
        <TouchableOpacity
          onPress={handleNewRequest}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#1E3A8A", borderRadius: 8, paddingVertical: 10, marginBottom: 20, alignSelf: "flex-start", paddingHorizontal: 14 }}
        >
          <Ionicons name="add" size={14} color="#fff" />
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#fff" }}>Nouvelle Requête</Text>
        </TouchableOpacity>

        {/* Carte de conformité juridique — équivalent de la sidebar droite du desktop */}
        <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <MaterialCommunityIcons name="shield-check" size={14} color="#1E3A8A" />
            <Text style={{ fontSize: 12, fontWeight: "700", color: "#1E3A8A" }}>Conformité Juridique</Text>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
            <Text style={{ fontSize: 11, color: "#9AA3C2" }}>Score de Précision</Text>
            <Text style={{ fontSize: 13, fontWeight: "700", color: "#1E3A8A" }}>
              {lastReponse ? `${normalizeScore(lastReponse.score_confiance).toFixed(1)}%` : "—"}
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, backgroundColor: "#E3E8F3", overflow: "hidden", marginBottom: 12 }}>
            <View
              style={{
                height: "100%",
                borderRadius: 3,
                backgroundColor: "#1E3A8A",
                width: lastReponse ? `${normalizeScore(lastReponse.score_confiance)}%` : "0%",
              }}
            />
          </View>

          <View style={{ gap: 6, marginBottom: lastReponse ? 12 : 0 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialCommunityIcons name="check-circle" size={12} color="#1E3A8A" />
              <Text style={{ fontSize: 11, color: "#5A677C" }}>Sources: Bulletin Officiel (BO)</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <MaterialCommunityIcons name="check-circle" size={12} color="#1E3A8A" />
              <Text style={{ fontSize: 11, color: "#5A677C" }}>Conformité CNDP</Text>
            </View>
          </View>

          {lastReponse && (
            <View style={{ borderTopWidth: 1, borderTopColor: "#E3E8F3", paddingTop: 12, gap: 6 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: "#9AA3C2" }}>Sources citées</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#1E3A8A" }}>
                  {lastReponse.sources.length.toString().padStart(2, "0")}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontSize: 11, color: "#9AA3C2" }}>Sources validées</Text>
                <Text style={{ fontSize: 12, fontWeight: "700", color: "#1E3A8A" }}>
                  {lastReponse.sources.filter((s) => s.statut_validite).length}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Messages */}
        <View style={{ gap: 16, marginBottom: 20 }}>
          {messages.map((msg, index) => {
            if (msg.role === "user") {
              return (
                <View key={index} style={{ alignItems: "flex-end" }}>
                  <View style={{ backgroundColor: "#EEF2FC", borderRadius: 16, padding: 12, maxWidth: "85%" }}>
                    <Text style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 20 }}>{msg.text}</Text>
                  </View>
                </View>
              );
            }

            if (msg.role === "error") {
              return (
                <View key={index} style={{ flexDirection: "row", gap: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#B45309", justifyContent: "center", alignItems: "center" }}>
                    <MaterialCommunityIcons name="alert" size={14} color="#fff" />
                  </View>
                  <View style={{ backgroundColor: "#FFF7ED", borderWidth: 1, borderColor: "#FDBA74", borderRadius: 16, padding: 12, flex: 1 }}>
                    <Text style={{ fontSize: 13, color: "#B45309", lineHeight: 20 }}>{msg.text}</Text>
                  </View>
                </View>
              );
            }

            // assistant
            return (
              <View key={index} style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#1E3A8A", justifyContent: "center", alignItems: "center" }}>
                  <MaterialCommunityIcons name="lightning-bolt" size={14} color="#fff" />
                </View>
                <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 16, padding: 12, flex: 1 }}>
                  <Text style={{ fontSize: 13, color: "#1E3A8A", lineHeight: 20 }}>{msg.text}</Text>

                  {msg.reponse && msg.reponse.sources.length > 0 && (
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {msg.reponse.sources.map((source) => (
                        <View key={source.id_source} style={{ backgroundColor: "#F3F7FE", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 4 }}>
                          <MaterialCommunityIcons name="file-document" size={10} color="#5A677C" />
                          <Text style={{ fontSize: 10, color: "#5A677C" }}>
                            {source.titre_document}
                            {source.numero_article ? ` — Art. ${source.numero_article}` : ""}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {msg.reponse && (
                    <Text style={{ fontSize: 10, color: "#9AA3C2", marginTop: 8 }}>
                      Confiance : {normalizeScore(msg.reponse.score_confiance).toFixed(0)}%
                    </Text>
                  )}
                </View>
              </View>
            );
          })}

          {isLoading && (
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#1E3A8A", justifyContent: "center", alignItems: "center" }}>
                <MaterialCommunityIcons name="lightning-bolt" size={14} color="#fff" />
              </View>
              <View style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 16, padding: 12 }}>
                <ActivityIndicator size="small" color="#1E3A8A" />
              </View>
            </View>
          )}
        </View>

        {/* Input Area — avec accès réel à l'analyse PDF, comme le desktop */}
        <View style={{ backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E3E8F3", padding: 12, marginBottom: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity onPress={() => router.push("/analyse-pdf")}>
              <MaterialCommunityIcons name="paperclip" size={18} color="#7C93D6" />
            </TouchableOpacity>
            <TextInput
              placeholder="Posez une question juridique..."
              value={question}
              onChangeText={setQuestion}
              onSubmitEditing={() => handleSend()}
              editable={!isLoading}
              style={{ flex: 1, fontSize: 13, color: "#1E3A8A" }}
              placeholderTextColor="#7C93D6"
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={isLoading || !question.trim()}
              style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: (!question.trim() || isLoading) ? "#9AA3C2" : "#1E3A8A", justifyContent: "center", alignItems: "center" }}
            >
              <Ionicons name="arrow-up" size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Suggestions — équivalent du desktop */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
          <Text style={{ fontSize: 11, color: "#9AA3C2" }}>Suggestions :</Text>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s} onPress={() => handleSend(s)}>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", textTransform: "uppercase" }}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
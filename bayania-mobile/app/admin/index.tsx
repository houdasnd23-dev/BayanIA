import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import * as DocumentPicker from "expo-document-picker";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getToken } from "../../src/lib/api";
import {
  AdminUser,
  ImportationDocumentDetail,
  adminApi,
} from "../../src/lib/api/admin";
import { authApi } from "../../src/lib/api/auth";

function statusMeta(statut: string) {
  switch (statut) {
    case "COMPLETED":
      return { label: "Indexé", color: "#059669", dot: "#10B981" };
    case "PENDING":
      return { label: "En cours", color: "#2563EB", dot: "#3B82F6" };
    case "FAILED":
      return { label: "Erreur", color: "#DC2626", dot: "#EF4444" };
    default:
      return { label: statut, color: "#5A677C", dot: "#9AA3C2" };
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function AdminScreen() {
  const [documents, setDocuments] = useState<ImportationDocumentDetail[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [titreDocument, setTitreDocument] = useState("");
  const [typeSource, setTypeSource] = useState("");
  const [pickedFile, setPickedFile] = useState<{ uri: string; name: string; mimeType?: string | null } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) router.replace("/connexion");
    })();
  }, []);

  async function loadData() {
    setLoadingData(true);
    try {
      const [docs, userList] = await Promise.all([
        adminApi.listDocuments().catch(() => []),
        adminApi.listUsers().catch(() => []),
      ]);
      setDocuments(docs);
      setUsers(userList);
    } catch (err) {
      console.error("Erreur de chargement des données admin :", err);
    } finally {
      setLoadingData(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handlePickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setPickedFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType });
  };

  const handleUpload = async () => {
    setUploadError(null);
    setUploadSuccess(false);

    if (!pickedFile || !titreDocument || !typeSource) {
      setUploadError("Veuillez remplir tous les champs et choisir un fichier PDF.");
      return;
    }

    setUploading(true);
    try {
      await adminApi.uploadDocument(titreDocument, typeSource, pickedFile);
      setUploadSuccess(true);
      setTitreDocument("");
      setTypeSource("");
      setPickedFile(null);
      await loadData();
    } catch (err: any) {
      setUploadError(err.message || "Échec de l'importation");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: number, titre: string) => {
    Alert.alert(
      "Confirmer la suppression",
      `Supprimer "${titre}" ? Cette action est irréversible et retirera aussi ses vecteurs de l'index RAG.`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleteError(null);
            setDeletingId(id);
            try {
              await adminApi.deleteDocument(id);
              await loadData();
            } catch (err: any) {
              setDeleteError(err.message || "Échec de la suppression du document");
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    await authApi.logout();
    router.replace("/connexion");
  };

  const stats = [
    { icon: "book-open-variant", value: documents.length.toString(), label: "Documents importés" },
    { icon: "account-group", value: users.length.toString(), label: "Utilisateurs inscrits" },
    {
      icon: "share-variant",
      value: documents.filter((d) => d.statut_indexation === "COMPLETED").length.toString(),
      label: "Documents indexés",
    },
    {
      icon: "shield-alert",
      value: documents.filter((d) => d.statut_indexation === "FAILED").length.toString(),
      label: "Erreurs d'indexation",
    },
  ] as const;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F3F7FE" }} contentContainerStyle={{ padding: 20 }}>
      {/* Header */}
      <View style={{ backgroundColor: "#122252", borderRadius: 16, padding: 20, marginBottom: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: "flex-start", marginBottom: 12 }}>
          <MaterialCommunityIcons name="shield-check" size={12} color="#fff" />
          <Text style={{ fontSize: 10, color: "#fff", fontWeight: "600" }}>INTERFACE DE CONTRÔLE</Text>
        </View>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#fff", marginBottom: 6 }}>Bonjour, Administrateur</Text>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 18 }}>
          Pilotez l'intelligence juridique au Maroc. Gérez vos corpus et supervisez l'indexation vectorielle.
        </Text>
      </View>

      {/* Stats */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
        {stats.map((s) => (
          <View key={s.label} style={{ width: "47%", backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E3E8F3", padding: 14 }}>
            <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: "#EEF2FC", justifyContent: "center", alignItems: "center", marginBottom: 10 }}>
              <MaterialCommunityIcons name={s.icon as any} size={16} color="#1E3A8A" />
            </View>
            <Text style={{ fontSize: 10, color: "#9AA3C2", textTransform: "uppercase", marginBottom: 2 }}>{s.label}</Text>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#1E3A8A" }}>{s.value}</Text>
          </View>
        ))}
      </View>

      {/* Documents récents */}
      <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E3A8A", marginBottom: 2 }}>Documents Récents</Text>
        <Text style={{ fontSize: 11, color: "#9AA3C2", marginBottom: 14 }}>Flux des derniers corpus importés et indexés</Text>

        {deleteError && (
          <View style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: "#DC2626" }}>{deleteError}</Text>
          </View>
        )}

        {loadingData && <ActivityIndicator color="#1E3A8A" style={{ marginVertical: 20 }} />}

        {!loadingData && documents.length === 0 && (
          <Text style={{ fontSize: 12, color: "#9AA3C2", paddingVertical: 12 }}>Aucun document importé pour le moment.</Text>
        )}

        {!loadingData &&
          documents.map((d) => {
            const meta = statusMeta(d.statut_indexation);
            const isDeleting = deletingId === d.id_importation;
            return (
              <View key={d.id_importation} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#F3F7FE" }}>
                <MaterialCommunityIcons name="file-document" size={18} color="#9AA3C2" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "#1E3A8A" }} numberOfLines={1}>{d.titre_document}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
                    <Text style={{ fontSize: 10, color: "#9AA3C2" }}>{d.nb_chunks} chunks</Text>
                    <Text style={{ fontSize: 10, color: "#9AA3C2" }}>· {formatDate(d.date_importation)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: meta.dot }} />
                    <Text style={{ fontSize: 10, fontWeight: "600", color: meta.color }}>{meta.label}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleDelete(d.id_importation, d.titre_document)} disabled={isDeleting}>
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#DC2626" />
                  ) : (
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color="#F87171" />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
      </View>

      {/* Formulaire import */}
      <View style={{ backgroundColor: "#EEF2FC", borderRadius: 16, padding: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E3A8A", marginBottom: 4 }}>Importation de Document</Text>
        <Text style={{ fontSize: 11, color: "#5A677C", lineHeight: 16, marginBottom: 14 }}>
          Importez un fichier PDF. Le texte sera extrait, découpé en fragments et indexé automatiquement dans le moteur RAG.
        </Text>

        {uploadError && (
          <View style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: "#DC2626" }}>{uploadError}</Text>
          </View>
        )}
        {uploadSuccess && (
          <View style={{ backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 8, padding: 10, marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: "#059669" }}>Document importé et indexé avec succès.</Text>
          </View>
        )}

        <View style={{ gap: 12, marginBottom: 14 }}>
          <View>
            <Text style={{ fontSize: 10, fontWeight: "600", color: "#5A677C", marginBottom: 6 }}>TITRE DU DOCUMENT</Text>
            <TextInput
              value={titreDocument}
              onChangeText={setTitreDocument}
              placeholder="Code du Travail 2024"
              placeholderTextColor="#9AA3C2"
              style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: "#1E3A8A" }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 10, fontWeight: "600", color: "#5A677C", marginBottom: 6 }}>TYPE DE SOURCE</Text>
            <TextInput
              value={typeSource}
              onChangeText={setTypeSource}
              placeholder="Loi, Décret, Jurisprudence..."
              placeholderTextColor="#9AA3C2"
              style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: "#1E3A8A" }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 10, fontWeight: "600", color: "#5A677C", marginBottom: 6 }}>FICHIER PDF</Text>
            <TouchableOpacity
              onPress={handlePickFile}
              style={{ backgroundColor: "#fff", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <MaterialCommunityIcons name="paperclip" size={16} color="#7C93D6" />
              <Text style={{ fontSize: 12, color: pickedFile ? "#1E3A8A" : "#9AA3C2", flex: 1 }} numberOfLines={1}>
                {pickedFile ? pickedFile.name : "Choisir un fichier..."}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleUpload}
          disabled={uploading}
          style={{ backgroundColor: uploading ? "#9AA3C2" : "#1E3A8A", borderRadius: 8, paddingVertical: 12, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}
        >
          {uploading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>Importer et Indexer</Text>}
        </TouchableOpacity>
      </View>

      {/* Utilisateurs */}
      <View style={{ backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 16, marginBottom: 20 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#1E3A8A", marginBottom: 14 }}>Utilisateurs ({users.length})</Text>

        {loadingData && <ActivityIndicator color="#1E3A8A" />}

        {!loadingData &&
          users.slice(0, 8).map((u) => (
            <View key={u.id_user} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#F3F7FE" }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: "#EEF2FC", justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#1E3A8A" }}>
                  {u.nom_user ? u.nom_user.split(" ").slice(-1)[0][0]?.toUpperCase() : "U"}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#1E3A8A" }} numberOfLines={1}>{u.nom_user}</Text>
                <Text style={{ fontSize: 10, color: "#9AA3C2" }} numberOfLines={1}>{u.email}</Text>
              </View>
              {!!u.profil?.type_profil && (
                <Text style={{ fontSize: 10, color: "#9AA3C2" }}>{u.profil.type_profil}</Text>
              )}
            </View>
          ))}
      </View>

      {/* Déconnexion */}
      <TouchableOpacity
        onPress={handleLogout}
        style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2", borderRadius: 8, paddingVertical: 12 }}
      >
        <Ionicons name="log-out-outline" size={16} color="#DC2626" />
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#DC2626" }}>Déconnexion</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
import { authApi } from "../../src/lib/api/auth";
import { usersApi } from "../../src/lib/api/users";

export default function CompteScreen() {
  const [nomUser, setNomUser] = useState("");
  const [email, setEmail] = useState("");
  const [typeProfil, setTypeProfil] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await usersApi.getMe();
        setNomUser(data.nom_user);
        setEmail(data.email);
        setTypeProfil(data.profil?.type_profil || "");
      } catch (err: any) {
        setError(err.message || "Impossible de charger le profil");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setError(null);
    setSuccess(false);
    setIsSaving(true);
    try {
      await usersApi.updateMe({ nom_user: nomUser, email });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Échec de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      router.replace("/connexion");
    }
  };

  const initials =
    nomUser
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F3F7FE", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#1E3A8A" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F3F7FE" }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "700", color: "#1E3A8A", marginBottom: 4 }}>
          Paramètres du Compte
        </Text>
        <Text style={{ fontSize: 12, color: "#5A677C" }}>
          Gérez vos informations personnelles et vos préférences BayanIA.
        </Text>
      </View>

      {/* Carte profil */}
      <View style={{ marginHorizontal: 24, backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E3E8F3", padding: 20 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: "#E3E8F3" }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#1E3A8A", justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{initials}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1E3A8A" }}>{nomUser || "—"}</Text>
            {!!typeProfil && (
              <Text style={{ fontSize: 11, color: "#5A677C", textTransform: "capitalize" }}>{typeProfil}</Text>
            )}
          </View>
        </View>

        {error && (
          <View style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: "#DC2626" }}>{error}</Text>
          </View>
        )}

        {success && (
          <View style={{ backgroundColor: "#ECFDF5", borderWidth: 1, borderColor: "#A7F3D0", borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, color: "#047857" }}>Profil mis à jour avec succès.</Text>
          </View>
        )}

        <View style={{ gap: 16, marginBottom: 20 }}>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", marginBottom: 6, letterSpacing: 0.5 }}>NOM COMPLET</Text>
            <TextInput
              value={nomUser}
              onChangeText={setNomUser}
              style={{ borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1E3A8A" }}
            />
          </View>
          <View>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", marginBottom: 6, letterSpacing: 0.5 }}>ADRESSE EMAIL</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={{ borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: "#1E3A8A" }}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{ backgroundColor: isSaving ? "#9AA3C2" : "#1E3A8A", borderRadius: 8, paddingVertical: 12 }}
        >
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff", textAlign: "center" }}>
            {isSaving ? "Enregistrement..." : "Enregistrer les modifications"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Déconnexion */}
      <View style={{ paddingHorizontal: 24, paddingVertical: 24 }}>
        <TouchableOpacity
          onPress={handleLogout}
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}
        >
          <MaterialCommunityIcons name="logout" size={16} color="#DC2626" />
          <Text style={{ fontSize: 14, color: "#DC2626", fontWeight: "600" }}>Déconnexion</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
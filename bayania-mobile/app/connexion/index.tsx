import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Checkbox from "expo-checkbox";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Footer from "../../components/layout/Footer";
import { authApi } from "../../src/lib/api/auth";
import { usersApi } from "../../src/lib/api/users"; // <-- AJOUT : nécessaire pour lire le rôle après connexion

const { width, height } = Dimensions.get("window");

export default function ConnexionScreen() {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);
    try {
      // Connexion — le token est stocké automatiquement par authApi.login()
      await authApi.login({ email, password });

      // On récupère le profil pour connaître le rôle et rediriger en conséquence
      // (même logique que le desktop : admin -> /admin, sinon -> /dashboard)
      const profile = await usersApi.getMe();

      if (profile.profil?.type_profil?.toLowerCase() === "administrateur") {
        router.replace("/admin");
      } else {
        router.replace("/dashboard");
      }
    } catch (error: any) {
      alert(error.message || "Identifiants incorrects ou erreur de serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0B1526" }}>
      {/* Background avec dégradés */}
      <LinearGradient
        colors={["#0B1526", "#1B2A4A", "#0F1B33"]}
        start={{ x: 0.15, y: 0.1 }}
        end={{ x: 0.85, y: 0.9 }}
        style={{ position: "absolute", inset: 0, zIndex: 0 }}
      >
        {/* Vignette pour assombrir les bords */}
        <LinearGradient
          colors={["transparent", "transparent", "rgba(11, 21, 38, 0.55)"]}
          start={{ x: 0.3, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={{ position: "absolute", inset: 0 }}
        />

        {/* Texture colonne verticale */}
        <View style={{ position: "absolute", inset: 0, opacity: 0.06, flexDirection: "row" }}>
          {Array.from({ length: 50 }).map((_, i) => (
            <View
              key={i}
              style={{ width: 1, flex: 1, backgroundColor: "rgba(255, 255, 255, 0.6)", marginRight: 47 }}
            />
          ))}
        </View>

        {/* Watermark balance */}
        <View style={{ position: "absolute", right: -60, top: "50%", width: 300, height: 300, opacity: 0.05, justifyContent: "center", alignItems: "center" }}>
          <MaterialCommunityIcons name="scale-balance" size={200} color="#C9971D" />
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView
        style={{ flex: 1, position: "relative", zIndex: 10 }}
        contentContainerStyle={{ paddingTop: 80, paddingBottom: 24, paddingHorizontal: 24 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* Colonne gauche - Info */}
        <View style={{ marginBottom: 48 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.1)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start", marginBottom: 24 }}>
            <Text style={{ fontSize: 10, color: "#fff", fontWeight: "600", letterSpacing: 1 }}>IA JURIDIQUE</Text>
          </View>
          <Text style={{ fontSize: 32, fontWeight: "700", color: "#fff", marginBottom: 24, lineHeight: 40 }}>Accédez à l'excellence juridique marocaine</Text>
          <Text style={{ fontSize: 16, color: "rgba(255, 255, 255, 0.7)", marginBottom: 40, lineHeight: 24 }}>Rejoignez les leaders du droit au Maroc et optimisez votre pratique grâce à notre intelligence artificielle spécialisée.</Text>

          <View style={{ gap: 24 }}>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <MaterialCommunityIcons name="check-circle" size={20} color="rgba(255, 255, 255, 0.9)" style={{ marginTop: 4 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 4 }}>Précision certifiée</Text>
                <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>Analyse basée exclusivement sur le Bulletin Officiel.</Text>
              </View>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <MaterialCommunityIcons name="shield-check" size={20} color="rgba(255, 255, 255, 0.9)" style={{ marginTop: 4 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 4 }}>Sécurité souveraine</Text>
                <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>Hébergement sécurisé et conformité CNDP stricte.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Carte formulaire */}
        <View style={{ backgroundColor: "#fff", borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 10, paddingHorizontal: 32, paddingVertical: 40, alignSelf: "center", width: "100%", maxWidth: 400 }}>
          
          <View style={{ alignItems: "center", marginBottom: 32 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: "#EEF2FC", justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
              <MaterialCommunityIcons name="scale-balance" size={22} color="#1E3A8A" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#1E3A8A", marginBottom: 4 }}>Connexion Partenaire</Text>
            <Text style={{ fontSize: 12, color: "#5A677C" }}>Veuillez entrer vos identifiants professionnels</Text>
          </View>

          {/* Form */}
          <View style={{ gap: 20, marginBottom: 24 }}>
            <View>
              <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", marginBottom: 8, letterSpacing: 0.5 }}>EMAIL PROFESSIONNEL</Text>
              <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff" }}>
                <MaterialCommunityIcons name="email" size={16} color="#7C93D6" />
                <TextInput
                  placeholder="nom@cabinet.ma"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                  style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: "#1E3A8A" }}
                  placeholderTextColor="#7C93D6"
                />
              </View>
            </View>

            <View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", letterSpacing: 0.5 }}>MOT DE PASSE</Text>
                <TouchableOpacity onPress={() => router.push("../reset-password")}>
                  <Text style={{ fontSize: 11, color: "#1E3A8A", fontWeight: "500" }}>Oublié ?</Text>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff" }}>
                <MaterialCommunityIcons name="lock" size={16} color="#7C93D6" />
                <TextInput
                  placeholder="••••••••••"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                  style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: "#1E3A8A" }}
                  placeholderTextColor="#7C93D6"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={16} color="#7C93D6" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Checkbox value={rememberMe} onValueChange={setRememberMe} style={{ width: 18, height: 18 }} />
              <Text style={{ fontSize: 12, color: "#5A677C" }}>Rester connecté sur cet appareil</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            style={{ backgroundColor: isLoading ? "#9AA3C2" : "#1E3A8A", borderRadius: 8, paddingVertical: 12, marginBottom: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Se connecter</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E3E8F3" }} />
            <Text style={{ fontSize: 11, color: "#7C93D6", fontWeight: "600" }}>OU</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E3E8F3" }} />
          </View>

          <TouchableOpacity onPress={() => router.push("/inscription")} style={{ borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingVertical: 12, marginBottom: 24 }}>
            <Text style={{ fontSize: 14, fontWeight: "500", color: "#1E3A8A", textAlign: "center" }}>S'inscrire à l'essai gratuit</Text>
          </TouchableOpacity>
        </View>
        <Footer/>
      </ScrollView>
    </View>
  );
}
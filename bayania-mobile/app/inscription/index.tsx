import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Checkbox from "expo-checkbox";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Footer from "../../components/layout/Footer";
import Navbar from "../../components/layout/Navbar";
import { authApi } from "../../src/lib/api/auth"; // <-- IMPORT DE L'API

const { width } = Dimensions.get("window");

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

export default function InscriptionScreen() {
   
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // <-- ETAT DE CHARGEMENT

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.password || !agreed) {
      alert("Veuillez remplir tous les champs et accepter les conditions");
      return;
    }

    if (!formData.firstName && !formData.lastName) {
      alert("Veuillez entrer votre nom");
      return;
    }

    setIsLoading(true);
    try {
      // Le backend attend: nom_user, email, mot_de_passe, type_profil
      // Voir : app/schemas/user.py → UserCreate
      await authApi.register({
        nom_user: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        mot_de_passe: formData.password,
       
      });

      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      router.replace("/connexion");
    } catch (error: any) {
      alert(error.message || "Erreur lors de l'inscription.");
    } finally {
      setIsLoading(false);
    }
  };

  // Left Column - Pitch (Info Card)
  const LeftColumn = () => (
    <View style={{ flex: 1, backgroundColor: "#162B6F" }}>
      <ImageBackground source={require("../../assets/images/register-hero.png")} style={{ flex: 1 }} imageStyle={{ opacity: 0.3 }}>
        <LinearGradient colors={["rgba(22, 43, 111, 0.9)", "rgba(22, 43, 111, 0.85)"]} style={{ flex: 1, padding: 32, justifyContent: "space-between" }}>
          {/* Top Content */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255, 255, 255, 0.1)", borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.15)", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: "flex-start", marginBottom: 24 }}>
              <Text style={{ fontSize: 10, color: "#fff", fontWeight: "600", letterSpacing: 1 }}>BAYANIA</Text>
            </View>
            <Text style={{ fontSize: 32, fontWeight: "700", color: "#fff", marginBottom: 24, lineHeight: 40 }}>Modernisez votre pratique avec l'IA Juridique</Text>
            <Text style={{ fontSize: 14, color: "rgba(255, 255, 255, 0.7)", marginBottom: 40, lineHeight: 20 }}>Rejoignez l'élite des professionnels du droit au Maroc. Bénéficiez d'une précision de 99,8%.</Text>
            {/* Features (raccourcis pour lisibilité, reste inchangé par rapport à ton code) */}
            <View style={{ gap: 24 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <MaterialCommunityIcons name="shield-check" size={20} color="#fff" style={{ marginTop: 4 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff", marginBottom: 4 }}>Sécurité de grade institutionnel</Text>
                  <Text style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.6)" }}>Chiffrement de bout en bout et conformité CNDP stricte.</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );

  // Right Column - Form
  const RightColumn = () => (
    <ScrollView style={{ flex: 1, backgroundColor: "#fff" }} contentContainerStyle={{ padding: 24, justifyContent: "flex-start" }} showsVerticalScrollIndicator={false}>
      <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 }}>
        <Ionicons name="arrow-back" size={14} color="#5A677C" />
        <Text style={{ fontSize: 14, color: "#5A677C", fontWeight: "500" }}>Retour à l'accueil</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 28, fontWeight: "700", color: "#1E3A8A", marginBottom: 8 }}>Créer votre compte professionnel</Text>
      <Text style={{ fontSize: 14, color: "#5A677C", marginBottom: 32 }}>Commencez votre essai gratuit de 14 jours.</Text>

      {/* Form */}
      <View style={{ gap: 20, marginBottom: 24 }}>
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", marginBottom: 8, letterSpacing: 0.5 }}>PRÉNOM</Text>
            <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff" }}>
              <Ionicons name="person" size={16} color="#7C93D6" />
              <TextInput placeholder="Ahmed" value={formData.firstName} onChangeText={(value) => handleInputChange("firstName", value)} editable={!isLoading} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: "#1E3A8A" }} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", marginBottom: 8, letterSpacing: 0.5 }}>NOM</Text>
            <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff" }}>
              <TextInput placeholder="Alami" value={formData.lastName} onChangeText={(value) => handleInputChange("lastName", value)} editable={!isLoading} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: "#1E3A8A" }} />
            </View>
          </View>
        </View>

        <View>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", marginBottom: 8, letterSpacing: 0.5 }}>ADRESSE EMAIL</Text>
          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff" }}>
            <MaterialCommunityIcons name="email" size={16} color="#7C93D6" />
            <TextInput placeholder="contact@votre-cabinet.ma" autoCapitalize="none" keyboardType="email-address" value={formData.email} onChangeText={(value) => handleInputChange("email", value)} editable={!isLoading} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: "#1E3A8A" }} />
          </View>
        </View>

       

        <View>
          <Text style={{ fontSize: 11, fontWeight: "600", color: "#5A677C", marginBottom: 8, letterSpacing: 0.5 }}>MOT DE PASSE</Text>
          <View style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#E3E8F3", borderRadius: 8, paddingHorizontal: 12, backgroundColor: "#fff" }}>
            <MaterialCommunityIcons name="lock" size={16} color="#7C93D6" />
            <TextInput placeholder="••••••••••••" value={formData.password} onChangeText={(value) => handleInputChange("password", value)} secureTextEntry editable={!isLoading} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: "#1E3A8A" }} />
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
          <Checkbox value={agreed} onValueChange={setAgreed} color={agreed ? "#1E3A8A" : undefined} style={{ marginTop: 2 }} />
          <Text style={{ fontSize: 12, color: "#5A677C", flex: 1, lineHeight: 18 }}>
            J'accepte les Conditions Générales d'Utilisation et la Politique de Confidentialité.
          </Text>
        </View>
      </View>

      <TouchableOpacity onPress={handleSubmit} disabled={isLoading} style={{ backgroundColor: isLoading ? "#9AA3C2" : "#1E3A8A", borderRadius: 8, paddingVertical: 12, marginBottom: 16, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 }}>
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#fff" }}>Démarrer l'essai gratuit</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>

      <View style={{ flexDirection: "row", justifyContent: "center", gap: 4, marginTop: 10 }}>
        <Text style={{ fontSize: 14, color: "#5A677C" }}>Vous avez déjà un compte ? </Text>
        <TouchableOpacity onPress={() => router.push("/connexion")}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#1E3A8A" }}>Connectez-vous ici</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {width > 1024 ? (
        <View style={{ flex: 1, flexDirection: "row" }}>
          <View style={{ flex: 1 }}><LeftColumn /></View>
          <View style={{ flex: 1 }}><RightColumn /></View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <Navbar/> 
          <LeftColumn />
          <RightColumn />
          <Footer/>
        </ScrollView>
      )}
    </View>
  );
}
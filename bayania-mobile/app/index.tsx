import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import HeroConversation from "../components/HeroConversation";
import HomePreview from "../components/HomePreviewSlider";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";




type Stat = { value: string; label: string; eyebrow: string };
type Feature = { icon: string; title: string; description: string; image: ImageSourcePropType };
type Testimonial = { quote: string; name: string; role: string };
type Plan = { name: string; price: string; period: string; features: string[]; cta: string; highlighted: boolean };

const stats: Stat[] = [
  { value: "1.2M+", label: "Fichiers sources indexées", eyebrow: "Documents juridiques" },
  { value: "99.8%", label: "Précision des réponses", eyebrow: "Précision" },
  { value: "250k+", label: "Réponses générées", eyebrow: "Questions" },
  { value: "24/7", label: "Toujours disponible", eyebrow: "Support" },
];

const features: Feature[] = [
  {
    icon: "message-text-outline",
    title: "AI Legal Chat",
    description: "Interrogez notre IA sur tout point de droit marocain et recevez des réponses entièrement sourcées avec citations juridiques.",
    image: require("../assets/features/legal-chat.png"),
  },
  {
    icon: "file-document",
    title: "Analyse de PDF",
    description: "Téléchargez des contrats ou jugements pour un résumé automatique et une détection instantanée des risques.",
    image: require("../assets/features/pdf-analysis.png"),
  },
  {
    icon: "magnify",
    title: "Recherche Intelligente",
    description: "Explorez une base de données exhaustive de lois et de jurisprudence marocaine en un seul clic.",
    image: require("../assets/features/search.png"),
  },
  {
    icon: "lock",
    title: "Auto-Anonymisation",
    description: "Protégez la vie privée en masquant automatiquement les données personnelles sensibles dans vos documents juridiques.",
    image: require("../assets/features/anonymisation.png"),
  },
];
const testimonials: Testimonial[] = [
  {
    quote: "BayanIA a radicalement changé ma façon de préparer les dossiers. La rapidité avec laquelle je trouve la jurisprudence pertinente est impressionnante. Un outil indispensable pour la pratique moderne.",
    name: "Ahmed Alami",
    role: "Attorney, Casablanca Bar",
  },
  {
    quote: "L'analyse de PDF me fait gagner des heures sur les révisions de contrats complexes. La précision de l'IA concernant les spécificités du droit marocain est ce qui distingue vraiment.",
    name: "Dr. Sarah Benjelloun",
    role: "Senior Legal Consultant",
  },
];
const plans: Plan[] = [
  {
    name: "Basique",
    price: "60MAD",
    period: "/month",
    features: ["50 requêtes IA/mois", "Analyse de PDF basique", "Support standard"],
    cta: "Choisir ce forfait",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "490MAD",
    period: "/month",
    features: [
      "Requêtes IA illimitées",
      "Analyse de PDF avancée",
      "Support prioritaire",
      "Réponses jusqu'à 2x plus rapides",
    ],
    cta: "Choisir ce forfait",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Coutume",
    period: "",
    features: ["Entraînement de modèle personnalisé", "Déploiement sur site", "Garanties SLA"],
    cta: "Choisir ce forfait",
    highlighted: false,
  },
];

export default function HomePage() {
  
  const [question, setQuestion] = useState("");

  const handleAnalyser = () => {
    if (!question.trim()) return;
    router.push(`../analyse?q=${encodeURIComponent(question)}`);
  };
  
  

  const StatsSection = () => (
    <View style={{ backgroundColor: "#fff", paddingVertical: 40, paddingHorizontal: 24 }}>
      <FlatList
        data={stats}
        renderItem={({ item }: { item: Stat }) => (
          <View style={{ flex: 1, alignItems: "center", paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 12, color: "#7C93D6", fontWeight: "600", marginBottom: 8 }}>
              {item.eyebrow}
            </Text>
            <Text style={{ fontSize: 28, color: "#1E3A8A", fontWeight: "700", marginBottom: 4 }}>
              {item.value}
            </Text>
            <Text style={{ fontSize: 12, color: "#5A677C" }}>{item.label}</Text>
          </View>
        )}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={{ gap: 20 }}
        contentContainerStyle={{ gap: 20 }}
        keyExtractor={(_, idx) => idx.toString()}
      />
    </View>
    
  );

  const FeatureCard = ({ feature }: { feature: Feature }) => (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E3E8F3",
        padding: 24 ,
        width: "100%",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          backgroundColor: "#EEF2FC",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <MaterialCommunityIcons name={feature.icon as any} size={20} color="#1E3A8A" />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "600", color: "#1E3A8A", marginBottom: 12 }}>
        {feature.title}
      </Text>
      <Text style={{ fontSize: 14, color: "#5A677C", lineHeight: 20, marginBottom: 16 }}>
        {feature.description}
      </Text>
      <Image
        source={feature.image}
        style={{ width: "100%", height: 130, borderRadius: 8 }}
        resizeMode="cover"
      />
    </View>
  );

  const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
    <View
      style={{
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E3E8F3",
        padding: 24,
        width: "100%"
      }}
    >
      <Text style={{ fontSize: 20, color: "#DCE4F9", marginBottom: 12 }}>"</Text>
      <Text style={{ fontSize: 14, color: "#5A677C", lineHeight: 20, marginBottom: 20 }}>
        {testimonial.quote}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: "auto" }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#EEF2FC",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Ionicons name="person" size={16} color="#1E3A8A" />
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#1E3A8A" }}>
            {testimonial.name}
          </Text>
          <Text style={{ fontSize: 12, color: "#5A677C" }}>{testimonial.role}</Text>
        </View>
      </View>
    </View>
  );

  const PricingCard = ({ plan }: { plan: Plan }) => (
    <LinearGradient
      colors={plan.highlighted ? ["#1E3A8A", "#122252"] : ["#ffffff", "#f3f7fe"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 12,
        borderWidth: 1,
        borderColor: plan.highlighted ? "#1E3A8A" : "#E3E8F3",
        padding: 24,
        width: "100%",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "600",
          color: plan.highlighted ? "#fff" : "#1E3A8A",
          marginBottom: 8,
        }}
      >
        {plan.name.toUpperCase()}
      </Text>
      <Text
        style={{
          fontSize: 28,
          fontWeight: "700",
          color: plan.highlighted ? "#fff" : "#1E3A8A",
          marginBottom: 16,
        }}
      >
        {plan.price}
        <Text style={{ fontSize: 12, color: plan.highlighted ? "rgba(255,255,255,0.7)" : "#5A677C" }}>
          {plan.period}
        </Text>
      </Text>
      {plan.features.map((feature, idx) => (
        <View key={idx} style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          <MaterialCommunityIcons
            name="check-circle"
            size={14}
            color={plan.highlighted ? "#fff" : "#16A34A"}
            style={{ marginTop: 2 }}
          />
          <Text
            style={{
              fontSize: 12,
              color: plan.highlighted ? "rgba(255,255,255,0.9)" : "#5A677C",
              flex: 1,
            }}
          >
            {feature}
          </Text>
        </View>
      ))}
      <TouchableOpacity
        style={{
          backgroundColor: plan.highlighted ? "#fff" : "#E3E8F3",
          borderRadius: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginTop: 16,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: "#1E3A8A",
            textAlign: "center",
          }}
        >
          {plan.cta}
        </Text>
      </TouchableOpacity>
    </LinearGradient>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#F3F7FE" }}>
      <Navbar/> 
      {/* Hero Section */}
      <View style={{ backgroundColor: "#F3F7FE", paddingVertical: 64, paddingHorizontal: 24 }}>
        <View style={{ marginBottom: 24 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#fff",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              alignSelf: "flex-start",
              marginBottom: 20,
              borderWidth: 1,
              borderColor: "#E3E8F3",
            }}
          >
            <Text style={{ fontSize: 10, color: "#5A677C", fontWeight: "600", marginRight: 8 }}>
              IA JURIDIQUE MAROCAINE
            </Text>
          </View>

          <Text style={{ fontSize: 32, fontWeight: "700", color: "#1E3A8A", marginBottom: 16, lineHeight: 40 }}>
            Votre Assistant Juridique Intelligent
          </Text>

          <Text style={{ fontSize: 16, color: "#5A677C", marginBottom: 24, lineHeight: 24 }}>
            BayanIA transforme la recherche juridique au Maroc. Accédez instantanément à la jurisprudence, analysez vos contrats et sécurisez vos données.
          </Text>

          <View style={{ backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#E3E8F3", paddingHorizontal: 12, paddingVertical: 8, marginBottom: 16, flexDirection: "row", alignItems: "center" }}>
            <MaterialCommunityIcons name="magnify" size={16} color="#7C93D6" />
            <TextInput
              placeholder="Poser une question juridique"
              value={question}
              onChangeText={setQuestion}
              style={{ flex: 1, marginLeft: 8, fontSize: 14, color: "#1E3A8A" }}
              placeholderTextColor="#7C93D6"
            />
          </View>

          <TouchableOpacity
            onPress={handleAnalyser}
            style={{
              backgroundColor: "#1E3A8A",
              borderRadius: 8,
              paddingVertical: 12,
              paddingHorizontal: 24,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" }}>
              Analyser
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 12, color: "#7C93D6", marginBottom: 24 }}>
            Suggestions: <Text style={{ color: "#5A677C" }}>Licenciement abusif, Bail commercial</Text>
          </Text>

          <View style={{ gap: 12 }}>
            <TouchableOpacity
  onPress={() => router.push("/inscription")}
  style={{ backgroundColor: "#1E3A8A", borderRadius: 8, paddingVertical: 12 }}
>
  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" }}>
    Démarrer l'essai gratuit
  </Text>
</TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: "#fff",
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#E3E8F3",
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "#1E3A8A", fontSize: 14, fontWeight: "600", textAlign: "center" }}>
                Réserver une démo
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Conversation */}
        <HeroConversation />

        {/* Home Preview */}
        <HomePreview />
      </View>

      {/* Stats Section (une seule fois) */}
      <StatsSection />

      {/* Features Section */}
      <View style={{ backgroundColor: "#F3F7FE", paddingVertical: 64 }}>
        <View style={{ alignItems: "center", marginBottom: 48, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 12, color: "#5A677C", fontWeight: "600", marginBottom: 12 }}>
            FONCTIONNALITÉS CLÉS
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1E3A8A", marginBottom: 16, textAlign: "center" }}>
            Une suite d'outils puissants
          </Text>
          <Text style={{ fontSize: 14, color: "#5A677C", textAlign: "center", lineHeight: 20 }}>
            Conçue spécifiquement pour naviguer dans les subtilités du système juridique marocain.
          </Text>
        </View>
        <FlatList
  data={features}
  renderItem={({ item }: { item: Feature }) => <FeatureCard feature={item} />}
  keyExtractor={(_, idx) => idx.toString()}
  scrollEnabled={false}
  contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}
/>
      </View>

      {/* Testimonials Section */}
      <View style={{ backgroundColor: "#F3F7FE", paddingVertical: 64 }}>
        <View style={{ alignItems: "center", marginBottom: 48, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 12, color: "#5A677C", fontWeight: "600", marginBottom: 12 }}>
            TÉMOIGNAGES
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1E3A8A", textAlign: "center" }}>
            La confiance des leaders du secteur
          </Text>
        </View>
       <FlatList
  data={testimonials}
  renderItem={({ item }: { item: Testimonial }) => <TestimonialCard testimonial={item} />}
  keyExtractor={(_, idx) => idx.toString()}
  scrollEnabled={false}
  contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}
/>
      </View>

      {/* Pricing Section */}
      <View style={{ backgroundColor: "#fff", paddingVertical: 64 }}>
        <View style={{ alignItems: "center", marginBottom: 48, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 12, color: "#5A677C", fontWeight: "600", marginBottom: 12 }}>
            TARIFS
          </Text>
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#1E3A8A", textAlign: "center" }}>
            Des forfaits simples et transparents
          </Text>
        </View>
        <FlatList
  data={plans}
  renderItem={({ item }: { item: Plan }) => <PricingCard plan={item} />}
  keyExtractor={(_, idx) => idx.toString()}
  scrollEnabled={false}
  contentContainerStyle={{ gap: 16, paddingHorizontal: 24 }}
/>
      </View>

      {/* CTA Section */}
      <LinearGradient
        colors={["#1E3A8A", "#122252"]}
        style={{ paddingVertical: 64, paddingHorizontal: 24, alignItems: "center" }}
      >
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 16, textAlign: "center" }}>
          Prêt à moderniser votre pratique juridique ?
        </Text>
        <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 24, textAlign: "center" }}>
          Rejoignez des centaines de professionnels du droit qui utilisent déjà BayanIA.
        </Text>
        <TouchableOpacity
  onPress={() => router.push("/")}
  style={{ backgroundColor: "#1E3A8A", borderRadius: 8, paddingVertical: 12 }}
>
  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "600", textAlign: "center" }}>
    Démarrer l'essai gratuit
  </Text>
</TouchableOpacity>
        <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", textAlign: "center" }}>
          Aucune carte bancaire requise · Essai de 14 jours
        </Text>
      </LinearGradient>
      <Footer/>
    </ScrollView>
  );
}
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, Text, View } from "react-native";

export default function HeroConversation() {
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(100));
  const [aiSlideAnim] = useState(new Animated.Value(-100));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start();

    setTimeout(() => {
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 400);

    setTimeout(() => {
      Animated.timing(aiSlideAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 900);
  }, []);

  return (
    <View style={{ alignItems: "center", marginTop: 32 }}>
      <LinearGradient
        colors={["#10254d", "#0a1a35"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: "100%",
          maxWidth: 480,
          borderRadius: 24,
          padding: 32,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.3,
          shadowRadius: 24,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={["rgba(34, 211, 238, 0.08)", "rgba(37, 99, 235, 0.04)", "transparent"]}
          start={{ x: -0.5, y: -0.5 }}
          end={{ x: 1.5, y: 1.5 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 24,
          }}
          pointerEvents="none"
        />

        <View style={{ position: "relative", gap: 24 }}>
          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
            }}
          >
            <Animated.View
              style={[
                { flexDirection: "row", alignItems: "center", gap: 8 },
                { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
              ]}
            >
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#10b981" }} />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#f1f5f9" }}>
                98% Score de Confiance
              </Text>
            </Animated.View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="file-pdf-box" size={16} color="#f1f5f9" />
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#f1f5f9" }}>
                PDF Analysis
              </Text>
            </View>
          </View>

          {/* Title */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ backgroundColor: "rgba(255, 255, 255, 0.1)", padding: 10, borderRadius: 8 }}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color="#fff" />
            </View>
            <View>
              <Text style={{ fontSize: 28, fontWeight: "700", color: "#f3f4f6" }}>BayanAI</Text>
              <Text style={{ fontSize: 12, color: "#cbd5e1", marginLeft: 44 }}>
                Assistant Juridique Intelligent
              </Text>
            </View>
          </View>

          {/* User message */}
          <Animated.View
            style={[
              { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 32 },
              { transform: [{ translateX: slideAnim }], opacity: opacityAnim },
            ]}
          >
            <View
              style={{
                backgroundColor: "#2958A3",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderRadius: 16,
                maxWidth: "auto",
                flexShrink: 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "500", color: "#f1f5f9", lineHeight: 20 }}>
                Quel est le préavis légal en cas de licenciement d'un salarié étranger ?
              </Text>
            </View>
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "#1E3F78",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <Ionicons name="person" size={18} color="#fff" />
            </View>
          </Animated.View>

          {/* AI response */}
          <Animated.View
            style={[
              { flexDirection: "row", gap: 12, marginTop: 24 },
              { transform: [{ translateX: aiSlideAnim }], opacity: opacityAnim },
            ]}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <MaterialCommunityIcons name="message-text-outline" size={18} color="#06b6d4" />
            </View>
            <View
              style={{
                backgroundColor: "#1E3F78",
                paddingHorizontal: 20,
                paddingVertical: 16,
                borderRadius: 16,
                flex: 1,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 3,
              }}
            >
              <Text style={{ fontSize: 14, color: "#e2e8f0", lineHeight: 20 }}>
                Selon le Dahir n°1-03-194 (Code du Travail), le préavis dépend de
                l'ancienneté et de la catégorie du salarié. Pour un salarié étranger,
                les mêmes dispositions s'appliquent, sauf si une convention particulière
                prévoit des règles différentes.
              </Text>
            </View>
          </Animated.View>

          {/* Security footer */}
          <Animated.View
            style={[
              { marginTop: 40, paddingTop: 24, borderTopWidth: 1, borderTopColor: "rgba(255, 255, 255, 0.1)" },
              { opacity: opacityAnim },
            ]}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                paddingHorizontal: 20,
                paddingVertical: 16,
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 3,
                alignSelf: "flex-start",
              }}
            >
              <MaterialCommunityIcons name="shield-check" size={22} color="#10b981" />
              <View>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1a3a7a" }}>
                  SÉCURITÉ AVANT TOUT
                </Text>
                <Text style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                  Conforme CNDP
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}






import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  ImageSourcePropType,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

type Screen = {
  image: ImageSourcePropType;
  title: string;
};

const screens: Screen[] = [
  { image: require("../assets/screenshots/acceuil.png"), title: "Accueil" },
  { image: require("../assets/screenshots/login.png"), title: "Connexion" },
  { image: require("../assets/screenshots/register.png"), title: "Inscription" },
  { image: require("../assets/screenshots/assistant.png"), title: "Assistant IA" },
  { image: require("../assets/screenshots/response.png"), title: "Réponse IA" },
  { image: require("../assets/screenshots/search.png"), title: "Recherche juridique" },
  { image: require("../assets/screenshots/tarifs.png"), title: "Tarifs" },
];

export default function HomePreviewSlider() {
  const { width } = useWindowDimensions();
  const ITEM_WIDTH = width - 48;

  const [current, setCurrent] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((old) => {
        const next = (old + 1) % screens.length;
        flatListRef.current?.scrollToOffset({
          offset: next * ITEM_WIDTH,
          animated: true,
        });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [ITEM_WIDTH]);

  const renderScreen = ({ item }: { item: Screen }) => (
    <View style={{ width: ITEM_WIDTH }}>
      <View
        style={{
          borderRadius: 24,
          overflow: "hidden",
          backgroundColor: "#fff",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
          elevation: 5,
        }}
      >
        <View style={{ backgroundColor: "#fff", padding: 16, justifyContent: "center" }}>
          <Image
            source={item.image}
            style={{ width: "100%", height: 400, borderRadius: 12 }}
            resizeMode="contain"
          />
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            paddingHorizontal: 20,
            paddingVertical: 16,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: "#999", marginBottom: 4 }}>Démonstration</Text>
            <Text style={{ fontSize: 20, fontWeight: "600", color: "#163A8C" }}>{item.title}</Text>
          </View>

          <View style={{ flexDirection: "row", gap: 4 }}>
            {screens.map((_, idx) => (
              <View
                key={idx}
                style={[
                  { height: 8, borderRadius: 4 },
                  current === idx
                    ? { width: 24, backgroundColor: "#1E40AF" }
                    : { width: 8, backgroundColor: "#D1D5DB" },
                ]}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ position: "relative", marginTop: 32 }}>
      <LinearGradient
        colors={["rgba(59, 130, 246, 0.2)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{
          position: "absolute",
          top: -48,
          left: ITEM_WIDTH / 2 - 144,
          width: 288,
          height: 288,
          borderRadius: 144,
        }}
      />

      <FlatList
        ref={flatListRef}
        data={screens}
        renderItem={renderScreen}
        keyExtractor={(_, index) => index.toString()}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH,
          offset: ITEM_WIDTH * index,
          index,
        })}
      />
    </View>
  );
}
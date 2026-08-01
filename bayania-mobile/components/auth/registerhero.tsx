import { Dimensions, Image, View } from "react-native";

const { height } = Dimensions.get("window");

export default function RegisterHero() {
  return (
    <View style={{ height, position: "relative" }}>
      <Image
        source={require("../assets/images/register-hero.png")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
        }}
        resizeMode="cover"
      />
    </View>
  );
}
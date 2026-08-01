import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Header from "../components/layout/Navbar";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />

      <View style={{ flex: 1, minHeight: "100vh" as any }}>
        <Header />

        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: "slide_from_right",
              contentStyle: {
                backgroundColor: "#F8FAFC",
              },
            }}
          />
        </View>
      </View>
    </SafeAreaProvider>
  );
}
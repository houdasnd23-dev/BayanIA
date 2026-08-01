import { router } from "expo-router";
import { ChevronDown, Scale } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, fonts } from "./theme";

const navLinks = [
  { label: "Fonctionnalités", route: "/fonctionnalites" },
  { label: "Solutions", route: "/solutions" },
  { label: "Tarifs", route: "/tarifs" },
];

export default function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.brand}
          onPress={() => router.push("/")}
        >
          <View style={styles.logoBadge}>
            <Scale size={16} color={colors.white} strokeWidth={2} />
          </View>
          <Text style={styles.brandText}>BayanIA</Text>
        </TouchableOpacity>

        <View style={styles.navLinks}>
          {navLinks.map((link) => (
            <TouchableOpacity
              key={link.label}
              onPress={() => router.push(link.route as any)}
            >
              <Text style={styles.navLinkText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.rowCenter}>
            <Text style={styles.navLinkText}>Ressources</Text>
            <ChevronDown size={14} color={colors.navy500} />
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity onPress={() => router.push("/connexion")}>
            <Text style={styles.loginText}>Connexion</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => router.push("/inscription")}
          >
            <Text style={styles.ctaBtnText}>Essai Gratuit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: "rgba(255,255,255,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBadge: {
    height: 32,
    width: 32,
    borderRadius: 16,
    backgroundColor: colors.navy600,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontFamily: fonts.serif, fontSize: 17, fontWeight: "700", color: colors.navy600 },
  navLinks: { flexDirection: "row", alignItems: "center", gap: 16 },
  navLinkText: { fontSize: 13, color: colors.navy500 },
  rowCenter: { flexDirection: "row", alignItems: "center", gap: 4 },
  actions: { flexDirection: "row", alignItems: "center", gap: 14 },
  loginText: { fontSize: 13, color: colors.navy500 },
  ctaBtn: {
    backgroundColor: colors.navy600,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  ctaBtnText: { color: colors.white, fontSize: 13, fontWeight: "600" },
});
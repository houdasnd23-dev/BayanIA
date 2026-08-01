
import { Globe, Scale } from "lucide-react-native";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors, fonts } from "./theme";

// Mêmes icônes maison qu'en web (lucide n'a pas les icônes de marque),
// simplement redessinées avec react-native-svg au lieu d'un <svg> HTML.
function LinkedinIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.navy400} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6.5 8.5v9M6.5 5.5v.01M11 17.5v-5.2c0-1.8 1.2-3.3 3-3.3s3 1.3 3 3.3v5.2M11 9.2v8.3" />
    </Svg>
  );
}
function TwitterIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={colors.navy400} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 5.5c-.7.4-1.5.6-2.3.8a3.3 3.3 0 0 0-5.6 3v.7A9.3 9.3 0 0 1 4.7 6.4s-3 6.8 4 9.9a10 10 0 0 1-6 1.6c7 4 15.4 0 15.4-8.9 0-.3 0-.5-.1-.8A6.5 6.5 0 0 0 20 5.5Z" />
    </Svg>
  );
}

const columns = [
  { title: "Plateforme", links: ["Accueil", "Fonctionnalités", "Tarifs", "Blog"] },
  {
    title: "Légal",
    links: [
      "Mentions légales",
      "Conditions générales",
      "Politique de confidentialité",
      "Sécurité des données",
    ],
  },
];

export default function Footer() {
  

  return (
    <View style={styles.footer}>
      <View style={styles.brandBlock}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Scale size={14} color={colors.white} />
          </View>
          <Text style={styles.brandText}>BayanIA</Text>
        </View>
        <Text style={styles.brandDesc}>
          L'assistant juridique IA premium conçu pour le droit marocain.
          Accélérez vos recherches, vérifiez la jurisprudence et optimisez
          votre efficacité professionnelle avec une précision inégalée.
        </Text>
      </View>

      {columns.map((col) => (
        <View key={col.title} style={styles.column}>
          <Text style={styles.columnTitle}>{col.title}</Text>
          {col.links.map((link) => (
            <TouchableOpacity key={link} style={styles.linkRow} onPress={() => {}}>
              <Text style={styles.linkText}>{link}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ))}

      <View style={styles.column}>
        <Text style={styles.columnTitle}>Contact</Text>
        <Text style={styles.contactEmail}>contact@bayania.ma</Text>
        <View style={styles.socialRow}>
          <LinkedinIcon size={16} />
          <TwitterIcon size={16} />
          <Globe size={16} color={colors.navy400} />
        </View>
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.bottomText}>© 2026 BayanIA. Tous droits réservés.</Text>
        <Text style={styles.bottomTextItalic}>
          Conçu pour le paysage juridique marocain.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: colors.surfaceMuted,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    padding: 20,
    gap: 24,
  },
  brandBlock: { gap: 10 },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoBadge: {
    height: 28,
    width: 28,
    borderRadius: 14,
    backgroundColor: colors.navy600,
    alignItems: "center",
    justifyContent: "center",
  },
  brandText: { fontFamily: fonts.serif, fontSize: 16, fontWeight: "700", color: colors.navy600 },
  brandDesc: { fontSize: 13, color: colors.navy400, lineHeight: 19 },

  column: { gap: 10 },
  columnTitle: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", color: colors.navy600, letterSpacing: 0.4 },
  linkRow: { paddingVertical: 2 },
  linkText: { fontSize: 13, color: colors.navy400 },

  contactEmail: { fontSize: 13, color: colors.navy400 },
  socialRow: { flexDirection: "row", gap: 12, marginTop: 4 },

  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: 16,
    gap: 4,
  },
  bottomText: { fontSize: 11, color: colors.navy400 },
  bottomTextItalic: { fontSize: 11, color: colors.navy400, fontStyle: "italic" },
});

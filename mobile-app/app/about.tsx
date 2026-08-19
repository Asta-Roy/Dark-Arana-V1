import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const APP_VERSION = "1.0.0";
const COPYRIGHT_YEAR = new Date().getFullYear();
const OWNER_NAME = "Darck Arana";

export default function AboutScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: topPad + 8,
      paddingHorizontal: 16,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.card,
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    scroll: { flex: 1 },
    heroSection: {
      alignItems: "center",
      paddingVertical: 40,
      paddingHorizontal: 20,
    },
    appIcon: {
      width: 96,
      height: 96,
      borderRadius: 22,
      marginBottom: 16,
    },
    appName: {
      fontSize: 26,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
    },
    tagline: {
      fontSize: 14,
      color: colors.mutedForeground,
      marginTop: 6,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    versionBadge: {
      marginTop: 14,
      backgroundColor: colors.muted,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 6,
    },
    versionText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
    },
    section: {
      marginHorizontal: 20,
      marginBottom: 20,
    },
    sectionLabel: {
      fontSize: 11,
      fontWeight: "600" as const,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
      fontFamily: "Inter_600SemiBold",
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 14,
      gap: 12,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowIcon: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    rowLabel: {
      flex: 1,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    rowValue: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    copyrightBox: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 20,
      alignItems: "center",
      gap: 8,
    },
    copyrightTitle: {
      fontSize: 15,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    copyrightText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 20,
    },
    allRightsText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 4,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginHorizontal: 20,
      marginVertical: 4,
    },
    bottomSpacer: { height: bottomPad + 40 },
    poweredRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    poweredText: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    poweredBadge: {
      backgroundColor: colors.muted,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    poweredBadgeText: {
      fontSize: 11,
      color: colors.secondary,
      fontFamily: "Inter_600SemiBold",
    },
  });

  const infoRows = [
    { icon: "info", color: colors.primary, label: "Version", value: APP_VERSION },
    { icon: "cpu", color: colors.secondary, label: "AI Model", value: "Gemini 2.5 Flash" },
    { icon: "image", color: colors.accent, label: "Image Generation", value: "Gemini AI" },
    { icon: "database", color: "#22c55e", label: "Storage", value: "PostgreSQL" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>About</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingTop: 0 }}>
        <View style={styles.heroSection}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.appIcon}
          />
          <Text style={styles.appName}>Darck Arana</Text>
          <Text style={styles.tagline}>Your AI-powered assistant for chat & image creation</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>v{APP_VERSION}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>App Info</Text>
          <View style={styles.card}>
            {infoRows.map((row, idx) => (
              <View key={row.label} style={[styles.row, idx > 0 && styles.rowBorder]}>
                <View style={[styles.rowIcon, { backgroundColor: row.color + "22" }]}>
                  <Feather name={row.icon as any} size={16} color={row.color} />
                </View>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Legal</Text>
          <View style={styles.copyrightBox}>
            <Text style={styles.copyrightTitle}>© {COPYRIGHT_YEAR} {OWNER_NAME}</Text>
            <Text style={styles.copyrightText}>
              جميع الحقوق محفوظة. هذا التطبيق وجميع محتوياته{"\n"}
              ملكية حصرية لـ {OWNER_NAME}.
            </Text>
            <View style={styles.divider} />
            <Text style={styles.allRightsText}>
              All rights reserved. Unauthorized reproduction or{"\n"}
              distribution of this app is strictly prohibited.
            </Text>
            <View style={styles.poweredRow}>
              <Text style={styles.poweredText}>Powered by</Text>
              <View style={styles.poweredBadge}>
                <Text style={styles.poweredBadgeText}>Google Gemini AI</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

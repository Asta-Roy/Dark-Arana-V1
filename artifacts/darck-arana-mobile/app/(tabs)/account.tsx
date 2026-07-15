import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

const PLAN_LABELS: Record<string, { name: string; color: string; power: string }> = {
  free:    { name: "المجاني",   color: "#6b7280", power: "40%" },
  pro:     { name: "برو",      color: "#8B52FF", power: "80%" },
  premium: { name: "بريميوم",  color: "#D42EA0", power: "100%" },
};

export default function AccountScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  if (!user) return null;

  const plan = PLAN_LABELS[user.plan] || PLAN_LABELS.free;

  function handleLogout() {
    Alert.alert("تسجيل الخروج", "هل تريد الخروج من حسابك؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "خروج", style: "destructive", onPress: logout },
    ]);
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 },
    avatar: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: plan.color + "22",
      alignItems: "center", justifyContent: "center", marginBottom: 16, alignSelf: "center",
    },
    avatarText: { fontSize: 32, fontWeight: "700", color: plan.color, fontFamily: "Inter_700Bold" },
    username: { fontSize: 24, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", textAlign: "center" },
    email: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", fontFamily: "Inter_400Regular", marginTop: 4 },
    planBadge: {
      flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "center",
      backgroundColor: plan.color + "22", borderRadius: 20, paddingHorizontal: 16,
      paddingVertical: 8, marginTop: 14, marginBottom: 30,
    },
    planText: { fontSize: 15, fontWeight: "700", color: plan.color, fontFamily: "Inter_700Bold" },
    section: { marginBottom: 8 },
    sectionLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 8, paddingHorizontal: 4 },
    card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, overflow: "hidden" },
    row: {
      flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 15,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    rowLast: { borderBottomWidth: 0 },
    rowIcon: { marginRight: 14 },
    rowText: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
    rowValue: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    logoutBtn: {
      marginTop: 24, backgroundColor: "#3b0a0a", borderRadius: 14, paddingVertical: 14,
      alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 10,
      borderWidth: 1, borderColor: "#991b1b",
    },
    logoutText: { color: "#f87171", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    powerBar: { height: 6, borderRadius: 3, backgroundColor: colors.border, marginTop: 4 },
    powerFill: { height: 6, borderRadius: 3, backgroundColor: plan.color },
  });

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user.username[0].toUpperCase()}</Text>
        </View>
        <Text style={s.username}>@{user.username}</Text>
        <Text style={s.email}>{user.email}</Text>
        <View style={s.planBadge}>
          <Feather name="award" size={16} color={plan.color} />
          <Text style={s.planText}>باقة {plan.name}</Text>
        </View>

        {/* Plan details */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>تفاصيل الباقة</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Feather name="zap" size={18} color={plan.color} style={s.rowIcon} />
              <Text style={s.rowText}>قوة الذكاء الاصطناعي</Text>
              <Text style={[s.rowValue, { color: plan.color }]}>{plan.power}</Text>
            </View>
            <View style={[s.row, { flexDirection: "column", alignItems: "stretch" }]}>
              <View style={{ flexDirection: "row" }}>
                <Feather name="activity" size={18} color={colors.mutedForeground} style={s.rowIcon} />
                <Text style={s.rowText}>قوة AI</Text>
              </View>
              <View style={s.powerBar}>
                <View style={[s.powerFill, { width: plan.power }]} />
              </View>
            </View>
            {user.expiryDate && (
              <View style={[s.row, s.rowLast]}>
                <Feather name="calendar" size={18} color={colors.mutedForeground} style={s.rowIcon} />
                <Text style={s.rowText}>انتهاء الاشتراك</Text>
                <Text style={s.rowValue}>{new Date(user.expiryDate).toLocaleDateString("ar-EG")}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Quick links */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>الإعدادات</Text>
          <View style={s.card}>
            <Pressable style={s.row} onPress={() => router.push("/subscription")}>
              <Feather name="star" size={18} color={colors.primary} style={s.rowIcon} />
              <Text style={s.rowText}>ترقية الباقة</Text>
              <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
            </Pressable>
            {/* Admin panel — only for ROY */}
            {user.username === "ROY" && (
              <Pressable style={s.row} onPress={() => router.push("/admin")}>
                <Feather name="shield" size={18} color="#f59e0b" style={s.rowIcon} />
                <Text style={[s.rowText, { color: "#f59e0b" }]}>لوحة الادمن</Text>
                <Feather name="chevron-left" size={16} color="#f59e0b" />
              </Pressable>
            )}
            <Pressable style={[s.row, s.rowLast]} onPress={() => router.push("/(tabs)/support")}>
              <Feather name="help-circle" size={18} color={colors.mutedForeground} style={s.rowIcon} />
              <Text style={s.rowText}>الدعم والمساعدة</Text>
              <Feather name="chevron-left" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>
        </View>

        {/* Logout */}
        <Pressable style={s.logoutBtn} onPress={handleLogout}>
          <Feather name="log-out" size={18} color="#f87171" />
          <Text style={s.logoutText}>تسجيل الخروج</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

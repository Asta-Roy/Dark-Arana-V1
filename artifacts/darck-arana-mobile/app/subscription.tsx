import React from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

// ─── روابط Paymob (تُجلب من متغيرات البيئة) ─────────────────────────────────
// EXPO_PUBLIC_* تُصبح متاحة للموبايل في وقت البناء
const PAYMOB_PRO_LINK = process.env.EXPO_PUBLIC_PAYMOB_PRO_LINK ?? "";
const PAYMOB_PREMIUM_LINK = process.env.EXPO_PUBLIC_PAYMOB_PREMIUM_LINK ?? "";

const PLANS = [
  {
    key: "free" as const,
    name: "المجاني",
    price: "0",
    color: "#6b7280",
    payLink: null,
    features: [
      "8 صور AI كل 24 ساعة",
      "قوة AI 40%",
      "دعم FAQ فقط",
      "بدون فيديو AI",
    ],
    badge: null,
  },
  {
    key: "pro" as const,
    name: "برو",
    price: "99",
    color: "#8B52FF",
    payLink: PAYMOB_PRO_LINK,
    features: [
      "16 صورة AI كل 6 ساعات",
      "5 فيديوهات AI كل 24 ساعة",
      "قوة AI 80%",
      "دعم بتذاكر — رد خلال 24 ساعة",
    ],
    badge: null,
  },
  {
    key: "premium" as const,
    name: "بريميوم",
    price: "199",
    color: "#D42EA0",
    payLink: PAYMOB_PREMIUM_LINK,
    features: [
      "صور AI لا محدودة ♾️",
      "13 فيديو AI كل 24 ساعة",
      "قوة AI 100%",
      "دعم واتساب مباشر — رد 5 دقايق ⚡",
    ],
    badge: "الأكثر مبيعاً",
  },
] as const;

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // ─── فتح صفحة الدفع Paymob في متصفح جديد ────────────────────────────────
  async function handleSubscribe(plan: typeof PLANS[number]) {
    if (plan.key === "free" || !plan.payLink) return;

    try {
      await Linking.openURL(plan.payLink);
    } catch {
      // لو الرابط مش متاح
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
    header: { marginBottom: 28 },
    back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
    backText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    title: { fontSize: 26, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular" },
    card: { borderRadius: 20, borderWidth: 2, padding: 22, marginBottom: 16 },
    badge: { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginBottom: 14 },
    badgeText: { fontSize: 12, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
    planName: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
    priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: 6, marginBottom: 18 },
    price: { fontSize: 36, fontWeight: "700", fontFamily: "Inter_700Bold" },
    currency: { fontSize: 16, color: colors.mutedForeground, marginBottom: 8, fontFamily: "Inter_400Regular" },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    featureText: { fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular", flex: 1 },
    btn: { marginTop: 18, paddingVertical: 14, borderRadius: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
    btnText: { fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
    currentBadge: {
      flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "center",
      borderRadius: 12, padding: 10, marginTop: 18, justifyContent: "center",
    },
    currentText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    refreshBtn: {
      backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 14, alignItems: "center", marginTop: 8, flexDirection: "row", justifyContent: "center", gap: 8,
    },
    refreshText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_500Medium" },
    note: {
      backgroundColor: colors.card, borderRadius: 14, padding: 16, marginTop: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    noteText: { color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  });

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.header}>
          <Pressable style={s.back} onPress={() => router.back()}>
            <Feather name="arrow-right" size={18} color={colors.mutedForeground} />
            <Text style={s.backText}>رجوع</Text>
          </Pressable>
          <Text style={s.title}>الباقات والأسعار</Text>
          <Text style={s.subtitle}>اختر الباقة المناسبة لاحتياجاتك</Text>
        </View>

        {PLANS.map((plan) => {
          const isCurrent = user?.plan === plan.key;
          return (
            <View
              key={plan.key}
              style={[s.card, { borderColor: isCurrent ? plan.color : colors.border, backgroundColor: colors.card }]}
            >
              {plan.badge && (
                <View style={[s.badge, { backgroundColor: plan.color }]}>
                  <Text style={s.badgeText}>⭐ {plan.badge}</Text>
                </View>
              )}

              <Text style={[s.planName, { color: plan.color }]}>{plan.name}</Text>

              <View style={s.priceRow}>
                <Text style={[s.price, { color: colors.foreground }]}>{plan.price}</Text>
                <Text style={s.currency}>{plan.price === "0" ? "مجاناً" : "جنيه / شهر"}</Text>
              </View>

              {plan.features.map((f, i) => (
                <View key={i} style={s.featureRow}>
                  <Feather name="check-circle" size={16} color={plan.color} />
                  <Text style={s.featureText}>{f}</Text>
                </View>
              ))}

              {isCurrent ? (
                <View style={[s.currentBadge, { backgroundColor: plan.color + "20" }]}>
                  <Feather name="check" size={16} color={plan.color} />
                  <Text style={[s.currentText, { color: plan.color }]}>باقتك الحالية</Text>
                </View>
              ) : (
                <>
                  {plan.key !== "free" && (
                    // ─── زرار الدفع Paymob ────────────────────────────────
                    <Pressable
                      style={[s.btn, { backgroundColor: plan.color }]}
                      onPress={() => handleSubscribe(plan)}
                    >
                      <Feather name="credit-card" size={16} color="#fff" />
                      <Text style={s.btnText}>
                        {`اشترك في ${plan.name} — ${plan.price} جنيه`}
                      </Text>
                    </Pressable>
                  )}
                </>
              )}
            </View>
          );
        })}

        {/* ─── زرار تحديث الباقة بعد الدفع ─── */}
        <Pressable style={s.refreshBtn} onPress={refreshUser}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
          <Text style={s.refreshText}>بعد الدفع، اضغط هنا لتحديث باقتك</Text>
        </Pressable>

        <View style={[s.note, { marginTop: 16 }]}>
          <Text style={s.noteText}>
            💳 الدفع عبر Paymob — بعد إتمام الدفع ستُحدَّث باقتك تلقائياً.{"\n"}
            للمساعدة: واتساب 01155645393
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

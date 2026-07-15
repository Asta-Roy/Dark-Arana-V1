import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

const PLANS = [
  {
    key: "free",
    name: "المجاني",
    price: "0",
    color: "#6b7280",
    features: [
      "8 صور / 24 ساعة",
      "دردشة AI بقوة 40%",
      "دعم FAQ فقط",
      "ممنوع توليد الفيديو",
    ],
    badge: null,
  },
  {
    key: "pro",
    name: "برو",
    price: "99",
    color: "#8B52FF",
    features: [
      "16 صورة / 6 ساعات",
      "5 فيديوهات / 24 ساعة",
      "دردشة AI بقوة 80%",
      "دعم بتذاكر + رد 24 ساعة",
    ],
    badge: null,
  },
  {
    key: "premium",
    name: "بريميوم",
    price: "199",
    color: "#D42EA0",
    features: [
      "صور غير محدودة ♾️",
      "13 فيديو / 24 ساعة",
      "دردشة AI بقوة 100%",
      "دعم واتساب مباشر — رد 5 دقايق",
    ],
    badge: "الأكثر مبيعاً",
  },
] as const;

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
    header: { marginBottom: 28 },
    back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
    backText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    title: { fontSize: 26, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular" },
    card: {
      borderRadius: 20, borderWidth: 2, padding: 22, marginBottom: 16,
    },
    cardCurrent: { borderWidth: 3 },
    badge: {
      alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4,
      borderRadius: 20, marginBottom: 14,
    },
    badgeText: { fontSize: 12, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
    planName: { fontSize: 22, fontWeight: "700", fontFamily: "Inter_700Bold" },
    priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: 6, marginBottom: 18 },
    price: { fontSize: 36, fontWeight: "700", fontFamily: "Inter_700Bold" },
    currency: { fontSize: 16, color: colors.mutedForeground, marginBottom: 8, fontFamily: "Inter_400Regular" },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
    featureText: { fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular", flex: 1 },
    btn: {
      marginTop: 18, paddingVertical: 14, borderRadius: 14,
      alignItems: "center",
    },
    btnText: { fontSize: 15, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
    currentBadge: {
      flexDirection: "row", alignItems: "center", gap: 6,
      marginTop: 18, justifyContent: "center",
    },
    currentText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
    note: {
      backgroundColor: colors.card, borderRadius: 14, padding: 16, marginTop: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    noteText: { color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
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
                <View style={[s.currentBadge, { borderRadius: 12, backgroundColor: plan.color + "20", padding: 10 }]}>
                  <Feather name="check" size={16} color={plan.color} />
                  <Text style={[s.currentText, { color: plan.color }]}>باقتك الحالية</Text>
                </View>
              ) : (
                <Pressable
                  style={[s.btn, { backgroundColor: plan.color }]}
                  onPress={() => {/* Payment integration goes here */}}
                >
                  <Text style={s.btnText}>
                    {plan.key === "free" ? "الباقة المجانية" : `اشترك في ${plan.name} — ${plan.price} جنيه`}
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}

        <View style={s.note}>
          <Text style={s.noteText}>
            💳 الدفع يتم مباشرة عبر المطوّر. للاشتراك تواصل عبر واتساب: 01155645393
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

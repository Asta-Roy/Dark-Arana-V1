import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Linking, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

const BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

// ─── FAQ for Free Plan ───────────────────────────────────────────────────────
const FREE_FAQS = [
  { q: "عايز صور أكتر؟", a: "اشترك في باقة برو للحصول على 16 صورة كل 6 ساعات." },
  { q: "الفيديو مش شغال ليه؟", a: "الفيديو متاح في باقة برو وبريميوم فقط." },
  { q: "إزاي أرقّي باقتي؟", a: "ادخل على شاشة الباقات واختر برو أو بريميوم." },
  { q: "هل بياناتي محفوظة؟", a: "نعم، كل المحادثات والصور مخزّنة بشكل آمن." },
  { q: "قوة AI ليه 40% بس؟", a: "الباقة المجانية تعطيك وصول جزئي. ارقّي للحصول على قوة كاملة." },
];

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  adminReply: string;
  createdAt: string;
}

export default function SupportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();

  // Ticket form state (Pro plan)
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Load tickets for Pro users
  useEffect(() => {
    if (user?.plan === "pro" || user?.plan === "premium") loadTickets();
  }, [user]);

  async function loadTickets() {
    setLoadingTickets(true);
    try {
      const r = await fetch(`${BASE}/api/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setTickets(await r.json());
    } finally {
      setLoadingTickets(false);
    }
  }

  async function submitTicket() {
    if (!ticketTitle.trim() || !ticketDesc.trim()) {
      Alert.alert("خطأ", "يرجى تعبئة العنوان والوصف");
      return;
    }
    setSubmitting(true);
    try {
      const r = await fetch(`${BASE}/api/tickets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: ticketTitle.trim(), description: ticketDesc.trim() }),
      });
      if (r.ok) {
        Alert.alert("✅ تم الإرسال", "تم إرسال التذكرة. الرد خلال 24 ساعة");
        setTicketTitle("");
        setTicketDesc("");
        loadTickets();
      } else {
        const d = await r.json();
        Alert.alert("خطأ", d.error || "فشل الإرسال");
      }
    } finally {
      setSubmitting(false);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 90 },
    title: { fontSize: 26, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 4 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 16 },
    card: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginBottom: 12, overflow: "hidden" },
    faqQ: { padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    faqQText: { fontSize: 15, color: colors.foreground, fontFamily: "Inter_500Medium", flex: 1 },
    faqA: { paddingHorizontal: 16, paddingBottom: 16 },
    faqAText: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 22 },
    upgradeBtn: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14,
      alignItems: "center", marginTop: 8,
    },
    upgradeBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    label: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 6 },
    input: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
      fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular", marginBottom: 14,
    },
    textarea: { minHeight: 100, textAlignVertical: "top" },
    submitBtn: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 14,
      alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
    },
    submitBtnText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    ticketCard: {
      backgroundColor: colors.card, borderRadius: 14, borderWidth: 1,
      borderColor: colors.border, padding: 16, marginBottom: 10,
    },
    ticketTitle: { fontSize: 15, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    ticketStatus: { fontSize: 12, marginTop: 4, fontFamily: "Inter_400Regular" },
    ticketReply: {
      marginTop: 10, backgroundColor: colors.primary + "18", borderRadius: 10,
      padding: 12, borderLeftWidth: 3, borderLeftColor: colors.primary,
    },
    ticketReplyText: { fontSize: 13, color: colors.foreground, fontFamily: "Inter_400Regular" },
    waBtn: {
      backgroundColor: "#25D366", borderRadius: 16, paddingVertical: 18,
      alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 12, marginBottom: 16,
    },
    waBtnText: { color: "#fff", fontSize: 17, fontWeight: "700", fontFamily: "Inter_700Bold" },
    responseTime: {
      backgroundColor: colors.card, borderRadius: 14, padding: 16, borderWidth: 1,
      borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 24,
    },
    responseTimeText: { fontSize: 15, color: colors.foreground, fontFamily: "Inter_500Medium" },
  });

  if (!user) return null;

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>الدعم والمساعدة</Text>
        <Text style={s.subtitle}>باقتك الحالية: {user.plan === "free" ? "المجانية" : user.plan === "pro" ? "برو" : "بريميوم"}</Text>

        {/* ── دعم المجاني Free ── */}
        {user.plan === "free" && (
          <>
            <Text style={s.sectionTitle}>📋 الدعم للمجاني — أسئلة شائعة</Text>
            {FREE_FAQS.map((faq, i) => (
              <View key={i} style={s.card}>
                <Pressable style={s.faqQ} onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}>
                  <Text style={s.faqQText}>س: {faq.q}</Text>
                  <Feather name={expandedFaq === i ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
                </Pressable>
                {expandedFaq === i && (
                  <View style={s.faqA}>
                    <Text style={s.faqAText}>ج: {faq.a}</Text>
                  </View>
                )}
              </View>
            ))}
            <Pressable style={s.upgradeBtn} onPress={() => router.push("/subscription")}>
              <Text style={s.upgradeBtnText}>⬆️ ترقية الحساب</Text>
            </Pressable>
          </>
        )}

        {/* ── دعم البرو Pro ── */}
        {user.plan === "pro" && (
          <>
            <Text style={s.sectionTitle}>🎫 دعم البرو — تذاكر الدعم</Text>
            <Text style={s.label}>عنوان المشكلة</Text>
            <TextInput
              style={s.input} placeholder="مثال: الصور لا تُولَّد" placeholderTextColor={colors.mutedForeground}
              value={ticketTitle} onChangeText={setTicketTitle}
            />
            <Text style={s.label}>وصف المشكلة</Text>
            <TextInput
              style={[s.input, s.textarea]} placeholder="اشرح المشكلة بالتفصيل..." placeholderTextColor={colors.mutedForeground}
              value={ticketDesc} onChangeText={setTicketDesc} multiline
            />
            <Pressable style={[s.submitBtn, { opacity: submitting ? 0.7 : 1 }]} onPress={submitTicket} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Feather name="send" size={18} color="#fff" />}
              <Text style={s.submitBtnText}>إرسال التذكرة</Text>
            </Pressable>

            <View style={{ height: 24 }} />
            <Text style={[s.sectionTitle, { marginBottom: 12 }]}>📬 تذاكري السابقة</Text>
            {loadingTickets ? (
              <ActivityIndicator color={colors.primary} />
            ) : tickets.length === 0 ? (
              <Text style={{ color: colors.mutedForeground, textAlign: "center", fontFamily: "Inter_400Regular" }}>لا توجد تذاكر سابقة</Text>
            ) : (
              tickets.map((t) => (
                <View key={t.id} style={s.ticketCard}>
                  <Text style={s.ticketTitle}>{t.title}</Text>
                  <Text style={[s.ticketStatus, { color: t.status === "replied" ? "#22c55e" : colors.primary }]}>
                    {t.status === "open" ? "⏳ قيد المراجعة" : "✅ تم الرد"}
                  </Text>
                  {t.adminReply ? (
                    <View style={s.ticketReply}>
                      <Text style={s.ticketReplyText}>💬 {t.adminReply}</Text>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </>
        )}

        {/* ── دعم البريميوم Premium ── */}
        {user.plan === "premium" && (
          <>
            <Text style={s.sectionTitle}>💎 دعم البريميوم — تواصل مباشر</Text>
            <View style={s.responseTime}>
              <Feather name="clock" size={22} color="#22c55e" />
              <Text style={s.responseTimeText}>متوسط الرد: 5 دقايق فقط ⚡</Text>
            </View>
            <Pressable style={s.waBtn} onPress={() => Linking.openURL("https://wa.me/201155645393")}>
              <Feather name="message-circle" size={24} color="#fff" />
              <Text style={s.waBtnText}>واتساب المطور</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

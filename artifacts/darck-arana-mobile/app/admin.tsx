import React, { useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Pressable, ScrollView,
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

interface Ticket {
  id: number;
  username: string;
  title: string;
  description: string;
  status: string;
  adminReply: string;
  createdAt: string;
}

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, token } = useAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  // Guard: only ROY can access
  if (!user || user.username !== "ROY") {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Feather name="lock" size={48} color={colors.mutedForeground} />
        <Text style={{ color: colors.mutedForeground, marginTop: 16, fontFamily: "Inter_400Regular", fontSize: 16 }}>
          غير مصرّح لك بالدخول
        </Text>
      </View>
    );
  }

  useEffect(() => { loadTickets(); }, []);

  async function loadTickets() {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/admin/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (r.ok) setTickets(await r.json());
    } finally {
      setLoading(false);
    }
  }

  async function sendReply() {
    if (!selectedTicket || !replyText.trim()) return;
    setSending(true);
    try {
      const r = await fetch(`${BASE}/api/admin/tickets/${selectedTicket.id}/reply`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ adminReply: replyText.trim() }),
      });
      if (r.ok) {
        Alert.alert("✅ تم الإرسال", "تم إرسال الرد وتحديث التذكرة");
        setSelectedTicket(null);
        setReplyText("");
        loadTickets();
      } else {
        Alert.alert("خطأ", "فشل إرسال الرد");
      }
    } finally {
      setSending(false);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
    back: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
    backText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 24 },
    title: { fontSize: 24, fontWeight: "700", color: "#f59e0b", fontFamily: "Inter_700Bold" },
    badge: {
      backgroundColor: "#f59e0b22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
    },
    badgeText: { color: "#f59e0b", fontSize: 12, fontFamily: "Inter_600SemiBold" },
    ticketCard: {
      backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.border,
      padding: 16, marginBottom: 12,
    },
    ticketTitle: { fontSize: 16, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    ticketUser: { fontSize: 13, color: colors.primary, fontFamily: "Inter_500Medium", marginTop: 3 },
    ticketDesc: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8, lineHeight: 20 },
    ticketDate: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 8 },
    replyBtn: {
      flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12,
      backgroundColor: "#f59e0b22", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8,
      alignSelf: "flex-start",
    },
    replyBtnText: { color: "#f59e0b", fontSize: 14, fontFamily: "Inter_600SemiBold" },
    modal: {
      backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border,
      padding: 20, marginBottom: 16,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 4 },
    modalSubtitle: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 16 },
    replyInput: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, padding: 14, fontSize: 15, color: colors.foreground,
      fontFamily: "Inter_400Regular", minHeight: 100, textAlignVertical: "top", marginBottom: 14,
    },
    sendBtn: {
      backgroundColor: "#f59e0b", borderRadius: 12, paddingVertical: 14,
      alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8,
    },
    sendBtnText: { color: "#000", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    cancelBtn: { marginTop: 10, alignItems: "center" },
    cancelText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    empty: { alignItems: "center", paddingVertical: 60 },
    emptyText: { color: colors.mutedForeground, fontSize: 16, fontFamily: "Inter_400Regular", marginTop: 12 },
  });

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Pressable style={s.back} onPress={() => router.back()}>
          <Feather name="arrow-right" size={18} color={colors.mutedForeground} />
          <Text style={s.backText}>رجوع</Text>
        </Pressable>

        <View style={s.header}>
          <Feather name="shield" size={28} color="#f59e0b" />
          <Text style={s.title}>لوحة الادمن</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>{tickets.length} تذكرة مفتوحة</Text>
          </View>
        </View>

        {/* Reply form when ticket is selected */}
        {selectedTicket && (
          <View style={s.modal}>
            <Text style={s.modalTitle}>الرد على: {selectedTicket.title}</Text>
            <Text style={s.modalSubtitle}>من: @{selectedTicket.username}</Text>
            <TextInput
              style={s.replyInput}
              placeholder="اكتب ردك هنا..."
              placeholderTextColor={colors.mutedForeground}
              value={replyText}
              onChangeText={setReplyText}
              multiline
            />
            <Pressable style={[s.sendBtn, { opacity: sending ? 0.7 : 1 }]} onPress={sendReply} disabled={sending}>
              {sending ? <ActivityIndicator color="#000" size="small" /> : <Feather name="send" size={18} color="#000" />}
              <Text style={s.sendBtnText}>إرسال الرد</Text>
            </Pressable>
            <Pressable style={s.cancelBtn} onPress={() => { setSelectedTicket(null); setReplyText(""); }}>
              <Text style={s.cancelText}>إلغاء</Text>
            </Pressable>
          </View>
        )}

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : tickets.length === 0 ? (
          <View style={s.empty}>
            <Feather name="check-circle" size={48} color="#22c55e" />
            <Text style={s.emptyText}>لا توجد تذاكر مفتوحة 🎉</Text>
          </View>
        ) : (
          tickets.map((t) => (
            <View key={t.id} style={s.ticketCard}>
              <Text style={s.ticketTitle}>{t.title}</Text>
              <Text style={s.ticketUser}>@{t.username}</Text>
              <Text style={s.ticketDesc}>{t.description}</Text>
              <Text style={s.ticketDate}>{new Date(t.createdAt).toLocaleString("ar-EG")}</Text>
              <Pressable style={s.replyBtn} onPress={() => { setSelectedTicket(t); setReplyText(""); }}>
                <Feather name="message-square" size={14} color="#f59e0b" />
                <Text style={s.replyBtnText}>رد</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

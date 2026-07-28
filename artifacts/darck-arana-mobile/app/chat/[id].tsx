import { useGetOpenaiConversation } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { fetch } from "expo/fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/contexts/AuthContext";

// ─── الـ base URL للـ API ────────────────────────────────────────────────────
const BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  // نوع الرسالة: نص أو صورة أو فيديو
  type?: "text" | "image" | "video";
  mediaUrl?: string;
}

let messageCounter = 0;
function genId(): string {
  messageCounter++;
  return `m-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 6)}`;
}

// ─── دالة checkLimit — تتحقق من باقة المستخدم وتطلع رسالة ──────────────────
// هنا نعتمد على استجابة السيرفر بـ 429 limit_reached

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const convId = Number(id);
  const { token } = useAuth();

  const { data: conv } = useGetOpenaiConversation(convId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [limitModal, setLimitModal] = useState<{ msg: string } | null>(null);
  const [pendingImage, setPendingImage] = useState<{ uri: string; base64: string; mimeType: string } | null>(null);
  const inputRef = useRef<TextInput>(null);
  const initializedRef = useRef(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (conv?.messages && !initializedRef.current) {
      initializedRef.current = true;
      setMessages(
        conv.messages.map((m) => ({
          id: genId(),
          role: m.role as "user" | "assistant",
          content: m.content,
          ...parseMediaContent(m.content),
        }))
      );
    }
  }, [conv?.messages]);

  // تحليل محتوى الرسالة — صورة أو فيديو أو نص
  function parseMediaContent(content: string): { type: "text" | "image" | "video"; mediaUrl?: string } {
    if (content.startsWith("[IMAGE:") && content.endsWith("]")) {
      return { type: "image", mediaUrl: content.slice(7, -1) };
    }
    if (content.startsWith("[VIDEO:") && content.endsWith("]")) {
      return { type: "video", mediaUrl: content.slice(7, -1) };
    }
    return { type: "text" };
  }

  // ─── فتح منتقي الصور 📎 ─────────────────────────────────────────────────
  async function handleAttach() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      if (Platform.OS !== "web") Alert.alert("الإذن مطلوب", "يرجى السماح بالوصول للصور");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
      allowsEditing: false,
    });

    if (result.canceled || !result.assets.length) return;

    const asset = result.assets[0];
    if (!asset.base64) return;

    const mimeType = asset.mimeType || "image/jpeg";
    setPendingImage({ uri: asset.uri, base64: asset.base64, mimeType });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  // ─── إرسال الرسالة ───────────────────────────────────────────────────────
  async function handleSend() {
    const text = input.trim();
    if (!text && !pendingImage || isStreaming) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");

    // نضيف رسالة المستخدم في الشات
    const userMsg: Message = pendingImage
      ? { id: genId(), role: "user", content: text || "📷", type: "image", mediaUrl: pendingImage.uri }
      : { id: genId(), role: "user", content: text, type: "text" };
    setMessages((prev) => [...prev, userMsg]);

    const img = pendingImage;
    setPendingImage(null);
    setIsStreaming(true);
    setShowTyping(true);
    inputRef.current?.focus();

    try {
      const sessionId = (await AsyncStorage.getItem("darck-arana-session-id")) || "default";
      const body: any = { content: text || " " };
      if (img) {
        body.imageBase64 = img.base64;
        body.imageMimeType = img.mimeType;
      }
      const res = await fetch(`${BASE}/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "X-Session-ID": sessionId,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      // فحص ليمت الباقة
      if (res.status === 429) {
        const data = await res.json() as { message?: string };
        setLimitModal({ msg: data.message ?? "وصلت للحد الأقصى — اشترك للمتابعة" });
        setShowTyping(false);
        setIsStreaming(false);
        return;
      }

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No body");

      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          try {
            const parsed = JSON.parse(raw) as { content?: string; done?: boolean };
            if (parsed.content) {
              fullContent += parsed.content;
              if (!assistantAdded) {
                setShowTyping(false);
                setMessages((prev) => [
                  ...prev,
                  { id: genId(), role: "assistant", content: fullContent, type: "text" },
                ]);
                assistantAdded = true;
              } else {
                setMessages((prev) => {
                  const updated = [...prev];
                  updated[updated.length - 1] = {
                    ...updated[updated.length - 1],
                    content: fullContent,
                  };
                  return updated;
                });
              }
            }
          } catch {}
        }
      }
    } catch {
      setShowTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: genId(), role: "assistant", content: "حدث خطأ، حاول مرة أخرى.", type: "text" },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }
  }

  const reversed = [...messages].reverse();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: "row", alignItems: "center",
      paddingTop: topPad + 8, paddingHorizontal: 16,
      paddingBottom: 12, borderBottomWidth: 1,
      borderBottomColor: colors.border, backgroundColor: colors.card, gap: 12,
    },
    backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
    headerTitle: { flex: 1, fontSize: 17, fontWeight: "600" as const, color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#22c55e" },
    bubble: {
      maxWidth: "80%", borderRadius: colors.radius,
      paddingHorizontal: 14, paddingVertical: 10,
      marginHorizontal: 16, marginVertical: 4,
    },
    userBubble: { backgroundColor: colors.primary, alignSelf: "flex-end" },
    aiBubble: { backgroundColor: colors.card, alignSelf: "flex-start", borderWidth: 1, borderColor: colors.border },
    bubbleText: { fontSize: 15, lineHeight: 22, fontFamily: "Inter_400Regular" },
    userText: { color: "#fff" },
    aiText: { color: colors.foreground },
    // ─── صور/فيديو في البالون ─────────────────────────────────────────────
    mediaImage: { width: 220, height: 220, borderRadius: 12 },
    videoPlaceholder: {
      width: 220, height: 140, borderRadius: 12, backgroundColor: "#1a1a2e",
      alignItems: "center", justifyContent: "center", gap: 8,
    },
    videoText: { color: "#fff", fontSize: 13, fontFamily: "Inter_400Regular" },
    typingContainer: { paddingHorizontal: 16, paddingVertical: 8, alignSelf: "flex-start" },
    typingRow: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row",
      gap: 5, alignItems: "center", borderWidth: 1, borderColor: colors.border,
    },
    dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.mutedForeground },
    emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
    emptyText: { color: colors.mutedForeground, fontSize: 15, textAlign: "center", fontFamily: "Inter_400Regular", marginTop: 12 },
    inputRow: {
      flexDirection: "row", alignItems: "flex-end",
      paddingHorizontal: 12, paddingTop: 10,
      paddingBottom: bottomPad + 10, borderTopWidth: 1,
      borderTopColor: colors.border, backgroundColor: colors.card, gap: 8,
    },
    // ─── زرار 📎 ──────────────────────────────────────────────────────────
    attachBtn: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: colors.muted, alignItems: "center", justifyContent: "center",
    },
    textInput: {
      flex: 1, backgroundColor: colors.muted, borderRadius: 20,
      paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10,
      fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular", maxHeight: 120,
    },
    sendBtn: {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
    },
    sendBtnDisabled: { backgroundColor: colors.muted },
    // ─── preview الصورة قبل الإرسال ───────────────────────────────────────
    pendingRow: {
      flexDirection: "row", alignItems: "center", gap: 8,
      paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4,
      backgroundColor: colors.card,
    },
    pendingThumb: { width: 52, height: 52, borderRadius: 10 },
    pendingLabel: { flex: 1, fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    pendingRemove: { padding: 4 },
    // ─── Modal ليمت الباقة ─────────────────────────────────────────────────
    modalOverlay: {
      flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
      justifyContent: "center", alignItems: "center", padding: 24,
    },
    modalCard: {
      backgroundColor: colors.card, borderRadius: 20,
      padding: 24, width: "100%", alignItems: "center",
      borderWidth: 1, borderColor: colors.border,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginTop: 12 },
    modalMsg: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, lineHeight: 22 },
    modalUpgradeBtn: {
      backgroundColor: colors.primary, borderRadius: 14,
      paddingVertical: 14, paddingHorizontal: 32, marginTop: 20,
    },
    modalUpgradeText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    modalCloseBtn: { marginTop: 12 },
    modalCloseText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
  });

  // ─── عرض فقاعة الرسالة ───────────────────────────────────────────────────
  function renderBubble(item: Message) {
    const isUser = item.role === "user";
    const bubbleStyle = [styles.bubble, isUser ? styles.userBubble : styles.aiBubble];

    // رسالة صورة
    if (item.type === "image" && item.mediaUrl) {
      return (
        <View style={[bubbleStyle, { padding: 6 }]}>
          <Image source={{ uri: item.mediaUrl }} style={styles.mediaImage} resizeMode="cover" />
        </View>
      );
    }

    // رسالة فيديو — نعرض مكان الفيديو (الـ preview لا يعمل في web بسهولة)
    if (item.type === "video" && item.mediaUrl) {
      return (
        <View style={[bubbleStyle, { padding: 6 }]}>
          <View style={styles.videoPlaceholder}>
            <Feather name="video" size={32} color={colors.primary} />
            <Text style={styles.videoText}>فيديو مرفوع ✓</Text>
          </View>
        </View>
      );
    }

    // رسالة نصية عادية
    return (
      <View style={bubbleStyle}>
        <Text style={[styles.bubbleText, isUser ? styles.userText : styles.aiText]}>
          {item.content}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding" keyboardVerticalOffset={0}>
      {/* ─── Header ─── */}
      <View style={styles.header}>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          onPress={() => router.back()}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {conv?.title ?? "Chat"}
        </Text>
        <View style={styles.statusDot} />
      </View>

      {/* ─── قائمة الرسائل ─── */}
      <FlatList
        data={reversed}
        keyExtractor={(item) => item.id}
        inverted={messages.length > 0}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        ListHeaderComponent={
          showTyping ? (
            <View style={styles.typingContainer}>
              <View style={styles.typingRow}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={40} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>اسألني أي حاجة! أنا هنا أساعدك.</Text>
          </View>
        }
        renderItem={({ item }) => renderBubble(item)}
      />

      {/* ─── preview صورة قبل الإرسال ─── */}
      {pendingImage && (
        <View style={styles.pendingRow}>
          <Image source={{ uri: pendingImage.uri }} style={styles.pendingThumb} resizeMode="cover" />
          <Text style={styles.pendingLabel}>صورة جاهزة للإرسال — اكتب سؤالك أو ابعت مباشرة</Text>
          <Pressable style={styles.pendingRemove} onPress={() => setPendingImage(null)}>
            <Feather name="x" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>
      )}

      {/* ─── شريط الإدخال + زرار 📎 ─── */}
      <View style={styles.inputRow}>
        {/* زرار رفع الصور 📎 */}
        <Pressable
          style={[styles.attachBtn, { opacity: isStreaming ? 0.5 : 1, backgroundColor: pendingImage ? colors.primary + "33" : colors.muted }]}
          onPress={handleAttach}
          disabled={isStreaming}
        >
          <Feather name="image" size={20} color={pendingImage ? colors.primary : colors.mutedForeground} />
        </Pressable>

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder={pendingImage ? "اكتب سؤالك عن الصورة..." : "اكتب رسالتك..."}
          placeholderTextColor={colors.mutedForeground}
          value={input}
          onChangeText={setInput}
          multiline
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />

        <Pressable
          style={({ pressed }) => [
            styles.sendBtn,
            (!input.trim() && !pendingImage || isStreaming) && styles.sendBtnDisabled,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => { handleSend(); inputRef.current?.focus(); }}
          disabled={(!input.trim() && !pendingImage) || isStreaming}
        >
          {isStreaming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather name="send" size={18} color={(!input.trim() && !pendingImage) ? colors.mutedForeground : "#fff"} />
          )}
        </Pressable>
      </View>

      {/* ─── Modal ليمت الباقة ─── */}
      <Modal visible={!!limitModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Feather name="lock" size={40} color={colors.primary} />
            <Text style={styles.modalTitle}>وصلت للحد الأقصى</Text>
            <Text style={styles.modalMsg}>{limitModal?.msg}</Text>
            <Pressable
              style={styles.modalUpgradeBtn}
              onPress={() => { setLimitModal(null); router.push("/subscription"); }}
            >
              <Text style={styles.modalUpgradeText}>⬆️ ترقية الباقة</Text>
            </Pressable>
            <Pressable style={styles.modalCloseBtn} onPress={() => setLimitModal(null)}>
              <Text style={styles.modalCloseText}>إغلاق</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

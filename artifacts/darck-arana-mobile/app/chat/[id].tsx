import { useGetOpenaiConversation } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let messageCounter = 0;
function genId(): string {
  messageCounter++;
  return `m-${Date.now()}-${messageCounter}-${Math.random().toString(36).substr(2, 6)}`;
}

export default function ChatScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const convId = Number(id);

  const { data: conv } = useGetOpenaiConversation(convId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
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
        }))
      );
    }
  }, [conv?.messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isStreaming) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput("");
    setMessages((prev) => [...prev, { id: genId(), role: "user", content: text }]);
    setIsStreaming(true);
    setShowTyping(true);
    inputRef.current?.focus();

    try {
      const base = process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : "";

      const sessionId = (await AsyncStorage.getItem("darck-arana-session-id")) || "default";
      const res = await fetch(`${base}/api/openai/conversations/${convId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          "X-Session-ID": sessionId,
        },
        body: JSON.stringify({ content: text }),
      });

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
                  { id: genId(), role: "assistant", content: fullContent },
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
        { id: genId(), role: "assistant", content: "Sorry, an error occurred. Please try again." },
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
      flexDirection: "row",
      alignItems: "center",
      paddingTop: topPad + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
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
      flex: 1,
      fontSize: 17,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#22c55e",
    },
    bubble: {
      maxWidth: "80%",
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginHorizontal: 16,
      marginVertical: 4,
    },
    userBubble: {
      backgroundColor: colors.primary,
      alignSelf: "flex-end",
    },
    aiBubble: {
      backgroundColor: colors.card,
      alignSelf: "flex-start",
      borderWidth: 1,
      borderColor: colors.border,
    },
    bubbleText: {
      fontSize: 15,
      lineHeight: 22,
      fontFamily: "Inter_400Regular",
    },
    userText: { color: "#fff" },
    aiText: { color: colors.foreground },
    typingContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      alignSelf: "flex-start",
    },
    typingRow: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 10,
      flexDirection: "row",
      gap: 5,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.mutedForeground,
    },
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 40,
    },
    emptyText: {
      color: colors.mutedForeground,
      fontSize: 15,
      textAlign: "center",
      fontFamily: "Inter_400Regular",
      marginTop: 12,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: bottomPad + 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.card,
      gap: 10,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.muted,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 10,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
      maxHeight: 120,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      backgroundColor: colors.muted,
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
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
            <Text style={styles.emptyText}>
              Ask me anything! I'm here to help.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.bubble,
              item.role === "user" ? styles.userBubble : styles.aiBubble,
            ]}
          >
            <Text
              style={[
                styles.bubbleText,
                item.role === "user" ? styles.userText : styles.aiText,
              ]}
            >
              {item.content}
            </Text>
          </View>
        )}
      />

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Message Darck Arana..."
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
            (!input.trim() || isStreaming) && styles.sendBtnDisabled,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={() => {
            handleSend();
            inputRef.current?.focus();
          }}
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Feather
              name="send"
              size={18}
              color={!input.trim() ? colors.mutedForeground : "#fff"}
            />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

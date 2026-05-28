import { useCreateOpenaiConversation, useListOpenaiConversations } from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function ChatTab() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: conversations, isLoading, refetch } = useListOpenaiConversations();
  const createConversation = useCreateOpenaiConversation();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : 0;

  async function handleNewChat() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const title = `Chat ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
    const conv = await createConversation.mutateAsync({ title });
    router.push(`/chat/${conv.id}`);
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    greeting: {
      fontSize: 28,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      color: colors.mutedForeground,
      marginTop: 4,
      fontFamily: "Inter_400Regular",
    },
    newChatBtn: {
      marginHorizontal: 20,
      marginBottom: 24,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    newChatText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: "600" as const,
      color: colors.mutedForeground,
      paddingHorizontal: 20,
      marginBottom: 12,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontFamily: "Inter_600SemiBold",
    },
    card: {
      marginHorizontal: 20,
      marginBottom: 10,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: "600" as const,
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    cardDate: {
      fontSize: 13,
      color: colors.mutedForeground,
      marginTop: 2,
      fontFamily: "Inter_400Regular",
    },
    emptyContainer: {
      alignItems: "center",
      paddingTop: 40,
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      textAlign: "center",
      fontFamily: "Inter_400Regular",
      marginTop: 12,
    },
    loader: {
      paddingTop: 40,
    },
    bottomSpacer: {
      height: bottomPad + 80,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Darck Arana</Text>
        <Text style={styles.subtitle}>Your AI assistant</Text>
      </View>

      <Pressable
        style={({ pressed }) => [styles.newChatBtn, { opacity: pressed ? 0.85 : 1 }]}
        onPress={handleNewChat}
        disabled={createConversation.isPending}
      >
        {createConversation.isPending ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Feather name="plus" size={20} color="#fff" />
            <Text style={styles.newChatText}>New Chat</Text>
          </>
        )}
      </Pressable>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : (
        <FlatList
          data={conversations ?? []}
          keyExtractor={(item) => String(item.id)}
          refreshing={isLoading}
          onRefresh={refetch}
          scrollEnabled={!!(conversations && conversations.length > 0)}
          ListHeaderComponent={
            conversations && conversations.length > 0 ? (
              <Text style={styles.sectionTitle}>Recent</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="message-circle" size={40} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>No conversations yet. Start a new chat!</Text>
            </View>
          }
          ListFooterComponent={<View style={styles.bottomSpacer} />}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/chat/${item.id}`);
              }}
            >
              <View style={styles.iconCircle}>
                <Feather name="message-circle" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Text style={styles.cardDate}>
                  {new Date(item.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

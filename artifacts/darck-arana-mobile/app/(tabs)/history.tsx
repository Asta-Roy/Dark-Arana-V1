import {
  useDeleteOpenaiConversation,
  useGetOpenaiStats,
  useListOpenaiConversations,
} from "@workspace/api-client-react";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function HistoryTab() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: conversations, isLoading, refetch } = useListOpenaiConversations();
  const { data: stats } = useGetOpenaiStats();
  const deleteConv = useDeleteOpenaiConversation();

  function handleAbout() {
    Haptics.selectionAsync();
    router.push("/about");
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  function handleDelete(id: number) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert("Delete Chat", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteConv.mutateAsync({ id }).then(() => refetch()),
      },
    ]);
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 16,
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
    },
    title: {
      fontSize: 28,
      fontWeight: "700" as const,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: -0.5,
    },
    aboutBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
      paddingHorizontal: 20,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    statValue: {
      fontSize: 24,
      fontWeight: "700" as const,
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      marginTop: 2,
      fontFamily: "Inter_400Regular",
      textTransform: "uppercase",
      letterSpacing: 0.6,
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
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
    },
    deleteBtn: {
      padding: 6,
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
    bottomSpacer: { height: Platform.OS === "web" ? 114 : 80 },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Pressable
          style={({ pressed }) => [styles.aboutBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={handleAbout}
        >
          <Feather name="info" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalConversations ?? 0}</Text>
          <Text style={styles.statLabel}>Chats</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats?.totalMessages ?? 0}</Text>
          <Text style={styles.statLabel}>Messages</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.secondary }]}>
            {stats?.totalImagesGenerated ?? 0}
          </Text>
          <Text style={styles.statLabel}>Images</Text>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ paddingTop: 20 }} />
      ) : (
        <FlatList
          data={conversations ?? []}
          keyExtractor={(item) => String(item.id)}
          refreshing={isLoading}
          onRefresh={refetch}
          scrollEnabled={!!(conversations && conversations.length > 0)}
          ListHeaderComponent={
            conversations && conversations.length > 0 ? (
              <Text style={styles.sectionTitle}>All Conversations</Text>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Feather name="clock" size={40} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>No chat history yet.</Text>
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
              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
                hitSlop={8}
              >
                <Feather name="trash-2" size={18} color={colors.destructive} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

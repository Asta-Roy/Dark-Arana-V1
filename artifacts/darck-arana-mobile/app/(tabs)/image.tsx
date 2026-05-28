import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { fetch } from "expo/fetch";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

import { useColors } from "@/hooks/useColors";

export default function ImageTab() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [prompt, setPrompt] = useState("");
  const [imageData, setImageData] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState("image/png");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  async function handleGenerate() {
    if (!prompt.trim() || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError(null);
    setImageData(null);

    try {
      const base = process.env.EXPO_PUBLIC_DOMAIN
        ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
        : "";
      const res = await fetch(`${base}/api/openai/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), size: "1024x1024" }),
      });
      if (!res.ok) throw new Error("Generation failed");
      const data = (await res.json()) as { b64_json: string; mimeType?: string };
      setImageData(data.b64_json);
      if (data.mimeType) setMimeType(data.mimeType);
    } catch {
      setError("Failed to generate image. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: topPad + 16,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    title: {
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
    inputContainer: {
      marginHorizontal: 20,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 14,
      marginBottom: 14,
    },
    input: {
      color: colors.foreground,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      minHeight: 80,
      textAlignVertical: "top",
    },
    generateBtn: {
      marginHorizontal: 20,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      marginBottom: 24,
    },
    generateText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "600" as const,
      fontFamily: "Inter_600SemiBold",
    },
    imageContainer: {
      marginHorizontal: 20,
      borderRadius: colors.radius,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.border,
      aspectRatio: 1,
      backgroundColor: colors.card,
    },
    generatedImage: { width: "100%", height: "100%" },
    placeholder: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
    },
    placeholderText: {
      color: colors.mutedForeground,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    errorText: {
      color: colors.destructive,
      fontSize: 14,
      textAlign: "center",
      marginHorizontal: 20,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    bottomSpacer: { height: bottomPad + 80 },
  });

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 0 }}
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Image Generator</Text>
        <Text style={styles.subtitle}>Describe what you want to create</Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="A futuristic city at night with neon lights..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          value={prompt}
          onChangeText={setPrompt}
          blurOnSubmit={false}
        />
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.generateBtn,
          { opacity: pressed || isLoading || !prompt.trim() ? 0.7 : 1 },
        ]}
        onPress={handleGenerate}
        disabled={isLoading || !prompt.trim()}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Feather name="zap" size={20} color="#fff" />
            <Text style={styles.generateText}>Generate</Text>
          </>
        )}
      </Pressable>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.imageContainer}>
        {imageData ? (
          <Image
            style={styles.generatedImage}
            source={{ uri: `data:${mimeType};base64,${imageData}` }}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            {isLoading ? (
              <>
                <ActivityIndicator color={colors.primary} size="large" />
                <Text style={styles.placeholderText}>Generating your image...</Text>
              </>
            ) : (
              <>
                <Feather name="image" size={40} color={colors.mutedForeground} />
                <Text style={styles.placeholderText}>Your image will appear here</Text>
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.bottomSpacer} />
    </KeyboardAwareScrollView>
  );
}

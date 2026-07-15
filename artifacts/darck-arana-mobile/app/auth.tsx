import React, { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (!email.trim() || !password.trim()) { setError("يرجى تعبئة جميع الحقول"); return; }
    if (mode === "register" && !username.trim()) { setError("اسم المستخدم مطلوب"); return; }
    setLoading(true);
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(username.trim(), email.trim(), password);
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: insets.top + 32 },
    logo: { alignItems: "center", marginBottom: 40 },
    logoText: { fontSize: 32, fontWeight: "700", color: colors.primary, fontFamily: "Inter_700Bold" },
    tagline: { fontSize: 14, color: colors.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular" },
    card: { backgroundColor: colors.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border },
    title: { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 6 },
    subtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 24 },
    label: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 6 },
    input: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
      color: colors.foreground, fontFamily: "Inter_400Regular", marginBottom: 16,
    },
    passRow: { flexDirection: "row", alignItems: "center", position: "relative" },
    passInput: { flex: 1 },
    eyeBtn: { position: "absolute", right: 12, padding: 4 },
    error: { backgroundColor: "#3b0a0a", borderRadius: 10, padding: 12, marginBottom: 16 },
    errorText: { color: "#f87171", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    btn: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15,
      alignItems: "center", marginTop: 4,
    },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
    switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 20, gap: 6 },
    switchText: { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    switchLink: { color: colors.primary, fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    tabs: { flexDirection: "row", backgroundColor: colors.background, borderRadius: 12, padding: 4, marginBottom: 24 },
    tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
    tabActive: { backgroundColor: colors.card },
    tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    tabTextActive: { color: colors.foreground },
  });

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logo}>
          <Text style={s.logoText}>⬡ Dark Arana</Text>
          <Text style={s.tagline}>مساعدك الذكي — المطوّر: سعيد صلاح</Text>
        </View>

        <View style={s.card}>
          {/* Login / Register tabs */}
          <View style={s.tabs}>
            {(["login", "register"] as const).map((m) => (
              <Pressable key={m} style={[s.tab, mode === m && s.tabActive]} onPress={() => { setMode(m); setError(null); }}>
                <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                  {m === "login" ? "تسجيل الدخول" : "حساب جديد"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.title}>{mode === "login" ? "أهلاً بعودتك 👋" : "انضم لدارك أرانا"}</Text>
          <Text style={s.subtitle}>{mode === "login" ? "سجّل دخولك للمتابعة" : "أنشئ حسابك مجاناً"}</Text>

          {mode === "register" && (
            <>
              <Text style={s.label}>اسم المستخدم</Text>
              <TextInput
                style={s.input} placeholder="مثال: ahmed_99" placeholderTextColor={colors.mutedForeground}
                value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false}
              />
            </>
          )}

          <Text style={s.label}>البريد الإلكتروني</Text>
          <TextInput
            style={s.input} placeholder="example@email.com" placeholderTextColor={colors.mutedForeground}
            value={email} onChangeText={setEmail} keyboardType="email-address"
            autoCapitalize="none" autoCorrect={false}
          />

          <Text style={s.label}>كلمة المرور</Text>
          <View style={s.passRow}>
            <TextInput
              style={[s.input, s.passInput, { paddingRight: 44 }]}
              placeholder="••••••••" placeholderTextColor={colors.mutedForeground}
              value={password} onChangeText={setPassword}
              secureTextEntry={!showPass} autoCapitalize="none"
            />
            <Pressable style={s.eyeBtn} onPress={() => setShowPass(!showPass)}>
              <Feather name={showPass ? "eye-off" : "eye"} size={18} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {error && (
            <View style={s.error}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Pressable style={[s.btn, { opacity: loading ? 0.7 : 1 }]} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={s.btnText}>{mode === "login" ? "دخول" : "إنشاء الحساب"}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

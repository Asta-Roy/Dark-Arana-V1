import React, { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable,
  ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";

// قاعدة اسم المستخدم: حروف إنجليزية وأرقام فقط بدون مسافات أو رموز
const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

const BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : "";

// المراحل: بيانات → OTP (عند التسجيل فقط) → داخل
type Step = "form" | "otp";

export default function AuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [step, setStep] = useState<Step>("form");

  // حقول الفورم
  const [username, setUsername] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // حقل OTP
  const [otp, setOtp] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // ─── التحقق من الاسم على العميل قبل الإرسال ─────────────────────────────
  function validateUsername(name: string): string | null {
    if (!name.trim()) return "اسم المستخدم مطلوب";
    if (name.includes(" ")) return "مسموح حروف وأرقام فقط بدون مسافات";
    if (!USERNAME_REGEX.test(name)) return "مسموح حروف وأرقام فقط بدون مسافات";
    if (name.length < 3) return "الاسم لازم يكون 3 حروف على الأقل";
    return null;
  }

  // ─── إرسال OTP للإيميل ─────────────────────────────────────────────────────
  async function handleSendOTP() {
    setError(null);

    // تحقق من الاسم أولاً
    const usernameErr = validateUsername(username);
    if (usernameErr) { setError(usernameErr); return; }
    if (!email.trim()) { setError("البريد الإلكتروني مطلوب"); return; }
    if (!password.trim() || password.length < 6) { setError("كلمة المرور لازم تكون 6 أحرف على الأقل"); return; }

    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "فشل إرسال الكود");
      // انتقل لمرحلة OTP
      setStep("otp");
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  // ─── تأكيد OTP وإنشاء الحساب ────────────────────────────────────────────────
  async function handleVerifyOTP() {
    setError(null);
    if (!otp.trim() || otp.length !== 6) { setError("الكود لازم يكون 6 أرقام"); return; }

    setLoading(true);
    try {
      // أول خطوة: تحقق من الكود
      const verifyRes = await fetch(`${BASE}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: otp.trim() }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verifyData.error || "الكود غلط");

      // الكود صح → أنشئ الحساب
      await register(username.trim(), email.trim(), password);
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  // ─── تسجيل الدخول مباشرة (بدون OTP) ──────────────────────────────────────
  async function handleLogin() {
    setError(null);
    if (!email.trim() || !password.trim()) { setError("يرجى تعبئة جميع الحقول"); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e: any) {
      setError(e.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    container:    { flex: 1, backgroundColor: colors.background },
    scroll:       { flexGrow: 1, justifyContent: "center", padding: 24, paddingTop: insets.top + 32 },
    logo:         { alignItems: "center", marginBottom: 40 },
    logoText:     { fontSize: 32, fontWeight: "700", color: colors.primary, fontFamily: "Inter_700Bold" },
    tagline:      { fontSize: 14, color: colors.mutedForeground, marginTop: 6, fontFamily: "Inter_400Regular" },
    card:         { backgroundColor: colors.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: colors.border },
    title:        { fontSize: 22, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 6 },
    subtitle:     { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 24 },
    label:        { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 6 },
    input: {
      backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
      color: colors.foreground, fontFamily: "Inter_400Regular", marginBottom: 16,
    },
    passRow:      { flexDirection: "row", alignItems: "center", position: "relative" },
    passInput:    { flex: 1 },
    eyeBtn:       { position: "absolute", right: 12, padding: 4 },
    error:        { backgroundColor: "#3b0a0a", borderRadius: 10, padding: 12, marginBottom: 16 },
    errorText:    { color: "#f87171", fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
    btn: {
      backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 15,
      alignItems: "center", marginTop: 4,
    },
    btnText:      { color: "#fff", fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
    tabs:         { flexDirection: "row", backgroundColor: colors.background, borderRadius: 12, padding: 4, marginBottom: 24 },
    tab:          { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10 },
    tabActive:    { backgroundColor: colors.card },
    tabText:      { fontSize: 14, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground },
    tabTextActive:{ color: colors.foreground },
    otpHint:      { color: colors.mutedForeground, fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", marginBottom: 20, lineHeight: 20 },
    otpInput: {
      backgroundColor: colors.background, borderWidth: 2, borderColor: colors.primary,
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 16, fontSize: 28,
      color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 16,
      textAlign: "center", letterSpacing: 8,
    },
    backBtn:      { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 20 },
    backText:     { color: colors.mutedForeground, fontSize: 14, fontFamily: "Inter_400Regular" },
    usernameHint: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: -12, marginBottom: 12 },
  });

  // ─── شاشة إدخال OTP ─────────────────────────────────────────────────────────
  if (step === "otp") {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.logo}>
            <Text style={s.logoText}>⬡ Dark Arana</Text>
          </View>
          <View style={s.card}>
            {/* زرار الرجوع */}
            <Pressable style={s.backBtn} onPress={() => { setStep("form"); setOtp(""); setError(null); }}>
              <Feather name="arrow-right" size={16} color={colors.mutedForeground} />
              <Text style={s.backText}>رجوع</Text>
            </Pressable>

            <Text style={s.title}>تأكيد البريد الإلكتروني 📧</Text>
            <Text style={s.otpHint}>
              أرسلنا كود مكوّن من 6 أرقام على{"\n"}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{email}</Text>
              {"\n"}الكود صالح لمدة 5 دقائق فقط.
            </Text>

            <TextInput
              style={s.otpInput}
              placeholder="000000"
              placeholderTextColor={colors.border}
              value={otp}
              onChangeText={(t) => setOtp(t.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />

            {error && (
              <View style={s.error}>
                <Text style={s.errorText}>{error}</Text>
              </View>
            )}

            <Pressable style={[s.btn, { opacity: loading ? 0.7 : 1 }]} onPress={handleVerifyOTP} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>تأكيد وإنشاء الحساب</Text>}
            </Pressable>

            {/* إعادة إرسال الكود */}
            <Pressable
              style={{ alignItems: "center", marginTop: 16 }}
              onPress={() => { setOtp(""); setError(null); handleSendOTP(); }}
            >
              <Text style={{ color: colors.primary, fontSize: 14, fontFamily: "Inter_500Medium" }}>
                لم يصلك الكود؟ أعد الإرسال
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ─── شاشة الفورم الرئيسية ────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.logo}>
          <Text style={s.logoText}>⬡ Dark Arana</Text>
          <Text style={s.tagline}>مساعدك الذكي — المطوّر: سعيد صلاح</Text>
        </View>

        <View style={s.card}>
          {/* تابس دخول / تسجيل */}
          <View style={s.tabs}>
            {(["login", "register"] as const).map((m) => (
              <Pressable
                key={m}
                style={[s.tab, mode === m && s.tabActive]}
                onPress={() => { setMode(m); setError(null); setStep("form"); }}
              >
                <Text style={[s.tabText, mode === m && s.tabTextActive]}>
                  {m === "login" ? "تسجيل الدخول" : "حساب جديد"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={s.title}>{mode === "login" ? "أهلاً بعودتك 👋" : "انضم لدارك أرانا"}</Text>
          <Text style={s.subtitle}>{mode === "login" ? "سجّل دخولك للمتابعة" : "أنشئ حسابك مجاناً"}</Text>

          {/* حقل الاسم — عند التسجيل فقط */}
          {mode === "register" && (
            <>
              <Text style={s.label}>اسم المستخدم</Text>
              <TextInput
                style={s.input}
                placeholder="مثال: Ahmed99"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={(t) => {
                  // امنع المسافات والرموز فوراً أثناء الكتابة
                  setUsername(t.replace(/[^a-zA-Z0-9]/g, ""));
                }}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={s.usernameHint}>حروف إنجليزية وأرقام فقط — بدون مسافات أو رموز</Text>
            </>
          )}

          <Text style={s.label}>البريد الإلكتروني</Text>
          <TextInput
            style={s.input}
            placeholder="example@email.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={s.label}>كلمة المرور</Text>
          <View style={s.passRow}>
            <TextInput
              style={[s.input, s.passInput, { paddingRight: 44 }]}
              placeholder="••••••••"
              placeholderTextColor={colors.mutedForeground}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              autoCapitalize="none"
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

          <Pressable
            style={[s.btn, { opacity: loading ? 0.7 : 1 }]}
            onPress={mode === "login" ? handleLogin : handleSendOTP}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : (
              <Text style={s.btnText}>
                {mode === "login" ? "دخول" : "إرسال كود التحقق"}
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

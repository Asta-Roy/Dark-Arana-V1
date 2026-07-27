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

// ألوان الباقات
const PLAN_COLORS: Record<string, string> = {
  free:    "#6b7280",
  pro:     "#8B52FF",
  premium: "#D42EA0",
};

const PLAN_LABELS: Record<string, string> = {
  free:    "مجاني",
  pro:     "برو",
  premium: "بريميوم",
};

interface UserRow {
  id: number;
  username: string;
  email: string;
  plan: "free" | "pro" | "premium";
  isBanned: boolean;
  createdAt: string;
}

export default function AdminScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const router  = useRouter();
  const { user, token } = useAuth();

  const [users, setUsers]       = useState<UserRow[]>([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<number | null>(null); // id اليوزر اللي بيتحفظ

  // حماية الصفحة — بس ROY يدخل
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

  // جلب اليوزرز من الـ API
  async function loadUsers(q = "") {
    setLoading(true);
    try {
      const url = q.trim()
        ? `${BASE}/api/admin/users?search=${encodeURIComponent(q)}`
        : `${BASE}/api/admin/users`;
      const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) setUsers(await r.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadUsers(); }, []);

  // بحث فوري مع debounce بسيط
  useEffect(() => {
    const t = setTimeout(() => loadUsers(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ─── تغيير الباقة ────────────────────────────────────────────────────────────
  async function changePlan(userId: number, newPlan: "free" | "pro" | "premium") {
    setSaving(userId);
    try {
      const r = await fetch(`${BASE}/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: newPlan }),
      });
      if (r.ok) {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, plan: newPlan } : u));
      } else {
        Alert.alert("خطأ", "فشل تغيير الباقة");
      }
    } finally {
      setSaving(null);
    }
  }

  // ─── حظر / رفع الحظر ─────────────────────────────────────────────────────────
  async function toggleBan(u: UserRow) {
    const action = u.isBanned ? "رفع الحظر" : "حظر";
    Alert.alert(
      `${action} "${u.username}"`,
      u.isBanned
        ? "هل تريد رفع الحظر عن هذا المستخدم؟"
        : "هل تريد حظر هذا المستخدم؟ لن يستطيع تسجيل الدخول.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: action,
          style: u.isBanned ? "default" : "destructive",
          onPress: async () => {
            setSaving(u.id);
            try {
              const r = await fetch(`${BASE}/api/admin/users/${u.id}/ban`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isBanned: !u.isBanned }),
              });
              if (r.ok) {
                setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, isBanned: !u.isBanned } : x));
              } else {
                Alert.alert("خطأ", "فشل تغيير حالة الحظر");
              }
            } finally {
              setSaving(null);
            }
          },
        },
      ]
    );
  }

  // ─── حذف يوزر ────────────────────────────────────────────────────────────────
  async function deleteUser(u: UserRow) {
    Alert.alert(
      `حذف "${u.username}"`,
      "متأكد عايز تحذف؟ الحذف نهائي ولا يمكن التراجع عنه.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "🗑️ حذف نهائي",
          style: "destructive",
          onPress: async () => {
            setSaving(u.id);
            try {
              const r = await fetch(`${BASE}/api/admin/users/${u.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              if (r.ok) {
                setUsers((prev) => prev.filter((x) => x.id !== u.id));
              } else {
                const d = await r.json();
                Alert.alert("خطأ", d.error || "فشل الحذف");
              }
            } finally {
              setSaving(null);
            }
          },
        },
      ]
    );
  }

  // ─── Styles ──────────────────────────────────────────────────────────────────
  const s = StyleSheet.create({
    container:    { flex: 1, backgroundColor: colors.background },
    scroll:       { padding: 16, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 },
    header:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
    backBtn:      { padding: 8 },
    title:        { fontSize: 22, fontWeight: "700", color: "#f59e0b", fontFamily: "Inter_700Bold", flex: 1 },
    badge:        { backgroundColor: "#f59e0b22", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
    badgeText:    { color: "#f59e0b", fontSize: 12, fontFamily: "Inter_600SemiBold" },
    searchBox: {
      flexDirection: "row", alignItems: "center", backgroundColor: colors.card,
      borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      paddingHorizontal: 12, marginBottom: 16,
    },
    searchInput: {
      flex: 1, paddingVertical: 12, fontSize: 14, color: colors.foreground,
      fontFamily: "Inter_400Regular", textAlign: "right",
    },
    userCard: {
      backgroundColor: colors.card, borderRadius: 14, borderWidth: 1,
      borderColor: colors.border, padding: 14, marginBottom: 10,
    },
    userCardBanned: { borderColor: "#f87171", backgroundColor: "#3b0a0a22" },
    topRow:       { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    username:     { flex: 1, fontSize: 16, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    email:        { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 10 },
    bannedTag:    { color: "#f87171", fontSize: 12, fontFamily: "Inter_600SemiBold", marginRight: 8 },
    planRow:      { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
    planLabel:    { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    planBtns:     { flexDirection: "row", gap: 6 },
    planBtn: {
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
      borderWidth: 1, borderColor: colors.border,
    },
    planBtnText:  { fontSize: 12, fontFamily: "Inter_600SemiBold" },
    actionRow:    { flexDirection: "row", gap: 8, marginTop: 4 },
    banBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
    },
    delBtn: {
      flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
      gap: 5, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
      borderColor: "#991b1b", backgroundColor: "#3b0a0a",
    },
    btnText:      { fontSize: 13, fontFamily: "Inter_600SemiBold" },
    emptyText:    { color: colors.mutedForeground, textAlign: "center", marginTop: 40, fontFamily: "Inter_400Regular" },
    countText:    { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 12 },
  });

  return (
    <View style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* هيدر */}
        <View style={s.header}>
          <Pressable style={s.backBtn} onPress={() => router.back()}>
            <Feather name="arrow-right" size={20} color={colors.mutedForeground} />
          </Pressable>
          <Text style={s.title}>⚙️ الأسماء</Text>
          <View style={s.badge}>
            <Text style={s.badgeText}>Admin</Text>
          </View>
        </View>

        {/* حقل البحث */}
        <View style={s.searchBox}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={s.searchInput}
            placeholder="ابحث باسم المستخدم أو الإيميل..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* عدد النتائج */}
        {!loading && (
          <Text style={s.countText}>
            {users.length} مستخدم{search ? ` — نتائج: "${search}"` : ""}
          </Text>
        )}

        {/* القائمة */}
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : users.length === 0 ? (
          <Text style={s.emptyText}>
            {search ? "لا توجد نتائج للبحث" : "لا يوجد مستخدمون"}
          </Text>
        ) : (
          users.map((u) => {
            const planColor = PLAN_COLORS[u.plan] || "#6b7280";
            const isSaving  = saving === u.id;

            return (
              <View key={u.id} style={[s.userCard, u.isBanned && s.userCardBanned]}>
                {/* السطر الأول: اسم + حالة */}
                <View style={s.topRow}>
                  <Text style={s.username}>@{u.username}</Text>
                  {u.isBanned && <Text style={s.bannedTag}>🚫 محظور</Text>}
                  {isSaving && <ActivityIndicator size="small" color={colors.primary} />}
                </View>

                {/* الإيميل */}
                <Text style={s.email}>{u.email}</Text>

                {/* اختيار الباقة */}
                <View style={s.planRow}>
                  <Text style={s.planLabel}>الباقة:</Text>
                  <View style={s.planBtns}>
                    {(["free", "pro", "premium"] as const).map((p) => {
                      const active = u.plan === p;
                      return (
                        <Pressable
                          key={p}
                          style={[
                            s.planBtn,
                            active && { backgroundColor: PLAN_COLORS[p] + "33", borderColor: PLAN_COLORS[p] },
                          ]}
                          onPress={() => !active && !isSaving && changePlan(u.id, p)}
                          disabled={isSaving}
                        >
                          <Text style={[s.planBtnText, { color: active ? PLAN_COLORS[p] : colors.mutedForeground }]}>
                            {PLAN_LABELS[p]}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* أزرار الحظر والحذف */}
                <View style={s.actionRow}>
                  {/* زرار الحظر */}
                  <Pressable
                    style={[
                      s.banBtn,
                      u.isBanned
                        ? { borderColor: "#22c55e", backgroundColor: "#052e1622" }
                        : { borderColor: "#f59e0b", backgroundColor: "#f59e0b11" },
                    ]}
                    onPress={() => !isSaving && toggleBan(u)}
                    disabled={isSaving}
                  >
                    <Text style={{ fontSize: 14 }}>{u.isBanned ? "✅" : "🚫"}</Text>
                    <Text style={[s.btnText, { color: u.isBanned ? "#22c55e" : "#f59e0b" }]}>
                      {u.isBanned ? "رفع الحظر" : "بند"}
                    </Text>
                  </Pressable>

                  {/* زرار الحذف */}
                  <Pressable
                    style={s.delBtn}
                    onPress={() => !isSaving && deleteUser(u)}
                    disabled={isSaving}
                  >
                    <Text style={{ fontSize: 14 }}>🗑️</Text>
                    <Text style={[s.btnText, { color: "#f87171" }]}>حذف</Text>
                  </Pressable>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

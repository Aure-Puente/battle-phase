//Importaciones:
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, ScrollView, View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../firebase/firebase";

//JS:
const PLAYERS = [
  { key: "aure", label: "Aure", uid: "sW53hw9EdVXDIJMI3BnPTcYRbAn1" },
  { key: "rami", label: "Rami", uid: "mFXk9M3WnOgTvtSnjlUQqz1TDsa2" },
  { key: "benja", label: "Benja", uid: "VTo2TZ93t7WQANYP9Fao2sFEops1" },
];

const RANGE_SCALE = [
  { key: "FUN", label: "FUN", score: 0, color: "#FF4D4D" },
  { key: "FUN_ELITE", label: "FUN ELITE", score: 1, color: "#FF8A3D" },
  { key: "ROGUE", label: "ROGUE", score: 2, color: "#FFD166" },
  { key: "ROGUE_ELITE", label: "ROGUE ELITE", score: 3, color: "#2ED47A" },
  { key: "META", label: "META", score: 4, color: "#2DA8FF" },
  { key: "DOMINANTE", label: "DOMINANTE", score: 5, color: "#8B5CF6" },
];

const clamp01 = (n) => Math.max(0, Math.min(1, n));

const hexToRgb = (hex) => {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return { r, g, b };
  }
  if (h.length === 6) {
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return { r, g, b };
  }
  return { r: 0, g: 0, b: 0 };
};

const rgbToHex = ({ r, g, b }) => {
  const hx = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${hx(r)}${hx(g)}${hx(b)}`;
};

const mixHex = (a, b, t) => {
  const tt = clamp01(t);
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return rgbToHex({
    r: A.r + (B.r - A.r) * tt,
    g: A.g + (B.g - A.g) * tt,
    b: A.b + (B.b - A.b) * tt,
  });
};

const getDeckRangeScore = (deck) => {
  const key = deck?.rango || null;
  if (!key) return null;
  const found = RANGE_SCALE.find((r) => r.key === key);
  return found ? found.score : null;
};

const colorFromAvg = (avgScore) => {
  const v = Math.max(0, Math.min(5, avgScore));
  const low = Math.floor(v);
  const high = Math.ceil(v);

  const c1 = RANGE_SCALE.find((r) => r.score === low)?.color || RANGE_SCALE[0].color;
  const c2 = RANGE_SCALE.find((r) => r.score === high)?.color || RANGE_SCALE[RANGE_SCALE.length - 1].color;

  if (low === high) return c1;

  const t = (v - low) / (high - low);
  return mixHex(c1, c2, t);
};

const labelFromAvg = (avgScore) => {
  const v = Math.max(0, Math.min(5, avgScore));
  const nearest = Math.round(v);
  return RANGE_SCALE.find((r) => r.score === nearest)?.label || "—";
};

export default function EstadisticasScreen() {
  const theme = useTheme();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  const intro = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    intro.setValue(0);
    Animated.timing(intro, {
      toValue: 1,
      duration: 750,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [intro]);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "decks"),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDecks(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsub;
  }, []);

  const stats = useMemo(() => {
    const byUid = new Map();

    PLAYERS.forEach((p) => {
      byUid.set(p.uid, {
        uid: p.uid,
        label: p.label,
        decksConRango: 0,
        sumScore: 0,
        avgScore: null,
        avgLabel: "—",
        color: "#6B7280",
      });
    });

    for (const d of decks) {
      const uid = d?.ownerUid;
      if (!uid || !byUid.has(uid)) continue;

      const row = byUid.get(uid);

      const score = getDeckRangeScore(d);
      if (typeof score === "number" && Number.isFinite(score)) {
        row.decksConRango += 1;
        row.sumScore += score;
      }
    }

    const computed = PLAYERS.map((p) => {
      const row = byUid.get(p.uid);

      if (row.decksConRango > 0) {
        const avg = row.sumScore / row.decksConRango;
        return {
          ...row,
          avgScore: avg,
          avgLabel: labelFromAvg(avg),
          color: colorFromAvg(avg),
        };
      }

      return {
        ...row,
        avgScore: null,
        avgLabel: "—",
        color: "#6B7280",
      };
    });

    // Orden por promedio (mejor arriba). Los que no tienen data, al final.
    return computed.sort((a, b) => {
      const aa = typeof a.avgScore === "number" ? a.avgScore : -1;
      const bb = typeof b.avgScore === "number" ? b.avgScore : -1;
      if (bb !== aa) return bb - aa;
      return String(a.label).localeCompare(String(b.label));
    });
  }, [decks]);

  const Circle = ({ color, isEmpty, delay = 0 }) => {
    const fill = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      fill.setValue(0);
      Animated.timing(fill, {
        toValue: 1,
        duration: 700,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }, [fill, delay]);

    const outerBorder = isEmpty ? theme.colors.outline : mixHex(theme.colors.outline, color, 0.62);
    const innerGlow = isEmpty ? theme.colors.surfaceVariant : mixHex(theme.colors.surfaceVariant, color, 0.26);
    const core = isEmpty ? "#6B7280" : color;

    const coreScale = fill.interpolate({
      inputRange: [0, 1],
      outputRange: [0.55, 1],
    });
    const coreOpacity = fill.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const wrapScale = intro.interpolate({
      inputRange: [0, 1],
      outputRange: [0.96, 1],
    });
    const wrapOpacity = intro.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    return (
      <Animated.View style={{ opacity: wrapOpacity, transform: [{ scale: wrapScale }] }}>
        <View
          style={{
            width: 82,
            height: 82,
            borderRadius: 41,
            borderWidth: 1,
            borderColor: outerBorder,
            backgroundColor: innerGlow,
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: core,
              borderWidth: 1,
              borderColor: mixHex(outerBorder, core, 0.38),
              overflow: "hidden",
              opacity: coreOpacity,
              transform: [{ scale: coreScale }],
            }}
          >
            <View
              style={{
                position: "absolute",
                top: -10,
                left: -12,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "#FFFFFF",
                opacity: isEmpty ? 0.10 : 0.15,
              }}
            />
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={{
          gap: 6,
          opacity: intro,
          transform: [
            {
              translateY: intro.interpolate({
                inputRange: [0, 1],
                outputRange: [6, 0],
              }),
            },
          ],
        }}
      >
        <Text variant="headlineMedium" style={{ fontWeight: "800" }}>
          Estadísticas
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons name="chart-donut" size={18} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Nivel promedio por jugador (según rangos)
          </Text>
        </View>
      </Animated.View>

      <Card
        mode="contained"
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.colors.outline,
        }}
      >
        <Card.Content style={{ paddingTop: 16, gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="poll" size={22} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ fontWeight: "800" }}>
              Resumen
            </Text>

            <View style={{ marginLeft: "auto", flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons
                name={loading ? "progress-clock" : "check-circle-outline"}
                size={18}
                color={loading ? theme.colors.onSurfaceVariant : theme.colors.tertiary}
              />
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {loading ? "Cargando..." : "Actualizado"}
              </Text>
            </View>
          </View>

<Text style={{ color: theme.colors.onSurfaceVariant }}>
  Se promedian los rangos de los decks. Los decks sin rango no cuentan. 
  El “Nivel” se obtiene redondeando el promedio al rango más cercano.
</Text>

        </Card.Content>
      </Card>

      {stats.map((row, idx) => {
        const hasData = row.decksConRango > 0 && row.avgScore != null;
        const orbColor = row.color;
        const levelLabel = hasData ? row.avgLabel : "—";
        const avgText = hasData ? row.avgScore.toFixed(2) : "—";

        return (
          <Animated.View
            key={row.uid}
            style={{
              opacity: intro,
              transform: [
                {
                  translateY: intro.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10 + idx * 3, 0],
                  }),
                },
              ],
            }}
          >
            <Card
              mode="contained"
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 20,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: theme.colors.outline,
              }}
            >
              <Card.Content style={{ paddingTop: 18, paddingBottom: 18 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                  <Circle color={orbColor} isEmpty={!hasData} delay={140 + idx * 120} />

                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={{ fontWeight: "900", fontSize: 20, color: theme.colors.onSurface }}>
                      {row.label}
                    </Text>

                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        Promedio:{" "}
                        <Text style={{ fontWeight: "900", color: theme.colors.onSurface }}>
                          {avgText}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                      Nivel
                    </Text>
                    <Text style={{ fontWeight: "900", fontSize: 18, color: theme.colors.onSurface }}>
                      {levelLabel}
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
}

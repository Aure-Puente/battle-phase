//Importaciones:
import { useFocusEffect } from "@react-navigation/native";
import { collection, onSnapshot } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  View,
} from "react-native";
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
  const c2 =
    RANGE_SCALE.find((r) => r.score === high)?.color ||
    RANGE_SCALE[RANGE_SCALE.length - 1].color;

  if (low === high) return c1;

  const t = (v - low) / (high - low);
  return mixHex(c1, c2, t);
};

const labelFromAvg = (avgScore) => {
  const v = Math.max(0, Math.min(5, avgScore));
  const nearest = Math.round(v);
  return RANGE_SCALE.find((r) => r.score === nearest)?.label || "—";
};

const rnd = (min, max) => min + Math.random() * (max - min);
const pickRandom = (arr) => (arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null);

export default function EstadisticasScreen() {
  const theme = useTheme();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // Animación de entrada
  // =========================
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterY = useRef(new Animated.Value(10)).current;
  const enterScale = useRef(new Animated.Value(0.985)).current;

  const runEnter = useCallback(() => {
    enterOpacity.setValue(0);
    enterY.setValue(10);
    enterScale.setValue(0.985);

    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(enterY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(enterScale, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [enterOpacity, enterY, enterScale]);

  useFocusEffect(
    useCallback(() => {
      runEnter();
      return undefined;
    }, [runEnter])
  );

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

  // =========================
  // Insignias por jugador 
  // =========================
  const insigniasByUid = useMemo(() => {
    const m = new Map();
    for (const p of PLAYERS) m.set(p.uid, []);

    for (const d of decks) {
      const uid = d?.ownerUid;
      const url = d?.insigniaResolvedUrl || d?.insigniaUrl;
      if (!uid || typeof url !== "string") continue;
      if (!url.startsWith("http")) continue;

      if (!m.has(uid)) m.set(uid, []);
      m.get(uid).push(url);
    }

    for (const [uid, arr] of m.entries()) {
      m.set(uid, Array.from(new Set(arr)));
    }

    return m;
  }, [decks]);

  // =========================
  //  Estado modal 
  // =========================
  const [orbOpen, setOrbOpen] = useState(false);
  const [orbUid, setOrbUid] = useState(null);
  const [orbTitle, setOrbTitle] = useState("");
  const [orbColor, setOrbColor] = useState("#2DA8FF");

  const openOrb = useCallback((uid, label, color) => {
    setOrbUid(uid);
    setOrbTitle(`Orbe de ${label}`);
    setOrbColor(color || "#2DA8FF");
    setOrbOpen(true);
  }, []);

  const closeOrb = useCallback(() => setOrbOpen(false), []);

  const orbInsignias = useMemo(() => {
    if (!orbUid) return [];
    return insigniasByUid.get(orbUid) || [];
  }, [orbUid, insigniasByUid]);

  // =========================
  // Stats
  // =========================
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

      return { ...row, avgScore: null, avgLabel: "—", color: "#6B7280" };
    });

    return computed.sort((a, b) => {
      const aa = typeof a.avgScore === "number" ? a.avgScore : -1;
      const bb = typeof b.avgScore === "number" ? b.avgScore : -1;
      if (bb !== aa) return bb - aa;
      return String(a.label).localeCompare(String(b.label));
    });
  }, [decks]);

  // =========================
  // Esfera "viva"
  // =========================
  const Circle = ({ color, isEmpty, delay = 0 }) => {
    const mount = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0)).current;
    const orbit = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      mount.setValue(0);
      Animated.timing(mount, {
        toValue: 1,
        duration: 650,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

      pulse.setValue(0);
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );
      pulseLoop.start();

      orbit.setValue(0);
      const orbitLoop = Animated.loop(
        Animated.timing(orbit, { toValue: 1, duration: 3600, easing: Easing.linear, useNativeDriver: true })
      );
      orbitLoop.start();

      return () => {
        pulseLoop.stop();
        orbitLoop.stop();
      };
    }, [mount, pulse, orbit, delay]);

    const outerBorder = isEmpty ? theme.colors.outline : mixHex(theme.colors.outline, color, 0.62);
    const innerGlow = isEmpty ? theme.colors.surfaceVariant : mixHex(theme.colors.surfaceVariant, color, 0.26);
    const core = isEmpty ? "#6B7280" : color;

    const wrapOpacity = mount.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
    const wrapScale = mount.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] });

    const corePulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
    const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.10, 0.18] });
    const haloScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1.02, 1.12] });
    const orbitRotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
    const shineX = pulse.interpolate({ inputRange: [0, 1], outputRange: [-10, 10] });

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
          {!isEmpty && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 74,
                height: 74,
                borderRadius: 37,
                backgroundColor: core,
                opacity: haloOpacity,
                transform: [{ scale: haloScale }],
              }}
            />
          )}

          {!isEmpty && (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: 82,
                height: 82,
                transform: [{ rotate: orbitRotate }],
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: "#FFFFFF",
                  opacity: 0.18,
                  marginTop: 6,
                }}
              />
            </Animated.View>
          )}

          <Animated.View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: core,
              borderWidth: 1,
              borderColor: mixHex(outerBorder, core, 0.38),
              overflow: "hidden",
              transform: [{ scale: corePulseScale }],
            }}
          >
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: -14,
                left: -18,
                width: 52,
                height: 52,
                borderRadius: 26,
                backgroundColor: "#FFFFFF",
                opacity: isEmpty ? 0.10 : 0.16,
                transform: [{ translateX: shineX }],
              }}
            />
          </Animated.View>
        </View>
      </Animated.View>
    );
  };

  return (
    <>
      {/* Modal de orbe gigante */}
      <PowerOrbModal visible={orbOpen} onClose={closeOrb} title={orbTitle} color={orbColor} insignias={orbInsignias} />

      <Animated.View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          opacity: enterOpacity,
          transform: [{ translateY: enterY }, { scale: enterScale }],
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 14 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ gap: 6 }}>
            <Text variant="headlineMedium" style={{ fontWeight: "800" }}>
              Estadísticas
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="chart-donut" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Nivel promedio por jugador (según rangos)</Text>
            </View>
          </View>

          {/* Resumen */}
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
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>{loading ? "Cargando..." : "Actualizado"}</Text>
                </View>
              </View>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Tocá la esfera de un jugador para ver su orbe en pantalla completa.
              </Text>
            </Card.Content>
          </Card>

          {/* Cards por jugador */}
          {stats.map((row, idx) => {
            const hasData = row.decksConRango > 0 && row.avgScore != null;
            const orbColorLocal = row.color;
            const levelLabel = hasData ? row.avgLabel : "—";
            const avgText = hasData ? row.avgScore.toFixed(2) : "—";

            const itemTranslateY = enterOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: [12 + idx * 3, 0],
            });

            return (
              <Animated.View key={row.uid} style={{ opacity: enterOpacity, transform: [{ translateY: itemTranslateY }] }}>
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
                      <Pressable
                        onPress={() => openOrb(row.uid, row.label, orbColorLocal)}
                        style={({ pressed }) => [pressed ? { transform: [{ scale: 0.98 }], opacity: 0.96 } : null]}
                      >
                        <Circle color={orbColorLocal} isEmpty={!hasData} delay={140 + idx * 120} />
                      </Pressable>

                      <View style={{ flex: 1, gap: 6 }}>
                        <Text style={{ fontWeight: "900", fontSize: 20, color: theme.colors.onSurface }}>{row.label}</Text>

                        <Text style={{ color: theme.colors.onSurfaceVariant }}>
                          Promedio:{" "}
                          <Text style={{ fontWeight: "900", color: theme.colors.onSurface }}>{avgText}</Text>
                        </Text>
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>Nivel</Text>
                        <Text style={{ fontWeight: "900", fontSize: 18, color: theme.colors.onSurface }}>{levelLabel}</Text>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              </Animated.View>
            );
          })}
        </ScrollView>
      </Animated.View>
    </>
  );
}

// ======================================================
//Modal del orbe:
// ======================================================
function PowerOrbModal({ visible, onClose, title, color, insignias = [] }) {
  const theme = useTheme();
  const { width: W } = Dimensions.get("window");

  const orbSize = Math.min(W * 0.88, 420);

  // entrada modal
  const backdrop = useRef(new Animated.Value(0)).current;
  const contentScale = useRef(new Animated.Value(0.95)).current;
  const contentY = useRef(new Animated.Value(10)).current;

  // orbe viva
  const pulse = useRef(new Animated.Value(0)).current;
  const orbit = useRef(new Animated.Value(0)).current;
  const ring = useRef(new Animated.Value(0)).current;

  // insignia 
  const imgOpacity = useRef(new Animated.Value(0)).current;
  const imgScale = useRef(new Animated.Value(1.04)).current;
  const [imgUrl, setImgUrl] = useState(null);

  // partículas
  const particlesRef = useRef([]);

  const openAnim = useCallback(() => {
    backdrop.setValue(0);
    contentScale.setValue(0.95);
    contentY.setValue(10);

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentScale, {
        toValue: 1,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(contentY, {
        toValue: 0,
        duration: 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdrop, contentScale, contentY]);

  // init partículas al abrir
  useEffect(() => {
    if (!visible) return;

    const n = 14; 
    particlesRef.current = Array.from({ length: n }).map((_, i) => ({
      id: `p${i}`,
      x: rnd(-orbSize * 0.26, orbSize * 0.26),
      y: rnd(-orbSize * 0.26, orbSize * 0.26),
      s: rnd(0.55, 1.35),
      o: rnd(0.10, 0.24),
      drift: new Animated.Value(rnd(0, 1)),
      tw: new Animated.Value(0),
    }));
  }, [visible, orbSize]);

  useEffect(() => {
    if (!visible) return;

    openAnim();

    pulse.setValue(0);
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    orbit.setValue(0);
    const orbitLoop = Animated.loop(
      Animated.timing(orbit, { toValue: 1, duration: 5200, easing: Easing.linear, useNativeDriver: true })
    );
    orbitLoop.start();

    ring.setValue(0);
    const ringLoop = Animated.loop(
      Animated.timing(ring, { toValue: 1, duration: 8200, easing: Easing.linear, useNativeDriver: true })
    );
    ringLoop.start();

    // partículas
    const particleLoops = (particlesRef.current || []).map((p) => {
      p.drift.setValue(rnd(0, 1));
      p.tw.setValue(0);

      const driftLoop = Animated.loop(
        Animated.timing(p.drift, {
          toValue: 1,
          duration: rnd(4200, 7200),
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        })
      );

      const twLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(p.tw, { toValue: 1, duration: rnd(900, 1600), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.tw, { toValue: 0, duration: rnd(900, 1600), easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])
      );

      driftLoop.start();
      twLoop.start();

      return { driftLoop, twLoop };
    });

    return () => {
      pulseLoop.stop();
      orbitLoop.stop();
      ringLoop.stop();
      particleLoops.forEach((x) => {
        x.driftLoop.stop();
        x.twLoop.stop();
      });
    };
  }, [visible, openAnim, pulse, orbit, ring]);

  useEffect(() => {
    if (!visible) return;

    let alive = true;
    let timer = null;

    const inDur = 420;
    const stay = 1400;
    const outDur = 520;
    const nextDelay = 240;

    const cycle = () => {
      if (!alive) return;

      const next = pickRandom(insignias);
      if (next) setImgUrl(next);

      imgOpacity.stopAnimation();
      imgScale.stopAnimation();

      imgOpacity.setValue(0);
      imgScale.setValue(1.045);

      Animated.sequence([
        Animated.parallel([
          Animated.timing(imgOpacity, { toValue: 1, duration: inDur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(imgScale, { toValue: 1, duration: inDur, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
        Animated.delay(stay),
        Animated.timing(imgOpacity, { toValue: 0, duration: outDur, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start(() => {
        timer = setTimeout(cycle, nextDelay);
      });
    };

    cycle();

    return () => {
      alive = false;
      if (timer) clearTimeout(timer);
      imgOpacity.stopAnimation();
      imgScale.stopAnimation();
    };
  }, [visible, insignias, imgOpacity, imgScale]);

  // derivadas orbe
  const orbScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const glowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.26] });
  const orbitRotate = orbit.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const ringRotate = ring.interpolate({ inputRange: [0, 1], outputRange: ["360deg", "0deg"] });
  const shineX = pulse.interpolate({ inputRange: [0, 1], outputRange: [-12, 12] });

  const glassAlpha = 0.24;  
  const tintAlpha = 0.22;     
  const vignetteAlpha = 0.22; 

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.74)",
          opacity: backdrop,
          justifyContent: "center",
          alignItems: "center",
          padding: 16,
        }}
      >
        {/* cerrar tocando afuera */}
        <Pressable onPress={onClose} style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }} />

        <Animated.View style={{ width: "100%", alignItems: "center", transform: [{ translateY: contentY }, { scale: contentScale }] }}>
          {/* close */}
          <Pressable
            onPress={onClose}
            style={{
              position: "absolute",
              top: -8,
              right: 0,
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurface} />
          </Pressable>

          <Text style={{ color: "rgba(255,255,255,0.95)", fontWeight: "900", fontSize: 18, marginBottom: 30 }}>
            {title}
          </Text>

          <View style={{ width: orbSize, height: orbSize, borderRadius: orbSize / 2, alignItems: "center", justifyContent: "center" }}>
            {/* glow */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: orbSize,
                height: orbSize,
                borderRadius: orbSize / 2,
                backgroundColor: color,
                opacity: glowOpacity,
                transform: [{ scale: orbScale }],
              }}
            />

            {/* anillos arcanos */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: orbSize * 0.985,
                height: orbSize * 0.985,
                borderRadius: (orbSize * 0.985) / 2,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.12)",
                transform: [{ rotate: orbitRotate }],
              }}
            />
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: orbSize * 0.86,
                height: orbSize * 0.86,
                borderRadius: (orbSize * 0.86) / 2,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.09)",
                transform: [{ rotate: ringRotate }],
              }}
            />

            {/* marcas del círculo (4 ticks) */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: orbSize,
                height: orbSize,
                transform: [{ rotate: ringRotate }],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View style={{ position: "absolute", top: 10, width: 10, height: 10, borderRadius: 5, backgroundColor: "#fff", opacity: 0.14 }} />
              <View style={{ position: "absolute", bottom: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff", opacity: 0.10 }} />
              <View style={{ position: "absolute", left: 10, width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#fff", opacity: 0.10 }} />
              <View style={{ position: "absolute", right: 10, width: 7, height: 7, borderRadius: 3.5, backgroundColor: "#fff", opacity: 0.10 }} />
            </Animated.View>

            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: orbSize * 0.94,
                height: orbSize * 0.94,
                borderRadius: (orbSize * 0.94) / 2,
                overflow: "hidden",
                opacity: imgOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.90] }),
                transform: [{ scale: imgScale }],
              }}
            >
              {imgUrl ? (
                <Image source={{ uri: imgUrl }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
              ) : null}

              {/* contraste leve */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,0.10)",
                }}
              />

              {/* tinta del color del orbe */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: color,
                  opacity: tintAlpha,
                }}
              />

              {/* viñeta suave */}
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0,0,0,1)",
                  opacity: vignetteAlpha,
                }}
              />
            </Animated.View>

            {/* core vidrio  */}
            <Animated.View
              pointerEvents="none"
              style={{
                width: orbSize * 0.78,
                height: orbSize * 0.78,
                borderRadius: (orbSize * 0.78) / 2,
                backgroundColor: color,
                opacity: glassAlpha,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.20)",
                overflow: "hidden",
                transform: [{ scale: orbScale }],
              }}
            >
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  top: -orbSize * 0.18,
                  left: -orbSize * 0.2,
                  width: orbSize * 0.45,
                  height: orbSize * 0.45,
                  borderRadius: orbSize * 0.225,
                  backgroundColor: "#FFFFFF",
                  opacity: 0.20,
                  transform: [{ translateX: shineX }],
                }}
              />
              <View
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: "55%",
                  backgroundColor: "rgba(0,0,0,0.18)",
                }}
              />
            </Animated.View>

            {/* SPARKLES */}
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                width: orbSize,
                height: orbSize,
                borderRadius: orbSize / 2,
                overflow: "hidden",
              }}
            >
              {(particlesRef.current || []).map((p) => {
                const dx = p.drift.interpolate({ inputRange: [0, 1], outputRange: [p.x - 12, p.x + 12] });
                const dy = p.drift.interpolate({ inputRange: [0, 1], outputRange: [p.y + 10, p.y - 10] });
                const tw = p.tw.interpolate({ inputRange: [0, 1], outputRange: [p.o, p.o * 2.3] });
                const sc = p.tw.interpolate({ inputRange: [0, 1], outputRange: [p.s, p.s * 1.4] });

                return (
                  <Animated.View
                    key={p.id}
                    style={{
                      position: "absolute",
                      left: orbSize / 2 - 3,
                      top: orbSize / 2 - 3,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#FFFFFF",
                      opacity: tw,
                      transform: [{ translateX: dx }, { translateY: dy }, { scale: sc }],
                    }}
                  />
                );
              })}
            </View>
          </View>

          <Text style={{ color: "rgba(255,255,255,0.82)", marginTop: 25 }}>
            {insignias?.length ? "Canalizando energía…" : "Este jugador no tiene insignias aún."}
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
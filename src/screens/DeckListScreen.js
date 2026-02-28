//Importaciones:
import { useFocusEffect } from "@react-navigation/native";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { Button, Card, FAB, Modal, Portal, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { auth, db, storage } from "../firebase/firebase";

//JS:
// Rangos
const RANGES = [
  { key: "FUN", label: "FUN", color: "#FF4D4D" },
  { key: "FUN_ELITE", label: "FUN ELITE", color: "#FF8A3D" },
  { key: "ROGUE", label: "ROGUE", color: "#FFD166" },
  { key: "ROGUE_ELITE", label: "ROGUE ELITE", color: "#2ED47A" },
  { key: "META", label: "META", color: "#2DA8FF" },
  { key: "DOMINANTE", label: "DOMINANTE", color: "#8B5CF6" },
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
  const hx = (n) =>
    Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
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

export default function DeckListScreen({ route, navigation }) {
  const theme = useTheme();
  const { ownerId, titulo } = route.params || {};
  const user = auth.currentUser;

  const isMine = useMemo(() => user?.uid && ownerId === user.uid, [ownerId, user?.uid]);

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  // =========================
  // Animación de entrada 
  // =========================
  const enter = useRef(new Animated.Value(0)).current;

  const runEnter = useCallback(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useFocusEffect(
    useCallback(() => {
      runEnter();
      return undefined;
    }, [runEnter])
  );

  const fabScale = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const fabOpacity = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const [preview, setPreview] = useState({ visible: false, uri: null, title: "" });
  const openPreview = (uri, title = "") => {
    if (!uri) return;
    setPreview({ visible: true, uri, title });
  };
  const closePreview = () => setPreview({ visible: false, uri: null, title: "" });

  const [deleteState, setDeleteState] = useState({ visible: false, deck: null, rank: null });
  const openDelete = (deck, rank) => setDeleteState({ visible: true, deck, rank });
  const closeDelete = () => setDeleteState({ visible: false, deck: null, rank: null });

  const didInitSortIndexRef = useRef(false);

  useEffect(() => {
    if (!ownerId) return;

    navigation.setOptions({ title: titulo || "Decks" });

    const q = query(collection(db, "decks"), where("ownerUid", "==", ownerId));

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const rowsRaw = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        const rows = [...rowsRaw].sort((a, b) => {
          const sa = typeof a?.sortIndex === "number" ? a.sortIndex : Number.POSITIVE_INFINITY;
          const sb = typeof b?.sortIndex === "number" ? b.sortIndex : Number.POSITIVE_INFINITY;
          if (sa !== sb) return sa - sb;

          const ams = Number(a?.createdAtMs || 0);
          const bms = Number(b?.createdAtMs || 0);
          return bms - ams;
        });

        setDecks(rows);
        setLoading(false);

        if (!didInitSortIndexRef.current) {
          const missing = rows.filter((r) => typeof r?.sortIndex !== "number");
          if (missing.length > 0) {
            didInitSortIndexRef.current = true;

            try {
              const batch = writeBatch(db);

              rows.forEach((item, idx) => {
                if (typeof item?.sortIndex !== "number") {
                  batch.update(doc(db, "decks", item.id), {
                    sortIndex: idx,
                    updatedAt: serverTimestamp(),
                  });
                }
              });

              await batch.commit();
            } catch (e) {
              console.log("Init sortIndex error:", e);
            }
          }
        }
      },
      (err) => {
        console.log("DeckList onSnapshot error:", err);
        setLoading(false);
      }
    );

    return unsub;
  }, [ownerId, titulo, navigation]);

  const getRangeMeta = (d) => {
    const key = d?.rango || null;
    const found = key ? RANGES.find((r) => r.key === key) : null;
    if (found) return found;

    if (d?.rangoLabel || d?.rangoColor) {
      return {
        key: d?.rango || "CUSTOM",
        label: d?.rangoLabel || "Rango",
        color: d?.rangoColor || theme.colors.onSurfaceVariant,
      };
    }

    return null;
  };

  const getRangePillStyle = (rangeColor) => {
    const bg = mixHex(theme.colors.surfaceVariant, rangeColor, 0.18);
    const border = mixHex(theme.colors.outline, rangeColor, 0.35);
    return { bg, border };
  };

  const StatPill = ({
    label,
    valueText,
    enabled,
    iconName,
    onPress,
    accentColor,
    subtleBg,
    subtleBorder,
    showTrailingIcon = true,
    labelSize = 12,
    valueSize = 14,
  }) => (
    <Pressable
      onPress={enabled ? onPress : undefined}
      style={({ pressed }) => [
        {
          flex: 1,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 10,
          paddingHorizontal: 12,
          borderRadius: 14,
          backgroundColor: subtleBg || theme.colors.surfaceVariant,
          borderWidth: 1,
          borderColor: subtleBorder || theme.colors.outline,
          opacity: enabled ? 1 : 0.55,
        },
        enabled && pressed ? { transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={18}
        color={enabled ? accentColor || theme.colors.primary : theme.colors.onSurfaceVariant}
      />

      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: labelSize, color: theme.colors.onSurfaceVariant }}>{label}</Text>
        <Text style={{ fontWeight: "800", fontSize: valueSize }}>{enabled ? valueText : "—"}</Text>
      </View>

      {showTrailingIcon ? (
        <MaterialCommunityIcons
          name={enabled ? "open-in-new" : "close-circle-outline"}
          size={18}
          color={enabled ? theme.colors.tertiary : theme.colors.onSurfaceVariant}
        />
      ) : null}
    </Pressable>
  );

  const DeckImage = ({ uri, onPress }) => {
    if (!uri) {
      return (
        <View
          style={{
            width: 92,
            height: 92,
            borderRadius: 18,
            backgroundColor: theme.colors.surfaceVariant,
            borderWidth: 1,
            borderColor: theme.colors.outline,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialCommunityIcons name="image-off-outline" size={28} color={theme.colors.onSurfaceVariant} />
        </View>
      );
    }

    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          {
            width: 92,
            height: 92,
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.colors.outline,
          },
          pressed ? { transform: [{ scale: 0.98 }], opacity: 0.95 } : null,
        ]}
      >
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} />
      </Pressable>
    );
  };

  const RankBadge = ({ rank }) => (
    <View
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 50,
        elevation: 8,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        backgroundColor: theme.colors.primary,
        borderWidth: 1,
        borderColor: theme.colors.outline,
        opacity: 0.98,
      }}
    >
      <Text style={{ fontWeight: "900", color: "#2A3550" }}>#{rank}</Text>
    </View>
  );

  const onDeleteConfirmed = async () => {
    const deck = deleteState.deck;
    if (!deck?.id || !user?.uid) {
      closeDelete();
      return;
    }

    try {
      await deleteDoc(doc(db, "decks", deck.id));

      const basePath = `decks/${user.uid}/${deck.id}`;
      await Promise.allSettled([
        deleteObject(ref(storage, `${basePath}/insignia.jpg`)),
        deleteObject(ref(storage, `${basePath}/arquetipo.jpg`)),
      ]);
    } finally {
      closeDelete();
    }
  };

  const persistOrder = async (data) => {
    if (!isMine) return;
    if (!user?.uid) return;

    try {
      const batch = writeBatch(db);

      data.forEach((item, idx) => {
        if (Number(item?.sortIndex) !== idx) {
          batch.update(doc(db, "decks", item.id), {
            sortIndex: idx,
            updatedAt: serverTimestamp(),
          });
        }
      });

      await batch.commit();
    } catch (e) {
      console.log("persistOrder error:", e);
    }
  };

  const ItemSeparator = () => <View style={{ height: 12 }} />;
  const headerOpacity = enter.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const headerY = enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });

  const ListHeader = () => (
    <Animated.View
      style={{
        gap: 12,
        marginBottom: 4,
        opacity: headerOpacity,
        transform: [{ translateY: headerY }],
      }}
    >
      <Text variant="headlineMedium" style={{ fontWeight: "900" }}>
        {titulo || "Decks"}
      </Text>

      {loading ? <Text style={{ color: theme.colors.onSurfaceVariant }}>Cargando...</Text> : null}

      {!loading && decks.length === 0 ? (
        <Card mode="contained">
          <Card.Content style={{ gap: 8 }}>
            <Text>No hay decks todavía.</Text>
            {isMine ? (
              <Button mode="contained" onPress={() => navigation.navigate("DeckCreate")}>
                Crear mi primer deck
              </Button>
            ) : null}
          </Card.Content>
        </Card>
      ) : null}
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <DraggableFlatList
        data={decks}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: isMine ? 110 : 28,
        }}
        showsVerticalScrollIndicator={false}
        activationDistance={12}
        dragItemOverflow={false}
        onDragEnd={async ({ data }) => {
          setDecks(data);
          await persistOrder(data);
        }}
        renderItem={({ item: d, index, getIndex, drag, isActive }) => {
          const idx = Number.isFinite(index) ? index : 0;
          const gi = typeof getIndex === "function" ? getIndex() : idx;
          const safeI = Number.isFinite(gi) ? gi : idx;
          const rank = safeI + 1;

          // =========================
          // Stagger por index 
          // =========================
          const step = 0.08;

          let start = 0.12 + idx * step;
          start = Number.isFinite(start) ? Math.min(0.82, Math.max(0, start)) : 0;

          let end = start + 0.22;
          end = Number.isFinite(end) ? Math.min(1, end) : start + 0.22;

          if (!(end >= start)) end = start + 0.001;
          if (end === start) end = start + 0.001;

          const itemOpacity = enter.interpolate({
            inputRange: [start, end],
            outputRange: [0, 1],
            extrapolate: "clamp",
          });

          const itemTranslateY = enter.interpolate({
            inputRange: [start, end],
            outputRange: [12, 0],
            extrapolate: "clamp",
          });

          const itemScale = enter.interpolate({
            inputRange: [start, end],
            outputRange: [0.985, 1],
            extrapolate: "clamp",
          });

          const rangeMeta = getRangeMeta(d);
          const hasRange = !!rangeMeta;

          const rangeLabel = rangeMeta?.label || "—";
          const rangeColor = rangeMeta?.color || theme.colors.onSurfaceVariant;

          const rangeBg = hasRange ? getRangePillStyle(rangeColor).bg : theme.colors.surfaceVariant;
          const rangeBorder = hasRange ? getRangePillStyle(rangeColor).border : theme.colors.outline;

          const hasArquetipo = !!d.arquetipoUrl;
          const arquetipoText = hasArquetipo ? "Ver img" : "—";

          return (
            <Animated.View
              style={{
                opacity: itemOpacity,
                transform: [{ translateY: itemTranslateY }, { scale: itemScale }],
              }}
            >
              <View style={{ opacity: isActive ? 0.92 : 1, transform: [{ scale: isActive ? 0.99 : 1 }] }}>
                <Card
                  mode="contained"
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <Card.Content style={{ gap: 12, paddingTop: 16, position: "relative" }}>
                    <RankBadge rank={rank} />

                    {/* Acciones */}
                    {isMine ? (
                      <View
                        style={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          zIndex: 60,
                          elevation: 9,
                          flexDirection: "row",
                          gap: 8,
                        }}
                      >
                        <Pressable
                          onPress={() => navigation.navigate("DeckEdit", { deckId: d.id })}
                          style={({ pressed }) => [
                            {
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              backgroundColor: theme.colors.surfaceVariant,
                              borderWidth: 1,
                              borderColor: theme.colors.outline,
                              alignItems: "center",
                              justifyContent: "center",
                            },
                            pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : null,
                          ]}
                        >
                          <MaterialCommunityIcons name="pencil" size={18} color={theme.colors.primary} />
                        </Pressable>

                        <Pressable
                          onPress={() => openDelete(d, rank)}
                          style={({ pressed }) => [
                            {
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              backgroundColor: theme.colors.surfaceVariant,
                              borderWidth: 1,
                              borderColor: theme.colors.outline,
                              alignItems: "center",
                              justifyContent: "center",
                            },
                            pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : null,
                          ]}
                        >
                          <MaterialCommunityIcons name="trash-can-outline" size={18} color={theme.colors.secondary} />
                        </Pressable>

                        <Pressable
                          onLongPress={drag}
                          delayLongPress={150}
                          style={({ pressed }) => [
                            {
                              width: 38,
                              height: 38,
                              borderRadius: 12,
                              backgroundColor: theme.colors.surfaceVariant,
                              borderWidth: 1,
                              borderColor: theme.colors.outline,
                              alignItems: "center",
                              justifyContent: "center",
                            },
                            pressed ? { opacity: 0.85, transform: [{ scale: 0.98 }] } : null,
                          ]}
                        >
                          <MaterialCommunityIcons name="drag" size={18} color={theme.colors.onSurfaceVariant} />
                        </Pressable>
                      </View>
                    ) : null}

                    {/* imagen + nombre */}
                    <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
                      <DeckImage
                        uri={d.insigniaUrl}
                        onPress={() => openPreview(d.insigniaUrl, `${d.nombre || "Deck"} — Insignia`)}
                      />

                      <View style={{ flex: 1, gap: 6, paddingTop: 10 }}>
                        <Text
                          variant="titleLarge"
                          style={{ fontWeight: "900", lineHeight: 26 }}
                          numberOfLines={2}
                        >
                          {d.nombre || "—"}
                        </Text>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                          <MaterialCommunityIcons name="cards" size={16} color={theme.colors.onSurfaceVariant} />
                          <Text style={{ color: theme.colors.onSurfaceVariant }}>Deck registrado</Text>
                        </View>
                      </View>
                    </View>

                    {/* Stats: rango + arquetipo */}
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <StatPill
                        label="Rango"
                        valueText={rangeLabel}
                        enabled={hasRange}
                        iconName={hasRange ? "shield-star-outline" : "shield-off-outline"}
                        accentColor={hasRange ? rangeColor : undefined}
                        subtleBg={hasRange ? rangeBg : undefined}
                        subtleBorder={hasRange ? rangeBorder : undefined}
                        onPress={() => {}}
                        showTrailingIcon={false}
                        labelSize={12}
                        valueSize={14}
                      />

                      <StatPill
                        label="Arquetipo"
                        valueText={arquetipoText}
                        enabled={hasArquetipo}
                        iconName="shape-outline"
                        onPress={() => openPreview(d.arquetipoUrl, `${d.nombre || "Deck"} — Arquetipo`)}
                      />
                    </View>
                  </Card.Content>
                </Card>
              </View>
            </Animated.View>
          );
        }}
      />

      {isMine ? (
        <Animated.View
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            opacity: fabOpacity,
            transform: [{ scale: fabScale }],
          }}
        >
          <FAB
            icon="plus"
            style={{ backgroundColor: theme.colors.primary }}
            onPress={() => navigation.navigate("DeckCreate")}
          />
        </Animated.View>
      ) : null}

      {/* Modal preview imagen */}
      <Portal>
        <Modal
          visible={preview.visible}
          onDismiss={closePreview}
          contentContainerStyle={{
            margin: 16,
            borderRadius: 18,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
          }}
        >
          <View style={{ padding: 14, flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="image" size={18} color={theme.colors.primary} />
            <Text style={{ flex: 1, fontWeight: "800" }} numberOfLines={1}>
              {preview.title || "Imagen"}
            </Text>
            <Pressable onPress={closePreview}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={{ padding: 14, paddingTop: 0 }}>
            {preview.uri ? (
              <Image
                source={{ uri: preview.uri }}
                style={{
                  width: "100%",
                  height: 320,
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </Modal>
      </Portal>

      {/* Modal confirm delete */}
      <Portal>
        <Modal
          visible={deleteState.visible}
          onDismiss={closeDelete}
          contentContainerStyle={{
            margin: 16,
            borderRadius: 22,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
          }}
        >
          <View
            style={{
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              borderBottomWidth: 1,
              borderBottomColor: theme.colors.outline,
              backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surface,
              }}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={theme.colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "900", fontSize: 16 }}>Eliminar deck</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>Acción irreversible</Text>
            </View>

            <Pressable onPress={closeDelete} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>

          <View style={{ padding: 14, gap: 10 }}>
            <View
              style={{
                padding: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
                gap: 6,
              }}
            >
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Vas a eliminar:</Text>

              <Text style={{ fontWeight: "900", fontSize: 16 }}>
                {deleteState.deck?.nombre || "Este deck"}
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 999,
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surface,
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>#{deleteState.rank ?? "—"}</Text>
                </View>

                <View style={{ flex: 1 }} />

                <MaterialCommunityIcons name="alert" size={18} color={theme.colors.primary} />
                <Text style={{ color: theme.colors.primary, fontWeight: "800" }}>No se puede deshacer</Text>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <Button
                mode="outlined"
                style={{ flex: 1, borderColor: theme.colors.outline }}
                onPress={closeDelete}
              >
                Cancelar
              </Button>

              <Button
                mode="contained"
                style={{ flex: 1 }}
                buttonColor={theme.colors.primary}
                onPress={onDeleteConfirmed}
              >
                Eliminar
              </Button>
            </View>
          </View>
        </Modal>
      </Portal>
    </View>
  );
}
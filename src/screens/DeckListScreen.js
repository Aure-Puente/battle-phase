import { collection, deleteDoc, doc, onSnapshot, query, where } from "firebase/firestore";
import { deleteObject, ref } from "firebase/storage";
import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, View } from "react-native";
import { Button, Card, FAB, Modal, Portal, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { auth, db, storage } from "../firebase/firebase";

export default function DeckListScreen({ route, navigation }) {
  const theme = useTheme();
  const { ownerId, titulo } = route.params || {};
  const user = auth.currentUser;

  const isMine = useMemo(() => user?.uid && ownerId === user.uid, [ownerId, user?.uid]);

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👇 modal preview imagen
  const [preview, setPreview] = useState({ visible: false, uri: null, title: "" });
  const openPreview = (uri, title = "") => {
    if (!uri) return;
    setPreview({ visible: true, uri, title });
  };
  const closePreview = () => setPreview({ visible: false, uri: null, title: "" });

  // 👇 confirm delete (custom modal)
  const [deleteState, setDeleteState] = useState({ visible: false, deck: null, rank: null });
  const openDelete = (deck, rank) => setDeleteState({ visible: true, deck, rank });
  const closeDelete = () => setDeleteState({ visible: false, deck: null, rank: null });

  useEffect(() => {
    if (!ownerId) return;

    const q = query(collection(db, "decks"), where("ownerUid", "==", ownerId));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setDecks(rows);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return unsub;
  }, [ownerId]);

  useEffect(() => {
    navigation.setOptions({ title: titulo || "Decks" });
  }, [titulo, navigation]);

  // ✅ Ranking por fuerza desc (sin fuerza => al final)
  const rankedDecks = useMemo(() => {
    const getForce = (d) => {
      const n = Number(d?.fuerza);
      return Number.isFinite(n) ? n : null;
    };

    return [...decks].sort((a, b) => {
      const fa = getForce(a);
      const fb = getForce(b);

      if (fa == null && fb == null) {
        const ams = Number(a?.createdAtMs || 0);
        const bms = Number(b?.createdAtMs || 0);
        return bms - ams;
      }
      if (fa == null) return 1;
      if (fb == null) return -1;

      if (fb !== fa) return fb - fa;

      const ams = Number(a?.createdAtMs || 0);
      const bms = Number(b?.createdAtMs || 0);
      return bms - ams;
    });
  }, [decks]);

  const StatPill = ({ label, valueText, enabled, iconName, onPress }) => (
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
          backgroundColor: theme.colors.surfaceVariant,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          opacity: enabled ? 1 : 0.55,
        },
        enabled && pressed ? { transform: [{ scale: 0.99 }] } : null,
      ]}
    >
      <MaterialCommunityIcons
        name={iconName}
        size={18}
        color={enabled ? theme.colors.primary : theme.colors.onSurfaceVariant}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, color: theme.colors.onSurfaceVariant }}>{label}</Text>
        <Text style={{ fontWeight: "800" }}>{enabled ? valueText : "—"}</Text>
      </View>
      <MaterialCommunityIcons
        name={enabled ? "open-in-new" : "close-circle-outline"}
        size={18}
        color={enabled ? theme.colors.tertiary : theme.colors.onSurfaceVariant}
      />
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
          <MaterialCommunityIcons
            name="image-off-outline"
            size={28}
            color={theme.colors.onSurfaceVariant}
          />
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

  // ✅ badge arriba de todo (arregla que quede tapado por la imagen)
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
      <Text style={{ fontWeight: "900" }}>#{rank}</Text>
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: isMine ? 110 : 28, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium">{titulo || "Decks"}</Text>

        {loading ? <Text>Cargando...</Text> : null}

        {!loading && rankedDecks.length === 0 ? (
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

        {rankedDecks.map((d, idx) => {
          const rank = idx + 1;

          const hasFuerza = d.fuerza != null && d.fuerza !== "";
          const fuerzaText = hasFuerza ? String(d.fuerza) : "—";

          const hasArquetipo = !!d.arquetipoUrl;
          const arquetipoText = hasArquetipo ? "Ver imagen" : "—";

          return (
            <Card
              key={d.id}
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

                {/* Acciones (editar / eliminar) */}
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
                      <MaterialCommunityIcons
                        name="trash-can-outline"
                        size={18}
                        color={theme.colors.secondary}
                      />
                    </Pressable>
                  </View>
                ) : null}

                {/* Protagonista: imagen + nombre (nombre un poco más abajo) */}
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

                    {/* ✅ sacamos la fuerza duplicada (ya queda abajo en el pill) */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <MaterialCommunityIcons
                        name="cards"
                        size={16}
                        color={theme.colors.onSurfaceVariant}
                      />
                      <Text style={{ color: theme.colors.onSurfaceVariant }}>Deck registrado</Text>
                    </View>
                  </View>
                </View>

                {/* Stats: fuerza y arquetipo */}
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <StatPill
                    label="Fuerza"
                    valueText={fuerzaText}
                    enabled={hasFuerza}
                    iconName="sword"
                    onPress={() => {}}
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
          );
        })}
      </ScrollView>

      {isMine ? (
        <FAB
          icon="plus"
          style={{
            position: "absolute",
            right: 16,
            bottom: 16,
            backgroundColor: theme.colors.primary,
          }}
          onPress={() => navigation.navigate("DeckCreate")}
        />
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

      {/* ✅ Confirm delete (estético) */}
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
          {/* Header */}
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
              <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                Acción irreversible
              </Text>
            </View>

            <Pressable onPress={closeDelete} style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}>
              <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurfaceVariant} />
            </Pressable>
          </View>

          {/* Content */}
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

            {/* Botones */}
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

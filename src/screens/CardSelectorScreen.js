//Importaciones:
import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Button,
  Card,
  Chip,
  Portal,
  Text,
  TextInput,
  useTheme,
} from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../firebase/firebase";

//JS:
const ATTRIBUTE_LABELS = {
  LIGHT: "LUZ",
  DARK: "OSCURIDAD",
  EARTH: "TIERRA",
  WATER: "AGUA",
  FIRE: "FUEGO",
  WIND: "VIENTO",
  DIVINE: "DIVINIDAD",
};

export default function CardSelectorScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [displayResults, setDisplayResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [previewCard, setPreviewCard] = useState(null);
  const [descriptionVisible, setDescriptionVisible] = useState(false);

  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const resetZoom = () => {
    scale.value = 1;
    savedScale.value = 1;
  };

  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      scale.value = Math.max(1, Math.min(next, 4));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const translateAttribute = (attr) => {
    return ATTRIBUTE_LABELS[String(attr || "").toUpperCase()] || attr || "";
  };

  const normalizeText = (value) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");
  };

  const searchCards = async (value) => {
    try {
      const text = normalizeText(value);

      setError("");

      if (!text) {
        setDisplayResults([]);
        return;
      }

      setLoading(true);

      const q = query(
        collection(db, "cards"),
        orderBy("searchNameLower"),
        where("searchNameLower", ">=", text),
        where("searchNameLower", "<=", text + "\uf8ff"),
        limit(300)
      );

      const snap = await getDocs(q);

      let rows = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      const words = text.split(" ").filter(Boolean);

      if (words.length > 0) {
        rows = rows.filter((item) => {
          const searchable = [
            item.name_es || "",
            item.name_en || "",
            item.searchNameLower || "",
          ]
            .join(" ")
            .toLowerCase();

          return words.every((word) => searchable.includes(word));
        });
      }

      setDisplayResults(rows);
    } catch (e) {
      console.log("searchCards error:", e);
      setError(e?.message || "No se pudieron buscar cartas");
      setDisplayResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if (search.trim()) {
        searchCards(search);
      } else {
        setDisplayResults([]);
      }
    }, 300);

    return () => clearTimeout(t);
  }, [search]);

  const openPreview = (card) => {
    setPreviewCard(card);
    setDescriptionVisible(false);
    resetZoom();
  };

  const closePreview = () => {
    setPreviewCard(null);
    setDescriptionVisible(false);
    resetZoom();
  };

  const openDescription = () => {
    setDescriptionVisible(true);
  };

  const closeDescription = () => {
    setDescriptionVisible(false);
  };

  const currentDescription =
    previewCard?.desc_es ||
    previewCard?.desc_en ||
    "Esta carta no tiene descripción disponible.";

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 32 + insets.bottom,
        }}
      >
        <View style={{ gap: 12 }}>
          <Text variant="headlineMedium" style={{ fontWeight: "900" }}>
            Buscar cartas
          </Text>

          <Text
            style={{
              color: theme.colors.onSurfaceVariant,
              lineHeight: 18,
            }}
          >
            Buscá cartas por nombre. Para mejores resultados, escribí el nombre en orden.
          </Text>

          <TextInput
            label="Buscar por nombre"
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            blurOnSubmit={false}
            left={<TextInput.Icon icon="magnify" />}
          />

          {loading ? (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Buscando...
              </Text>
            </View>
          ) : null}

          {!!error ? (
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          ) : null}

          {!loading && search.trim() ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Resultados: {displayResults.length}
            </Text>
          ) : null}

          {!loading && search.trim() && displayResults.length === 0 ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No se encontraron cartas.
            </Text>
          ) : null}
        </View>

        <View style={{ marginTop: 10, gap: 10 }}>
          {displayResults.map((item) => (
            <Pressable key={String(item.cardId || item.id)} onPress={() => openPreview(item)}>
              <Card
                mode="contained"
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surface,
                }}
              >
                <Card.Content
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    position: "relative",
                  }}
                >
                  <Image
                    source={{ uri: item.imageUrlSmall || item.imageUrl }}
                    style={{
                      width: 58,
                      height: 84,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: theme.colors.outline,
                    }}
                    resizeMode="cover"
                  />

                  <View style={{ flex: 1, gap: 6, paddingRight: 50 }}>
                    <Text
                      style={{
                        fontWeight: "900",
                        fontSize: 16,
                        lineHeight: 20,
                        color: theme.colors.onSurface,
                      }}
                      numberOfLines={2}
                    >
                      {item.name_es || item.name_en || "Sin nombre"}
                    </Text>

                    <Text
                      style={{
                        color: theme.colors.onSurfaceVariant,
                        fontSize: 12,
                      }}
                      numberOfLines={1}
                    >
                      {item.humanReadableType || item.type || "Carta"}
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 2,
                      }}
                    >
                      {item.attribute ? (
                        <Chip
                          compact
                          icon={() => (
                            <MaterialCommunityIcons
                              name="brightness-6"
                              size={14}
                              color={theme.colors.primary}
                            />
                          )}
                          style={{ backgroundColor: theme.colors.surfaceVariant }}
                          textStyle={{
                            color: "#FFFFFF",
                            fontWeight: "800",
                            fontSize: 11,
                          }}
                        >
                          {translateAttribute(item.attribute)}
                        </Chip>
                      ) : null}
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: 6,
                      }}
                    >
                      {item.atk != null ? (
                        <Chip
                          compact
                          icon={() => (
                            <MaterialCommunityIcons
                              name="sword-cross"
                              size={14}
                              color={theme.colors.primary}
                            />
                          )}
                          style={{ backgroundColor: theme.colors.surfaceVariant }}
                          textStyle={{
                            color: "#FFFFFF",
                            fontWeight: "800",
                            fontSize: 15,
                          }}
                        >
                          {item.atk}
                        </Chip>
                      ) : null}

                      {item.def != null ? (
                        <Chip
                          compact
                          icon={() => (
                            <MaterialCommunityIcons
                              name="shield-outline"
                              size={14}
                              color={theme.colors.primary}
                            />
                          )}
                          style={{ backgroundColor: theme.colors.surfaceVariant }}
                          textStyle={{
                            color: "#FFFFFF",
                            fontWeight: "800",
                            fontSize: 15,
                          }}
                        >
                          {item.def}
                        </Chip>
                      ) : null}
                    </View>
                  </View>

                  {item.level != null ? (
                    <View
                      style={{
                        position: "absolute",
                        top: 2,
                        right: 0,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                        backgroundColor: theme.colors.surfaceVariant,
                        borderWidth: 1,
                        borderColor: theme.colors.outline,
                        borderRadius: 999,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                      }}
                    >
                      <MaterialCommunityIcons
                        name="star"
                        size={16}
                        color={theme.colors.primary}
                      />
                      <Text style={{ fontWeight: "900", color: "#FFFFFF" }}>
                        {item.level}
                      </Text>
                    </View>
                  ) : null}
                </Card.Content>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <Portal>
        <Modal
          visible={!!previewCard}
          animationType="fade"
          transparent
          onRequestClose={closePreview}
        >
          <GestureHandlerRootView style={{ flex: 1 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0,0,0,0.92)",
              }}
            >
              <Pressable
                onPress={closePreview}
                style={{
                  position: "absolute",
                  top: insets.top + 12,
                  right: 16,
                  zIndex: 20,
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.surface,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={22}
                  color={theme.colors.primary}
                />
              </Pressable>

              {previewCard ? (
                <>
                  <View
                    style={{
                      paddingTop: insets.top + 40,
                      paddingHorizontal: 56,
                      paddingBottom: 25,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontWeight: "900",
                        fontSize: 20,
                        textAlign: "center",
                      }}
                    >
                      {previewCard.name_es || previewCard.name_en || "Carta"}
                    </Text>
                  </View>

                  <View
                    style={{
                      alignItems: "center",
                      justifyContent: "center",
                      paddingHorizontal: 16,
                      paddingTop: 0,
                      paddingBottom: 0,
                    }}
                  >
                    <GestureDetector gesture={pinchGesture}>
                      <Animated.View
                        style={{
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Animated.Image
                          source={{ uri: previewCard.imageUrl || previewCard.imageUrlSmall }}
                          style={[
                            {
                              width: 320,
                              height: 470,
                            },
                            animatedImageStyle,
                          ]}
                          resizeMode="contain"
                        />
                      </Animated.View>
                    </GestureDetector>
                  </View>

                  <View
                    style={{
                      paddingHorizontal: 16,
                      paddingBottom: 14,
                      paddingTop: 25,
                      gap: 6,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "center",
                        gap: 12,
                        marginTop: 0,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        mode="contained-tonal"
                        onPress={openDescription}
                        style={{
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: theme.colors.outline,
                          backgroundColor: theme.colors.surface,
                        }}
                        contentStyle={{ height: 44, paddingHorizontal: 10 }}
                        labelStyle={{
                          color: theme.colors.primary,
                          fontWeight: "900",
                        }}
                        icon="text-box-search-outline"
                      >
                        Descripción
                      </Button>
                    </View>
                  </View>
                </>
              ) : null}

              {descriptionVisible ? (
                <Pressable
                  onPress={closeDescription}
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.55)",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 22,
                  }}
                >
                  <Pressable
                    onPress={() => {}}
                    style={{
                      width: "100%",
                      maxWidth: 520,
                      maxHeight: "72%",
                      borderRadius: 22,
                      borderWidth: 1,
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.outline,
                        backgroundColor: theme.colors.surfaceVariant,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 12,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: theme.colors.surface,
                          borderWidth: 1,
                          borderColor: theme.colors.outline,
                        }}
                      >
                        <MaterialCommunityIcons
                          name="text-box-search-outline"
                          size={18}
                          color={theme.colors.primary}
                        />
                      </View>

                      <Text style={{ flex: 1, fontWeight: "900", fontSize: 16 }}>
                        Descripción
                      </Text>

                      <Pressable
                        onPress={closeDescription}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <MaterialCommunityIcons
                          name="close"
                          size={20}
                          color={theme.colors.onSurfaceVariant}
                        />
                      </Pressable>
                    </View>

                    <ScrollView
                      showsVerticalScrollIndicator={false}
                      contentContainerStyle={{
                        padding: 16,
                        paddingBottom: 20,
                      }}
                    >
                      <Text
                        style={{
                          color: theme.colors.onSurface,
                          lineHeight: 22,
                          fontSize: 15,
                        }}
                      >
                        {currentDescription}
                      </Text>
                    </ScrollView>
                  </Pressable>
                </Pressable>
              ) : null}
            </View>
          </GestureHandlerRootView>
        </Modal>
      </Portal>
    </View>
  );
}
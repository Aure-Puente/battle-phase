//Importaciones:
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Easing, Image, Modal, Pressable, ScrollView, View } from "react-native";
import { Card, Chip, Divider, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

//JS:
export default function HistorialScreen() {
  const theme = useTheme();
  const [openImage, setOpenImage] = useState(false);

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

  const chipStyle = useMemo(
    () => ({
      backgroundColor: theme.colors.surfaceVariant,
      borderWidth: 1,
      borderColor: theme.colors.outline,
    }),
    [theme]
  );

  const chipTextStyle = useMemo(
    () => ({
      color: theme.colors.onSurface,
      fontWeight: "800",
    }),
    [theme]
  );

  const torneoFinalizado = {
    nombre: "SURVIVAL",
    reglas: "Ganador sigue. El deck que pierde queda eliminado.",
    podio: [
      { puesto: 1, jugador: "Rami", icon: "trophy", color: theme.colors.primary },
      { puesto: 2, jugador: "Aure", icon: "medal", color: theme.colors.tertiary },
      { puesto: 3, jugador: "Benja", icon: "podium", color: theme.colors.onSurfaceVariant },
    ],
    deckGanador: "Cementerio de Dragones",
    imagen: require("../../assets/images/champ.jpeg"),
    cartaDestacadaNombre: "Dragón Necro Zombi de Ojos Rojos",
  };

  const torneoActual = {
    nombre: "SURVIVAL: Extra Life",
    reglas: "Ganador sigue. El perdedor tiene una chance más (2 vidas por deck).",
  };

  return (
    <>
      <Modal
        visible={openImage}
        transparent
        animationType="fade"
        onRequestClose={() => setOpenImage(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.82)",
            padding: 16,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {/* Cerrar */}
          <Pressable
            onPress={() => setOpenImage(false)}
            style={{
              position: "absolute",
              top: 18,
              right: 18,
              width: 44,
              height: 44,
              borderRadius: 16,
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 5,
            }}
          >
            <MaterialCommunityIcons name="close" size={22} color={theme.colors.onSurface} />
          </Pressable>

          {/* Imagen grande */}
          <View
            style={{
              width: "92%",
              maxWidth: 420,
              aspectRatio: 2 / 3,
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: theme.colors.surface,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              zIndex: 4,
            }}
          >
            <Image
              source={torneoFinalizado.imagen}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </View>

          <View style={{ marginTop: 12, alignItems: "center", gap: 6, zIndex: 4 }}>
            <Text style={{ color: theme.colors.onSurface, fontWeight: "900", fontSize: 16 }}>
              {torneoFinalizado.cartaDestacadaNombre}
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Tocá fuera de la imagen o la X para cerrar
            </Text>
          </View>

          {/* Cerrar tocando afuera */}
          <Pressable
            onPress={() => setOpenImage(false)}
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 }}
          />
        </View>
      </Modal>

      {/* Contenedor animado */}
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
          contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ gap: 6 }}>
            <Text variant="headlineMedium" style={{ fontWeight: "900" }}>
              Historial
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="history" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Resumen del último torneo + torneo actual
              </Text>
            </View>
          </View>

          {/* Torneo finalizado */}
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
              <View style={{ gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons
                    name="trophy-variant"
                    size={22}
                    color={theme.colors.primary}
                  />
                  <Text variant="titleLarge" style={{ fontWeight: "900" }}>
                    Torneo finalizado
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialCommunityIcons name="sword-cross" size={18} color={theme.colors.tertiary} />
                  <Text style={{ fontWeight: "900", fontSize: 16 }}>{torneoFinalizado.nombre}</Text>
                </View>

                <Text style={{ color: theme.colors.onSurfaceVariant }}>{torneoFinalizado.reglas}</Text>

                {/* chips del torneo */}
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <Chip compact icon="shield-sword" style={chipStyle} textStyle={chipTextStyle}>
                    Survival
                  </Chip>
                  <Chip compact icon="skull" style={chipStyle} textStyle={chipTextStyle}>
                    Eliminación directa
                  </Chip>
                </View>
              </View>

              <Divider />

              {/* Podio */}
              <View
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 16,
                  padding: 14,
                  gap: 10,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons name="podium-gold" size={18} color={theme.colors.primary} />
                  <Text style={{ fontWeight: "900" }}>Podio</Text>
                </View>

                {torneoFinalizado.podio.map((p) => (
                  <View
                    key={p.puesto}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      padding: 12,
                      borderRadius: 14,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.outline,
                    }}
                  >
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: theme.colors.background,
                        borderWidth: 1,
                        borderColor: theme.colors.outline,
                      }}
                    >
                      <Text style={{ fontWeight: "900" }}>{p.puesto}°</Text>
                    </View>

                    <MaterialCommunityIcons name={p.icon} size={20} color={p.color} />
                    <Text style={{ fontWeight: "900", fontSize: 15 }}>{p.jugador}</Text>

                    <View style={{ marginLeft: "auto" }}>
                      <Text style={{ color: theme.colors.onSurfaceVariant }}>
                        {p.puesto === 1 ? "Campeón" : p.puesto === 2 ? "Finalista" : "Top 3"}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Deck ganador + imagen */}
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  padding: 14,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons
                    name="cards-playing"
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={{ fontWeight: "900" }}>Deck ganador</Text>

                  <Chip
                    compact
                    style={[chipStyle, { marginLeft: "auto" }]}
                    textStyle={chipTextStyle}
                    icon="crown"
                  >
                    {torneoFinalizado.podio[0].jugador}
                  </Chip>
                </View>

                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  <Text style={{ fontWeight: "900" }}>{torneoFinalizado.deckGanador}</Text> — campeón
                  del torneo {torneoFinalizado.nombre}.
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    alignItems: "center",
                    backgroundColor: theme.colors.surfaceVariant,
                    borderRadius: 16,
                    padding: 12,
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                  }}
                >
                  {/*  Imagen tocable */}
                  <Pressable
                    onPress={() => setOpenImage(true)}
                    style={{
                      width: 86,
                      height: 160,
                      borderRadius: 14,
                      overflow: "hidden",
                      borderWidth: 1,
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    <Image
                      source={torneoFinalizado.imagen}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="contain"
                    />
                  </Pressable>

                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={{ fontWeight: "900", fontSize: 15 }}>
                      Carta destacada (del campeón)
                    </Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                      Imagen:{" "}
                      <Text style={{ fontWeight: "900" }}>
                        {torneoFinalizado.cartaDestacadaNombre}
                      </Text>
                    </Text>

                    <View style={{ flexDirection: "row", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
                      <Chip compact icon="trophy" style={chipStyle} textStyle={chipTextStyle}>
                        Campeón
                      </Chip>
                    </View>
                  </View>
                </View>
              </View>
            </Card.Content>
          </Card>

          {/* Torneo actual */}
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
            <Card.Content style={{ paddingTop: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <MaterialCommunityIcons name="fire" size={22} color={theme.colors.tertiary} />
                <Text variant="titleLarge" style={{ fontWeight: "900" }}>
                  Torneo actual
                </Text>
                <Chip
                  compact
                  style={[chipStyle, { marginLeft: "auto" }]}
                  textStyle={chipTextStyle}
                  icon="timer-sand"
                >
                  En curso
                </Chip>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <MaterialCommunityIcons name="sword-cross" size={18} color={theme.colors.tertiary} />
                <Text style={{ fontWeight: "900", fontSize: 16 }}>{torneoActual.nombre}</Text>
              </View>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>{torneoActual.reglas}</Text>

              <View
                style={{
                  backgroundColor: theme.colors.surfaceVariant,
                  borderRadius: 16,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  gap: 8,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons
                    name="heart-multiple"
                    size={18}
                    color={theme.colors.primary}
                  />
                  <Text style={{ fontWeight: "900" }}>Extra Life</Text>
                </View>

                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Cada deck arranca con <Text style={{ fontWeight: "900" }}>2 vidas</Text>: Queda
                  eliminado al perder dos veces.
                </Text>

                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <Chip compact icon="check-decagram" style={chipStyle} textStyle={chipTextStyle}>
                    Ganador sigue
                  </Chip>
                  <Chip compact icon="heart" style={chipStyle} textStyle={chipTextStyle}>
                    2 vidas
                  </Chip>
                  <Chip compact icon="skull" style={chipStyle} textStyle={chipTextStyle}>
                    Eliminación al 2° KO
                  </Chip>
                </View>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </Animated.View>
    </>
  );
}
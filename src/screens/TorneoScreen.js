import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import {
  ActivityIndicator,
  Button,
  Card,
  Chip,
  Dialog,
  Divider,
  List,
  Portal,
  Text,
  useTheme,
} from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { collection, doc, onSnapshot, query, where, writeBatch } from "firebase/firestore";
import { getDownloadURL, ref as storageRef } from "firebase/storage";
import { db, storage } from "../firebase/firebase";

const PLAYERS = [
  { key: "aure", label: "Aure", uid: "sW53hw9EdVXDIJMI3BnPTcYRbAn1", icon: "account-star-outline" },
  { key: "benja", label: "Benja", uid: "VTo2TZ93t7WQANYP9Fao2sFEops1", icon: "lightning-bolt-outline" },
  { key: "rami", label: "Rami", uid: "mFXk9M3WnOgTvtSnjlUQqz1TDsa2", icon: "sword-cross" },
];

function Lives({ lives = 2, theme }) {
  return (
    <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
      {[1, 2].map((n) => {
        const alive = lives >= n;
        return (
          <View
            key={n}
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.outline,
              backgroundColor: alive ? theme.colors.primary : theme.colors.surfaceVariant,
              opacity: alive ? 1 : 0.65,
            }}
          >
            <MaterialCommunityIcons
              name={alive ? "heart" : "heart-outline"}
              size={13}
              color={alive ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
            />
          </View>
        );
      })}
    </View>
  );
}

async function resolveInsignia({ insigniaUrl, insigniaPath }) {
  if (typeof insigniaUrl === "string" && insigniaUrl.startsWith("http")) return insigniaUrl;
  if (typeof insigniaPath === "string" && insigniaPath.length) {
    return await getDownloadURL(storageRef(storage, insigniaPath));
  }
  return null;
}

function useChipStyles(theme) {
  const chipStyle = {
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  };
  const chipText = { color: theme.colors.onSurface, fontWeight: "800" };
  return { chipStyle, chipText };
}

function PlayerHeader({ theme, label, icon, count }) {
  const { chipStyle, chipText } = useChipStyles(theme);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.outline }} />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          paddingVertical: 6,
          paddingHorizontal: 12,
          borderRadius: 999,
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.outline,
        }}
      >
        <MaterialCommunityIcons name={icon} size={18} color={theme.colors.primary} />
        <Text style={{ fontWeight: "900" }}>{label}</Text>
        {/* ✅ ahora muestra SOLO decks habilitados */}
        <Chip compact style={chipStyle} textStyle={chipText}>
          {count}
        </Chip>
      </View>
      <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.outline }} />
    </View>
  );
}

function StepItem({ item, theme, onPress, selected }) {
  const { chipStyle, chipText } = useChipStyles(theme);

  const lives = typeof item.lives === "number" ? item.lives : 2;
  const eliminated = lives <= 0 || item.eliminated;

  const borderColor = eliminated
    ? theme.colors.outline
    : selected
    ? theme.colors.primary
    : item.isCurrentChampion
    ? theme.colors.tertiary
    : theme.colors.outline;

  const borderWidth = selected || item.isCurrentChampion ? 2 : 1;

  return (
    <Card
      mode="contained"
      onPress={eliminated ? undefined : onPress}
      style={{
        backgroundColor: eliminated ? theme.colors.surfaceVariant : theme.colors.surface,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth,
        borderColor,
        opacity: eliminated ? 0.55 : 1,
      }}
    >
      <Card.Content style={{ paddingVertical: 12, gap: 10 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              overflow: "hidden",
              backgroundColor: theme.colors.surfaceVariant,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {item.insigniaResolvedUrl ? (
              <Image source={{ uri: item.insigniaResolvedUrl }} style={{ width: 52, height: 52 }} resizeMode="cover" />
            ) : (
              <MaterialCommunityIcons name="image-off-outline" size={22} color={theme.colors.onSurfaceVariant} />
            )}
          </View>

          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontWeight: "900", fontSize: 15 }} numberOfLines={1}>
              {item.name || "Deck sin nombre"}
            </Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name={item.ownerIcon || "account"} size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={{ color: theme.colors.onSurfaceVariant }}>{item.ownerLabel || "Jugador"}</Text>
            </View>
          </View>

          <Lives lives={lives} theme={theme} />
        </View>

        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Chip compact icon="sword" style={chipStyle} textStyle={chipText}>
            {typeof item.power === "number" ? `Fuerza: ${item.power}` : "Fuerza: —"}
          </Chip>

          {item.isCurrentChampion ? (
            <Chip compact icon="crown" style={chipStyle} textStyle={chipText}>
              Ganador sigue
            </Chip>
          ) : (
            <Chip compact icon="heart-multiple" style={chipStyle} textStyle={chipText}>
              2 vidas
            </Chip>
          )}
          {eliminated ? (
            <Chip compact icon="skull" style={chipStyle} textStyle={chipText}>
              Eliminado
            </Chip>
          ) : null}
        </View>
      </Card.Content>
    </Card>
  );
}

export default function TorneoScreen({ navigation }) {
  const theme = useTheme();
  const { chipStyle, chipText } = useChipStyles(theme);

  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState([]);
  const [picked, setPicked] = useState([]);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  // ✅ acordeón reglas
  const [rulesOpen, setRulesOpen] = useState(false);

  useEffect(() => {
    const unsubs = [];
    let mounted = true;

    const playersByUid = Object.fromEntries(PLAYERS.map((p) => [p.uid, p]));
    const mergeMap = new Map();

    const attachListener = (uid) => {
      const q = query(collection(db, "decks"), where("ownerUid", "==", uid));
      return onSnapshot(
        q,
        async (snap) => {
          snap.docChanges().forEach((ch) => {
            if (ch.type === "removed") mergeMap.delete(ch.doc.id);
          });

          const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

          const resolved = await Promise.all(
            docs.map(async (x, i) => {
              const p = playersByUid[x.ownerUid] || {};
              const insigniaResolvedUrl = await resolveInsignia({
                insigniaUrl: x.insigniaUrl,
                insigniaPath: x.insigniaPath,
              });

              return {
                id: x.id,
                ownerUid: x.ownerUid,
                ownerLabel: p.label,
                ownerIcon: p.icon,
                name: x.name ?? x.nombre ?? "Deck",
                power:
                  typeof x.power === "number"
                    ? x.power
                    : typeof x.fuerza === "number"
                    ? x.fuerza
                    : null,
                lives: typeof x.lives === "number" ? x.lives : 2,
                isCurrentChampion: !!x.isCurrentChampion,
                eliminated: !!x.eliminated,
                insigniaResolvedUrl,
                _t: Date.now() + i,
              };
            })
          );

          resolved.forEach((d) => mergeMap.set(d.id, d));

          if (!mounted) return;
          setDecks(Array.from(mergeMap.values()));
          setLoading(false);
        },
        (err) => {
          console.log("Error decks snapshot:", err);
          if (!mounted) return;
          setLoading(false);
        }
      );
    };

    PLAYERS.forEach((p) => unsubs.push(attachListener(p.uid)));

    return () => {
      mounted = false;
      unsubs.forEach((fn) => fn && fn());
    };
  }, []);

  useEffect(() => {
    if (picked.length === 2) {
      const [leftDeck, rightDeck] = picked;
      navigation.navigate("Versus", { leftDeck, rightDeck });
      setPicked([]);
    }
  }, [picked, navigation]);

  const grouped = useMemo(() => {
    const byUid = Object.fromEntries(PLAYERS.map((p) => [p.uid, []]));
    for (const d of decks) {
      if (!byUid[d.ownerUid]) byUid[d.ownerUid] = [];
      byUid[d.ownerUid].push(d);
    }

    const sortWithin = (arr) => {
      const withPower = arr.filter((d) => typeof d.power === "number").sort((a, b) => a.power - b.power);
      const withoutPower = arr
        .filter((d) => typeof d.power !== "number")
        .sort((a, b) => (a._t || 0) - (b._t || 0));
      return [...withPower, ...withoutPower];
    };

    return PLAYERS.map((p) => {
      const decksPlayer = sortWithin(byUid[p.uid] || []);
      const activeCount = decksPlayer.filter((d) => !(d.lives <= 0 || d.eliminated)).length; // ✅ cuenta habilitados
      return { player: p, decks: decksPlayer, activeCount };
    });
  }, [decks]);

  const onPickDeck = (deck) => {
    const lives = typeof deck.lives === "number" ? deck.lives : 2;
    const eliminated = lives <= 0 || deck.eliminated;
    if (eliminated) return;

    setPicked((prev) => {
      if (prev.some((p) => p.id === deck.id)) return prev.filter((p) => p.id !== deck.id);
      if (prev.length < 2) return [...prev, deck];
      return [prev[0], deck];
    });
  };

  const doResetTournament = async () => {
    try {
      setResetting(true);

      const batch = writeBatch(db);
      decks.forEach((d) => {
        const ref = doc(db, "decks", d.id);
        batch.update(ref, {
          lives: 2,
          eliminated: false,
          isCurrentChampion: false,
        });
      });

      await batch.commit();

      setPicked([]);
      setResetOpen(false);
    } catch (e) {
      console.log("Error reset torneo:", e);
    } finally {
      setResetting(false);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ gap: 6 }}>
        <Text variant="headlineMedium" style={{ fontWeight: "900" }}>
          Torneo
        </Text>

        {/* ✅ nombre del torneo más grande y protagonista */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons name="sword-cross" size={18} color={theme.colors.primary} />
          <Text variant="titleLarge" style={{ fontWeight: "900", color: theme.colors.onSurface }}>
            SURVIVAL: Extra Life
          </Text>
        </View>

        {picked.length > 0 ? (
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <Chip icon="gesture-tap" compact style={chipStyle} textStyle={chipText}>
              Elegiste {picked.length}/2
            </Chip>
            {picked.map((p) => (
              <Chip key={p.id} compact icon="check" style={chipStyle} textStyle={chipText}>
                {p.name}
              </Chip>
            ))}
          </View>
        ) : null}
      </View>

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
          {/* ✅ “Torneo actual” ahora se ve como header + torneo grande */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="trophy" size={22} color={theme.colors.primary} />

            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: theme.colors.onSurfaceVariant, fontWeight: "800" }}>
                Torneo actual
              </Text>
              <Text style={{ fontWeight: "900", fontSize: 20, color: theme.colors.onSurface }}>
                SURVIVAL: Extra Life
              </Text>
            </View>

            <Chip icon="timer-sand" style={chipStyle} textStyle={chipText}>
              En curso
            </Chip>
          </View>

          {/* ✅ Reglas como acordeón (cerrado por defecto) */}
          <View
            style={{
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <List.Accordion
              title="Reglas"
              expanded={rulesOpen}
              onPress={() => setRulesOpen((v) => !v)}
              left={(props) => <List.Icon {...props} icon="book-open-variant" color={theme.colors.tertiary} />}
              style={{ backgroundColor: theme.colors.surfaceVariant }}
              titleStyle={{ color: theme.colors.onSurface, fontWeight: "900" }}
              rippleColor="rgba(214,179,93,0.18)"
            >
              <View style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons name="check-decagram" size={18} color={theme.colors.tertiary} />
                  <Text>
                    <Text style={{ fontWeight: "900" }}>Ganador sigue</Text>
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons name="heart-multiple" size={18} color={theme.colors.tertiary} />
                  <Text>
                    Cada deck arranca con <Text style={{ fontWeight: "900" }}>2 vidas</Text>. Si pierde una vez, queda con 1 y
                    sigue habilitado.
                  </Text>
                </View>

                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <MaterialCommunityIcons name="calendar-clock" size={18} color={theme.colors.tertiary} />
                  <Text>
                    Máximo <Text style={{ fontWeight: "900" }}>1 semana</Text> para jugar el duelo; si no, descalificación.
                  </Text>
                </View>

                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  <Chip compact icon="check-decagram" style={chipStyle} textStyle={chipText}>
                    Ganador sigue
                  </Chip>
                  <Chip compact icon="heart" style={chipStyle} textStyle={chipText}>
                    2 vidas
                  </Chip>
                  <Chip compact icon="skull" style={chipStyle} textStyle={chipText}>
                    Eliminación al 2° KO
                  </Chip>
                  <Chip compact icon="calendar-clock" style={chipStyle} textStyle={chipText}>
                    1 semana máx.
                  </Chip>
                </View>
              </View>
            </List.Accordion>
          </View>

          <Divider />

          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons name="map-marker-path" size={18} color={theme.colors.primary} />
              <Text style={{ fontWeight: "900" }}>Fixture por jugador (ordenado por fuerza)</Text>
            </View>

            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Tocá 2 decks para abrir el Versus. Dentro de cada bloque se ordenan por fuerza.
            </Text>

            {loading ? (
              <View style={{ paddingVertical: 18, alignItems: "center", gap: 8 }}>
                <ActivityIndicator />
                <Text style={{ color: theme.colors.onSurfaceVariant }}>Cargando decks...</Text>
              </View>
            ) : (
              <View style={{ gap: 14, marginTop: 4 }}>
                {grouped.map(({ player, decks, activeCount }) => (
                  <View key={player.uid} style={{ gap: 10 }}>
                    {/* ✅ count ahora baja cuando un deck se elimina */}
                    <PlayerHeader theme={theme} label={player.label} icon={player.icon} count={activeCount} />

                    {decks.length === 0 ? (
                      <View
                        style={{
                          padding: 12,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: theme.colors.outline,
                          backgroundColor: theme.colors.surfaceVariant,
                        }}
                      >
                        <Text style={{ color: theme.colors.onSurfaceVariant }}>Sin decks cargados todavía.</Text>
                      </View>
                    ) : (
                      <View style={{ gap: 12 }}>
                        {decks.map((d) => {
                          const selected = picked.some((p) => p.id === d.id);
                          return (
                            <StepItem
                              key={d.id}
                              item={d}
                              theme={theme}
                              onPress={() => onPickDeck(d)}
                              selected={selected}
                            />
                          );
                        })}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Botón reinicio abajo del todo */}
          <View style={{ marginTop: 6 }}>
            <Button
              mode="outlined"
              icon="restart"
              onPress={() => setResetOpen(true)}
              disabled={resetting || loading || decks.length === 0}
              style={{ borderRadius: 14 }}
              contentStyle={{ height: 46 }}
              labelStyle={{ fontWeight: "900" }}
            >
              Reiniciar torneo
            </Button>
          </View>
        </Card.Content>
      </Card>

      {/* ✅ Modal reiniciar: colores del theme + menos redondeado */}
      <Portal>
        <Dialog
          visible={resetOpen}
          onDismiss={() => setResetOpen(false)}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12, // menos redondeado
            borderWidth: 1,
            borderColor: theme.colors.outline,
          }}
        >
          <Dialog.Title style={{ fontWeight: "900", color: theme.colors.onSurface }}>
            Reiniciar torneo
          </Dialog.Title>
          <Dialog.Content>
            <View
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                gap: 6,
              }}
            >
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                • Resetear todos los decks a <Text style={{ fontWeight: "900", color: theme.colors.onSurface }}>2 vidas</Text>
              </Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>• Volver a habilitar los eliminados</Text>
              <Text style={{ color: theme.colors.onSurfaceVariant }}>• Quitar la marca de “Ganador sigue”</Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setResetOpen(false)} disabled={resetting} textColor={theme.colors.onSurfaceVariant}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={doResetTournament}
              loading={resetting}
              disabled={resetting}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.surface}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </ScrollView>
  );
}

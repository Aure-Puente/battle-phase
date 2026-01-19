//Importaciones:
import { doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { Button, Card, Chip, Dialog, Portal, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../firebase/firebase";

//JS:
function LivesBadge({ lives = 2, theme }) {
  return (
    <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
      {[1, 2].map((n) => {
        const alive = lives >= n;
        return (
          <View
            key={n}
            style={{
              width: 26,
              height: 26,
              borderRadius: 13,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.outline,
              backgroundColor: alive ? theme.colors.primary : theme.colors.surfaceVariant,
              opacity: alive ? 1 : 0.6,
            }}
          >
            <MaterialCommunityIcons
              name={alive ? "heart" : "heart-outline"}
              size={15}
              color={alive ? theme.colors.onPrimary : theme.colors.onSurfaceVariant}
            />
          </View>
        );
      })}
      <Text style={{ color: theme.colors.onSurfaceVariant }}>{lives}/2</Text>
    </View>
  );
}

function DuelChip({ children, icon, tone = "neutral", theme }) {
  const bg =
    tone === "gold"
      ? "rgba(214, 179, 93, 0.16)"
      : tone === "blue"
      ? "rgba(45, 168, 255, 0.14)"
      : theme.colors.surfaceVariant;

  const border =
    tone === "gold"
      ? "rgba(214, 179, 93, 0.35)"
      : tone === "blue"
      ? "rgba(45, 168, 255, 0.32)"
      : theme.colors.outline;

  const text = theme.colors.onSurface;

  return (
    <Chip
      compact
      icon={icon}
      style={{
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
      }}
      textStyle={{ color: text, fontWeight: "900" }}
    >
      {children}
    </Chip>
  );
}

function DeckSide({ deck, side, selected, theme }) {
  const eliminated = (deck?.lives ?? 2) <= 0 || deck?.eliminated;

  const borderColor = eliminated
    ? theme.colors.outline
    : selected
    ? theme.colors.primary
    : theme.colors.outline;

  const bg = eliminated
    ? theme.colors.surfaceVariant
    : selected
    ? theme.colors.surface
    : theme.colors.surface;

  return (
    <Card
      mode="contained"
      style={{
        backgroundColor: bg,
        borderRadius: 18,
        borderWidth: 2,
        borderColor,
        overflow: "hidden",
        opacity: eliminated ? 0.55 : 1,
      }}
    >
      <Card.Content style={{ paddingVertical: 14, gap: 10 }}>
        {/* Header mini */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <MaterialCommunityIcons
            name={side === "top" ? "chevron-up" : "chevron-down"}
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={{ fontWeight: "900", fontSize: 14, color: theme.colors.onSurfaceVariant }}>
            {deck.ownerLabel}
          </Text>

          {eliminated ? (
            <DuelChip theme={theme} icon="skull" tone="neutral">
              Eliminado
            </DuelChip>
          ) : null}

          {selected ? (
            <View style={{ marginLeft: "auto" }}>
              <DuelChip theme={theme} icon="check" tone="gold">
                Ganador
              </DuelChip>
            </View>
          ) : null}
        </View>

        {/* Row: imagen + info */}
        <View style={{ flexDirection: "row", gap: 25, alignItems: "center" }}>
          {/* Imagen */}
          <View
            style={{
              height: 150,
              width: 140,
              borderRadius: 16,
              overflow: "hidden",
              borderWidth: 1,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surfaceVariant,
              alignItems: "center",
              justifyContent: "center",
              marginTop: 7,
              marginBottom:7
            }}
          >
            {deck.insigniaResolvedUrl ? (
              <Image
                source={{ uri: deck.insigniaResolvedUrl }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="contain"
              />
            ) : (
              <View style={{ alignItems: "center", justifyContent: "center" }}>
                <MaterialCommunityIcons name="image-off-outline" size={24} color={theme.colors.onSurfaceVariant} />
                <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 4, fontSize: 12 }}>
                  Sin insignia
                </Text>
              </View>
            )}
          </View>

          {/* Info */}
          <View style={{ flex: 1, gap: 15 }}>
            <Text style={{ fontWeight: "900", fontSize: 18 }} numberOfLines={1}>
              {deck.name || "Deck"}
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <DuelChip theme={theme} icon="sword" tone="blue">
                {typeof deck.power === "number" ? `Fuerza: ${deck.power}` : "Fuerza: —"}
              </DuelChip>
            </View>

            <LivesBadge lives={deck.lives ?? 2} theme={theme} />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

export default function VersusScreen({ route, navigation }) {
  const theme = useTheme();
  const { leftDeck, rightDeck } = route.params || {};

  const [winnerSide, setWinnerSide] = useState(null); 
  const [saving, setSaving] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);


  const leftEliminated = (leftDeck?.lives ?? 2) <= 0 || leftDeck?.eliminated;
  const rightEliminated = (rightDeck?.lives ?? 2) <= 0 || rightDeck?.eliminated;

  const canPickLeft = !!leftDeck && !leftEliminated;
  const canPickRight = !!rightDeck && !rightEliminated;

  const loserSide = useMemo(() => {
    if (winnerSide === "left") return "right";
    if (winnerSide === "right") return "left";
    return null;
  }, [winnerSide]);

  const onPickWinner = (side) => {
    if (saving) return;
    if (side === "left" && !canPickLeft) return;
    if (side === "right" && !canPickRight) return;

    setWinnerSide(side);
    setConfirmOpen(true);
  };

  const onConfirm = async () => {
    if (!winnerSide) return;

    const winner = winnerSide === "left" ? leftDeck : rightDeck;
    const loser = winnerSide === "left" ? rightDeck : leftDeck;

    if (!winner?.id || !loser?.id) return;

    setSaving(true);
    try {
      const winnerRef = doc(db, "decks", winner.id);
      const loserRef = doc(db, "decks", loser.id);

      await updateDoc(loserRef, {
        lives: increment(-1),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(winnerRef, {
        isCurrentChampion: true,
        updatedAt: serverTimestamp(),
      });

      setConfirmOpen(false);
      navigation.goBack();
    } catch (e) {
      console.log("Error confirm VS:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      <View style={{ flex: 1, justifyContent: "center", gap: 12 }}>
        <Pressable onPress={() => onPickWinner("left")} disabled={!canPickLeft || saving}>
          <DeckSide deck={leftDeck} side="top" selected={winnerSide === "left"} theme={theme} />
        </Pressable>

        {/* VS */}
        <View style={{ alignItems: "center", justifyContent: "center", gap: 8 }}>
          <View
            style={{
              width: 56,
              height: 56,
              borderRadius: 16, 
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surface,
            }}
          >
            <Text style={{ fontWeight: "900", fontSize: 18 }}>VS</Text>
          </View>
        </View>

        {/* BOTTOM deck */}
        <Pressable onPress={() => onPickWinner("right")} disabled={!canPickRight || saving}>
          <DeckSide deck={rightDeck} side="bottom" selected={winnerSide === "right"} theme={theme} />
        </Pressable>

        {/* Info mini */}
        {loserSide ? (
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
            Perdedor:{" "}
            <Text style={{ fontWeight: "900" }}>
              {loserSide === "left" ? leftDeck?.name : rightDeck?.name}
            </Text>{" "}
            → pierde 1 vida.
          </Text>
        ) : null}
      </View>

      <Portal>
        <Dialog
          visible={confirmOpen}
          onDismiss={() => setConfirmOpen(false)}
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12, 
            borderWidth: 1,
            borderColor: theme.colors.outline,
          }}
        >
          <Dialog.Title style={{ fontWeight: "900", color: theme.colors.onSurface }}>
            Confirmar ganador
          </Dialog.Title>

          <Dialog.Content>
            <View
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                gap: 8,
              }}
            >
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Ganador:{" "}
                <Text style={{ fontWeight: "900", color: theme.colors.onSurface }}>
                  {winnerSide === "left" ? leftDeck?.name : rightDeck?.name}
                </Text>
              </Text>

              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Perdedor:{" "}
                <Text style={{ fontWeight: "900", color: theme.colors.onSurface }}>
                  {winnerSide === "left" ? rightDeck?.name : leftDeck?.name}
                </Text>{" "}
                <Text style={{ color: theme.colors.onSurfaceVariant }}>(pierde 1 vida)</Text>
              </Text>
            </View>
          </Dialog.Content>

          <Dialog.Actions>
            <Button onPress={() => setConfirmOpen(false)} disabled={saving} textColor={theme.colors.onSurfaceVariant}>
              Cancelar
            </Button>
            <Button
              mode="contained"
              onPress={onConfirm}
              loading={saving}
              disabled={saving}
              buttonColor={theme.colors.primary}
              textColor={theme.colors.surface}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

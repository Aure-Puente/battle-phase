//Importaciones:
import { doc, increment, serverTimestamp, updateDoc } from "firebase/firestore";
import { useMemo, useState } from "react";
import { Image, Pressable, View } from "react-native";
import { Button, Card, Chip, Dialog, Portal, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../firebase/firebase";

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

const getRangeMeta = (deck) => {
  const key = deck?.rango || null;
  const found = key ? RANGES.find((r) => r.key === key) : null;
  if (found) return found;

  if (deck?.rangoLabel || deck?.rangoColor) {
    return {
      key: key || "CUSTOM",
      label: deck?.rangoLabel || "Rango",
      color: deck?.rangoColor || "#6B7280",
    };
  }

  return null;
};

const getRangeChipStyle = (theme, rangeColor) => {
  const bg = mixHex(theme.colors.surfaceVariant, rangeColor, 0.18);
  const border = mixHex(theme.colors.outline, rangeColor, 0.35);
  return { bg, border };
};

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

  const rangeMeta = getRangeMeta(deck);
  const rangeLabel = rangeMeta?.label || "—";
  const rangeColor = rangeMeta?.color || theme.colors.onSurfaceVariant;
  const rangeChip = rangeMeta ? getRangeChipStyle(theme, rangeColor) : null;

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

        <View style={{ flexDirection: "row", gap: 25, alignItems: "center" }}>
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
              marginBottom: 7,
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

          <View style={{ flex: 1, gap: 15 }}>
            <Text style={{ fontWeight: "900", fontSize: 18 }} numberOfLines={1}>
              {deck.name || "Deck"}
            </Text>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
              <Chip
                compact
                icon={() => (
                  <View style={{ width: 18, height: 18, alignItems: "center", justifyContent: "center" }}>
                    <MaterialCommunityIcons
                      name="shield-star-outline"
                      size={14}
                      color={rangeColor}
                      style={{ marginTop: 1 }}
                    />
                  </View>
                )}
                style={{
                  backgroundColor: rangeMeta ? rangeChip.bg : theme.colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: rangeMeta ? rangeChip.border : theme.colors.outline,
                  height: 28,
                }}
                contentStyle={{
                  height: 28,
                  paddingHorizontal: 8,
                  alignItems: "center",
                  justifyContent: "center",
                }}
                textStyle={{ color: theme.colors.onSurface, fontWeight: "900", fontSize: 12, lineHeight: 14 }}
              >
                {rangeLabel}
              </Chip>
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

        <Pressable onPress={() => onPickWinner("right")} disabled={!canPickRight || saving}>
          <DeckSide deck={rightDeck} side="bottom" selected={winnerSide === "right"} theme={theme} />
        </Pressable>

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

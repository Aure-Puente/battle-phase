import { useEffect, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Card, Chip, List, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../firebase/firebase";

const PLAYERS = [
  { key: "benja", label: "Benja", uid: "VTo2TZ93t7WQANYP9Fao2sFEops1" },
  { key: "aure", label: "Aure", uid: "sW53hw9EdVXDIJMI3BnPTcYRbAn1" },
  { key: "rami", label: "Rami", uid: "mFXk9M3WnOgTvtSnjlUQqz1TDsa2" },
];

const ROTATION = ["benja", "aure", "rami"]; // ✅ orden fijo para “quién sigue” según tu ejemplo

function msToClock(ms) {
  const total = Math.max(0, ms);
  const s = Math.floor(total / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const pad = (n) => String(n).padStart(2, "0");
  return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
}

export default function InicioScreen() {
  const theme = useTheme();

  const chipStyle = {
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  };
  const chipText = { color: theme.colors.onSurface, fontWeight: "900" };

  const playersByUid = useMemo(
    () => Object.fromEntries(PLAYERS.map((p) => [p.uid, p])),
    []
  );
  const playersByKey = useMemo(
    () => Object.fromEntries(PLAYERS.map((p) => [p.key, p])),
    []
  );

  const [decks, setDecks] = useState([]);
  const [matches, setMatches] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [historyOpen, setHistoryOpen] = useState(false);

  // ⏱ ticker para countdown
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // 🔥 traer decks de los 3 usuarios
  useEffect(() => {
    const unsubs = [];

    for (const p of PLAYERS) {
      const q = query(collection(db, "decks"), where("ownerUid", "==", p.uid));
      unsubs.push(
        onSnapshot(q, (snap) => {
          setDecks((prev) => {
            const map = new Map(prev.map((d) => [d.id, d]));

            // borra los del owner y vuelve a poner los actuales
            // (simple y estable para 3 jugadores)
            for (const [id, d] of map.entries()) {
              if (d.ownerUid === p.uid) map.delete(id);
            }

            snap.docs.forEach((docu) => {
              const x = docu.data() || {};
              map.set(docu.id, {
                id: docu.id,
                ownerUid: x.ownerUid,
                ownerLabel: playersByUid[x.ownerUid]?.label || "Jugador",
                name: x.name ?? x.nombre ?? "Deck",
                power:
                  typeof x.power === "number"
                    ? x.power
                    : typeof x.fuerza === "number"
                    ? x.fuerza
                    : null,
                lives: typeof x.lives === "number" ? x.lives : 2,
                eliminated: !!x.eliminated,
                isCurrentChampion: !!x.isCurrentChampion,
                insigniaResolvedUrl: x.insigniaResolvedUrl ?? x.insigniaUrl ?? null, // si ya guardás URL
                updatedAt: x.updatedAt?.toMillis?.() ?? null,
              });
            });

            return Array.from(map.values());
          });
        })
      );
    }

    return () => unsubs.forEach((u) => u && u());
  }, [playersByUid]);

  // 🔥 traer historial (últimos 20). Si no existe la colección, queda vacío.
  useEffect(() => {
    const q = query(
      collection(db, "matches"),
      orderBy("finishedAt", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setMatches(
          snap.docs.map((d) => {
            const x = d.data() || {};
            return {
              id: d.id,
              finishedAt: x.finishedAt?.toMillis?.() ?? null,
              leftOwner: x.leftOwnerLabel ?? "—",
              leftDeck: x.leftDeckName ?? "—",
              rightOwner: x.rightOwnerLabel ?? "—",
              rightDeck: x.rightDeckName ?? "—",
              winnerOwner: x.winnerOwnerLabel ?? "—",
              winnerDeck: x.winnerDeckName ?? "—",
            };
          })
        );
      },
      () => setMatches([])
    );

    return () => unsub && unsub();
  }, []);

  // ✅ helpers
  const activeDecks = useMemo(() => {
    return decks.filter((d) => !(d.lives <= 0 || d.eliminated));
  }, [decks]);

  const weakestDeckByOwnerUid = (uid) => {
    const list = activeDecks.filter((d) => d.ownerUid === uid);

    const withPower = list.filter((d) => typeof d.power === "number").sort((a, b) => a.power - b.power);
    const withoutPower = list.filter((d) => typeof d.power !== "number");
    return withPower[0] || withoutPower[0] || null;
  };

  // ✅ campeón actual (si hay)
  const champion = useMemo(() => {
    const champs = activeDecks.filter((d) => d.isCurrentChampion);
    if (champs.length === 0) return null;
    // si hubiera varios, nos quedamos con el más reciente
    champs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return champs[0];
  }, [activeDecks]);

  // ✅ próxima pelea según regla + rotación
  const nextFight = useMemo(() => {
    // start: benja vs aure
    if (!champion) {
      const b = weakestDeckByOwnerUid(playersByKey.benja.uid);
      const a = weakestDeckByOwnerUid(playersByKey.aure.uid);
      if (b && a) return { a: b, b: a, note: "Inicio: Benja vs Aure (más débiles)" };
      // fallback: si falta alguno, agarra los dos primeros activos que haya
      const any = activeDecks.slice(0, 2);
      if (any.length === 2) return { a: any[0], b: any[1], note: "Inicio (fallback)" };
      return null;
    }

    // challenger = siguiente en rotación luego del dueño del campeón
    const champPlayerKey =
      PLAYERS.find((p) => p.uid === champion.ownerUid)?.key || null;

    if (!champPlayerKey) return null;

    let idx = ROTATION.indexOf(champPlayerKey);
    if (idx < 0) idx = 0;

    // buscamos siguiente jugador con decks activos
    for (let step = 1; step <= ROTATION.length; step++) {
      const challengerKey = ROTATION[(idx + step) % ROTATION.length];
      const challengerUid = playersByKey[challengerKey]?.uid;
      const challengerDeck = challengerUid ? weakestDeckByOwnerUid(challengerUid) : null;

      if (challengerDeck) {
        return {
          a: champion,
          b: challengerDeck,
          note: `Ganador sigue: ${champion.ownerLabel} (vs ${playersByKey[challengerKey].label})`,
        };
      }
    }

    return null;
  }, [champion, activeDecks, playersByKey]);

  // ✅ deadline 7 días desde el último match
  const lastMatch = matches[0] || null;
  const deadlineMs = lastMatch?.finishedAt ? lastMatch.finishedAt + 7 * 24 * 60 * 60 * 1000 : null;
  const remainingMs = deadlineMs ? deadlineMs - now : null;
  

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text variant="headlineLarge" style={{ fontWeight: "900" }}>
          Inicio
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons name="sword-cross" size={18} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            SURVIVAL: Extra Life
          </Text>
        </View>
      </View>

      {/* Estado del torneo */}
      <Card mode="contained" style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.colors.outline }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="trophy" size={22} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              Estado del torneo
            </Text>

            <Chip compact style={[chipStyle, { marginLeft: "auto" }]} textStyle={chipText} icon="clock-outline">
              En vivo
            </Chip>
          </View>

          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            3 jugadores • Cada deck tiene <Text style={{ fontWeight: "900" }}>2 vidas</Text> • Ganador sigue
          </Text>
        </Card.Content>
      </Card>

      {/* Próxima pelea + regla 7 días */}
      <Card mode="contained" style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.colors.outline }}>
        <Card.Content style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="sword-cross" size={22} color={theme.colors.tertiary} />
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              Siguiente pelea
            </Text>
          </View>

          {!nextFight ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              No hay suficientes decks activos para armar la próxima pelea.
            </Text>
          ) : (
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
                gap: 10,
              }}
            >
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                {nextFight.note}
              </Text>

              <Text style={{ fontWeight: "900", fontSize: 18 }}>
                {nextFight.a.ownerLabel} — “{nextFight.a.name}”
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Chip icon="heart" compact style={chipStyle} textStyle={chipText}>
                  Vidas: {nextFight.a.lives}
                </Chip>
                <Chip icon="sword" compact style={chipStyle} textStyle={chipText}>
                  Fuerza: {typeof nextFight.a.power === "number" ? nextFight.a.power : "—"}
                </Chip>
              </View>

              <View style={{ height: 1, backgroundColor: theme.colors.outline, opacity: 0.6 }} />

              <Text style={{ fontWeight: "900", fontSize: 18 }}>
                {nextFight.b.ownerLabel} — “{nextFight.b.name}”
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <Chip icon="heart" compact style={chipStyle} textStyle={chipText}>
                  Vidas: {nextFight.b.lives}
                </Chip>
                <Chip icon="sword" compact style={chipStyle} textStyle={chipText}>
                  Fuerza: {typeof nextFight.b.power === "number" ? nextFight.b.power : "—"}
                </Chip>
              </View>

              {/* Regla 7 días + countdown */}
              <View style={{ marginTop: 6, gap: 6 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <MaterialCommunityIcons name="calendar-clock" size={18} color={theme.colors.primary} />
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Regla 7 días: máximo 1 semana para jugar (si no, descalificación).
                  </Text>
                </View>

                {deadlineMs ? (
                  <Chip
                    compact
                    icon="timer-sand"
                    style={chipStyle}
                    textStyle={chipText}
                  >
                    Tiempo restante: {msToClock(remainingMs)}
                  </Chip>
                ) : (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    (Para activar la cuenta regresiva, guardá los duelos en “matches”.)
                  </Text>
                )}
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Historial desplegable */}
      <View
        style={{
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surface,
        }}
      >
        <List.Accordion
          title="Historial"
          expanded={historyOpen}
          onPress={() => setHistoryOpen((v) => !v)}
          left={(props) => <List.Icon {...props} icon="history" color={theme.colors.primary} />}
          style={{ backgroundColor: theme.colors.surface }}
          titleStyle={{ color: theme.colors.onSurface, fontWeight: "900" }}
          rippleColor="rgba(214,179,93,0.18)"
        >
          <View style={{ padding: 14, gap: 10, backgroundColor: theme.colors.surfaceVariant }}>
            {matches.length === 0 ? (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Todavía no hay duelos guardados.
              </Text>
            ) : (
              matches.map((m) => (
                <View
                  key={m.id}
                  style={{
                    padding: 12,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: theme.colors.outline,
                    backgroundColor: theme.colors.surface,
                    gap: 6,
                  }}
                >
                  <Text style={{ fontWeight: "900" }}>
                    {m.leftOwner} “{m.leftDeck}” vs {m.rightOwner} “{m.rightDeck}”
                  </Text>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>
                    Ganó: <Text style={{ fontWeight: "900" }}>{m.winnerOwner}</Text> — “{m.winnerDeck}”
                  </Text>
                </View>
              ))
            )}
          </View>
        </List.Accordion>
      </View>
    </ScrollView>
  );
}

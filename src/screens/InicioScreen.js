//Importaciones:
import { signOut } from "firebase/auth";
import { collection, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { Button, Card, Chip, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { auth, db } from "../firebase/firebase";

//JS:
const PLAYERS = [
  { key: "benja", label: "Benja", uid: "VTo2TZ93t7WQANYP9Fao2sFEops1" },
  { key: "aure", label: "Aure", uid: "sW53hw9EdVXDIJMI3BnPTcYRbAn1" },
  { key: "rami", label: "Rami", uid: "mFXk9M3WnOgTvtSnjlUQqz1TDsa2" },
];

const TOURNAMENT_DOC = { col: "tournaments", id: "survival_extra_life" };

function compareDeck(a, b) {
  const la = typeof a.lives === "number" ? a.lives : 2;
  const lb = typeof b.lives === "number" ? b.lives : 2;
  if (la !== lb) return la - lb;

  const pa = typeof a.power === "number" ? a.power : Number.POSITIVE_INFINITY;
  const pb = typeof b.power === "number" ? b.power : Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;

  return String(a.name || "").localeCompare(String(b.name || ""));
}

function DeckThumb({ uri, theme }) {
  return (
    <View
      style={{
        width: 100,
        height: 100,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: theme.colors.outline,
        backgroundColor: theme.colors.surface,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
      ) : (
        <MaterialCommunityIcons name="image-off-outline" size={22} color={theme.colors.onSurfaceVariant} />
      )}
    </View>
  );
}

export default function InicioScreen({ navigation }) {
  const theme = useTheme();

  const chipStyle2 = {
    backgroundColor: theme.colors.surfaceVariant,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  };

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
  const [tournament, setTournament] = useState({
    lastChampionUid: null,
    lastOpponentUid: null,
    deadlineAt: null, // ms
  });

  const [timerError, setTimerError] = useState("");
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const msToClock = (ms) => {
    const total = Math.max(0, ms);
    const s = Math.floor(total / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    const pad = (n) => String(n).padStart(2, "0");
    return `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`;
  };

  const startDuelTimer = async () => {
    setTimerError("");
    const deadlineMs = Date.now() + 7 * 24 * 60 * 60 * 1000;
    setTournament((t) => ({ ...t, deadlineAt: deadlineMs }));

    try {
      await setDoc(
        doc(db, TOURNAMENT_DOC.col, TOURNAMENT_DOC.id),
        { deadlineAt: new Date(deadlineMs) },
        { merge: true }
      );
    } catch (e) {
      console.log("Error set deadlineAt:", e);
      setTournament((t) => ({ ...t, deadlineAt: null }));
      setTimerError("No se pudo iniciar el timer (revisá reglas de Firestore).");
    }
  };

    const stopDuelTimer = async () => {
    setTimerError("");

    setTournament((t) => ({ ...t, deadlineAt: null }));

    try {
      await setDoc(
        doc(db, TOURNAMENT_DOC.col, TOURNAMENT_DOC.id),
        { deadlineAt: null },
        { merge: true }
      );
    } catch (e) {
      console.log("Error stop deadlineAt:", e);
      setTimerError("No se pudo detener el timer (revisá reglas de Firestore).");
    }
  };


  const onLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Error signOut:", e);
    }
  };

  useEffect(() => {
    const unsubs = [];

    for (const p of PLAYERS) {
      const q = query(collection(db, "decks"), where("ownerUid", "==", p.uid));
      unsubs.push(
        onSnapshot(q, (snap) => {
          setDecks((prev) => {
            const map = new Map(prev.map((d) => [d.id, d]));

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
                insigniaResolvedUrl: x.insigniaResolvedUrl ?? x.insigniaUrl ?? null,
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

  useEffect(() => {
    const ref = doc(db, TOURNAMENT_DOC.col, TOURNAMENT_DOC.id);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const x = snap.data() || {};
        setTournament((t) => ({
          ...t,
          lastChampionUid: x.lastChampionUid ?? null,
          lastOpponentUid: x.lastOpponentUid ?? null,
          deadlineAt: x.deadlineAt?.toMillis?.() ?? null,
        }));
      },
      () =>
        setTournament((t) => ({
          ...t,
          lastChampionUid: null,
          lastOpponentUid: null,
        }))
    );
    return () => unsub && unsub();
  }, []);

  const aliveDecks = useMemo(() => {
    return decks.filter((d) => (typeof d.lives === "number" ? d.lives : 2) > 0);
  }, [decks]);

  const aliveCountByUid = useMemo(() => {
    const m = new Map();
    for (const p of PLAYERS) m.set(p.uid, 0);
    for (const d of aliveDecks) m.set(d.ownerUid, (m.get(d.ownerUid) || 0) + 1);
    return m;
  }, [aliveDecks]);

  const advantage = useMemo(() => {
    const counts = PLAYERS.map((p) => ({
      uid: p.uid,
      label: p.label,
      count: aliveCountByUid.get(p.uid) || 0,
    }));
    const max = Math.max(...counts.map((c) => c.count));
    const leaders = counts.filter((c) => c.count === max);
    if (leaders.length === 1) return leaders[0];
    return null;
  }, [aliveCountByUid]);

  const aliveByUid = useMemo(() => {
    const m = new Map();
    for (const d of aliveDecks) {
      if (!m.has(d.ownerUid)) m.set(d.ownerUid, []);
      m.get(d.ownerUid).push(d);
    }
    for (const [uid, list] of m.entries()) {
      list.sort(compareDeck);
      m.set(uid, list);
    }
    return m;
  }, [aliveDecks]);

  const pickDeckForPlayer = (uid) => {
    const list = aliveByUid.get(uid) || [];
    return list[0] || null;
  };

  const champion = useMemo(() => {
    const champs = aliveDecks.filter((d) => d.isCurrentChampion);
    if (champs.length === 0) return null;
    champs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return champs[0];
  }, [aliveDecks]);

  const alivePlayers = useMemo(() => {
    return PLAYERS.filter((p) => (aliveByUid.get(p.uid) || []).length > 0);
  }, [aliveByUid]);

  const prevOpponentUid = useMemo(() => {
    if (!champion) return null;

    if (
      tournament.lastChampionUid === champion.ownerUid &&
      tournament.lastOpponentUid &&
      tournament.lastOpponentUid !== champion.ownerUid
    ) {
      return tournament.lastOpponentUid;
    }

    const others = decks
      .filter((d) => d.ownerUid !== champion.ownerUid && d.updatedAt)
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    return others[0]?.ownerUid || null;
  }, [champion, tournament.lastChampionUid, tournament.lastOpponentUid, decks]);

  const nextFight = useMemo(() => {
    if (alivePlayers.length < 2) return null;

    if (!champion) {
      const b = pickDeckForPlayer(playersByKey.benja.uid);
      const a = pickDeckForPlayer(playersByKey.aure.uid);
      if (b && a) return { a: b, b: a, note: "Inicio: Benja vs Aure" };

      const d1 = pickDeckForPlayer(alivePlayers[0].uid);
      const d2 = pickDeckForPlayer(alivePlayers[1].uid);
      if (d1 && d2) return { a: d1, b: d2, note: "Inicio" };
      return null;
    }

    const champUid = champion.ownerUid;

    if (alivePlayers.length >= 3 && prevOpponentUid) {
      const third = alivePlayers.find((p) => p.uid !== champUid && p.uid !== prevOpponentUid);
      if (third) {
        const challengerDeck = pickDeckForPlayer(third.uid);
        if (challengerDeck) {
          return {
            a: champion,
            b: challengerDeck,
            note: `Ganador sigue: ${champion.ownerLabel} vs ${third.label}`,
          };
        }
      }
    }

    const other = alivePlayers.find((p) => p.uid !== champUid);
    if (other) {
      const challengerDeck = pickDeckForPlayer(other.uid);
      if (challengerDeck) {
        return {
          a: champion,
          b: challengerDeck,
          note: `Ganador sigue: ${champion.ownerLabel} vs ${other.label}`,
        };
      }
    }

    return null;
  }, [alivePlayers, champion, prevOpponentUid, playersByKey, aliveByUid]);

  const remainingMs = tournament.deadlineAt ? tournament.deadlineAt - now : null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header + Logout */}
      <View style={{ gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text variant="headlineLarge" style={{ fontWeight: "900", flex: 1 }}>
            Inicio
          </Text>

          <Button
            mode="outlined"
            onPress={onLogout}
            compact
            icon={({ color, size }) => (
              <MaterialCommunityIcons name="logout" color={color} size={18} />
            )}
            style={{ borderRadius: 14, borderWidth: 1, borderColor: theme.colors.outline }}
            contentStyle={{ height: 36 }}
            labelStyle={{ fontWeight: "900" }}
          >
            Salir
          </Button>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons name="sword-cross" size={18} color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>SURVIVAL: Extra Life</Text>
        </View>
      </View>

      {/* Decks restantes + ventaja */}
      <Card mode="contained" style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.colors.outline }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="cards" size={22} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              Decks restantes
            </Text>
          </View>

          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {PLAYERS.map((p) => (
              <Chip key={p.uid} compact style={chipStyle2} textStyle={chipText}>
                {p.label}: {aliveCountByUid.get(p.uid) || 0}
              </Chip>
            ))}
          </View>

          {advantage ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="crown" size={18} color={theme.colors.primary} />
              <Text style={{ color: theme.colors.onSurfaceVariant }}>
                Ventaja:{" "}
                <Text style={{ fontWeight: "900", color: theme.colors.onSurface }}>
                  {advantage.label}
                </Text>
              </Text>
            </View>
          ) : null}
        </Card.Content>
      </Card>

      {/* Timer del duelo */}
      <Card mode="contained" style={{ borderRadius: 18, borderWidth: 1, borderColor: theme.colors.outline }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons name="calendar-clock" size={22} color={theme.colors.primary} />
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              Tiempo del duelo
            </Text>

            <Chip compact style={[chipStyle, { marginLeft: "auto" }]} textStyle={chipText} icon="timer-sand">
              7 días
            </Chip>
          </View>

          {tournament.deadlineAt ? (
            <Chip compact icon="timer-sand" style={chipStyle} textStyle={chipText}>
              Tiempo restante: {msToClock(remainingMs)}
            </Chip>
          ) : (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>No iniciado</Text>
          )}

          {timerError ? (
            <Text style={{ color: theme.colors.onSurfaceVariant }}>{timerError}</Text>
          ) : null}

          <Chip
            compact
            icon="play-circle-outline"
            style={chipStyle2}
            textStyle={chipText}
            onPress={startDuelTimer}
          >
            Iniciar / Reiniciar
          </Chip>
          {tournament.deadlineAt ? (
          <Chip
            compact
            icon="stop-circle-outline"
            style={chipStyle}
            textStyle={chipText}
            onPress={stopDuelTimer}
          >
            Detener cuenta regresiva
          </Chip>
        ) : null}
        </Card.Content>
      </Card>

      {/* Siguiente pelea */}
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
              No hay suficientes decks vivos para armar la próxima pelea.
            </Text>
          ) : (
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
                gap: 12,
              }}
            >
              <Text style={{ color: theme.colors.onSurfaceVariant }}>{nextFight.note}</Text>

              {/* Deck A */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <DeckThumb uri={nextFight.a.insigniaResolvedUrl} theme={theme} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ fontWeight: "900", fontSize: 18 }} numberOfLines={1}>
                    “{nextFight.a.name}”
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                    <Chip icon="heart" compact style={chipStyle} textStyle={chipText}>
                      Vidas: {nextFight.a.lives}
                    </Chip>
                    <Chip icon="sword" compact style={chipStyle} textStyle={chipText}>
                      Fuerza: {typeof nextFight.a.power === "number" ? nextFight.a.power : "—"}
                    </Chip>
                  </View>
                </View>
              </View>
                <View
                  style={{
                    width: "100%",  
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 10,
                    marginVertical: 6,
                  }}
                >
                  {/* Línea izquierda */}
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: theme.colors.primary,
                      opacity: 0.7,
                    }}
                  />

                  {/* Caja VS */}
                  <View
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 1,
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    <Text style={{ fontWeight: "900", fontSize: 16 }}>VS</Text>
                  </View>

                  {/* Línea derecha */}
                  <View
                    style={{
                      flex: 1,
                      height: 1,
                      backgroundColor: theme.colors.primary,
                      opacity: 0.7,
                    }}
                  />
                </View>
              {/* Deck B */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <DeckThumb uri={nextFight.b.insigniaResolvedUrl} theme={theme} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={{ fontWeight: "900", fontSize: 18 }} numberOfLines={1}>
                    “{nextFight.b.name}”
                  </Text>
                  <View style={{ flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                    <Chip icon="heart" compact style={chipStyle} textStyle={chipText}>
                      Vidas: {nextFight.b.lives}
                    </Chip>
                    <Chip icon="sword" compact style={chipStyle} textStyle={chipText}>
                      Fuerza: {typeof nextFight.b.power === "number" ? nextFight.b.power : "—"}
                    </Chip>
                  </View>
                </View>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

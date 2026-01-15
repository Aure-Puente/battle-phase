import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { Card, Chip, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../firebase/firebase";

/**
 * ✅ Reemplazá estos UID por los reales
 * (los mismos que usás en DecksScreen)
 */
const PLAYERS = [
  { key: "aure", label: "Aure", uid: "sW53hw9EdVXDIJMI3BnPTcYRbAn1" },
  { key: "rami", label: "Rami", uid: "mFXk9M3WnOgTvtSnjlUQqz1TDsa2" },
  { key: "benja", label: "Benja", uid: "VTo2TZ93t7WQANYP9Fao2sFEops1" },
];

const clamp01 = (n) => Math.max(0, Math.min(1, n));

export default function EstadisticasScreen() {
  const theme = useTheme();

  const [decks, setDecks] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ listener en tiempo real de TODOS los decks
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

  // ✅ stats por jugador (promedio de fuerza)
  const stats = useMemo(() => {
    const byUid = new Map();
    PLAYERS.forEach((p) => {
      byUid.set(p.uid, {
        uid: p.uid,
        label: p.label,
        totalDecks: 0,
        decksConFuerza: 0,
        sumFuerza: 0,
        avg: 0,
      });
    });

    for (const d of decks) {
      const uid = d?.ownerUid;
      if (!uid || !byUid.has(uid)) continue;

      const row = byUid.get(uid);
      row.totalDecks += 1;

      const n = Number(d?.fuerza);
      if (Number.isFinite(n)) {
        row.decksConFuerza += 1;
        row.sumFuerza += n;
      }
    }

    // calcular promedios
    const result = PLAYERS.map((p) => {
      const row = byUid.get(p.uid);
      const avg = row.decksConFuerza > 0 ? row.sumFuerza / row.decksConFuerza : 0;
      return {
        ...row,
        avg,
      };
    });

    return result;
  }, [decks]);

  // ✅ para barras: asumimos fuerza 0..10 (como dijiste)
  const maxScale = 10;

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        gap: 14,
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text variant="headlineMedium" style={{ fontWeight: "800" }}>
          Estadísticas
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons
            name="chart-bar"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Promedio de fuerza por jugador (en vivo)
          </Text>
        </View>
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
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons
              name="calculator-variant"
              size={22}
              color={theme.colors.primary}
            />
            <Text variant="titleLarge" style={{ fontWeight: "800" }}>
              Resumen
            </Text>

            <Chip
              icon={loading ? "progress-clock" : "check-circle-outline"}
              style={{
                marginLeft: "auto",
                backgroundColor: theme.colors.surfaceVariant,
              }}
              textStyle={{ color: theme.colors.onSurface }}
            >
              {loading ? "Cargando..." : "Actualizado"}
            </Chip>
          </View>

          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Se promedia la fuerza de los decks de cada jugador. Si un deck no tiene
            fuerza cargada, no cuenta para el promedio.
          </Text>

          {/* Gráfico dinámico */}
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              padding: 14,
              gap: 12,
              backgroundColor: theme.colors.surfaceVariant,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons
                name="chart-bar-stacked"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={{ fontWeight: "800" }}>Promedio de fuerza (0 a 10)</Text>
            </View>

            {stats.map((row) => {
              const pct = clamp01(row.avg / maxScale);
              const widthPct = `${Math.round(pct * 100)}%`;

              return (
                <View key={row.uid} style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Text style={{ fontWeight: "900", flex: 1 }}>{row.label}</Text>
                    <Text style={{ color: theme.colors.onSurfaceVariant }}>
                      {row.avg.toFixed(1)} / 10
                    </Text>
                  </View>

                  <View
                    style={{
                      height: 12,
                      borderRadius: 999,
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.outline,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: widthPct,
                        backgroundColor: theme.colors.primary,
                        opacity: 0.9,
                      }}
                    />
                  </View>

                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 12 }}>
                    Decks: {row.totalDecks}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

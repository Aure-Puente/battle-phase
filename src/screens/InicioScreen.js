import { ScrollView, View } from "react-native";
import { Card, Chip, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function InicioScreen() {
  const theme = useTheme();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 12 }}
    >
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text variant="headlineLarge" style={{ fontWeight: "900" }}>
          Inicio
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons
            name="hammer-wrench"
            size={18}
            color={theme.colors.onSurfaceVariant}
          />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Sección en construcción
          </Text>
        </View>
      </View>

      {/* Estado del torneo */}
      <Card mode="contained" style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons
              name="trophy"
              size={22}
              color={theme.colors.primary}
            />
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              Estado del torneo
            </Text>

            <Chip
              compact
              style={{ marginLeft: "auto" }}
              textStyle={{ fontWeight: "800" }}
              icon="clock-outline"
            >
              En vivo
            </Chip>
          </View>

          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Formato: <Text style={{ fontWeight: "900" }}>Survival</Text> •
            3 jugadores • Cada deck tiene{" "}
            <Text style={{ fontWeight: "900" }}>2 vidas</Text>.
          </Text>
        </Card.Content>
      </Card>

      {/* Próxima pelea */}
      <Card mode="contained" style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons
              name="sword-cross"
              size={22}
              color={theme.colors.tertiary}
            />
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              Próxima pelea
            </Text>
            <Chip
              compact
              style={{ marginLeft: "auto" }}
              textStyle={{ fontWeight: "800" }}
              icon="progress-clock"
            >
              Próximamente
            </Chip>
          </View>

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
            <Text style={{ fontWeight: "900", fontSize: 18 }}>
              Benja — Deck “Mago Oscuro”
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Chip icon="heart" compact>
                Vidas: 2
              </Chip>
              <Chip icon="sword" compact>
                Fuerza: 8
              </Chip>
            </View>

            <View
              style={{
                height: 1,
                backgroundColor: theme.colors.outline,
                opacity: 0.6,
              }}
            />

            <Text style={{ fontWeight: "900", fontSize: 18 }}>
              Aure — Deck “Tenyi”
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Chip icon="heart" compact>
                Vidas: 1
              </Chip>
              <Chip icon="sword" compact>
                Fuerza: 5
              </Chip>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Pelea anterior */}
      <Card mode="contained" style={{ borderRadius: 18 }}>
        <Card.Content style={{ gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons
              name="history"
              size={22}
              color={theme.colors.primary}
            />
            <Text variant="titleLarge" style={{ fontWeight: "900" }}>
              Pelea anterior
            </Text>
            <Chip
              compact
              style={{ marginLeft: "auto" }}
              textStyle={{ fontWeight: "800" }}
              icon="check-circle-outline"
            >
              Finalizada
            </Chip>
          </View>

          <View
            style={{
              padding: 14,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surfaceVariant,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "900" }}>
              Rami — “Ojos Azúles” vs Benja — “Mago Oscuro”
            </Text>
            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Ganó: <Text style={{ fontWeight: "900" }}>Benja</Text> • Vidas
              restantes (deck ganador):{" "}
              <Text style={{ fontWeight: "900" }}>2</Text>
            </Text>
          </View>

          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            *Más adelante esto va a venir del historial (Firestore) y se va a
            ver con detalles.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

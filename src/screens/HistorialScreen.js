import { View } from "react-native";
import { Card, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function HistorialScreen() {
  const theme = useTheme();

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
          Historial
        </Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons
            name="hammer-wrench"
            size={18}
            color={theme.colors.primary}
          />
          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Sección en construcción
          </Text>
        </View>
      </View>

      {/* Card principal */}
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
              name="history"
              size={22}
              color={theme.colors.primary}
            />
            <Text variant="titleLarge" style={{ fontWeight: "800" }}>
              Resumen de torneos
            </Text>
          </View>

          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Acá vamos a guardar el historial de copas y torneos jugados, y el deck
            ganador de cada torneo.
          </Text>

          {/* “Qué va a mostrar” */}
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
              <MaterialCommunityIcons
                name="trophy"
                size={18}
                color={theme.colors.tertiary}
              />
              <Text>
                <Text style={{ fontWeight: "800" }}>Copas:</Text> total por jugador
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons
                name="calendar-check"
                size={18}
                color={theme.colors.tertiary}
              />
              <Text>
                <Text style={{ fontWeight: "800" }}>Torneos jugados:</Text> cantidad por jugador
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons
                name="cards"
                size={18}
                color={theme.colors.tertiary}
              />
              <Text>
                <Text style={{ fontWeight: "800" }}>Deck ganador:</Text> nombre del deck + jugador
              </Text>
            </View>
          </View>

          {/* Placeholder visual */}
          <View
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              padding: 14,
              gap: 10,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={20}
                color={theme.colors.primary}
              />
              <Text style={{ fontWeight: "800" }}>Últimos torneos (próximamente)</Text>
            </View>

            <Text style={{ color: theme.colors.onSurfaceVariant }}>
              Acá se listarán los torneos finalizados con fecha, campeón y deck ganador.
            </Text>

            {/* “Items fake” para estética */}
            {[
              { title: "Torneo #1", sub: "Campeón: — | Deck: —" },
              { title: "Torneo #2", sub: "Campeón: — | Deck: —" },
              { title: "Torneo #3", sub: "Campeón: — | Deck: —" },
            ].map((it) => (
              <View
                key={it.title}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  backgroundColor: theme.colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  gap: 4,
                }}
              >
                <Text style={{ fontWeight: "800" }}>{it.title}</Text>
                <Text style={{ color: theme.colors.onSurfaceVariant }}>{it.sub}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

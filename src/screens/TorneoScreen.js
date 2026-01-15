import { View } from "react-native";
import { Card, Chip, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

export default function TorneoScreen() {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        gap: 14,
        backgroundColor: theme.colors.background, // azul oscuro del theme
      }}
    >
      {/* Header */}
      <View style={{ gap: 6 }}>
        <Text variant="headlineMedium" style={{ fontWeight: "800" }}>
          Torneo
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
          {/* Título + chip */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialCommunityIcons
              name="trophy"
              size={22}
              color={theme.colors.primary}
            />
            <Text variant="titleLarge" style={{ fontWeight: "800" }}>
              Torneo actual
            </Text>

            <Chip
              icon="progress-wrench"
              style={{
                marginLeft: "auto",
                backgroundColor: theme.colors.surfaceVariant,
              }}
              textStyle={{ color: theme.colors.onSurface }}
            >
              En construcción
            </Chip>
          </View>

          <Text style={{ color: theme.colors.onSurfaceVariant }}>
            Estamos armando fixtures, rondas y estadísticas del torneo.
          </Text>

          {/* “Stats” */}
          <View
            style={{
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 16,
              padding: 14,
              gap: 8,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons
                name="account-group"
                size={18}
                color={theme.colors.tertiary}
              />
              <Text>
                <Text style={{ fontWeight: "800" }}>Jugadores:</Text> 3
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons
                name="cards"
                size={18}
                color={theme.colors.tertiary}
              />
              <Text>
                <Text style={{ fontWeight: "800" }}>Decks por jugador:</Text> 15
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <MaterialCommunityIcons
                name="format-list-bulleted"
                size={18}
                color={theme.colors.tertiary}
              />
              <Text>
                <Text style={{ fontWeight: "800" }}>Formato:</Text> Survival
              </Text>
            </View>
          </View>

          {/* Mensaje “próximamente” */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.outline,
            }}
          >
            <MaterialCommunityIcons
              name="information-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={{ color: theme.colors.onSurface }}>
              Próximamente: crear torneo y ver fixtures
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

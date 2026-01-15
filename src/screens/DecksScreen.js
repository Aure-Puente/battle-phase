import { useMemo } from "react";
import { View } from "react-native";
import { Button, Card, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { auth } from "../firebase/firebase";

/**
 * ✅ UIDs reales
 */
const PLAYERS = [
  { key: "aure", label: "Aure", uid: "sW53hw9EdVXDIJMI3BnPTcYRbAn1", icon: "crown-outline" },
  { key: "rami", label: "Rami", uid: "mFXk9M3WnOgTvtSnjlUQqz1TDsa2", icon: "sword-cross" },
  { key: "benja", label: "Benja", uid: "VTo2TZ93t7WQANYP9Fao2sFEops1", icon: "lightning-bolt-outline" },
];

export default function DecksScreen({ navigation }) {
  const theme = useTheme();
  const user = auth.currentUser;
  const myUid = user?.uid;

  const others = useMemo(() => PLAYERS.filter((p) => p.uid !== myUid), [myUid]);
  const me = useMemo(() => PLAYERS.find((p) => p.uid === myUid), [myUid]);

  const goMyDecks = () => {
    navigation.navigate("DeckList", { ownerId: myUid, titulo: "Mis Decks" });
  };

  const goPlayerDecks = (player) => {
    navigation.navigate("DeckList", { ownerId: player.uid, titulo: `${player.label} Decks` });
  };

  const BigButton = ({ mode, icon, label, subtitle, onPress }) => (
    <Button
      mode={mode}
      onPress={onPress}
      contentStyle={{ height: 56 }}
      labelStyle={{ fontSize: 16, fontWeight: "900" }}
      style={{
        borderRadius: 16,
        borderWidth: 1,
        borderColor: theme.colors.outline,
      }}
      icon={({ color, size }) => (
        <MaterialCommunityIcons name={icon} color={color} size={22} />
      )}
    >
      {label}
    </Button>
  );

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
        justifyContent: "center",
      }}
    >
      <Card
        mode="contained"
        style={{
          borderRadius: 20,
          borderWidth: 1,
          borderColor: theme.colors.outline,
          backgroundColor: theme.colors.surface,
          overflow: "hidden",
        }}
      >
        <Card.Content style={{ paddingTop: 18, paddingBottom: 18, gap: 14 }}>
          {/* Header lindo */}
          <View style={{ gap: 8, alignItems: "center" }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: theme.colors.surfaceVariant,
                borderWidth: 1,
                borderColor: theme.colors.outline,
              }}
            >
              <MaterialCommunityIcons name="cards" size={26} color={theme.colors.primary} />
            </View>

            <Text variant="headlineSmall" style={{ fontWeight: "900" }}>
              Decks
            </Text>

            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: "center" }}>
              Elegí qué colección querés ver. Podés entrar a la tuya o revisar las de los demás.
            </Text>
          </View>

          {/* Botones grandes centrados */}
          <View style={{ gap: 12, marginTop: 6 }}>
            <BigButton
              mode="contained"
              icon="cards"
              label="Mis Decks"
              onPress={goMyDecks}
            />

            {others.map((p) => (
              <BigButton
                key={p.key}
                mode="outlined"
                icon={p.icon || "account"}
                label={`${p.label} Decks`}
                onPress={() => goPlayerDecks(p)}
              />
            ))}
          </View>

          {/* Detallito visual abajo (opcional, suma estética) */}
          <View
            style={{
              marginTop: 8,
              padding: 12,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: theme.colors.outline,
              backgroundColor: theme.colors.surfaceVariant,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
            }}
          >
            <MaterialCommunityIcons name="information-outline" size={18} color={theme.colors.primary} />
            <Text style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
              Las listas se ordenan por nivel de fuerza (mayor arriba). Si un deck no tiene fuerza, queda al final.
            </Text>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

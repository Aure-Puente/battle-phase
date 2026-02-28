//Importaciones:
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
import { Animated, Easing, View } from "react-native";
import { Button, Card, Divider, Text, useTheme } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { auth } from "../firebase/firebase";

//JS:
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

  // =========================
  // Animación de entrada
  // =========================
  const enterOpacity = useRef(new Animated.Value(0)).current;
  const enterY = useRef(new Animated.Value(10)).current;
  const enterScale = useRef(new Animated.Value(0.985)).current;

  const runEnter = useCallback(() => {
    enterOpacity.setValue(0);
    enterY.setValue(10);
    enterScale.setValue(0.985);

    Animated.parallel([
      Animated.timing(enterOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(enterY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(enterScale, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [enterOpacity, enterY, enterScale]);

  useFocusEffect(
    useCallback(() => {
      runEnter();
      return undefined;
    }, [runEnter])
  );

  const goMyDecks = () => {
    navigation.navigate("DeckList", { ownerId: myUid, titulo: "Mis Decks" });
  };

  const goPlayerDecks = (player) => {
    navigation.navigate("DeckList", { ownerId: player.uid, titulo: `${player.label} Decks` });
  };

  const BigButton = ({ mode, icon, label, onPress }) => (
    <Button
      mode={mode}
      onPress={onPress}
      contentStyle={{ height: 62 }} // ⬅️ más alto
      labelStyle={{ fontSize: 16, fontWeight: "900" }}
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: theme.colors.outline,
      }}
      icon={({ color }) => <MaterialCommunityIcons name={icon} color={color} size={22} />}
    >
      {label}
    </Button>
  );

  return (
    <Animated.View
      style={{
        flex: 1,
        opacity: enterOpacity,
        transform: [{ translateY: enterY }, { scale: enterScale }],
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ flex: 1, padding: 16, justifyContent: "center" }}>
        <Card
          mode="contained"
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: theme.colors.outline,
            backgroundColor: theme.colors.surface,
            overflow: "hidden",
          }}
        >
          <Card.Content style={{ paddingTop: 22, paddingBottom: 22, gap: 16 }}>
            {/* Header */}
            <View style={{ gap: 10, alignItems: "center" }}>
              <View
                style={{
                  width: 58, 
                  height: 58,
                  borderRadius: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: theme.colors.surfaceVariant,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                }}
              >
                <MaterialCommunityIcons name="cards" size={28} color={theme.colors.primary} />
              </View>

              <Text variant="headlineSmall" style={{ fontWeight: "900" }}>
                Decks
              </Text>

              <Text
                style={{
                  color: theme.colors.onSurfaceVariant,
                  textAlign: "center",
                  lineHeight: 18,
                }}
              >
                Elegí qué colección querés ver. Podés entrar a la tuya o revisar las de los demás.
              </Text>
            </View>

            {/* Divider */}
            <Divider />

            {/* Botones */}
            <View style={{ gap: 14, marginTop: 2 }}>
              <BigButton mode="contained" icon="cards" label="Mis Decks" onPress={goMyDecks} />

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

            <View
              style={{
                marginTop: 6,
                paddingVertical: 10,
                paddingHorizontal: 12,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: theme.colors.outline,
                backgroundColor: theme.colors.surfaceVariant,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <MaterialCommunityIcons
                name="sort-variant"
                size={18}
                color={theme.colors.primary}
              />
              <Text style={{ color: theme.colors.onSurfaceVariant, flex: 1 }}>
                Las listas se ordenan por rango (mayor arriba). Los decks sin rango quedan al final.
              </Text>
            </View>
          </Card.Content>
        </Card>
      </View>
    </Animated.View>
  );
}
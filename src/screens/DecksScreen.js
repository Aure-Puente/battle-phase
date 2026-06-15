//Importaciones:
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
import { Animated, Easing, ScrollView, View } from "react-native";
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

  const goCardSelector = () => {
    navigation.navigate("CardSelector");
  };

  const BigButton = ({ mode, icon, label, onPress }) => (
    <Button
      mode={mode}
      onPress={onPress}
      contentStyle={{ height: 62 }}
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
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 28,
          flexGrow: 1,
          justifyContent: "center",
        }}
        showsVerticalScrollIndicator={false}
      >
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
              Acá podés ver y gestionar tus decks o explorar las colecciones de otros jugadores.</Text>
            </View>

            <Divider />

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

              <View
                style={{
                  marginTop: 10,
                  padding: 14,
                  borderRadius: 18,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surfaceVariant,
                  gap: 12,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: theme.colors.surface,
                      borderWidth: 1,
                      borderColor: theme.colors.outline,
                    }}
                  >
                    <MaterialCommunityIcons name="magnify" size={20} color={theme.colors.primary} />
                  </View>

                  <Text style={{ fontWeight: "900", fontSize: 15 }}>
                    Buscar cartas
                  </Text>
                </View>

                <Text
                  style={{
                    color: theme.colors.onSurfaceVariant,
                    lineHeight: 18,
                  }}
                >
                  Explorá todas las cartas disponibles para consultar información rápidamente.
                </Text>

                <Button
                  mode="contained"
                  onPress={goCardSelector}
                  style={{
                    borderRadius: 14,
                  }}
                  contentStyle={{ height: 48 }}
                  labelStyle={{ fontWeight: "900" }}
                  icon="arrow-right"
                >
                  Abrir buscador
                </Button>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </Animated.View>
  );
}
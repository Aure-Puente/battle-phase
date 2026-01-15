import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";

import DeckCreateScreen from "../screens/DeckCreateScreen";
import DeckEditScreen from "../screens/DeckEditScreen";
import DeckListScreen from "../screens/DeckListScreen";
import DecksScreen from "../screens/DecksScreen";

const Stack = createNativeStackNavigator();

export default function DecksStack() {
  const theme = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="DecksHome" component={DecksScreen} options={{ title: "Decks" }} />
      <Stack.Screen name="DeckList" component={DeckListScreen} options={{ title: "Listado" }} />
      <Stack.Screen name="DeckCreate" component={DeckCreateScreen} options={{ title: "Nuevo Deck" }} />

      {/* ✅ Modal de edición */}
      <Stack.Screen
        name="DeckEdit"
        component={DeckEditScreen}
        options={{ title: "Editar Deck", presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

//Importaciones:
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";
import DeckCreateScreen from "../screens/DeckCreateScreen";
import DeckEditScreen from "../screens/DeckEditScreen";
import DeckListScreen from "../screens/DeckListScreen";
import DecksScreen from "../screens/DecksScreen";

//JS:
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
      <Stack.Screen name="DecksHome" component={DecksScreen}  options={{ headerShown: false }}/>
      <Stack.Screen name="DeckList" component={DeckListScreen}  options={{ headerShown: false }} />
      <Stack.Screen name="DeckCreate" component={DeckCreateScreen}  options={{ headerShown: false }} />

      <Stack.Screen
        name="DeckEdit"
        component={DeckEditScreen}
        options={{headerShown: false , presentation: "modal" }}
      />
    </Stack.Navigator>
  );
}

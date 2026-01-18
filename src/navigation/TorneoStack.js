//Importaciones:
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "react-native-paper";
import TorneoScreen from "../screens/TorneoScreen";
import VersusScreen from "../screens/VersusScreen";

//JS:
const Stack = createNativeStackNavigator();

export default function TorneoStack() {

const theme = useTheme();

  return (
    <Stack.Navigator 
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { fontWeight: "700" },
      }}
    >
      <Stack.Screen name="TorneoHome" component={TorneoScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Versus" component={VersusScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

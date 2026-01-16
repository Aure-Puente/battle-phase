import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TorneoScreen from "../screens/TorneoScreen";
import VersusScreen from "../screens/VersusScreen";

const Stack = createNativeStackNavigator();

export default function TorneoStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TorneoHome" component={TorneoScreen} />
      <Stack.Screen name="Versus" component={VersusScreen} />
    </Stack.Navigator>
  );
}

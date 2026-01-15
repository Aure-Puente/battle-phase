import { DarkTheme as NavDarkTheme, NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { auth } from "./src/firebase/firebase";
import AppTabs from "./src/navigation/AppTabs";
import LoginScreen from "./src/screens/LoginScreen";
import { duelLinksTheme } from "./src/theme/duelLinksTheme";

const APP_BG = "#050A14";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u || null);
      setChecking(false);
    });
    return unsub;
  }, []);

  const navTheme = {
    ...NavDarkTheme,
    colors: {
      ...NavDarkTheme.colors,
      background: APP_BG,
      card: APP_BG,
      border: "#111827",
      text: "#FFFFFF",
    },
  };

  return (
    <SafeAreaProvider>
      <PaperProvider theme={duelLinksTheme}>
        <StatusBar style="light" backgroundColor={APP_BG} />

        <SafeAreaView style={{ flex: 1, backgroundColor: APP_BG }} edges={["top", "bottom"]}>
          {checking ? (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
              <ActivityIndicator />
            </View>
          ) : (
            <NavigationContainer theme={navTheme}>
              {user ? <AppTabs /> : <LoginScreen />}
            </NavigationContainer>
          )}
        </SafeAreaView>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

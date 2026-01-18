//Importaciones:
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";
import { useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import EstadisticasScreen from "../screens/EstadisticasScreen";
import HistorialScreen from "../screens/HistorialScreen";
import InicioScreen from "../screens/InicioScreen";
import DecksStack from "./DecksStack";
import TorneoStack from "./TorneoStack";

//JS:
const Tab = createBottomTabNavigator();
const TabBarButton = ({ children, onPress, onLongPress, style, rippleColor, ...rest }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    scale.setValue(0.2);
    opacity.setValue(0.35);

    Animated.parallel([
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0.35,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => {
      scale.setValue(0);
    });
  };

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={({ pressed }) => [
        style,
        { flex: 1, alignItems: "center", justifyContent: "center" },
        pressed && { opacity: 0.95 },
      ]}
      {...rest}
    >
      {/* Ripple */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { alignItems: "center", justifyContent: "center" },
        ]}
      >
        <Animated.View
          style={{
            width: 78,
            height: 56,
            borderRadius: 18,
            backgroundColor: rippleColor,
            transform: [{ scale }],
            opacity,
          }}
        />
      </Animated.View>

      {children}
    </Pressable>
  );
};

export default function AppTabs() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = 70 + (insets.bottom || 0);
  const tabBarPaddingBottom = 8 + (insets.bottom || 0);
  const rippleColor = "rgba(255, 193, 7, 0.45)"; // tipo Amber

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outline,
          borderTopWidth: 1,
          height: tabBarHeight,
          paddingTop: 10,
          paddingBottom: tabBarPaddingBottom,
        },
        tabBarIconStyle: {
        marginTop: 4,       
        marginBottom: 2,      
      },
        tabBarLabelStyle: {
          marginTop: 2,
          paddingBottom: 2,
          fontSize: 12,
          fontWeight: "700",
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarButton: (props) => (
          <TabBarButton {...props} rippleColor={rippleColor} />
        ),
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={InicioScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home-variant" color={color} size={28} />
          ),
        }}
      />

      <Tab.Screen
        name="Torneo"
        component={TorneoStack}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="trophy" color={color} size={28} />
          ),
        }}
      />

      <Tab.Screen
        name="Decks"
        component={DecksStack}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="cards" color={color} size={28} />
          ),
        }}
      />

      <Tab.Screen
        name="Estadísticas"
        component={EstadisticasScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="chart-line" color={color} size={28} />
          ),
        }}
      />

      <Tab.Screen
        name="Historial"
        component={HistorialScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="history" color={color} size={28} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

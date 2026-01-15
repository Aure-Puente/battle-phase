import { signInWithEmailAndPassword } from "firebase/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { Button, Card, Text, TextInput } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { auth } from "../firebase/firebase";

const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ fase: intro splash arriba del fondo
  const [introDone, setIntroDone] = useState(false);

  // ===== Animaciones Intro (splash in-app) =====
  const introOpacity = useRef(new Animated.Value(0)).current;
  const introScale = useRef(new Animated.Value(1.08)).current;
  const introBlur = useRef(new Animated.Value(8)).current;

  // ===== Animaciones UI Login =====
  const uiOpacity = useRef(new Animated.Value(0)).current;
  const uiTranslate = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    // 1) aparece el splash
    const introAnim = Animated.sequence([
      Animated.parallel([
        Animated.timing(introOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(introScale, { toValue: 1.02, duration: 450, useNativeDriver: true }),
        Animated.timing(introBlur, { toValue: 2, duration: 450, useNativeDriver: false }),
      ]),
      Animated.delay(1100),
      Animated.parallel([
        Animated.timing(introOpacity, { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(introScale, { toValue: 1.12, duration: 600, useNativeDriver: true }),
        Animated.timing(introBlur, { toValue: 12, duration: 600, useNativeDriver: false }),
      ]),
    ]);

    introAnim.start(({ finished }) => {
      if (!finished) return;
      setIntroDone(true);

      // 2) entra la UI del login (sin cortar fondo)
      Animated.parallel([
        Animated.timing(uiOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(uiTranslate, { toValue: 0, duration: 420, useNativeDriver: true }),
      ]).start();
    });

    return () => introAnim.stop();
  }, [introOpacity, introScale, introBlur, uiOpacity, uiTranslate]);

  const friendlyError = (e) => {
    const code = e?.code || "";
    if (
      code === "auth/invalid-login-credentials" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found" ||
      code === "auth/invalid-email"
    ) {
      return "Usuario o contraseña incorrectos";
    }
    if (code === "auth/too-many-requests") {
      return "Demasiados intentos. Probá de nuevo en unos minutos.";
    }
    return "No se pudo iniciar sesión";
  };
  
const onLogin = async () => {
  try {
    setError("");
    setLoading(true);

    const res = await signInWithEmailAndPassword(auth, email.trim(), pass);

  } catch (e) {
    setError(friendlyError(e));
  } finally {
    setLoading(false);
  }
};


  // Overlay base (constante) para que no haya “corte” visual
  const baseOverlay = "rgba(4, 10, 22, 0.55)";

  // Intro overlay un poco más suave (solo mientras dura el splash)
  const introOverlayOpacity = useMemo(() => (introDone ? 0 : 0.45), [introDone]);

  return (
    <View style={{ flex: 1 }}>
      {/* ✅ Fondo fijo: NO cambia nunca => transición continua */}
      <ImageBackground
        source={require("../../assets/images/splash.jpeg")}
        style={styles.full}
        resizeMode="cover"
        imageStyle={{ right: -200 }} // ✅ igual que pediste
      >
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: baseOverlay }]} />
      </ImageBackground>

      {/* ✅ Capa Intro Splash (encima del mismo fondo) */}
      {!introDone ? (
        <Animated.View style={[styles.absolute, { opacity: introOpacity }]}>
          <Animated.View style={[styles.full, { transform: [{ scale: introScale }] }]}>
            <AnimatedImageBackground
              source={require("../../assets/images/splash.jpeg")}
              style={styles.full}
              resizeMode="cover"
              blurRadius={introBlur}
              imageStyle={{ right: -200 }}
            >
              <View
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: `rgba(4,10,22,${introOverlayOpacity})` },
                ]}
              />
            </AnimatedImageBackground>
          </Animated.View>
        </Animated.View>
      ) : null}

      {/* ✅ UI Login encima, aparece sin cortar el fondo */}
      <KeyboardAvoidingView
        style={styles.absolute}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Animated.View
          style={{
            flex: 1,
            padding: 16,
            justifyContent: "center",
            opacity: uiOpacity,
            transform: [{ translateY: uiTranslate }],
          }}
        >
          <View style={{ marginBottom: 14, gap: 6 }}>
            <Text style={styles.title}>Iniciar sesión</Text>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <MaterialCommunityIcons name="shield-account" size={18} color="rgba(255,255,255,0.85)" />
              <Text style={{ color: "rgba(255,255,255,0.80)" }}>
                Ingresá con tu cuenta para continuar
              </Text>
            </View>
          </View>

          <Card style={styles.card}>
            <Card.Content style={{ gap: 12, paddingTop: 16 }}>
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                left={<TextInput.Icon icon="email-outline" />}
                style={{ backgroundColor: "transparent" }}
              />

              <TextInput
                label="Contraseña"
                value={pass}
                onChangeText={setPass}
                secureTextEntry
                left={<TextInput.Icon icon="lock-outline" />}
                style={{ backgroundColor: "transparent" }}
              />

              {!!error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Button
                mode="contained"
                onPress={onLogin}
                loading={loading}
                disabled={loading}
                icon="login"
                contentStyle={{ height: 48 }}
                style={{ borderRadius: 14 }}
              >
                Entrar
              </Button>
            </Card.Content>
          </Card>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  full: { flex: 1 },
  absolute: { ...StyleSheet.absoluteFillObject },
  title: {
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 0.2,
    color: "#fff",
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(10, 18, 34, 0.72)",
  },
  errorBox: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,80,80,0.35)",
    backgroundColor: "rgba(255,80,80,0.10)",
  },
  errorText: { color: "#ffd0d0", fontWeight: "800" },
});

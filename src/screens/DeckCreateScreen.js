//Importaciones:
import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { auth, db, storage } from "../firebase/firebase";

//JS:
async function pickImage() {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== "granted") throw new Error("Permiso de galería denegado");

  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (res.canceled) return null;
  return res.assets?.[0] || null;
}

async function uriToBlob(uri) {
  const r = await fetch(uri);
  return await r.blob();
}

//Rangos
const RANGES = [
  { key: "FUN", label: "FUN", color: "#FF4D4D" },
  { key: "FUN_ELITE", label: "FUN ELITE", color: "#FF8A3D" },
  { key: "ROGUE", label: "ROGUE", color: "#FFD166" },
  { key: "ROGUE_ELITE", label: "ROGUE ELITE", color: "#2ED47A" },
  { key: "META", label: "META", color: "#2DA8FF" },
  { key: "DOMINANTE", label: "DOMINANTE", color: "#8B5CF6" },
];

//Orden visua
const RANGE_LAYOUT = [
  ["META", "DOMINANTE"],
  ["ROGUE", "ROGUE_ELITE"],
  ["FUN", "FUN_ELITE"],
];

export default function DeckCreateScreen({ navigation }) {
  const theme = useTheme();
  const user = auth.currentUser;

  const [nombre, setNombre] = useState("");
  const [rango, setRango] = useState(RANGES[0].key);

  const [insignia, setInsignia] = useState(null);
  const [arquetipo, setArquetipo] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const onPickInsignia = async () => {
    try {
      setError("");
      const img = await pickImage();
      if (img) setInsignia(img);
    } catch (e) {
      setError(e?.message || "No se pudo elegir la imagen");
    }
  };

  const onPickArquetipo = async () => {
    try {
      setError("");
      const img = await pickImage();
      if (img) setArquetipo(img);
    } catch (e) {
      setError(e?.message || "No se pudo elegir la imagen");
    }
  };

  const uploadOptionalImage = async ({ uri, path }) => {
    if (!uri) return null;
    const blob = await uriToBlob(uri);
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const onSave = async () => {
    try {
      setError("");

      const name = String(nombre || "").trim();
      if (!name) {
        setError("El nombre es obligatorio");
        return;
      }
      if (!user?.uid) {
        setError("No hay usuario logueado");
        return;
      }

      setSaving(true);

      const now = Date.now();
      const selectedRange = RANGES.find((r) => r.key === rango) || RANGES[0];

      const docRef = await addDoc(collection(db, "decks"), {
        nombre: name,
        rango: selectedRange.key,
        rangoLabel: selectedRange.label,
        rangoColor: selectedRange.color,

        ownerUid: user.uid,
        createdAt: serverTimestamp(),
        createdAtMs: now,
        updatedAt: serverTimestamp(),

        insigniaUrl: null,
        arquetipoUrl: null,
      });

      const basePath = `decks/${user.uid}/${docRef.id}`;

      const insigniaUrl = insignia?.uri
        ? await uploadOptionalImage({
            uri: insignia.uri,
            path: `${basePath}/insignia.jpg`,
          })
        : null;

      const arquetipoUrl = arquetipo?.uri
        ? await uploadOptionalImage({
            uri: arquetipo.uri,
            path: `${basePath}/arquetipo.jpg`,
          })
        : null;

      if (insigniaUrl || arquetipoUrl) {
        await updateDoc(doc(db, "decks", docRef.id), {
          insigniaUrl: insigniaUrl || null,
          arquetipoUrl: arquetipoUrl || null,
          updatedAt: serverTimestamp(),
        });
      }

      navigation.goBack();
    } catch (e) {
      setError(e?.message || "No se pudo guardar el deck");
    } finally {
      setSaving(false);
    }
  };

  const selectedRange = RANGES.find((r) => r.key === rango) || RANGES[0];
  const getRange = (key) => RANGES.find((r) => r.key === key);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={{ fontWeight: "900" }}>
          Nuevo Deck
        </Text>

        <Card mode="contained">
          <Card.Content style={{ gap: 12 }}>
            {/* 1) Nombre */}
            <TextInput label="Nombre *" value={nombre} onChangeText={setNombre} />

            {/* 2) Insignia */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium">Insignia (opcional)</Text>
              {insignia?.uri ? (
                <Image
                  source={{ uri: insignia.uri }}
                  style={{ width: 120, height: 120, borderRadius: 14 }}
                />
              ) : (
                <Text style={{ opacity: 0.8, color: theme.colors.onSurfaceVariant }}>
                  Sin imagen
                </Text>
              )}

              <Button mode="outlined" icon="image" onPress={onPickInsignia}>
                Elegir insignia
              </Button>

              {insignia?.uri ? (
                <Button onPress={() => setInsignia(null)}>Quitar insignia</Button>
              ) : null}
            </View>

            {/* 3) Rango */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium">Rango *</Text>

              <View style={{ gap: 8 }}>
                {RANGE_LAYOUT.map((row, idx) => (
                  <View
                    key={`row-${idx}`}
                    style={{
                      flexDirection: "row",
                      gap: 10,
                    }}
                  >
                    {row.map((k) => {
                      const r = getRange(k);
                      if (!r) return null;

                      const active = r.key === rango;

                      return (
                        <Button
                          key={r.key}
                          mode={active ? "contained" : "outlined"}
                          onPress={() => setRango(r.key)}
                          compact
                          style={{
                            flex: 1,
                            borderRadius: 999,
                            borderWidth: 1,
                            borderColor: active ? r.color : theme.colors.outline,
                            backgroundColor: active ? r.color : "transparent",
                          }}
                          contentStyle={{ height: 38 }}
                          labelStyle={{
                            fontWeight: "900",
                            fontSize: 12,
                            color: active ? "#070B14" : theme.colors.onSurface,
                          }}
                        >
                          {r.label}
                        </Button>
                      );
                    })}
                  </View>
                ))}
              </View>

              <View
                style={{
                  marginTop: 6,
                  padding: 10,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: theme.colors.outline,
                  backgroundColor: theme.colors.surfaceVariant,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: selectedRange.color,
                  }}
                />
                <Text style={{ color: theme.colors.onSurfaceVariant }}>
                  Seleccionado:{" "}
                  <Text style={{ color: theme.colors.onSurface, fontWeight: "900" }}>
                    {selectedRange.label}
                  </Text>
                </Text>
              </View>
            </View>

            {/* 4) Arquetipo */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium">Arquetipo (opcional)</Text>
              {arquetipo?.uri ? (
                <Image
                  source={{ uri: arquetipo.uri }}
                  style={{ width: 120, height: 120, borderRadius: 14 }}
                />
              ) : (
                <Text style={{ opacity: 0.8, color: theme.colors.onSurfaceVariant }}>
                  Sin imagen
                </Text>
              )}

              <Button mode="outlined" icon="image" onPress={onPickArquetipo}>
                Elegir arquetipo
              </Button>

              {arquetipo?.uri ? (
                <Button onPress={() => setArquetipo(null)}>Quitar arquetipo</Button>
              ) : null}
            </View>

            {!!error && <Text style={{ color: theme.colors.error }}>{error}</Text>}

            <Button mode="contained" loading={saving} disabled={saving} onPress={onSave}>
              Guardar Deck
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

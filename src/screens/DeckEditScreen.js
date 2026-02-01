//Importaciones:
import * as ImagePicker from "expo-image-picker";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
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

//Rangos:
const RANGES = [
  { key: "FUN", label: "FUN", color: "#FF4D4D" },
  { key: "FUN_ELITE", label: "FUN ELITE", color: "#FF8A3D" },
  { key: "ROGUE", label: "ROGUE", color: "#FFD166" },
  { key: "ROGUE_ELITE", label: "ROGUE ELITE", color: "#2ED47A" },
  { key: "META", label: "META", color: "#2DA8FF" },
  { key: "DOMINANTE", label: "DOMINANTE", color: "#8B5CF6" },
];

const RANGE_LAYOUT = [
  ["META", "DOMINANTE"],
  ["ROGUE", "ROGUE_ELITE"],
  ["FUN", "FUN_ELITE"],
];

export default function DeckEditScreen({ route, navigation }) {
  const theme = useTheme();
  const user = auth.currentUser;
  const { deckId } = route.params || {};

  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [rango, setRango] = useState("FUN");

  const [insigniaLocal, setInsigniaLocal] = useState(null);
  const [arquetipoLocal, setArquetipoLocal] = useState(null);

  const [insigniaUrl, setInsigniaUrl] = useState(null);
  const [arquetipoUrl, setArquetipoUrl] = useState(null);

  const [removeInsignia, setRemoveInsignia] = useState(false);
  const [removeArquetipo, setRemoveArquetipo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!deckId) return;

    const unsub = onSnapshot(
      doc(db, "decks", deckId),
      (snap) => {
        const data = snap.data();
        if (!data) return;

        if (data.ownerUid && user?.uid && data.ownerUid !== user.uid) {
          navigation.goBack();
          return;
        }

        setNombre(data.nombre || "");
        setRango(data.rango || "FUN");
        setInsigniaUrl(data.insigniaUrl || null);
        setArquetipoUrl(data.arquetipoUrl || null);

        setLoading(false);
        navigation.setOptions({ title: "Editar Deck" });
      },
      () => setLoading(false)
    );

    return unsub;
  }, [deckId, navigation, user?.uid]);

  const uploadOptionalImage = async ({ uri, path }) => {
    if (!uri) return null;
    const blob = await uriToBlob(uri);
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  };

  const onPickInsignia = async () => {
    try {
      setError("");
      const img = await pickImage();
      if (img) {
        setInsigniaLocal(img);
        setRemoveInsignia(false);
      }
    } catch (e) {
      setError(e?.message || "No se pudo elegir la imagen");
    }
  };

  const onPickArquetipo = async () => {
    try {
      setError("");
      const img = await pickImage();
      if (img) {
        setArquetipoLocal(img);
        setRemoveArquetipo(false);
      }
    } catch (e) {
      setError(e?.message || "No se pudo elegir la imagen");
    }
  };

  const onSave = async () => {
    try {
      setError("");

      const name = String(nombre || "").trim();
      if (!name) {
        setError("El nombre es obligatorio");
        return;
      }
      if (!user?.uid || !deckId) {
        setError("Falta usuario o deckId");
        return;
      }

      setSaving(true);

      const basePath = `decks/${user.uid}/${deckId}`;

      if (removeInsignia) {
        await Promise.allSettled([deleteObject(ref(storage, `${basePath}/insignia.jpg`))]);
        setInsigniaUrl(null);
      }
      if (removeArquetipo) {
        await Promise.allSettled([deleteObject(ref(storage, `${basePath}/arquetipo.jpg`))]);
        setArquetipoUrl(null);
      }

      let newInsigniaUrl = insigniaUrl;
      let newArquetipoUrl = arquetipoUrl;

      if (insigniaLocal?.uri) {
        newInsigniaUrl = await uploadOptionalImage({
          uri: insigniaLocal.uri,
          path: `${basePath}/insignia.jpg`,
        });
      }

      if (arquetipoLocal?.uri) {
        newArquetipoUrl = await uploadOptionalImage({
          uri: arquetipoLocal.uri,
          path: `${basePath}/arquetipo.jpg`,
        });
      }

      const selectedRange = RANGES.find((r) => r.key === rango) || RANGES[0];

      await updateDoc(doc(db, "decks", deckId), {
        nombre: name,
        rango: selectedRange.key,
        rangoLabel: selectedRange.label,
        rangoColor: selectedRange.color,
        insigniaUrl: newInsigniaUrl || null,
        arquetipoUrl: newArquetipoUrl || null,
        updatedAt: serverTimestamp(),
      });

      navigation.goBack();
    } catch (e) {
      setError(e?.message || "No se pudo actualizar el deck");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
        <Text style={{ color: theme.colors.onSurfaceVariant }}>Cargando...</Text>
      </View>
    );
  }

  const previewInsigniaUri = insigniaLocal?.uri || insigniaUrl;
  const previewArquetipoUri = arquetipoLocal?.uri || arquetipoUrl;

  const selectedRange = RANGES.find((r) => r.key === rango) || RANGES[0];
  const getRange = (key) => RANGES.find((r) => r.key === key);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}>
        <Text variant="headlineMedium" style={{ fontWeight: "900" }}>
          Editar Deck
        </Text>

        <Card mode="contained">
          <Card.Content style={{ gap: 12 }}>
            {/* 1) Nombre */}
            <TextInput label="Nombre *" value={nombre} onChangeText={setNombre} />

            {/* 2) Insignia */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium">Insignia (opcional)</Text>

              {previewInsigniaUri && !removeInsignia ? (
                <Image
                  source={{ uri: previewInsigniaUri }}
                  style={{ width: 120, height: 120, borderRadius: 14 }}
                />
              ) : (
                <Text style={{ opacity: 0.8, color: theme.colors.onSurfaceVariant }}>Sin imagen</Text>
              )}

              <Button mode="outlined" icon="image" onPress={onPickInsignia}>
                Cambiar insignia
              </Button>

              {(insigniaUrl || insigniaLocal) && !removeInsignia ? (
                <Button
                  onPress={() => {
                    setRemoveInsignia(true);
                    setInsigniaLocal(null);
                  }}
                >
                  Quitar insignia
                </Button>
              ) : null}
            </View>

            {/* 3) Rango */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium">Rango *</Text>

              <View style={{ gap: 8 }}>
                {RANGE_LAYOUT.map((row, idx) => (
                  <View key={`row-${idx}`} style={{ flexDirection: "row", gap: 10 }}>
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

              {previewArquetipoUri && !removeArquetipo ? (
                <Image
                  source={{ uri: previewArquetipoUri }}
                  style={{ width: 120, height: 120, borderRadius: 14 }}
                />
              ) : (
                <Text style={{ opacity: 0.8, color: theme.colors.onSurfaceVariant }}>Sin imagen</Text>
              )}

              <Button mode="outlined" icon="image" onPress={onPickArquetipo}>
                Cambiar arquetipo
              </Button>

              {(arquetipoUrl || arquetipoLocal) && !removeArquetipo ? (
                <Button
                  onPress={() => {
                    setRemoveArquetipo(true);
                    setArquetipoLocal(null);
                  }}
                >
                  Quitar arquetipo
                </Button>
              ) : null}
            </View>

            {!!error && <Text style={{ color: theme.colors.error }}>{error}</Text>}

            <Button mode="contained" loading={saving} disabled={saving} onPress={onSave}>
              Guardar cambios
            </Button>

            <Button onPress={() => navigation.goBack()}>Cancelar</Button>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

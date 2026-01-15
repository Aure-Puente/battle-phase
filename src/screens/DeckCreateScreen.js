import * as ImagePicker from "expo-image-picker";
import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { auth, db, storage } from "../firebase/firebase";

const onlyNumber = (v) => String(v || "").replace(/[^\d]/g, "");

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

export default function DeckCreateScreen({ navigation }) {
  const theme = useTheme();
  const user = auth.currentUser;

  const [nombre, setNombre] = useState("");
  const [fuerza, setFuerza] = useState(""); // string para input
  const [insignia, setInsignia] = useState(null); // { uri }
  const [arquetipo, setArquetipo] = useState(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fuerzaNumber = useMemo(() => {
    const cleaned = onlyNumber(fuerza);
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }, [fuerza]);

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

      const now = Date.now(); // ✅ definido

      // 1) Creamos doc primero (para tener deckId)
      const docRef = await addDoc(collection(db, "decks"), {
        nombre: name,
        fuerza: fuerzaNumber ?? null,
        ownerUid: user.uid,
        createdAt: serverTimestamp(), // server
        createdAtMs: now,             // ✅ orden estable
        updatedAt: serverTimestamp(),
        insigniaUrl: null,
        arquetipoUrl: null,
      });

      // 2) Subimos imágenes opcionales a Storage
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

      // 3) Actualizamos el doc con las URLs (si hay)
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

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium">Nuevo Deck</Text>

        <Card mode="contained">
          <Card.Content style={{ gap: 12 }}>
            <TextInput label="Nombre *" value={nombre} onChangeText={setNombre} />

            <TextInput
              label="Fuerza (opcional)"
              value={fuerza}
              onChangeText={(v) => setFuerza(onlyNumber(v))}
              keyboardType="numeric"
            />

            {/* Insignia */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium">Insignia (opcional)</Text>
              {insignia?.uri ? (
                <Image
                  source={{ uri: insignia.uri }}
                  style={{ width: 120, height: 120, borderRadius: 14 }}
                />
              ) : (
                <Text style={{ opacity: 0.8 }}>Sin imagen</Text>
              )}

              <Button mode="outlined" icon="image" onPress={onPickInsignia}>
                Elegir insignia
              </Button>

              {insignia?.uri ? (
                <Button onPress={() => setInsignia(null)}>Quitar insignia</Button>
              ) : null}
            </View>

            {/* Arquetipo */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium">Arquetipo (opcional)</Text>
              {arquetipo?.uri ? (
                <Image
                  source={{ uri: arquetipo.uri }}
                  style={{ width: 120, height: 120, borderRadius: 14 }}
                />
              ) : (
                <Text style={{ opacity: 0.8 }}>Sin imagen</Text>
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

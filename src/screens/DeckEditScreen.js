//Importaciones:
import * as ImagePicker from "expo-image-picker";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useEffect, useMemo, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { Button, Card, Text, TextInput, useTheme } from "react-native-paper";
import { auth, db, storage } from "../firebase/firebase";

//JS:
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

export default function DeckEditScreen({ route, navigation }) {
  const theme = useTheme();
  const user = auth.currentUser;
  const { deckId } = route.params || {};

  const [loading, setLoading] = useState(true);

  const [nombre, setNombre] = useState("");
  const [fuerza, setFuerza] = useState("");

  const [insigniaLocal, setInsigniaLocal] = useState(null); 
  const [arquetipoLocal, setArquetipoLocal] = useState(null);

  const [insigniaUrl, setInsigniaUrl] = useState(null);
  const [arquetipoUrl, setArquetipoUrl] = useState(null);

  const [removeInsignia, setRemoveInsignia] = useState(false);
  const [removeArquetipo, setRemoveArquetipo] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fuerzaNumber = useMemo(() => {
    const cleaned = onlyNumber(fuerza);
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }, [fuerza]);

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
        setFuerza(data.fuerza != null ? String(data.fuerza) : "");
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

      await updateDoc(doc(db, "decks", deckId), {
        nombre: name,
        fuerza: fuerzaNumber ?? null,
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
        <Text>Cargando...</Text>
      </View>
    );
  }

  const previewInsigniaUri = insigniaLocal?.uri || insigniaUrl;
  const previewArquetipoUri = arquetipoLocal?.uri || arquetipoUrl;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 28, gap: 12 }}>
        <Text variant="headlineMedium" style={{ fontWeight: "900" }}>Editar Deck</Text>

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

              {previewInsigniaUri && !removeInsignia ? (
                <Image source={{ uri: previewInsigniaUri }} style={{ width: 120, height: 120, borderRadius: 14 }} />
              ) : (
                <Text style={{ opacity: 0.8 }}>Sin imagen</Text>
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

            {/* Arquetipo */}
            <View style={{ gap: 8 }}>
              <Text variant="titleMedium">Arquetipo (opcional)</Text>

              {previewArquetipoUri && !removeArquetipo ? (
                <Image source={{ uri: previewArquetipoUri }} style={{ width: 120, height: 120, borderRadius: 14 }} />
              ) : (
                <Text style={{ opacity: 0.8 }}>Sin imagen</Text>
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

import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { useRoute } from "../../components/RouteContext";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";
import { Ruta, rutasApi } from "../../services/rutasAPI";

export default function RutasScreen() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const { setSelectedRoute, setTrail, setTracking, setCurrentRecorridoId } = useRoute();


  const perfil_id = "09a3de3c-d389-4049-a670-1081dc02dfed";

  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await rutasApi.getRutas(perfil_id);
      setRutas(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las rutas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelectRuta = (ruta: Ruta) => {
    setTrail([]);
    setTracking(false);
    setCurrentRecorridoId(null);



    let coords: [number, number][] = [];

    try {
      const shape = JSON.parse(ruta.shape);
      if (shape.type === "MultiLineString") {
        shape.coordinates.forEach((c: any) => coords.push(...c));
      }
    } catch {}

    setSelectedRoute({
      id: ruta.id,
      perfil_id: ruta.perfil_id,
      nombre_ruta: ruta.nombre_ruta,
      color_hex: ruta.color_hex,
      descripcion: ruta.descripcion,
      coordinates: coords,
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={rutas}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => handleSelectRuta(item)}
          >
            <Text style={[styles.name, { color: colors.primary }]}>
              {item.nombre_ruta}
            </Text>
            {item.descripcion ? (
              <Text style={{ color: colors.text }}>{item.descripcion}</Text>
            ) : null}
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    padding: 14,
    margin: 10,
    borderRadius: 10,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

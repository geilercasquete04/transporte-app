import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useRoute } from "../../components/RouteContext";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";

import { Calle } from "../../services/callesAPI";
import { Ruta, rutasApi } from "../../services/rutasAPI";

// =====================================================
// 🔥 FUNCIÓN HAVERSINE PARA CALCULAR DISTANCIA
// =====================================================
function haversine(coord1: [number, number], coord2: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;

  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // km

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function RutasScreen() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const perfil_id = "09a3de3c-d389-4049-a670-1081dc02dfed";

  // ======== ESTADOS PRINCIPALES ========
  const [calles, setCalles] = useState<Calle[]>([]);
  const [callesSeleccionadas, setCallesSeleccionadas] = useState<string[]>([]);
  const [loadingCalles, setLoadingCalles] = useState(false);

  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    nombre_ruta: "",
    descripcion: "",
  });

  const { setSelectedRoute } = useRoute();

  // =====================================================
  // 🔥 Cargar RUTAS desde API
  // =====================================================
  const cargarRutas = async () => {
    try {
      setRefreshing(true);
      setLoading(true);

      const data = await rutasApi.getRutas(perfil_id);
      setRutas(data);
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar las rutas");
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRutas();
  }, []);

  // =====================================================
  // 🔥 Transformar rutas para calcular distancia
  // =====================================================
  const rutasConDistancia = rutas.map((ruta) => {
    let distancia = 0;

    try {
      const shape = JSON.parse(ruta.shape);

      if (shape.type === "MultiLineString" && Array.isArray(shape.coordinates)) {
        shape.coordinates.forEach((segment: [number, number][]) => {
          for (let i = 0; i < segment.length - 1; i++) {
            distancia += haversine(segment[i], segment[i + 1]);
          }
        });
      }
    } catch {}

    return { ...ruta, distancia };
  });

  // =====================================================
  // 🔥 Seleccionar una ruta
  // =====================================================
  const handleSelectRuta = (ruta: Ruta) => {
    try {
      const shape = JSON.parse(ruta.shape);
      let coords: [number, number][] = [];

      if (shape.type === "MultiLineString") {
        shape.coordinates.forEach((segment: [number, number][]) => {
          coords.push(...segment);
        });
      }

      setSelectedRoute({
        id: ruta.id,
        perfil_id: ruta.perfil_id,
        nombre_ruta: ruta.nombre_ruta,
        color_hex: ruta.color_hex || "#007AFF",
        descripcion: ruta.descripcion || "",
        coordinates: coords,
      });
    } catch (err) {
      console.log("❌ ERROR PARSEANDO SHAPE:", err);
    }
  };
  // =====================================================
  // 🔥 Render lista de items
  // =====================================================
  const renderRuta = ({
    item,
  }: {
    item: Ruta & { distancia: number };
  }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => handleSelectRuta(item)}
    >
      <Text style={[styles.nombre, { color: colors.primary }]}>
        🗺️ {item.nombre_ruta}
      </Text>

      {item.descripcion ? (
        <Text style={[styles.sub, { color: colors.secondary }]}>
          {item.descripcion}
        </Text>
      ) : null}

      <Text style={[styles.sub, { color: colors.secondary }]}>
        Distancia: {item.distancia.toFixed(2)} km
      </Text>
    </TouchableOpacity>
  );

  // =====================================================
  // 🔥 Loader
  // =====================================================
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // =====================================================
  // 🔥 UI PRINCIPAL
  // =====================================================
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      <FlatList
        data={rutasConDistancia}
        renderItem={renderRuta}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={cargarRutas}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}

// =====================================================
// 🔥 STYLES
// =====================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },

  nombre: {
    fontSize: 18,
    fontWeight: "bold",
  },

  sub: {
    marginTop: 6,
    fontSize: 14,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    height: 60,
    width: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  fabText: { color: "white", fontSize: 32 },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },

  modalContent: {
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },

  inputLabel: {
    marginTop: 12,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: "600",
  },

  input: {
    backgroundColor: "#eee4",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
  },

  submitButton: {
    marginTop: 20,
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },

  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },

  closeButton: {
    textAlign: "center",
    marginVertical: 16,
    fontSize: 18,
  },

  calleItem: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderColor: "#ccc3",
  },

  calleNombre: {
    fontSize: 16,
  },
});

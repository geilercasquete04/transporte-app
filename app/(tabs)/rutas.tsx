import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "../../components/RouteContext";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";
import { Calle, callesApi } from "../../services/callesAPI";
import { Ruta, rutasApi } from "../../services/rutasAPI";

export default function RutasScreen() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const perfil_id = "09a3de3c-d389-4049-a670-1081dc02dfed";

  // CALLES
  const [calles, setCalles] = useState<Calle[]>([]);
  const [callesSeleccionadas, setCallesSeleccionadas] = useState<string[]>([]);
  const [loadingCalles, setLoadingCalles] = useState(false);

  // RUTAS
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [formData, setFormData] = useState({
    nombre_ruta: "",
  });

  const { setSelectedRoute } = useRoute();

  // ======== Cargar rutas ========
  const cargarRutas = async () => {
    try {
      const data = await rutasApi.getRutas(perfil_id);
      console.log("RUTAS DESDE API:", JSON.stringify(data, null, 2));
      setRutas(data);
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar las rutas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRutas();
  }, []);

  // ======== Seleccionar ruta ========
const handleSelectRuta = (ruta: Ruta) => {
  try {
    console.log("SHAPE RECIBIDO:", ruta.shape);

    // 1️⃣ Parsear shape
    const shape = JSON.parse(ruta.shape);

    let coords: [number, number][] = [];

    // 2️⃣ Validar tipo MultiLineString
    if (
      shape.type === "MultiLineString" &&
      Array.isArray(shape.coordinates)
    ) {
      shape.coordinates.forEach((segment: [number, number][]) => {
        if (Array.isArray(segment)) {
          coords.push(...segment);
        }
      });
    }

    console.log("COORDENADAS PARSEADAS:", coords);

    // 3️⃣ Guardar en context
    setSelectedRoute({
      id: ruta.id,
      perfil_id: ruta.perfil_id,
      nombre_ruta: ruta.nombre_ruta,
      color_hex: ruta.color_hex || "#007AFF",
      coordinates: coords,
    });

  } catch (err) {
    console.log("❌ ERROR PARSEANDO SHAPE:", err);
  }
};



  // ======== Cargar calles ========
  const cargarCalles = async () => {
    try {
      setLoadingCalles(true);
      const data = await callesApi.getCalles();
      setCalles(data);
      console.log("CALLE EJEMPLO:", JSON.stringify(calles[0], null, 2));
    } catch (e) {
      Alert.alert("Error", "No se pudieron cargar las calles");
    } finally {
      setLoadingCalles(false);
    }
  };

  // ======== Crear Ruta ========
  const handleCreateRuta = async () => {
    if (!formData.nombre_ruta.trim()) {
      return Alert.alert("Error", "El nombre de la ruta es obligatorio");
    }

    if (callesSeleccionadas.length === 0) {
      return Alert.alert("Error", "Debe seleccionar al menos 1 calle");
    }

    try {
      setIsCreating(true);

      // ---------------------- NUEVO SHAPE ----------------------
const shape = {
  type: "MultiLineString",
  coordinates: calles
    .filter((c) => callesSeleccionadas.includes(c.id))
    .map((c) => {
      try {
        const parsed = JSON.parse(c.shape);
        return parsed.coordinates;
      } catch {
        return [];
      }
    }),
};

// ---------------------- DATA FINAL ------------------------
const data = {
  nombre_ruta: formData.nombre_ruta.trim(),
  perfil_id,
  shape: JSON.stringify(shape),
  calles_ids: callesSeleccionadas,
};


      await rutasApi.createRuta(data);

      Alert.alert("Éxito", "Ruta creada correctamente");
      setShowModal(false);
      setCallesSeleccionadas([]);
      setFormData({ nombre_ruta: "" });
      cargarRutas();
    } catch (error: any) {
      console.log("ERROR AL CREAR RUTA:", JSON.stringify(error, null, 2));
      console.log("RESPONSE RAW:", error?.response);

      const msg =
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Error al crear ruta";

      Alert.alert("Error", msg);
    } finally {
      setIsCreating(false);
    }
  };

  // ======== Eliminar Ruta ========
  const handleDeleteRuta = (id: string, nombre: string) => {
    Alert.alert(
      "Eliminar Ruta",
      `¿Seguro deseas eliminar la ruta "${nombre}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await rutasApi.deleteRuta(id, perfil_id);
              cargarRutas();
            } catch (e) {
              Alert.alert("Error", "No se pudo eliminar la ruta");
            }
          },
        },
      ]
    );
  };

  // ======== Render item ========
  const renderRuta = ({ item }: { item: Ruta }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={() => handleSelectRuta(item)}
      onLongPress={() => handleDeleteRuta(item.id, item.nombre_ruta)}
    >
      <Text style={[styles.nombre, { color: colors.primary }]}>
        🗺️ {item.nombre_ruta}
      </Text>
      <Text style={[styles.sub, { color: colors.secondary }]}>
        {item.calles_ids?.length ?? 0} calles asignadas
      </Text>
    </TouchableOpacity>
  );

  // ======== Loader ========
  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDarkMode ? "light-content" : "dark-content"}
      />

      <FlatList
        data={rutas}
        renderItem={renderRuta}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          cargarCalles();
          setShowModal(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* MODAL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Nueva Ruta
            </Text>

            <ScrollView style={{ marginTop: 10 }}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>
                Nombre de la ruta
              </Text>

              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={formData.nombre_ruta}
                onChangeText={(t) => setFormData({ nombre_ruta: t })}
              />

              {/* Selector de calles */}
              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 20 }]}>
                Selecciona las calles
              </Text>

              {loadingCalles ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <ScrollView style={{ maxHeight: 200 }}>
                  {calles.map((calle) => {
                    const selected = callesSeleccionadas.includes(calle.id);

                    return (
                      <TouchableOpacity
                        key={calle.id}
                        style={styles.calleItem}
                        onPress={() => {
                          if (selected) {
                            setCallesSeleccionadas(
                              callesSeleccionadas.filter((c) => c !== calle.id)
                            );
                          } else {
                            setCallesSeleccionadas([
                              ...callesSeleccionadas,
                              calle.id,
                            ]);
                          }
                        }}
                      >
                        <Text style={[styles.calleNombre, { color: colors.text }]}>
                          {selected ? "☑" : "☐"} {calle.nombre}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity
                style={[styles.submitButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateRuta}
                disabled={isCreating}
              >
                <Text style={styles.submitButtonText}>
                  {isCreating ? "Guardando..." : "Crear Ruta"}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={[styles.closeButton, { color: colors.text }]}>
                Cerrar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ======== ESTILOS ========
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

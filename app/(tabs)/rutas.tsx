import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "../../components/RouteContext";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";
import { Calle, callesApi } from "../../services/callesAPI";
import { Ruta, rutasApi } from "../../services/rutasAPI";

export default function RutasScreen() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [calles, setCalles] = useState<Calle[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false); // Nuevo
  const [selectedRuta, setSelectedRuta] = useState<Ruta | null>(null); // Nuevo
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCalles, setSelectedCalles] = useState<string[]>([]);
  const [nombreRuta, setNombreRuta] = useState("");
  const [colorHex, setColorHex] = useState("#FF5733");
  const { setSelectedRoute } = useRoute();
  const router = useRouter();
  const perfil_id = "09a3de3c-d389-4049-a670-1081dc02dfed";
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const cargarRutas = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rutasApi.obtenerRutas(perfil_id);
      setRutas(data);
    } catch (err) {
      setError("Error al cargar las rutas. Verifica el ID de perfil.");
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cargarCalles = async () => {
    try {
      const data = await callesApi.getCalles();
      setCalles(data);
    } catch (err) {
      console.error("Error al cargar calles:", err);
    }
  };

  useEffect(() => {
    cargarRutas();
    cargarCalles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    cargarRutas();
  };

  const toggleCalleSelection = (calleId: string) => {
    setSelectedCalles(prev => 
      prev.includes(calleId)
        ? prev.filter(id => id !== calleId)
        : [...prev, calleId]
    );
  };

const handleCrearRuta = async () => {
  if (!nombreRuta.trim()) {
    Alert.alert("Error", "El nombre de la ruta es obligatorio");
    return;
  }

  if (selectedCalles.length === 0) {
    Alert.alert("Error", "Debes seleccionar al menos una calle");
    return;
  }

  try {
    setIsCreating(true);

    const rutaData = Object.freeze({
  nombre_ruta: nombreRuta.trim(),
  perfil_id: perfil_id,
  color_hex: colorHex,
  calles_ids: selectedCalles,
});


    const res = await rutasApi.crearRuta(rutaData);

    console.log("✔️ RESPUESTA:", res);

    Alert.alert("Éxito", "Ruta creada correctamente");
    setShowModal(false);
    resetForm();
    cargarRutas();

  } catch (error: any) {
    console.log("❌ ERROR RAW:", error);
    console.log("❌ RESPONSE:", error.response?.data);

    Alert.alert("Error", error.response?.data?.message || "Error al crear ruta");
  } finally {
    setIsCreating(false);
  }
};


  const handleEliminarRuta = (ruta: Ruta) => {
    Alert.alert(
      "Función no disponible",
      "La eliminación de rutas no está disponible en la API actualmente.",
      [{ text: "OK" }]
    );
    // Comentado hasta que la API soporte DELETE
    /*
    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro de eliminar la ruta "${ruta.nombre_ruta}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              await rutasApi.eliminarRuta(ruta.id, perfilId);
              Alert.alert("Éxito", "Ruta eliminada correctamente");
              cargarRutas();
            } catch (error: any) {
              const mensaje = error.response?.data?.error || 
                             error.response?.data?.message ||
                             "Error al eliminar la ruta";
              Alert.alert("Error", mensaje);
            }
          },
        },
      ]
    );
    */
  };

  const handleVerDetalleRuta = async (ruta: Ruta) => {
    try {
      setShowDetailModal(true);
      setSelectedRuta(ruta);
      
      // Obtener las coordenadas de la ruta desde sus calles
      const coordenadas = await rutasApi.obtenerCoordinadasDeRuta(ruta);
      
      if (coordenadas.length > 0) {
        // Guardar la ruta en el context para que el mapa la pueda usar
        setSelectedRoute({
          id: ruta.id,
          nombre_ruta: ruta.nombre_ruta,
          color_hex: ruta.color_hex || "#007AFF",
          coordinates: coordenadas,
        });
        
        Alert.alert(
          "Ruta cargada",
          `La ruta "${ruta.nombre_ruta}" está lista para verse en el mapa con ${coordenadas.length} puntos.\n\n¿Deseas ir al mapa ahora?`,
          [
            {
              text: "Ver en mapa",
              onPress: () => {
                setShowDetailModal(false);
                router.push("/(tabs)"); // Navegar al tab del mapa
              },
            },
            {
              text: "Quedarse aquí",
              style: "cancel",
            },
          ]
        );
      } else {
        Alert.alert(
          "Sin coordenadas",
          "Esta ruta no tiene calles con coordenadas para mostrar en el mapa."
        );
      }
    } catch (error) {
      console.error("Error al cargar coordenadas de ruta:", error);
      Alert.alert(
        "Error",
        "No se pudieron cargar las coordenadas de la ruta. Verifica que las calles tengan coordenadas."
      );
    }
  };

  const resetForm = () => {
    setNombreRuta("");
    setColorHex("#FF5733");
    setSelectedCalles([]);
  };

  const renderRuta = ({ item }: { item: Ruta }) => (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card || colors.background,
          borderColor: colors.border || "#ddd",
          borderLeftWidth: 4,
          borderLeftColor: item.color_hex,
        },
      ]}
      onPress={() => handleVerDetalleRuta(item)} // Ahora se puede seleccionar
    >
      <View style={styles.cardContent}>
        <View style={styles.rutaHeader}>
          <ThemedText style={styles.rutaNombre}>🗺️ {item.nombre_ruta}</ThemedText>
          <TouchableOpacity
            onPress={() => handleEliminarRuta(item)}
            style={styles.deleteIconButton}
          >
            <Text style={styles.deleteIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.colorPreview}>
          <View style={[styles.colorBox, { backgroundColor: item.color_hex }]} />
          <ThemedText style={styles.colorText}>{item.color_hex}</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCalleItem = ({ item }: { item: Calle }) => {
    const isSelected = selectedCalles.includes(item.id);
    return (
      <TouchableOpacity
        style={[
          styles.calleItem,
          {
            backgroundColor: isSelected ? colors.primary + "20" : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => toggleCalleSelection(item.id)}
      >
        <Text style={styles.calleCheckbox}>
          {isSelected ? "☑️" : "⬜"}
        </Text>
        <ThemedText style={styles.calleNombre}>{item.nombre}</ThemedText>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={styles.loadingText}>Cargando rutas...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ThemedText style={styles.titulo}>Rutas de Recolección</ThemedText>

      {error ? (
        <View style={styles.centered}>
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={cargarRutas}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={rutas}
          renderItem={renderRuta}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#007AFF"]}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <ThemedText style={styles.emptyText}>
                No hay rutas disponibles
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Toca el botón + para crear una
              </ThemedText>
            </View>
          }
        />
      )}

      {/* Botón flotante para crear ruta */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary || "#007AFF" }]}
        onPress={() => {
          resetForm();
          setShowModal(true);
        }}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal para ver detalle de ruta */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Detalle de Ruta
              </Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Text style={[styles.closeButton, { color: colors.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.detailContent}>
  {selectedRuta && (
    <>
      <Text style={[styles.detailRutaNombre, { color: colors.text }]}>
        🗺️ {selectedRuta.nombre_ruta}
      </Text>
      
      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: colors.secondary }]}>Color:</Text>
        <View style={styles.colorPreview}>
          <View style={[styles.colorBox, { backgroundColor: selectedRuta.color_hex }]} />
          <Text style={[styles.colorText, { color: colors.text }]}>
            {selectedRuta.color_hex}
          </Text>
        </View>
      </View>

      <View style={styles.detailRow}>
        <Text style={[styles.detailLabel, { color: colors.secondary }]}>ID:</Text>
        <Text style={[styles.detailValue, { color: colors.text }]} numberOfLines={1}>
          {selectedRuta.id}
        </Text>
      </View>

      {selectedRuta.created_at && (
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.secondary }]}>
            Fecha de creación:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {new Date(selectedRuta.created_at).toLocaleDateString()}
          </Text>
        </View>
      )}

      {selectedRuta.updated_at && (
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.secondary }]}>
            Última actualización:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {new Date(selectedRuta.updated_at).toLocaleDateString()}
          </Text>
        </View>
      )}
    </>
  )}
</ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal para crear ruta */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowModal(false);
          resetForm();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Nueva Ruta
              </Text>
              <TouchableOpacity onPress={() => {
                setShowModal(false);
                resetForm();
              }}>
                <Text style={[styles.closeButton, { color: colors.secondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              {/* Nombre de la ruta */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Nombre de la Ruta *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  value={nombreRuta}
                  onChangeText={setNombreRuta}
                  placeholder="Ej: Ruta Centro"
                  placeholderTextColor={colors.secondary}
                />
              </View>

              {/* Color */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Color (Hex)
                </Text>
                <View style={styles.colorInputContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      { flex: 1 },
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.text,
                      },
                    ]}
                    value={colorHex}
                    onChangeText={setColorHex}
                    placeholder="#FF5733"
                    placeholderTextColor={colors.secondary}
                    maxLength={7}
                  />
                  <View style={[styles.colorPreviewBox, { backgroundColor: colorHex }]} />
                </View>
              </View>

              {/* Selección de calles - CORREGIDO EL SCROLL */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Seleccionar Calles * ({selectedCalles.length} seleccionadas)
                </Text>
                <View style={styles.callesListContainer}>
                  <FlatList
                    data={calles}
                    renderItem={renderCalleItem}
                    keyExtractor={(item) => item.id}
                    nestedScrollEnabled={true} // ✅ Esto habilita el scroll
                    style={styles.callesList}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  { backgroundColor: colors.primary || "#007AFF" },
                  isCreating && styles.submitButtonDisabled,
                ]}
                onPress={handleCrearRuta}
                disabled={isCreating}
              >
                <Text style={styles.submitButtonText}>
                  {isCreating ? "Guardando..." : "✓ Crear Ruta"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    padding: 20,
    paddingBottom: 10,
  },
  listContent: {
    padding: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardContent: {
    gap: 8,
  },
  rutaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rutaNombre: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  deleteIconButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  colorPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  colorText: {
    fontSize: 12,
    opacity: 0.7,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    padding: 20,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: "center",
    marginTop: 8,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabText: {
    fontSize: 32,
    color: "#fff",
    fontWeight: "300",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
  },
  closeButton: {
    fontSize: 24,
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  colorInputContainer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  colorPreviewBox: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  callesListContainer: {
    height: 300, // ✅ Altura fija para el contenedor
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
  },
  callesList: {
    flex: 1,
  },
  calleItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 8,
    marginHorizontal: 8,
    marginTop: 8,
  },
  calleCheckbox: {
    fontSize: 20,
    marginRight: 12,
  },
  calleNombre: {
    fontSize: 16,
    flex: 1,
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  detailContent: {
    padding: 20,
  },
  detailRutaNombre: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: "#f44336",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
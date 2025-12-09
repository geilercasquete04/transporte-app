import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    SafeAreaView,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";
import { recorridosApi } from "../../services/recorridosAPI";

interface Recorrido {
  id: string;
  ruta_id: string;
  vehiculo_id: string;
  perfil_id: string;
  fecha_inicio: string;
  fecha_fin?: string | null;
  distancia_km?: number;
  ruta?: {
    nombre_ruta: string;
  };
  vehiculo?: {
    placa: string;
  };
}

const perfil_id = "09a3de3c-d389-4049-a670-1081dc02dfed";

export default function RecorridosScreen() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const [recorridos, setRecorridos] = useState<Recorrido[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ===========================
  //  CARGAR RECORRIDOS
  // ===========================
  const load = async () => {
    try {
      const data = await recorridosApi.getMisRecorridos(perfil_id);
      setRecorridos(data);
    } catch (error) {
      console.log("❌ Error cargando recorridos", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  // ===========================
  //  UI PARA CADA ITEM
  // ===========================
  const renderItem = ({ item }: { item: Recorrido }) => {
    return (
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.primary }]}>
          🗺 Ruta: {item.ruta?.nombre_ruta ?? "Desconocida"}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>
          🚛 Vehículo: {item.vehiculo?.placa ?? "N/A"}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>
          🕒 Inicio: {new Date(item.fecha_inicio).toLocaleString()}
        </Text>

        <Text style={[styles.label, { color: colors.text }]}>
          ⏹ Fin:{" "}
          {item.fecha_fin
            ? new Date(item.fecha_fin).toLocaleString()
            : "En progreso"}
        </Text>

        {item.distancia_km != null && (
          <Text style={[styles.label, { color: colors.text }]}>
            📏 Distancia: {item.distancia_km.toFixed(2)} km
          </Text>
        )}
      </View>
    );
  };

  // ===========================
  //  LOADER
  // ===========================
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Cargando recorridos...</Text>
      </View>
    );
  }

  // ===========================
  //  UI PRINCIPAL
  // ===========================
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />

      <FlatList
        data={recorridos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.text, marginTop: 20 }}>
              No hay recorridos registrados aún.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

// =========================
// ESTILOS
// =========================
const styles = StyleSheet.create({
  container: { flex: 1 },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },

  label: {
    fontSize: 14,
    marginTop: 4,
  },
});

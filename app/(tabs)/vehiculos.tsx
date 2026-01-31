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
  View,
} from "react-native";
import { useRoute } from "../../components/RouteContext";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";
import { Vehiculo, vehiculosApi } from "../../services/vehiculosAPI";

export default function VehiculosScreen() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const { selectedVehiculo, setSelectedVehiculo } = useRoute();

  const perfil_id = "09a3de3c-d389-4049-a670-1081dc02dfed";

  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarVehiculos = async () => {
    try {
      const data = await vehiculosApi.getVehiculos(perfil_id);
      setVehiculos(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los vehículos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const renderVehiculo = ({ item }: { item: Vehiculo }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card },
        selectedVehiculo?.id === item.id && { borderColor: colors.primary, borderWidth: 2 }
      ]}
      onPress={() => setSelectedVehiculo({ id: item.id, placa: item.placa })}
    >
      <Text style={[styles.placa, { color: colors.primary }]}>🚛 {item.placa}</Text>
      <Text style={[styles.sub]}>Marca: {item.marca || "N/A"}</Text>
      <Text style={[styles.sub]}>Modelo: {item.modelo || "N/A"}</Text>

      <TouchableOpacity
        style={[styles.usarBtn, { backgroundColor: colors.primary }]}
        onPress={() => setSelectedVehiculo({ id: item.id, placa: item.placa })}
      >
        <Text style={styles.usarBtnText}>Usar este vehículo</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={vehiculos}
        renderItem={renderVehiculo}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },

  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
  },

  placa: {
    fontSize: 22,
    fontWeight: "bold",
  },

  sub: {
    fontSize: 14,
    marginTop: 6,
  },

  usarBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },

  usarBtnText: {
    color: "white",
    fontWeight: "bold",
  }
});

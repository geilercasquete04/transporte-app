import MapLibreGL from "@maplibre/maplibre-react-native";
import axios, { AxiosError } from "axios";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import RoutePointMarker from "../../components/RoutePointMarker";

// =========================
// 🔥 FUNCION HAVERSINE
// =========================
function haversineDistance(coord1: [number, number], coord2: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;

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

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distancia en KM
}

export default function RouteCreatorScreen() {
  const TOKEN = "09a3de3c-d389-4049-a670-1081dc02dfed";
  const PERFIL_ID = "09a3de3c-d389-4049-a670-1081dc02dfed";

  const [points, setPoints] = useState<[number, number][]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [creating, setCreating] = useState(false);

  const [nextRouteNumber, setNextRouteNumber] = useState(1);
  const [totalDistance, setTotalDistance] = useState(0);

  // 🔥 NUEVO: Modal para nombre y descripción
  const [showModal, setShowModal] = useState(false);
  const [routeName, setRouteName] = useState("");
  const [routeDescription, setRouteDescription] = useState("");

  // =========================
  // Calcular distancia
  // =========================
  useEffect(() => {
    if (points.length < 2) {
      setTotalDistance(0);
      return;
    }

    let dist = 0;
    for (let i = 0; i < points.length - 1; i++) {
      dist += haversineDistance(points[i], points[i + 1]);
    }
    setTotalDistance(dist);
  }, [points]);

  // =========================
  // UBICACIÓN DEL USUARIO
  // =========================
  useEffect(() => {
    const load = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      const coords: [number, number] = [loc.coords.longitude, loc.coords.latitude];
      setUserLocation(coords);
    };

    load();
  }, []);

  // =========================
  // CONTAR RUTAS EXISTENTES
  // =========================
  useEffect(() => {
    const loadRouteCount = async () => {
      try {
        const response = await axios.get(
          "https://apirecoleccion.gonzaloandreslucio.com/api/rutas",
          {
            headers: { Authorization: `Bearer ${TOKEN}` },
          }
        );

        const total = response.data.length;
        setNextRouteNumber(total + 1);
      } catch (err) {
        console.log("Error obteniendo total de rutas:", err);
      }
    };

    loadRouteCount();
  }, []);

  if (!userLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // =========================
  // AGREGAR PUNTOS
  // =========================
  const handlePress = (e: any) => {
    if (!creating) return;

    const coord: [number, number] = e.geometry.coordinates;
    setPoints((prev) => [...prev, coord]);
  };

  // =========================
  // DESHACER ÚLTIMO PUNTO
  // =========================
  const undoPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
  };

  // =========================
  // REINICIAR RUTA
  // =========================
  const resetRoute = () => {
    setPoints([]);
    setCreating(false);
  };

  // =========================
  // INICIAR CREACIÓN
  // =========================
  const startCreation = () => {
    setPoints([]);
    setCreating(true);
  };

  // =========================
  // GUARDAR RUTA (DESPUÉS DE MODAL)
  // =========================
  const saveRoute = async () => {
    if (points.length < 2) {
      alert("Debes crear al menos 2 puntos para formar la ruta.");
      return;
    }

    if (!routeName.trim()) {
      alert("Debes ingresar un nombre para la ruta.");
      return;
    }

    const shape = {
      type: "MultiLineString",
      coordinates: [points],
    };

    const body = {
      perfil_id: PERFIL_ID,
      nombre_ruta: routeName.trim(),
      descripcion: routeDescription.trim(),
      color_hex: "#FF8C00",
      shape: JSON.stringify(shape),
    };

    console.log("BODY ENVIADO:", body);

    try {
      await axios.post(
        "https://apirecoleccion.gonzaloandreslucio.com/api/rutas",
        body,
        {
          headers: {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      alert("Ruta guardada con éxito 🎉");

      setCreating(false);
      setPoints([]);

      setRouteName("");
      setRouteDescription("");
      setShowModal(false);

      setNextRouteNumber((prev) => prev + 1);

    } catch (err) {
      const error = err as AxiosError;
      console.log("⚠️ ERROR COMPLETO:", error);
      if (error.response) {
        console.log("⚠️ ERROR STATUS:", error.response.status);
        console.log("⚠️ ERROR DATA:", error.response.data);
      }
      alert("Error al guardar ruta (ver consola)");
    }
  };

  return (
    <View style={styles.container}>
      
      {/* MAPA */}
      <MapLibreGL.MapView
        style={styles.map}
        onPress={handlePress}
        mapStyle="https://api.maptiler.com/maps/streets-v2/style.json?key=eB3WgCoYPm69Zm3tcZ5d"
      >
        <MapLibreGL.Camera
          defaultSettings={{
            centerCoordinate: userLocation,
            zoomLevel: 15,
          }}
        />

        <MapLibreGL.PointAnnotation id="user-location" coordinate={userLocation}>
          <View style={styles.userMarker} />
        </MapLibreGL.PointAnnotation>

        {points.map((coord, index) => (
          <RoutePointMarker key={index} id={`p-${index}`} coordinate={coord} />
        ))}

        {points.length > 1 && (
          <MapLibreGL.ShapeSource
            id="route"
            shape={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: points,
              },
            }}
          >
            <MapLibreGL.LineLayer
              id="route-line"
              style={{
                lineColor: "#FF8C00",
                lineWidth: 4,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {/* DISTANCIA */}
      <View style={styles.distanceBox}>
        <Text style={styles.distanceText}>
          Distancia: {totalDistance.toFixed(2)} km
        </Text>
      </View>

      {/* BOTONES */}
      <View style={styles.buttonsRow}>
        {!creating && (
          <TouchableOpacity style={styles.btn} onPress={startCreation}>
            <Text style={styles.btnText}>Iniciar</Text>
          </TouchableOpacity>
        )}

        {creating && (
          <>
            <TouchableOpacity style={styles.btn} onPress={undoPoint}>
              <Text style={styles.btnText}>Deshacer</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnReset} onPress={resetRoute}>
              <Text style={styles.btnText}>Reiniciar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnSave}
              onPress={() => setShowModal(true)}
            >
              <Text style={styles.btnText}>Guardar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* MODAL PARA NOMBRE Y DESCRIPCIÓN */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Guardar Ruta</Text>

            <Text style={styles.label}>Nombre de la ruta</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Ruta Zona Norte"
              value={routeName}
              onChangeText={setRouteName}
            />

            <Text style={styles.label}>Descripción de la ruta</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Descripción opcional..."
              value={routeDescription}
              onChangeText={setRouteDescription}
              multiline
            />

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={saveRoute}
            >
              <Text style={styles.confirmText}>Confirmar y Guardar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={{ marginTop: 12, alignSelf: "center" }}
            >
              <Text style={{ color: "red" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// =====================
// ESTILOS
// =====================
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  userMarker: {
    width: 16,
    height: 16,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    borderWidth: 3,
    borderColor: "white",
  },

  buttonsRow: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },

  btn: {
    backgroundColor: "#007AFF",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  btnReset: {
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  btnSave: {
    backgroundColor: "green",
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },

  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },

  distanceBox: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  distanceText: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: "bold",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    width: "85%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
  },

  label: {
    fontSize: 14,
    marginBottom: 6,
  },

  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
  },

  confirmButton: {
    backgroundColor: "green",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },

  confirmText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});

import MapLibreGL, { CameraRef } from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "../components/RouteContext";

// ======================================================
// Función haversine
// ======================================================
function haversine(coord1: [number, number], coord2: [number, number]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MapLibreMap() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const cameraRef = useRef<CameraRef>(null);

  const {
    selectedRoute,
    selectedVehiculo,
    tracking,
    setTracking,
    trail,
    setTrail,
    currentRecorridoId,
    setCurrentRecorridoId,
  } = useRoute();

  const perfil_id = "09a3de3c-d389-4049-a670-1081dc02dfed";

  const [distance, setDistance] = useState(0);

  // ======================================================
  // POST: INICIAR RECORRIDO
  // ======================================================
  const iniciarRecorridoAPI = async () => {
    try {
      if (!selectedRoute) {
        alert("Debes seleccionar una ruta");
        return;
      }
      if (!selectedVehiculo) {
        alert("Debes seleccionar un vehículo");
        return;
      }

      const body = {
        ruta_id: selectedRoute.id,
        vehiculo_id: selectedVehiculo.id,
        perfil_id,
      };

      const resp = await fetch(
        "https://apirecoleccion.gonzaloandreslucio.com/api/recorridos/iniciar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        console.log("Error iniciar recorrido:", data);
        alert("Error al iniciar recorrido");
        return;
      }

      console.log("Recorrido iniciado:", data);
      // Asumiendo que la API devuelve { id: "uuid", ... }
      setCurrentRecorridoId(data.id);
    } catch (e) {
      console.log("ERROR iniciar recorrido:", e);
    }
  };

  // ======================================================
  // POST: FINALIZAR RECORRIDO
  // ======================================================
  const finalizarRecorridoAPI = async () => {
    try {
      if (!currentRecorridoId) return;

      const resp = await fetch(
        `https://apirecoleccion.gonzaloandreslucio.com/api/recorridos/${currentRecorridoId}/finalizar`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ perfil_id }),
        }
      );

      const data = await resp.json();
      console.log("Recorrido finalizado:", data);

      setCurrentRecorridoId(null);
    } catch (e) {
      console.log("ERROR finalizar recorrido:", e);
    }
  };

  // ======================================================
  // Callback estable para actualizaciones GPS
  // (solo actualiza ubicación + trail)
  // ======================================================
  const handlePosition = useCallback(
    (loc: Location.LocationObject) => {
      const coord: [number, number] = [
        loc.coords.longitude,
        loc.coords.latitude,
      ];

      setLocation(coord);

      cameraRef.current?.setCamera({
        centerCoordinate: coord,
        animationDuration: 300,
      });

      // 👇 SOLO actualizamos el trail aquí
      setTrail((prev) => [...prev, coord]);
    },
    [setTrail, setLocation]
  );

  // ======================================================
  // Efecto: recalcula la distancia cuando cambia el trail
  // ======================================================
  useEffect(() => {
    if (!tracking) return;
    if (trail.length < 2) return;

    const last = trail[trail.length - 1];
    const prev = trail[trail.length - 2];

    const d = haversine(prev, last);
    setDistance((prevDist) => prevDist + d);
  }, [trail, tracking]);

  // ======================================================
  // Ubicación inicial
  // ======================================================
  useEffect(() => {
    const load = async () => {
      const gpsEnabled = await Location.hasServicesEnabledAsync();
      if (!gpsEnabled) {
        alert("Activa el GPS.");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        alert("Permisos de ubicación requeridos.");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });

      const coord: [number, number] = [
        loc.coords.longitude,
        loc.coords.latitude,
      ];

      setLocation(coord);

      setTimeout(() => {
        cameraRef.current?.setCamera({
          centerCoordinate: coord,
          zoomLevel: 17,
          animationDuration: 1200,
        });
      }, 300);
    };

    load();
  }, []);

  // ======================================================
  // Tracking GPS en tiempo real
  // ======================================================
  useEffect(() => {
    if (!tracking) return;

    let subscription: Location.LocationSubscription | null = null;

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 500,
        distanceInterval: 0,
      },
      handlePosition
    ).then((sub) => (subscription = sub));

    return () => subscription?.remove();
  }, [tracking, handlePosition]);

  // Loader inicial
  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // ======================================================
  // Seguridad en coordenadas
  // ======================================================
  const safeRouteCoords: [number, number][] =
    selectedRoute?.coordinates?.filter(
      (c) => Array.isArray(c) && c.length === 2 && !isNaN(c[0]) && !isNaN(c[1])
    ) ?? [];

  const routeColor = selectedRoute?.color_hex || "#007AFF";

  // ======================================================
  // Render principal
  // ======================================================
  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        surfaceView
        mapStyle="https://api.maptiler.com/maps/streets/style.json?key=eB3WgCoYPm69Zm3tcZ5d"
      >
        <MapLibreGL.Camera ref={cameraRef} zoomLevel={16} />

        {/* Ubicación actual */}
        <MapLibreGL.PointAnnotation id="ubicacion" coordinate={location}>
          <View style={styles.userPoint} />
        </MapLibreGL.PointAnnotation>

        {/* Ruta seleccionada */}
        {safeRouteCoords.length > 1 && (
          <MapLibreGL.ShapeSource
            id="ruta"
            shape={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: safeRouteCoords,
              },
            }}
          >
            <MapLibreGL.LineLayer
              id="ruta-layer"
              style={{
                lineColor: routeColor,
                lineWidth: 5,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}

        {/* Recorrido actual */}
        {trail.length > 1 && (
          <MapLibreGL.ShapeSource
            id="recorrido"
            shape={{
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: trail,
              },
            }}
          >
            <MapLibreGL.LineLayer
              id="recorrido-linea"
              style={{
                lineColor: "orange",
                lineWidth: 4,
                lineDasharray: [2, 2],
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {/* Distancia */}
      {tracking && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Recorrido: {distance.toFixed(3)} km
          </Text>
        </View>
      )}

      {/* Botón iniciar / detener */}
      {selectedRoute && (
        <View style={styles.buttonBox}>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: tracking ? "#FF3B30" : "#007AFF" },
            ]}
            onPress={async () => {
              if (tracking) {
                // =============================
                // DETENER RECORRIDO
                // =============================
                setTracking(false);
                await finalizarRecorridoAPI();
              } else {
                // =============================
                // INICIAR RECORRIDO
                // =============================
                setTrail([]);
                setDistance(0);
                await iniciarRecorridoAPI();
                setTracking(true);
              }
            }}
          >
            <Text style={styles.btnText}>
              {tracking ? "Detener Recorrido" : "Iniciar Recorrido"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

//
// ESTILOS
//
const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  userPoint: {
    width: 14,
    height: 14,
    backgroundColor: "#007AFF",
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "white",
  },

  infoBox: {
    position: "absolute",
    top: 20,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  infoText: {
    backgroundColor: "rgba(0,0,0,0.6)",
    color: "white",
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 10,
    fontSize: 16,
    fontWeight: "bold",
  },

  buttonBox: {
    position: "absolute",
    bottom: 25,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  btn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 10,
  },

  btnText: {
    color: "white",
    fontSize: 17,
    fontWeight: "bold",
  },

  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: "white",
  },
});

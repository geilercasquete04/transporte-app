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
// 🔥 Función haversine para calcular distancia recorrida
// ======================================================
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

export default function MapLibreMap() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  const cameraRef = useRef<CameraRef>(null);

  const {
    selectedRoute,
    tracking,
    setTracking,
    trail,
    setTrail,
  } = useRoute();

  const [distance, setDistance] = useState(0);

  // ======================================================
  // 🔥 Callback estable para manejar actualizaciones GPS
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

      setTrail((prev) => {
        if (prev.length > 0) {
          const last = prev[prev.length - 1];
          const d = haversine(last, coord);
          setDistance((prevDist) => prevDist + d);
        }
        return [...prev, coord];
      });
    },
    [] // NO depende del render → evita errores
  );

  // ======================================================
  // 🔥 Obtener ubicación inicial con alta precisión
  // ======================================================
  useEffect(() => {
    const load = async () => {
      const gpsEnabled = await Location.hasServicesEnabledAsync();
      if (!gpsEnabled) {
        alert("Activa el GPS.");
        return;
      }

      await Location.enableNetworkProviderAsync();

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
  // 🔥 Tracking GPS tiempo real (usa el callback estable)
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

    return () => {
      subscription?.remove();
    };
  }, [tracking, handlePosition]);

  // ===============================
  // Loader inicial
  // ===============================
  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        surfaceView
        mapStyle="https://api.maptiler.com/maps/streets/style.json?key=eB3WgCoYPm69Zm3tcZ5d"
      >
        <MapLibreGL.Camera ref={cameraRef} zoomLevel={16} />

        {/* 🔵 Ubicación actual */}
        <MapLibreGL.PointAnnotation id="ubicacion" coordinate={location}>
          <View style={styles.userPoint} />
        </MapLibreGL.PointAnnotation>

        {/* RUTA SELECCIONADA */}
        {selectedRoute && selectedRoute.coordinates.length > 1 && (
          <>
            <MapLibreGL.PointAnnotation
              id="inicio-ruta"
              coordinate={selectedRoute.coordinates[0]}
            >
              <View style={[styles.marker, { backgroundColor: "green" }]} />
            </MapLibreGL.PointAnnotation>

            <MapLibreGL.PointAnnotation
              id="fin-ruta"
              coordinate={
                selectedRoute.coordinates[selectedRoute.coordinates.length - 1]
              }
            >
              <View style={[styles.marker, { backgroundColor: "red" }]} />
            </MapLibreGL.PointAnnotation>

            <MapLibreGL.ShapeSource
              id="ruta"
              shape={{
                type: "Feature",
                properties: {},
                geometry: {
                  type: "LineString",
                  coordinates: selectedRoute.coordinates,
                },
              }}
            >
              <MapLibreGL.LineLayer
                id="ruta-layer"
                style={{
                  lineColor: selectedRoute.color_hex || "#007AFF",
                  lineWidth: 5,
                }}
              />
            </MapLibreGL.ShapeSource>
          </>
        )}

        {/* RECORRIDO */}
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

      {/* DISTANCIA */}
      {tracking && (
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Recorrido: {distance.toFixed(3)} km
          </Text>
        </View>
      )}

      {/* BOTÓN */}
      {selectedRoute && (
        <View style={styles.buttonBox}>
          <TouchableOpacity
            style={[
              styles.btn,
              { backgroundColor: tracking ? "#FF3B30" : "#007AFF" },
            ]}
            onPress={() => {
              if (tracking) {
                setTracking(false);
              } else {
                setTrail([]);
                setDistance(0);
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

  marker: {
    width: 18,
    height: 18,
    borderRadius: 9,
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
});

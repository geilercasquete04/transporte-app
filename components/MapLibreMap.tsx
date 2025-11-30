// components/MapLibreMap.tsx
import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useRoute } from "./RouteContext";

export default function MapLibreMap() {
  const { selectedRoute, setSelectedRoute } = useRoute();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    null
  );

  // Obtener ubicación del dispositivo
  useEffect(() => {
    const obtenerUbicacion = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setUserLocation([loc.coords.longitude, loc.coords.latitude]);
    };

    obtenerUbicacion();
  }, []);

  if (!userLocation) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Punto del usuario
  const userPoint: any = {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Point",
      coordinates: userLocation,
    },
  };

  // Coordenadas de la ruta seleccionada
  const routeCoords: [number, number][] = selectedRoute?.coordinates || [];

  // GeoJSON de la ruta
  const routeFeature: any =
    routeCoords.length > 0
      ? {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: routeCoords,
          },
        }
      : null;

  const limpiarRuta = () => setSelectedRoute(null);

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL="https://api.maptiler.com/maps/base-v4/style.json?key=eB3WgCoYPm69Zm3tcZ5d"
      >
        <MapLibreGL.Camera
          zoomLevel={14}
          centerCoordinate={
            routeCoords.length > 0 ? routeCoords[0] : userLocation
          }
        />

        {/* Ubicación del usuario */}
        <MapLibreGL.ShapeSource id="user" shape={userPoint}>
          <MapLibreGL.SymbolLayer
            id="userIcon"
            style={{
              iconImage: "marker-15",
              iconSize: 1.5,
            }}
          />
        </MapLibreGL.ShapeSource>

        {/* Ruta dibujada */}
        {routeFeature && (
          <MapLibreGL.ShapeSource id="route" shape={routeFeature}>
            <MapLibreGL.LineLayer
              id="rutaLinea"
              style={{
                lineColor: "#007AFF",
                lineWidth: 4,
              }}
            />
          </MapLibreGL.ShapeSource>
        )}
      </MapLibreGL.MapView>

      {/* Panel de información */}
      {selectedRoute && (
        <View style={styles.routeInfoPanel}>
          <View style={styles.routeInfoHeader}>
            <Text style={styles.routeInfoTitle}>
              🗺️ {selectedRoute.nombre_ruta}
            </Text>

            <TouchableOpacity onPress={limpiarRuta} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  routeInfoPanel: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 12,
    elevation: 4,
  },
  routeInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  clearButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: "#FF3B30",
  },
  clearButtonText: { color: "white", fontWeight: "bold" },
});

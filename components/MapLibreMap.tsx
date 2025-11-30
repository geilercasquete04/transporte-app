import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useRoute } from "../components/RouteContext";

export default function MapLibreMap() {
  const [location, setLocation] = useState<[number, number] | null>(null);
  
  const { selectedRoute } = useRoute();

  useEffect(() => {
    const load = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const loc = await Location.getCurrentPositionAsync({});
      setLocation([loc.coords.longitude, loc.coords.latitude]);
    };
    load();
  }, []);

  if (!location) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // === Obtener puntos de inicio y fin ===
  const inicio = selectedRoute?.coordinates?.[0];
  const fin = selectedRoute?.coordinates?.[selectedRoute.coordinates.length - 1];

  return (
  <MapLibreGL.MapView
    style={styles.map}
    surfaceView
    mapStyle="https://api.maptiler.com/maps/streets/style.json?key=eB3WgCoYPm69Zm3tcZ5d"
  >
    <MapLibreGL.Camera
      followUserLocation
      followUserMode={MapLibreGL.UserTrackingMode.Follow}
      zoomLevel={16}
    />

    {/* 🔵 Ubicación del usuario */}
    <MapLibreGL.PointAnnotation id="ubicacion-usuario" coordinate={location}>
      <View
        style={{
          width: 14,
          height: 14,
          backgroundColor: "#007AFF",
          borderRadius: 7,
          borderWidth: 2,
          borderColor: "white",
        }}
      />
    </MapLibreGL.PointAnnotation>

    {/* ✔ Solo mostrar si existe selectedRoute y tiene coords */}
    {selectedRoute && selectedRoute.coordinates && selectedRoute.coordinates.length > 1 && (
      <>
        {/* 🟢 Inicio */}
        <MapLibreGL.PointAnnotation
          id="inicio-ruta"
          coordinate={selectedRoute.coordinates[0]}
        >
          <View
            style={{
              width: 18,
              height: 18,
              backgroundColor: "green",
              borderRadius: 9,
              borderWidth: 2,
              borderColor: "white",
            }}
          />
        </MapLibreGL.PointAnnotation>

        {/* 🔴 Fin */}
        <MapLibreGL.PointAnnotation
          id="fin-ruta"
          coordinate={
            selectedRoute.coordinates[selectedRoute.coordinates.length - 1]
          }
        >
          <View
            style={{
              width: 18,
              height: 18,
              backgroundColor: "red",
              borderRadius: 9,
              borderWidth: 2,
              borderColor: "white",
            }}
          />
        </MapLibreGL.PointAnnotation>

        {/* 🟡 Línea de la ruta */}
        <MapLibreGL.ShapeSource
          id="ruta"
          shape={{
            type: "Feature",
            properties: {},        // ✔ requerido por GeoJSON
            geometry: {
              type: "LineString",
              coordinates: selectedRoute.coordinates,
            },
          }}
        >
          <MapLibreGL.LineLayer
            id="ruta-linea"
            style={{
              lineColor: selectedRoute.color_hex || "#007AFF",
              lineWidth: 5,
            }}
          />
        </MapLibreGL.ShapeSource>
      </>
    )}
  </MapLibreGL.MapView>
);

}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});

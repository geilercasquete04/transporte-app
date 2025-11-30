import MapLibreGL from "@maplibre/maplibre-react-native";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

export default function MapLibreMap() {
  const [location, setLocation] = useState<[number, number] | null>(null);

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

  return (
    <MapLibreGL.MapView
      style={styles.map}
      mapStyle="https://api.maptiler.com/maps/streets/style.json?key=eB3WgCoYPm69Zm3tcZ5d"
      surfaceView
    >
      <MapLibreGL.Camera
        followUserLocation
        followUserMode={MapLibreGL.UserTrackingMode.Follow}
        zoomLevel={16}
      />

      {/* 🔥 punto en la ubicación REAL */}
      <MapLibreGL.PointAnnotation
        id="ubicacion-usuario"
        coordinate={location}   // <--- AQUÍ
      >
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

    </MapLibreGL.MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" }
});

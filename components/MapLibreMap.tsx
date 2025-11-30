// components/MapLibreMap.tsx
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRoute } from './RouteContext';

interface MapLibreMapProps {
  nombre: string;
}

export default function MapLibreMap({ nombre }: MapLibreMapProps) {
  const mapRef = useRef<MapView>(null);
  const { selectedRoute, setSelectedRoute } = useRoute();
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const [region, setRegion] = useState({
    latitude: 3.8758,
    longitude: -77.0342,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    obtenerUbicacion();
  }, []);

  useEffect(() => {
    if (selectedRoute?.coordinates.length) {
      centrarEnRuta();
    }
  }, [selectedRoute]);

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se puede acceder a la ubicación");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };

      setUserLocation(coords);
      setRegion({
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (e) {
      console.error("Error obteniendo ubicación:", e);
    }
  };

  const centrarEnRuta = () => {
    if (!selectedRoute || !mapRef.current) return;

    const coords = selectedRoute.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    }));

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 80, bottom: 80, left: 80, right: 80 },
      animated: true,
    });
  };

  const limpiarRuta = () => {
    setSelectedRoute(null);
  };

  const routeCoordinates =
    selectedRoute?.coordinates.map(([lng, lat]) => ({
      latitude: lat,
      longitude: lng,
    })) || [];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={region}
        showsUserLocation
        showsMyLocationButton
      >
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title={nombre}
            description="Tu ubicación actual"
            pinColor="blue"
          />
        )}

        {routeCoordinates.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={selectedRoute?.color_hex || "#007AFF"}
              strokeWidth={4}
            />

            <Marker coordinate={routeCoordinates[0]} title="Inicio" pinColor="green" />
            <Marker coordinate={routeCoordinates[routeCoordinates.length - 1]} title="Fin" pinColor="red" />
          </>
        )}
      </MapView>

      {selectedRoute && (
        <View style={styles.routeInfoPanel}>
          <View style={styles.routeInfoHeader}>
            <Text style={styles.routeInfoTitle}>🗺️ {selectedRoute.nombre_ruta}</Text>
            <TouchableOpacity onPress={limpiarRuta} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.centerButton} onPress={centrarEnRuta}>
            <Text style={styles.centerButtonText}>📍 Centrar en ruta</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },

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
    backgroundColor: "#FF3B30",
    borderRadius: 20,
    padding: 5,
  },
  clearButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  centerButton: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  centerButtonText: {
    color: "white",
    fontWeight: "600",
  },
});

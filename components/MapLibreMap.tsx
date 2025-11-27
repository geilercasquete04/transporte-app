// components/MapLibreMap.tsx
import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRoute } from '../components/routeContext';

interface MapLibreMapProps {
  nombre: string;
}

export default function MapLibreMap({ nombre }: MapLibreMapProps) {
  const mapRef = useRef<MapView>(null);
  const { selectedRoute, setSelectedRoute } = useRoute();
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [region, setRegion] = useState({
    latitude: 3.8758, // Buenaventura, Colombia
    longitude: -77.0342,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  useEffect(() => {
    obtenerUbicacion();
  }, []);

  useEffect(() => {
    if (selectedRoute && selectedRoute.coordinates.length > 0) {
      // Cuando se selecciona una ruta, ajustar el mapa para mostrarla
      centrarEnRuta();
    }
  }, [selectedRoute]);

  const obtenerUbicacion = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'No se puede acceder a la ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
      
      setUserLocation(coords);
      setRegion({
        ...coords,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
    }
  };

  const centrarEnRuta = () => {
    if (!selectedRoute || !mapRef.current) return;

    // Convertir coordenadas de [lng, lat] a {latitude, longitude}
    const coordinates = selectedRoute.coordinates.map(coord => ({
      latitude: coord[1], // lat
      longitude: coord[0], // lng
    }));

    if (coordinates.length > 0) {
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: {
          top: 100,
          right: 50,
          bottom: 100,
          left: 50,
        },
        animated: true,
      });
    }
  };

  const limpiarRuta = () => {
    setSelectedRoute(null);
    Alert.alert('Ruta limpiada', 'La ruta ha sido removida del mapa');
  };

  // Convertir coordenadas para react-native-maps
  const routeCoordinates = selectedRoute
    ? selectedRoute.coordinates.map(coord => ({
        latitude: coord[1], // lat
        longitude: coord[0], // lng
      }))
    : [];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={region}
        showsUserLocation={true}
        showsMyLocationButton={true}
        followsUserLocation={false}
      >
        {/* Mostrar ubicación del usuario */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title={nombre}
            description="Tu ubicación actual"
            pinColor="blue"
          />
        )}

        {/* Dibujar la ruta seleccionada */}
        {routeCoordinates.length > 0 && (
          <>
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={selectedRoute?.color_hex || '#007AFF'}
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
            />

            {/* Marcador de inicio */}
            <Marker
              coordinate={routeCoordinates[0]}
              title="Inicio"
              description={selectedRoute?.nombre_ruta}
              pinColor="green"
            />

            {/* Marcador de fin */}
            {routeCoordinates.length > 1 && (
              <Marker
                coordinate={routeCoordinates[routeCoordinates.length - 1]}
                title="Fin"
                description={selectedRoute?.nombre_ruta}
                pinColor="red"
              />
            )}
          </>
        )}
      </MapView>

      {/* Panel de información de la ruta */}
      {selectedRoute && (
        <View style={styles.routeInfoPanel}>
          <View style={styles.routeInfoContent}>
            <View style={styles.routeInfoHeader}>
              <Text style={styles.routeInfoTitle}>
                🗺️ {selectedRoute.nombre_ruta}
              </Text>
              <TouchableOpacity onPress={limpiarRuta} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.routeInfoDetails}>
              <View style={styles.colorIndicator}>
                <View
                  style={[
                    styles.colorBox,
                    { backgroundColor: selectedRoute.color_hex },
                  ]}
                />
                <Text style={styles.colorText}>{selectedRoute.color_hex}</Text>
              </View>
              <Text style={styles.pointsText}>
                {routeCoordinates.length} puntos
              </Text>
            </View>

            <TouchableOpacity
              style={styles.centerButton}
              onPress={centrarEnRuta}
            >
              <Text style={styles.centerButtonText}>📍 Centrar en ruta</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  routeInfoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoContent: {
    gap: 10,
  },
  routeInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  clearButton: {
    padding: 5,
    backgroundColor: '#FF3B30',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  routeInfoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  colorText: {
    fontSize: 12,
    color: '#666',
  },
  pointsText: {
    fontSize: 12,
    color: '#666',
  },
  centerButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  centerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
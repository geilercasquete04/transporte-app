import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../contexts/ThemeContext';
import { useLocation } from '../hooks/useLocation';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

// Coordenadas de Buenaventura, Valle del Cauca
const BUENAVENTURA_COORDS = {
  latitude: 3.8801,
  longitude: -77.0312,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export function TransporteMapView() {
  const { location, errorMsg, loading, refreshLocation } = useLocation();
  const { isDarkMode } = useTheme();

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Obteniendo ubicación...</ThemedText>
      </ThemedView>
    );
  }

  if (errorMsg) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>Error: {errorMsg}</ThemedText>
        <TouchableOpacity 
          style={styles.retryButton} 
          onPress={refreshLocation}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Si hay ubicación del usuario, centrar en ella, sino en Buenaventura
  const mapRegion = location ? {
    ...BUENAVENTURA_COORDS,
    latitude: location.latitude,
    longitude: location.longitude,
  } : BUENAVENTURA_COORDS;

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={mapRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        customMapStyle={isDarkMode ? darkMapStyle : []}
      >
        {/* Marcador de la posición actual del usuario */}
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title="Mi ubicación"
            description="Tu posición actual"
            pinColor="blue"
          >
            <View style={styles.customMarker}>
              <Ionicons name="person" size={20} color="white" />
            </View>
          </Marker>
        )}

        {/* Marcadores de ejemplo para rutas del camión */}
        <Marker
          coordinate={{ latitude: 3.8901, longitude: -77.0412 }}
          title="Ruta Norte"
          description="Camión de basura - Ruta Norte"
          pinColor="green"
        >
          <View style={[styles.customMarker, { backgroundColor: 'green' }]}>
            <Ionicons name="trash" size={16} color="white" />
          </View>
        </Marker>

        <Marker
          coordinate={{ latitude: 3.8701, longitude: -77.0212 }}
          title="Ruta Centro"
          description="Camión de basura - Ruta Centro"
          pinColor="orange"
        >
          <View style={[styles.customMarker, { backgroundColor: 'orange' }]}>
            <Ionicons name="trash" size={16} color="white" />
          </View>
        </Marker>

        <Marker
          coordinate={{ latitude: 3.8601, longitude: -77.0512 }}
          title="Ruta Sur"
          description="Camión de basura - Ruta Sur"
          pinColor="red"
        >
          <View style={[styles.customMarker, { backgroundColor: 'red' }]}>
            <Ionicons name="trash" size={16} color="white" />
          </View>
        </Marker>
      </MapView>

      {/* Panel de información */}
      <View style={[
        styles.infoPanel, 
        { backgroundColor: isDarkMode ? '#1e1e1e' : 'white' }
      ]}>
        <ThemedText type="defaultSemiBold">Tu ubicación:</ThemedText>
        {location ? (
          <>
            <ThemedText style={styles.coordText}>
              Lat: {location.latitude.toFixed(6)}
            </ThemedText>
            <ThemedText style={styles.coordText}>
              Lng: {location.longitude.toFixed(6)}
            </ThemedText>
            {location.accuracy && (
              <ThemedText style={styles.accuracyText}>
                Precisión: {Math.round(location.accuracy)}m
              </ThemedText>
            )}
          </>
        ) : (
          <ThemedText>Ubicación no disponible</ThemedText>
        )}
      </View>
    </View>
  );
}

// Estilo de mapa oscuro
const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }],
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }],
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }],
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  customMarker: {
    backgroundColor: 'blue',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  coordText: {
    fontSize: 12,
    marginTop: 2,
  },
  accuracyText: {
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
});
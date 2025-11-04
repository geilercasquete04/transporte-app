import * as Location from 'expo-location';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { WebView } from 'react-native-webview';

const BUENAVENTURA_COORDS = {
  latitude: 3.8801,
  longitude: -77.0316,
};

const MapComponent: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [watching, setWatching] = useState<boolean>(false);
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  useEffect(() => {
    getCurrentLocation();
    return () => cleanupLocationWatching();
  }, []);

  const cleanupLocationWatching = () => {
    if (watchSubscriptionRef.current) {
      try {
        watchSubscriptionRef.current.remove();
      } catch (error) {
        console.log('Error limpiando suscripción:', error);
      } finally {
        watchSubscriptionRef.current = null;
      }
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permisos de ubicación denegados');
        setLoading(false);
        Alert.alert('Permisos Requeridos', 'Esta aplicación necesita permisos de ubicación.');
        return;
      }
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(currentLocation);
      setLoading(false);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setErrorMsg('Error al obtener la ubicación');
      setLoading(false);
    }
  };

  const startWatching = async () => {
    try {
      cleanupLocationWatching();
      setWatching(true);
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 3000,
          distanceInterval: 5,
        },
        (newLocation) => setLocation(newLocation)
      );
      watchSubscriptionRef.current = subscription;
    } catch (error) {
      console.error('Error iniciando seguimiento:', error);
      setWatching(false);
    }
  };

  const stopWatching = () => {
    cleanupLocationWatching();
    setWatching(false);
  };

  const generateMapHTML = () => {
    const userLat = location?.coords.latitude || BUENAVENTURA_COORDS.latitude;
    const userLng = location?.coords.longitude || BUENAVENTURA_COORDS.longitude;
    const hasUserLocation = location !== null;

    // 🚀 Inyectamos la variable JS isDarkMode desde React Native
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mapa</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; }
          body { background-color: ${isDarkMode ? '#121212' : '#fff'}; color: ${isDarkMode ? '#fff' : '#000'}; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${userLat}, ${userLng}], 16);

          var light = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
          });

          var dark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap, © CARTO'
          });

          // Usamos el valor de React Native
          var isDarkMode = ${isDarkMode};

          if (isDarkMode) {
            dark.addTo(map);
          } else {
            light.addTo(map);
          }

          ${hasUserLocation ? `
            var userIcon = L.divIcon({
              html: '<div style="background-color:${watching ? '#27ae60' : '#E74C3C'};width:20px;height:20px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>',
              className: 'custom-icon',
              iconSize: [20, 20],
              iconAnchor: [10, 10]
            });
            L.marker([${userLat}, ${userLng}], {icon: userIcon})
              .addTo(map)
              .bindPopup('📍 ${watching ? 'Siguiendo...' : 'Mi ubicación'}');
          ` : ''}
        </script>
      </body>
      </html>
    `;
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={[styles.infoPanel, isDarkMode && styles.darkPanel]}>
        <Text style={[styles.title, isDarkMode && styles.darkTitle]}>📍 Mi Ubicación</Text>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#E74C3C" />
            <Text style={[styles.statusText, isDarkMode && styles.darkText]}>Obteniendo ubicación...</Text>
          </View>
        )}

        {errorMsg && <Text style={[styles.errorText, isDarkMode && styles.darkText]}>⚠️ {errorMsg}</Text>}

        {location && (
          <View style={[styles.locationInfo, isDarkMode && styles.darkLocationInfo]}>
            <Text style={[styles.coordText, isDarkMode && styles.darkText]}>
              {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={getCurrentLocation} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Cargando...' : 'Actualizar'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, watching ? styles.stopButton : styles.startButton]}
            onPress={watching ? stopWatching : startWatching}
          >
            <Text style={styles.buttonText}>{watching ? 'Detener' : 'Seguir'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          originWhitelist={['*']}
          source={{ html: generateMapHTML() }}
          style={styles.webView}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  darkContainer: { backgroundColor: '#121212' },
  infoPanel: { backgroundColor: 'white', padding: 16, elevation: 4 },
  darkPanel: { backgroundColor: '#1E1E1E' },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, color: '#E74C3C' },
  darkTitle: { color: '#FF6B6B' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statusText: { marginLeft: 8, color: '#666', fontSize: 14 },
  darkText: { color: '#ddd' },
  errorText: { textAlign: 'center', color: '#E74C3C', fontSize: 14, marginBottom: 8 },
  locationInfo: { backgroundColor: '#f8f9fa', padding: 12, borderRadius: 8, marginBottom: 12 },
  darkLocationInfo: { backgroundColor: '#2C2C2C' },
  coordText: { fontSize: 12, color: '#333' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
  startButton: { backgroundColor: '#27ae60' },
  stopButton: { backgroundColor: '#e74c3c' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  mapContainer: { flex: 1, margin: 8, borderRadius: 12, overflow: 'hidden' },
  webView: { flex: 1 },
});

export default MapComponent;

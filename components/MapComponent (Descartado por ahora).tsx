import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { WebView } from 'react-native-webview';

// Coordenadas de Buenaventura, Valle del Cauca (solo para fallback)
const BUENAVENTURA_COORDS = {
  latitude: 3.8801,
  longitude: -77.0316
};

const MapComponent: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [watching, setWatching] = useState<boolean>(false);
  
  // ✅ USAMOS useRef para manejar la suscripción de forma más segura
  const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  // Obtener permisos y ubicación inicial
  useEffect(() => {
    getCurrentLocation();
    
    // Cleanup al desmontar el componente
    return () => {
      cleanupLocationWatching();
    };
  }, []);

  // ✅ FUNCIÓN DE LIMPIEZA CENTRALIZADA
  const cleanupLocationWatching = () => {
    if (watchSubscriptionRef.current) {
      try {
        watchSubscriptionRef.current.remove();
        console.log('Suscripción removida en cleanup');
      } catch (error) {
        console.log('Error en cleanup, pero continuando:', error);
      } finally {
        watchSubscriptionRef.current = null;
      }
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permisos de ubicación denegados');
        setLoading(false);
        Alert.alert(
          'Permisos Requeridos',
          'Esta aplicación necesita permisos de ubicación para funcionar correctamente.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10
      });

      setLocation(currentLocation);
      setLoading(false);
      console.log('Ubicación obtenida:', currentLocation.coords);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setErrorMsg('Error al obtener la ubicación');
      setLoading(false);
      Alert.alert('Error', 'No se pudo obtener la ubicación actual');
    }
  };

  // ✅ FUNCIÓN MEJORADA - Iniciar seguimiento
  const startWatching = async () => {
    try {
      // Primero limpiamos cualquier suscripción existente
      cleanupLocationWatching();
      
      setWatching(true);
      console.log('Iniciando seguimiento de ubicación...');
      
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced, // Cambiado a Balanced para mejor rendimiento
          timeInterval: 3000, // Cada 3 segundos
          distanceInterval: 5, // Cada 5 metros
        },
        (newLocation) => {
          console.log('📍 Nueva ubicación:', newLocation.coords);
          setLocation(newLocation);
        }
      );
      
      watchSubscriptionRef.current = subscription;
      console.log('✅ Seguimiento iniciado correctamente');
      
    } catch (error) {
      console.error('❌ Error iniciando seguimiento:', error);
      setWatching(false);
      Alert.alert(
        'Error', 
        'No se pudo iniciar el seguimiento. Verifica los permisos de ubicación.'
      );
    }
  };

  // ✅ FUNCIÓN MEJORADA - Detener seguimiento
  const stopWatching = () => {
    console.log('Deteniendo seguimiento...');
    cleanupLocationWatching();
    setWatching(false);
    console.log('🛑 Seguimiento detenido');
  };

  // Generar HTML del mapa con Leaflet
  const generateMapHTML = () => {
    const userLat = location?.coords.latitude || BUENAVENTURA_COORDS.latitude;
    const userLng = location?.coords.longitude || BUENAVENTURA_COORDS.longitude;
    const hasUserLocation = location !== null;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mi Ubicación</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #map { width: 100%; height: 100vh; }
        .custom-icon {
          background: transparent;
          border: none;
          text-align: center;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        @keyframes pulse { 
          0% { transform: scale(1); } 
          50% { transform: scale(1.1); } 
          100% { transform: scale(1); } 
        }
        .watching { animation: pulse 1.5s infinite; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${userLat}, ${userLng}], 16);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
        
        ${hasUserLocation ? `
        var userIcon = L.divIcon({
          html: '<div style="background-color: ${watching ? '#27ae60' : '#E74C3C'}; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);" class="${watching ? 'watching' : ''}"></div>',
          className: 'custom-icon',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        });
        
        L.marker([${userLat}, ${userLng}], {icon: userIcon})
          .addTo(map)
          .bindPopup(\`
            <div style="text-align: center; padding: 8px; min-width: 180px;">
              <h3 style="margin: 0 0 8px 0; color: ${watching ? '#27ae60' : '#E74C3C'}; font-size: 14px;">
                📍 ${watching ? 'Siguiendo...' : 'Mi Ubicación'}
              </h3>
              <p style="margin: 4px 0; font-size: 11px; color: #666; font-family: monospace;">
                ${userLat.toFixed(6)}, ${userLng.toFixed(6)}
              </p>
              <p style="margin: 4px 0; font-size: 10px; color: #888;">
                ±${location?.coords.accuracy?.toFixed(0) || '??'} metros
              </p>
            </div>
          \`)
          .openPopup();
        ` : `
        L.popup()
          .setLatLng([${userLat}, ${userLng}])
          .setContent('<div style="text-align: center; padding: 10px;"><p>🔍 Buscando ubicación...</p></div>')
          .openOn(map);
        `}
      </script>
    </body>
    </html>
    `;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Panel de información superior */}
      <View style={styles.infoPanel}>
        <Text style={styles.title}>📍 Mi Ubicación</Text>
        
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#E74C3C" />
            <Text style={styles.statusText}>Obteniendo ubicación...</Text>
          </View>
        )}
        
        {errorMsg && (
          <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
        )}
        
        {location && (
          <View style={styles.locationInfo}>
            <Text style={styles.coordText}>
              📍 {location.coords.latitude.toFixed(6)}, {location.coords.longitude.toFixed(6)}
            </Text>
            <Text style={styles.accuracyText}>
              🎯 Precisión: ±{location.coords.accuracy?.toFixed(0) || 'N/A'} metros
            </Text>
            {watching && (
              <Text style={styles.watchingText}>
                🟢 Siguiendo en tiempo real
              </Text>
            )}
          </View>
        )}
        
        {/* Botones de control */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, loading && styles.disabledButton]} 
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Cargando...' : 'Actualizar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.button, 
              watching ? styles.stopButton : styles.startButton,
              loading && styles.disabledButton
            ]} 
            onPress={watching ? stopWatching : startWatching}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {watching ? 'Detener' : 'Seguir'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: generateMapHTML() }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.webViewLoading}>
              <ActivityIndicator size="large" color="#E74C3C" />
              <Text style={styles.loadingText}>Cargando mapa...</Text>
            </View>
          )}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error: ', nativeEvent);
          }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  infoPanel: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#E74C3C',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statusText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  errorText: {
    textAlign: 'center',
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 8,
  },
  locationInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  coordText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  accuracyText: {
    fontSize: 12,
    color: '#888',
  },
  watchingText: {
    fontSize: 12,
    color: '#27ae60',
    fontWeight: '600',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#27ae60',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  disabledButton: {
    backgroundColor: '#95a5a6',
  },
  buttonText: {
    color: 'black',
    fontWeight: '600',
    fontSize: 12,
  },
  mapContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  webView: {
    flex: 1,
  },
  webViewLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
});

export default MapComponent;
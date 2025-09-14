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

// Coordenadas de Buenaventura, Valle del Cauca
const BUENAVENTURA_COORDS = {
  latitude: 3.8801,
  longitude: -77.0316
};

// RUTA MOCK PREDEFINIDA DEL CAMIÓN DE BASURA
// Simula un recorrido típico por barrios de Buenaventura
const TRUCK_ROUTE = [
  // Inicio - Centro de Buenaventura
  { lat: 3.8801, lng: -77.0316, description: "Terminal de Transporte" },
  { lat: 3.8821, lng: -77.0306, description: "Barrio El Centro" },
  { lat: 3.8841, lng: -77.0296, description: "Barrio La Playita" },
  { lat: 3.8861, lng: -77.0286, description: "Barrio San José" },
  { lat: 3.8881, lng: -77.0276, description: "Barrio El Cristal" },
  { lat: 3.8901, lng: -77.0266, description: "Barrio Bellavista" },
  { lat: 3.8921, lng: -77.0256, description: "Barrio Nueva Esperanza" },
  { lat: 3.8941, lng: -77.0246, description: "Barrio Los Ángeles" },
  { lat: 3.8961, lng: -77.0236, description: "Barrio El Porvenir" },
  { lat: 3.8981, lng: -77.0226, description: "Barrio Villa del Mar" },
  // Regreso por otra ruta
  { lat: 3.8971, lng: -77.0246, description: "Av. Simón Bolívar" },
  { lat: 3.8951, lng: -77.0266, description: "Barrio El Progreso" },
  { lat: 3.8931, lng: -77.0286, description: "Barrio La Independencia" },
  { lat: 3.8911, lng: -77.0306, description: "Barrio El Triunfo" },
  { lat: 3.8891, lng: -77.0326, description: "Barrio La Paz" },
  { lat: 3.8871, lng: -77.0346, description: "Barrio San Francisco" },
  { lat: 3.8851, lng: -77.0336, description: "Barrio El Jardín" },
  { lat: 3.8831, lng: -77.0326, description: "Barrio Vista Hermosa" },
  { lat: 3.8811, lng: -77.0316, description: "Retorno al Terminal" }
];

interface TruckPosition {
  lat: number;
  lng: number;
  description: string;
  timestamp: Date;
  routeIndex: number;
}

const TruckSimulatorComponent: React.FC = () => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [truckPosition, setTruckPosition] = useState<TruckPosition>({
    lat: TRUCK_ROUTE[0].lat,
    lng: TRUCK_ROUTE[0].lng,
    description: TRUCK_ROUTE[0].description,
    timestamp: new Date(),
    routeIndex: 0
  });
  const [isSimulationRunning, setIsSimulationRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(3000); // 3 segundos entre puntos
  
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const webViewRef = useRef<WebView>(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    getUserLocation();
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setUserLocation(currentLocation);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setLoading(false);
    }
  };

  // Iniciar simulación del camión
  const startSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }

    setIsSimulationRunning(true);
    let currentIndex = 0;

    simulationIntervalRef.current = setInterval(() => {
      const routePoint = TRUCK_ROUTE[currentIndex];
      
      setTruckPosition({
        lat: routePoint.lat,
        lng: routePoint.lng,
        description: routePoint.description,
        timestamp: new Date(),
        routeIndex: currentIndex
      });

      // Actualizar mapa enviando mensaje al WebView
      if (webViewRef.current) {
        const updateScript = `
          if (typeof updateTruckPosition === 'function') {
            updateTruckPosition(${routePoint.lat}, ${routePoint.lng}, '${routePoint.description}', ${currentIndex});
          }
        `;
        webViewRef.current.postMessage(updateScript);
      }

      currentIndex = (currentIndex + 1) % TRUCK_ROUTE.length;
      
      // Si completó una vuelta, mostrar notificación
      if (currentIndex === 0) {
        Alert.alert("🚛 Recorrido Completado", "El camión ha completado una vuelta completa y comenzará nuevamente");
      }
    }, simulationSpeed);
  };

  // Detener simulación
  const stopSimulation = () => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
      simulationIntervalRef.current = null;
    }
    setIsSimulationRunning(false);
  };

  // Cambiar velocidad de simulación
  const changeSpeed = (speed: number) => {
    setSimulationSpeed(speed);
    if (isSimulationRunning) {
      stopSimulation();
      setTimeout(() => startSimulation(), 100);
    }
  };

  // Centrar mapa en camión
  const centerOnTruck = () => {
    if (webViewRef.current) {
      const centerScript = `
        if (typeof centerMapOnTruck === 'function') {
          centerMapOnTruck();
        }
      `;
      webViewRef.current.postMessage(centerScript);
    }
  };

  // Centrar mapa en usuario
  const centerOnUser = () => {
    if (webViewRef.current && userLocation) {
      const centerScript = `
        if (typeof centerMapOnUser === 'function') {
          centerMapOnUser(${userLocation.coords.latitude}, ${userLocation.coords.longitude});
        }
      `;
      webViewRef.current.postMessage(centerScript);
    }
  };

  // Generar HTML del mapa
  const generateMapHTML = () => {
    const userLat = userLocation?.coords.latitude || BUENAVENTURA_COORDS.latitude;
    const userLng = userLocation?.coords.longitude || BUENAVENTURA_COORDS.longitude;
    
    // Generar puntos de la ruta para dibujar la línea
    const routePoints = TRUCK_ROUTE.map(point => `[${point.lat}, ${point.lng}]`).join(',');
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Camión de Basura - Buenaventura</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        #map { width: 100%; height: 100vh; }
        .truck-icon, .user-icon {
          background: transparent;
          border: none;
          text-align: center;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        @keyframes truck-move {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .truck-active { animation: truck-move 2s infinite; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([${truckPosition.lat}, ${truckPosition.lng}], 14);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Dibujar la ruta completa
        var routeCoords = [${routePoints}];
        var routeLine = L.polyline(routeCoords, {
          color: '#3498db',
          weight: 4,
          opacity: 0.7,
          dashArray: '10, 10'
        }).addTo(map);
        
        // Marcador del camión
        var truckIcon = L.divIcon({
          html: '<div style="background-color: #27ae60; width: 35px; height: 35px; border-radius: 50%; border: 4px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 18px;" class="truck-active">🚛</div>',
          className: 'truck-icon',
          iconSize: [35, 35],
          iconAnchor: [17, 17]
        });
        
        var truckMarker = L.marker([${truckPosition.lat}, ${truckPosition.lng}], {icon: truckIcon})
          .addTo(map)
          .bindPopup(\`
            <div style="text-align: center; padding: 12px; min-width: 220px;">
              <h3 style="margin: 0 0 8px 0; color: #27ae60; font-size: 16px;">
                🚛 Camión Recolector
              </h3>
              <p style="margin: 4px 0; font-size: 13px; color: #666; font-weight: 600;">
                📍 ${truckPosition.description}
              </p>
              <p style="margin: 4px 0; font-size: 11px; color: #888;">
                Punto ${truckPosition.routeIndex + 1} de ${TRUCK_ROUTE.length}
              </p>
              <p style="margin: 4px 0; font-size: 10px; color: #999;">
                ⏰ ${truckPosition.timestamp.toLocaleTimeString()}
              </p>
              <p style="margin: 6px 0 0 0; font-size: 10px; color: ${isSimulationRunning ? '#27ae60' : '#e74c3c'}; font-weight: bold;">
                ${isSimulationRunning ? '🟢 EN RECORRIDO' : '🔴 DETENIDO'}
              </p>
            </div>
          \`)
          .openPopup();
        
        // Marcador del usuario si existe
        ${userLocation ? `
        var userIcon = L.divIcon({
          html: '<div style="background-color: #3498db; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
          className: 'user-icon',
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        
        var userMarker = L.marker([${userLat}, ${userLng}], {icon: userIcon})
          .addTo(map)
          .bindPopup('<div style="text-align: center; padding: 8px;"><p>📍 Tu ubicación</p></div>');
        ` : ''}
        
        // Funciones para actualizar desde React Native
        window.updateTruckPosition = function(lat, lng, description, routeIndex) {
          truckMarker.setLatLng([lat, lng]);
          truckMarker.getPopup().setContent(\`
            <div style="text-align: center; padding: 12px; min-width: 220px;">
              <h3 style="margin: 0 0 8px 0; color: #27ae60; font-size: 16px;">
                🚛 Camión Recolector
              </h3>
              <p style="margin: 4px 0; font-size: 13px; color: #666; font-weight: 600;">
                📍 \${description}
              </p>
              <p style="margin: 4px 0; font-size: 11px; color: #888;">
                Punto \${routeIndex + 1} de ${TRUCK_ROUTE.length}
              </p>
              <p style="margin: 4px 0; font-size: 10px; color: #999;">
                ⏰ \${new Date().toLocaleTimeString()}
              </p>
              <p style="margin: 6px 0 0 0; font-size: 10px; color: #27ae60; font-weight: bold;">
                🟢 EN RECORRIDO
              </p>
            </div>
          \`);
        };
        
        window.centerMapOnTruck = function() {
          map.setView(truckMarker.getLatLng(), 16);
        };
        
        window.centerMapOnUser = function(userLat, userLng) {
          map.setView([userLat, userLng], 16);
        };
        
        // Escuchar mensajes de React Native
        window.addEventListener('message', function(event) {
          try {
            eval(event.data);
          } catch (e) {
            console.log('Error ejecutando script:', e);
          }
        });
        
        document.addEventListener('message', function(event) {
          try {
            eval(event.data);
          } catch (e) {
            console.log('Error ejecutando script:', e);
          }
        });
      </script>
    </body>
    </html>
    `;
  };

  const getSpeedText = (speed: number) => {
    switch(speed) {
      case 1000: return "Rápido";
      case 3000: return "Normal";
      case 5000: return "Lento";
      default: return "Normal";
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Panel de control */}
      <View style={styles.controlPanel}>
        <Text style={styles.title}>🚛 Camión Recolector en Vivo</Text>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Estado:</Text>
            <Text style={[
              styles.statusValue, 
              { color: isSimulationRunning ? '#27ae60' : '#e74c3c' }
            ]}>
              {isSimulationRunning ? '🟢 Recorriendo' : '🔴 Detenido'}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Ubicación Actual:</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              📍 {truckPosition.description}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Progreso:</Text>
            <Text style={styles.statusValue}>
              {truckPosition.routeIndex + 1} de {TRUCK_ROUTE.length}
            </Text>
          </View>
          
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Última actualización:</Text>
            <Text style={styles.timeText}>
              ⏰ {formatTime(truckPosition.timestamp)}
            </Text>
          </View>
        </View>

        {/* Controles principales */}
        <View style={styles.mainControls}>
          <TouchableOpacity 
            style={[
              styles.primaryButton, 
              isSimulationRunning ? styles.stopButton : styles.startButton
            ]} 
            onPress={isSimulationRunning ? stopSimulation : startSimulation}
          >
            <Text style={styles.buttonText}>
              {isSimulationRunning ? '⏹️ Detener Recorrido' : '▶️ Iniciar Recorrido'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Controles secundarios */}
        <View style={styles.secondaryControls}>
          <TouchableOpacity style={styles.secondaryButton} onPress={centerOnTruck}>
            <Text style={styles.secondaryButtonText}>🎯 Ver Camión</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={centerOnUser}
            disabled={!userLocation}
          >
            <Text style={styles.secondaryButtonText}>📍 Mi Ubicación</Text>
          </TouchableOpacity>
        </View>

        {/* Control de velocidad */}
        <View style={styles.speedControl}>
          <Text style={styles.speedLabel}>Velocidad: {getSpeedText(simulationSpeed)}</Text>
          <View style={styles.speedButtons}>
            <TouchableOpacity 
              style={[styles.speedButton, simulationSpeed === 1000 && styles.activeSpeed]} 
              onPress={() => changeSpeed(1000)}
            >
              <Text style={styles.speedButtonText}>Rápido</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.speedButton, simulationSpeed === 3000 && styles.activeSpeed]} 
              onPress={() => changeSpeed(3000)}
            >
              <Text style={styles.speedButtonText}>Normal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.speedButton, simulationSpeed === 5000 && styles.activeSpeed]} 
              onPress={() => changeSpeed(5000)}
            >
              <Text style={styles.speedButtonText}>Lento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Mapa */}
      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#27ae60" />
            <Text style={styles.loadingText}>Cargando simulación...</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ html: generateMapHTML() }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
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
    backgroundColor: '#f8f9fa',
  },
  controlPanel: {
    backgroundColor: 'white',
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50',
    marginBottom: 12,
  },
  statusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  statusValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationText: {
    fontSize: 11,
    color: '#2c3e50',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  timeText: {
    fontSize: 11,
    color: '#95a5a6',
    fontFamily: 'monospace',
  },
  mainControls: {
    marginBottom: 12,
  },
  primaryButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#27ae60',
  },
  stopButton: {
    backgroundColor: '#e74c3c',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  secondaryControls: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 11,
  },
  speedControl: {
    marginTop: 8,
  },
  speedLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 6,
    textAlign: 'center',
  },
  speedButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  speedButton: {
    flex: 1,
    padding: 6,
    borderRadius: 4,
    backgroundColor: '#ecf0f1',
    alignItems: 'center',
  },
  activeSpeed: {
    backgroundColor: '#3498db',
  },
  speedButtonText: {
    fontSize: 10,
    color: '#2c3e50',
    fontWeight: '600',
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  },
});

export default TruckSimulatorComponent;
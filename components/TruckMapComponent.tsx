import * as Location from 'expo-location';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Switch,
  TextInput,
  Modal
} from 'react-native';
import { WebView } from 'react-native-webview';

// Coordenadas de Buenaventura, Valle del Cauca
const BUENAVENTURA_COORDS = {
  latitude: 3.8801,
  longitude: -77.0316
};

// Mock data de camiones iniciales
const INITIAL_TRUCKS = [
  {
    id: 1,
    name: "Camión - Comuna 4",
    driverName: "Andrés Galindo",
    latitude: 3.8821,
    longitude: -77.0296,
    status: "activo",
    lastUpdate: "Hace 2 minutos",
    route: "Ruta 4"
  },
  {
    id: 2,
    name: "Camión - Comuna 10",
    driverName: "Mauricio Medina", 
    latitude: 3.8781,
    longitude: -77.0336,
    status: "activo", 
    lastUpdate: "Hace 5 minutos",
    route: "Ruta 10"
  },
  {
    id: 3,
    name: "Camión - Comuna 12",
    driverName: "Geiler Casquete",
    latitude: 3.8751,
    longitude: -77.0286,
    status: "inactivo",
    lastUpdate: "Hace 15 minutos",
    route: "Ruta 12"
  }
];

interface Truck {
  id: number;
  name: string;
  driverName: string;
  latitude: number;
  longitude: number;
  status: string;
  lastUpdate: string;
  route: string;
}

interface TruckMapComponentProps {
  showFollowMode?: boolean;
}

const TruckMapComponent: React.FC<TruckMapComponentProps> = ({ showFollowMode = false }) => {
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [trucks, setTrucks] = useState<Truck[]>(INITIAL_TRUCKS);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDriverMode, setIsDriverMode] = useState<boolean>(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [followedTruck, setFollowedTruck] = useState<Truck | null>(null);
  const [mapCenter, setMapCenter] = useState(BUENAVENTURA_COORDS);
  
  // Estados para registro de conductor
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [truckName, setTruckName] = useState('');
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<{lat: number, lng: number} | null>(null);
  
  const webViewRef = useRef<WebView>(null);

  // Obtener ubicación del usuario
  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permisos', 'Se necesitan permisos de ubicación para mostrar tu posición');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setUserLocation(currentLocation);
      setLoading(false);
    } catch (error) {
      console.error('Error obteniendo ubicación:', error);
      setLoading(false);
    }
  };

  // Centrar mapa en ubicación del usuario
  const centerOnUser = () => {
    if (userLocation) {
      setMapCenter({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude
      });
      updateMapCenter(userLocation.coords.latitude, userLocation.coords.longitude);
    }
  };

  // Centrar mapa en un camión específico
  const centerOnTruck = (truck: Truck) => {
    setMapCenter({
      latitude: truck.latitude,
      longitude: truck.longitude
    });
    setSelectedTruck(truck);
    updateMapCenter(truck.latitude, truck.longitude);
  };

  // Seguir un camión (para modo inicio)
  const followTruck = (truck: Truck) => {
    setFollowedTruck(truck);
    centerOnTruck(truck);
    Alert.alert(
      "Siguiendo camión", 
      `Ahora sigues a "${truck.name}" conducido por ${truck.driverName}`,
      [{ text: "OK" }]
    );
  };

  // Dejar de seguir camión
  const unfollowTruck = () => {
    setFollowedTruck(null);
    Alert.alert("Seguimiento detenido", "Ya no sigues ningún camión", [{ text: "OK" }]);
  };

  // Actualizar centro del mapa via WebView
  const updateMapCenter = (lat: number, lng: number) => {
    if (webViewRef.current) {
      const centerScript = `
        if (typeof updateMapCenter === 'function') {
          updateMapCenter(${lat}, ${lng});
        }
      `;
      webViewRef.current.postMessage(centerScript);
    }
  };

  // Mostrar modal para registro de conductor
  const showDriverRegistration = () => {
    setShowDriverModal(true);
    setDriverName('');
    setTruckName('');
    setSelectedPosition(null);
  };

  // Iniciar selección de ubicación en el mapa
  const startLocationSelection = () => {
    if (!driverName.trim() || !truckName.trim()) {
      Alert.alert("Error", "Por favor completa el nombre del conductor y del camión");
      return;
    }
    
    setIsSelectingLocation(true);
    setShowDriverModal(false);
    
    Alert.alert(
      "Seleccionar Ubicación", 
      "Toca en cualquier parte del mapa donde quieres ubicar tu camión. Verás un marcador rojo donde toques.",
      [
        { 
          text: "Cancelar", 
          onPress: () => {
            setIsSelectingLocation(false);
            setShowDriverModal(true);
          }
        },
        { text: "Entendido" }
      ]
    );
  };

  // Confirmar registro del conductor
  const confirmDriverRegistration = () => {
    if (!selectedPosition) {
      Alert.alert("Error", "Por favor selecciona una ubicación en el mapa");
      return;
    }

    const newTruck: Truck = {
      id: trucks.length + 1,
      name: truckName,
      driverName: driverName,
      latitude: selectedPosition.lat,
      longitude: selectedPosition.lng,
      status: "activo",
      lastUpdate: "Ahora",
      route: "Mi Ruta"
    };

    setTrucks(prev => [newTruck, ...prev]);
    setIsDriverMode(true);
    setShowDriverModal(false);
    setIsSelectingLocation(false);
    
    Alert.alert(
      "¡Registrado!", 
      `${driverName}, tu camión "${truckName}" ha sido registrado exitosamente`
    );
  };

  // Manejar clic en el mapa
  const handleMapClick = (lat: number, lng: number) => {
    if (isSelectingLocation) {
      setSelectedPosition({ lat, lng });
      
      if (webViewRef.current) {
        const updateScript = `
          if (typeof addTemporaryMarker === 'function') {
            addTemporaryMarker(${lat}, ${lng});
          }
        `;
        webViewRef.current.postMessage(updateScript);
      }
      
      setTimeout(() => {
        Alert.alert(
          "Ubicación Seleccionada", 
          `¿Confirmas ubicar el camión "${truckName}" aquí?`,
          [
            { 
              text: "Cambiar Ubicación", 
              style: "cancel",
              onPress: () => {
                Alert.alert(
                  "Cambiar Ubicación",
                  "Toca en otra parte del mapa para cambiar la ubicación",
                  [{ text: "OK" }]
                );
              }
            },
            { 
              text: "Confirmar", 
              onPress: confirmDriverRegistration 
            }
          ]
        );
      }, 300);
    }
  };

  // Generar HTML del mapa
  const generateMapHTML = () => {
    const centerLat = mapCenter.latitude;
    const centerLng = mapCenter.longitude;
    
    const truckMarkers = trucks.map(truck => {
      const isFollowed = followedTruck?.id === truck.id;
      
      return `
        var truck${truck.id}Icon = L.divIcon({
          html: '<div style="background-color: ${truck.status === 'activo' ? '#27ae60' : '#95a5a6'}; width: ${isFollowed ? '35px' : '30px'}; height: ${isFollowed ? '35px' : '30px'}; border-radius: 50%; border: ${isFollowed ? '4px solid #f39c12' : '3px solid white'}; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: ${isFollowed ? '18px' : '16px'}; ${isFollowed ? 'animation: pulse 2s infinite;' : ''}">${isFollowed ? '🚛⭐' : '🚛'}</div>',
          className: 'truck-icon',
          iconSize: [${isFollowed ? '35' : '30'}, ${isFollowed ? '35' : '30'}],
          iconAnchor: [${isFollowed ? '17' : '15'}, ${isFollowed ? '17' : '15'}]
        });
        
        var truck${truck.id}Marker = L.marker([${truck.latitude}, ${truck.longitude}], {icon: truck${truck.id}Icon})
          .addTo(map)
          .bindPopup(\`
            <div style="text-align: center; padding: 12px; min-width: 220px;">
              <h3 style="margin: 0 0 8px 0; color: ${truck.status === 'activo' ? '#27ae60' : '#95a5a6'}; font-size: 16px;">
                ${truck.name}
              </h3>
              <p style="margin: 4px 0; font-size: 13px; color: #666; font-weight: 600;">
                ${truck.driverName}
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                📍 ${truck.route}
              </p>
              <p style="margin: 4px 0; font-size: 11px; color: #888;">
                Estado: <strong style="color: ${truck.status === 'activo' ? '#27ae60' : '#95a5a6'}">${truck.status.toUpperCase()}</strong>
              </p>
              <p style="margin: 4px 0; font-size: 10px; color: #999;">
                ${truck.lastUpdate}
              </p>
              ${isFollowed ? '<p style="margin: 6px 0 0 0; font-size: 11px; color: #f39c12; font-weight: bold;">⭐ SIGUIENDO ESTE CAMIÓN</p>' : ''}
            </div>
          \`);
          
        truck${truck.id}Marker.on('click', function(e) {
          ${showFollowMode ? `
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'followTruck',
              truckId: ${truck.id}
            }));
          ` : `
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'selectTruck',
              truckId: ${truck.id}
            }));
          `}
        });
      `;
    }).join('\n');

    const userMarker = userLocation ? `
      var userIcon = L.divIcon({
        html: '<div style="background-color: #3498db; width: 18px; height: 18px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div></div>',
        className: 'user-icon',
        iconSize: [18, 18],
        iconAnchor: [9, 9]
      });
      
      L.marker([${userLocation.coords.latitude}, ${userLocation.coords.longitude}], {icon: userIcon})
        .addTo(map)
        .bindPopup('<div style="text-align: center; padding: 8px;"><p>📍 Tu ubicación</p></div>');
    ` : '';

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
      <title>Camiones de Basura - Buenaventura</title>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          touch-action: manipulation;
        }
        #map { 
          width: 100%; 
          height: 100vh; 
          touch-action: auto;
        }
        .truck-icon, .user-icon, .temp-icon {
          background: transparent;
          border: none;
          text-align: center;
          cursor: pointer;
        }
        .leaflet-popup-content-wrapper {
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        .leaflet-container {
          touch-action: auto;
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map', {
          center: [${centerLat}, ${centerLng}],
          zoom: 13,
          tap: true,
          touchZoom: true,
          dragging: true,
          zoomControl: true
        });
        
        var tempMarker = null;
        var isSelectingLocation = ${isSelectingLocation};
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);
        
        ${truckMarkers}
        ${userMarker}
        
        var allPoints = [
          ${trucks.map(truck => `[${truck.latitude}, ${truck.longitude}]`).join(',')},
          ${userLocation ? `[${userLocation.coords.latitude}, ${userLocation.coords.longitude}]` : ''}
        ].filter(point => point.length > 0);
        
        if (allPoints.length > 1) {
          setTimeout(function() {
            var group = new L.featureGroup(Object.values(map._layers).filter(layer => layer instanceof L.Marker));
            if (group.getLayers().length > 0) {
              map.fitBounds(group.getBounds().pad(0.1));
            }
          }, 1000);
        }
        
        window.updateMapCenter = function(lat, lng) {
          map.setView([lat, lng], 16);
        };
        
        window.addTemporaryMarker = function(lat, lng) {
          if (tempMarker) {
            map.removeLayer(tempMarker);
          }
          
          var tempIcon = L.divIcon({
            html: '<div style="background-color: #e74c3c; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; font-size: 16px; animation: bounce 1s infinite;">📍</div>',
            className: 'temp-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
          });
          
          tempMarker = L.marker([lat, lng], {icon: tempIcon})
            .addTo(map)
            .bindPopup('<div style="text-align: center; padding: 10px; color: #e74c3c; font-weight: bold;"><p>📍 Ubicación seleccionada</p><p style="font-size: 11px; margin: 4px 0;">Confirma para registrar tu camión aquí</p></div>')
            .openPopup();
            
          map.setView([lat, lng], 16);
        };
        
        map.on('click', function(e) {
          if (isSelectingLocation) {
            L.circle([e.latlng.lat, e.latlng.lng], {
              radius: 10,
              color: '#e74c3c',
              fillColor: '#e74c3c',
              fillOpacity: 0.3,
              weight: 2
            }).addTo(map);
          }
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapClick',
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }));
        });
        
        map.on('tap', function(e) {
          if (isSelectingLocation) {
            L.circle([e.latlng.lat, e.latlng.lng], {
              radius: 10,
              color: '#e74c3c',
              fillColor: '#e74c3c',
              fillOpacity: 0.3,
              weight: 2
            }).addTo(map);
          }
          
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'mapClick',
            lat: e.latlng.lat,
            lng: e.latlng.lng
          }));
        });
        
        window.updateSelectionMode = function(selecting) {
          isSelectingLocation = selecting;
          if (!selecting && tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
          }
        };
        
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

  // Manejar mensajes del WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapClick') {
        handleMapClick(data.lat, data.lng);
      } else if (data.type === 'followTruck') {
        const truck = trucks.find(t => t.id === data.truckId);
        if (truck) {
          followTruck(truck);
        }
      } else if (data.type === 'selectTruck') {
        const truck = trucks.find(t => t.id === data.truckId);
        if (truck) {
          centerOnTruck(truck);
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  // Actualizar el estado de selección en el WebView
  useEffect(() => {
    if (webViewRef.current) {
      const updateScript = `
        if (typeof updateSelectionMode === 'function') {
          updateSelectionMode(${isSelectingLocation});
        }
      `;
      webViewRef.current.postMessage(updateScript);
    }
  }, [isSelectingLocation]);

  const getStatusColor = (status: string) => {
    return status === 'activo' ? '#27ae60' : '#95a5a6';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.controlPanel}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {showFollowMode ? 'Seguir Camión' : 'Camiones de Basura'}
          </Text>
          
          {!showFollowMode && (
            <View style={styles.modeSwitch}>
              <Text style={styles.modeLabel}>Conductor</Text>
              <Switch
                value={isDriverMode}
                onValueChange={setIsDriverMode}
                trackColor={{ false: '#ccc', true: '#27ae60' }}
                thumbColor={isDriverMode ? '#fff' : '#f4f3f4'}
              />
            </View>
          )}
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={centerOnUser}
            disabled={!userLocation}
          >
            <Text style={styles.buttonText}>📍 Mi Ubicación</Text>
          </TouchableOpacity>
          
          {isDriverMode && !showFollowMode && (
            <TouchableOpacity 
              style={styles.driverButton} 
              onPress={showDriverRegistration}
            >
              <Text style={styles.buttonText}>Registrar</Text>
            </TouchableOpacity>
          )}
          
          {showFollowMode && followedTruck && (
            <TouchableOpacity 
              style={styles.unfollowButton} 
              onPress={unfollowTruck}
            >
              <Text style={styles.buttonText}>Dejar de Seguir</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.trucksPanel}>
        <Text style={styles.sectionTitle}>
          {showFollowMode 
            ? `Camiones Disponibles (${trucks.filter(t => t.status === 'activo').length})`
            : `Camiones Activos (${trucks.filter(t => t.status === 'activo').length})`
          }
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.trucksScroll}>
          {trucks.map(truck => (
            <TouchableOpacity 
              key={truck.id} 
              style={[
                styles.truckCard,
                selectedTruck?.id === truck.id && styles.selectedTruckCard,
                followedTruck?.id === truck.id && styles.followedTruckCard
              ]}
              onPress={() => {
                if (showFollowMode) {
                  if (followedTruck?.id === truck.id) {
                    unfollowTruck();
                  } else {
                    followTruck(truck);
                  }
                } else {
                  centerOnTruck(truck);
                }
              }}
            >
              <View style={styles.truckHeader}>
                <Text style={styles.truckName} numberOfLines={1}>{truck.name}</Text>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(truck.status) }]} />
              </View>
              <Text style={styles.driverName}>{truck.driverName}</Text>
              <Text style={styles.truckRoute}>{truck.route}</Text>
              <Text style={styles.truckUpdate}>{truck.lastUpdate}</Text>
              
              {followedTruck?.id === truck.id && (
                <Text style={styles.followingLabel}>SIGUIENDO...</Text>
              )}
              
              {showFollowMode && (
                <Text style={styles.followAction}>
                  {followedTruck?.id === truck.id ? 'Toca para dejar de seguir' : 'Toca para seguir'}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#27ae60" />
            <Text style={styles.loadingText}>Cargando mapa...</Text>
          </View>
        )}
        
        <WebView
          ref={webViewRef}
          source={{ html: generateMapHTML() }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          onMessage={handleWebViewMessage}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('WebView error: ', nativeEvent);
          }}
        />
        
        {isSelectingLocation && (
          <View style={styles.selectionOverlay}>
            <View style={styles.selectionHeader}>
              <Text style={styles.selectionTitle}>📍 Seleccionar Ubicación</Text>
              <TouchableOpacity
                style={styles.cancelSelection}
                onPress={() => {
                  setIsSelectingLocation(false);
                  setShowDriverModal(true);
                }}
              >
                <Text style={styles.cancelSelectionText}>❌</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.selectionText}>
              Toca en cualquier parte del mapa para ubicar el camión "{truckName}"
            </Text>
            {selectedPosition && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={confirmDriverRegistration}
              >
                <Text style={styles.confirmButtonText}>Confirmar Ubicación</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <Modal
        visible={showDriverModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDriverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Registrar como Conductor</Text>
            
            <Text style={styles.inputLabel}>Nombre del Conductor:</Text>
            <TextInput
              style={styles.textInput}
              value={driverName}
              onChangeText={setDriverName}
              placeholder="Ejemplo: Andrés Lucio"
              placeholderTextColor="#666"
            />
            
            <Text style={styles.inputLabel}>Nombre del Camión:</Text>
            <TextInput
              style={styles.textInput}
              value={truckName}
              onChangeText={setTruckName}
              placeholder="Ejemplo: Camión Comuna 12"
              placeholderTextColor="#012"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowDriverModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.nextButton}
                onPress={startLocationSelection}
              >
                <Text style={styles.nextButtonText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  modeSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  driverButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  unfollowButton: {
    flex: 1,
    backgroundColor: '#e74c3c',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 12,
  },
  trucksPanel: {
    backgroundColor: 'white',
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  trucksScroll: {
    paddingHorizontal: 16,
  },
  truckCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    width: 160,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTruckCard: {
    borderColor: '#3498db',
    backgroundColor: '#ebf3fd',
  },
  followedTruckCard: {
    borderColor: '#f39c12',
    backgroundColor: '#fef9e7',
  },
  truckHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  truckName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  driverName: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 4,
    fontWeight: '600',
  },
  truckRoute: {
    fontSize: 10,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  truckUpdate: {
    fontSize: 9,
    color: '#95a5a6',
    marginBottom: 4,
  },
  followingLabel: {
    fontSize: 9,
    color: '#f39c12',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
  },
  followAction: {
    fontSize: 8,
    color: '#3498db',
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
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
  selectionOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    padding: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  selectionText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#2c3e50',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
    marginTop: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#f8f9fa',
    color: '#2c3e50',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#95a5a6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#27ae60',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  nextButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  });

export default TruckMapComponent;

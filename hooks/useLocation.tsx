import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setLoading(true);
      
      // Solicitar permisos
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        setLoading(false);
        return;
      }

      // Obtener ubicación actual
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy,
      });
      
      setLoading(false);
    } catch (error) {
      setErrorMsg('Error al obtener la ubicación');
      setLoading(false);
    }
  };

  const refreshLocation = () => {
    setErrorMsg(null);
    getCurrentLocation();
  };

  return {
    location,
    errorMsg,
    loading,
    refreshLocation,
  };
};
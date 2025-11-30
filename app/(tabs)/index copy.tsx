import MapLibreMap from "@/components/MapLibreMap";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { StatusBar, StyleSheet } from "react-native";
import { ThemedView } from "../../components/ThemedView";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";

interface Calle {
  id: number;
  nombre: string;
  descripcion: string;
}

export default function Index() {
  const [calles, setCalles] = useState<Calle[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#2E86AB" />
      
      <MapLibreMap nombre="Mi ubicación actual" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
});
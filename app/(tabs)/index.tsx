import React from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import MapLibreMap from "../../components/MapLibreMap";
import { Colors } from "../../constants/Colors";
import { useTheme } from "../../contexts/ThemeContext";

export default function Index() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#2E86AB" />

      {/* EL MAPA DEBE IR DIRECTAMENTE EN UN VIEW CON FLEX 1 */}
      <MapLibreMap nombre="Mi ubicación actual" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,     // ✔ ocupa toda la pantalla
    padding: 0,  // ❗ quitar padding para que el mapa aparezca
  },
});

import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { StyleSheet } from 'react-native';

export default function Rutas() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.titulo}>Rutas</ThemedText>
      <ThemedText style={styles.texto}>
        Aquí las personas verán los recorridos del camión
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  titulo: {
    marginBottom: 20,
  },
  texto: {
    fontSize: 16,
    textAlign: "center",
  },
});
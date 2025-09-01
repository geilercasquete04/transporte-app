import { StyleSheet } from "react-native";
import { ThemedText } from "../../components/ThemedText";
import { ThemedView } from "../../components/ThemedView";

export default function Perfil() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title" style={styles.titulo}>Perfil</ThemedText>
      <ThemedText style={styles.texto}>
        Aquí va la información del usuario
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
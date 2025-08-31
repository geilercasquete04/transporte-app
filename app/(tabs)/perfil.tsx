import { View, Text, StyleSheet } from "react-native";

export default function Perfil() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Perfil</Text>
	       <Text style={styles.titulo}> </Text>
      <Text style={styles.texto}>Aquí va la información del usuario  </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  texto: {
    fontSize: 16,
    color: "#000",
  },
});

import { View, Text, StyleSheet } from "react-native";

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Inicio</Text>
	   <Text style={styles.texto}> </Text>
      <Text style={styles.texto}>Bienvenido (a)</Text>
	  <Text style={styles.texto}>En esta App podrás ver el recorrido del camnión de la basura</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff", // fondo blanco
  },
  titulo: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000", // texto negro
  },
  texto: {
    fontSize: 16,
    color: "#000", // texto negro
  },
});

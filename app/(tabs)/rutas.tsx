import { View, Text, StyleSheet } from 'react-native';

export default function Rutas() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Rutas</Text>
	        <Text style={styles.titulo}> </Text>
      <Text>Aquí las personas verán los recorridos del camión</Text>
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

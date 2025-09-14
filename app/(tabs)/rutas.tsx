import { StyleSheet } from 'react-native';
import TruckMapComponent from "../../components/TruckMapComponent";

export default function Rutas() {
  return <TruckMapComponent showFollowMode={false} />;
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
import { SafeAreaView, StatusBar, StyleSheet } from "react-native";
import TruckMapComponent from "../../components/TruckMapComponent";

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor="#2E86AB" />
      <TruckMapComponent showFollowMode={true} />
    </SafeAreaView>
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
    marginBottom: 10,
    lineHeight: 22,
  },
});
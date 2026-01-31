import { Stack } from "expo-router";
import { RouteProvider } from "../components/RouteContext";
import { ThemeProvider } from "../contexts/ThemeContext";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RouteProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </RouteProvider>
    </ThemeProvider>
  );
}

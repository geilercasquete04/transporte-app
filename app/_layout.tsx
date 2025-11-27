// app/_layout.tsx o app/(tabs)/_layout.tsx
import { Stack } from 'expo-router';
import { RouteProvider } from '../components/routeContext';
import { ThemeProvider } from '../contexts/ThemeContext'; // Si ya existe

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RouteProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </RouteProvider>
    </ThemeProvider>
  );
}
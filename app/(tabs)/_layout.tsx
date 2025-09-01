import { ThemeToggle } from "@/components/ThemeToggle";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { ThemeProvider, useTheme } from "../../contexts/ThemeContexts";

function TabsContent() {
  const { isDarkMode } = useTheme();
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerRight: () => <ThemeToggle />,
        tabBarStyle: { 
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabIconDefault,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="rutas"
        options={{
          title: "Rutas",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  return (
    <ThemeProvider>
      <TabsContent />
    </ThemeProvider>
  );
}
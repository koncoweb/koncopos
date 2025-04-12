import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { Platform, View, Text, ActivityIndicator } from "react-native";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { FirebaseConfigProvider } from "../contexts/FirebaseConfigContext";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Auth protection wrapper component
function AuthProtection({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Check if the user is authenticated
      const inAuthGroup = segments[0] === "(auth)";
      const isAuthenticated = user?.isAuthenticated;

      if (!isAuthenticated && !inAuthGroup) {
        // Redirect to login if not authenticated and not in auth group
        router.replace("/login");
      } else if (isAuthenticated && inAuthGroup) {
        // Redirect to home if authenticated and in auth group
        router.replace("/");
      }
    }
  }, [user, isLoading, segments, router]);

  // Show loading indicator while checking auth state
  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (process.env.EXPO_PUBLIC_TEMPO && Platform.OS === "web") {
      const { TempoDevtools } = require("tempo-devtools");
      TempoDevtools.init();
    }
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <FirebaseConfigProvider>
      <AuthProvider>
        <ThemeProvider value={DefaultTheme}>
          <AuthProtection>
            <Stack
              screenOptions={({ route }) => ({
                headerShown: false, // Hide all default headers
              })}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="inventory" />
              <Stack.Screen name="pos" />
              <Stack.Screen name="transactions" />
              <Stack.Screen name="transfers" />
              <Stack.Screen
                name="[...unmatched]"
                options={{ title: "Not Found" }}
              />
            </Stack>
            <StatusBar style="auto" />
          </AuthProtection>
        </ThemeProvider>
      </AuthProvider>
    </FirebaseConfigProvider>
  );
}

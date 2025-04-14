import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
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
  const [lastAuthState, setLastAuthState] = useState<{
    isAuthenticated: boolean | null;
    path: string | null;
  }>({
    isAuthenticated: null,
    path: null,
  });

  useEffect(() => {
    if (!isLoading) {
      console.log("🔍 AuthProtection: Auth state loaded", {
        user: user ? "authenticated" : "unauthenticated",
        userDetails: JSON.stringify(user),
        segments,
        isLoading,
        lastAuthState,
        currentPath: segments.join("/"),
      });

      // Check if the user is authenticated
      const inAuthGroup = segments[0] === "(auth)";
      const isAuthenticated = user?.isAuthenticated;
      const currentPath = segments.join("/");

      console.log("📊 AuthProtection: Raw values", {
        inAuthGroup: inAuthGroup,
        segmentsFirstValue: segments[0],
        isAuthenticatedValue: isAuthenticated,
        userObject: JSON.stringify(user),
      });

      // Prevent navigation loops by checking if we've already handled this state
      const isDifferentAuthState =
        lastAuthState.isAuthenticated !== isAuthenticated;
      const isDifferentPath = lastAuthState.path !== currentPath;

      console.log("🧭 AuthProtection: Navigation check", {
        inAuthGroup,
        isAuthenticated,
        currentPath,
        isDifferentAuthState,
        isDifferentPath,
        lastAuthState,
        timestamp: new Date().toISOString(),
      });

      if (isDifferentAuthState || isDifferentPath) {
        console.log("⚠️ AuthProtection: State change detected", {
          isDifferentAuthState,
          isDifferentPath,
          previousAuthState: lastAuthState.isAuthenticated,
          currentAuthState: isAuthenticated,
          previousPath: lastAuthState.path,
          currentPath,
        });

        if (!isAuthenticated && !inAuthGroup) {
          console.log("🔄 AuthProtection: Redirecting to login", {
            reason: "User not authenticated and not in auth group",
            from: currentPath,
            to: "/login",
          });
          // Redirect to login if not authenticated and not in auth group
          router.replace("/login");
          setLastAuthState({ isAuthenticated, path: "/login" });
        } else if (isAuthenticated && inAuthGroup) {
          console.log("🔄 AuthProtection: Redirecting to home", {
            reason: "User authenticated but still in auth group",
            from: currentPath,
            to: "/",
          });
          // Redirect to home if authenticated and in auth group
          router.replace("/");
          setLastAuthState({ isAuthenticated, path: "/" });
        } else {
          // Update last auth state without navigation
          console.log("✅ AuthProtection: Updating state without navigation", {
            reason: isAuthenticated
              ? "User authenticated and not in auth group"
              : "User not authenticated but already in auth group",
            currentPath,
            newLastAuthState: { isAuthenticated, path: currentPath },
          });
          setLastAuthState({ isAuthenticated, path: currentPath });
        }
      } else {
        console.log("🛑 AuthProtection: No navigation needed", {
          reason: "Same auth state and path",
          authState: isAuthenticated ? "authenticated" : "unauthenticated",
          path: currentPath,
          timestamp: new Date().toISOString(),
        });
      }
    } else {
      console.log("⏳ AuthProtection: Still loading auth state");
    }
  }, [user, isLoading, segments, router, lastAuthState]);

  // Show loading indicator while checking auth state
  if (isLoading) {
    console.log("🔄 AuthProtection: Rendering loading state");
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  console.log("✅ AuthProtection: Rendering children", {
    isAuthenticated: user?.isAuthenticated ? "true" : "false",
    currentPath: segments.join("/"),
  });

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

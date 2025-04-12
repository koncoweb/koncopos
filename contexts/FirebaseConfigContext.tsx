import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import firebaseService, { FirebaseConfig } from "../services/firebaseService";

interface FirebaseConfigContextType {
  config: FirebaseConfig;
  isConfigured: boolean;
  isLoading: boolean;
  updateConfig: (
    newConfig: FirebaseConfig,
    isAdmin?: boolean,
  ) => Promise<boolean>;
  resetConfig: (isAdmin?: boolean) => Promise<void>;
  hasAdminAccess: (role?: string) => boolean;
}

const defaultConfig: FirebaseConfig = {
  apiKey: "AIzaSyDxw5Zr9PDj9b0gY8SkWMn6y2PJu601Hek",
  authDomain: "stockpoint-pro.firebaseapp.com",
  projectId: "stockpoint-pro",
  storageBucket: "stockpoint-pro.firebasestorage.app",
  messagingSenderId: "43986157653",
  appId: "1:43986157653:web:11053f1d6c0e5eeb7154dc",
};

const FirebaseConfigContext = createContext<FirebaseConfigContextType>({
  config: defaultConfig,
  isConfigured: false,
  isLoading: true,
  updateConfig: async () => false,
  resetConfig: async () => {},
  hasAdminAccess: () => false,
});

export const useFirebaseConfig = () => useContext(FirebaseConfigContext);

export const FirebaseConfigProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [config, setConfig] = useState<FirebaseConfig>(defaultConfig);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        // Skip AsyncStorage on server-side rendering
        if (
          typeof window === "undefined" ||
          typeof global.localStorage === "undefined"
        ) {
          console.log(
            "Running on server or AsyncStorage not available, using default config",
          );
          return;
        }

        try {
          const storedConfig = await AsyncStorage.getItem("firebase_config");
          if (storedConfig) {
            const parsedConfig = JSON.parse(storedConfig);
            setConfig(parsedConfig);
          }
        } catch (asyncError) {
          console.warn("AsyncStorage error while loading config:", asyncError);
        }
      } catch (error) {
        console.error("Error loading Firebase config:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const hasAdminAccess = (role?: string): boolean => {
    return role === "admin";
  };

  const updateConfig = async (
    newConfig: FirebaseConfig,
    isAdmin: boolean = false,
  ): Promise<boolean> => {
    try {
      // Only allow updates if user has admin access
      if (!isAdmin) {
        console.warn(
          "Attempted to update Firebase config without admin privileges",
        );
        return false;
      }

      const success = await firebaseService.saveConfig(newConfig);
      if (success) {
        setConfig(newConfig);
      }
      return success;
    } catch (error) {
      console.error("Error updating Firebase config:", error);
      return false;
    }
  };

  const resetConfig = async (isAdmin: boolean = false): Promise<void> => {
    try {
      // Only allow resets if user has admin access
      if (!isAdmin) {
        console.warn(
          "Attempted to reset Firebase config without admin privileges",
        );
        return;
      }

      await AsyncStorage.removeItem("firebase_config");
      setConfig(defaultConfig);
      // Re-initialize Firebase with empty config (effectively disabling it)
      await firebaseService.saveConfig(defaultConfig);
    } catch (error) {
      console.error("Error resetting Firebase config:", error);
    }
  };

  // Check if all required fields are present to determine if Firebase is configured
  const isConfigured =
    !!config.apiKey &&
    !!config.authDomain &&
    !!config.projectId &&
    !!config.storageBucket &&
    !!config.messagingSenderId &&
    !!config.appId;

  return (
    <FirebaseConfigContext.Provider
      value={{
        config,
        isConfigured,
        isLoading,
        updateConfig,
        resetConfig,
        hasAdminAccess,
      }}
    >
      {children}
    </FirebaseConfigContext.Provider>
  );
};

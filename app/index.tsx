import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { TempoDevtools } from "tempo-devtools";

import Header from "../components/Header";
import DashboardMenu from "../components/DashboardMenu";
import InventoryManagement from "../components/InventoryManagement";
import POSInterface from "../components/POSInterface";
import TransactionHistory from "../components/TransactionHistory";
import TransferManagement from "../components/TransferManagement";
import LoginScreen from "../components/LoginScreen";
import DataMigrationService from "../components/DataMigrationService";
import {
  getData,
  storeData,
  STORAGE_KEYS,
  clearAllData,
} from "../services/storage";

export default function MainDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [userName, setUserName] = useState("John Doe");
  const [dataMigrationComplete, setDataMigrationComplete] = useState(false);
  const router = useRouter();

  // Initialize Tempo Devtools
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }
  }, []);

  // Authenticate user on app start
  useEffect(() => {
    // In a real app, this would check for a valid auth token
    const checkAuth = async () => {
      try {
        // Try to get saved auth state
        const savedAuthState = await getData<{
          isAuthenticated: boolean;
          userName: string;
        }>("auth_state", {
          isAuthenticated: false,
          userName: "John Doe",
        });

        console.log("Auth state loaded:", savedAuthState);

        // Set authentication state directly without timeout
        setIsAuthenticated(savedAuthState.isAuthenticated);
        if (savedAuthState.isAuthenticated) {
          setUserName(savedAuthState.userName);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking auth:", error);
        setIsAuthenticated(false); // Default to not authenticated if there's an error
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    // In a real app, this would validate credentials against an API
    setIsLoading(true);
    try {
      const displayName = username === "demo" ? "Demo User" : username;

      // Save auth state first
      await storeData("auth_state", {
        isAuthenticated: true,
        userName: displayName,
      });

      // Then update state
      setIsAuthenticated(true);
      setUserName(displayName);
      setIsLoading(false);
    } catch (error) {
      console.error("Login error:", error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      setIsAuthenticated(false);
      setActiveScreen("dashboard");

      // Save auth state
      await storeData("auth_state", {
        isAuthenticated: false,
        userName: "",
      });

      setIsLoading(false);
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoading(false);
    }
  };

  const navigateTo = (screen: string) => {
    setActiveScreen(screen);
  };

  const handleBackToDashboard = () => {
    setActiveScreen("dashboard");
  };

  // Skip data migration to preserve existing data
  useEffect(() => {
    setDataMigrationComplete(true);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600">Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header is always visible */}
      <Header title="POS & Inventory System" userName={userName} />

      {/* Main Content Area */}
      {activeScreen === "dashboard" && (
        <DashboardMenu
          userName={userName}
          menuItems={[
            {
              title: "Inventory",
              icon: "Clipboard",
              description:
                "Manage products, view stock levels, and adjust inventory",
              onPress: () => navigateTo("inventory"),
              color: "#4F46E5",
            },
            {
              title: "POS",
              icon: "BarChart3",
              description:
                "Process sales transactions and manage shopping cart",
              onPress: () => navigateTo("pos"),
              color: "#10B981",
            },
            {
              title: "Transactions",
              icon: "History",
              description: "View sales history and transaction details",
              onPress: () => navigateTo("transactions"),
              color: "#F59E0B",
            },
            {
              title: "Transfers",
              icon: "ArrowLeftRight",
              description:
                "Create and receive inventory transfers between locations",
              onPress: () => navigateTo("transfers"),
              color: "#EC4899",
            },
          ]}
        />
      )}

      {activeScreen === "inventory" && (
        <InventoryManagement onBack={handleBackToDashboard} />
      )}

      {activeScreen === "pos" && (
        <POSInterface onBack={handleBackToDashboard} />
      )}

      {activeScreen === "transactions" && (
        <TransactionHistory onBack={handleBackToDashboard} />
      )}

      {activeScreen === "transfers" && (
        <TransferManagement onClose={handleBackToDashboard} />
      )}
    </SafeAreaView>
  );
}

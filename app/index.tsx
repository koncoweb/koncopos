import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
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
import RoleDebugger from "../components/RoleDebugger";
import { useAuth } from "../contexts/AuthContext";

export default function MainDashboard() {
  const [activeScreen, setActiveScreen] = useState("dashboard");
  const [dataMigrationComplete, setDataMigrationComplete] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();

  // Initialize Tempo Devtools
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }
  }, []);

  const navigateTo = (screen: string) => {
    // Use router navigation instead of state for proper routing
    switch (screen) {
      case "inventory":
        router.push("/inventory");
        break;
      case "pos":
        router.push("/pos");
        break;
      case "transactions":
        router.push("/transactions");
        break;
      case "transfers":
        router.push("/transfers");
        break;
      case "warehouses":
        router.push("/warehouses");
        break;
      case "stores":
        router.push("/stores");
        break;
      case "user-management":
        router.push("/user-management");
        break;
      default:
        setActiveScreen(screen);
    }
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

  if (!user?.isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header is always visible */}
      <Header title="POS & Inventory System" />

      {/* Main Content Area */}
      <ScrollView className="z-10 flex-1">
        {activeScreen === "dashboard" && (
          <>
            <DashboardMenu
              userName={user?.displayName || "User"}
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
                {
                  title: "Warehouses",
                  icon: "Warehouse",
                  description:
                    "Manage warehouse locations and user assignments",
                  onPress: () => navigateTo("warehouses"),
                  color: "#8B5CF6",
                },
                {
                  title: "Stores",
                  icon: "Store",
                  description: "Manage store settings and configurations",
                  onPress: () => navigateTo("stores"),
                  color: "#06B6D4",
                },
                {
                  title: "User Management",
                  icon: "Users",
                  description: "Manage users, roles, and permissions",
                  onPress: () => navigateTo("user-management"),
                  color: "#EF4444",
                },
              ]}
            />
            {/* Debug component - remove this in production */}
            <RoleDebugger />
          </>
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
      </ScrollView>
    </SafeAreaView>
  );
}

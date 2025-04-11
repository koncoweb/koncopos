import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, TouchableOpacity } from "react-native";
import {
  storeData,
  getData,
  STORAGE_KEYS,
  clearAllData,
} from "../services/storage";
import { Product } from "./InventoryManagement";
import { CartItem } from "./ShoppingCart";
import { Transaction } from "./TransactionHistory";
import { Transfer } from "./TransferManagement";

// Sample initial data for migration
import initialProducts from "../data/initialProducts";
import initialTransactions from "../data/initialTransactions";

interface DataMigrationServiceProps {
  onComplete: () => void;
}

const DataMigrationService: React.FC<DataMigrationServiceProps> = ({
  onComplete,
}) => {
  const [migrationStatus, setMigrationStatus] = useState<{
    products: boolean;
    cart: boolean;
    transactions: boolean;
    transfers: boolean;
  }>({ products: false, cart: false, transactions: false, transfers: false });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const migrateData = async () => {
      try {
        setIsLoading(true);

        // Check if migration has already been performed
        const migrationCompleted = await getData<boolean>(
          "migration_completed",
          false,
        );

        if (migrationCompleted) {
          console.log("Migration already completed");
          onComplete();
          return;
        }

        // Only initialize data if it doesn't exist yet

        // Migrate products
        await storeData(STORAGE_KEYS.PRODUCTS, initialProducts);
        setMigrationStatus((prev) => ({ ...prev, products: true }));

        // Migrate cart items (empty cart initially)
        await storeData(STORAGE_KEYS.CART_ITEMS, []);
        setMigrationStatus((prev) => ({ ...prev, cart: true }));

        // Migrate transactions
        await storeData(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
        setMigrationStatus((prev) => ({ ...prev, transactions: true }));

        // Migrate transfers (empty initially)
        await storeData(STORAGE_KEYS.TRANSFERS, []);
        setMigrationStatus((prev) => ({ ...prev, transfers: true }));

        // Mark migration as completed
        await storeData("migration_completed", true);

        // Complete migration
        setTimeout(() => {
          onComplete();
        }, 1000); // Short delay to show migration progress
      } catch (error) {
        console.error("Migration error:", error);
        setError("Failed to migrate data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    migrateData();
  }, [onComplete]);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-4">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="mt-4 text-gray-600 text-center">
          Migrating data to local storage...
        </Text>
        <View className="mt-4 w-full">
          <Text className="text-gray-500 mb-1">
            Products: {migrationStatus.products ? "✓" : "..."}
          </Text>
          <Text className="text-gray-500 mb-1">
            Cart: {migrationStatus.cart ? "✓" : "..."}
          </Text>
          <Text className="text-gray-500 mb-1">
            Transactions: {migrationStatus.transactions ? "✓" : "..."}
          </Text>
          <Text className="text-gray-500 mb-1">
            Transfers: {migrationStatus.transfers ? "✓" : "..."}
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-white p-4">
        <Text className="text-red-500 mb-4">{error}</Text>
        <TouchableOpacity
          className="bg-blue-500 py-2 px-4 rounded-md"
          onPress={() => window.location.reload()}
        >
          <Text className="text-white font-medium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return null;
};

export default DataMigrationService;

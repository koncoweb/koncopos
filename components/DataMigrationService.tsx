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
import firebaseService from "../services/firebaseService";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";

// Sample initial data for migration
import initialProducts from "../data/initialProducts";
import initialTransactions from "../data/initialTransactions";

interface DataMigrationServiceProps {
  onComplete: () => void;
}

const DataMigrationService: React.FC<DataMigrationServiceProps> = ({
  onComplete,
}) => {
  const { isConfigured } = useFirebaseConfig();
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

        // Check if Firebase is configured and initialized
        const useFirebase = isConfigured && firebaseService.isInitialized();
        console.log(`Using Firebase for data migration: ${useFirebase}`);

        // Migrate products
        if (useFirebase) {
          // First check if products collection already exists in Firebase
          try {
            const existingProducts =
              await firebaseService.getCollection("products");
            if (existingProducts.length === 0) {
              // Add initial products to Firebase
              for (const product of initialProducts) {
                await firebaseService.addDocument(
                  "products",
                  product,
                  product.id,
                );
              }
            }
            setMigrationStatus((prev) => ({ ...prev, products: true }));
          } catch (error) {
            console.error("Firebase products migration error:", error);
            // Fallback to local storage
            await storeData(STORAGE_KEYS.PRODUCTS, initialProducts);
            setMigrationStatus((prev) => ({ ...prev, products: true }));
          }
        } else {
          // Use local storage
          await storeData(STORAGE_KEYS.PRODUCTS, initialProducts);
          setMigrationStatus((prev) => ({ ...prev, products: true }));
        }

        // Migrate cart items (empty cart initially)
        await storeData(STORAGE_KEYS.CART_ITEMS, []);
        setMigrationStatus((prev) => ({ ...prev, cart: true }));

        // Migrate transactions
        if (useFirebase) {
          try {
            const existingTransactions =
              await firebaseService.getCollection("transactions");
            if (existingTransactions.length === 0) {
              // Add initial transactions to Firebase
              for (const transaction of initialTransactions) {
                await firebaseService.addDocument(
                  "transactions",
                  transaction,
                  transaction.id,
                );
              }
            }
            setMigrationStatus((prev) => ({ ...prev, transactions: true }));
          } catch (error) {
            console.error("Firebase transactions migration error:", error);
            // Fallback to local storage
            await storeData(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
            setMigrationStatus((prev) => ({ ...prev, transactions: true }));
          }
        } else {
          // Use local storage
          await storeData(STORAGE_KEYS.TRANSACTIONS, initialTransactions);
          setMigrationStatus((prev) => ({ ...prev, transactions: true }));
        }

        // Migrate transfers (empty initially)
        if (useFirebase) {
          try {
            const existingTransfers =
              await firebaseService.getCollection("transfers");
            if (existingTransfers.length === 0) {
              // Initialize empty transfers collection in Firebase
              await firebaseService.addDocument("transfers", {
                initialized: true,
                data: [],
              });
            }
            setMigrationStatus((prev) => ({ ...prev, transfers: true }));
          } catch (error) {
            console.error("Firebase transfers migration error:", error);
            // Fallback to local storage
            await storeData(STORAGE_KEYS.TRANSFERS, []);
            setMigrationStatus((prev) => ({ ...prev, transfers: true }));
          }
        } else {
          // Use local storage
          await storeData(STORAGE_KEYS.TRANSFERS, []);
          setMigrationStatus((prev) => ({ ...prev, transfers: true }));
        }

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
  }, [onComplete, isConfigured]);

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

import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
export const STORAGE_KEYS = {
  PRODUCTS: "products",
  CART_ITEMS: "cart_items",
  TRANSACTIONS: "transactions",
  TRANSFERS: "transfers",
};

// Generic storage functions
export const storeData = async (key: string, value: any): Promise<void> => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
    console.log(`Data stored successfully for key: ${key}`);
  } catch (error) {
    console.error(`Error storing data for key ${key}:`, error);
  }
};

export const getData = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : defaultValue;
  } catch (error) {
    console.error(`Error retrieving data for key ${key}:`, error);
    return defaultValue;
  }
};

export const removeData = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
    console.log(`Data removed successfully for key: ${key}`);
  } catch (error) {
    console.error(`Error removing data for key ${key}:`, error);
  }
};

export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
    console.log("All data cleared successfully");
  } catch (error) {
    console.error("Error clearing all data:", error);
  }
};

// Debug function to log all stored data
export const logAllData = async (): Promise<void> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);
    console.log("All stored data:");
    result.forEach(([key, value]) => {
      console.log(`${key}: ${value?.substring(0, 50)}...`);
    });
  } catch (error) {
    console.error("Error logging all data:", error);
  }
};

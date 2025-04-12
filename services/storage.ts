import AsyncStorage from "@react-native-async-storage/async-storage";
import { Product } from "../components/InventoryManagement";

// Storage keys
export const STORAGE_KEYS = {
  PRODUCTS: "products",
  CART_ITEMS: "cart_items",
  TRANSACTIONS: "transactions",
  TRANSFERS: "transfers",
  CATEGORIES: "categories",
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

// Product-specific storage functions
export const loadProducts = async (
  defaultProducts: Product[] = [],
): Promise<Product[]> => {
  try {
    const products = await getData<Product[]>(
      STORAGE_KEYS.PRODUCTS,
      defaultProducts,
    );
    console.log(`Loaded ${products.length} products from storage`);
    return products;
  } catch (error) {
    console.error("Error loading products:", error);
    return defaultProducts;
  }
};

export const saveProducts = async (products: Product[]): Promise<void> => {
  try {
    await storeData(STORAGE_KEYS.PRODUCTS, products);
    console.log(`Saved ${products.length} products to storage`);
  } catch (error) {
    console.error("Error saving products:", error);
  }
};

export const saveProduct = async (
  products: Product[],
  updatedProduct: Product,
): Promise<Product[]> => {
  // Validate product data
  const validatedProduct = validateProduct(updatedProduct);

  // Check if this is a new product or an update
  const isNewProduct = !products.some((p) => p.id === validatedProduct.id);
  let updatedProducts: Product[];

  if (isNewProduct) {
    // Add new product
    updatedProducts = [...products, validatedProduct];
    console.log("New product added:", validatedProduct.name);
  } else {
    // Update existing product
    updatedProducts = products.map((p) =>
      p.id === validatedProduct.id ? validatedProduct : p,
    );
    console.log("Product updated:", validatedProduct.name);
  }

  // Save to storage
  await saveProducts(updatedProducts);
  return updatedProducts;
};

export const deleteProduct = async (
  products: Product[],
  productId: string,
): Promise<Product[]> => {
  const updatedProducts = products.filter((p) => p.id !== productId);
  await saveProducts(updatedProducts);
  console.log(`Product with ID ${productId} deleted`);
  return updatedProducts;
};

// Helper function to validate product data
export const validateProduct = (product: any): Product => {
  // Ensure all required fields are present with valid types
  const validatedProduct = {
    id: product.id || String(Date.now()),
    name: product.name || "New Product",
    sku: product.sku || `SKU-${String(Date.now()).slice(-6)}`,
    description: product.description || "",
    price: isNaN(Number(product.price)) ? 0 : Number(product.price),
    cost: isNaN(Number(product.cost)) ? 0 : Number(product.cost),
    currentStock: isNaN(Number(product.currentStock))
      ? 0
      : Number(product.currentStock),
    category: product.category || "Uncategorized",
    location: product.location || "Warehouse A",
    imageUrl: product.imageUrl || "",
    warehouseStocks: [],
    hasVariations: !!product.hasVariations,
    variations: [],
  };

  // Validate and copy warehouse stocks if present
  if (product.warehouseStocks && Array.isArray(product.warehouseStocks)) {
    validatedProduct.warehouseStocks = product.warehouseStocks
      .map((stock) => ({
        warehouseId: stock.warehouseId || "",
        warehouseName: stock.warehouseName || "Unknown Warehouse",
        quantity: isNaN(Number(stock.quantity)) ? 0 : Number(stock.quantity),
      }))
      .filter((stock) => !!stock.warehouseId);
  }

  // Validate and copy variations if present
  if (product.variations && Array.isArray(product.variations)) {
    validatedProduct.variations = product.variations
      .map((variation) => ({
        id:
          variation.id ||
          String(Date.now()) + Math.random().toString(36).substring(2, 9),
        type: variation.type || "",
        value: variation.value || "",
        sku:
          variation.sku ||
          `${validatedProduct.sku}-${variation.value?.replace(/\s+/g, "-").toLowerCase() || "var"}-${Math.random().toString(36).substring(2, 5)}`,
        price: isNaN(Number(variation.price))
          ? validatedProduct.price
          : Number(variation.price),
        cost: isNaN(Number(variation.cost))
          ? validatedProduct.cost
          : Number(variation.cost),
        warehouseStocks: Array.isArray(variation.warehouseStocks)
          ? variation.warehouseStocks
              .map((stock) => ({
                warehouseId: stock.warehouseId || "",
                warehouseName: stock.warehouseName || "Unknown Warehouse",
                quantity: isNaN(Number(stock.quantity))
                  ? 0
                  : Number(stock.quantity),
              }))
              .filter((stock) => !!stock.warehouseId)
          : [],
      }))
      .filter((variation) => !!variation.type && !!variation.value);
  }

  return validatedProduct;
};

// Helper function to create a new product with default values
export const createNewProduct = (): Product => {
  return {
    id: `${Date.now()}`,
    name: "New Product",
    sku: `SKU-${Date.now().toString().slice(-6)}`,
    description: "Product description",
    price: 0,
    cost: 0,
    currentStock: 0,
    category: "Uncategorized",
    location: "Warehouse A",
    imageUrl: "",
    warehouseStocks: [],
    hasVariations: false,
    variations: [],
  };
};

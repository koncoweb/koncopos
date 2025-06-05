import { useState, useEffect } from "react";
import {
  loadProducts as loadProductsFromStorage,
  saveProduct as saveProductToStorage,
  deleteProduct as deleteProductFromStorage,
  createNewProduct as createNewProductTemplate,
  validateProduct,
} from "../services/storage";
import { Product, WarehouseStock } from "../components/InventoryManagement";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";
import firebaseService from "../services/firebaseService";

// Collection names for Firestore
const PRODUCTS_COLLECTION = "products";
const STOCKS_COLLECTION = "stocks";
const WAREHOUSES_COLLECTION = "warehouses";
const WAREHOUSE_STOCKS_COLLECTION = "warehouseStocks";

/**
 * Custom hook to manage inventory data
 * @param initialProducts - Default products array if none are found in storage
 * @returns Object containing products, loading state, and CRUD operations
 */
export const useInventoryData = (initialProducts: Product[] = []) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const { isConfigured } = useFirebaseConfig();

  // Load warehouses from Firebase when configured
  useEffect(() => {
    const fetchWarehouses = async () => {
      if (isConfigured && firebaseService.isInitialized()) {
        setIsLoadingWarehouses(true);
        try {
          console.log("Fetching warehouses for inventory data hook...");
          const warehousesData = await firebaseService.getWarehouses();
          setWarehouses(warehousesData);
          console.log(
            `Loaded ${warehousesData.length} warehouses for inventory management`,
          );
        } catch (error) {
          console.error("Error loading warehouses:", error);
        } finally {
          setIsLoadingWarehouses(false);
        }
      }
    };

    fetchWarehouses();
  }, [isConfigured]);

  // Load products from storage on hook initialization
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Conditionally use Firebase or local storage based on isConfigured
        if (isConfigured && firebaseService.isInitialized()) {
          try {
            console.log("Attempting to load products from Firebase...");
            // Always try to load from Firebase first
            const firebaseProducts = await loadProductsFromFirebase();

            if (firebaseProducts && firebaseProducts.length > 0) {
              // Firebase has products, use them
              const validatedProducts = firebaseProducts.map((product) =>
                validateProduct(product),
              );
              setProducts(validatedProducts);
              console.log(
                `Loaded ${validatedProducts.length} products from Firebase`,
              );
            } else {
              console.log(
                "No products found in Firebase, initializing with local data...",
              );
              // Initialize Firebase with data from local storage
              const storedProducts =
                await loadProductsFromStorage(initialProducts);
              const validatedProducts = storedProducts.map((product) =>
                validateProduct(product),
              );

              // Save each product to Firebase to create the collection
              for (const product of validatedProducts) {
                await saveProductToFirebase(product);
              }

              setProducts(validatedProducts);
              console.log(
                `Initialized Firebase with ${validatedProducts.length} products from local storage`,
              );
            }
          } catch (error) {
            console.error("Error loading products from Firebase:", error);
            // Fall back to local storage if Firebase fails
            const storedProducts =
              await loadProductsFromStorage(initialProducts);
            const validatedProducts = storedProducts.map((product) =>
              validateProduct(product),
            );
            setProducts(validatedProducts);
            console.log(
              `Fallback: Loaded ${validatedProducts.length} products from local storage`,
            );
          }
        } else {
          // Load from local storage
          const storedProducts = await loadProductsFromStorage(initialProducts);
          // Ensure all products are validated before setting state
          const validatedProducts = storedProducts.map((product) =>
            validateProduct(product),
          );
          setProducts(validatedProducts);
          console.log(
            `Loaded ${validatedProducts.length} products from local storage`,
          );
        }
      } catch (error) {
        console.error("Error loading products:", error);
        // Even initial products should be validated
        const validatedInitialProducts = initialProducts.map((product) =>
          validateProduct(product),
        );
        setProducts(validatedInitialProducts);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [isConfigured]); // Re-fetch when isConfigured changes

  // Firebase CRUD operations
  /**
   * Loads products from Firebase Firestore and merges with warehouse stock data
   * @returns Promise<Product[]> Array of validated product objects
   */
  const loadProductsFromFirebase = async (): Promise<Product[]> => {
    try {
      if (!firebaseService.isInitialized()) {
        throw new Error("Firebase not initialized");
      }

      console.log("Fetching products from Firestore...");
      // Get products from Firestore
      const productsData =
        await firebaseService.getCollection(PRODUCTS_COLLECTION);

      console.log(`Retrieved ${productsData.length} products from Firestore`);

      // If no products found, return empty array
      if (productsData.length === 0) {
        console.log("No products found in Firestore");
        return [];
      }

      console.log("Fetching warehouse stocks from Firestore...");
      // Get warehouse stocks to merge with products
      const warehouseStocksData = await firebaseService.getCollection(
        WAREHOUSE_STOCKS_COLLECTION,
      );
      console.log(
        `Retrieved ${warehouseStocksData.length} warehouse stocks from Firestore`,
      );

      // Transform Firestore data to match our Product interface
      const transformedProducts = productsData.map((productDoc: any) => {
        return mapFirestoreDocToProduct(productDoc, warehouseStocksData);
      });

      console.log(
        `Transformed ${transformedProducts.length} products from Firestore`,
      );

      // Ensure each product is properly validated
      return transformedProducts.map((doc) => validateProduct(doc as Product));
    } catch (error) {
      console.error("Error loading products from Firebase:", error);
      throw error;
    }
  };

  /**
   * Maps a Firestore document to our Product interface
   * @param productDoc The Firestore document containing product data
   * @param warehouseStocksData Array of warehouse stock documents
   * @returns Product object
   */
  const mapFirestoreDocToProduct = (
    productDoc: any,
    warehouseStocksData: any[] = [],
  ): Product => {
    // Map warehouse stocks from the product document
    const mappedWarehouseStocks: WarehouseStock[] = [];
    let totalStock = 0;

    // Check if product has embedded warehouseStocks
    if (
      productDoc.warehouseStocks &&
      typeof productDoc.warehouseStocks === "object"
    ) {
      // Process embedded warehouse stocks
      Object.entries(productDoc.warehouseStocks).forEach(
        ([warehouseId, quantity]) => {
          // Find the warehouse name from our warehouses array
          const warehouse = warehouses.find((w) => {
            const sanitizedWarehouseId = w.id
              .replace(/\s+/g, "_")
              .toLowerCase();
            return sanitizedWarehouseId === warehouseId;
          });

          const stockQuantity = Number(quantity) || 0;
          totalStock += stockQuantity;

          mappedWarehouseStocks.push({
            warehouseId: warehouseId,
            warehouseName: warehouse ? warehouse.name : warehouseId,
            quantity: stockQuantity,
          });
        },
      );
    } else {
      // Legacy: Find stock information from separate warehouseStocks collection
      const productStocks = warehouseStocksData.filter(
        (stock: any) => stock.productId === productDoc.id,
      );

      // Calculate total stock across all warehouses
      totalStock = productStocks.reduce(
        (sum: number, stock: any) => sum + (Number(stock.quantity) || 0),
        0,
      );

      // Map warehouse stocks to our WarehouseStock interface
      productStocks.forEach((stock: any) => {
        // Find the warehouse name from our warehouses array
        const warehouse = warehouses.find((w) => w.id === stock.warehouseId);
        mappedWarehouseStocks.push({
          warehouseId: stock.warehouseId,
          warehouseName: warehouse ? warehouse.name : stock.warehouseId,
          quantity: Number(stock.quantity) || 0,
        });
      });
    }

    // Use totalStock from the document if available, otherwise use calculated value
    const documentTotalStock =
      productDoc.totalStock !== undefined
        ? Number(productDoc.totalStock)
        : totalStock;

    // Process variations if they exist
    const variations: ProductVariation[] = [];
    if (
      productDoc.hasVariations &&
      productDoc.variations &&
      typeof productDoc.variations === "object"
    ) {
      console.log(`[FIREBASE LOAD] Found variations data in product document`);

      Object.entries(productDoc.variations).forEach(
        ([variationId, variationData]: [string, any]) => {
          // Process variation warehouse stocks
          const variationWarehouseStocks: WarehouseStock[] = [];

          if (
            variationData.warehouseStocks &&
            typeof variationData.warehouseStocks === "object"
          ) {
            Object.entries(variationData.warehouseStocks).forEach(
              ([warehouseId, quantity]: [string, any]) => {
                // Find the warehouse name from our warehouses array
                const warehouse = warehouses.find((w) => {
                  const sanitizedWarehouseId = w.id
                    .replace(/\s+/g, "_")
                    .toLowerCase();
                  return sanitizedWarehouseId === warehouseId;
                });

                const stockQuantity = Number(quantity) || 0;

                variationWarehouseStocks.push({
                  warehouseId: warehouseId,
                  warehouseName: warehouse ? warehouse.name : warehouseId,
                  quantity: stockQuantity,
                });
              },
            );
          }

          // Create the variation object
          variations.push({
            id: variationId,
            type: variationData.type || "",
            value: variationData.value || "",
            sku: variationData.sku || "",
            price: Number(variationData.price) || 0,
            cost: Number(variationData.cost) || 0,
            warehouseStocks: variationWarehouseStocks,
          });
        },
      );

      console.log(
        `[FIREBASE LOAD] Loaded ${variations.length} variations from Firestore`,
      );
    }

    // Map the Firestore document to our Product interface
    return {
      id: productDoc.id || String(Date.now()),
      name: productDoc.name || "",
      sku: productDoc.sku || `SKU-${Date.now().toString().slice(-6)}`,
      description: productDoc.description || "",
      price: Number(productDoc.price) || 0,
      cost: Number(productDoc.cost) || 0,
      currentStock: documentTotalStock,
      category: productDoc.category || "Uncategorized",
      location: productDoc.defaultWarehouse || "Warehouse A",
      imageUrl: productDoc.imageUrl || "",
      warehouseStocks: mappedWarehouseStocks,
      hasVariations: !!productDoc.hasVariations,
      variations: variations.length > 0 ? variations : undefined,
    };
  };

  /**
   * Saves a product to Firebase Firestore
   * @param product The product to save
   * @returns Promise<Product> The validated product that was saved
   */
  const saveProductToFirebase = async (product: Product): Promise<Product> => {
    try {
      if (!firebaseService.isInitialized()) {
        throw new Error("Firebase not initialized");
      }

      console.log(
        `[FIREBASE SAVE] Starting save process for product: ${product.name} (ID: ${product.id})`,
      );

      // Always validate product before saving to ensure data type consistency
      const validatedProduct = validateProduct(product);

      // Ensure product has a valid ID
      if (!validatedProduct.id || validatedProduct.id === "undefined") {
        validatedProduct.id = `product_${Date.now()}`;
        console.log(
          `[FIREBASE SAVE] Generated new ID for product: ${validatedProduct.id}`,
        );
      }

      // Log warehouse stocks before saving
      if (
        validatedProduct.warehouseStocks &&
        validatedProduct.warehouseStocks.length > 0
      ) {
        console.log(
          `[FIREBASE SAVE] Product has ${validatedProduct.warehouseStocks.length} warehouse stocks before saving:`,
        );
        validatedProduct.warehouseStocks.forEach((stock, index) => {
          console.log(
            `[FIREBASE SAVE] Stock #${index + 1}: Warehouse ${stock.warehouseName} (${stock.warehouseId}): ${stock.quantity} units`,
          );
        });
      } else {
        console.log(
          `[FIREBASE SAVE] Product has no warehouse stocks, will use currentStock: ${validatedProduct.currentStock}`,
        );
        // Initialize empty warehouseStocks array if it doesn't exist
        if (!validatedProduct.warehouseStocks) {
          validatedProduct.warehouseStocks = [];
          console.log(
            `[FIREBASE SAVE] Initialized empty warehouseStocks array`,
          );
        }
      }

      // Check if this product already exists in Firebase
      const existingProduct = await firebaseService.getDocument(
        PRODUCTS_COLLECTION,
        validatedProduct.id,
      );

      // Transform our Product object to match Firestore schema
      const productData = mapProductToFirestoreDoc(validatedProduct);

      // Explicitly check if warehouseStocks is present in the productData
      if (
        !productData.warehouseStocks ||
        Object.keys(productData.warehouseStocks).length === 0
      ) {
        console.warn(
          `[FIREBASE SAVE] Warning: warehouseStocks is empty or missing in productData`,
        );

        // Create a fallback warehouseStocks map if it's missing
        if (
          validatedProduct.warehouseStocks &&
          validatedProduct.warehouseStocks.length > 0
        ) {
          console.log(
            `[FIREBASE SAVE] Creating fallback warehouseStocks map from validatedProduct`,
          );
          productData.warehouseStocks = {};

          validatedProduct.warehouseStocks.forEach((stock) => {
            if (stock.warehouseId) {
              const sanitizedWarehouseId = stock.warehouseId
                .replace(/\s+/g, "_")
                .toLowerCase();
              productData.warehouseStocks[sanitizedWarehouseId] =
                Number(stock.quantity) || 0;
              console.log(
                `[FIREBASE SAVE] Added fallback stock: ${sanitizedWarehouseId} -> ${productData.warehouseStocks[sanitizedWarehouseId]}`,
              );
            }
          });
        }
      }

      // Add timestamp for tracking
      const timestamp = new Date().toISOString();
      if (existingProduct) {
        // Update existing product
        productData.updatedAt = timestamp;
        console.log(
          `[FIREBASE SAVE] Updating existing product in Firestore: ${validatedProduct.id}`,
        );
        console.log(
          `[FIREBASE SAVE] Product data being sent to Firestore:`,
          JSON.stringify(productData),
        );

        await firebaseService.updateDocument(
          PRODUCTS_COLLECTION,
          validatedProduct.id,
          productData,
        );
        console.log(
          `[FIREBASE SAVE] Successfully updated product document in Firestore`,
        );
      } else {
        // Create new product
        productData.createdAt = timestamp;
        productData.updatedAt = timestamp;
        console.log(
          `[FIREBASE SAVE] Creating new product in Firestore: ${validatedProduct.id}`,
        );
        console.log(
          `[FIREBASE SAVE] Product data being sent to Firestore:`,
          JSON.stringify(productData),
        );

        await firebaseService.addDocument(
          PRODUCTS_COLLECTION,
          productData,
          validatedProduct.id,
        );
        console.log(
          `[FIREBASE SAVE] Successfully created product document in Firestore`,
        );
      }

      // Verify the save was successful by fetching the product again
      try {
        const savedProduct = await firebaseService.getDocument(
          PRODUCTS_COLLECTION,
          validatedProduct.id,
        );
        console.log(
          `[FIREBASE SAVE] Verification: Product ${validatedProduct.id} exists in Firestore:`,
          !!savedProduct,
        );

        // Verify warehouse stocks were saved directly in the product document
        if (savedProduct && savedProduct.warehouseStocks) {
          console.log(
            `[FIREBASE SAVE] Verification: Found warehouse stocks embedded in product document`,
          );
          const stocksCount = Object.keys(savedProduct.warehouseStocks).length;
          console.log(
            `[FIREBASE SAVE] Verification: Found ${stocksCount} warehouse stock entries`,
          );

          if (stocksCount > 0) {
            Object.entries(savedProduct.warehouseStocks).forEach(
              ([warehouseId, quantity]) => {
                console.log(
                  `[FIREBASE SAVE] Verified stock: Warehouse ${warehouseId}: ${quantity} units`,
                );
              },
            );
          }
        } else {
          console.warn(
            `[FIREBASE SAVE] Verification: No warehouse stocks found in product document. This indicates a problem with saving.`,
          );
        }
      } catch (verifyError) {
        console.warn(`[FIREBASE SAVE] Verification failed:`, verifyError);
      }

      return validatedProduct;
    } catch (error) {
      console.error("[FIREBASE SAVE] Error saving product to Firebase:", error);
      throw error;
    }
  };

  /**
   * Maps a Product object to a Firestore document format
   * @param product The product to transform
   * @returns Object formatted for Firestore
   */
  const mapProductToFirestoreDoc = (product: Product) => {
    // Ensure all fields have valid values to prevent Firestore errors
    const warehouseStocksMap: Record<string, number> = {};

    // Ensure warehouseStocks is an array
    if (!product.warehouseStocks) {
      console.warn(
        `[FIREBASE MAP] warehouseStocks is missing from product object!`,
      );
      product.warehouseStocks = [];
    }

    // Convert warehouseStocks array to a map of warehouseId -> quantity
    if (product.warehouseStocks && product.warehouseStocks.length > 0) {
      console.log(
        `[FIREBASE MAP] Processing ${product.warehouseStocks.length} warehouse stocks:`,
        JSON.stringify(product.warehouseStocks),
      );

      product.warehouseStocks.forEach((stock) => {
        if (stock && stock.warehouseId) {
          // Sanitize warehouse ID to ensure consistency
          const sanitizedWarehouseId = stock.warehouseId
            .replace(/\s+/g, "_")
            .toLowerCase();
          warehouseStocksMap[sanitizedWarehouseId] =
            Number(stock.quantity) || 0;
          console.log(
            `[FIREBASE MAP] Added stock for warehouse ${stock.warehouseName} (${sanitizedWarehouseId}): ${warehouseStocksMap[sanitizedWarehouseId]} units`,
          );
        } else {
          console.warn(
            `[FIREBASE MAP] Skipping stock with missing warehouseId: ${JSON.stringify(stock)}`,
          );
        }
      });
    }

    // Log the warehouse stocks map for debugging
    console.log(
      `[FIREBASE MAP] Created warehouseStocksMap with ${Object.keys(warehouseStocksMap).length} entries:`,
      warehouseStocksMap,
    );

    // Process variations if they exist
    const variationsData: Record<string, any> = {};
    if (
      product.hasVariations &&
      product.variations &&
      product.variations.length > 0
    ) {
      console.log(
        `[FIREBASE MAP] Processing ${product.variations.length} product variations`,
      );

      product.variations.forEach((variation) => {
        if (!variation.id) {
          console.warn(`[FIREBASE MAP] Skipping variation with missing ID`);
          return;
        }

        // Create a warehouse stocks map for this variation
        const variationStocksMap: Record<string, number> = {};

        if (variation.warehouseStocks && variation.warehouseStocks.length > 0) {
          console.log(
            `[FIREBASE MAP] Processing ${variation.warehouseStocks.length} warehouse stocks for variation ${variation.type}: ${variation.value}`,
            JSON.stringify(variation.warehouseStocks),
          );

          variation.warehouseStocks.forEach((stock) => {
            if (stock && stock.warehouseId) {
              // Sanitize warehouse ID to ensure consistency
              const sanitizedWarehouseId = stock.warehouseId
                .replace(/\s+/g, "_")
                .toLowerCase();
              variationStocksMap[sanitizedWarehouseId] =
                Number(stock.quantity) || 0;
              console.log(
                `[FIREBASE MAP] Added variation stock for warehouse ${stock.warehouseName} (${sanitizedWarehouseId}): ${variationStocksMap[sanitizedWarehouseId]} units`,
              );
            }
          });
        }

        // Create the variation data object
        variationsData[variation.id] = {
          type: variation.type || "",
          value: variation.value || "",
          sku: variation.sku || "",
          price: Number(variation.price) || 0,
          cost: Number(variation.cost) || 0,
          warehouseStocks: variationStocksMap,
        };
      });

      console.log(
        `[FIREBASE MAP] Created variations data with ${Object.keys(variationsData).length} entries`,
      );
    }

    const productData = {
      name: product.name || "",
      sku: product.sku || `SKU-${Date.now().toString().slice(-6)}`,
      description: product.description || "",
      price: Number(product.price) || 0,
      cost: Number(product.cost) || 0,
      category: product.category || "Uncategorized",
      defaultWarehouse: product.location || "",
      imageUrl: product.imageUrl || "",
      // Store total stock count for quick reference
      totalStock: Number(product.currentStock) || 0,
      // Store warehouse stocks directly in the product document
      warehouseStocks: warehouseStocksMap,
      // Add variations data if product has variations
      hasVariations: !!product.hasVariations,
      variations: product.hasVariations ? variationsData : {},
      // Add metadata fields
      lastModifiedBy: firebaseService.getCurrentUser()?.uid || "unknown",
      // Note: updatedAt is set in saveProductToFirebase based on whether it's a create or update operation
    };

    // Log the final product data being sent to Firestore
    console.log(
      `[FIREBASE MAP] Final product data for Firestore:`,
      JSON.stringify(productData),
    );

    return productData;
  };

  // The updateWarehouseStock function has been removed as part of the refactoring to store
  // warehouse stock data directly in the product document instead of a separate collection.

  /**
   * Deletes a product from Firebase Firestore
   * @param productId The ID of the product to delete
   * @returns Promise<boolean> True if deletion was successful
   */
  const deleteProductFromFirebase = async (
    productId: string,
  ): Promise<boolean> => {
    try {
      if (!firebaseService.isInitialized()) {
        throw new Error("Firebase not initialized");
      }

      // Log the deletion attempt
      console.log(`Attempting to delete product ${productId} from Firebase`);

      // First check if the product exists
      const existingProduct = await firebaseService.getDocument(
        PRODUCTS_COLLECTION,
        productId,
      );

      if (!existingProduct) {
        console.warn(
          `Product ${productId} not found in Firebase, skipping deletion`,
        );
        return false;
      }

      // Delete the product document
      await firebaseService.deleteDocument(PRODUCTS_COLLECTION, productId);
      console.log(`Product document ${productId} deleted from Firebase`);

      // Also clean up any warehouse stock entries for this product
      await deleteProductWarehouseStocks(productId);

      return true;
    } catch (error) {
      console.error("Error deleting product from Firebase:", error);
      throw error;
    }
  };

  /**
   * Deletes all warehouse stock entries for a product
   * @param productId The ID of the product
   */
  const deleteProductWarehouseStocks = async (productId: string) => {
    try {
      console.log(
        `Looking for warehouse stock entries for product ${productId}`,
      );

      // Get all warehouse stock entries for this product
      const warehouseStocksData = await firebaseService.getCollection(
        WAREHOUSE_STOCKS_COLLECTION,
      );

      // Filter to find only stocks related to this product
      const productStocks = warehouseStocksData.filter(
        (stock: any) => stock.productId === productId,
      );

      console.log(
        `Found ${productStocks.length} warehouse stock entries to delete`,
      );

      // If no stocks found, log and return early
      if (productStocks.length === 0) {
        console.log(
          `No warehouse stock entries found for product ${productId}`,
        );
        return;
      }

      // Delete each stock entry
      for (const stock of productStocks) {
        try {
          await firebaseService.deleteDocument(
            WAREHOUSE_STOCKS_COLLECTION,
            stock.id,
          );
          console.log(`Deleted warehouse stock entry ${stock.id}`);
        } catch (stockError) {
          console.error(
            `Failed to delete warehouse stock entry ${stock.id}:`,
            stockError,
          );
          // Continue with other deletions even if one fails
        }
      }

      console.log(
        `Deleted ${productStocks.length} warehouse stock entries for product ${productId}`,
      );
    } catch (error) {
      console.error("Error deleting product warehouse stocks:", error);
      // Don't throw here, as we still want the product deletion to be considered successful
      // even if we couldn't clean up all related records
    }
  };

  // Add or update a product
  const saveProduct = async (updatedProduct: Product) => {
    console.log(
      `[SAVE PRODUCT] Starting save process for product: ${updatedProduct.name} (ID: ${updatedProduct.id})`,
    );

    // Always validate the product data to ensure type consistency
    const validatedProduct = validateProduct(updatedProduct);

    // Ensure product has a valid ID before saving
    if (!validatedProduct.id || validatedProduct.id === "undefined") {
      validatedProduct.id = `product_${Date.now()}`;
      console.log(
        `[SAVE PRODUCT] Generated new ID for product: ${validatedProduct.id}`,
      );
    }

    // Log warehouse stocks for debugging
    if (validatedProduct.warehouseStocks) {
      console.log(
        `[SAVE PRODUCT] Warehouse stocks before processing:`,
        JSON.stringify(validatedProduct.warehouseStocks),
      );
    } else {
      console.warn(`[SAVE PRODUCT] No warehouseStocks found in product object`);
      // Initialize empty warehouseStocks array if it doesn't exist
      validatedProduct.warehouseStocks = [];
    }

    // Calculate total stock from warehouse stocks if available
    if (
      validatedProduct.warehouseStocks &&
      validatedProduct.warehouseStocks.length > 0
    ) {
      // Update the currentStock field based on the sum of all warehouse stocks
      const totalStock = validatedProduct.warehouseStocks.reduce(
        (total, stock) => total + (Number(stock.quantity) || 0),
        0,
      );
      validatedProduct.currentStock = totalStock;
      console.log(
        `[SAVE PRODUCT] Calculated total stock: ${validatedProduct.currentStock} from ${validatedProduct.warehouseStocks.length} warehouse stocks`,
      );

      // Ensure each warehouse stock has a valid warehouseId
      validatedProduct.warehouseStocks = validatedProduct.warehouseStocks.map(
        (stock) => {
          // If warehouseId is missing or empty, use a default
          if (!stock.warehouseId || stock.warehouseId.trim() === "") {
            const defaultId = stock.warehouseName
              ? stock.warehouseName.replace(/\s+/g, "_").toLowerCase()
              : `warehouse_${Date.now()}`;

            console.log(
              `[SAVE PRODUCT] Fixed missing warehouseId: using '${defaultId}' for warehouse named '${stock.warehouseName}'`,
            );

            return {
              ...stock,
              warehouseId: defaultId,
            };
          }
          return stock;
        },
      );
    } else {
      console.log(
        `[SAVE PRODUCT] Using direct currentStock value: ${validatedProduct.currentStock}`,
      );
    }

    try {
      // Conditionally use Firebase or local storage based on isConfigured
      if (isConfigured && firebaseService.isInitialized()) {
        console.log(
          `[SAVE PRODUCT] Using Firebase storage for product ${validatedProduct.id}`,
        );

        // Check if this is a new product or an update
        const isNewProduct = !products.some(
          (p) => p.id === validatedProduct.id,
        );

        // Log the validated product before saving to Firebase
        console.log(
          `[SAVE PRODUCT] Product data being sent to saveProductToFirebase:`,
          JSON.stringify({
            id: validatedProduct.id,
            name: validatedProduct.name,
            currentStock: validatedProduct.currentStock,
            warehouseStocksCount: validatedProduct.warehouseStocks?.length || 0,
            warehouseStocks: validatedProduct.warehouseStocks,
          }),
        );

        // Save to Firebase - warehouse stock data is now stored directly in the product document
        await saveProductToFirebase(validatedProduct);

        // Log appropriate message based on operation type
        if (isNewProduct) {
          console.log(
            `[SAVE PRODUCT] New product ${validatedProduct.name} created in Firebase`,
          );
        } else {
          console.log(
            `[SAVE PRODUCT] Product ${validatedProduct.name} updated in Firebase`,
          );
        }

        // Update local state with validated data
        const updatedProducts = products.map((p) =>
          p.id === validatedProduct.id ? validatedProduct : p,
        );

        // If it's a new product, add it to the array
        if (isNewProduct) {
          updatedProducts.push(validatedProduct);
        }

        setProducts(updatedProducts);
        console.log(
          `[SAVE PRODUCT] Updated local state with ${updatedProducts.length} products`,
        );
      } else {
        console.log(
          `[SAVE PRODUCT] Using local storage for product ${validatedProduct.id}`,
        );

        // Save to local storage and update state
        const updatedProducts = await saveProductToStorage(
          products,
          validatedProduct,
        );
        setProducts(updatedProducts);
        console.log(
          `[SAVE PRODUCT] Product ${validatedProduct.name} saved to local storage with warehouse stock data`,
        );
      }

      console.log(
        `[SAVE PRODUCT] Successfully completed save process for ${validatedProduct.name}`,
      );
    } catch (error) {
      console.error("[SAVE PRODUCT] Error saving product:", error);
    }

    return validatedProduct;
  };

  // Delete a product
  const deleteProduct = async (productId: string) => {
    try {
      // Conditionally use Firebase or local storage based on isConfigured
      if (isConfigured && firebaseService.isInitialized()) {
        // Delete from Firebase
        await deleteProductFromFirebase(productId);

        // Update local state
        const updatedProducts = products.filter((p) => p.id !== productId);
        setProducts(updatedProducts);
        console.log(`Product with ID ${productId} deleted from Firebase`);
      } else {
        // Delete from local storage and update state
        const updatedProducts = await deleteProductFromStorage(
          products,
          productId,
        );
        setProducts(updatedProducts);
        console.log(`Product with ID ${productId} deleted from local storage`);
      }
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  };

  // Create a new product with default values
  const createNewProduct = () => {
    return createNewProductTemplate();
  };

  // Ensure all products in the current state are validated
  const validateAllProducts = () => {
    const validatedProducts = products.map((product) =>
      validateProduct(product),
    );
    setProducts(validatedProducts);
    return validatedProducts;
  };

  /**
   * Refreshes the product list from the data source
   * @returns Promise<Product[]> The refreshed product list
   */
  const refreshProducts = async (): Promise<Product[]> => {
    try {
      setIsLoading(true);
      let refreshedProducts: Product[] = [];

      if (isConfigured && firebaseService.isInitialized()) {
        // Load from Firebase
        refreshedProducts = await loadProductsFromFirebase();
        console.log(
          `Refreshed ${refreshedProducts.length} products from Firebase`,
        );
      } else {
        // Load from local storage
        refreshedProducts = await loadProductsFromStorage(initialProducts);
        console.log(
          `Refreshed ${refreshedProducts.length} products from local storage`,
        );
      }

      // Update state with refreshed products
      setProducts(refreshedProducts);
      return refreshedProducts;
    } catch (error) {
      console.error("Error refreshing products:", error);
      return products; // Return current state if refresh fails
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Updates stock levels for products involved in a transfer
   * @param transferProducts Array of products with quantities to transfer
   * @param sourceLocationId ID of the source location
   * @param destinationLocationId ID of the destination location
   * @returns Promise<boolean> True if all updates were successful
   */
  const updateStockForTransfer = async (
    transferProducts: Array<{
      id: string;
      quantity: number;
    }>,
    sourceLocationId: string,
    destinationLocationId: string,
  ): Promise<boolean> => {
    try {
      if (!isConfigured || !firebaseService.isInitialized()) {
        console.error("Firebase not configured for stock transfer update");
        return false;
      }

      console.log(
        `[STOCK TRANSFER] Updating stock for ${transferProducts.length} products`,
      );
      console.log(
        `[STOCK TRANSFER] Source: ${sourceLocationId}, Destination: ${destinationLocationId}`,
      );

      // Sanitize location IDs
      const sanitizedSourceId = sourceLocationId
        .replace(/\s+/g, "_")
        .toLowerCase();
      const sanitizedDestinationId = destinationLocationId
        .replace(/\s+/g, "_")
        .toLowerCase();

      // Update each product's stock levels
      for (const transferProduct of transferProducts) {
        try {
          console.log(
            `[STOCK TRANSFER] Processing product ${transferProduct.id} - quantity: ${transferProduct.quantity}`,
          );

          // Get the current product document from Firebase
          const productDoc = await firebaseService.getDocument(
            "products",
            transferProduct.id,
          );

          if (!productDoc) {
            console.error(
              `[STOCK TRANSFER] Product ${transferProduct.id} not found in Firebase`,
            );
            continue;
          }

          // Get current warehouse stocks
          const currentWarehouseStocks = productDoc.warehouseStocks || {};
          console.log(
            `[STOCK TRANSFER] Current warehouse stocks for ${transferProduct.id}:`,
            currentWarehouseStocks,
          );

          // Update source location stock (subtract)
          const currentSourceStock =
            Number(currentWarehouseStocks[sanitizedSourceId]) || 0;
          const newSourceStock = Math.max(
            0,
            currentSourceStock - transferProduct.quantity,
          );
          currentWarehouseStocks[sanitizedSourceId] = newSourceStock;

          console.log(
            `[STOCK TRANSFER] Source ${sanitizedSourceId}: ${currentSourceStock} -> ${newSourceStock}`,
          );

          // Update destination location stock (add)
          const currentDestinationStock =
            Number(currentWarehouseStocks[sanitizedDestinationId]) || 0;
          const newDestinationStock =
            currentDestinationStock + transferProduct.quantity;
          currentWarehouseStocks[sanitizedDestinationId] = newDestinationStock;

          console.log(
            `[STOCK TRANSFER] Destination ${sanitizedDestinationId}: ${currentDestinationStock} -> ${newDestinationStock}`,
          );

          // Calculate new total stock
          const newTotalStock = Object.values(currentWarehouseStocks).reduce(
            (sum: number, stock: any) => sum + (Number(stock) || 0),
            0,
          );

          console.log(
            `[STOCK TRANSFER] New total stock for ${transferProduct.id}: ${newTotalStock}`,
          );

          // Update the product document in Firebase
          const updateData = {
            warehouseStocks: currentWarehouseStocks,
            totalStock: newTotalStock,
            updatedAt: new Date().toISOString(),
            lastModifiedBy: firebaseService.getCurrentUser()?.uid || "system",
          };

          await firebaseService.updateDocument(
            "products",
            transferProduct.id,
            updateData,
          );

          console.log(
            `[STOCK TRANSFER] Successfully updated stock for product ${transferProduct.id}`,
          );
        } catch (productError) {
          console.error(
            `[STOCK TRANSFER] Error updating stock for product ${transferProduct.id}:`,
            productError,
          );
          // Continue with other products even if one fails
        }
      }

      // Refresh the local products state to reflect the changes
      await refreshProducts();
      console.log(
        `[STOCK TRANSFER] Stock transfer completed and local state refreshed`,
      );

      return true;
    } catch (error) {
      console.error(
        "[STOCK TRANSFER] Error updating stock for transfer:",
        error,
      );
      return false;
    }
  };

  return {
    products,
    warehouses,
    isLoading,
    isLoadingWarehouses,
    saveProduct,
    deleteProduct,
    createNewProduct,
    validateAllProducts,
    refreshProducts,
    updateStockForTransfer,
    isFirebaseConfigured: isConfigured,
    // Expose Firebase operations for potential direct use
    loadProductsFromFirebase,
    saveProductToFirebase,
    deleteProductFromFirebase,
  };
};

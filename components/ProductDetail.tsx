import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Save,
  Trash2,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import CategoryManager from "./CategoryManager";
import { getData, STORAGE_KEYS } from "../services/storage";
import firebaseService from "../services/firebaseService";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";

interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}

interface ProductVariation {
  id: string;
  type: string; // e.g., 'size', 'flavor', 'color'
  value: string; // e.g., '1kg', 'strawberry', 'red'
  sku: string;
  price: number;
  cost: number;
  warehouseStocks: WarehouseStock[];
}

interface ProductDetailProps {
  product?: {
    id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    cost: number;
    currentStock: number;
    category: string;
    location: string;
    imageUrl: string;
    warehouseStocks?: WarehouseStock[];
    hasVariations?: boolean;
    variations?: ProductVariation[];
  };
  onSave?: (product: any) => void;
  onDelete?: (productId: string) => void;
  onBack?: () => void;
}

const ProductDetail = ({
  product = {
    id: "1",
    name: "Sample Product",
    sku: "SKU-12345",
    description:
      "This is a sample product description that provides details about the product features and benefits.",
    price: 29.99,
    cost: 15.5,
    currentStock: 42,
    category: "Electronics",
    location: "Warehouse A",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    warehouseStocks: [],
  },
  onSave = () => {},
  onDelete = () => {},
  onBack = () => {},
}: ProductDetailProps) => {
  // Ensure product has valid data to prevent controlled/uncontrolled input warnings
  const validProduct =
    product && product.id
      ? product
      : {
          id: "1",
          name: "Sample Product",
          sku: "SKU-12345",
          description:
            "This is a sample product description that provides details about the product features and benefits.",
          price: 29.99,
          cost: 15.5,
          currentStock: 42,
          category: "Electronics",
          location: "Warehouse A",
          imageUrl:
            "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
          warehouseStocks: [],
        };
  const [editedProduct, setEditedProduct] = useState(validProduct);
  const [stockAdjustment, setStockAdjustment] = useState(0);
  const [manualStockInput, setManualStockInput] = useState(
    String(validProduct.currentStock),
  );
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseStocks, setWarehouseStocks] = useState<WarehouseStock[]>(
    validProduct.warehouseStocks || [],
  );
  const [hasVariations, setHasVariations] = useState<boolean>(
    validProduct.hasVariations || false,
  );
  const [variations, setVariations] = useState<ProductVariation[]>(
    validProduct.variations || [],
  );
  const [showVariationsSection, setShowVariationsSection] = useState<boolean>(
    validProduct.hasVariations || false,
  );
  const [newVariationType, setNewVariationType] = useState<string>("");
  const [newVariationValue, setNewVariationValue] = useState<string>("");
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const { isConfigured } = useFirebaseConfig();

  // Update manual stock input when product changes
  useEffect(() => {
    // Guard against undefined product data
    if (!product || !product.id) {
      console.log(
        `[DEBUG] ProductDetail: Received undefined or invalid product data`,
      );
      return; // Don't update state with invalid data
    }

    // Ensure we're working with valid numbers
    const currentStock = isNaN(Number(product.currentStock))
      ? 0
      : Number(product.currentStock);

    console.log(
      `[DEBUG] ProductDetail: Loading product ${product.id} with stock ${currentStock}`,
    );

    // Create a deep copy of the product to avoid reference issues
    const productCopy = JSON.parse(JSON.stringify(product));
    setEditedProduct(productCopy); // Set the entire product object to ensure all fields are updated
    setStockAdjustment(0);

    // Set variations state
    setHasVariations(product.hasVariations || false);
    setVariations(product.variations || []);
    setShowVariationsSection(product.hasVariations || false);

    // Log variations data if present
    if (
      product.hasVariations &&
      product.variations &&
      product.variations.length > 0
    ) {
      console.log(
        `[DEBUG] Product has ${product.variations.length} variations`,
      );
      product.variations.forEach((variation, index) => {
        console.log(
          `[DEBUG] Variation ${index}: ${variation.type}:${variation.value}, stocks: ${variation.warehouseStocks?.length || 0}`,
        );
        if (variation.warehouseStocks && variation.warehouseStocks.length > 0) {
          console.log(
            `[DEBUG] Variation ${index} warehouse stocks:`,
            JSON.stringify(variation.warehouseStocks),
          );
        }
      });
    }

    // Initialize warehouse stocks from product if available
    if (
      product.warehouseStocks &&
      Array.isArray(product.warehouseStocks) &&
      product.warehouseStocks.length > 0
    ) {
      // Validate and normalize warehouse stocks
      const validatedStocks = product.warehouseStocks
        .map((stock) => ({
          warehouseId: stock.warehouseId ? stock.warehouseId.trim() : "",
          warehouseName: stock.warehouseName || "Unknown Warehouse",
          quantity: isNaN(Number(stock.quantity)) ? 0 : Number(stock.quantity),
        }))
        .filter((stock) => !!stock.warehouseId);

      console.log(
        `[DEBUG] ProductDetail: Product has ${validatedStocks.length} valid warehouse stocks:`,
        JSON.stringify(validatedStocks),
      );
      setWarehouseStocks(validatedStocks);

      // Calculate total stock from warehouse stocks
      const totalWarehouseStock = validatedStocks.reduce(
        (sum, stock) => sum + (Number(stock.quantity) || 0),
        0,
      );
      setManualStockInput(String(totalWarehouseStock));
    } else {
      console.log(
        `[DEBUG] ProductDetail: Product has no warehouse stocks, using currentStock: ${currentStock}`,
      );
      setManualStockInput(String(currentStock));
      // Initialize empty warehouse stocks array
      setWarehouseStocks([]);
    }
  }, [product]); // Depend on the entire product object to ensure all changes are captured

  // Load warehouses from Firebase
  useEffect(() => {
    const loadWarehouses = async () => {
      if (isConfigured && firebaseService.isInitialized()) {
        setIsLoadingWarehouses(true);
        try {
          console.log(
            `[DEBUG] Loading warehouses for product ID: ${product.id}`,
          );
          const warehousesData = await firebaseService.getWarehouses();
          console.log(
            `[DEBUG] Loaded ${warehousesData.length} warehouses from Firebase`,
          );
          setWarehouses(warehousesData);

          // If we have warehouses but no warehouse stocks yet, initialize them
          if (
            warehousesData.length > 0 &&
            (!warehouseStocks || warehouseStocks.length === 0)
          ) {
            console.log(
              "[DEBUG] Initializing warehouse stocks with empty quantities",
            );
            const initialStocks = warehousesData.map((warehouse) => ({
              warehouseId: warehouse.id,
              warehouseName: warehouse.name,
              quantity: 0,
            }));
            console.log(
              `[DEBUG] Created ${initialStocks.length} initial warehouse stocks`,
            );
            setWarehouseStocks(initialStocks);
          }

          // Load existing warehouse stocks for this product
          // Only fetch warehouse stocks if we have a valid product ID
          if (product.id && product.id !== "1") {
            // Skip for sample product
            try {
              console.log(
                `[DEBUG] Fetching warehouse stocks for product ID: ${product.id}`,
              );
              const productStocks =
                await firebaseService.getWarehouseStocksForProduct(product.id);
              console.log(
                `[DEBUG] Received ${productStocks.length} warehouse stocks from Firebase for product ${product.id}:`,
                JSON.stringify(productStocks),
              );

              if (productStocks.length > 0) {
                // Map the stocks to our format and ensure all warehouses are included
                const mappedStocks = warehousesData.map((warehouse) => {
                  // Sanitize warehouse IDs for comparison to handle different formats
                  const sanitizedWarehouseId = warehouse.id
                    .replace(/\s+/g, "_")
                    .toLowerCase();

                  console.log(
                    `[DEBUG] Looking for stock for warehouse: ${warehouse.name} (ID: ${warehouse.id}, sanitized: ${sanitizedWarehouseId})`,
                  );

                  const existingStock = productStocks.find((stock) => {
                    if (!stock.warehouseId) {
                      console.warn(
                        `[DEBUG] Found stock entry with missing warehouseId:`,
                        JSON.stringify(stock),
                      );
                      return false;
                    }

                    const stockWarehouseId = stock.warehouseId
                      .replace(/\s+/g, "_")
                      .toLowerCase();

                    console.log(
                      `[DEBUG] Comparing warehouse IDs: ${stockWarehouseId} vs ${sanitizedWarehouseId}`,
                    );
                    return stockWarehouseId === sanitizedWarehouseId;
                  });

                  if (existingStock) {
                    console.log(
                      `[DEBUG] Found existing stock for warehouse ${warehouse.name}: ${existingStock.quantity}`,
                    );
                  } else {
                    console.log(
                      `[DEBUG] No existing stock found for warehouse ${warehouse.name}, using default 0`,
                    );
                  }

                  return {
                    warehouseId: warehouse.id,
                    warehouseName: warehouse.name,
                    quantity: existingStock
                      ? Number(existingStock.quantity) || 0
                      : 0,
                  };
                });

                console.log(
                  `[DEBUG] Mapped ${mappedStocks.length} warehouse stocks:`,
                  JSON.stringify(mappedStocks),
                );
                setWarehouseStocks(mappedStocks);

                // Calculate and update total stock
                const totalStock = mappedStocks.reduce(
                  (sum, stock) => sum + (Number(stock.quantity) || 0),
                  0,
                );
                console.log(`[DEBUG] Calculated total stock: ${totalStock}`);
                setManualStockInput(String(totalStock));
                setEditedProduct((prev) => {
                  const updatedProduct = {
                    ...prev,
                    currentStock: totalStock,
                    warehouseStocks: mappedStocks, // Ensure warehouseStocks is included in editedProduct
                  };
                  console.log(
                    "[DEBUG] Updated editedProduct with warehouse stocks:",
                    JSON.stringify(updatedProduct.warehouseStocks),
                  );
                  return updatedProduct;
                });
              } else {
                console.log(
                  "[DEBUG] No warehouse stocks found for this product, using default empty stocks",
                );
              }
            } catch (stockError) {
              console.error(
                "[DEBUG] Error loading warehouse stocks:",
                stockError,
              );
            }
          } else {
            console.log(
              "[DEBUG] Using sample product or new product, not loading warehouse stocks from Firebase",
            );
          }
        } catch (error) {
          console.error("[DEBUG] Error loading warehouses:", error);
        } finally {
          setIsLoadingWarehouses(false);
        }
      } else {
        console.log(
          "[DEBUG] Firebase not configured or initialized, skipping warehouse loading",
        );
      }
    };

    loadWarehouses();
  }, [isConfigured, product.id]);

  const handleInputChange = (field: string, value: string | number) => {
    // For numeric fields, ensure we have valid numbers
    if (field === "currentStock" || field === "price" || field === "cost") {
      // Convert to number and validate
      const numericValue = isNaN(Number(value)) ? 0 : Number(value);

      // Ensure we have a non-negative value for stock and prices
      const validatedValue = Math.max(0, numericValue);

      setEditedProduct({
        ...editedProduct,
        [field]: validatedValue,
      });

      // Update manual stock input when currentStock is changed
      if (field === "currentStock") {
        setManualStockInput(String(validatedValue));
        setStockAdjustment(0); // Reset adjustment when directly setting stock
      }
    } else {
      // For non-numeric fields
      setEditedProduct({
        ...editedProduct,
        [field]: value,
      });
    }
  };

  const handleSave = () => {
    console.log(
      `[DEBUG] Starting handleSave with hasVariations=${hasVariations}, variations count=${variations.length}`,
    );

    // Ensure all numeric values are valid numbers
    const currentStock = isNaN(Number(editedProduct.currentStock))
      ? 0
      : Number(editedProduct.currentStock);
    const adjustment = isNaN(Number(stockAdjustment))
      ? 0
      : Number(stockAdjustment);
    const price = isNaN(Number(editedProduct.price))
      ? 0
      : Number(editedProduct.price);
    const cost = isNaN(Number(editedProduct.cost))
      ? 0
      : Number(editedProduct.cost);

    // Calculate new stock level with adjustment
    const newStockLevel =
      adjustment !== 0 ? currentStock + adjustment : currentStock;

    // Validate and format warehouse stocks
    const formattedWarehouseStocks = warehouseStocks
      .map((stock) => {
        // Ensure warehouseId is properly formatted and not empty
        const sanitizedWarehouseId = stock.warehouseId
          ? stock.warehouseId.trim()
          : "";

        if (!sanitizedWarehouseId) {
          console.warn(
            `[DEBUG] Warning: Found warehouse stock with empty warehouseId: ${JSON.stringify(stock)}`,
          );
          return null; // Will be filtered out
        }

        // Ensure quantity is a valid number
        const quantity = Number(stock.quantity);
        if (isNaN(quantity)) {
          console.warn(
            `[DEBUG] Warning: Invalid quantity for warehouse ${stock.warehouseName}: ${stock.quantity}`,
          );
        }

        return {
          warehouseId: sanitizedWarehouseId,
          warehouseName: stock.warehouseName || "Unknown Warehouse",
          quantity: isNaN(quantity) ? 0 : quantity,
        };
      })
      .filter((stock) => stock !== null && !!stock.warehouseId); // Filter out null entries and those with empty warehouseIds

    // Log warehouse stocks for debugging
    console.log(
      `[DEBUG] Saving product with ${formattedWarehouseStocks.length} warehouse stocks`,
    );
    formattedWarehouseStocks.forEach((stock) => {
      console.log(
        `[DEBUG] Stock for ${stock.warehouseName} (ID: ${stock.warehouseId}): ${stock.quantity}`,
      );
    });

    // Validate variations if product has them
    const formattedVariations = hasVariations
      ? variations.map((variation) => {
          console.log(
            `[DEBUG] Processing variation ${variation.id} (${variation.type}: ${variation.value})`,
          );

          // Ensure all numeric values are valid
          const variationPrice = isNaN(Number(variation.price))
            ? price
            : Number(variation.price);
          const variationCost = isNaN(Number(variation.cost))
            ? cost
            : Number(variation.cost);

          // Check if warehouseStocks exists and is an array
          if (
            !variation.warehouseStocks ||
            !Array.isArray(variation.warehouseStocks)
          ) {
            console.warn(
              `[DEBUG] Warning: Variation ${variation.id} has missing or invalid warehouseStocks. Current value:`,
              variation.warehouseStocks,
            );
            // Initialize with empty array if missing
            variation.warehouseStocks = [];
          }

          // Validate warehouse stocks for this variation
          const validatedWarehouseStocks = variation.warehouseStocks
            ? variation.warehouseStocks
                .map((stock) => {
                  // Ensure warehouseId is properly formatted and not empty
                  const sanitizedWarehouseId = stock.warehouseId
                    ? stock.warehouseId.trim()
                    : "";

                  if (!sanitizedWarehouseId) {
                    console.warn(
                      `[DEBUG] Warning: Found variation warehouse stock with empty warehouseId: ${JSON.stringify(stock)}`,
                    );
                    return null; // Will be filtered out
                  }

                  // Ensure quantity is a valid number
                  const quantity = Number(stock.quantity);
                  if (isNaN(quantity)) {
                    console.warn(
                      `[DEBUG] Warning: Invalid quantity for variation warehouse ${stock.warehouseName}: ${stock.quantity}`,
                    );
                  }

                  return {
                    warehouseId: sanitizedWarehouseId,
                    warehouseName: stock.warehouseName || "Unknown Warehouse",
                    quantity: isNaN(quantity) ? 0 : quantity,
                  };
                })
                .filter((stock) => stock !== null && !!stock.warehouseId)
            : [];

          // Log variation warehouse stocks for debugging
          console.log(
            `[DEBUG] Variation ${variation.type}: ${variation.value} has ${validatedWarehouseStocks.length} warehouse stocks`,
          );
          validatedWarehouseStocks.forEach((stock) => {
            console.log(
              `[DEBUG] Variation stock for ${stock.warehouseName} (ID: ${stock.warehouseId}): ${stock.quantity}`,
            );
          });

          return {
            ...variation,
            price: variationPrice,
            cost: variationCost,
            warehouseStocks: validatedWarehouseStocks,
          };
        })
      : [];

    // Create a deep copy of the product with updated stock and validated numeric values
    const productToUpdate = {
      ...editedProduct,
      currentStock: newStockLevel,
      price: price,
      cost: cost,
      warehouseStocks: formattedWarehouseStocks,
      hasVariations: hasVariations,
      variations: formattedVariations,
    };

    console.log(
      `[DEBUG] Product before JSON stringify: hasVariations=${productToUpdate.hasVariations}, variations count=${productToUpdate.variations?.length || 0}`,
    );

    // Deep clone to ensure we don't have reference issues
    const updatedProduct = JSON.parse(JSON.stringify(productToUpdate));

    console.log(
      `[DEBUG] Product after JSON stringify: hasVariations=${updatedProduct.hasVariations}, variations count=${updatedProduct.variations?.length || 0}`,
    );

    // Double-check that warehouseStocks is properly included in the product object
    if (!updatedProduct.warehouseStocks) {
      console.error(
        "[DEBUG] ERROR: warehouseStocks is missing from updatedProduct!",
      );
      updatedProduct.warehouseStocks = formattedWarehouseStocks; // Use our validated array
    } else if (!Array.isArray(updatedProduct.warehouseStocks)) {
      console.error(
        "[DEBUG] ERROR: warehouseStocks is not an array in updatedProduct!",
      );
      updatedProduct.warehouseStocks = formattedWarehouseStocks; // Use our validated array
    } else {
      console.log(
        `[DEBUG] Sending product with ${updatedProduct.warehouseStocks.length} warehouse stocks to parent component`,
      );
    }

    // Double-check that variations and their warehouse stocks are properly included
    if (
      hasVariations &&
      (!updatedProduct.variations || !Array.isArray(updatedProduct.variations))
    ) {
      console.error(
        "[DEBUG] ERROR: variations array is missing or invalid in updatedProduct!",
      );
      updatedProduct.variations = formattedVariations;
    } else if (hasVariations) {
      console.log(
        `[DEBUG] Sending product with ${updatedProduct.variations.length} variations to parent component`,
      );

      // Verify each variation has its warehouse stocks
      updatedProduct.variations.forEach((variation, index) => {
        console.log(
          `[DEBUG] Checking variation ${index} (${variation.type}: ${variation.value}) for warehouse stocks`,
        );

        if (
          !variation.warehouseStocks ||
          !Array.isArray(variation.warehouseStocks)
        ) {
          console.error(
            `[DEBUG] ERROR: warehouseStocks is missing for variation ${index}!`,
          );
          // Get the corresponding formatted variation
          const formattedVariation = formattedVariations[index];
          if (
            formattedVariation &&
            Array.isArray(formattedVariation.warehouseStocks)
          ) {
            variation.warehouseStocks = formattedVariation.warehouseStocks;
            console.log(
              `[DEBUG] Fixed variation ${index} by copying warehouseStocks from formattedVariations`,
              JSON.stringify(variation.warehouseStocks),
            );
          } else {
            variation.warehouseStocks = [];
            console.log(
              `[DEBUG] Initialized empty warehouseStocks array for variation ${index}`,
            );
          }
        } else {
          console.log(
            `[DEBUG] Variation ${index} has ${variation.warehouseStocks.length} warehouse stocks`,
            JSON.stringify(variation.warehouseStocks),
          );
        }
      });
    }

    // Log the full product object being saved for verification
    console.log(
      "[DEBUG] Full product object being saved:",
      JSON.stringify({
        id: updatedProduct.id,
        name: updatedProduct.name,
        hasVariations: updatedProduct.hasVariations,
        variationsCount: updatedProduct.variations?.length || 0,
        warehouseStocksCount: updatedProduct.warehouseStocks?.length || 0,
      }),
    );

    // Update the manual stock input to reflect the new stock level
    setManualStockInput(String(newStockLevel));
    setStockAdjustment(0); // Reset adjustment after save

    // Keep the current warehouse stocks in state to prevent UI reset
    setWarehouseStocks(formattedWarehouseStocks);

    // Update edited product to include the warehouse stocks
    setEditedProduct(updatedProduct);

    console.log("[DEBUG] Calling onSave with updated product");
    onSave(updatedProduct);
    Alert.alert("Success", "Product updated successfully");
  };

  const handleDelete = () => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this product?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            onDelete(editedProduct.id);
            Alert.alert("Success", "Product deleted successfully");
            onBack();
          },
          style: "destructive",
        },
      ],
    );
  };

  const adjustStock = (amount: number) => {
    const currentAdjustment = isNaN(Number(stockAdjustment))
      ? 0
      : Number(stockAdjustment);

    // Calculate new adjustment value
    const newAdjustment = currentAdjustment + amount;

    // Prevent negative stock by checking if current stock + new adjustment would be negative
    const currentStock = isNaN(Number(editedProduct.currentStock))
      ? 0
      : Number(editedProduct.currentStock);
    if (currentStock + newAdjustment < 0) {
      // Limit adjustment to not go below zero stock
      setStockAdjustment(-currentStock);
    } else {
      setStockAdjustment(newAdjustment);
    }
  };

  const updateWarehouseStock = (
    warehouseId: string,
    quantity: number,
    variationId?: string,
  ) => {
    // Ensure quantity is a valid number
    const validQuantity = isNaN(Number(quantity)) ? 0 : Number(quantity);

    // Ensure warehouseId is properly formatted
    const sanitizedWarehouseId = warehouseId ? warehouseId.trim() : "";
    if (!sanitizedWarehouseId) {
      console.error(
        "[DEBUG] Error: Attempted to update warehouse stock with empty warehouseId",
      );
      return;
    }

    // If variationId is provided, update the warehouse stock for that variation
    if (variationId) {
      console.log(
        `[DEBUG] Calling updateVariationWarehouseStock for variation ${variationId}, warehouse ${sanitizedWarehouseId}, quantity ${validQuantity}`,
      );
      updateVariationWarehouseStock(
        variationId,
        sanitizedWarehouseId,
        validQuantity,
      );
      return;
    }

    console.log(
      `[DEBUG] Updating main product warehouse stock for ID: ${sanitizedWarehouseId} to quantity: ${validQuantity}`,
    );

    // Update the warehouse stock for the main product
    setWarehouseStocks((prevStocks) => {
      // First check if we need to add a new warehouse stock entry
      const warehouseExists = prevStocks.some(
        (stock) =>
          stock.warehouseId &&
          stock.warehouseId.trim() === sanitizedWarehouseId,
      );

      let updatedStocks;
      if (!warehouseExists) {
        // Find the warehouse name from the warehouses array
        const warehouseName =
          warehouses.find((w) => w.id && w.id.trim() === sanitizedWarehouseId)
            ?.name || "Unknown Warehouse";

        console.log(
          `[DEBUG] Adding new warehouse stock entry for: ${warehouseName} (${sanitizedWarehouseId})`,
        );

        // Add a new entry
        updatedStocks = [
          ...prevStocks,
          {
            warehouseId: sanitizedWarehouseId,
            warehouseName: warehouseName,
            quantity: validQuantity,
          },
        ];
      } else {
        // Update existing entry
        updatedStocks = prevStocks.map((stock) => {
          // Sanitize stock warehouseId for comparison
          const stockWarehouseId = stock.warehouseId
            ? stock.warehouseId.trim()
            : "";

          if (stockWarehouseId === sanitizedWarehouseId) {
            console.log(
              `[DEBUG] Found matching warehouse: ${stock.warehouseName}, updating quantity from ${stock.quantity} to ${validQuantity}`,
            );
            return { ...stock, quantity: validQuantity };
          }
          return stock;
        });
      }

      // Calculate total stock across all warehouses after update
      const totalStock = updatedStocks.reduce(
        (sum, stock) => sum + (Number(stock.quantity) || 0),
        0,
      );

      console.log(
        `[DEBUG] Total stock across all warehouses after update: ${totalStock}`,
      );
      console.log(
        `[DEBUG] Updated warehouse stocks:`,
        JSON.stringify(updatedStocks),
      );

      // Update the current stock value and manual input
      setEditedProduct((prev) => {
        // Create a deep copy to ensure we're not carrying over any reference issues
        const updatedProduct = JSON.parse(
          JSON.stringify({
            ...prev,
            currentStock: totalStock,
            warehouseStocks: updatedStocks,
          }),
        );

        console.log(
          "[DEBUG] Updated product with new warehouse stocks:",
          JSON.stringify(updatedProduct.warehouseStocks),
        );
        return updatedProduct;
      });

      // Update manual stock input immediately
      setManualStockInput(String(totalStock));

      return updatedStocks;
    });
  };

  // Add a new variation to the product
  const handleAddVariation = () => {
    if (!newVariationType.trim() || !newVariationValue.trim()) {
      Alert.alert("Error", "Variation type and value cannot be empty");
      return;
    }

    // Create a new variation with default values
    const newVariation: ProductVariation = {
      id: `var_${Date.now()}`,
      type: newVariationType.trim(),
      value: newVariationValue.trim(),
      sku: `${editedProduct.sku}-${newVariationType.trim().substring(0, 3)}-${newVariationValue.trim().substring(0, 3)}`.toUpperCase(),
      price: editedProduct.price,
      cost: editedProduct.cost,
      warehouseStocks: warehouseStocks.map((stock) => ({
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouseName,
        quantity: 0, // Start with zero stock for new variations
      })),
    };

    console.log(
      `[DEBUG] Adding new variation: ${newVariationType.trim()}: ${newVariationValue.trim()} with ${newVariation.warehouseStocks.length} warehouse stocks`,
      JSON.stringify(newVariation.warehouseStocks),
    );

    setVariations([...variations, newVariation]);
    setNewVariationType("");
    setNewVariationValue("");
  };

  // Remove a variation from the product
  const handleRemoveVariation = (variationId: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this variation?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            console.log(`[DEBUG] Removing variation with ID: ${variationId}`);
            setVariations(variations.filter((v) => v.id !== variationId));
          },
          style: "destructive",
        },
      ],
    );
  };

  // Toggle variations feature on/off
  const toggleVariationsFeature = () => {
    if (hasVariations && variations.length > 0) {
      // Confirm before disabling variations if there are existing variations
      Alert.alert(
        "Confirm Action",
        "Disabling variations will remove all existing variations. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue",
            onPress: () => {
              console.log(
                `[DEBUG] Disabling variations feature and removing ${variations.length} variations`,
              );
              setHasVariations(false);
              setVariations([]);
              setShowVariationsSection(false);
            },
          },
        ],
      );
    } else {
      console.log(
        `[DEBUG] ${hasVariations ? "Disabling" : "Enabling"} variations feature`,
      );
      setHasVariations(!hasVariations);
      setShowVariationsSection(!hasVariations);
      if (!hasVariations && variations.length === 0) {
        // Initialize with empty variations array when enabling
        setVariations([]);
      }
    }
  };

  // Update variation field
  const updateVariationField = (
    variationId: string,
    field: string,
    value: any,
  ) => {
    console.log(
      `[DEBUG] Updating variation ${variationId} field ${field} to:`,
      value,
    );
    setVariations(
      variations.map((variation) => {
        if (variation.id === variationId) {
          return { ...variation, [field]: value };
        }
        return variation;
      }),
    );
  };

  // Update warehouse stock for a specific variation
  const updateVariationWarehouseStock = (
    variationId: string,
    warehouseId: string,
    quantity: number,
  ) => {
    // Ensure quantity is a valid number
    const validQuantity = isNaN(Number(quantity)) ? 0 : Number(quantity);

    // Ensure warehouseId is properly formatted
    const sanitizedWarehouseId = warehouseId ? warehouseId.trim() : "";
    if (!sanitizedWarehouseId) {
      console.error(
        "[DEBUG] Error: Attempted to update variation warehouse stock with empty warehouseId",
      );
      return;
    }

    console.log(
      `[DEBUG] Updating warehouse stock for variation ${variationId}, warehouse ${sanitizedWarehouseId} to quantity: ${validQuantity}`,
    );

    setVariations((prevVariations) => {
      const updatedVariations = prevVariations.map((variation) => {
        if (variation.id !== variationId) return variation;

        // This is the variation we want to update
        let updatedWarehouseStocks = [...(variation.warehouseStocks || [])];

        // Find if this warehouse already exists in the variation's stocks
        const existingStockIndex = updatedWarehouseStocks.findIndex(
          (stock) => stock.warehouseId === sanitizedWarehouseId,
        );

        if (existingStockIndex >= 0) {
          // Update existing warehouse stock
          updatedWarehouseStocks[existingStockIndex] = {
            ...updatedWarehouseStocks[existingStockIndex],
            quantity: validQuantity,
          };
          console.log(
            `[DEBUG] Updated existing warehouse stock for variation ${variationId}, warehouse ${sanitizedWarehouseId} to quantity: ${validQuantity}`,
          );
        } else {
          // Add new warehouse stock
          const warehouseName =
            warehouses.find((w) => w.id === sanitizedWarehouseId)?.name ||
            "Unknown Warehouse";
          updatedWarehouseStocks.push({
            warehouseId: sanitizedWarehouseId,
            warehouseName: warehouseName,
            quantity: validQuantity,
          });
          console.log(
            `[DEBUG] Added new warehouse stock for variation ${variationId}, warehouse ${sanitizedWarehouseId} with quantity: ${validQuantity}`,
          );
        }

        return {
          ...variation,
          warehouseStocks: updatedWarehouseStocks,
        };
      });

      // Log the updated variations for debugging
      const updatedVariation = updatedVariations.find(
        (v) => v.id === variationId,
      );
      if (updatedVariation) {
        console.log(
          `[DEBUG] After update, variation ${variationId} has ${updatedVariation.warehouseStocks?.length || 0} warehouse stocks:`,
          JSON.stringify(updatedVariation.warehouseStocks),
        );
      }

      return updatedVariations;
    });
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-blue-500">
        <TouchableOpacity onPress={onBack} className="p-2">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Product Details</Text>
        <View className="flex-row">
          <TouchableOpacity onPress={handleSave} className="p-2 mr-2">
            <Save size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} className="p-2">
            <Trash2 size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Product Image Placeholder */}
        <View className="h-48 bg-gray-200 rounded-lg mb-4 items-center justify-center">
          <Text className="text-gray-500">Product Image</Text>
        </View>

        {/* Basic Information */}
        <View className="mb-6 bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-blue-800">
            Basic Information
          </Text>

          <Text className="font-medium mb-1 text-gray-700">Product Name</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={editedProduct.name}
            onChangeText={(text) => handleInputChange("name", text)}
          />

          <Text className="font-medium mb-1 text-gray-700">SKU</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={editedProduct.sku}
            onChangeText={(text) => handleInputChange("sku", text)}
          />

          <Text className="font-medium mb-1 text-gray-700">Description</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={editedProduct.description}
            onChangeText={(text) => handleInputChange("description", text)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text className="font-medium mb-1 text-gray-700">Category</Text>
          <TouchableOpacity
            className="bg-white border border-gray-300 rounded-md p-2 mb-3 flex-row justify-between items-center"
            onPress={() => setCategoryManagerVisible(true)}
          >
            <Text>{editedProduct.category || "Select category"}</Text>
            <Text className="text-blue-500">Select</Text>
          </TouchableOpacity>
        </View>

        {/* Pricing Information */}
        <View className="mb-6 bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-blue-800">Pricing</Text>

          <Text className="font-medium mb-1 text-gray-700">
            Selling Price (Rp)
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={String(editedProduct.price || 0)}
            onChangeText={(text) =>
              handleInputChange("price", parseFloat(text) || 0)
            }
            keyboardType="numeric"
          />

          <Text className="font-medium mb-1 text-gray-700">
            Cost Price (Rp)
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={String(editedProduct.cost || 0)}
            onChangeText={(text) =>
              handleInputChange("cost", parseFloat(text) || 0)
            }
            keyboardType="numeric"
          />
        </View>

        {/* Inventory Information */}
        <View className="mb-6 bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-blue-800">
            Inventory
          </Text>

          <Text className="font-medium mb-1 text-gray-700">
            Total Stock (Sum of All Warehouses)
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3 text-blue-700 font-bold"
            value={manualStockInput || "0"}
            editable={false} // Make read-only since it's calculated from warehouse stocks
            keyboardType="numeric"
          />

          <Text className="font-medium mb-1 text-gray-700">
            Default Location
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={editedProduct.location}
            onChangeText={(text) => handleInputChange("location", text)}
          />

          {/* Product Variations Toggle */}
          <View className="flex-row justify-between items-center mt-4 mb-2">
            <Text className="font-medium text-gray-700">
              Product Variations
            </Text>
            <TouchableOpacity
              onPress={toggleVariationsFeature}
              className={`px-3 py-1 rounded-md ${hasVariations ? "bg-blue-500" : "bg-gray-300"}`}
            >
              <Text
                className={`${hasVariations ? "text-white" : "text-gray-700"}`}
              >
                {hasVariations ? "Enabled" : "Disabled"}
              </Text>
            </TouchableOpacity>
          </View>

          {hasVariations && (
            <TouchableOpacity
              onPress={() => setShowVariationsSection(!showVariationsSection)}
              className="flex-row justify-between items-center bg-gray-100 p-2 rounded-md mb-2"
            >
              <Text className="font-medium text-gray-700">
                Manage Variations
              </Text>
              {showVariationsSection ? (
                <ChevronUp size={20} color="#4B5563" />
              ) : (
                <ChevronDown size={20} color="#4B5563" />
              )}
            </TouchableOpacity>
          )}

          {/* Product Variations Management */}
          {hasVariations && showVariationsSection && (
            <View className="bg-white border border-gray-200 rounded-md p-3 mb-4">
              <Text className="font-medium mb-2 text-gray-700">
                Add New Variation
              </Text>

              <View className="mb-3">
                <Text className="text-sm text-gray-600 mb-1">
                  Variation Type (e.g., Size, Color)
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-md p-2"
                  value={newVariationType}
                  onChangeText={setNewVariationType}
                  placeholder="Enter variation type"
                />
              </View>

              <View className="mb-3">
                <Text className="text-sm text-gray-600 mb-1">
                  Variation Value (e.g., Large, Red)
                </Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-md p-2"
                  value={newVariationValue}
                  onChangeText={setNewVariationValue}
                  placeholder="Enter variation value"
                />
              </View>

              <TouchableOpacity
                onPress={handleAddVariation}
                className="bg-blue-500 py-2 px-4 rounded-md self-end"
              >
                <Text className="text-white font-medium">Add Variation</Text>
              </TouchableOpacity>

              {variations.length > 0 && (
                <View className="mt-4">
                  <Text className="font-medium mb-2 text-gray-700">
                    Existing Variations
                  </Text>

                  {variations.map((variation, index) => (
                    <View
                      key={variation.id}
                      className="bg-gray-50 p-3 rounded-md mb-2 border border-gray-200"
                    >
                      <View className="flex-row justify-between items-center mb-2">
                        <Text className="font-medium">
                          {variation.type}: {variation.value}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleRemoveVariation(variation.id)}
                        >
                          <Trash2 size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>

                      <View className="mb-2">
                        <Text className="text-sm text-gray-600 mb-1">SKU</Text>
                        <TextInput
                          className="bg-white border border-gray-300 rounded-md p-2"
                          value={variation.sku}
                          onChangeText={(text) =>
                            updateVariationField(variation.id, "sku", text)
                          }
                        />
                      </View>

                      <View className="flex-row mb-2">
                        <View className="flex-1 mr-2">
                          <Text className="text-sm text-gray-600 mb-1">
                            Price (Rp)
                          </Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-md p-2"
                            value={String(variation.price || 0)}
                            onChangeText={(text) =>
                              updateVariationField(
                                variation.id,
                                "price",
                                parseFloat(text) || 0,
                              )
                            }
                            keyboardType="numeric"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm text-gray-600 mb-1">
                            Cost (Rp)
                          </Text>
                          <TextInput
                            className="bg-white border border-gray-300 rounded-md p-2"
                            value={String(variation.cost || 0)}
                            onChangeText={(text) =>
                              updateVariationField(
                                variation.id,
                                "cost",
                                parseFloat(text) || 0,
                              )
                            }
                            keyboardType="numeric"
                          />
                        </View>
                      </View>

                      {/* Warehouse stocks for this variation */}
                      <View className="mt-2">
                        <TouchableOpacity
                          onPress={() => {
                            // Toggle visibility of warehouse stocks for this variation
                            const updatedVariations = variations.map((v) =>
                              v.id === variation.id
                                ? {
                                    ...v,
                                    showWarehouseStocks: !v.showWarehouseStocks,
                                  }
                                : v,
                            );
                            setVariations(updatedVariations);
                          }}
                          className="flex-row justify-between items-center bg-gray-100 p-2 rounded-md mb-2"
                        >
                          <Text className="font-medium text-gray-700">
                            Warehouse Stocks
                          </Text>
                          {variation.showWarehouseStocks ? (
                            <ChevronUp size={16} color="#4B5563" />
                          ) : (
                            <ChevronDown size={16} color="#4B5563" />
                          )}
                        </TouchableOpacity>

                        {variation.showWarehouseStocks && (
                          <View className="bg-white border border-gray-200 rounded-md p-2">
                            {isLoadingWarehouses ? (
                              <View className="items-center justify-center py-2">
                                <ActivityIndicator
                                  size="small"
                                  color="#3b82f6"
                                />
                                <Text className="text-gray-500 mt-1">
                                  Loading warehouses...
                                </Text>
                              </View>
                            ) : warehouses.length === 0 ? (
                              <Text className="text-yellow-600 text-sm">
                                No warehouses found
                              </Text>
                            ) : (
                              <View>
                                {warehouses.map((warehouse) => {
                                  // Find stock for this warehouse in this variation
                                  const stock = variation.warehouseStocks?.find(
                                    (s) => s.warehouseId === warehouse.id,
                                  ) || {
                                    warehouseId: warehouse.id,
                                    warehouseName: warehouse.name,
                                    quantity: 0,
                                  };

                                  return (
                                    <View
                                      key={warehouse.id}
                                      className="py-1 border-b border-gray-100"
                                    >
                                      <Text className="text-sm font-medium text-gray-700">
                                        {warehouse.name}
                                      </Text>
                                      <View className="flex-row items-center justify-between mt-1">
                                        <TouchableOpacity
                                          onPress={() => {
                                            // Update variation warehouse stock using the unified function
                                            updateWarehouseStock(
                                              warehouse.id,
                                              Math.max(
                                                0,
                                                (Number(stock.quantity) || 0) -
                                                  1,
                                              ),
                                              variation.id,
                                            );
                                          }}
                                          className="bg-red-100 p-1 rounded-full"
                                          disabled={stock.quantity <= 0}
                                        >
                                          <Minus
                                            size={14}
                                            color={
                                              stock.quantity <= 0
                                                ? "#9ca3af"
                                                : "#ef4444"
                                            }
                                          />
                                        </TouchableOpacity>

                                        <TextInput
                                          className="bg-gray-50 border border-gray-300 rounded-md px-2 py-1 mx-2 flex-1 text-center text-sm"
                                          value={String(stock.quantity || 0)}
                                          onChangeText={(text) => {
                                            if (
                                              text === "" ||
                                              /^\d+$/.test(text)
                                            ) {
                                              updateWarehouseStock(
                                                warehouse.id,
                                                text === ""
                                                  ? 0
                                                  : parseInt(text),
                                                variation.id,
                                              );
                                            }
                                          }}
                                          keyboardType="numeric"
                                        />

                                        <TouchableOpacity
                                          onPress={() => {
                                            // Update variation warehouse stock using the unified function
                                            updateWarehouseStock(
                                              warehouse.id,
                                              (Number(stock.quantity) || 0) + 1,
                                              variation.id,
                                            );
                                          }}
                                          className="bg-green-100 p-1 rounded-full"
                                        >
                                          <Plus size={14} color="#22c55e" />
                                        </TouchableOpacity>
                                      </View>
                                    </View>
                                  );
                                })}
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Warehouse Stock Management */}
          <View className="mt-4">
            <Text className="font-medium mb-2 text-gray-700">
              Warehouse Stock Levels {hasVariations ? "(Main Product)" : ""}
            </Text>

            {isLoadingWarehouses ? (
              <View className="items-center justify-center py-4">
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text className="text-gray-500 mt-2">
                  Loading warehouses...
                </Text>
              </View>
            ) : warehouses.length === 0 ? (
              <View className="bg-yellow-50 p-3 rounded-md">
                <Text className="text-yellow-700">
                  No warehouses found. Please add warehouses in the system
                  first.
                </Text>
              </View>
            ) : (
              <View className="bg-white border border-gray-300 rounded-md p-2">
                {warehouseStocks.map((stock, index) => (
                  <View
                    key={stock.warehouseId}
                    className={`py-2 ${index !== warehouseStocks.length - 1 ? "border-b border-gray-200" : ""}`}
                  >
                    <Text className="font-medium text-gray-700">
                      {stock.warehouseName}
                    </Text>
                    <View className="flex-row items-center justify-between mt-1">
                      <TouchableOpacity
                        onPress={() =>
                          updateWarehouseStock(
                            stock.warehouseId,
                            Math.max(0, (Number(stock.quantity) || 0) - 1),
                            // No variation ID for main product
                          )
                        }
                        className="bg-red-100 p-2 rounded-full"
                        disabled={stock.quantity <= 0}
                      >
                        <Minus
                          size={16}
                          color={stock.quantity <= 0 ? "#9ca3af" : "#ef4444"}
                        />
                      </TouchableOpacity>

                      <TextInput
                        className="bg-gray-50 border border-gray-300 rounded-md px-3 py-1 mx-2 flex-1 text-center"
                        value={String(stock.quantity || 0)}
                        onChangeText={(text) => {
                          if (text === "" || /^\d+$/.test(text)) {
                            updateWarehouseStock(
                              stock.warehouseId,
                              text === "" ? 0 : parseInt(text),
                              // No variation ID for main product
                            );
                          }
                        }}
                        keyboardType="numeric"
                        // Remove defaultValue to fix controlled/uncontrolled component warning
                      />

                      <TouchableOpacity
                        onPress={() =>
                          updateWarehouseStock(
                            stock.warehouseId,
                            (Number(stock.quantity) || 0) + 1,
                            // No variation ID for main product
                          )
                        }
                        className="bg-green-100 p-2 rounded-full"
                      >
                        <Plus size={16} color="#22c55e" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Text className="text-sm text-gray-500 mt-2 font-semibold">
              Total stock across all warehouses:{" "}
              {warehouseStocks.reduce(
                (sum, stock) => sum + (Number(stock.quantity) || 0),
                0,
              )}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between mb-8">
          <TouchableOpacity
            onPress={handleSave}
            className="bg-blue-500 py-3 px-6 rounded-lg flex-1 mr-2 items-center"
          >
            <Text className="text-white font-bold">Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            className="bg-red-500 py-3 px-6 rounded-lg flex-1 ml-2 items-center"
          >
            <Text className="text-white font-bold">Delete Product</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Category Manager Modal */}
      <CategoryManager
        visible={categoryManagerVisible}
        onClose={() => setCategoryManagerVisible(false)}
        onCategorySelected={(category) => {
          handleInputChange("category", category);
          setCategoryManagerVisible(false);
        }}
      />
    </View>
  );
};

export default ProductDetail;

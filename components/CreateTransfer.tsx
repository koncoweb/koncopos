import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { ChevronDown, Plus, Minus, Check, X, Truck } from "lucide-react-native";
import firebaseService from "../services/firebaseService";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";
import { useInventoryData } from "../hooks/useInventoryData";
import LocationChooser from "./LocationChooser";

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  selectedQuantity: number;
  price?: number;
  category?: string;
  description?: string;
  warehouseStocks?: {
    warehouseId: string;
    warehouseName: string;
    quantity: number;
  }[];
}

interface Location {
  id: string;
  name: string;
  type?: string;
}

interface CreateTransferProps {
  onTransferCreated?: () => void;
  onCancel?: () => void;
}

const CreateTransfer = ({
  onTransferCreated = () => {},
  onCancel = () => {},
}: CreateTransferProps) => {
  const { isConfigured } = useFirebaseConfig();
  const { updateStockForTransfer } = useInventoryData();
  const [sourceLocation, setSourceLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] =
    useState<Location | null>(null);
  const [showSourceChooser, setShowSourceChooser] = useState(false);
  const [showDestinationChooser, setShowDestinationChooser] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [transferNotes, setTransferNotes] = useState("");
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Load locations and products from database
  useEffect(() => {
    loadLocations();
  }, [isConfigured]);

  // Load products when source location changes
  useEffect(() => {
    if (sourceLocation && isConfigured) {
      // Add a small delay to prevent rapid successive calls
      const timeoutId = setTimeout(() => {
        loadProducts();
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [sourceLocation?.id, isConfigured]);

  const loadLocations = async () => {
    if (!isConfigured || !firebaseService.isInitialized()) {
      return;
    }

    setIsLoadingLocations(true);
    try {
      const [warehousesData, storesData] = await Promise.all([
        firebaseService.getCollection("warehouses"),
        firebaseService.getCollection("stores"),
      ]);

      // Combine warehouses and stores into a single locations array
      const allLocations: Location[] = [
        ...warehousesData.map((warehouse: any) => ({
          id: warehouse.id,
          name: warehouse.name,
          type: "warehouse",
        })),
        ...storesData.map((store: any) => ({
          id: store.id,
          name: store.name,
          type: "store",
        })),
      ];

      setLocations(allLocations);

      // Set default selections if none are set
      if (!sourceLocation && allLocations.length > 0) {
        setSourceLocation(allLocations[0]);
      }
      if (!destinationLocation && allLocations.length > 1) {
        setDestinationLocation(allLocations[1]);
      }
    } catch (error) {
      console.error("Error loading locations:", error);
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const loadProducts = async () => {
    if (!isConfigured || !firebaseService.isInitialized() || !sourceLocation) {
      setAvailableProducts([]);
      return;
    }

    // Prevent multiple simultaneous calls
    if (isLoadingProducts) {
      return;
    }

    setIsLoadingProducts(true);
    try {
      const productsData = await firebaseService.getCollection("products");

      // Transform products data and filter by source location availability
      const products: Product[] = productsData
        .map((product: any) => {
          // Get warehouse stocks from the product document
          const warehouseStocks = [];
          let locationStock = 0;

          // Check if product has embedded warehouseStocks
          if (
            product.warehouseStocks &&
            typeof product.warehouseStocks === "object"
          ) {
            // Convert warehouseStocks object to array format
            Object.entries(product.warehouseStocks).forEach(
              ([warehouseId, quantity]: [string, any]) => {
                const stockQuantity = Number(quantity) || 0;
                warehouseStocks.push({
                  warehouseId: warehouseId,
                  warehouseName: warehouseId, // Will be updated with actual name if available
                  quantity: stockQuantity,
                });

                // Check if this warehouse matches our source location
                const sanitizedSourceId = sourceLocation.id
                  .replace(/\s+/g, "_")
                  .toLowerCase();
                if (warehouseId === sanitizedSourceId) {
                  locationStock = stockQuantity;
                }
              },
            );
          }

          return {
            id: product.id,
            name: product.name || "Unnamed Product",
            sku: product.sku || product.id,
            currentStock: locationStock, // Use stock from selected location
            selectedQuantity: 0,
            price: product.price,
            category: product.category,
            description: product.description,
            warehouseStocks: warehouseStocks,
          };
        })
        .filter((product: Product) => product.currentStock > 0); // Only show products with stock at source location

      setAvailableProducts(products);
      console.log(
        `Loaded ${products.length} products available at ${sourceLocation.name}`,
      );
    } catch (error) {
      console.error("Error loading products:", error);
      // Fallback to empty array if there's an error
      setAvailableProducts([]);
    } finally {
      // Add a small delay before allowing next call
      setTimeout(() => {
        setIsLoadingProducts(false);
      }, 50);
    }
  };

  const filteredProducts = availableProducts.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const addProduct = (product: Product) => {
    if (!selectedProducts.some((p) => p.id === product.id)) {
      setSelectedProducts([
        ...selectedProducts,
        { ...product, selectedQuantity: 1 },
      ]);
    }
  };

  const removeProduct = (productId: string) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setSelectedProducts(
      selectedProducts.map((product) =>
        product.id === productId
          ? {
              ...product,
              selectedQuantity: Math.max(
                1,
                Math.min(quantity, product.currentStock),
              ),
            }
          : product,
      ),
    );
  };

  const handleCreateTransfer = async () => {
    if (!isConfigured || !firebaseService.isInitialized()) {
      console.error("Firebase not configured or initialized");
      return;
    }

    if (!sourceLocation || !destinationLocation) {
      console.error("Source or destination location not selected");
      return;
    }

    try {
      // Prepare transfer data
      const transferData = {
        sourceLocationId: sourceLocation.id,
        sourceLocationName: sourceLocation.name,
        sourceLocationType: sourceLocation.type,
        destinationLocationId: destinationLocation.id,
        destinationLocationName: destinationLocation.name,
        destinationLocationType: destinationLocation.type,
        products: selectedProducts.map((product) => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          quantity: product.selectedQuantity,
          price: product.price || 0,
          category: product.category || "",
        })),
        notes: transferNotes,
        status: "completed", // Mark as completed since we're updating stock immediately
        createdAt: new Date().toISOString(),
        createdBy: firebaseService.getCurrentUser()?.uid || "unknown",
        totalItems: selectedProducts.reduce(
          (sum, product) => sum + product.selectedQuantity,
          0,
        ),
      };

      console.log("Creating transfer:", transferData);

      // Save transfer to database
      const savedTransfer = await firebaseService.addDocument(
        "transfers",
        transferData,
      );
      console.log("Transfer saved successfully:", savedTransfer);

      // Update stock levels for all products in the transfer
      const transferProducts = selectedProducts.map((product) => ({
        id: product.id,
        quantity: product.selectedQuantity,
      }));

      console.log("Updating stock levels for transfer...");
      const stockUpdateSuccess = await updateStockForTransfer(
        transferProducts,
        sourceLocation.id,
        destinationLocation.id,
      );

      if (stockUpdateSuccess) {
        console.log("Stock levels updated successfully");
      } else {
        console.error("Failed to update stock levels");
        // You might want to show a warning to the user here
      }

      onTransferCreated();
    } catch (error) {
      console.error("Error creating transfer:", error);
      // You might want to show an error message to the user here
    }
  };

  const isFormValid = () => {
    return (
      sourceLocation &&
      destinationLocation &&
      sourceLocation.id !== destinationLocation.id &&
      selectedProducts.length > 0 &&
      selectedProducts.every((p) => p.selectedQuantity > 0)
    );
  };

  return (
    <View className="flex-1 bg-white">
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold mb-6">
          Create Inventory Transfer
        </Text>

        {/* Source Location */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-1">Source Location</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between p-3 border border-gray-300 rounded-md bg-white"
            onPress={() => setShowSourceChooser(true)}
            disabled={isLoadingLocations}
          >
            {isLoadingLocations ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#666" />
                <Text className="ml-2 text-gray-500">Loading locations...</Text>
              </View>
            ) : (
              <Text
                className={sourceLocation ? "text-gray-900" : "text-gray-500"}
              >
                {sourceLocation?.name || "Select source location"}
              </Text>
            )}
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Destination Location */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-1">Destination Location</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between p-3 border border-gray-300 rounded-md bg-white"
            onPress={() => setShowDestinationChooser(true)}
            disabled={isLoadingLocations}
          >
            {isLoadingLocations ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#666" />
                <Text className="ml-2 text-gray-500">Loading locations...</Text>
              </View>
            ) : (
              <Text
                className={
                  destinationLocation ? "text-gray-900" : "text-gray-500"
                }
              >
                {destinationLocation?.name || "Select destination location"}
              </Text>
            )}
            <ChevronDown size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Selected Products */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-1">Selected Products</Text>
          {selectedProducts.length === 0 ? (
            <View className="p-4 border border-gray-200 rounded-md bg-gray-50">
              <Text className="text-gray-500 text-center">
                No products selected
              </Text>
            </View>
          ) : (
            <View className="border border-gray-200 rounded-md overflow-hidden">
              {selectedProducts.map((product) => (
                <View
                  key={product.id}
                  className="p-3 border-b border-gray-200 bg-white"
                >
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="font-medium">{product.name}</Text>
                    <TouchableOpacity onPress={() => removeProduct(product.id)}>
                      <X size={18} color="#f43f5e" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-gray-500 text-sm mb-2">
                    SKU: {product.sku}
                  </Text>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-500 text-sm">
                      Available: {product.currentStock}
                    </Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
                        onPress={() =>
                          updateQuantity(
                            product.id,
                            product.selectedQuantity - 1,
                          )
                        }
                      >
                        <Minus size={16} color="#666" />
                      </TouchableOpacity>
                      <TextInput
                        className="mx-2 w-12 text-center border border-gray-300 rounded-md p-1"
                        value={product.selectedQuantity.toString()}
                        keyboardType="number-pad"
                        onChangeText={(text) => {
                          const quantity = parseInt(text) || 0;
                          updateQuantity(product.id, quantity);
                        }}
                      />
                      <TouchableOpacity
                        className="w-8 h-8 bg-gray-200 rounded-full items-center justify-center"
                        onPress={() =>
                          updateQuantity(
                            product.id,
                            product.selectedQuantity + 1,
                          )
                        }
                      >
                        <Plus size={16} color="#666" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Add Products */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-1">Add Products</Text>
          <TextInput
            className="p-3 border border-gray-300 rounded-md mb-3 bg-white"
            placeholder="Search by name or SKU"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <View className="border border-gray-200 rounded-md overflow-hidden max-h-60">
            <ScrollView nestedScrollEnabled>
              {isLoadingProducts ? (
                <View className="p-4 bg-gray-50 flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="#666" />
                  <Text className="ml-2 text-gray-500">
                    Loading products...
                  </Text>
                </View>
              ) : filteredProducts.length === 0 ? (
                <View className="p-4 bg-gray-50">
                  <Text className="text-gray-500 text-center">
                    {availableProducts.length === 0
                      ? sourceLocation
                        ? `No products available at ${sourceLocation.name}`
                        : "Select a source location to view available products"
                      : "No products found"}
                  </Text>
                </View>
              ) : (
                filteredProducts.map((product) => (
                  <TouchableOpacity
                    key={product.id}
                    className="p-3 border-b border-gray-200 bg-white flex-row justify-between items-center"
                    onPress={() => addProduct(product)}
                    disabled={selectedProducts.some((p) => p.id === product.id)}
                  >
                    <View className="flex-1">
                      <Text className="font-medium">{product.name}</Text>
                      <Text className="text-gray-500 text-sm">
                        SKU: {product.sku}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        Available at {sourceLocation?.name}:{" "}
                        {product.currentStock}
                      </Text>
                      {product.category && (
                        <Text className="text-gray-400 text-xs">
                          Category: {product.category}
                        </Text>
                      )}
                    </View>
                    {selectedProducts.some((p) => p.id === product.id) ? (
                      <Check size={20} color="#10b981" />
                    ) : (
                      <Plus size={20} color="#666" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>

        {/* Transfer Notes */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-1">
            Transfer Notes (Optional)
          </Text>
          <TextInput
            className="p-3 border border-gray-300 rounded-md bg-white"
            placeholder="Add any notes about this transfer"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={transferNotes}
            onChangeText={setTransferNotes}
          />
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View className="p-4 border-t border-gray-200 bg-white">
        <View className="flex-row justify-between">
          <TouchableOpacity
            className="flex-1 mr-2 p-3 border border-gray-300 rounded-md items-center"
            onPress={onCancel}
          >
            <Text className="font-medium">Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 ml-2 p-3 rounded-md items-center flex-row justify-center ${isFormValid() ? "bg-blue-500" : "bg-gray-300"}`}
            onPress={handleCreateTransfer}
            disabled={!isFormValid()}
          >
            <Truck size={18} color={isFormValid() ? "#fff" : "#666"} />
            <Text
              className={`font-medium ml-2 ${isFormValid() ? "text-white" : "text-gray-500"}`}
            >
              Create Transfer
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Location Chooser Modals */}
      <LocationChooser
        visible={showSourceChooser}
        onClose={() => setShowSourceChooser(false)}
        onLocationSelected={(location) => {
          setSourceLocation(location);
          // Clear destination if it's the same as source
          if (destinationLocation?.id === location.id) {
            setDestinationLocation(null);
          }
        }}
        locations={locations}
        title="Select Source Location"
      />

      <LocationChooser
        visible={showDestinationChooser}
        onClose={() => setShowDestinationChooser(false)}
        onLocationSelected={setDestinationLocation}
        locations={locations}
        title="Select Destination Location"
        excludeLocationId={sourceLocation?.id}
      />
    </View>
  );
};

export default CreateTransfer;

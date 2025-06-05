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

interface Product {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  selectedQuantity: number;
  price?: number;
  category?: string;
  description?: string;
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
  const [sourceLocation, setSourceLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] =
    useState<Location | null>(null);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
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
    loadProducts();
  }, [isConfigured]);

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
    if (!isConfigured || !firebaseService.isInitialized()) {
      return;
    }

    setIsLoadingProducts(true);
    try {
      const productsData = await firebaseService.getCollection("products");

      // Transform products data to match our interface
      const products: Product[] = productsData.map((product: any) => ({
        id: product.id,
        name: product.name || "Unnamed Product",
        sku: product.sku || product.id,
        currentStock: product.stock || product.quantity || 0,
        selectedQuantity: 0,
        price: product.price,
        category: product.category,
        description: product.description,
      }));

      setAvailableProducts(products);
      console.log(`Loaded ${products.length} products from database`);
    } catch (error) {
      console.error("Error loading products:", error);
      // Fallback to empty array if there's an error
      setAvailableProducts([]);
    } finally {
      setIsLoadingProducts(false);
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

  const handleCreateTransfer = () => {
    // In a real app, this would send the transfer data to an API
    console.log("Creating transfer:", {
      sourceLocation,
      destinationLocation,
      products: selectedProducts,
      notes: transferNotes,
    });

    onTransferCreated();
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
          <View className="relative">
            <TouchableOpacity
              className="flex-row items-center justify-between p-3 border border-gray-300 rounded-md bg-white"
              onPress={() => setShowSourceDropdown(!showSourceDropdown)}
              disabled={isLoadingLocations}
            >
              {isLoadingLocations ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#666" />
                  <Text className="ml-2 text-gray-500">
                    Loading locations...
                  </Text>
                </View>
              ) : (
                <Text>{sourceLocation?.name || "Select source location"}</Text>
              )}
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>

            {showSourceDropdown && !isLoadingLocations && (
              <View
                className="absolute top-14 left-0 right-0 bg-white border border-gray-300 rounded-md z-50 shadow-lg max-h-48"
                style={{ backgroundColor: "#ffffff", elevation: 10 }}
              >
                <ScrollView nestedScrollEnabled>
                  {locations.map((location) => (
                    <TouchableOpacity
                      key={location.id}
                      className="p-3 border-b border-gray-200 bg-white"
                      style={{ backgroundColor: "#ffffff" }}
                      onPress={() => {
                        setSourceLocation(location);
                        setShowSourceDropdown(false);
                      }}
                    >
                      <Text className="font-medium text-gray-900">
                        {location.name}
                      </Text>
                      {location.type && (
                        <Text className="text-xs text-gray-600 capitalize">
                          {location.type}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Destination Location */}
        <View className="mb-6">
          <Text className="text-sm font-medium mb-1">Destination Location</Text>
          <View className="relative">
            <TouchableOpacity
              className="flex-row items-center justify-between p-3 border border-gray-300 rounded-md bg-white"
              onPress={() =>
                setShowDestinationDropdown(!showDestinationDropdown)
              }
              disabled={isLoadingLocations}
            >
              {isLoadingLocations ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#666" />
                  <Text className="ml-2 text-gray-500">
                    Loading locations...
                  </Text>
                </View>
              ) : (
                <Text>
                  {destinationLocation?.name || "Select destination location"}
                </Text>
              )}
              <ChevronDown size={20} color="#666" />
            </TouchableOpacity>

            {showDestinationDropdown && !isLoadingLocations && (
              <View
                className="absolute top-14 left-0 right-0 bg-white border border-gray-300 rounded-md z-50 shadow-lg max-h-48"
                style={{ backgroundColor: "#ffffff", elevation: 10 }}
              >
                <ScrollView nestedScrollEnabled>
                  {locations
                    .filter((location) => location.id !== sourceLocation?.id)
                    .map((location) => (
                      <TouchableOpacity
                        key={location.id}
                        className="p-3 border-b border-gray-200 bg-white"
                        style={{ backgroundColor: "#ffffff" }}
                        onPress={() => {
                          setDestinationLocation(location);
                          setShowDestinationDropdown(false);
                        }}
                      >
                        <Text className="font-medium text-gray-900">
                          {location.name}
                        </Text>
                        {location.type && (
                          <Text className="text-xs text-gray-600 capitalize">
                            {location.type}
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
            )}
          </View>
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
                      ? "No products available in database"
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
                        Available: {product.currentStock}
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
    </View>
  );
};

export default CreateTransfer;

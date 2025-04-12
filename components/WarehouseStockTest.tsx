import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { ArrowLeft, Save, Plus } from "lucide-react-native";
import firebaseService from "../services/firebaseService";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";

interface WarehouseStock {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
}

interface TestProduct {
  id: string;
  name: string;
  warehouseStocks: WarehouseStock[];
}

const WarehouseStockTest = ({ onBack = () => {} }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [testProduct, setTestProduct] = useState<TestProduct>({
    id: `test_product_${Date.now()}`,
    name: "Test Product",
    warehouseStocks: [],
  });
  const [newWarehouseName, setNewWarehouseName] = useState("");
  const [testResults, setTestResults] = useState<string[]>([]);
  const { isConfigured } = useFirebaseConfig();

  // Load warehouses from Firebase
  useEffect(() => {
    const loadWarehouses = async () => {
      if (isConfigured && firebaseService.isInitialized()) {
        setIsLoading(true);
        try {
          const warehousesData = await firebaseService.getWarehouses();
          setWarehouses(warehousesData);

          // Initialize warehouse stocks
          if (warehousesData.length > 0) {
            const initialStocks = warehousesData.map((warehouse) => ({
              warehouseId: warehouse.id,
              warehouseName: warehouse.name,
              quantity: 0,
            }));
            setTestProduct((prev) => ({
              ...prev,
              warehouseStocks: initialStocks,
            }));
          }

          addTestResult(`Loaded ${warehousesData.length} warehouses`);
        } catch (error) {
          console.error("Error loading warehouses:", error);
          addTestResult(`Error loading warehouses: ${error.message}`);
        } finally {
          setIsLoading(false);
        }
      } else {
        addTestResult("Firebase not configured or initialized");
      }
    };

    loadWarehouses();
  }, [isConfigured]);

  const addTestResult = (message: string) => {
    setTestResults((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev,
    ]);
  };

  const createWarehouse = async () => {
    if (!newWarehouseName.trim()) {
      Alert.alert("Error", "Please enter a warehouse name");
      return;
    }

    setIsLoading(true);
    try {
      // Create a sanitized ID from the name
      const sanitizedId = newWarehouseName
        .trim()
        .replace(/\s+/g, "_")
        .toLowerCase();

      const newWarehouse = await firebaseService.addDocument(
        "warehouses",
        {
          name: newWarehouseName.trim(),
          address: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        sanitizedId,
      );

      addTestResult(
        `Created new warehouse: ${newWarehouseName} (ID: ${sanitizedId})`,
      );

      // Add to local state
      const updatedWarehouses = [
        ...warehouses,
        {
          id: sanitizedId,
          name: newWarehouseName.trim(),
        },
      ];
      setWarehouses(updatedWarehouses);

      // Add to test product warehouse stocks
      setTestProduct((prev) => ({
        ...prev,
        warehouseStocks: [
          ...prev.warehouseStocks,
          {
            warehouseId: sanitizedId,
            warehouseName: newWarehouseName.trim(),
            quantity: 0,
          },
        ],
      }));

      setNewWarehouseName("");
    } catch (error) {
      console.error("Error creating warehouse:", error);
      addTestResult(`Error creating warehouse: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const updateWarehouseStock = (warehouseId: string, quantity: number) => {
    // Ensure quantity is a valid number
    const validQuantity = isNaN(Number(quantity)) ? 0 : Number(quantity);

    // Update the warehouse stock
    setTestProduct((prev) => {
      const updatedStocks = prev.warehouseStocks.map((stock) => {
        if (stock.warehouseId === warehouseId) {
          return { ...stock, quantity: validQuantity };
        }
        return stock;
      });

      return {
        ...prev,
        warehouseStocks: updatedStocks,
      };
    });
  };

  const saveTestProduct = async () => {
    setIsLoading(true);
    try {
      addTestResult(
        `Saving test product with ${testProduct.warehouseStocks.length} warehouse stocks...`,
      );

      // First save the product
      await firebaseService.addDocument(
        "products",
        {
          name: testProduct.name,
          sku: `TEST-${Date.now()}`,
          description: "Test product for warehouse stock testing",
          price: 10,
          cost: 5,
          category: "Test",
          defaultWarehouse: "",
          totalStock: testProduct.warehouseStocks.reduce(
            (sum, stock) => sum + (Number(stock.quantity) || 0),
            0,
          ),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        testProduct.id,
      );

      addTestResult(`Saved test product with ID: ${testProduct.id}`);

      // Then save each warehouse stock
      for (const stock of testProduct.warehouseStocks) {
        if (stock.quantity > 0) {
          // Only save stocks with quantity > 0
          // Sanitize warehouse ID
          const sanitizedWarehouseId = stock.warehouseId
            .replace(/\s+/g, "_")
            .toLowerCase();

          const warehouseStockId = `${testProduct.id}_${sanitizedWarehouseId}`;

          await firebaseService.addDocument(
            "warehouseStocks",
            {
              productId: testProduct.id,
              warehouseId: stock.warehouseId,
              warehouseName: stock.warehouseName,
              quantity: stock.quantity,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            warehouseStockId,
          );

          addTestResult(
            `Saved stock for warehouse ${stock.warehouseName}: ${stock.quantity} units`,
          );
        }
      }

      Alert.alert(
        "Success",
        "Test product and warehouse stocks saved successfully",
      );
    } catch (error) {
      console.error("Error saving test product:", error);
      addTestResult(`Error saving test product: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyWarehouseStocks = async () => {
    setIsLoading(true);
    try {
      addTestResult(
        `Verifying warehouse stocks for product ${testProduct.id}...`,
      );

      const productStocks = await firebaseService.getWarehouseStocksForProduct(
        testProduct.id,
      );

      addTestResult(
        `Retrieved ${productStocks.length} warehouse stocks from Firebase`,
      );

      if (productStocks.length > 0) {
        productStocks.forEach((stock) => {
          addTestResult(
            `Verified stock: Warehouse ${stock.warehouseName || stock.warehouseId}: ${stock.quantity} units`,
          );
        });
      } else {
        addTestResult("No warehouse stocks found for this product");
      }
    } catch (error) {
      console.error("Error verifying warehouse stocks:", error);
      addTestResult(`Error verifying warehouse stocks: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-blue-500">
        <TouchableOpacity onPress={onBack} className="p-2">
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">
          Warehouse Stock Test
        </Text>
        <TouchableOpacity onPress={saveTestProduct} className="p-2">
          <Save size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4">
        {isLoading && (
          <View className="items-center justify-center py-4">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className="text-gray-500 mt-2">Processing...</Text>
          </View>
        )}

        {/* Add New Warehouse */}
        <View className="mb-6 bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-blue-800">
            Add New Warehouse
          </Text>

          <View className="flex-row items-center">
            <TextInput
              className="bg-white border border-gray-300 rounded-md p-2 flex-1 mr-2"
              value={newWarehouseName}
              onChangeText={setNewWarehouseName}
              placeholder="Enter warehouse name"
            />
            <TouchableOpacity
              onPress={createWarehouse}
              className="bg-blue-500 p-2 rounded-md"
              disabled={isLoading}
            >
              <Plus size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Warehouse Stock Management */}
        <View className="mb-6 bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-blue-800">
            Test Warehouse Stocks
          </Text>

          <Text className="font-medium mb-2 text-gray-700">
            Product ID: {testProduct.id}
          </Text>

          {warehouses.length === 0 ? (
            <View className="bg-yellow-50 p-3 rounded-md">
              <Text className="text-yellow-700">
                No warehouses found. Please add warehouses first.
              </Text>
            </View>
          ) : (
            <View className="bg-white border border-gray-300 rounded-md p-2">
              {testProduct.warehouseStocks.map((stock, index) => (
                <View
                  key={stock.warehouseId}
                  className={`py-2 ${index !== testProduct.warehouseStocks.length - 1 ? "border-b border-gray-200" : ""}`}
                >
                  <Text className="font-medium text-gray-700">
                    {stock.warehouseName} (ID: {stock.warehouseId})
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <TextInput
                      className="bg-gray-50 border border-gray-300 rounded-md px-3 py-1 flex-1 text-center"
                      value={String(stock.quantity || 0)}
                      onChangeText={(text) => {
                        if (text === "" || /^\d+$/.test(text)) {
                          updateWarehouseStock(
                            stock.warehouseId,
                            text === "" ? 0 : parseInt(text),
                          );
                        }
                      }}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          <Text className="text-sm text-gray-500 mt-2 font-semibold">
            Total stock across all warehouses:{" "}
            {testProduct.warehouseStocks.reduce(
              (sum, stock) => sum + (Number(stock.quantity) || 0),
              0,
            )}
          </Text>

          <View className="flex-row mt-4">
            <TouchableOpacity
              onPress={saveTestProduct}
              className="bg-blue-500 py-3 px-6 rounded-lg flex-1 mr-2 items-center"
              disabled={isLoading}
            >
              <Text className="text-white font-bold">Save Test Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={verifyWarehouseStocks}
              className="bg-green-500 py-3 px-6 rounded-lg flex-1 ml-2 items-center"
              disabled={isLoading}
            >
              <Text className="text-white font-bold">Verify Stocks</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Results */}
        <View className="mb-6 bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-blue-800">
            Test Results
          </Text>

          <ScrollView
            className="bg-black rounded-md p-3"
            style={{ maxHeight: 300 }}
          >
            {testResults.length === 0 ? (
              <Text className="text-green-400">No test results yet</Text>
            ) : (
              testResults.map((result, index) => (
                <Text key={index} className="text-green-400 mb-1">
                  {result}
                </Text>
              ))
            )}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
};

export default WarehouseStockTest;

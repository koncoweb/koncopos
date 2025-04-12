import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import firebaseService from "../services/firebaseService";

interface WarehouseStockDebuggerProps {
  productId: string;
}

const WarehouseStockDebugger = ({ productId }: WarehouseStockDebuggerProps) => {
  const [productData, setProductData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log(`[DEBUG] Fetching product data for ID: ${productId}`);
      const data = await firebaseService.getDocument("products", productId);
      setProductData(data);
      console.log(`[DEBUG] Retrieved product data:`, JSON.stringify(data));
    } catch (err) {
      console.error(`[DEBUG] Error fetching product:`, err);
      setError(`Error fetching product: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductData();
    }
  }, [productId]);

  if (!productId) {
    return (
      <View className="p-4 bg-yellow-100 rounded-md">
        <Text className="text-yellow-800">
          No product ID provided for debugging
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="p-4 bg-gray-100 rounded-md">
        <Text className="text-gray-600">Loading product data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="p-4 bg-red-100 rounded-md">
        <Text className="text-red-800">{error}</Text>
        <TouchableOpacity
          className="mt-2 bg-blue-500 p-2 rounded-md"
          onPress={fetchProductData}
        >
          <Text className="text-white text-center">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!productData) {
    return (
      <View className="p-4 bg-yellow-100 rounded-md">
        <Text className="text-yellow-800">No product data found</Text>
        <TouchableOpacity
          className="mt-2 bg-blue-500 p-2 rounded-md"
          onPress={fetchProductData}
        >
          <Text className="text-white text-center">Refresh</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="p-4 bg-white rounded-md border border-gray-200">
      <Text className="text-lg font-bold mb-2">Product Data Debugger</Text>
      <Text className="text-sm text-gray-500 mb-4">ID: {productId}</Text>

      <View className="mb-4">
        <Text className="font-bold mb-1">Basic Info:</Text>
        <Text>Name: {productData.name}</Text>
        <Text>SKU: {productData.sku}</Text>
        <Text>Total Stock: {productData.totalStock}</Text>
      </View>

      <View className="mb-4">
        <Text className="font-bold mb-1">Warehouse Stocks:</Text>
        {productData.warehouseStocks &&
        Object.keys(productData.warehouseStocks).length > 0 ? (
          Object.entries(productData.warehouseStocks).map(
            ([warehouseId, quantity]) => (
              <View
                key={warehouseId}
                className="flex-row justify-between border-b border-gray-100 py-1"
              >
                <Text>{warehouseId}</Text>
                <Text>{quantity}</Text>
              </View>
            ),
          )
        ) : (
          <Text className="text-red-500">No warehouse stocks found!</Text>
        )}
      </View>

      <TouchableOpacity
        className="mt-2 bg-blue-500 p-2 rounded-md"
        onPress={fetchProductData}
      >
        <Text className="text-white text-center">Refresh Data</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default WarehouseStockDebugger;

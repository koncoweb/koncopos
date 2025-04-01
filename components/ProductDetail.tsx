import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ArrowLeft, Save, Trash2, Plus, Minus } from "lucide-react-native";

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
  },
  onSave = () => {},
  onDelete = () => {},
  onBack = () => {},
}: ProductDetailProps) => {
  const [editedProduct, setEditedProduct] = useState(product);
  const [stockAdjustment, setStockAdjustment] = useState(0);

  const handleInputChange = (field: string, value: string | number) => {
    setEditedProduct({
      ...editedProduct,
      [field]: value,
    });
  };

  const handleSave = () => {
    // Apply stock adjustment if any
    if (stockAdjustment !== 0) {
      const updatedProduct = {
        ...editedProduct,
        currentStock: editedProduct.currentStock + stockAdjustment,
      };
      onSave(updatedProduct);
      Alert.alert("Success", "Product updated successfully");
    } else {
      onSave(editedProduct);
      Alert.alert("Success", "Product updated successfully");
    }
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
    setStockAdjustment(stockAdjustment + amount);
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
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={editedProduct.category}
            onChangeText={(text) => handleInputChange("category", text)}
          />
        </View>

        {/* Pricing Information */}
        <View className="mb-6 bg-gray-50 p-4 rounded-lg">
          <Text className="text-lg font-bold mb-4 text-blue-800">Pricing</Text>

          <Text className="font-medium mb-1 text-gray-700">
            Selling Price ($)
          </Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={String(editedProduct.price || 0)}
            onChangeText={(text) =>
              handleInputChange("price", parseFloat(text) || 0)
            }
            keyboardType="numeric"
          />

          <Text className="font-medium mb-1 text-gray-700">Cost Price ($)</Text>
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

          <Text className="font-medium mb-1 text-gray-700">Current Stock</Text>
          <View className="bg-white border border-gray-300 rounded-md p-2 mb-3">
            <Text className="text-lg">{editedProduct.currentStock}</Text>
          </View>

          <Text className="font-medium mb-1 text-gray-700">Location</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={editedProduct.location}
            onChangeText={(text) => handleInputChange("location", text)}
          />

          {/* Stock Adjustment */}
          <View className="mt-4">
            <Text className="font-medium mb-2 text-gray-700">Adjust Stock</Text>
            <View className="flex-row items-center justify-between bg-white border border-gray-300 rounded-md p-2">
              <TouchableOpacity
                onPress={() => adjustStock(-1)}
                className="bg-red-100 p-2 rounded-full"
              >
                <Minus size={20} color="#ef4444" />
              </TouchableOpacity>

              <View className="flex-row items-center">
                <Text className="text-lg font-bold">
                  {stockAdjustment > 0 ? "+" : ""}
                  {stockAdjustment}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => adjustStock(1)}
                className="bg-green-100 p-2 rounded-full"
              >
                <Plus size={20} color="#22c55e" />
              </TouchableOpacity>
            </View>

            <Text className="text-sm text-gray-500 mt-2">
              New stock level after adjustment:{" "}
              {editedProduct.currentStock + stockAdjustment}
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
    </View>
  );
};

export default ProductDetail;

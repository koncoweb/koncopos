import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { ArrowLeft, Save, Trash2, Plus, Minus } from "lucide-react-native";
import CategoryManager from "./CategoryManager";
import { getData, STORAGE_KEYS } from "../services/storage";

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
  const [manualStockInput, setManualStockInput] = useState(
    String(product.currentStock),
  );
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);

  // Update manual stock input when product changes
  useEffect(() => {
    // Ensure we're working with valid numbers
    const currentStock = isNaN(Number(product.currentStock))
      ? 0
      : Number(product.currentStock);

    console.log(
      `ProductDetail: Loading product ${product.id} with stock ${currentStock}`,
    );

    setManualStockInput(String(currentStock));
    setEditedProduct(product); // Set the entire product object to ensure all fields are updated
    setStockAdjustment(0);
  }, [product]); // Depend on the entire product object to ensure all changes are captured

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

    // Create a copy of the product with updated stock and validated numeric values
    const updatedProduct = {
      ...editedProduct,
      currentStock: newStockLevel,
      price: price,
      cost: cost,
    };

    // Update the manual stock input to reflect the new stock level
    setManualStockInput(String(newStockLevel));
    setStockAdjustment(0); // Reset adjustment after save

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

          <Text className="font-medium mb-1 text-gray-700">Current Stock</Text>
          <TextInput
            className="bg-white border border-gray-300 rounded-md p-2 mb-3"
            value={manualStockInput}
            onChangeText={(text) => {
              // Only allow numeric input (including empty string for typing)
              if (text === "" || /^\d+$/.test(text)) {
                setManualStockInput(text);
                // Convert to number, defaulting to 0 if empty or NaN
                const newStock = text === "" ? 0 : parseInt(text) || 0;
                handleInputChange("currentStock", newStock);
              }
            }}
            keyboardType="numeric"
          />

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
              {(isNaN(Number(editedProduct.currentStock))
                ? 0
                : Number(editedProduct.currentStock)) +
                (isNaN(Number(stockAdjustment)) ? 0 : Number(stockAdjustment))}
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

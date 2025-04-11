import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from "react-native";
import { X, Plus, Edit, Trash2 } from "lucide-react-native";
import { storeData, getData, STORAGE_KEYS } from "../services/storage";

interface CategoryManagerProps {
  visible: boolean;
  onClose: () => void;
  onCategorySelected?: (category: string) => void;
}

const CategoryManager = ({
  visible,
  onClose,
  onCategorySelected,
}: CategoryManagerProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<{
    index: number;
    name: string;
  } | null>(null);

  // Load categories from storage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const storedCategories = await getData<string[]>(
          STORAGE_KEYS.CATEGORIES,
          [
            "Uncategorized",
            "Clothing",
            "Footwear",
            "Accessories",
            "Electronics",
          ],
        );
        setCategories(storedCategories);
      } catch (error) {
        console.error("Error loading categories:", error);
        setCategories([
          "Uncategorized",
          "Clothing",
          "Footwear",
          "Accessories",
          "Electronics",
        ]);
      }
    };

    if (visible) {
      loadCategories();
    }
  }, [visible]);

  // Save categories to storage
  const saveCategories = async (updatedCategories: string[]) => {
    try {
      await storeData(STORAGE_KEYS.CATEGORIES, updatedCategories);
      console.log("Categories saved successfully");
    } catch (error) {
      console.error("Error saving categories:", error);
    }
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      Alert.alert("Error", "Category name cannot be empty");
      return;
    }

    if (categories.includes(newCategory.trim())) {
      Alert.alert("Error", "Category already exists");
      return;
    }

    const updatedCategories = [...categories, newCategory.trim()];
    setCategories(updatedCategories);
    saveCategories(updatedCategories);
    setNewCategory("");
  };

  const handleEditCategory = (index: number) => {
    setEditingCategory({ index, name: categories[index] });
  };

  const handleUpdateCategory = () => {
    if (!editingCategory) return;

    if (!editingCategory.name.trim()) {
      Alert.alert("Error", "Category name cannot be empty");
      return;
    }

    if (
      categories.includes(editingCategory.name.trim()) &&
      categories[editingCategory.index] !== editingCategory.name.trim()
    ) {
      Alert.alert("Error", "Category already exists");
      return;
    }

    const updatedCategories = [...categories];
    updatedCategories[editingCategory.index] = editingCategory.name.trim();
    setCategories(updatedCategories);
    saveCategories(updatedCategories);
    setEditingCategory(null);
  };

  const handleDeleteCategory = (index: number) => {
    // Don't allow deleting the Uncategorized category
    if (categories[index] === "Uncategorized") {
      Alert.alert("Error", "Cannot delete the Uncategorized category");
      return;
    }

    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the category "${categories[index]}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => {
            const updatedCategories = [...categories];
            updatedCategories.splice(index, 1);
            setCategories(updatedCategories);
            saveCategories(updatedCategories);
          },
          style: "destructive",
        },
      ],
    );
  };

  const handleSelectCategory = (category: string) => {
    if (onCategorySelected) {
      onCategorySelected(category);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
        <View className="bg-white w-[90%] max-w-md rounded-lg p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">Manage Categories</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#4B5563" />
            </TouchableOpacity>
          </View>

          {/* Add new category */}
          <View className="flex-row mb-4">
            <TextInput
              className="flex-1 bg-gray-100 rounded-l-lg px-3 py-2"
              placeholder="New category name"
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <TouchableOpacity
              className="bg-blue-500 rounded-r-lg px-4 py-2 justify-center"
              onPress={handleAddCategory}
            >
              <Plus size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Edit category modal */}
          {editingCategory !== null && (
            <View className="mb-4 p-3 border border-gray-200 rounded-lg">
              <Text className="font-medium mb-2">Edit Category</Text>
              <TextInput
                className="bg-gray-100 rounded-lg px-3 py-2 mb-2"
                value={editingCategory.name}
                onChangeText={(text) =>
                  setEditingCategory({ ...editingCategory, name: text })
                }
              />
              <View className="flex-row justify-end">
                <TouchableOpacity
                  className="bg-gray-200 rounded-lg px-3 py-1 mr-2"
                  onPress={() => setEditingCategory(null)}
                >
                  <Text>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-500 rounded-lg px-3 py-1"
                  onPress={handleUpdateCategory}
                >
                  <Text className="text-white">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Categories list */}
          <FlatList
            data={categories}
            keyExtractor={(item, index) => `${item}-${index}`}
            renderItem={({ item, index }) => (
              <View className="flex-row justify-between items-center p-3 border-b border-gray-200">
                <TouchableOpacity
                  className="flex-1"
                  onPress={() => handleSelectCategory(item)}
                >
                  <Text>{item}</Text>
                </TouchableOpacity>
                <View className="flex-row">
                  <TouchableOpacity
                    className="p-2 mr-2"
                    onPress={() => handleEditCategory(index)}
                  >
                    <Edit size={18} color="#4B5563" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="p-2"
                    onPress={() => handleDeleteCategory(index)}
                  >
                    <Trash2 size={18} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            style={{ maxHeight: 300 }}
          />
        </View>
      </View>
    </Modal>
  );
};

export default CategoryManager;

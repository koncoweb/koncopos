import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Modal,
  FlatList,
} from "react-native";
import {
  ArrowLeft,
  Save,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Package,
  Shield,
} from "lucide-react-native";
import firebaseService from "../services/firebaseService";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";
import { useAuth } from "../contexts/AuthContext";

interface Warehouse {
  id: string;
  name: string;
  address: string;
  storeId?: string;
  storeName?: string;
  createdAt: string;
  updatedAt: string;
}

interface WarehouseManagementProps {
  onBack?: () => void;
}

const WarehouseManagement: React.FC<WarehouseManagementProps> = ({
  onBack = () => {},
}) => {
  const { isConfigured } = useFirebaseConfig();
  const { user } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<Warehouse>>({
    name: "",
    address: "",
    storeId: "",
  });
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, [isConfigured]);

  const loadData = async () => {
    if (!isConfigured || !firebaseService.isInitialized()) {
      return;
    }

    setIsLoading(true);
    try {
      const [warehousesData, storesData] = await Promise.all([
        firebaseService.getCollection("warehouses"),
        firebaseService.getCollection("stores"),
      ]);

      // Enhance warehouses with store names
      const enhancedWarehouses = warehousesData.map((warehouse: any) => {
        const store = storesData.find((s: any) => s.id === warehouse.storeId);
        return {
          ...warehouse,
          storeName: store?.name,
        };
      });

      setWarehouses(enhancedWarehouses || []);
      setStores(storesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load warehouses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Warehouse, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      Alert.alert("Validation Error", "Warehouse name is required");
      return false;
    }
    if (!formData.address?.trim()) {
      Alert.alert("Validation Error", "Warehouse address is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const warehouseData = {
        name: formData.name!.trim(),
        address: formData.address!.trim(),
        storeId: formData.storeId?.trim() || "",
        updatedAt: new Date().toISOString(),
      };

      if (editingWarehouse) {
        // Update existing warehouse
        await firebaseService.updateDocument(
          "warehouses",
          editingWarehouse.id,
          warehouseData,
        );
        Alert.alert("Success", "Warehouse updated successfully");
      } else {
        // Create new warehouse
        const newWarehouseData = {
          ...warehouseData,
          createdAt: new Date().toISOString(),
        };
        await firebaseService.addDocument("warehouses", newWarehouseData);
        Alert.alert("Success", "Warehouse created successfully");
      }

      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving warehouse:", error);
      Alert.alert("Error", "Failed to save warehouse");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      address: warehouse.address,
      storeId: warehouse.storeId || "",
    });
    setShowAddForm(true);
  };

  const handleDelete = (warehouse: Warehouse) => {
    Alert.alert(
      "Delete Warehouse",
      `Are you sure you want to delete "${warehouse.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await firebaseService.deleteDocument("warehouses", warehouse.id);
              Alert.alert("Success", "Warehouse deleted successfully");
              loadData();
            } catch (error) {
              console.error("Error deleting warehouse:", error);
              Alert.alert("Error", "Failed to delete warehouse");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ],
    );
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      storeId: "",
    });
    setEditingWarehouse(null);
    setShowAddForm(false);
  };

  // Check if user has warehouse management permissions
  const canManageWarehouses =
    user?.role === "owner" || user?.role === "warehouse_admin";

  if (!canManageWarehouses) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-blue-600 p-4 flex-row items-center">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">
            Warehouse Management
          </Text>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <Shield size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
            Access Denied
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Only owners and warehouse admins can manage warehouses
          </Text>
          <TouchableOpacity
            onPress={onBack}
            className="mt-6 bg-blue-500 px-6 py-3 rounded-lg"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!isConfigured) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-blue-600 p-4 flex-row items-center">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">
            Warehouse Management
          </Text>
        </View>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-600 text-center">
            Firebase is not configured. Please configure Firebase to manage
            warehouses.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 p-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">
            Warehouse Management
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowAddForm(true)}
          className="p-2 rounded-full"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View className="p-4 items-center">
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text className="text-gray-500 mt-2">Loading...</Text>
        </View>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <View className="bg-gray-50 p-4 border-b border-gray-200">
          <Text className="text-lg font-bold mb-4">
            {editingWarehouse ? "Edit Warehouse" : "Add New Warehouse"}
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 mb-1 font-medium">
                Warehouse Name *
              </Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                placeholder="Enter warehouse name"
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Address *</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                value={formData.address}
                onChangeText={(text) => handleInputChange("address", text)}
                placeholder="Enter warehouse address"
                multiline
                numberOfLines={2}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">
                Store (Optional)
              </Text>
              <View className="bg-white border border-gray-300 rounded-lg">
                <TouchableOpacity
                  className="p-3"
                  onPress={() => setShowStoreDropdown(true)}
                >
                  <Text
                    className={
                      formData.storeId ? "text-gray-900" : "text-gray-500"
                    }
                  >
                    {formData.storeId
                      ? stores.find((s) => s.id === formData.storeId)?.name ||
                        "Select Store"
                      : "Select Store (Optional)"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="flex-row mt-4 space-x-2">
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className="bg-blue-500 p-3 rounded-lg flex-1 mr-2 items-center"
            >
              <Text className="text-white font-medium">
                {editingWarehouse ? "Update Warehouse" : "Add Warehouse"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={resetForm}
              className="bg-gray-500 p-3 rounded-lg flex-1 ml-2 items-center"
            >
              <Text className="text-white font-medium">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Warehouses List */}
      <ScrollView className="flex-1 p-4">
        {warehouses.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Package size={64} color="#9ca3af" />
            <Text className="text-gray-500 text-center mb-4 mt-4">
              No warehouses found. Add your first warehouse to get started.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">
                Add First Warehouse
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {warehouses.map((warehouse) => (
              <View
                key={warehouse.id}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-lg font-bold text-gray-800 flex-1">
                    {warehouse.name}
                  </Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => handleEdit(warehouse)}
                      className="p-2"
                    >
                      <Edit size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(warehouse)}
                      className="p-2"
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {warehouse.address && (
                  <View className="flex-row items-center mb-1">
                    <MapPin size={16} color="#6b7280" className="mr-2" />
                    <Text className="text-gray-600 flex-1">
                      {warehouse.address}
                    </Text>
                  </View>
                )}

                {warehouse.storeName && (
                  <View className="mt-2">
                    <Text className="text-sm text-gray-500">
                      Store: {warehouse.storeName}
                    </Text>
                  </View>
                )}

                <Text className="text-xs text-gray-400 mt-2">
                  Created: {new Date(warehouse.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Store Selection Modal */}
      <Modal
        visible={showStoreDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStoreDropdown(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <View className="bg-white rounded-t-lg max-h-96">
            <View className="p-4 border-b border-gray-200">
              <Text className="text-lg font-bold text-center">
                Select Store
              </Text>
            </View>

            <FlatList
              data={[
                { id: "", name: "No Store (Independent Warehouse)" },
                ...stores,
              ]}
              keyExtractor={(item) => item.id || "none"}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="p-4 border-b border-gray-100"
                  onPress={() => {
                    setFormData((prev) => ({ ...prev, storeId: item.id }));
                    setShowStoreDropdown(false);
                  }}
                >
                  <Text
                    className={`text-base ${
                      formData.storeId === item.id
                        ? "text-blue-600 font-semibold"
                        : "text-gray-900"
                    }`}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />

            <TouchableOpacity
              className="p-4 bg-gray-100"
              onPress={() => setShowStoreDropdown(false)}
            >
              <Text className="text-center text-gray-600 font-medium">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default WarehouseManagement;

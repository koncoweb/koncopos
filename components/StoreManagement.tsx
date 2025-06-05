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
} from "react-native";
import {
  ArrowLeft,
  Save,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail,
  Shield,
} from "lucide-react-native";
import firebaseService from "../services/firebaseService";
import { useFirebaseConfig } from "../contexts/FirebaseConfigContext";
import { useAuth } from "../contexts/AuthContext";

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  manager: string;
  createdAt: string;
  updatedAt: string;
}

interface StoreManagementProps {
  onBack?: () => void;
}

const StoreManagement: React.FC<StoreManagementProps> = ({
  onBack = () => {},
}) => {
  const { isConfigured } = useFirebaseConfig();
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [formData, setFormData] = useState<Partial<Store>>({
    name: "",
    address: "",
    phone: "",
    email: "",
    manager: "",
  });

  useEffect(() => {
    loadStores();
  }, [isConfigured]);

  const loadStores = async () => {
    if (!isConfigured || !firebaseService.isInitialized()) {
      return;
    }

    setIsLoading(true);
    try {
      const storesData = await firebaseService.getCollection("stores");
      setStores(storesData || []);
    } catch (error) {
      console.error("Error loading stores:", error);
      Alert.alert("Error", "Failed to load stores");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof Store, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.name?.trim()) {
      Alert.alert("Validation Error", "Store name is required");
      return false;
    }
    if (!formData.address?.trim()) {
      Alert.alert("Validation Error", "Store address is required");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const storeData = {
        name: formData.name!.trim(),
        address: formData.address!.trim(),
        phone: formData.phone?.trim() || "",
        email: formData.email?.trim() || "",
        manager: formData.manager?.trim() || "",
        updatedAt: new Date().toISOString(),
      };

      if (editingStore) {
        // Update existing store
        await firebaseService.updateDocument(
          "stores",
          editingStore.id,
          storeData,
        );
        setStores((prev) =>
          prev.map((store) =>
            store.id === editingStore.id ? { ...store, ...storeData } : store,
          ),
        );
        Alert.alert("Success", "Store updated successfully");
      } else {
        // Create new store
        const newStoreData = {
          ...storeData,
          createdAt: new Date().toISOString(),
        };
        const newStore = await firebaseService.addDocument(
          "stores",
          newStoreData,
        );
        setStores((prev) => [...prev, { id: newStore.id, ...newStoreData }]);
        Alert.alert("Success", "Store created successfully");
      }

      resetForm();
    } catch (error) {
      console.error("Error saving store:", error);
      Alert.alert("Error", "Failed to save store");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      address: store.address,
      phone: store.phone,
      email: store.email,
      manager: store.manager,
    });
    setShowAddForm(true);
  };

  const handleDelete = (store: Store) => {
    Alert.alert(
      "Delete Store",
      `Are you sure you want to delete "${store.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await firebaseService.deleteDocument("stores", store.id);
              setStores((prev) => prev.filter((s) => s.id !== store.id));
              Alert.alert("Success", "Store deleted successfully");
            } catch (error) {
              console.error("Error deleting store:", error);
              Alert.alert("Error", "Failed to delete store");
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
      phone: "",
      email: "",
      manager: "",
    });
    setEditingStore(null);
    setShowAddForm(false);
  };

  // Check if user is owner
  const isOwner = user?.role === "owner";

  if (!isOwner) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="bg-blue-600 p-4 flex-row items-center">
          <TouchableOpacity onPress={onBack} className="mr-4">
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Store Management</Text>
        </View>
        <View className="flex-1 justify-center items-center p-6">
          <Shield size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
            Access Denied
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Only owners can manage stores
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
          <Text className="text-white text-xl font-bold">Store Management</Text>
        </View>
        <View className="flex-1 justify-center items-center p-4">
          <Text className="text-gray-600 text-center">
            Firebase is not configured. Please configure Firebase to manage
            stores.
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
          <Text className="text-white text-xl font-bold">Store Management</Text>
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
            {editingStore ? "Edit Store" : "Add New Store"}
          </Text>

          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 mb-1 font-medium">
                Store Name *
              </Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                value={formData.name}
                onChangeText={(text) => handleInputChange("name", text)}
                placeholder="Enter store name"
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Address *</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                value={formData.address}
                onChangeText={(text) => handleInputChange("address", text)}
                placeholder="Enter store address"
                multiline
                numberOfLines={2}
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Phone</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                value={formData.phone}
                onChangeText={(text) => handleInputChange("phone", text)}
                placeholder="Enter phone number"
                keyboardType="phone-pad"
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Email</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                value={formData.email}
                onChangeText={(text) => handleInputChange("email", text)}
                placeholder="Enter email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text className="text-gray-700 mb-1 font-medium">Manager</Text>
              <TextInput
                className="bg-white p-3 rounded-lg border border-gray-300"
                value={formData.manager}
                onChangeText={(text) => handleInputChange("manager", text)}
                placeholder="Enter manager name"
              />
            </View>
          </View>

          <View className="flex-row mt-4 space-x-2">
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className="bg-blue-500 p-3 rounded-lg flex-1 mr-2 items-center"
            >
              <Text className="text-white font-medium">
                {editingStore ? "Update Store" : "Add Store"}
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

      {/* Stores List */}
      <ScrollView className="flex-1 p-4">
        {stores.length === 0 ? (
          <View className="flex-1 justify-center items-center py-8">
            <Text className="text-gray-500 text-center mb-4">
              No stores found. Add your first store to get started.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddForm(true)}
              className="bg-blue-500 px-6 py-3 rounded-lg"
            >
              <Text className="text-white font-medium">Add First Store</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="space-y-4">
            {stores.map((store) => (
              <View
                key={store.id}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-lg font-bold text-gray-800 flex-1">
                    {store.name}
                  </Text>
                  <View className="flex-row space-x-2">
                    <TouchableOpacity
                      onPress={() => handleEdit(store)}
                      className="p-2"
                    >
                      <Edit size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(store)}
                      className="p-2"
                    >
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {store.address && (
                  <View className="flex-row items-center mb-1">
                    <MapPin size={16} color="#6b7280" className="mr-2" />
                    <Text className="text-gray-600 flex-1">
                      {store.address}
                    </Text>
                  </View>
                )}

                {store.phone && (
                  <View className="flex-row items-center mb-1">
                    <Phone size={16} color="#6b7280" className="mr-2" />
                    <Text className="text-gray-600">{store.phone}</Text>
                  </View>
                )}

                {store.email && (
                  <View className="flex-row items-center mb-1">
                    <Mail size={16} color="#6b7280" className="mr-2" />
                    <Text className="text-gray-600">{store.email}</Text>
                  </View>
                )}

                {store.manager && (
                  <View className="mt-2">
                    <Text className="text-sm text-gray-500">
                      Manager: {store.manager}
                    </Text>
                  </View>
                )}

                <Text className="text-xs text-gray-400 mt-2">
                  Created: {new Date(store.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default StoreManagement;

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import {
  ArrowLeft,
  Plus,
  Edit,
  Users,
  Shield,
  ChevronDown,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import firebaseService from "../services/firebaseService";

interface UserManagementProps {
  onBack?: () => void;
}

interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: "owner" | "warehouse_admin" | "cashier";
  storeId?: string;
  storeName?: string;
  warehouseId?: string;
  warehouseName?: string;
  permissions?: string[];
  createdAt: string;
}

interface Store {
  id: string;
  name: string;
  location: string;
}

interface Warehouse {
  id: string;
  name: string;
  storeId: string;
}

const UserManagement: React.FC<UserManagementProps> = ({
  onBack = () => {},
}) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditUser, setShowEditUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({
    role: "cashier" as "owner" | "warehouse_admin" | "cashier",
    storeId: "",
    warehouseId: "",
  });

  // Check if user is owner
  const isOwner = user?.role === "owner";

  const roles = [
    {
      id: "cashier",
      name: "Cashier",
      description: "Can process sales transactions",
    },
    {
      id: "warehouse_admin",
      name: "Warehouse Admin",
      description: "Can manage inventory and view reports",
    },
    { id: "owner", name: "Owner", description: "Full access to all features" },
  ];

  useEffect(() => {
    if (isOwner) {
      loadData();
    }
  }, [isOwner]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (firebaseService.isInitialized()) {
        const [storesData, warehousesData, usersData] = await Promise.all([
          firebaseService.getStores(),
          firebaseService.getWarehouses(),
          firebaseService.getCollection("profiles"),
        ]);

        setStores(storesData);
        setWarehouses(warehousesData);

        // Enhance user data with store/warehouse names
        const enhancedUsers = usersData.map((userProfile: any) => {
          const store = storesData.find((s) => s.id === userProfile.storeId);
          const warehouse = warehousesData.find(
            (w) => w.id === userProfile.warehouseId,
          );

          return {
            ...userProfile,
            storeName: store?.name,
            warehouseName: warehouse?.name,
          };
        });

        setUsers(enhancedUsers);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      Alert.alert("Error", "Failed to load user data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditUser = (userProfile: UserProfile) => {
    setSelectedUser(userProfile);
    setEditForm({
      role: userProfile.role,
      storeId: userProfile.storeId || "",
      warehouseId: userProfile.warehouseId || "",
    });
    setShowEditUser(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      await firebaseService.updateDocument("profiles", selectedUser.id, {
        role: editForm.role,
        storeId: editForm.storeId || null,
        warehouseId: editForm.warehouseId || null,
      });

      Alert.alert("Success", "User updated successfully");
      setShowEditUser(false);
      loadData();
    } catch (error) {
      console.error("Error updating user:", error);
      Alert.alert("Error", "Failed to update user");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "owner":
        return "bg-purple-100 text-purple-800";
      case "warehouse_admin":
        return "bg-blue-100 text-blue-800";
      case "cashier":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOwner) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center p-6">
          <Shield size={64} color="#ef4444" />
          <Text className="text-xl font-bold text-gray-900 mt-4 text-center">
            Access Denied
          </Text>
          <Text className="text-gray-600 mt-2 text-center">
            Only owners can manage users
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

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 mt-4">Loading users...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
        <TouchableOpacity onPress={onBack} className="p-2">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-900">User Management</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1">
        {/* Users List */}
        <View className="p-4">
          <View className="flex-row items-center mb-4">
            <Users size={20} color="#374151" />
            <Text className="text-lg font-semibold text-gray-900 ml-2">
              Team Members ({users.length})
            </Text>
          </View>

          {users.map((userProfile) => (
            <View
              key={userProfile.id}
              className="bg-gray-50 rounded-lg p-4 mb-3"
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-900">
                    {userProfile.displayName || userProfile.email}
                  </Text>
                  <Text className="text-gray-600 text-sm mt-1">
                    {userProfile.email}
                  </Text>

                  <View className="flex-row items-center mt-2">
                    <View
                      className={`px-2 py-1 rounded-full ${getRoleColor(userProfile.role)}`}
                    >
                      <Text className="text-xs font-medium">
                        {roles.find((r) => r.id === userProfile.role)?.name ||
                          userProfile.role}
                      </Text>
                    </View>
                  </View>

                  {userProfile.storeName && (
                    <Text className="text-gray-600 text-sm mt-1">
                      Store: {userProfile.storeName}
                    </Text>
                  )}

                  {userProfile.warehouseName && (
                    <Text className="text-gray-600 text-sm">
                      Warehouse: {userProfile.warehouseName}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleEditUser(userProfile)}
                  className="p-2"
                >
                  <Edit size={18} color="#6b7280" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Edit User Modal */}
      {showEditUser && selectedUser && (
        <View className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center">
          <View className="bg-white rounded-lg p-6 m-4 w-full max-w-md">
            <Text className="text-lg font-bold text-gray-900 mb-4">
              Edit User: {selectedUser.displayName || selectedUser.email}
            </Text>

            {/* Role Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Role
              </Text>
              <TouchableOpacity
                onPress={() => setShowRoleDropdown(!showRoleDropdown)}
                className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
              >
                <Text className="text-gray-900">
                  {roles.find((r) => r.id === editForm.role)?.name ||
                    editForm.role}
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>

              {showRoleDropdown && (
                <View className="border border-gray-300 rounded-lg mt-1 bg-white">
                  {roles.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      onPress={() => {
                        setEditForm({ ...editForm, role: role.id as any });
                        setShowRoleDropdown(false);
                      }}
                      className="p-3 border-b border-gray-200 last:border-b-0"
                    >
                      <Text className="font-medium text-gray-900">
                        {role.name}
                      </Text>
                      <Text className="text-sm text-gray-600">
                        {role.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Store Selection */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Store
              </Text>
              <TouchableOpacity
                onPress={() => setShowStoreDropdown(!showStoreDropdown)}
                className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
              >
                <Text className="text-gray-900">
                  {stores.find((s) => s.id === editForm.storeId)?.name ||
                    "Select Store"}
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>

              {showStoreDropdown && (
                <View className="border border-gray-300 rounded-lg mt-1 bg-white max-h-40">
                  <ScrollView>
                    <TouchableOpacity
                      onPress={() => {
                        setEditForm({ ...editForm, storeId: "" });
                        setShowStoreDropdown(false);
                      }}
                      className="p-3 border-b border-gray-200"
                    >
                      <Text className="text-gray-900">No Store</Text>
                    </TouchableOpacity>
                    {stores.map((store) => (
                      <TouchableOpacity
                        key={store.id}
                        onPress={() => {
                          setEditForm({ ...editForm, storeId: store.id });
                          setShowStoreDropdown(false);
                        }}
                        className="p-3 border-b border-gray-200 last:border-b-0"
                      >
                        <Text className="text-gray-900">{store.name}</Text>
                        <Text className="text-sm text-gray-600">
                          {store.location}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Warehouse Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Warehouse
              </Text>
              <TouchableOpacity
                onPress={() => setShowWarehouseDropdown(!showWarehouseDropdown)}
                className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
              >
                <Text className="text-gray-900">
                  {warehouses.find((w) => w.id === editForm.warehouseId)
                    ?.name || "Select Warehouse"}
                </Text>
                <ChevronDown size={20} color="#6b7280" />
              </TouchableOpacity>

              {showWarehouseDropdown && (
                <View className="border border-gray-300 rounded-lg mt-1 bg-white max-h-40">
                  <ScrollView>
                    <TouchableOpacity
                      onPress={() => {
                        setEditForm({ ...editForm, warehouseId: "" });
                        setShowWarehouseDropdown(false);
                      }}
                      className="p-3 border-b border-gray-200"
                    >
                      <Text className="text-gray-900">No Warehouse</Text>
                    </TouchableOpacity>
                    {warehouses.map((warehouse) => (
                      <TouchableOpacity
                        key={warehouse.id}
                        onPress={() => {
                          setEditForm({
                            ...editForm,
                            warehouseId: warehouse.id,
                          });
                          setShowWarehouseDropdown(false);
                        }}
                        className="p-3 border-b border-gray-200 last:border-b-0"
                      >
                        <Text className="text-gray-900">{warehouse.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                onPress={() => setShowEditUser(false)}
                className="px-4 py-2 rounded-lg border border-gray-300"
              >
                <Text className="text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveUser}
                className="px-4 py-2 rounded-lg bg-blue-500 ml-3"
              >
                <Text className="text-white font-medium">Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

export default UserManagement;

import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import firebaseService from "../services/firebaseService";
import { getData } from "../services/storage";

const RoleDebugger: React.FC = () => {
  const { user, refreshUserRole } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runDebug = async () => {
    setIsLoading(true);
    try {
      const info: any = {
        timestamp: new Date().toISOString(),
        currentUser: {
          uid: user?.uid,
          email: user?.email,
          displayName: user?.displayName,
          role: user?.role,
          isAuthenticated: user?.isAuthenticated,
        },
        firebaseInitialized: firebaseService.isInitialized(),
      };

      // Get saved auth state from storage
      const savedAuthState = await getData("auth_state", {});
      info.savedAuthState = savedAuthState;

      // If user has UID, try to get role from Firestore
      if (user?.uid && firebaseService.isInitialized()) {
        try {
          const freshRole = await firebaseService.getUserRole(user.uid);
          info.freshRoleFromFirestore = freshRole;

          // Check users collection
          const usersDoc = await firebaseService.getDocument("users", user.uid);

          info.firestoreData = {
            usersCollection: usersDoc,
          };
        } catch (error) {
          info.firestoreError = error.message;
        }
      }

      setDebugInfo(info);
      console.log("Role Debug Info:", JSON.stringify(info, null, 2));
    } catch (error) {
      console.error("Debug error:", error);
      Alert.alert("Debug Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshRole = async () => {
    try {
      await refreshUserRole();
      Alert.alert("Success", "User role refreshed from Firestore");
      // Re-run debug to see updated info
      await runDebug();
    } catch (error) {
      console.error("Error refreshing role:", error);
      Alert.alert("Error", "Failed to refresh role: " + error.message);
    }
  };

  return (
    <View className="bg-white p-4 m-4 rounded-lg border border-gray-200">
      <Text className="text-lg font-bold mb-4">Role Debugger</Text>

      <View className="flex-row space-x-2 mb-4">
        <TouchableOpacity
          onPress={runDebug}
          disabled={isLoading}
          className="bg-blue-500 px-4 py-2 rounded-lg flex-1"
        >
          <Text className="text-white text-center font-medium">
            {isLoading ? "Running..." : "Run Debug"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleRefreshRole}
          disabled={isLoading || !user?.uid}
          className="bg-green-500 px-4 py-2 rounded-lg flex-1"
        >
          <Text className="text-white text-center font-medium">
            Refresh Role
          </Text>
        </TouchableOpacity>
      </View>

      {debugInfo && (
        <ScrollView className="max-h-96 bg-gray-50 p-3 rounded-lg">
          <Text className="text-xs font-mono">
            {JSON.stringify(debugInfo, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
};

export default RoleDebugger;

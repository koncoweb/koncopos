import React from "react";
import { View } from "react-native";
import { useRouter } from "expo-router";
import UserManagement from "../components/UserManagement";

export default function UserManagementScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <UserManagement onBack={() => router.replace("/")} />
    </View>
  );
}

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Menu, User, LogOut, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

interface HeaderProps {
  title?: string;
  userName?: string;
  userAvatar?: string;
}

const Header = ({
  title = "POS System",
  userName,
  userAvatar,
}: HeaderProps) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();
  const { user, logout, login } = useAuth();

  // Use context user data if available, otherwise use props
  const displayName = user?.displayName || userName || "User";
  const avatarUrl =
    user?.photoURL ||
    userAvatar ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`;

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = async () => {
    try {
      setMenuVisible(false);
      await logout();
      // Router navigation is handled in the logout function in AuthContext
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const handleSettings = () => {
    setMenuVisible(false);
    // In a real app, this would navigate to settings
  };

  return (
    <View className="bg-blue-600 w-full px-4 py-3 flex-row justify-between items-center shadow-md z-50">
      {/* Logo and Title */}
      <View className="flex-row items-center">
        <Image
          source={{
            uri: "https://images.unsplash.com/photo-1633409361618-c73427e4e206?w=100&q=80",
          }}
          className="w-8 h-8 rounded-md mr-2"
        />
        <Text className="text-white font-bold text-lg">{title}</Text>
      </View>

      {/* User Profile or Login Button */}
      <View className="relative">
        {user?.isAuthenticated ? (
          <TouchableOpacity
            onPress={toggleMenu}
            className="flex-row items-center"
          >
            <Text className="text-white mr-2">{displayName}</Text>
            <View className="w-8 h-8 rounded-full bg-white overflow-hidden">
              <Image source={{ uri: avatarUrl }} className="w-full h-full" />
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => router.push("/login")}
            className="bg-white px-3 py-1 rounded-md"
          >
            <Text className="text-blue-600 font-semibold">Login</Text>
          </TouchableOpacity>
        )}

        {/* Dropdown Menu */}
        {menuVisible && user?.isAuthenticated && (
          <View className="absolute top-10 right-0 bg-white rounded-md shadow-lg w-48 z-[9999]">
            <TouchableOpacity
              className="flex-row items-center px-4 py-3 border-b border-gray-200"
              onPress={() => {}}
            >
              <User size={18} color="#4B5563" />
              <Text className="ml-2 text-gray-700">Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-3 border-b border-gray-200"
              onPress={handleSettings}
            >
              <Settings size={18} color="#4B5563" />
              <Text className="ml-2 text-gray-700">Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={handleLogout}
            >
              <LogOut size={18} color="#EF4444" />
              <Text className="ml-2 text-red-500">Logout</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default Header;

import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Menu, User, LogOut, Settings } from "lucide-react-native";
import { useRouter } from "expo-router";

interface HeaderProps {
  title?: string;
  userName?: string;
  userAvatar?: string;
}

const Header = ({
  title = "POS System",
  userName = "John Doe",
  userAvatar = "https://api.dicebear.com/7.x/avataaars/svg?seed=John",
}: HeaderProps) => {
  const [menuVisible, setMenuVisible] = useState(false);
  const router = useRouter();

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const handleLogout = () => {
    // In a real app, this would handle logout logic
    setMenuVisible(false);
    router.replace("/login");
  };

  const handleSettings = () => {
    setMenuVisible(false);
    // In a real app, this would navigate to settings
  };

  return (
    <View className="bg-blue-600 w-full px-4 py-3 flex-row justify-between items-center shadow-md">
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

      {/* User Profile */}
      <View className="relative">
        <TouchableOpacity
          onPress={toggleMenu}
          className="flex-row items-center"
        >
          <Text className="text-white mr-2">{userName}</Text>
          <View className="w-8 h-8 rounded-full bg-white overflow-hidden">
            <Image source={{ uri: userAvatar }} className="w-full h-full" />
          </View>
        </TouchableOpacity>

        {/* Dropdown Menu */}
        {menuVisible && (
          <View className="absolute top-10 right-0 bg-white rounded-md shadow-lg w-48 z-10">
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

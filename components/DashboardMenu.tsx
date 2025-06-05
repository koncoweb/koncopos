import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import {
  Clipboard,
  BarChart3,
  History,
  ArrowLeftRight,
  Warehouse,
  Store,
  Users,
} from "lucide-react-native";

interface MenuItemProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  onPress?: () => void;
  color?: string;
}

const MenuItem = ({
  title = "Menu Item",
  icon,
  description = "Description of this menu item",
  onPress = () => {},
  color = "#4F46E5",
}: MenuItemProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-gray-100 flex-1 min-h-32"
      style={{ minWidth: "45%" }}
    >
      <View className="flex-row items-center mb-2">
        <View
          className="w-10 h-10 rounded-full items-center justify-center mr-2"
          style={{ backgroundColor: `${color}20` }}
        >
          {icon
            ? React.cloneElement(icon as React.ReactElement, {
                size: 20,
                color: color,
              })
            : null}
        </View>
        <Text className="text-lg font-bold text-gray-800">{title}</Text>
      </View>
      <Text className="text-gray-600 text-sm">{description}</Text>
    </TouchableOpacity>
  );
};

interface DashboardMenuProps {
  userName?: string;
  menuItems?: Array<{
    title: string;
    icon: React.ReactNode | string;
    description: string;
    onPress: () => void;
    color: string;
  }>;
}

const DashboardMenu = ({
  userName = "User",
  menuItems,
}: DashboardMenuProps) => {
  const router = useRouter();

  // Use provided menuItems or fallback to default if not provided
  const items = menuItems || [
    {
      title: "Inventory",
      icon: <Clipboard />,
      description: "Manage products, view stock levels, and adjust inventory",
      onPress: () => router.push("/inventory"),
      color: "#4F46E5",
    },
    {
      title: "POS",
      icon: <BarChart3 />,
      description: "Process sales transactions and manage shopping cart",
      onPress: () => router.push("/pos"),
      color: "#10B981",
    },
    {
      title: "Transactions",
      icon: <History />,
      description: "View sales history and transaction details",
      onPress: () => router.push("/transactions"),
      color: "#F59E0B",
    },
    {
      title: "Transfers",
      icon: <ArrowLeftRight />,
      description: "Create and receive inventory transfers between locations",
      onPress: () => router.push("/transfers"),
      color: "#EC4899",
    },
    {
      title: "Warehouses",
      icon: <Warehouse />,
      description: "Manage warehouse locations and user assignments",
      onPress: () => router.push("/warehouses"),
      color: "#8B5CF6",
    },
    {
      title: "Stores",
      icon: <Store />,
      description: "Manage store settings and configurations",
      onPress: () => router.push("/stores"),
      color: "#06B6D4",
    },
    {
      title: "User Management",
      icon: <Users />,
      description: "Manage users, roles, and permissions",
      onPress: () => router.push("/user-management"),
      color: "#EF4444",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 px-4 pt-2">
      <Text className="text-xl font-bold text-gray-800 mb-2">
        Welcome, {userName}
      </Text>
      <Text className="text-gray-600 mb-6">
        What would you like to do today?
      </Text>

      <View className="flex-row flex-wrap justify-between">
        {items.map((item, index) => (
          <MenuItem
            key={index}
            title={item.title}
            icon={typeof item.icon === "string" ? null : item.icon}
            description={item.description}
            onPress={item.onPress}
            color={item.color}
          />
        ))}
      </View>

      <View className="h-6" />
    </ScrollView>
  );
};

export default DashboardMenu;

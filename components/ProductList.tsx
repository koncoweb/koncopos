import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Search, Filter, ArrowUpDown } from "lucide-react-native";

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  location: string;
}

interface ProductListProps {
  products?: Product[];
  onProductSelect?: (product: Product) => void;
  searchEnabled?: boolean;
  filterEnabled?: boolean;
}

const ProductList = ({
  products = [
    {
      id: "1",
      name: "T-Shirt (Black)",
      sku: "TS-BLK-001",
      price: 19.99,
      stock: 45,
      category: "Apparel",
      location: "Warehouse A",
    },
    {
      id: "2",
      name: "Jeans (Blue)",
      sku: "JN-BLU-002",
      price: 39.99,
      stock: 28,
      category: "Apparel",
      location: "Warehouse A",
    },
    {
      id: "3",
      name: "Sneakers (White)",
      sku: "SN-WHT-003",
      price: 59.99,
      stock: 15,
      category: "Footwear",
      location: "Warehouse B",
    },
    {
      id: "4",
      name: "Backpack",
      sku: "BP-BLK-004",
      price: 49.99,
      stock: 32,
      category: "Accessories",
      location: "Warehouse C",
    },
    {
      id: "5",
      name: "Water Bottle",
      sku: "WB-BLU-005",
      price: 14.99,
      stock: 67,
      category: "Accessories",
      location: "Warehouse C",
    },
  ],
  onProductSelect = () => {},
  searchEnabled = true,
  filterEnabled = true,
}: ProductListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Filter products based on search query
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      product.sku.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query)
    );
  });

  // Sort products based on sortBy and sortOrder
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortOrder === "asc") {
      return a[sortBy] > b[sortBy] ? 1 : -1;
    } else {
      return a[sortBy] < b[sortBy] ? 1 : -1;
    }
  });

  const toggleSort = (field: "name" | "stock" | "price") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const renderStockIndicator = (stock: number) => {
    // Ensure stock is a valid number
    const validStock = isNaN(Number(stock)) ? 0 : Number(stock);

    if (validStock <= 10) {
      return <View className="w-3 h-3 rounded-full bg-red-500" />;
    } else if (validStock <= 30) {
      return <View className="w-3 h-3 rounded-full bg-yellow-500" />;
    } else {
      return <View className="w-3 h-3 rounded-full bg-green-500" />;
    }
  };

  return (
    <View className="flex-1 bg-white">
      {searchEnabled && (
        <View className="px-4 py-2 bg-gray-100">
          <View className="flex-row items-center bg-white rounded-lg px-3 py-2">
            <Search size={20} color="#9ca3af" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}

      {filterEnabled && (
        <View className="flex-row justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-200">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => {}}
          >
            <Filter size={16} color="#4b5563" />
            <Text className="ml-1 text-gray-600 font-medium">Filter</Text>
          </TouchableOpacity>

          <View className="flex-row">
            <TouchableOpacity
              className="flex-row items-center mr-4"
              onPress={() => toggleSort("name")}
            >
              <Text
                className={`mr-1 ${sortBy === "name" ? "font-bold text-blue-600" : "text-gray-600"}`}
              >
                Name
              </Text>
              {sortBy === "name" && <ArrowUpDown size={14} color="#2563eb" />}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center mr-4"
              onPress={() => toggleSort("price")}
            >
              <Text
                className={`mr-1 ${sortBy === "price" ? "font-bold text-blue-600" : "text-gray-600"}`}
              >
                Price
              </Text>
              {sortBy === "price" && <ArrowUpDown size={14} color="#2563eb" />}
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => toggleSort("stock")}
            >
              <Text
                className={`mr-1 ${sortBy === "stock" ? "font-bold text-blue-600" : "text-gray-600"}`}
              >
                Stock
              </Text>
              {sortBy === "stock" && <ArrowUpDown size={14} color="#2563eb" />}
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={sortedProducts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="p-4 border-b border-gray-200 flex-row items-center"
            onPress={() => onProductSelect(item)}
          >
            <View className="flex-1">
              <Text className="text-lg font-medium">{item.name}</Text>
              <Text className="text-gray-500 text-sm">{item.sku}</Text>
              <View className="flex-row mt-1">
                <Text className="text-gray-600 text-xs">{item.category}</Text>
                <Text className="text-gray-400 text-xs mx-2">•</Text>
                <Text className="text-gray-600 text-xs">{item.location}</Text>
              </View>
            </View>
            <View className="items-end">
              <Text className="text-lg font-semibold">
                Rp{" "}
                {item.price.toLocaleString("id-ID", {
                  maximumFractionDigits: 0,
                })}
              </Text>
              <View className="flex-row items-center mt-1">
                {renderStockIndicator(item.stock)}
                <Text className="ml-2 text-sm text-gray-600">
                  {isNaN(Number(item.stock)) ? 0 : Number(item.stock)} in stock
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-10">
            <Text className="text-gray-500 text-lg">No products found</Text>
          </View>
        }
      />
    </View>
  );
};

export default ProductList;

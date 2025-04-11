import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { ShoppingBag } from "lucide-react-native";

type Product = {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  category: string;
  image?: string;
};

interface ProductGridProps {
  products: Product[];
  isMobile: boolean;
  onAddToCart: (product: Product) => void;
}

const ProductGrid = ({ products, isMobile, onAddToCart }: ProductGridProps) => {
  return (
    <ScrollView className={`flex-1 ${isMobile ? "" : "mr-4"}`}>
      <View className="flex-row flex-wrap">
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            className={`${isMobile ? "w-1/2" : "w-1/2"} p-1`}
            onPress={() => onAddToCart(product)}
          >
            <View className="bg-white p-3 rounded-lg border border-gray-200 h-40">
              <View className="items-center justify-center bg-gray-100 h-20 mb-2 rounded">
                <ShoppingBag size={24} color="#4B5563" />
              </View>
              <Text
                className="font-medium text-gray-800 mb-1 z-10"
                numberOfLines={1}
                style={{ fontSize: 16, fontWeight: "600" }}
              >
                {product.name}
              </Text>
              <Text className="text-xs text-gray-500 mb-1">
                SKU: {product.sku}
              </Text>
              <View className="flex-row justify-between items-center">
                <Text className="font-bold">
                  Rp{" "}
                  {product.price.toLocaleString("id-ID", {
                    maximumFractionDigits: 0,
                  })}
                </Text>
                <Text
                  className={`text-xs ${product.stock < 5 ? "text-red-500" : "text-green-600"}`}
                >
                  {product.stock} in stock
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default ProductGrid;

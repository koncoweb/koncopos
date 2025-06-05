import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { Product } from '../models/Product';

interface ProductGridProps {
  products: Product[];
  isMobile: boolean;
  onAddToCart: (product: Product) => void;
}

const ProductGrid = ({ products, isMobile, onAddToCart }: ProductGridProps) => {
  return (
    <ScrollView className={`flex-1 ${isMobile ? '' : 'mr-4'}`}>
      <View className="flex-row flex-wrap">
        {products.map((product) => (
          <TouchableOpacity
            key={product.id}
            className={`${isMobile ? 'w-1/2' : 'w-1/2'} p-1`}
            onPress={() => onAddToCart(product)}
          >
            <View className="bg-white p-3 rounded-lg border border-gray-200 h-40">
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-2">
                  <ShoppingBag size={16} color="#3b82f6" />
                </View>
                <Text className="font-medium text-gray-800" numberOfLines={1}>
                  {product.name}
                </Text>
              </View>
              <Text className="text-gray-500 text-sm mb-1">
                SKU: {product.sku}
              </Text>
              <Text className="text-gray-500 text-sm mb-2">
                Stock: {product.stock}
              </Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-blue-600 font-bold">
                  ${(product.price || 0).toFixed(2)}
                </Text>
                <Text
                  className={`text-xs ${
                    (product.stock || 0) < 5 ? 'text-red-500' : 'text-green-600'
                  }`}
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

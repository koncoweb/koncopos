import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import ShoppingCart from "./ShoppingCart";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
};

interface MobileShoppingCartProps {
  visible: boolean;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, newQuantity: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: () => void;
  onClose: () => void;
}

const MobileShoppingCart = ({
  visible,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onClose,
}: MobileShoppingCartProps) => {
  if (!visible) return null;

  return (
    <View className="absolute inset-0 bg-black bg-opacity-50 z-10">
      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-4 max-h-[80%]">
        <View className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4"></View>
        <ShoppingCart
          items={cartItems}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={(id) => {
            console.log("Mobile cart removing item:", id);
            onRemoveItem(id);
          }}
          onCheckout={() => {
            onClose();
            onCheckout();
          }}
        />
        <TouchableOpacity
          onPress={onClose}
          className="mt-4 py-3 bg-gray-200 rounded-lg items-center"
        >
          <Text className="font-medium text-gray-800">Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default MobileShoppingCart;

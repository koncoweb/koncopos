import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingCart as CartIcon,
} from "lucide-react-native";
import { storeData, getData, STORAGE_KEYS } from "../services/storage";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
};

type ShoppingCartProps = {
  items?: CartItem[];
  onUpdateQuantity?: (id: string, newQuantity: number) => void;
  onRemoveItem?: (id: string) => void;
  onCheckout?: () => void;
};

// Empty default cart items array - data will be loaded from storage
const defaultCartItems: CartItem[] = [];

const ShoppingCart = ({
  items,
  onUpdateQuantity = (id, newQuantity) =>
    console.log(`Update quantity: ${id} to ${newQuantity}`),
  onRemoveItem = (id) => console.log(`Remove item: ${id}`),
  onCheckout = () => console.log("Checkout initiated"),
}: ShoppingCartProps) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart items from storage on component mount
  useEffect(() => {
    const loadCartItems = async () => {
      setIsLoading(true);
      try {
        // If items prop is provided, use it (for controlled component usage)
        if (items) {
          setCartItems(items);
          await storeData(STORAGE_KEYS.CART_ITEMS, items);
        } else {
          // Otherwise load from storage
          const storedItems = await getData<CartItem[]>(
            STORAGE_KEYS.CART_ITEMS,
            defaultCartItems,
          );
          setCartItems(storedItems);
        }
      } catch (error) {
        console.error("Error loading cart items:", error);
        setCartItems(items || defaultCartItems);
      } finally {
        setIsLoading(false);
      }
    };

    loadCartItems();
  }, [items]);

  // Save cart items to storage whenever they change
  useEffect(() => {
    if (!isLoading && !items) {
      // Only save if not controlled by parent
      storeData(STORAGE_KEYS.CART_ITEMS, cartItems);
    }
  }, [cartItems, isLoading, items]);

  const handleUpdateQuantity = (id: string, change: number) => {
    const updatedItems = cartItems.map((item) => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        onUpdateQuantity(id, newQuantity);
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    setCartItems(updatedItems);
  };

  const handleRemoveItem = (id: string) => {
    Alert.alert(
      "Remove Item",
      "Are you sure you want to remove this item from your cart?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: () => {
            onRemoveItem(id);
            setCartItems(cartItems.filter((item) => item.id !== id));
          },
          style: "destructive",
        },
      ],
    );
  };

  const calculateSubtotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const subtotal = calculateSubtotal();
  const tax = subtotal * 0.08; // Assuming 8% tax rate
  const total = subtotal + tax;

  return (
    <View className="bg-white p-4 rounded-lg shadow-md w-full">
      <View className="flex-row items-center mb-4">
        <CartIcon size={24} color="#4B5563" />
        <Text className="text-lg font-bold ml-2 text-gray-800">
          Shopping Cart
        </Text>
        <Text className="ml-auto text-gray-500">{cartItems.length} items</Text>
      </View>

      {cartItems.length === 0 ? (
        <View className="py-8 items-center justify-center">
          <Text className="text-gray-500 text-center">Your cart is empty</Text>
        </View>
      ) : (
        <>
          <ScrollView className="max-h-40 mb-4">
            {cartItems.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center py-2 border-b border-gray-200"
              >
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">{item.name}</Text>
                  <Text className="text-xs text-gray-500">SKU: {item.sku}</Text>
                </View>

                <View className="flex-row items-center mr-4">
                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.id, -1)}
                    className="p-1 bg-gray-100 rounded-full"
                  >
                    <Minus size={16} color="#4B5563" />
                  </TouchableOpacity>

                  <Text className="mx-2 min-w-8 text-center">
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item.id, 1)}
                    className="p-1 bg-gray-100 rounded-full"
                  >
                    <Plus size={16} color="#4B5563" />
                  </TouchableOpacity>
                </View>

                <Text className="w-20 text-right font-medium">
                  ${(item.price * item.quantity).toFixed(2)}
                </Text>

                <TouchableOpacity
                  onPress={() => handleRemoveItem(item.id)}
                  className="ml-2 p-1"
                >
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <View className="border-t border-gray-200 pt-2">
            <View className="flex-row justify-between py-1">
              <Text className="text-gray-600">Subtotal</Text>
              <Text className="font-medium">${subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between py-1">
              <Text className="text-gray-600">Tax (8%)</Text>
              <Text className="font-medium">${tax.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between py-2 border-t border-gray-200 mt-1">
              <Text className="font-bold text-gray-800">Total</Text>
              <Text className="font-bold text-gray-800">
                ${total.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onCheckout}
            className="mt-4 bg-blue-600 py-3 rounded-lg items-center"
          >
            <Text className="text-white font-bold">Proceed to Checkout</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export default ShoppingCart;

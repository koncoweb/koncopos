import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Search, ShoppingBag, ArrowLeft, Barcode } from "lucide-react-native";
import ShoppingCart from "./ShoppingCart";
import PaymentProcessor from "./PaymentProcessor";

type Product = {
  id: string;
  name: string;
  price: number;
  sku: string;
  stock: number;
  category: string;
  image?: string;
};

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
};

interface POSInterfaceProps {
  onBack?: () => void;
}

const POSInterface = ({ onBack = () => {} }: POSInterfaceProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  // Mock product data
  const products: Product[] = [
    {
      id: "1",
      name: "T-Shirt (Black)",
      price: 19.99,
      sku: "TS-BLK-001",
      stock: 25,
      category: "Clothing",
    },
    {
      id: "2",
      name: "Jeans (Blue)",
      price: 49.99,
      sku: "JN-BLU-002",
      stock: 15,
      category: "Clothing",
    },
    {
      id: "3",
      name: "Sneakers",
      price: 79.99,
      sku: "SN-WHT-003",
      stock: 10,
      category: "Footwear",
    },
    {
      id: "4",
      name: "Baseball Cap",
      price: 24.99,
      sku: "CAP-BLK-004",
      stock: 30,
      category: "Accessories",
    },
    {
      id: "5",
      name: "Sunglasses",
      price: 15.99,
      sku: "SG-BRN-005",
      stock: 20,
      category: "Accessories",
    },
    {
      id: "6",
      name: "Backpack",
      price: 39.99,
      sku: "BP-GRY-006",
      stock: 12,
      category: "Accessories",
    },
    {
      id: "7",
      name: "Running Shoes",
      price: 89.99,
      sku: "RS-RED-007",
      stock: 8,
      category: "Footwear",
    },
    {
      id: "8",
      name: "Hoodie",
      price: 34.99,
      sku: "HD-NVY-008",
      stock: 18,
      category: "Clothing",
    },
  ];

  const categories = ["All", "Clothing", "Footwear", "Accessories"];

  const filteredProducts = products.filter(
    (product) =>
      (activeCategory === "All" || product.category === activeCategory) &&
      (searchQuery === "" ||
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  const addToCart = (product: Product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);

      if (existingItem) {
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      } else {
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            sku: product.sku,
          },
        ];
      }
    });
  };

  const updateCartItemQuantity = (id: string, newQuantity: number) => {
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, quantity: newQuantity } : item,
      ),
    );
  };

  const removeCartItem = (id: string) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== id));
  };

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      setShowPayment(true);
    }
  };

  const handlePaymentComplete = (
    paymentMethod: string,
    transactionId: string,
  ) => {
    // In a real app, you would process the transaction and update inventory
    console.log(
      `Payment completed with ${paymentMethod}, transaction ID: ${transactionId}`,
    );

    // Reset cart and return to product selection
    setTimeout(() => {
      setCartItems([]);
      setShowPayment(false);
    }, 3000);
  };

  const calculateCartTotal = () => {
    return cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  if (showPayment) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <PaymentProcessor
          cartTotal={calculateCartTotal()}
          onPaymentComplete={handlePaymentComplete}
          onCancel={() => setShowPayment(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 p-4">
        {/* Header */}
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={onBack} className="mr-3">
            <ArrowLeft size={24} color="#4B5563" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">Point of Sale</Text>
        </View>

        {/* Search and Scan */}
        <View className="flex-row mb-4">
          <View className="flex-1 flex-row items-center bg-white rounded-lg px-3 mr-2 border border-gray-200">
            <Search size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 py-2 px-2"
              placeholder="Search products by name or SKU"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity className="bg-blue-600 p-3 rounded-lg">
            <Barcode size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => setActiveCategory(category)}
              className={`mr-2 px-4 py-2 rounded-full ${activeCategory === category ? "bg-blue-600" : "bg-white border border-gray-200"}`}
            >
              <Text
                className={`${activeCategory === category ? "text-white" : "text-gray-700"}`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View className="flex-1 flex-row">
          {/* Product Grid */}
          <ScrollView className="flex-1 mr-4">
            <View className="flex-row flex-wrap">
              {filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  className="w-1/2 p-1"
                  onPress={() => addToCart(product)}
                >
                  <View className="bg-white p-3 rounded-lg border border-gray-200 h-40">
                    <View className="items-center justify-center bg-gray-100 h-20 mb-2 rounded">
                      <ShoppingBag size={24} color="#4B5563" />
                    </View>
                    <Text className="font-medium" numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text className="text-xs text-gray-500 mb-1">
                      SKU: {product.sku}
                    </Text>
                    <View className="flex-row justify-between items-center">
                      <Text className="font-bold">
                        ${product.price.toFixed(2)}
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

          {/* Shopping Cart */}
          <View className="w-2/5">
            <ShoppingCart
              items={cartItems}
              onUpdateQuantity={updateCartItemQuantity}
              onRemoveItem={removeCartItem}
              onCheckout={handleCheckout}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default POSInterface;

import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Share } from "react-native";
import {
  Printer,
  Share2,
  ChevronLeft,
  Clock,
  User,
  CreditCard,
  Package,
} from "lucide-react-native";

interface Product {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sku: string;
}

interface TransactionDetailProps {
  transactionId?: string;
  date?: string;
  time?: string;
  staffMember?: string;
  paymentMethod?: string;
  products?: Product[];
  subtotal?: number;
  tax?: number;
  total?: number;
  onBack?: () => void;
}

const TransactionDetail = ({
  transactionId = "TRX-12345",
  date = "2023-06-15",
  time = "14:30",
  staffMember = "John Doe",
  paymentMethod = "Credit Card",
  products = [
    {
      id: "1",
      name: "Wireless Headphones",
      price: 89.99,
      quantity: 1,
      sku: "SKU-001",
    },
    {
      id: "2",
      name: "Phone Charger",
      price: 19.99,
      quantity: 2,
      sku: "SKU-002",
    },
    {
      id: "3",
      name: "Screen Protector",
      price: 12.99,
      quantity: 3,
      sku: "SKU-003",
    },
    { id: "4", name: "Phone Case", price: 24.99, quantity: 1, sku: "SKU-004" },
  ],
  subtotal = 195.93,
  tax = 15.67,
  total = 211.6,
  onBack = () => {},
}: TransactionDetailProps) => {
  const [isExpanded, setIsExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (productId: string) => {
    setIsExpanded((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Transaction Receipt\nID: ${transactionId}\nDate: ${date} ${time}\nTotal: $${total.toFixed(2)}`,
        title: "Transaction Receipt",
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
    }
  };

  const handlePrint = () => {
    // Placeholder for print functionality
    console.log("Print receipt for transaction:", transactionId);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 p-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={onBack} className="p-2">
          <ChevronLeft size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">
          Transaction Details
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView className="flex-1">
        {/* Transaction Info Card */}
        <View className="bg-white m-4 rounded-lg shadow-md p-4">
          <Text className="text-xl font-bold text-blue-800 mb-2">
            Transaction #{transactionId}
          </Text>

          <View className="flex-row items-center mb-2">
            <Clock size={18} color="#4B5563" />
            <Text className="ml-2 text-gray-600">
              {date} at {time}
            </Text>
          </View>

          <View className="flex-row items-center mb-2">
            <User size={18} color="#4B5563" />
            <Text className="ml-2 text-gray-600">Staff: {staffMember}</Text>
          </View>

          <View className="flex-row items-center mb-2">
            <CreditCard size={18} color="#4B5563" />
            <Text className="ml-2 text-gray-600">Payment: {paymentMethod}</Text>
          </View>
        </View>

        {/* Products List */}
        <View className="bg-white m-4 rounded-lg shadow-md p-4">
          <Text className="text-lg font-bold text-blue-800 mb-4">Products</Text>

          {products.map((product) => (
            <TouchableOpacity
              key={product.id}
              onPress={() => toggleExpand(product.id)}
              className={`border-b border-gray-200 py-3 ${isExpanded[product.id] ? "bg-gray-50" : ""}`}
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="font-medium text-gray-800">
                    {product.name}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {product.quantity} × ${product.price.toFixed(2)}
                  </Text>
                </View>
                <Text className="font-bold text-gray-800">
                  ${(product.price * product.quantity).toFixed(2)}
                </Text>
              </View>

              {isExpanded[product.id] && (
                <View className="mt-2 bg-gray-100 p-2 rounded">
                  <View className="flex-row items-center">
                    <Package size={16} color="#4B5563" />
                    <Text className="ml-2 text-gray-600">
                      SKU: {product.sku}
                    </Text>
                  </View>
                  <Text className="text-gray-600 mt-1">
                    Unit Price: ${product.price.toFixed(2)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary */}
        <View className="bg-white m-4 rounded-lg shadow-md p-4">
          <Text className="text-lg font-bold text-blue-800 mb-4">Summary</Text>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Subtotal</Text>
            <Text className="text-gray-800">${subtotal.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600">Tax</Text>
            <Text className="text-gray-800">${tax.toFixed(2)}</Text>
          </View>

          <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-200">
            <Text className="text-gray-800 font-bold">Total</Text>
            <Text className="text-blue-600 font-bold text-lg">
              ${total.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row justify-center m-4 mb-8">
          <TouchableOpacity
            onPress={handlePrint}
            className="bg-blue-600 rounded-full py-3 px-6 flex-row items-center mr-4"
          >
            <Printer size={20} color="white" />
            <Text className="text-white font-medium ml-2">Print Receipt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            className="bg-gray-200 rounded-full py-3 px-6 flex-row items-center"
          >
            <Share2 size={20} color="#4B5563" />
            <Text className="text-gray-800 font-medium ml-2">Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default TransactionDetail;

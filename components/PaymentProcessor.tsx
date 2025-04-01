import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert } from "react-native";
import { Check, CreditCard, DollarSign, Wallet, X } from "lucide-react-native";

interface PaymentProcessorProps {
  cartTotal?: number;
  onPaymentComplete?: (paymentMethod: string, transactionId: string) => void;
  onCancel?: () => void;
}

const PaymentProcessor = ({
  cartTotal = 125.99,
  onPaymentComplete = () => {},
  onCancel = () => {},
}: PaymentProcessorProps) => {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentComplete, setPaymentComplete] = useState<boolean>(false);

  const paymentMethods = [
    {
      id: "credit",
      name: "Credit Card",
      icon: <CreditCard size={24} color="#4F46E5" />,
    },
    {
      id: "cash",
      name: "Cash",
      icon: <DollarSign size={24} color="#4F46E5" />,
    },
    {
      id: "wallet",
      name: "Digital Wallet",
      icon: <Wallet size={24} color="#4F46E5" />,
    },
  ];

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
  };

  const processPayment = () => {
    if (!selectedMethod) {
      Alert.alert("Error", "Please select a payment method");
      return;
    }

    setProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentComplete(true);

      // Generate a mock transaction ID
      const transactionId = `TRX-${Math.floor(Math.random() * 1000000)}`;

      // Notify parent component of successful payment
      onPaymentComplete(selectedMethod, transactionId);
    }, 2000);
  };

  if (paymentComplete) {
    return (
      <View className="bg-white p-4 rounded-lg shadow-md h-full">
        <View className="items-center justify-center py-8">
          <View className="bg-green-100 p-4 rounded-full mb-4">
            <Check size={48} color="#22C55E" />
          </View>
          <Text className="text-2xl font-bold text-green-600 mb-2">
            Payment Successful!
          </Text>
          <Text className="text-gray-600 text-center mb-6">
            Your transaction has been completed successfully.
          </Text>

          <View className="bg-gray-50 w-full p-4 rounded-lg mb-6">
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Amount Paid:</Text>
              <Text className="font-bold">${cartTotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between mb-2">
              <Text className="text-gray-600">Payment Method:</Text>
              <Text className="font-bold">
                {paymentMethods.find((m) => m.id === selectedMethod)?.name ||
                  "Unknown"}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600">Transaction ID:</Text>
              <Text className="font-bold text-xs">
                TRX-{Math.floor(Math.random() * 1000000)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-blue-600 py-3 px-6 rounded-lg w-full"
            onPress={() => onCancel()}
          >
            <Text className="text-white font-bold text-center">
              Return to Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="bg-white p-4 rounded-lg shadow-md h-full">
      <View className="flex-row justify-between items-center mb-6">
        <Text className="text-xl font-bold">Payment</Text>
        <TouchableOpacity onPress={onCancel}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View className="mb-6">
        <Text className="text-gray-600 mb-2">Order Summary</Text>
        <View className="bg-gray-50 p-4 rounded-lg">
          <View className="flex-row justify-between mb-2">
            <Text>Subtotal</Text>
            <Text>${(cartTotal * 0.9).toFixed(2)}</Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text>Tax</Text>
            <Text>${(cartTotal * 0.1).toFixed(2)}</Text>
          </View>
          <View className="h-px bg-gray-300 my-2" />
          <View className="flex-row justify-between">
            <Text className="font-bold">Total</Text>
            <Text className="font-bold">${cartTotal.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View className="mb-6">
        <Text className="text-gray-600 mb-2">Select Payment Method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {paymentMethods.map((method) => (
            <TouchableOpacity
              key={method.id}
              className={`mr-3 p-4 rounded-lg border ${selectedMethod === method.id ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
              style={{ minWidth: 100 }}
              onPress={() => handlePaymentMethodSelect(method.id)}
            >
              <View className="items-center">
                {method.icon}
                <Text className="mt-2 text-center">{method.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {selectedMethod === "credit" && (
        <View className="mb-6">
          <Text className="text-gray-600 mb-2">Card Information</Text>
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="text-center text-gray-500">
              Card details would be collected here in a real implementation
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        className={`py-3 rounded-lg ${processingPayment ? "bg-gray-400" : "bg-blue-600"}`}
        onPress={processPayment}
        disabled={processingPayment || !selectedMethod}
      >
        <Text className="text-white font-bold text-center">
          {processingPayment ? "Processing..." : `Pay $${cartTotal.toFixed(2)}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PaymentProcessor;

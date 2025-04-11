import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import {
  Check,
  CreditCard,
  DollarSign,
  Wallet,
  X,
  Printer,
} from "lucide-react-native";
import { storeData, getData, STORAGE_KEYS } from "../services/storage";

interface PaymentProcessorProps {
  cartTotal?: number;
  cartItems?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    sku: string;
  }>;
  onPaymentComplete?: (paymentMethod: string, transactionId: string) => void;
  onCancel?: () => void;
}

const PaymentProcessor = ({
  cartTotal = 125.99,
  cartItems = [],
  onPaymentComplete = () => {},
  onCancel = () => {},
}: PaymentProcessorProps) => {
  // Function to store transaction data
  const storeTransactionData = async (transactionData: any) => {
    try {
      // Get existing transactions
      const existingTransactions = await getData(STORAGE_KEYS.TRANSACTIONS, []);

      // Add new transaction
      const updatedTransactions = [...existingTransactions, transactionData];

      // Store updated transactions
      await storeData(STORAGE_KEYS.TRANSACTIONS, updatedTransactions);
      console.log("Transaction stored successfully:", transactionData.id);

      // Update inventory stock levels
      await updateInventoryStock(transactionData.items);
    } catch (error) {
      console.error("Error storing transaction:", error);
    }
  };

  // Function to update inventory stock levels
  const updateInventoryStock = async (soldItems: any[]) => {
    try {
      // Get current products from storage
      const products = await getData(STORAGE_KEYS.PRODUCTS, []);

      if (!products || products.length === 0) {
        console.error("No products found in inventory");
        return;
      }

      // Update stock levels for each sold item
      let hasChanges = false;

      const updatedProducts = products.map((product: any) => {
        const soldItem = soldItems.find((item) => item.id === product.id);

        if (soldItem) {
          hasChanges = true;
          const newStock = Math.max(
            0,
            product.currentStock - soldItem.quantity,
          );
          console.log(
            `Updating stock for ${product.name} from ${product.currentStock} to ${newStock}`,
          );
          return { ...product, currentStock: newStock };
        }

        return product;
      });

      if (hasChanges) {
        // Save updated products back to storage
        await storeData(STORAGE_KEYS.PRODUCTS, updatedProducts);
        console.log("Inventory stock levels updated successfully");
      }
    } catch (error) {
      console.error("Error updating inventory stock levels:", error);
    }
  };

  // Function to simulate printing receipt
  const printReceipt = () => {
    setIsPrinting(true);

    // Simulate printing process
    setTimeout(() => {
      console.log("===== RECEIPT =====");
      console.log(`Transaction ID: ${transactionId}`);
      console.log(`Date: ${new Date().toLocaleString()}`);
      console.log(`Amount: ${cartTotal.toFixed(2)}`);
      console.log(
        `Payment Method: ${paymentMethods.find((m) => m.id === selectedMethod)?.name || "Unknown"}`,
      );
      if (selectedMethod === "cash") {
        console.log(
          `Amount Received: ${parseFloat(amountReceived).toFixed(2)}`,
        );
        console.log(
          `Change: ${(parseFloat(amountReceived) - cartTotal).toFixed(2)}`,
        );
      }
      console.log("==================");

      setIsPrinting(false);
      Alert.alert("Success", "Receipt printed successfully!");
    }, 2000);
  };
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentComplete, setPaymentComplete] = useState<boolean>(false);
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [transactionId, setTransactionId] = useState<string>("");
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

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

    // For cash payments, validate the amount received
    if (selectedMethod === "cash") {
      const receivedAmount = parseFloat(amountReceived);
      if (isNaN(receivedAmount) || receivedAmount < cartTotal) {
        Alert.alert(
          "Error",
          "Please enter a valid amount that covers the total",
        );
        return;
      }
    }

    setProcessingPayment(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessingPayment(false);
      setPaymentComplete(true);

      // Generate a mock transaction ID
      const newTransactionId = `TRX-${Math.floor(Math.random() * 1000000)}`;
      setTransactionId(newTransactionId);

      // Create transaction data
      const transactionData = {
        id: newTransactionId,
        date: new Date().toISOString(),
        amount: cartTotal,
        paymentMethod: selectedMethod,
        amountReceived:
          selectedMethod === "cash" ? parseFloat(amountReceived) : cartTotal,
        change:
          selectedMethod === "cash"
            ? parseFloat(amountReceived) - cartTotal
            : 0,
        items: cartItems, // Include the actual cart items
      };

      // Store transaction in local storage
      storeTransactionData(transactionData);

      // Notify parent component of successful payment
      onPaymentComplete(selectedMethod, newTransactionId);
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
              <Text className="font-bold">
                Rp{" "}
                {cartTotal.toLocaleString("id-ID", {
                  maximumFractionDigits: 0,
                })}
              </Text>
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
              <Text className="font-bold text-xs">{transactionId}</Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-green-600 py-3 px-6 rounded-lg w-full mb-4"
            onPress={printReceipt}
            disabled={isPrinting}
          >
            <View className="flex-row justify-center items-center">
              <Printer size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text className="text-white font-bold text-center">
                {isPrinting ? "Printing..." : "Print Receipt"}
              </Text>
            </View>
          </TouchableOpacity>

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
            <Text>
              Rp{" "}
              {(cartTotal * 0.9).toLocaleString("id-ID", {
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
          <View className="flex-row justify-between mb-2">
            <Text>Tax</Text>
            <Text>
              Rp{" "}
              {(cartTotal * 0.1).toLocaleString("id-ID", {
                maximumFractionDigits: 0,
              })}
            </Text>
          </View>
          <View className="h-px bg-gray-300 my-2" />
          <View className="flex-row justify-between">
            <Text className="font-bold">Total</Text>
            <Text className="font-bold">
              Rp{" "}
              {cartTotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </Text>
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

      {selectedMethod === "cash" && (
        <View className="mb-6">
          <Text className="text-gray-600 mb-2">Cash Payment</Text>
          <View className="bg-gray-50 p-4 rounded-lg">
            <Text className="mb-2">
              Amount Due: Rp{" "}
              {cartTotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
            </Text>

            <Text className="mb-2">Amount Received:</Text>
            <TextInput
              className="bg-white border border-gray-300 rounded-lg p-3 mb-3"
              keyboardType="numeric"
              placeholder="Enter amount"
              value={amountReceived}
              onChangeText={setAmountReceived}
            />

            <Text className="mb-2">Quick Amounts:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-3"
            >
              <View className="flex-row">
                {[2000, 5000, 10000, 20000, 50000, 100000].map((amount) => (
                  <TouchableOpacity
                    key={amount}
                    className="mr-2 bg-blue-100 px-3 py-2 rounded-lg"
                    onPress={() => setAmountReceived(amount.toString())}
                  >
                    <Text className="text-blue-800">
                      {amount.toLocaleString()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {parseFloat(amountReceived) >= cartTotal && (
              <View className="bg-green-100 p-3 rounded-lg">
                <Text className="text-green-800 font-medium">
                  Change: Rp{" "}
                  {(parseFloat(amountReceived) - cartTotal).toLocaleString(
                    "id-ID",
                    { maximumFractionDigits: 0 },
                  )}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      <TouchableOpacity
        className={`py-3 rounded-lg ${processingPayment ? "bg-gray-400" : "bg-blue-600"}`}
        onPress={processPayment}
        disabled={processingPayment || !selectedMethod}
      >
        <Text className="text-white font-bold text-center">
          {processingPayment
            ? "Processing..."
            : `Pay Rp ${cartTotal.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PaymentProcessor;

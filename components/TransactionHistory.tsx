import React, { useState, useEffect } from "react";
import { View, Text, SafeAreaView, TextInput } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import TransactionList from "./TransactionList";
import TransactionDetail from "./TransactionDetail";
import { storeData, getData, STORAGE_KEYS } from "../services/storage";

export interface Transaction {
  id: string;
  date: string;
  time: string;
  amount: number;
  staffMember: string;
  status: "completed" | "refunded" | "pending";
}

interface TransactionHistoryProps {
  onBack?: () => void;
}

// Empty initial transactions array - data will be loaded from storage
const initialTransactions: Transaction[] = [];

const TransactionHistory = ({ onBack = () => {} }: TransactionHistoryProps) => {
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Load transactions from storage on component mount
  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const storedTransactions = await getData<Transaction[]>(
          STORAGE_KEYS.TRANSACTIONS,
          initialTransactions,
        );
        setTransactions(storedTransactions);
      } catch (error) {
        console.error("Error loading transactions:", error);
        setTransactions(initialTransactions);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Save transactions to storage whenever they change
  useEffect(() => {
    if (!isLoading) {
      storeData(STORAGE_KEYS.TRANSACTIONS, transactions);
    }
  }, [transactions, isLoading]);

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
  };

  const handleBackToList = () => {
    setSelectedTransaction(null);
  };

  // Mock loading state for demonstration
  const simulateLoading = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="bg-blue-600 p-4 flex-row items-center">
        <View className="flex-row items-center">
          <ArrowLeft size={24} color="white" onPress={onBack} />
          <Text className="text-white text-xl font-bold ml-4">
            Transaction History
          </Text>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        {selectedTransaction ? (
          <TransactionDetail
            transaction={selectedTransaction}
            onBack={handleBackToList}
            // Other props would be populated from API in a real app
            paymentMethod="Credit Card"
            subtotal={195.93}
            tax={15.67}
            total={211.6}
          />
        ) : (
          <TransactionList
            transactions={transactions}
            onTransactionPress={handleTransactionPress}
            isLoading={isLoading}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

export default TransactionHistory;

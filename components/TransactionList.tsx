import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Search, Calendar, User, ChevronRight } from "lucide-react-native";

interface Transaction {
  id: string;
  date: string;
  time: string;
  amount: number;
  staffMember: string;
  status: "completed" | "refunded" | "pending";
}

interface TransactionListProps {
  transactions?: Transaction[];
  onTransactionPress?: (transaction: Transaction) => void;
  isLoading?: boolean;
}

const TransactionList = ({
  transactions = [
    {
      id: "TX-1001",
      date: "2023-06-15",
      time: "14:30",
      amount: 124.99,
      staffMember: "John Doe",
      status: "completed",
    },
    {
      id: "TX-1002",
      date: "2023-06-15",
      time: "15:45",
      amount: 67.5,
      staffMember: "Jane Smith",
      status: "completed",
    },
    {
      id: "TX-1003",
      date: "2023-06-14",
      time: "10:15",
      amount: 89.99,
      staffMember: "John Doe",
      status: "refunded",
    },
    {
      id: "TX-1004",
      date: "2023-06-14",
      time: "16:20",
      amount: 45.75,
      staffMember: "Mike Johnson",
      status: "completed",
    },
    {
      id: "TX-1005",
      date: "2023-06-13",
      time: "11:05",
      amount: 199.99,
      staffMember: "Jane Smith",
      status: "pending",
    },
  ],
  onTransactionPress = () => {},
  isLoading = false,
}: TransactionListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVisible, setFilterVisible] = useState(false);

  // Filter transactions based on search query
  const filteredTransactions = transactions.filter(
    (transaction) =>
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.staffMember.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const getStatusColor = (status: Transaction["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "refunded":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      className="bg-white p-4 mb-2 rounded-lg border border-gray-200"
      onPress={() => onTransactionPress(item)}
    >
      <View className="flex-row justify-between items-center">
        <View>
          <Text className="text-lg font-semibold">{item.id}</Text>
          <Text className="text-gray-600">
            {item.date} • {item.time}
          </Text>
          <View className="flex-row items-center mt-1">
            <User size={14} color="#6b7280" />
            <Text className="text-gray-600 ml-1">{item.staffMember}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className="text-lg font-bold">${item.amount.toFixed(2)}</Text>
          <View
            className={`rounded-full px-2 py-1 mt-1 ${getStatusColor(item.status)}`}
          >
            <Text className="text-xs font-medium capitalize">
              {item.status}
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View className="mb-4">
      <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-4">
        <Search size={20} color="#6b7280" />
        <TextInput
          className="flex-1 ml-2 text-base"
          placeholder="Search by ID or staff member"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View className="flex-row justify-between mb-2">
        <TouchableOpacity
          className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <Calendar size={18} color="#6b7280" />
          <Text className="ml-2 text-gray-700">Filter by date</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2"
          onPress={() => setFilterVisible(!filterVisible)}
        >
          <User size={18} color="#6b7280" />
          <Text className="ml-2 text-gray-700">Filter by staff</Text>
        </TouchableOpacity>
      </View>

      {/* Filter options would be shown here when filterVisible is true */}
      {filterVisible && (
        <View className="bg-white p-3 rounded-lg border border-gray-200 mb-3">
          <Text className="text-gray-700 mb-2">
            Filter options would appear here
          </Text>
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#0891b2" />
        <Text className="mt-2 text-gray-600">Loading transactions...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <FlatList
        data={filteredTransactions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-10">
            <Text className="text-gray-500 text-lg">No transactions found</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default TransactionList;

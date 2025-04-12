import { View } from "react-native";
import TransactionHistory from "../components/TransactionHistory";
import { useRouter } from "expo-router";

export default function TransactionsPage() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <TransactionHistory onBack={() => router.replace("/")} />
    </View>
  );
}

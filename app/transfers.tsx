import { View } from "react-native";
import TransferManagement from "../components/TransferManagement";
import { useRouter } from "expo-router";

export default function TransfersPage() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <TransferManagement onClose={() => router.replace("/")} />
    </View>
  );
}

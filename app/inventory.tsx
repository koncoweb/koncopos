import { View } from "react-native";
import InventoryManagement from "../components/InventoryManagement";
import { useRouter } from "expo-router";

export default function InventoryPage() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-gray-50">
      <InventoryManagement onBack={() => router.replace("/")} />
    </View>
  );
}
